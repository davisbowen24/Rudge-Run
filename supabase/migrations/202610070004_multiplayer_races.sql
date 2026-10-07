begin;

alter table ridge_private.multiplayer_rooms
  add column if not exists selected_map text,
  add column if not exists vote_ends_at timestamptz,
  add column if not exists race_start_at timestamptz,
  add column if not exists race_number integer not null default 0;

alter table ridge_private.multiplayer_rooms
  drop constraint if exists multiplayer_rooms_selected_map_check;
alter table ridge_private.multiplayer_rooms
  add constraint multiplayer_rooms_selected_map_check check (
    selected_map is null or selected_map = any(array[
      'countryside','highway','desert','bootcamp','seasons','construction','arctic','jungle','cave',
      'volcano','rooftops','wasteland','mars','haunted','moon','underwater','neon','alien'
    ]::text[])
  );

alter table ridge_private.multiplayer_members
  add column if not exists vote_map_id text,
  add column if not exists race_active boolean not null default false,
  add column if not exists race_status text not null default 'waiting',
  add column if not exists race_distance double precision not null default 0,
  add column if not exists final_distance double precision;

alter table ridge_private.multiplayer_members
  drop constraint if exists multiplayer_members_vote_map_check;
alter table ridge_private.multiplayer_members
  add constraint multiplayer_members_vote_map_check check (
    vote_map_id is null or vote_map_id = any(array[
      'countryside','highway','desert','bootcamp','seasons','construction','arctic','jungle','cave',
      'volcano','rooftops','wasteland','mars','haunted','moon','underwater','neon','alien'
    ]::text[])
  );
alter table ridge_private.multiplayer_members
  drop constraint if exists multiplayer_members_race_status_check;
alter table ridge_private.multiplayer_members
  add constraint multiplayer_members_race_status_check check (race_status in ('waiting','racing','dead','finished'));
alter table ridge_private.multiplayer_members
  drop constraint if exists multiplayer_members_race_distance_check;
alter table ridge_private.multiplayer_members
  add constraint multiplayer_members_race_distance_check check (race_distance >= 0 and race_distance <= 10000000);
alter table ridge_private.multiplayer_members
  drop constraint if exists multiplayer_members_final_distance_check;
alter table ridge_private.multiplayer_members
  add constraint multiplayer_members_final_distance_check check (final_distance is null or (final_distance >= 0 and final_distance <= 10000000));

create or replace function public.ridge_mp_map_valid(p_map_id text) returns boolean
language sql immutable security definer set search_path='' as $$
  select p_map_id = any(array[
    'countryside','highway','desert','bootcamp','seasons','construction','arctic','jungle','cave',
    'volcano','rooftops','wasteland','mars','haunted','moon','underwater','neon','alien'
  ]::text[]);
$$;

create or replace function public.ridge_mp_snapshot(p_room_id uuid,p_self_id uuid) returns jsonb
language sql security definer set search_path='' as $$
  select jsonb_build_object(
    'id',r.id,
    'code',r.code,
    'status',r.status,
    'hostMemberId',r.host_member_id,
    'revision',r.revision,
    'selfMemberId',p_self_id,
    'serverTime',now(),
    'selectedMap',r.selected_map,
    'voteEndsAt',r.vote_ends_at,
    'raceStartAt',r.race_start_at,
    'raceNumber',r.race_number,
    'members',coalesce((select jsonb_agg(jsonb_build_object(
      'id',m.id,
      'displayName',m.display_name,
      'vehicleId',m.vehicle_id,
      'ready',m.ready,
      'isHost',m.id=r.host_member_id,
      'connected',m.last_seen>now()-interval '8 seconds',
      'joinedAt',m.joined_at,
      'voteMapId',m.vote_map_id,
      'raceActive',m.race_active,
      'raceStatus',m.race_status,
      'distance',m.race_distance,
      'finalDistance',m.final_distance
    ) order by m.joined_at) from ridge_private.multiplayer_members m where m.room_id=r.id),'[]'::jsonb)
  ) from ridge_private.multiplayer_rooms r where r.id=p_room_id;
$$;

create or replace function public.ridge_mp_advance_room(p_room_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare
  current_status text;
  vote_deadline timestamptz;
  start_at timestamptz;
  winner text;
begin
  select status,vote_ends_at,race_start_at into current_status,vote_deadline,start_at
  from ridge_private.multiplayer_rooms where id=p_room_id for update;
  if current_status is null then return; end if;

  if current_status='voting' and vote_deadline is not null and vote_deadline<=now() then
    select m.vote_map_id into winner
    from ridge_private.multiplayer_members m
    where m.room_id=p_room_id and m.race_active and m.vote_map_id is not null
    group by m.vote_map_id
    order by count(*) desc,random()
    limit 1;

    if winner is null then
      select map_id into winner
      from unnest(array[
        'countryside','highway','desert','bootcamp','seasons','construction','arctic','jungle','cave',
        'volcano','rooftops','wasteland','mars','haunted','moon','underwater','neon','alien'
      ]::text[]) as map_id
      order by random()
      limit 1;
    end if;

    update ridge_private.multiplayer_rooms
    set status='countdown',selected_map=winner,race_start_at=now()+interval '4 seconds',revision=revision+1
    where id=p_room_id;
    current_status='countdown';
    select race_start_at into start_at from ridge_private.multiplayer_rooms where id=p_room_id;
  end if;

  if current_status='countdown' and start_at is not null and start_at<=now() then
    update ridge_private.multiplayer_members
    set race_status=case when race_active then 'racing' else 'waiting' end,
        race_distance=0,
        final_distance=null
    where room_id=p_room_id;

    update ridge_private.multiplayer_rooms
    set status='racing',revision=revision+1
    where id=p_room_id;
    current_status='racing';
  end if;

  if current_status='racing'
     and exists(select 1 from ridge_private.multiplayer_members where room_id=p_room_id and race_active)
     and not exists(
       select 1 from ridge_private.multiplayer_members
       where room_id=p_room_id and race_active and race_status not in ('dead','finished')
     ) then
    update ridge_private.multiplayer_rooms
    set status='results',revision=revision+1
    where id=p_room_id;
  end if;
end $$;

create or replace function public.ridge_mp_repair_room(p_room_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare
  removed integer;
  changed integer;
  next_host uuid;
  current_status text;
begin
  if exists(select 1 from ridge_private.multiplayer_rooms where id=p_room_id and expires_at<=now()) then
    delete from ridge_private.multiplayer_rooms where id=p_room_id;
    return;
  end if;

  select status into current_status from ridge_private.multiplayer_rooms where id=p_room_id;
  if current_status is null then return; end if;

  if current_status in ('lobby','voting','countdown') then
    delete from ridge_private.multiplayer_members
    where room_id=p_room_id and last_seen<now()-interval '30 seconds';
    get diagnostics removed=row_count;
    if removed>0 then
      update ridge_private.multiplayer_rooms set revision=revision+1 where id=p_room_id;
    end if;
  elsif current_status='racing' then
    update ridge_private.multiplayer_members
    set race_status='dead',final_distance=greatest(coalesce(final_distance,0),race_distance)
    where room_id=p_room_id and race_active and race_status='racing' and last_seen<now()-interval '30 seconds';
    get diagnostics changed=row_count;
    if changed>0 then
      update ridge_private.multiplayer_rooms set revision=revision+1 where id=p_room_id;
    end if;
  end if;

  if not exists(select 1 from ridge_private.multiplayer_members where room_id=p_room_id) then
    delete from ridge_private.multiplayer_rooms where id=p_room_id;
    return;
  end if;

  if not exists(
    select 1 from ridge_private.multiplayer_rooms r
    join ridge_private.multiplayer_members m on m.id=r.host_member_id and m.room_id=r.id
    where r.id=p_room_id
  ) then
    select id into next_host
    from ridge_private.multiplayer_members
    where room_id=p_room_id
    order by joined_at,id
    limit 1;
    update ridge_private.multiplayer_rooms
    set host_member_id=next_host,revision=revision+1
    where id=p_room_id;
  end if;

  perform public.ridge_mp_advance_room(p_room_id);
end $$;

create or replace function public.ridge_mp_state(p_member_token_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid; mid uuid;
begin
  select room_id,id into rid,mid
  from ridge_private.multiplayer_members
  where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;

  update ridge_private.multiplayer_members set last_seen=now() where id=mid;
  perform public.ridge_mp_repair_room(rid);

  select room_id,id into rid,mid
  from ridge_private.multiplayer_members
  where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;

  perform public.ridge_mp_advance_room(rid);
  update ridge_private.multiplayer_rooms set expires_at=now()+interval '2 hours' where id=rid;
  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $$;

create or replace function public.ridge_mp_vehicle(p_member_token_hash text,p_vehicle_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid; mid uuid; aid uuid; room_status text;
begin
  select room_id,id,account_id into rid,mid,aid
  from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;

  update ridge_private.multiplayer_members set last_seen=now() where id=mid;
  perform public.ridge_mp_repair_room(rid);
  select r.status into room_status from ridge_private.multiplayer_rooms r where r.id=rid;
  if room_status<>'lobby' then return jsonb_build_object('error','invalid_state'); end if;
  if not public.ridge_mp_vehicle_owned(aid,p_vehicle_id) then return jsonb_build_object('error','vehicle_not_owned'); end if;

  update ridge_private.multiplayer_members
  set vehicle_id=p_vehicle_id,ready=false,last_seen=now()
  where id=mid;
  update ridge_private.multiplayer_rooms
  set revision=revision+1,expires_at=now()+interval '2 hours'
  where id=rid;
  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $$;

create or replace function public.ridge_mp_ready(p_member_token_hash text,p_ready boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid; mid uuid; room_status text;
begin
  select room_id,id into rid,mid
  from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;

  update ridge_private.multiplayer_members set last_seen=now() where id=mid;
  perform public.ridge_mp_repair_room(rid);
  select status into room_status from ridge_private.multiplayer_rooms where id=rid;
  if room_status<>'lobby' then return jsonb_build_object('error','invalid_state'); end if;

  update ridge_private.multiplayer_members set ready=p_ready,last_seen=now() where id=mid;
  update ridge_private.multiplayer_rooms
  set revision=revision+1,expires_at=now()+interval '2 hours'
  where id=rid;
  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $$;

create or replace function public.ridge_mp_start(p_member_token_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  rid uuid;
  mid uuid;
  host_id uuid;
  room_status text;
  connected_count integer;
  unready_count integer;
begin
  select room_id,id into rid,mid
  from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;

  update ridge_private.multiplayer_members set last_seen=now() where id=mid;
  perform public.ridge_mp_repair_room(rid);

  select status,host_member_id into room_status,host_id
  from ridge_private.multiplayer_rooms where id=rid for update;
  if room_status is null then return jsonb_build_object('error','room_not_found'); end if;
  if host_id<>mid then return jsonb_build_object('error','host_only'); end if;
  if room_status<>'lobby' then return jsonb_build_object('error','invalid_state'); end if;

  select count(*)::int,count(*) filter(where not ready)::int into connected_count,unready_count
  from ridge_private.multiplayer_members
  where room_id=rid and last_seen>now()-interval '8 seconds';

  if connected_count<1 or unready_count>0 then return jsonb_build_object('error','not_ready'); end if;

  update ridge_private.multiplayer_members
  set race_active=(last_seen>now()-interval '8 seconds'),
      race_status='waiting',
      race_distance=0,
      final_distance=null,
      vote_map_id=null
  where room_id=rid;

  update ridge_private.multiplayer_rooms
  set status='voting',
      selected_map=null,
      vote_ends_at=now()+interval '12 seconds',
      race_start_at=null,
      race_number=race_number+1,
      revision=revision+1,
      expires_at=now()+interval '2 hours'
  where id=rid;

  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $$;

create or replace function public.ridge_mp_vote(p_member_token_hash text,p_map_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid; mid uuid; room_status text; active boolean;
begin
  if not public.ridge_mp_map_valid(p_map_id) then return jsonb_build_object('error','invalid_map'); end if;

  select room_id,id,race_active into rid,mid,active
  from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;

  update ridge_private.multiplayer_members set last_seen=now() where id=mid;
  perform public.ridge_mp_repair_room(rid);
  perform public.ridge_mp_advance_room(rid);
  select status into room_status from ridge_private.multiplayer_rooms where id=rid;
  if room_status<>'voting' then return jsonb_build_object('error','invalid_state'); end if;
  if not active then return jsonb_build_object('error','not_participant'); end if;

  update ridge_private.multiplayer_members set vote_map_id=p_map_id where id=mid;
  update ridge_private.multiplayer_rooms
  set revision=revision+1,expires_at=now()+interval '2 hours'
  where id=rid;

  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $$;

create or replace function public.ridge_mp_progress(p_member_token_hash text,p_distance double precision) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid; mid uuid; room_status text; active boolean; member_status text;
begin
  if p_distance is null or p_distance<0 or p_distance>10000000 then
    return jsonb_build_object('error','invalid_distance');
  end if;

  select room_id,id,race_active,race_status into rid,mid,active,member_status
  from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;

  update ridge_private.multiplayer_members set last_seen=now() where id=mid;
  perform public.ridge_mp_repair_room(rid);
  perform public.ridge_mp_advance_room(rid);

  select status into room_status from ridge_private.multiplayer_rooms where id=rid;
  select race_active,race_status into active,member_status
  from ridge_private.multiplayer_members where id=mid;

  if room_status<>'racing' then return jsonb_build_object('error','invalid_state'); end if;
  if not active then return jsonb_build_object('error','not_participant'); end if;
  if member_status<>'racing' then return jsonb_build_object('error','race_finished'); end if;

  update ridge_private.multiplayer_members
  set race_distance=greatest(race_distance,p_distance),last_seen=now()
  where id=mid;
  update ridge_private.multiplayer_rooms
  set revision=revision+1,expires_at=now()+interval '2 hours'
  where id=rid;

  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $$;

create or replace function public.ridge_mp_finish(p_member_token_hash text,p_distance double precision,p_status text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid; mid uuid; room_status text; active boolean; member_status text;
begin
  if p_distance is null or p_distance<0 or p_distance>10000000 then
    return jsonb_build_object('error','invalid_distance');
  end if;
  if p_status not in ('dead','finished') then return jsonb_build_object('error','invalid_finish'); end if;

  select room_id,id,race_active,race_status into rid,mid,active,member_status
  from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;

  update ridge_private.multiplayer_members set last_seen=now() where id=mid;
  perform public.ridge_mp_repair_room(rid);
  perform public.ridge_mp_advance_room(rid);
  select status into room_status from ridge_private.multiplayer_rooms where id=rid;

  if room_status='results' then
    return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
  end if;
  if room_status<>'racing' then return jsonb_build_object('error','invalid_state'); end if;

  select race_active,race_status into active,member_status
  from ridge_private.multiplayer_members where id=mid;
  if not active then return jsonb_build_object('error','not_participant'); end if;

  if member_status='racing' then
    update ridge_private.multiplayer_members
    set race_distance=greatest(race_distance,p_distance),
        final_distance=greatest(race_distance,p_distance),
        race_status=p_status,
        last_seen=now()
    where id=mid;
    update ridge_private.multiplayer_rooms
    set revision=revision+1,expires_at=now()+interval '2 hours'
    where id=rid;
  end if;

  perform public.ridge_mp_advance_room(rid);
  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $$;

create or replace function public.ridge_mp_leave(p_member_token_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid;
begin
  select room_id into rid from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('ok',true); end if;
  perform 1 from ridge_private.multiplayer_rooms where id=rid for update;
  delete from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  perform public.ridge_mp_repair_room(rid);
  perform public.ridge_mp_advance_room(rid);
  return jsonb_build_object('ok',true);
end $$;

revoke all on function public.ridge_mp_map_valid(text) from public,anon,authenticated;
revoke all on function public.ridge_mp_snapshot(uuid,uuid) from public,anon,authenticated;
revoke all on function public.ridge_mp_advance_room(uuid) from public,anon,authenticated;
revoke all on function public.ridge_mp_repair_room(uuid) from public,anon,authenticated;
revoke all on function public.ridge_mp_state(text) from public,anon,authenticated;
revoke all on function public.ridge_mp_vehicle(text,text) from public,anon,authenticated;
revoke all on function public.ridge_mp_ready(text,boolean) from public,anon,authenticated;
revoke all on function public.ridge_mp_start(text) from public,anon,authenticated;
revoke all on function public.ridge_mp_vote(text,text) from public,anon,authenticated;
revoke all on function public.ridge_mp_progress(text,double precision) from public,anon,authenticated;
revoke all on function public.ridge_mp_finish(text,double precision,text) from public,anon,authenticated;
revoke all on function public.ridge_mp_leave(text) from public,anon,authenticated;

grant execute on function public.ridge_mp_map_valid(text) to service_role;
grant execute on function public.ridge_mp_snapshot(uuid,uuid) to service_role;
grant execute on function public.ridge_mp_advance_room(uuid) to service_role;
grant execute on function public.ridge_mp_repair_room(uuid) to service_role;
grant execute on function public.ridge_mp_state(text) to service_role;
grant execute on function public.ridge_mp_vehicle(text,text) to service_role;
grant execute on function public.ridge_mp_ready(text,boolean) to service_role;
grant execute on function public.ridge_mp_start(text) to service_role;
grant execute on function public.ridge_mp_vote(text,text) to service_role;
grant execute on function public.ridge_mp_progress(text,double precision) to service_role;
grant execute on function public.ridge_mp_finish(text,double precision,text) to service_role;
grant execute on function public.ridge_mp_leave(text) to service_role;

commit;

begin;

alter table ridge_private.multiplayer_members
  add column if not exists room_wins integer not null default 0;

alter table ridge_private.multiplayer_members
  drop constraint if exists multiplayer_members_room_wins_check;
alter table ridge_private.multiplayer_members
  add constraint multiplayer_members_room_wins_check check (room_wins >= 0 and room_wins <= 1000000);

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
      'finalDistance',m.final_distance,
      'roomWins',m.room_wins
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
  best_distance double precision;
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
    select max(coalesce(final_distance,race_distance,0)) into best_distance
    from ridge_private.multiplayer_members
    where room_id=p_room_id and race_active;

    update ridge_private.multiplayer_members
    set room_wins=room_wins+1
    where room_id=p_room_id
      and race_active
      and coalesce(final_distance,race_distance,0)=best_distance;

    update ridge_private.multiplayer_rooms
    set status='results',revision=revision+1
    where id=p_room_id;
  end if;
end $$;

create or replace function public.ridge_mp_rematch(p_member_token_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  rid uuid;
  mid uuid;
  host_id uuid;
  room_status text;
begin
  select room_id,id into rid,mid
  from ridge_private.multiplayer_members
  where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;

  update ridge_private.multiplayer_members set last_seen=now() where id=mid;
  perform public.ridge_mp_repair_room(rid);

  select status,host_member_id into room_status,host_id
  from ridge_private.multiplayer_rooms
  where id=rid
  for update;

  if room_status is null then return jsonb_build_object('error','room_not_found'); end if;
  if host_id<>mid then return jsonb_build_object('error','host_only'); end if;
  if room_status<>'results' then return jsonb_build_object('error','invalid_state'); end if;

  update ridge_private.multiplayer_members
  set ready=false,
      vote_map_id=null,
      race_active=false,
      race_status='waiting',
      race_distance=0,
      final_distance=null,
      last_seen=case when id=mid then now() else last_seen end
  where room_id=rid;

  update ridge_private.multiplayer_rooms
  set status='lobby',
      selected_map=null,
      vote_ends_at=null,
      race_start_at=null,
      revision=revision+1,
      expires_at=now()+interval '2 hours'
  where id=rid;

  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $$;

revoke all on function public.ridge_mp_snapshot(uuid,uuid) from public,anon,authenticated;
revoke all on function public.ridge_mp_advance_room(uuid) from public,anon,authenticated;
revoke all on function public.ridge_mp_rematch(text) from public,anon,authenticated;

grant execute on function public.ridge_mp_snapshot(uuid,uuid) to service_role;
grant execute on function public.ridge_mp_advance_room(uuid) to service_role;
grant execute on function public.ridge_mp_rematch(text) to service_role;

commit;

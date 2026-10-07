begin;

create table ridge_private.multiplayer_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check(code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$'),
  status text not null default 'lobby' check(status in ('lobby','voting','countdown','racing','results')),
  host_member_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '2 hours',
  revision bigint not null default 1
);

create table ridge_private.multiplayer_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references ridge_private.multiplayer_rooms(id) on delete cascade,
  account_id uuid references ridge_private.accounts(id) on delete cascade,
  member_token_hash text not null unique check(member_token_hash ~ '^[a-f0-9]{64}$'),
  display_name text not null check(length(display_name) between 2 and 20),
  vehicle_id text not null,
  ready boolean not null default false,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

alter table ridge_private.multiplayer_rooms add constraint multiplayer_rooms_host_member_fk foreign key(host_member_id) references ridge_private.multiplayer_members(id) on delete set null;
create index multiplayer_members_room_idx on ridge_private.multiplayer_members(room_id,joined_at);
create unique index multiplayer_members_account_room_unique on ridge_private.multiplayer_members(room_id,account_id) where account_id is not null;

alter table ridge_private.multiplayer_rooms enable row level security;
alter table ridge_private.multiplayer_members enable row level security;
revoke all on ridge_private.multiplayer_rooms,ridge_private.multiplayer_members from public,anon,authenticated;

create function public.ridge_mp_vehicle_owned(p_account_id uuid,p_vehicle_id text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
  if not (p_vehicle_id = any(array['base','bike','bus','tractor','atv','snowmobile','lowrider','monowheel','firetruck','steamroller','rover','battletank','formula','hovercraft','supercar','hotrod','dragster','tank','buggy','monster'])) then return false; end if;
  if p_account_id is null or p_vehicle_id='base' then return true; end if;
  return exists(select 1 from ridge_private.saves s where s.user_id=p_account_id and coalesce(s.progression->'owned','[]'::jsonb) ? p_vehicle_id);
end $$;

create function public.ridge_mp_snapshot(p_room_id uuid,p_self_id uuid) returns jsonb
language sql security definer set search_path='' as $$
  select jsonb_build_object(
    'id',r.id,'code',r.code,'status',r.status,'hostMemberId',r.host_member_id,'revision',r.revision,'selfMemberId',p_self_id,
    'members',coalesce((select jsonb_agg(jsonb_build_object(
      'id',m.id,'displayName',m.display_name,'vehicleId',m.vehicle_id,'ready',m.ready,
      'isHost',m.id=r.host_member_id,'connected',m.last_seen>now()-interval '8 seconds','joinedAt',m.joined_at
    ) order by m.joined_at) from ridge_private.multiplayer_members m where m.room_id=r.id),'[]'::jsonb)
  ) from ridge_private.multiplayer_rooms r where r.id=p_room_id;
$$;

create function public.ridge_mp_repair_room(p_room_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare removed integer; next_host uuid;
begin
  if exists(select 1 from ridge_private.multiplayer_rooms where id=p_room_id and expires_at<=now()) then
    delete from ridge_private.multiplayer_rooms where id=p_room_id; return;
  end if;
  delete from ridge_private.multiplayer_members where room_id=p_room_id and last_seen<now()-interval '30 seconds';
  get diagnostics removed=row_count;
  if removed>0 then update ridge_private.multiplayer_rooms set revision=revision+1 where id=p_room_id; end if;
  if not exists(select 1 from ridge_private.multiplayer_members where room_id=p_room_id) then
    delete from ridge_private.multiplayer_rooms where id=p_room_id; return;
  end if;
  if not exists(select 1 from ridge_private.multiplayer_rooms r join ridge_private.multiplayer_members m on m.id=r.host_member_id and m.room_id=r.id where r.id=p_room_id) then
    select id into next_host from ridge_private.multiplayer_members where room_id=p_room_id order by joined_at,id limit 1;
    update ridge_private.multiplayer_rooms set host_member_id=next_host,revision=revision+1 where id=p_room_id;
  end if;
end $$;

create function public.ridge_mp_create(p_account_token_hash text,p_member_token_hash text,p_room_code text,p_guest_name text,p_vehicle_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare aid uuid; dname text; rid uuid; mid uuid;
begin
  delete from ridge_private.multiplayer_rooms where expires_at<=now();
  if p_member_token_hash !~ '^[a-f0-9]{64}$' or p_room_code !~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$' then return jsonb_build_object('error','invalid_request'); end if;
  if p_account_token_hash is not null then
    select a.id,a.username into aid,dname from ridge_private.sessions s join ridge_private.accounts a on a.id=s.user_id where s.token_hash=p_account_token_hash and s.expires_at>now();
    if aid is null then return jsonb_build_object('unauthorized',true); end if;
  else
    dname=trim(coalesce(p_guest_name,''));
    if dname !~ '^[A-Za-z0-9_ -]{2,20}$' then return jsonb_build_object('error','invalid_guest_name'); end if;
  end if;
  if not public.ridge_mp_vehicle_owned(aid,p_vehicle_id) then return jsonb_build_object('error','vehicle_not_owned'); end if;
  insert into ridge_private.multiplayer_rooms(code) values(p_room_code) returning id into rid;
  insert into ridge_private.multiplayer_members(room_id,account_id,member_token_hash,display_name,vehicle_id) values(rid,aid,p_member_token_hash,dname,p_vehicle_id) returning id into mid;
  update ridge_private.multiplayer_rooms set host_member_id=mid where id=rid;
  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid),'memberId',mid);
exception when unique_violation then return jsonb_build_object('error','code_taken');
end $$;

create function public.ridge_mp_join(p_account_token_hash text,p_member_token_hash text,p_room_code text,p_guest_name text,p_vehicle_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare aid uuid; dname text; rid uuid; mid uuid; members integer;
begin
  delete from ridge_private.multiplayer_rooms where expires_at<=now();
  if p_member_token_hash !~ '^[a-f0-9]{64}$' or p_room_code !~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$' then return jsonb_build_object('error','invalid_request'); end if;
  if p_account_token_hash is not null then
    select a.id,a.username into aid,dname from ridge_private.sessions s join ridge_private.accounts a on a.id=s.user_id where s.token_hash=p_account_token_hash and s.expires_at>now();
    if aid is null then return jsonb_build_object('unauthorized',true); end if;
  else
    dname=trim(coalesce(p_guest_name,''));
    if dname !~ '^[A-Za-z0-9_ -]{2,20}$' then return jsonb_build_object('error','invalid_guest_name'); end if;
  end if;
  if not public.ridge_mp_vehicle_owned(aid,p_vehicle_id) then return jsonb_build_object('error','vehicle_not_owned'); end if;
  select id into rid from ridge_private.multiplayer_rooms where code=p_room_code and status='lobby' and expires_at>now() for update;
  if rid is null then return jsonb_build_object('error','room_not_found'); end if;
  perform public.ridge_mp_repair_room(rid);
  if not exists(select 1 from ridge_private.multiplayer_rooms where id=rid and status='lobby') then return jsonb_build_object('error','room_not_found'); end if;
  if aid is not null and exists(select 1 from ridge_private.multiplayer_members where room_id=rid and account_id=aid) then return jsonb_build_object('error','already_in_room'); end if;
  select count(*) into members from ridge_private.multiplayer_members where room_id=rid;
  if members>=8 then return jsonb_build_object('error','room_full'); end if;
  insert into ridge_private.multiplayer_members(room_id,account_id,member_token_hash,display_name,vehicle_id) values(rid,aid,p_member_token_hash,dname,p_vehicle_id) returning id into mid;
  update ridge_private.multiplayer_rooms set revision=revision+1,expires_at=now()+interval '2 hours' where id=rid;
  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid),'memberId',mid);
exception when unique_violation then return jsonb_build_object('error','already_in_room');
end $$;

create function public.ridge_mp_state(p_member_token_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid; mid uuid;
begin
  select room_id,id into rid,mid from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;
  perform public.ridge_mp_repair_room(rid);
  select room_id,id into rid,mid from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;
  update ridge_private.multiplayer_members set last_seen=now() where id=mid;
  update ridge_private.multiplayer_rooms set expires_at=now()+interval '2 hours' where id=rid;
  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $$;

create function public.ridge_mp_vehicle(p_member_token_hash text,p_vehicle_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid; mid uuid; aid uuid;
begin
  select room_id,id,account_id into rid,mid,aid from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;
  perform public.ridge_mp_repair_room(rid);
  select room_id,id,account_id into rid,mid,aid from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;
  if not public.ridge_mp_vehicle_owned(aid,p_vehicle_id) then return jsonb_build_object('error','vehicle_not_owned'); end if;
  update ridge_private.multiplayer_members set vehicle_id=p_vehicle_id,last_seen=now() where id=mid;
  update ridge_private.multiplayer_rooms set revision=revision+1,expires_at=now()+interval '2 hours' where id=rid;
  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $$;

create function public.ridge_mp_ready(p_member_token_hash text,p_ready boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid; mid uuid;
begin
  select room_id,id into rid,mid from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;
  perform public.ridge_mp_repair_room(rid);
  select room_id,id into rid,mid from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;
  update ridge_private.multiplayer_members set ready=p_ready,last_seen=now() where id=mid;
  update ridge_private.multiplayer_rooms set revision=revision+1,expires_at=now()+interval '2 hours' where id=rid;
  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $$;

create function public.ridge_mp_leave(p_member_token_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rid uuid;
begin
  select room_id into rid from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('ok',true); end if;
  perform 1 from ridge_private.multiplayer_rooms where id=rid for update;
  delete from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  perform public.ridge_mp_repair_room(rid);
  return jsonb_build_object('ok',true);
end $$;

revoke all on function public.ridge_mp_vehicle_owned(uuid,text) from public,anon,authenticated;
revoke all on function public.ridge_mp_snapshot(uuid,uuid) from public,anon,authenticated;
revoke all on function public.ridge_mp_repair_room(uuid) from public,anon,authenticated;
revoke all on function public.ridge_mp_create(text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.ridge_mp_join(text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.ridge_mp_state(text) from public,anon,authenticated;
revoke all on function public.ridge_mp_vehicle(text,text) from public,anon,authenticated;
revoke all on function public.ridge_mp_ready(text,boolean) from public,anon,authenticated;
revoke all on function public.ridge_mp_leave(text) from public,anon,authenticated;
grant execute on function public.ridge_mp_vehicle_owned(uuid,text) to service_role;
grant execute on function public.ridge_mp_snapshot(uuid,uuid) to service_role;
grant execute on function public.ridge_mp_repair_room(uuid) to service_role;
grant execute on function public.ridge_mp_create(text,text,text,text,text) to service_role;
grant execute on function public.ridge_mp_join(text,text,text,text,text) to service_role;
grant execute on function public.ridge_mp_state(text) to service_role;
grant execute on function public.ridge_mp_vehicle(text,text) to service_role;
grant execute on function public.ridge_mp_ready(text,boolean) to service_role;
grant execute on function public.ridge_mp_leave(text) to service_role;

commit;

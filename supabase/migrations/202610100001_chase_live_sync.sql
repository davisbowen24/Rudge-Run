-- Reproducible Chase Mode room setting and live player telemetry.
-- Existing scoring always uses the monotonically increasing race_distance.
-- Safe to apply after the base multiplayer room/race migrations.
alter table ridge_private.multiplayer_rooms
  add column if not exists chase_mode_enabled boolean not null default false;
alter table ridge_private.multiplayer_members
  add column if not exists live_position double precision,
  add column if not exists live_velocity double precision,
  add column if not exists live_sampled_at timestamptz;

CREATE OR REPLACE FUNCTION public.ridge_mp_snapshot(p_room_id uuid, p_self_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'id',r.id,
    'code',r.code,
    'status',r.status,
    'hostMemberId',r.host_member_id,
    'revision',r.revision,
    'selfMemberId',p_self_id,
    'serverTime',now(),
    'selectedMap',r.selected_map,
    'chaseModeEnabled',r.chase_mode_enabled,
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
      'livePosition',m.live_position,
      'liveVelocity',m.live_velocity,
      'liveSampledAt',m.live_sampled_at,
      'finalDistance',m.final_distance,
      'roomWins',m.room_wins
    ) order by m.joined_at) from ridge_private.multiplayer_members m where m.room_id=r.id),'[]'::jsonb)
  ) from ridge_private.multiplayer_rooms r where r.id=p_room_id;
$function$
;

CREATE OR REPLACE FUNCTION public.ridge_mp_chase_mode(p_member_token_hash text, p_enabled boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare rid uuid; mid uuid; host_id uuid; room_status text;
begin
 select room_id,id into rid,mid from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
 if rid is null then return jsonb_build_object('unauthorized',true); end if;
 perform public.ridge_mp_repair_room(rid);
 select host_member_id,status into host_id,room_status from ridge_private.multiplayer_rooms where id=rid for update;
 if host_id is distinct from mid then return jsonb_build_object('error','host_only'); end if;
 if room_status<>'lobby' then return jsonb_build_object('error','invalid_state'); end if;
 update ridge_private.multiplayer_rooms set chase_mode_enabled=p_enabled,revision=revision+1,expires_at=now()+interval '2 hours' where id=rid;
 update ridge_private.multiplayer_members set last_seen=now() where id=mid;
 return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $function$
;

CREATE OR REPLACE FUNCTION public.ridge_mp_progress_live(p_member_token_hash text, p_distance double precision, p_live_position double precision, p_live_velocity double precision)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare rid uuid; mid uuid; room_status text; active boolean; member_status text;
begin
  if p_live_position is null or p_live_velocity is null or p_live_position<0 or p_live_position>10000000 or p_live_velocity < -200 or p_live_velocity > 200 then
    return jsonb_build_object('error','invalid_live_telemetry');
  end if;
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

  if not (select chase_mode_enabled from ridge_private.multiplayer_rooms where id=rid) then return jsonb_build_object('error','mode_disabled'); end if;
  if room_status<>'racing' then return jsonb_build_object('error','invalid_state'); end if;
  if not active then return jsonb_build_object('error','not_participant'); end if;
  if member_status<>'racing' then return jsonb_build_object('error','race_finished'); end if;

  update ridge_private.multiplayer_members
  set race_distance=greatest(race_distance,p_distance),live_position=p_live_position,live_velocity=p_live_velocity,live_sampled_at=now(),last_seen=now()
  where id=mid;
  update ridge_private.multiplayer_rooms
  set revision=revision+1,expires_at=now()+interval '2 hours'
  where id=rid;

  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $function$
;

CREATE OR REPLACE FUNCTION public.ridge_mp_start(p_member_token_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      vote_map_id=null,
      live_position=null,
      live_velocity=null,
      live_sampled_at=null
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
end $function$
;

CREATE OR REPLACE FUNCTION public.ridge_mp_rematch(p_member_token_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      live_position=null,
      live_velocity=null,
      live_sampled_at=null,
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
end $function$
;

-- The Edge Function authenticates member tokens and calls these with its service key.
revoke all on function public.ridge_mp_chase_mode(text,boolean) from public,anon,authenticated;
revoke all on function public.ridge_mp_progress_live(text,double precision,double precision,double precision) from public,anon,authenticated;
grant execute on function public.ridge_mp_chase_mode(text,boolean) to service_role;
grant execute on function public.ridge_mp_progress_live(text,double precision,double precision,double precision) to service_role;

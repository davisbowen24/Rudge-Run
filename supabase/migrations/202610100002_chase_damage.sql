-- Chase Mode Step 4: server-owned damage, health, elimination, and recovery.
-- Default OFF ensures classic multiplayer is unaffected.
alter table ridge_private.multiplayer_members
  add column if not exists chase_health double precision not null default 100,
  add column if not exists chase_caught boolean not null default false;
alter table ridge_private.multiplayer_rooms
  add column if not exists chase_hazard_position double precision,
  add column if not exists chase_hazard_updated_at timestamptz,
  add column if not exists chase_leader_id uuid;
CREATE OR REPLACE FUNCTION public.ridge_mp_chase_tick(p_room_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare
  the_room ridge_private.multiplayer_rooms%rowtype;
  time_now timestamptz;
  leader_uuid uuid;
  leader_x double precision;
  leader_v double precision;
  target_x double precision;
  boundary_x double precision;
  elapsed_seconds double precision;
begin
  -- Serialize hazard progress and health across concurrent client requests.
  select * into the_room from ridge_private.multiplayer_rooms where id=p_room_id for update;
  if not found or the_room.status<>'racing' or not the_room.chase_mode_enabled then return; end if;
  time_now=clock_timestamp();
  elapsed_seconds=least(0.7::double precision,greatest(0::double precision,
    extract(epoch from (time_now-coalesce(the_room.chase_hazard_updated_at,time_now)))::double precision));
  -- Only fresh, currently racing players can drive the hazard. Extrapolate at
  -- most 1.5 seconds; never use historical best distance for leader selection.
  select m.id,
    greatest(0,m.live_position+m.live_velocity*least(1.5::double precision,
      greatest(0::double precision,extract(epoch from (time_now-m.live_sampled_at))::double precision))),
    m.live_velocity
    into leader_uuid,leader_x,leader_v
    from ridge_private.multiplayer_members m
    where m.room_id=p_room_id and m.race_active and m.race_status='racing'
      and m.live_position is not null and m.live_velocity is not null
      and m.live_sampled_at between time_now-interval '3 seconds' and time_now
    order by greatest(0,m.live_position+m.live_velocity*least(1.5::double precision,
      greatest(0::double precision,extract(epoch from (time_now-m.live_sampled_at))::double precision))) desc, m.id
    limit 1;
  if leader_uuid is null then
    -- Freeze instead of damaging players while all telemetry is stale.
    update ridge_private.multiplayer_rooms set chase_hazard_updated_at=time_now where id=p_room_id;
    return;
  end if;
  target_x=leader_x-750;
  if the_room.chase_hazard_position is null then
    boundary_x=target_x;
  else
    -- Feed forward when the same leader is moving, then gently correct to the
    -- target. A new leader or a backward-moving leader may move it backward.
    boundary_x=the_room.chase_hazard_position+
      (case when leader_uuid=the_room.chase_leader_id then leader_v*elapsed_seconds else 0 end);
    boundary_x=boundary_x+(target_x-boundary_x)*(1-exp(-5*elapsed_seconds));
  end if;
  update ridge_private.multiplayer_rooms
  set chase_hazard_position=boundary_x,chase_hazard_updated_at=time_now,
      chase_leader_id=leader_uuid,revision=revision+1
  where id=p_room_id;
  if elapsed_seconds>0 then
    -- The server, not the local visual prediction, decides damage and death.
    -- Damage is 8–28 health per second, increasing with distance behind.
    with targets as (
      select m.id,
        elapsed_seconds*(8+least(20::double precision,
          greatest(0::double precision,boundary_x-
            greatest(0,m.live_position+m.live_velocity*least(1.5::double precision,
              greatest(0::double precision,extract(epoch from (time_now-m.live_sampled_at))::double precision))))*0.04)) as damage
      from ridge_private.multiplayer_members m
      where m.room_id=p_room_id and m.race_active and m.race_status='racing'
        and m.live_position is not null and m.live_velocity is not null
        and m.live_sampled_at between time_now-interval '3 seconds' and time_now
        and greatest(0,m.live_position+m.live_velocity*least(1.5::double precision,
            greatest(0::double precision,extract(epoch from (time_now-m.live_sampled_at))::double precision)))<=boundary_x
    )
    update ridge_private.multiplayer_members m
    set chase_health=greatest(0,m.chase_health-targets.damage),
        chase_caught=(m.chase_health<=targets.damage),
        race_status=case when m.chase_health<=targets.damage then 'dead' else m.race_status end,
        final_distance=case when m.chase_health<=targets.damage then greatest(coalesce(m.final_distance,0),m.race_distance) else m.final_distance end
    from targets where m.id=targets.id;
  end if;
  -- If the last driver dies, reuse the existing race completion/scoring flow.
  perform public.ridge_mp_advance_room(p_room_id);
end
$function$;
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
    'chaseHazardPosition',r.chase_hazard_position,
    'chaseHazardSampledAt',r.chase_hazard_updated_at,
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
      'chaseHealth',m.chase_health,
      'chaseCaught',m.chase_caught,
      'finalDistance',m.final_distance,
      'roomWins',m.room_wins
    ) order by m.joined_at) from ridge_private.multiplayer_members m where m.room_id=r.id),'[]'::jsonb)
  ) from ridge_private.multiplayer_rooms r where r.id=p_room_id;
$function$
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
  perform public.ridge_mp_chase_tick(rid);

  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $function$
;
CREATE OR REPLACE FUNCTION public.ridge_mp_state(p_member_token_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  perform public.ridge_mp_chase_tick(rid);
  update ridge_private.multiplayer_rooms set expires_at=now()+interval '2 hours' where id=rid;
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
      live_sampled_at=null,
      chase_health=100,
      chase_caught=false
  where room_id=rid;

  update ridge_private.multiplayer_rooms
  set status='voting',
      selected_map=null,
      vote_ends_at=now()+interval '12 seconds',
      race_start_at=null,
      race_number=race_number+1,
      chase_hazard_position=null,
      chase_hazard_updated_at=null,
      chase_leader_id=null,
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
      chase_health=100,
      chase_caught=false,
      last_seen=case when id=mid then now() else last_seen end
  where room_id=rid;

  update ridge_private.multiplayer_rooms
  set status='lobby',
      selected_map=null,
      vote_ends_at=null,
      race_start_at=null,
      chase_hazard_position=null,
      chase_hazard_updated_at=null,
      chase_leader_id=null,
      revision=revision+1,
      expires_at=now()+interval '2 hours'
  where id=rid;

  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $function$
;
revoke all on function public.ridge_mp_chase_tick(uuid) from public,anon,authenticated;
grant execute on function public.ridge_mp_chase_tick(uuid) to service_role;
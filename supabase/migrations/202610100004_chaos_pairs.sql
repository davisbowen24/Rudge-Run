-- Each room receives one server-owned random seed, shared with its members.
-- The seed, race number and server raceStartAt determine two compatible events
-- every 12 seconds; clients apply their physics locally with no extra latency.
alter table ridge_private.multiplayer_rooms
  add column if not exists chaos_seed integer not null default floor(random()*2147483647)::integer;

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
    'chaosModeEnabled',r.chaos_mode_enabled,
    'chaosSeed',r.chaos_seed,
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

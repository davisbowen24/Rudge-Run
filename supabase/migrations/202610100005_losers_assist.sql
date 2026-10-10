-- Loser's Assist is independently host-controlled and off by default.
-- Race clients use existing room progress updates to calculate bottom-half boosts.
alter table ridge_private.multiplayer_rooms
  add column if not exists losers_assist_enabled boolean not null default false;

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
    'losersAssistEnabled',r.losers_assist_enabled,
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

CREATE OR REPLACE FUNCTION public.ridge_mp_losers_assist(p_member_token_hash text, p_enabled boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare rid uuid; mid uuid; host_id uuid; room_status text;
begin
  select room_id,id into rid,mid
    from ridge_private.multiplayer_members where member_token_hash=p_member_token_hash;
  if rid is null then return jsonb_build_object('unauthorized',true); end if;
  perform public.ridge_mp_repair_room(rid);
  select host_member_id,status into host_id,room_status
    from ridge_private.multiplayer_rooms where id=rid for update;
  if room_status is null then return jsonb_build_object('error','room_not_found'); end if;
  if host_id is distinct from mid then return jsonb_build_object('error','host_only'); end if;
  if room_status<>'lobby' then return jsonb_build_object('error','invalid_state'); end if;
  update ridge_private.multiplayer_rooms
    set losers_assist_enabled=p_enabled,revision=revision+1,
      expires_at=now()+interval '2 hours' where id=rid;
  update ridge_private.multiplayer_members set last_seen=now() where id=mid;
  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end
$function$;

revoke all on function public.ridge_mp_losers_assist(text,boolean) from public,anon,authenticated;
grant execute on function public.ridge_mp_losers_assist(text,boolean) to service_role;

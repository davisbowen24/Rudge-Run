-- Multiplayer awards one point for each opponent beaten, not one win.
-- Room points persist across rematches and reset when a new room is created.
-- Existing historical room_wins are retained solely as legacy data.
alter table ridge_private.multiplayer_members
  add column if not exists room_points integer not null default 0,
  add column if not exists race_points integer not null default 0;

alter table ridge_private.multiplayer_members
  add constraint multiplayer_members_room_points_check
  check (room_points between 0 and 1000000 and race_points between 0 and 100);

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
    'stuntAssistEnabled',r.stunt_assist_enabled,
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
      'roomWins',m.room_wins,
      'roomPoints',m.room_points,
      'racePoints',m.race_points
    ) order by m.joined_at) from ridge_private.multiplayer_members m where m.room_id=r.id),'[]'::jsonb)
  ) from ridge_private.multiplayer_rooms r where r.id=p_room_id;
$function$
;

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
    -- Award one point per *other participant* with a strictly lower
    -- final distance. Tied distances do not beat one another. Compute once
    -- while holding the room lock, before switching to results.
    with awarded as (
      select m.id,
        (select count(*)::integer
         from ridge_private.multiplayer_members other
         where other.room_id=p_room_id
           and other.race_active
           and other.id<>m.id
           and coalesce(other.final_distance,other.race_distance,0)
               <coalesce(m.final_distance,m.race_distance,0)) as earned
      from ridge_private.multiplayer_members m
      where m.room_id=p_room_id and m.race_active
    )
    update ridge_private.multiplayer_members m
    set race_points=awarded.earned,
        room_points=least(1000000,m.room_points+awarded.earned)
    from awarded
    where m.id=awarded.id;

    update ridge_private.multiplayer_rooms
    set status='results',revision=revision+1
    where id=p_room_id;
  end if;
end $$;

revoke all on function public.ridge_mp_snapshot(uuid,uuid) from public,anon,authenticated;
revoke all on function public.ridge_mp_advance_room(uuid) from public,anon,authenticated;
grant execute on function public.ridge_mp_snapshot(uuid,uuid) to service_role;
grant execute on function public.ridge_mp_advance_room(uuid) to service_role;

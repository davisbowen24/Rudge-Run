-- Keep readiness independent of vehicle selection. Preserve existing ownership checks.
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
  set vehicle_id=p_vehicle_id,last_seen=now()
  where id=mid;
  update ridge_private.multiplayer_rooms
  set revision=revision+1,expires_at=now()+interval '2 hours'
  where id=rid;
  return jsonb_build_object('room',public.ridge_mp_snapshot(rid,mid));
end $$;


revoke all on function public.ridge_mp_vehicle(text,text) from public,anon,authenticated;
grant execute on function public.ridge_mp_vehicle(text,text) to service_role;

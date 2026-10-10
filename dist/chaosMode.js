/** Server-scheduled, shared low-gravity windows. All timestamps are milliseconds.
 * The server owns the enabled flag and race start time. Clients only evaluate
 * the same deterministic schedule; no per-frame network requests are needed.
 */
export const CHAOS_CYCLE_MS=30000;
export const CHAOS_LOW_GRAVITY_MS=10000;
export function chaosGravityAt(room,serverNowMs,live=true){
  const normal={active:false,multiplier:1,remainingMs:0};
  if(!live||room?.status!=='racing'||room?.chaosModeEnabled!==true)return normal;
  const start=Date.parse(room.raceStartAt||'');
  if(!Number.isFinite(start)||!Number.isFinite(serverNowMs)||serverNowMs<start)return normal;
  const elapsed=serverNowMs-start;
  const phase=elapsed%CHAOS_CYCLE_MS;
  const active=elapsed>=CHAOS_CYCLE_MS&&phase<CHAOS_LOW_GRAVITY_MS;
  return {active,multiplier:active?0.5:1,
    remainingMs:active?CHAOS_LOW_GRAVITY_MS-phase:CHAOS_CYCLE_MS-phase};
}

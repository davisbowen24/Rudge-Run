/** Pure Loser's Assist rules. Operates on room progress snapshots; it never
 * depends on frame-by-frame opponents' positions or modifies server race state.
 */
export const LOSERS_ASSIST_MAX_MULTIPLIER=4;
export const LOSERS_ASSIST_DISTANCE_SCALE=400;
const finiteDistance=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;

/**
 * Only the bottom ceil(N / 2) of currently competing drivers may receive help.
 * Single-driver races and tied leaders never receive a boost.
 * A 400 m gap yields 2.5x engine power and torque, with an asymptotic 4x cap.
 */
export function losersAssistTarget(room,selfId,selfDistance){
  const off={eligible:false,rank:0,eligibleCount:0,racerCount:0,gapMeters:0,multiplier:1};
  if(!room||room.status!=='racing'||room.losersAssistEnabled!==true||!selfId)return off;
  const drivers=(room.members||[]).filter(m=>m.raceActive===true&&m.raceStatus==='racing'&&m.connected!==false)
    .map(m=>({id:String(m.id),distance:finiteDistance(m.id===selfId&&Number.isFinite(selfDistance)?selfDistance:m.distance)}))
    .sort((a,b)=>b.distance-a.distance||a.id.localeCompare(b.id));
  if(drivers.length<2)return {...off,racerCount:drivers.length};
  const rank=drivers.findIndex(m=>m.id===String(selfId));
  if(rank<0)return {...off,racerCount:drivers.length};
  const eligibleCount=Math.ceil(drivers.length/2);
  const gapMeters=Math.max(0,drivers[0].distance-drivers[rank].distance);
  const eligible=rank>=drivers.length-eligibleCount&&gapMeters>0;
  const multiplier=eligible
    ?1+(LOSERS_ASSIST_MAX_MULTIPLIER-1)*gapMeters/(gapMeters+LOSERS_ASSIST_DISTANCE_SCALE):1;
  return {eligible,rank:rank+1,eligibleCount,racerCount:drivers.length,gapMeters,multiplier};
}

/** Exponential easing prevents abrupt engine changes as rank/lead changes. */
export function smoothLosersAssist(current,target,dt){
  const from=Number.isFinite(current)?Math.max(1,current):1;
  const to=Number.isFinite(target)?Math.min(LOSERS_ASSIST_MAX_MULTIPLIER,Math.max(1,target)):1;
  const seconds=Number.isFinite(dt)?Math.max(0,Math.min(0.25,dt)):0;
  return from+(to-from)*(1-Math.exp(-seconds*2));
}

/** Chaos Mode: one server-selected seed and shared race timestamp produce
 * one effect per round, with a 25% chance of a second compatible effect.
 * No realtime physics RPCs.
 */
export const CHAOS_CYCLE_MS=12000;
export const CHAOS_EFFECT_MS=6000;
export const CHAOS_WARNING_MS=3000;
export const CHAOS_MODIFIERS=Object.freeze([
  Object.freeze({id:'moon',name:'Moon Gravity',icon:'🌙'}),
  Object.freeze({id:'heavy',name:'Crushing Gravity',icon:'🪨'}),
  Object.freeze({id:'giant',name:'Giant Cars',icon:'🚗'}),
  Object.freeze({id:'tiny',name:'Tiny Cars',icon:'🐜'}),
  Object.freeze({id:'turbo',name:'Turbo Madness',icon:'🚀'}),
  Object.freeze({id:'ice',name:'Ice Wheels',icon:'🧊'}),
  Object.freeze({id:'spring',name:'Super Suspension',icon:'🦘'}),
  Object.freeze({id:'wind',name:'Windstorm',icon:'🌪️'}),
  Object.freeze({id:'spin',name:'Spin Cycle',icon:'🔄'}),
  Object.freeze({id:'trouble',name:'Engine Trouble',icon:'🐌'})
]);
const CONFLICTS=[['moon','heavy'],['giant','tiny'],['turbo','trouble']];
const conflict=(a,b)=>CONFLICTS.some(pair=>pair.includes(a)&&pair.includes(b));
// Stable integer PRNG. The seed comes from the server at room creation;
// race number and cycle make fresh, identical choices across all clients.
export function chaosPair(seed,raceNumber,cycle){
  if(!Number.isSafeInteger(seed)||!Number.isInteger(raceNumber)||!Number.isSafeInteger(cycle)||cycle<0)return [];
  let x=(seed ^ Math.imul(raceNumber,0x9e3779b9) ^ Math.imul(cycle+1,0x85ebca6b))>>>0;
  const next=()=>{
    x=(x+0x6d2b79f5)>>>0;
    let t=Math.imul(x^(x>>>15),1|x);
    t^=t+Math.imul(t^(t>>>7),61|t);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
  const first=CHAOS_MODIFIERS[Math.floor(next()*CHAOS_MODIFIERS.length)];
  // Exactly one extra effect per round at most. This independent draw
  // preserves a 75% chance of one modifier and a 25% chance of two.
  if(next()>=0.25)return [first];
  const choices=CHAOS_MODIFIERS.filter(effect=>effect.id!==first.id&&!conflict(first.id,effect.id));
  const second=choices[Math.floor(next()*choices.length)];
  return [first,second];
}

export function chaosStateAt(room,serverNowMs,live=true){
  const inactive={active:false,warning:false,effects:[],cycle:-1,remainingMs:0};
  if(!live||!['racing','countdown'].includes(room?.status)||room?.chaosModeEnabled!==true)return inactive;
  const start=Date.parse(room.raceStartAt||'');
  const seed=room.chaosSeed;
  if(!Number.isFinite(start)||!Number.isFinite(serverNowMs)
    ||!Number.isSafeInteger(seed))return inactive;
  if(serverNowMs<start){
    const until=start-serverNowMs;
    if(room.status==='countdown'&&until<=CHAOS_WARNING_MS)return {
      active:false,warning:true,effects:chaosPair(seed,room.raceNumber||0,0),
      cycle:0,remainingMs:until
    };
    return inactive;
  }
  const elapsed=serverNowMs-start,cycle=Math.floor(elapsed/CHAOS_CYCLE_MS),phase=elapsed%CHAOS_CYCLE_MS;
  const active=phase<CHAOS_EFFECT_MS;
  const warning=phase>=CHAOS_CYCLE_MS-CHAOS_WARNING_MS;
  const shownCycle=warning?cycle+1:cycle;
  return {active,warning,effects:active||warning?chaosPair(seed,room.raceNumber||0,shownCycle):[],
    cycle:shownCycle,remainingMs:active?CHAOS_EFFECT_MS-phase:warning?CHAOS_CYCLE_MS-phase:0};
}

/** Derive effects from original stats once per event. Never compound on the
 * previous event or permanently alter purchased upgrades. */
export function chaosVehicleFor(base,effects){
  const ids=new Set(effects.map(effect=>typeof effect==='string'?effect:effect.id));
  const v={...base};
  let gravity=1,wind=0,size=1;
  if(ids.has('moon'))gravity*=0.5;
  if(ids.has('heavy'))gravity*=1.75;
  if(ids.has('giant'))size=1.5;
  if(ids.has('tiny'))size=0.6;
  if(ids.has('turbo')){
    v.enginePower*=2;v.engineTorque*=2;v.acceleration*=2;
  }
  if(ids.has('trouble')){
    v.enginePower*=0.4;v.engineTorque*=0.4;v.acceleration*=0.4;
  }
  if(ids.has('ice')){
    v.staticGrip*=0.4;v.dynamicGrip*=0.4;v.tireGrip*=0.4;
  }
  if(ids.has('spring')){
    v.suspension*=1.8;v.suspensionDamping*=0.25;
  }
  if(ids.has('wind'))wind=-130;
  if(ids.has('spin')){
    v.airTilt*=3;v.maxRotation*=2;v.airBrake*=2;
  }
  if(size!==1){
    v.halfWidth*=size;v.wheelRadius*=size;v.wheelBase*=size;v.driveLever*=size;
    v.suspensionTravel*=size;v.suspensionMin*=size;v.comOffsetY*=size;
    v.wheels=base.wheels.map(w=>({...w,x:w.x*size,y:w.y*size,r:w.r*size}));
    v.head={...base.head,x:base.head.x*size,y:base.head.y*size};
    if(base.pickupPolygon)v.pickupPolygon=base.pickupPolygon.map(pair=>pair.map(n=>n*size));
    v.mass*=size*size;
    v.inertia*=Math.pow(size,4);
    v.suspension*=size;
    v.suspensionDamping*=size;
  }
  return {vehicle:v,gravityMultiplier:gravity,windAcceleration:wind,size};
}

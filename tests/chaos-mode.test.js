import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAOS_CYCLE_MS,CHAOS_EFFECT_MS,CHAOS_WARNING_MS,CHAOS_MODIFIERS,chaosPair,chaosStateAt,chaosVehicleFor} from '../dist/chaosMode.js';
const start='2026-10-10T12:00:00.000Z';
const room={status:'racing',chaosModeEnabled:true,chaseModeEnabled:true,chaosSeed:123456789,raceNumber:2,raceStartAt:start};
const at=t=>chaosStateAt(room,Date.parse(start)+t);
const base={mass:12,inertia:16000,enginePower:1000,engineTorque:200,acceleration:90,staticGrip:2,dynamicGrip:1.3,tireGrip:1.5,suspension:900,suspensionDamping:120,suspensionTravel:22,suspensionMin:8,airTilt:3,airBrake:1,maxRotation:4,wheelRadius:19,wheelBase:88,halfWidth:51,driveLever:17,comOffsetY:5,wheels:[{x:-40,y:9,r:19},{x:40,y:9,r:19}],head:{x:10,y:-30},pickupPolygon:[[-10,1],[10,1]]};
test('six seconds ON then six OFF, with three-second next-event warning',()=>{
  assert.equal(CHAOS_CYCLE_MS,12000);
  assert.equal(CHAOS_EFFECT_MS,6000);
  assert.equal(CHAOS_WARNING_MS,3000);
  assert.equal(at(0).active,true);
  assert.equal(at(5999).active,true);
  assert.equal(at(6000).active,false);
  assert.equal(at(8999).warning,false);
  assert.equal(at(9000).warning,true);
  assert.equal(at(11999).remainingMs,1);
  assert.equal(at(12000).active,true);
  assert.equal(at(18000).active,false);
  assert.equal(at(24000).active,true);
  assert.equal(at(6000).effects.length,0);
  assert.equal(at(9000).effects.map(x=>x.id).join(),at(12000).effects.map(x=>x.id).join());
});
test('two distinct compatible effects are determined by server seed for all players',()=>{
  assert.equal(CHAOS_MODIFIERS.length,10);
  const seen=new Set();
  for(let c=0;c<300;c++){
    const pair=chaosPair(room.chaosSeed,room.raceNumber,c);
    assert.equal(pair.length,2);
    assert.notEqual(pair[0].id,pair[1].id);
    const ids=pair.map(x=>x.id);
    assert.ok(!(ids.includes('moon')&&ids.includes('heavy')));
    assert.ok(!(ids.includes('giant')&&ids.includes('tiny')));
    assert.ok(!(ids.includes('turbo')&&ids.includes('trouble')));
    assert.deepEqual(pair,chaosPair(room.chaosSeed,room.raceNumber,c));
    for(const x of pair)seen.add(x.id);
  }
  assert.deepEqual([...seen].sort(),CHAOS_MODIFIERS.map(x=>x.id).sort());
  assert.notDeepEqual(chaosPair(room.chaosSeed,room.raceNumber,4),chaosPair(room.chaosSeed+1,room.raceNumber,4));
});
test('Chase can coexist, while missing seed, ended race and disabled mode stay inert',()=>{
  assert.equal(at(500).active,true);
  assert.equal(chaosStateAt({...room,chaseModeEnabled:false},Date.parse(start)+500).active,true);
  for(const changed of [{chaosModeEnabled:false},{chaosSeed:null},{raceStartAt:null},{status:'results'}])
    assert.equal(chaosStateAt({...room,...changed},Date.parse(start)+500).active,false);
  assert.equal(chaosStateAt(room,Date.parse(start)+500,false).active,false);
});
test('combined modifiers derive from base once and preserve original values',()=>{
  const combo=chaosVehicleFor(base,['moon','turbo']);
  assert.equal(combo.gravityMultiplier,.5);
  assert.equal(combo.vehicle.enginePower,2000);
  assert.equal(combo.vehicle.engineTorque,400);
  assert.equal(base.enginePower,1000);
  assert.equal(chaosVehicleFor(base,[]).vehicle.enginePower,1000);
  const giant=chaosVehicleFor(base,['giant','ice']);
  assert.equal(giant.size,1.5);
  assert.equal(giant.vehicle.wheels[0].r,28.5);
  assert.equal(giant.vehicle.head.y,-45);
  assert.equal(giant.vehicle.pickupPolygon[0][0],-15);
  assert.equal(giant.vehicle.staticGrip,.8);
  assert.equal(base.wheels[0].r,19);
  const tiny=chaosVehicleFor(base,['tiny','wind']);
  assert.equal(tiny.size,.6);
  assert.equal(tiny.vehicle.wheels[0].x,-24);
  assert.equal(tiny.windAcceleration,-130);
  assert.equal(chaosVehicleFor(base,['heavy','spring']).gravityMultiplier,1.75);
  assert.equal(chaosVehicleFor(base,['spin']).vehicle.airTilt,9);
  assert.equal(chaosVehicleFor(base,['trouble']).vehicle.acceleration,36);
});

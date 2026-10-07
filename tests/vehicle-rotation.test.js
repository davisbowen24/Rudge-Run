import test from 'node:test';
import assert from 'node:assert/strict';
import { createUpgrades } from '../dist/upgrades.js';
import { VEHICLE_STAT_TABLE, vehicleBase } from '../dist/vehicles.js';

const upgrades=createUpgrades({
  state:{progression:{selected:'base'}},
  save:{levelsFor:()=>({engine:0,suspension:0,tires:0,fuel:0})}
});

const levels=n=>({engine:n,suspension:n,tires:0,fuel:0});
const airAccel=s=>s.airTilt*s.airControl;

test('bike ATV and Moon Rover have strong air correction but restrained spin and ground pitch',()=>{
  assert.equal(VEHICLE_STAT_TABLE.bike.airControl,3.75);
  assert.equal(VEHICLE_STAT_TABLE.atv.airControl,3.0);
  assert.equal(VEHICLE_STAT_TABLE.rover.airControl,2.9);

  assert.equal(VEHICLE_STAT_TABLE.bike.maxRotation,1.05);
  assert.equal(VEHICLE_STAT_TABLE.atv.maxRotation,1.05);
  assert.equal(VEHICLE_STAT_TABLE.rover.maxRotation,1.0);

  assert.equal(VEHICLE_STAT_TABLE.bike.drivePitch,0.65);
  assert.equal(VEHICLE_STAT_TABLE.atv.drivePitch,0.7);
  assert.equal(VEHICLE_STAT_TABLE.rover.drivePitch,0.75);

  assert.ok(VEHICLE_STAT_TABLE.bike.inertia>1);
  assert.ok(VEHICLE_STAT_TABLE.atv.inertia>1);
  assert.ok(VEHICLE_STAT_TABLE.rover.inertia>1);
  assert.ok(VEHICLE_STAT_TABLE.bike.groundDamping>1);
  assert.ok(VEHICLE_STAT_TABLE.atv.groundDamping>1);
  assert.ok(VEHICLE_STAT_TABLE.rover.groundDamping>1);
});

test('targeted drivePitch values reach runtime vehicle physics',()=>{
  for(const id of ['bike','atv','rover']){
    assert.equal(vehicleBase(id).drivePitch,VEHICLE_STAT_TABLE[id].drivePitch);
  }
});

test('ATV and Moon Rover engine upgrades increase air control without explosive linear scaling',()=>{
  for(const id of ['atv','rover']){
    const low=upgrades.vehicleStats(levels(0),id);
    const high=upgrades.vehicleStats(levels(5),id);
    const ratio=airAccel(high)/airAccel(low);
    assert.ok(ratio>1,`${id} should gain air authority with engine upgrades`);
    assert.ok(ratio<10,`${id} air-control growth should stay controlled, got ${ratio}`);
  }
});

test('motorcycle air control remains independent of engine upgrades',()=>{
  const noEngine=upgrades.vehicleStats({engine:0,suspension:0,tires:0,fuel:0},'bike');
  const maxEngine=upgrades.vehicleStats({engine:5,suspension:0,tires:0,fuel:0},'bike');
  assert.equal(airAccel(noEngine),airAccel(maxEngine));
  const maxAir=upgrades.vehicleStats({engine:0,suspension:5,tires:0,fuel:0},'bike');
  assert.ok(airAccel(maxAir)>airAccel(noEngine));
});

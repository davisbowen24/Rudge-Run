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

test('bike ATV and Moon Rover retain agile but controlled rotation caps',()=>{
  assert.equal(VEHICLE_STAT_TABLE.bike.maxRotation,1.45);
  assert.equal(VEHICLE_STAT_TABLE.atv.maxRotation,1.4);
  assert.equal(VEHICLE_STAT_TABLE.rover.maxRotation,1.3);
  assert.ok(VEHICLE_STAT_TABLE.bike.groundDamping>1);
  assert.ok(VEHICLE_STAT_TABLE.atv.groundDamping>1);
  assert.ok(VEHICLE_STAT_TABLE.rover.groundDamping>1);
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

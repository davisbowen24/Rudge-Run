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
  assert.equal(VEHICLE_STAT_TABLE.bike.airControl,2.6);
  assert.equal(VEHICLE_STAT_TABLE.atv.airControl,2.25);
  assert.equal(VEHICLE_STAT_TABLE.rover.airControl,2.9);

  assert.equal(VEHICLE_STAT_TABLE.bike.maxRotation,1.8);
  assert.equal(VEHICLE_STAT_TABLE.atv.maxRotation,1.65);
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

test('motorcycle and ATV have the quickest spin-up and counter-rotation response',()=>{
  const bike=vehicleBase('bike');
  const atv=vehicleBase('atv');
  const rover=vehicleBase('rover');

  assert.equal(bike.airResponse,7.5);
  assert.equal(bike.airBrake,2);
  assert.equal(atv.airResponse,7);
  assert.equal(atv.airBrake,1.9);
  assert.equal(rover.airResponse,1);
  assert.equal(rover.airBrake,1);

  const bikeAuthority=airAccel(upgrades.vehicleStats(levels(0),'bike'))*bike.airResponse;
  const atvAuthority=airAccel(upgrades.vehicleStats(levels(0),'atv'))*atv.airResponse;
  const roverAuthority=airAccel(upgrades.vehicleStats(levels(0),'rover'))*rover.airResponse;

  assert.ok(bikeAuthority>roverAuthority,'motorcycle should have more immediate air response than Moon Rover');
  assert.ok(atvAuthority>roverAuthority,'ATV should have more immediate air response than Moon Rover');
  assert.ok(bikeAuthority*bike.airBrake>bikeAuthority,'motorcycle counter-rotation should brake faster than same-direction spin-up');
  assert.ok(atvAuthority*atv.airBrake>atvAuthority,'ATV counter-rotation should brake faster than same-direction spin-up');
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

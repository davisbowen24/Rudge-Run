import test from 'node:test';
import assert from 'node:assert/strict';
import { createUpgrades } from '../dist/upgrades.js';
import { VEHICLE_STAT_TABLE, UPGRADE_CURVES, upgradeScale, vehicleBase } from '../dist/vehicles.js';
import { BASE_VEHICLE_TRAITS, MAX_LEVEL } from '../dist/config.js';

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

test('motorcycle and ATV have responsive spin-up and stronger counter-rotation',()=>{
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

  // The Moon Rover has strong *stock* air authority, while motorcycle Air Control
  // is a separate upgrade. Both should remain responsive with the bike close to
  // the rover at stock settings and clearly ahead after its Air Control upgrade.
  assert.ok(bikeAuthority>0,'motorcycle must respond to air-control inputs at stock settings');
  const tunedBikeAuthority=airAccel(upgrades.vehicleStats(levels(MAX_LEVEL),'bike'))*bike.airResponse;
  assert.ok(tunedBikeAuthority>roverAuthority,'upgraded motorcycle should respond faster than Moon Rover');
  assert.ok(atvAuthority>roverAuthority,'ATV should have more immediate air response than Moon Rover');
  assert.ok(bikeAuthority*bike.airBrake>bikeAuthority,'motorcycle counter-rotation should brake faster than same-direction spin-up');
  assert.ok(atvAuthority*atv.airBrake>atvAuthority,'ATV counter-rotation should brake faster than same-direction spin-up');
});

test('targeted drivePitch values reach runtime vehicle physics',()=>{
  for(const id of ['bike','atv','rover']){
    const expected=BASE_VEHICLE_TRAITS.drivePitch*VEHICLE_STAT_TABLE[id].drivePitch;
    assert.ok(Math.abs(vehicleBase(id).drivePitch-expected)<1e-12,
      `${id} runtime drivePitch must include the common Jeep base value`);
  }
});

test('ATV and Moon Rover use fixed air control independent of engine upgrades',()=>{
  // Air control was deliberately decoupled from engine upgrades. Their base
  // authority is tuned using a bounded square-root of the former max power.
  // The former max power includes the per-vehicle engine upgrade profile.
  // Compare each vehicle against its own tuned max-power reference.
  for(const id of ['atv','rover']){
    const low=upgrades.vehicleStats(levels(0),id);
    const high=upgrades.vehicleStats(levels(MAX_LEVEL),id);
    assert.equal(airAccel(high),airAccel(low),
      `${id} air response must stay independent of engine and suspension levels`);
    const base=vehicleBase(id);
    const oldStockAuthority=base.airTilt*base.airControl*.8*(UPGRADE_CURVES.power[0]/10);
    const maxPower=UPGRADE_CURVES.power[MAX_LEVEL]*upgradeScale(id,'power',MAX_LEVEL);
    const tunedFactor=Math.sqrt(maxPower/UPGRADE_CURVES.power[0]);
    const actualFactor=airAccel(low)/oldStockAuthority;
    assert.ok(tunedFactor>1 && tunedFactor<10);
    assert.ok(Math.abs(actualFactor-tunedFactor)<1e-10,
      `${id} should retain the bounded tuned air-control multiplier`);
  }
});

test('motorcycle air control remains independent of engine upgrades',()=>{
  const noEngine=upgrades.vehicleStats({engine:0,suspension:0,tires:0,fuel:0},'bike');
  const maxEngine=upgrades.vehicleStats({engine:5,suspension:0,tires:0,fuel:0},'bike');
  assert.equal(airAccel(noEngine),airAccel(maxEngine));
  const maxAir=upgrades.vehicleStats({engine:0,suspension:5,tires:0,fuel:0},'bike');
  assert.ok(airAccel(maxAir)>airAccel(noEngine));
});

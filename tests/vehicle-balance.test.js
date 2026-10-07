import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_VEHICLE_TRAITS } from '../dist/config.js';
import { VEHICLE_ORDER, VEHICLE_STAT_TABLE, vehicleBase } from '../dist/vehicles.js';

function close(actual,expected,label){
  const tolerance=1e-9*Math.max(1,Math.abs(expected));
  assert.ok(Math.abs(actual-expected)<=tolerance,`${label}: expected ${expected}, got ${actual}`);
}

test('vehicle performance table maps cleanly into runtime physics traits',()=>{
  assert.equal(VEHICLE_ORDER.length,20);
  const jeep=vehicleBase('base');

  for(const id of VEHICLE_ORDER){
    const row=VEHICLE_STAT_TABLE[id];
    assert.ok(row,`missing authoritative row for ${id}`);

    for(const key of [
      'mass','motorTorque','enginePower','accelerationLimit','wheelSpeedLimit','tireGrip',
      'airControl','maxRotation','inertia','suspension','suspensionDamping','suspensionTravel',
      'pitchSupport','groundDamping','fuelCapacity','fuelBurn'
    ]){
      assert.ok(Number.isFinite(row[key])&&row[key]>0,`${id} has invalid ${key}`);
    }

    const v=vehicleBase(id);
    close(v.mass/BASE_VEHICLE_TRAITS.mass,row.mass,`${id} mass`);
    close(v.engineTorque/BASE_VEHICLE_TRAITS.motorTorque,row.motorTorque,`${id} torque`);
    close(v.enginePower/BASE_VEHICLE_TRAITS.enginePower,row.enginePower,`${id} power`);
    close(v.acceleration/BASE_VEHICLE_TRAITS.acceleration,row.accelerationLimit,`${id} acceleration limit`);
    close(v.wheelSpeedLimit/BASE_VEHICLE_TRAITS.wheelSpeedLimit,row.wheelSpeedLimit,`${id} wheel speed limit`);
    close(v.maxSpeed/BASE_VEHICLE_TRAITS.maxSpeed,row.wheelSpeedLimit,`${id} max-speed compatibility alias`);
    close(v.tireGrip/BASE_VEHICLE_TRAITS.tireGrip,row.tireGrip,`${id} grip`);
    close((v.airTilt*v.airControl)/(jeep.airTilt*jeep.airControl),row.airControl,`${id} effective air control`);
    close(v.pitchSupport/BASE_VEHICLE_TRAITS.pitchSupport,row.pitchSupport,`${id} pitch support`);
    close(v.groundDamping/BASE_VEHICLE_TRAITS.groundDamping,row.groundDamping,`${id} ground damping`);
    assert.ok(v.suspensionMin<v.suspensionTravel,`${id} bottom stop must remain inside suspension travel`);
  }
});

test('Jeep remains the exact 1.0 tuning reference',()=>{
  const row=VEHICLE_STAT_TABLE.base;
  for(const key of [
    'mass','motorTorque','enginePower','accelerationLimit','wheelSpeedLimit','tireGrip',
    'airControl','maxRotation','inertia','suspension','suspensionDamping','suspensionTravel',
    'pitchSupport','groundDamping','fuelCapacity','fuelBurn'
  ]){
    assert.equal(row[key],1,`Jeep ${key}`);
  }
});

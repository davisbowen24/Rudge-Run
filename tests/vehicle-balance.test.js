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

test('Jeep suspension travel is 20% longer without changing non-base absolute travel',()=>{
  const jeep=vehicleBase('base');
  const snowmobile=vehicleBase('snowmobile');

  close(jeep.suspensionTravel,21.6,'Jeep suspension travel');
  close(jeep.suspensionMin,7.2,'Jeep suspension minimum');
  // Snowmobile was 18 * 1.4 = 25.2 before the base change; compensation keeps it there.
  close(snowmobile.suspensionTravel,25.2,'Snowmobile absolute suspension travel');
});

test('Snowmobile ground drive-pitch response is reduced by 20 percent',()=>{
  assert.equal(VEHICLE_STAT_TABLE.snowmobile.drivePitch,0.8);
  close(vehicleBase('snowmobile').drivePitch/BASE_VEHICLE_TRAITS.drivePitch,0.8,'Snowmobile drive pitch');
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

import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_VEHICLE_TRAITS } from '../dist/config.js';
import { VEHICLE_ORDER, VEHICLE_STAT_TABLE, UPGRADE_CURVES, upgradeScale, vehicleBase } from '../dist/vehicles.js';
import { createUpgrades } from '../dist/upgrades.js';

function close(actual,expected,label){
  const tolerance=1e-9*Math.max(1,Math.abs(expected));
  assert.ok(Math.abs(actual-expected)<=tolerance,`${label}: expected ${expected}, got ${actual}`);
}

test('shared vehicle baseline raises torque 10 percent and power 5 percent for every vehicle',()=>{
  const previousTorque=135000;
  const previousPower=850000;

  close(BASE_VEHICLE_TRAITS.motorTorque,previousTorque*1.10,'shared base motor torque');
  close(BASE_VEHICLE_TRAITS.enginePower,previousPower*1.05,'shared base engine power');

  for(const id of VEHICLE_ORDER){
    const row=VEHICLE_STAT_TABLE[id];
    const vehicle=vehicleBase(id);
    close(vehicle.engineTorque,previousTorque*1.10*row.motorTorque,id+' absolute motor torque');
    close(vehicle.enginePower,previousPower*1.05*row.enginePower,id+' absolute engine power');
  }
});

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

test('Dune Buggy and Hovercraft power tuning matches requested balance pass',()=>{
  close(VEHICLE_STAT_TABLE.buggy.motorTorque,2.04,'Dune Buggy torque');
  close(VEHICLE_STAT_TABLE.buggy.enginePower,2.635,'Dune Buggy power');
  close(VEHICLE_STAT_TABLE.buggy.pitchSupport,1.265,'Dune Buggy ground stability');
  close(VEHICLE_STAT_TABLE.hovercraft.motorTorque,1.36,'Hovercraft torque');
  close(VEHICLE_STAT_TABLE.hovercraft.enginePower,2.0825,'Hovercraft power');
});

test('Traction upgrades keep stock grip unchanged and reduce upgrade gain by 25 percent',()=>{
  const upgradeSystem=createUpgrades({
    state:{progression:{selected:'base'}},
    save:{levelsFor:()=>({engine:0,suspension:0,tires:0,fuel:0})}
  });

  for(const id of VEHICLE_ORDER){
    const base=vehicleBase(id);
    const stock=upgradeSystem.vehicleStats({engine:0,suspension:0,tires:0,fuel:0},id);

    if(base.tiresUpgrade==='downforce'){
      const maxed=upgradeSystem.vehicleStats({engine:0,suspension:0,tires:5,fuel:0},id);
      close(maxed.tireGrip,stock.tireGrip,id+' downforce vehicle tire grip remains unchanged');
      continue;
    }

    const maxed=upgradeSystem.vehicleStats({engine:0,suspension:0,tires:5,fuel:0},id);
    const oldStockGain=UPGRADE_CURVES.grip[0]*upgradeScale(id,'grip',0);
    const oldMaxGain=UPGRADE_CURVES.grip[5]*upgradeScale(id,'grip',5);
    const expectedGain=oldStockGain+(oldMaxGain-oldStockGain)*.75;

    close(stock.tireGrip,base.tireGrip*oldStockGain,id+' stock traction');
    close(maxed.tireGrip,base.tireGrip*expectedGain,id+' max traction');
  }
});

test('Fuel upgrade leaves stock capacity unchanged and cuts maxed capacity by 30 percent',()=>{
  const upgradeSystem=createUpgrades({
    state:{progression:{selected:'base'}},
    save:{levelsFor:()=>({engine:0,suspension:0,tires:0,fuel:0})}
  });

  for(const id of VEHICLE_ORDER){
    const stock=upgradeSystem.vehicleStats({engine:0,suspension:0,tires:0,fuel:0},id);
    const maxed=upgradeSystem.vehicleStats({engine:0,suspension:0,tires:0,fuel:5},id);
    const base=vehicleBase(id);
    const previousMax=base.fuelCapacity*UPGRADE_CURVES.tank[5]*upgradeScale(id,'tank',5);

    close(stock.fuelCapacity,base.fuelCapacity,id+' stock fuel capacity');
    close(maxed.fuelCapacity,previousMax*.70,id+' max fuel capacity');
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

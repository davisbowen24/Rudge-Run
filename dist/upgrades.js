import { OFFROAD_DOWNFORCE_REFERENCE, UPGRADES, UPGRADE_CURVES, VEHICLES, upgradeScale, vehicleBase } from './vehicles.js';
import { MAX_LEVEL } from './config.js';

export function createUpgrades({ state, save }) {

  function upgradeEntry(key,id=state.progression.selected){
    if(VEHICLES[id].tiresUpgrade==='downforce'&&key==='tires')
    return {name:'Downforce',description:'Pushes toward the underside of the tracks, even at low speed. Compressed tracks gain extra bite for powerful acceleration.'};
    if(VEHICLES[id].suspensionUpgrade==='airControl'&&key==='suspension')
    return {name:'Air Control',description:'Stronger airborne rotation and faster corrections. Independent of the engine; suspension stays fixed.'};
    return UPGRADES[key];
  }

  function vehicleStats(levels=save.levelsFor(),id=state.progression.selected){

    const base=vehicleBase(id),u=UPGRADE_CURVES;

    const gain=(key,level)=>u[key][level]*upgradeScale(id,key,level);

    const tireLevel=base.tiresUpgrade==='downforce'?0:levels.tires;

    const suspensionLevel=base.suspensionUpgrade==='airControl'?0:levels.suspension;

    const rawGripGain=gain('grip',tireLevel);
    const stockGripGain=gain('grip',0);
    // Preserve each vehicle's current level-0 traction, but make every tire-upgrade
    // gain above stock 25% less effective. Vehicles using the separate Downforce
    // upgrade keep tireLevel at 0 and are therefore unchanged.
    const tractionGain=stockGripGain+(rawGripGain-stockGripGain)*.75;
    const mu=base.tireGrip*tractionGain,power=gain('power',levels.engine);
    // Keep stock fuel unchanged, then progressively reduce the old fuel-upgrade capacity
    // so a maxed tank has 70% of its previous capacity/endurance.
    const fuelUpgradeScale=1-.30*(levels.fuel/MAX_LEVEL);
    // Fixed at the former max-engine air strength, independent of purchased Engine levels.
    // The motorcycle retains its separate Air Control upgrade and its original normalization.
    const airGain=base.suspensionUpgrade==='airControl'?gain('airControl',levels.suspension):1;
    const maxEnginePower=gain('power',MAX_LEVEL);
    const fixedAirFactor=base.suspensionUpgrade==='airControl'?UPGRADE_CURVES.power[0]/10
      :['atv','rover'].includes(id)
        ?(UPGRADE_CURVES.power[0]/10)*Math.sqrt(maxEnginePower/UPGRADE_CURVES.power[0])
        :maxEnginePower/10;

    return {...base,
 downforce:base.tiresUpgrade==='downforce'?u.downforce[levels.tires]*OFFROAD_DOWNFORCE_REFERENCE*base.downforceScale:0,
 downforceGrip:base.tiresUpgrade==='downforce'?2.5*levels.tires/MAX_LEVEL*upgradeScale(id,'trackGrip',levels.tires):0,
 airTilt:base.airTilt*.8*fixedAirFactor*airGain,
 acceleration:base.acceleration*gain('torque',levels.engine),wheelSpeedLimit:base.wheelSpeedLimit*Math.cbrt(power/UPGRADE_CURVES.power[0]),enginePower:base.enginePower*power,engineTorque:base.engineTorque*gain('torque',levels.engine),
 suspension:base.suspension*gain('spring',suspensionLevel),suspensionDamping:base.suspensionDamping*gain('damping',suspensionLevel),
 inertia:base.inertia,comOffsetY:base.comOffsetY+(base.tracked?Math.min(8,2*suspensionLevel):3.8*suspensionLevel),
 tireGrip:mu,staticGrip:mu,dynamicGrip:mu*u.dynamic[tireLevel],
 fuelCapacity:base.fuelCapacity*gain('tank',levels.fuel)*fuelUpgradeScale,fuelBurn:base.fuelBurn*gain('burn',levels.fuel)};

  }

  return { upgradeEntry, vehicleStats };

}

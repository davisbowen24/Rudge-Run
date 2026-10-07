import { OFFROAD_DOWNFORCE_REFERENCE, UPGRADES, UPGRADE_CURVES, VEHICLES, upgradeScale, vehicleBase } from './vehicles.js';
import { MAX_LEVEL } from './config.js';

export function createUpgrades({ state, save }) {

  function upgradeEntry(key,id=state.progression.selected){
    if(VEHICLES[id].tiresUpgrade==='downforce'&&key==='tires')
    return {name:'Downforce',description:'Pushes toward the underside of the tracks, even at low speed. Compressed tracks gain extra bite for powerful acceleration.'};
    if(VEHICLES[id].suspensionUpgrade==='airControl'&&key==='suspension')
    return {name:'Air Control',description:'Stronger airborne rotation and faster corrections. Independent of the engine; suspension stays fixed.'};
    if(key==='engine'&&VEHICLES[id].suspensionUpgrade!=='airControl')
    return {...UPGRADES.engine,description:'More axle torque and engine power. Air-control strength increases in direct proportion to power.'};
    return UPGRADES[key];
  }

  function vehicleStats(levels=save.levelsFor(),id=state.progression.selected){

    const base=vehicleBase(id),u=UPGRADE_CURVES;

    const gain=(key,level)=>u[key][level]*upgradeScale(id,key,level);

    const tireLevel=base.tiresUpgrade==='downforce'?0:levels.tires;

    const suspensionLevel=base.suspensionUpgrade==='airControl'?0:levels.suspension;

    const mu=base.tireGrip*gain('grip',tireLevel),power=gain('power',levels.engine);
    // Keep stock fuel unchanged, then progressively reduce the old fuel-upgrade capacity
    // so a maxed tank has 70% of its previous capacity/endurance.
    const fuelUpgradeScale=1-.30*(levels.fuel/MAX_LEVEL);
    // ATV and Moon Rover are intentionally agile, but direct linear engine-power scaling made
    // high upgrade levels snap to their rotation caps almost instantly. Keep their air control
    // increasing with engine power, but use a square-root response for predictable corrections.
    const powerAirFactor=['atv','rover'].includes(id)
      ?(UPGRADE_CURVES.power[0]/10)*Math.sqrt(power/UPGRADE_CURVES.power[0])
      :power/10;

    return {...base,
 downforce:base.tiresUpgrade==='downforce'?u.downforce[levels.tires]*OFFROAD_DOWNFORCE_REFERENCE*base.downforceScale:0,
 downforceGrip:base.tiresUpgrade==='downforce'?2.5*levels.tires/MAX_LEVEL*upgradeScale(id,'trackGrip',levels.tires):0,
 airTilt:base.airTilt*.8*(base.suspensionUpgrade==='airControl'?gain('airControl',levels.suspension)*UPGRADE_CURVES.power[0]/10:powerAirFactor),
 acceleration:base.acceleration*gain('torque',levels.engine),wheelSpeedLimit:base.wheelSpeedLimit*Math.cbrt(power/UPGRADE_CURVES.power[0]),enginePower:base.enginePower*power,engineTorque:base.engineTorque*gain('torque',levels.engine),
 suspension:base.suspension*gain('spring',suspensionLevel),suspensionDamping:base.suspensionDamping*gain('damping',suspensionLevel),
 inertia:base.inertia,comOffsetY:base.comOffsetY+(base.tracked?Math.min(8,2*suspensionLevel):3.8*suspensionLevel),
 tireGrip:mu,staticGrip:mu,dynamicGrip:mu*u.dynamic[tireLevel],
 fuelCapacity:base.fuelCapacity*gain('tank',levels.fuel)*fuelUpgradeScale,fuelBurn:base.fuelBurn*gain('burn',levels.fuel)};

  }

  return { upgradeEntry, vehicleStats };

}

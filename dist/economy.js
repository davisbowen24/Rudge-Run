import { CONFIG, MAX_LEVEL, MILESTONES } from './config.js';
import { BASE_MAP_TRAITS, MAPS } from './maps.js';
import { UPGRADES, UPGRADE_PRICES, VEHICLES } from './vehicles.js';
import { $ } from './utils.js';

export function createEconomy({ stats, moments, state, terrain, save, ui, upgrades }) {

  function runMeters(x){
    return Math.max(0,(x-140)/CONFIG.world.pixelsPerMeter);
  }

  function fuelGapAt(baseGapMeters){
    return Math.min(CONFIG.pickups.maxFuelGapMeters,baseGapMeters*(MAPS[state.activeMap].fuelSpacing/BASE_MAP_TRAITS.fuelSpacing))*CONFIG.world.pixelsPerMeter;
  }

  function coinFrequencyAt(distance){
    return 1+3*Math.min(Math.max(0,distance)/15000,1);
  }

  function coinGroupSpacingAt(distance,count=5){
    return (count+2)*CONFIG.pickups.coinSpacing*2/coinFrequencyAt(distance);
  }

  function safeFuelX(target,previous){
    const limit=previous+CONFIG.pickups.maxFuelGapMeters*CONFIG.world.pixelsPerMeter;
    let x=terrain.safePickupX(target);
    if(x<=limit)
    return x;
    for(x=Math.min(target,limit);x>previous;x-=20)
    if(terrain.safePickupX(x)===x)
    return x;
    return target;
  }

  function checkpointDistance(n,id=state.activeMap){
    const distance=n<=MILESTONES.length?MILESTONES[n-1]:5000+Math.round(1800*(Math.pow(1.3,n-MILESTONES.length)-1)/.3/50)*50;
    return Math.round(distance*MAPS[id].checkpointSpacing);
  }

  function milestoneReward(number,id=state.activeMap){
    const distance=checkpointDistance(number,id),t=Math.max(0,Math.min(1,(distance-150)/4850));
    return Math.min(50000,Math.round((50+49950*t*t)/10)*10);
  }

  function nextGoal(map){
    let n=1;
    while(checkpointClaimed(n,map))
    n++;
    return {number:n,distance:checkpointDistance(n,map),reward:milestoneReward(n,map)};
  }

  function coinTierAt(x){
    const d=Math.max(0,runMeters(x)),p=CONFIG.progression,value=Math.max(1,Math.floor(d/4));
    if(d>=p.goldMeters)
    return {name:'Gold',value,rim:'#a77828',face:'#ffd36c',inner:'#ecb547'};
    if(d>=p.silverMeters)
    return {name:'Silver',value,rim:'#647c8c',face:'#e6edf2',inner:'#b6cbd7'};
    return {name:'Bronze',value,rim:'#825235',face:'#dda16f',inner:'#bb784d'};
  }

  function nextFuelMeters(){
    const ahead=state.items.filter(i=>i.type==='fuel'&&!i.taken&&i.x>=state.car.x).map(i=>i.x);
    return Math.max(0,Math.ceil((Math.min(state.nextFuel,...ahead)-state.car.x)/CONFIG.world.pixelsPerMeter));
  }

  function upgradeCost(key){
    return UPGRADE_PRICES[state.progression.selected][save.levelsFor()[key]]??0;
  }

  function generate(){
    const edge=Math.max(state.furthest,state.car.x)+2400;
// Preserve the opening four-coin cluster, then five-coin clusters and their internal spacing.
// Frequency changes the distance between group starts, not the number of coins per group.

    while(state.nextCoin<edge){
      const count=state.coinGroupIndex===0?4:5;
      for(let i=0;i<count;i++){
        const x=terrain.safePickupX(state.nextCoin+i*CONFIG.pickups.coinSpacing);
        state.items.push({x,y:terrain.ground(x)-65,type:'coin',tier:coinTierAt(x),taken:false});
      }
      state.nextCoin+=coinGroupSpacingAt(runMeters(state.nextCoin),count);
      state.coinGroupIndex++;
    }

    while(state.nextFuel<edge){
      const x=state.previousFuel===140?state.nextFuel:safeFuelX(state.nextFuel,state.previousFuel);
      state.items.push({x,y:terrain.ground(x)-67,type:'fuel',taken:false});
      state.previousFuel=x;
      state.gasGap=Math.min(CONFIG.pickups.maxFuelGapMeters,state.gasGap+CONFIG.pickups.fuelGapIncrement);
      state.nextFuel=state.previousFuel+fuelGapAt(state.gasGap);
    }

    state.items=state.items.filter(i=>i.x>state.car.x-2700);
  }

  function recordBest(){
    state.progression.best[state.activeMap]=Math.max(state.progression.best[state.activeMap],Math.floor(runMeters(state.furthest)));
    save.saveProgress();
  }

  function awardCoins(amount){
    stats.coins(amount);
    state.coins+=amount;
    state.progression.balance+=amount;
    save.saveProgress();
  }

  function updateTricks(delta,grounded,dt){
    if(grounded){
      state.airRotation=0;
      state.airTime=0;
      return;
    }
    state.airTime+=dt;
    state.airRotation+=delta;
    const turn=Math.PI*2;
    while(Math.abs(state.airRotation)>=turn){
      const direction=Math.sign(state.airRotation);
      state.airRotation-=direction*turn;
      const reward=Math.max(1,Math.floor(runMeters(state.car.x)));
      stats.flip();
      awardCoins(reward);
      moments.emit('flip',{direction:direction<0?'BACKFLIP':'FRONTFLIP',reward});
    }
  }

  function checkpointClaimed(number,map=state.activeMap){
    return state.progression.checkpoints[map].includes(String(checkpointDistance(number,map)));
  }

  function updateCheckpoints(){
    while(state.furthest>=140+checkpointDistance(state.nextCheckpoint)*CONFIG.world.pixelsPerMeter){
      const number=state.nextCheckpoint++,distance=checkpointDistance(number),claimed=checkpointClaimed(number),reward=milestoneReward(number);
      stats.checkpoint();
      if(!claimed){
        state.progression.checkpoints[state.activeMap].push(String(distance));
        awardCoins(reward);
        moments.emit('checkpoint',{distance,reward,claimed:false});
      }else
      moments.emit('checkpoint',{distance,reward:0,claimed:true});
    }
  }

  function buyUpgrade(key){
    if(state.screen!=='garage'||!state.progression.owned.includes(state.progression.selected)||!Object.hasOwn(UPGRADES,key)||save.levelsFor()[key]>=MAX_LEVEL)
    return false;
    const cost=upgradeCost(key);
    if(state.progression.balance<cost)
    return false;
    state.progression.balance-=cost;
    save.levelsFor()[key]++;
    state.progression.upgradeSpent[state.progression.selected]+=cost;
    save.saveProgress();
    ui.renderGarage();
    moments.emit('upgrade',{major:save.levelsFor()[key]>=3,title:upgrades.upgradeEntry(key).name,detail:`${VEHICLES[state.progression.selected].name} · Level ${save.levelsFor()[key]+1}${save.levelsFor()[key]===MAX_LEVEL?' · MAXED OUT':''}`,target:'[data-upgrade="'+key+'"]'});
    $('garageMessage').textContent=`${VEHICLES[state.progression.selected].name}: ${upgrades.upgradeEntry(key).name} upgraded to level ${save.levelsFor()[key]+1}. Ready for your next run.`;
    return true;
  }

  function unlockVehicle(id){
    if(state.screen!=='store'||!Object.hasOwn(VEHICLES,id)||state.progression.owned.includes(id))
    return false;
    const price=VEHICLES[id].price;
    if(state.progression.balance<price)
    return false;
    state.progression.balance-=price;
    state.progression.owned.push(id);
    save.saveProgress();
    ui.renderStore();
    moments.emit('unlock',{subject:'vehicle',title:VEHICLES[id].name,detail:'Your next ride is ready',target:'[data-vehicle="'+id+'"]'});
    $('storeMessage').textContent=`${VEHICLES[id].name} unlocked. Select it to take it out on the trail.`;
    return true;
  }

  function selectVehicle(id){
    if(state.screen!=='store'||!state.progression.owned.includes(id)||!Object.hasOwn(VEHICLES,id))
    return false;
    state.progression.selected=id;
    save.saveProgress();
    ui.renderStore();
    $('storeMessage').textContent=`${VEHICLES[id].name} selected for your next run.`;
    return true;
  }

  function unlockMap(id){
    if(state.screen!=='maps'||!Object.hasOwn(MAPS,id)||state.progression.ownedMaps.includes(id)||state.progression.balance<MAPS[id].price)
    return false;
    state.progression.balance-=MAPS[id].price;
    state.progression.ownedMaps.push(id);
    save.saveProgress();
    ui.renderMaps();
    moments.emit('unlock',{subject:'map',title:MAPS[id].name,detail:'A new horizon awaits',target:'[data-map="'+id+'"]'});
    $('mapMessage').textContent=MAPS[id].name+' unlocked. Select it for your next run.';
    return true;
  }

  function selectMap(id){
    if(state.screen!=='maps'||!state.progression.ownedMaps.includes(id)||!Object.hasOwn(MAPS,id))
    return false;
    state.progression.selectedMap=id;
    save.saveProgress();
    ui.renderMaps();
    $('mapMessage').textContent=MAPS[id].name+' selected.';
    return true;
  }

  return { runMeters, fuelGapAt, coinFrequencyAt, coinGroupSpacingAt, safeFuelX, checkpointDistance, milestoneReward, nextGoal, coinTierAt, nextFuelMeters, upgradeCost, generate, recordBest, awardCoins, updateTricks, checkpointClaimed, updateCheckpoints, buyUpgrade, unlockVehicle, selectVehicle, unlockMap, selectMap };

}

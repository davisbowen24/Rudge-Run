import { canvasFont, UI_THEME } from './theme.js';
import { $, clamp } from './utils.js';
import { CONFIG, MAX_LEVEL } from './config.js';
import { MAPS, MAP_CATALOG, MAP_TIERS, SEASONS } from './maps.js';
import { UPGRADES, UPGRADE_PROFILES, VEHICLES, VEHICLE_ORDER, VEHICLE_TIERS, vehicleBase } from './vehicles.js';

export function createUi({ stats, workshop, moments, state, economy, terrain, save, input, upgrades, physics, render, main }) {

  function resize(){
    state.W=innerWidth;
    state.H=innerHeight;
    state.dpr=Math.min(devicePixelRatio||1,2);
    state.canvas.width=Math.round(state.W*state.dpr);
    state.canvas.height=Math.round(state.H*state.dpr);
    state.scale=clamp(Math.min(state.W/1150,state.H/720),.6,1.35);
  }

  function end(reason){
    if(!state.playing)
    return;
    economy.recordBest();
    state.playing=false;
    stats.finish();
    $('reason').textContent=reason;
    $('tip').textContent=reason==='Out of fuel'?'Keep moving and grab the red fuel cans.':reason==='Fell into the construction pit'?'Build speed across the concrete slab and aim for the steel landing.':reason==='Fell between rooftops'?'Build speed on the flat roof and launch from its ramp.':reason==='Hit the cave ceiling'?'Keep jumps low and level the vehicle before tight passages.':reason==='Lost in the haunted trench'?'Land on the spectral steps before leaping to the far bank.':reason==='Fell into a crevasse'?'Build speed before the ice jump.':reason==='Landed in lava'?'Use the launch ridge and rising thermal air to clear the crater.':'Use gas and brake in the air to land on your wheels.';
    $('finalDistance').textContent=Math.floor((state.furthest-140)/10)+' m';
    $('finalCoins').textContent=state.coins;
    showScreen('over');
    $('again').focus();
  }

  function updateHUD(){
    const pct=Math.max(0,state.fuel/CONFIG.vehicle.fuelCapacity*100);
    $('distance').textContent=Math.floor((state.furthest-140)/10).toLocaleString('en-US');
    $('coins').textContent=moments.coinValue().toLocaleString('en-US');
    $('mapLabel').textContent=terrain.difficultyAt(state.furthest).stage+' · '+MAPS[state.activeMap].name+(MAPS[state.activeMap].flags.seasons?' · '+SEASONS[state.seasonIndex].name:'');
    $('nextFuelLabel').textContent='⛽ '+economy.nextFuelMeters().toLocaleString('en-US')+' m';
    $('roadLabel').textContent=terrain.surfaceAt(state.car.x).label+' · '+economy.coinTierAt(state.furthest).name+' coins: '+economy.coinTierAt(state.furthest).value;
    $('checkpointLabel').textContent='⚑ '+Math.max(0,economy.checkpointDistance(state.nextCheckpoint)-Math.floor(economy.runMeters(state.furthest))).toLocaleString('en-US')+' m to checkpoint · '+(economy.checkpointClaimed(state.nextCheckpoint)?'Bonus claimed':('+'+economy.milestoneReward(state.nextCheckpoint)+' coins'));
    $('fuelBox').setAttribute('data-level',pct<10?'critical':pct<25?'low':'normal');
    $('fuelText').textContent=Math.ceil(pct)+'%';
    $('fuelFill').style.width=pct+'%';

    $('fuelTrack').setAttribute('aria-valuenow',Math.round(pct));
  }

  function showBonus(title,detail){ moments.notify(title,detail); }

  function drawBonuses(){ moments.drawPopups(); }

  function pauseRun(){
    if(state.screen!=='run'||!state.playing)
    return;
    economy.recordBest();
    state.paused=true;
    showScreen('paused');
    $('pauseSummary').textContent=Math.floor(economy.runMeters(state.furthest))+' m · '+state.coins.toLocaleString('en-US')+' coins earned';
    $('resumeRun').focus();
  }

  function resumeRun(){
    if(state.screen!=='paused'||!state.playing)
    return;
    state.paused=false;
    state.accumulator=0;
    state.last=performance.now();
    showScreen('run');
  }

  function exitToGarage(){
    if(state.screen!=='paused'||!state.playing)
    return;
    economy.recordBest();
    stats.finish();
    save.saveProgress();
    state.playing=false;
    state.paused=false;
    state.accumulator=0;
    state.garageReturn='start';
    showScreen('garage');
    renderGarage();
    $('garageMessage').textContent='Run ended at '+Math.floor(economy.runMeters(state.furthest))+' m. All '+state.coins.toLocaleString('en-US')+' coins earned are saved.';
    $('garageVehicle').focus();
  }

  function showScreen(next){
    const goal=economy.nextGoal(state.progression.selectedMap);
    $('startGoal').textContent=MAPS[state.progression.selectedMap].name+' · Best '+state.progression.best[state.progression.selectedMap]+' m · Next goal '+goal.distance+' m (+'+goal.reward+' coins)';
    state.screen=next;
    document.body.dataset.screen=next;
    input.clearControls();
    $('pauseScreen').hidden=next!=='paused';
    $('startScreen').hidden=next!=='start';
    $('garageScreen').hidden=next!=='garage';
    $('storeScreen').hidden=next!=='store';
    $('mapScreen').hidden=next!=='maps';
    $('statsScreen').hidden=next!=='stats';
    $('selectedStart').textContent=VEHICLES[state.progression.selected].name;
    $('selectedGarage').textContent=VEHICLES[state.progression.selected].name+' · '+UPGRADE_PROFILES[state.progression.selected].focus;
    $('overlay').hidden=next!=='over';
    $('pause').hidden=true;
    for(const id of ['startBalance','endBalance','garageBalance','storeBalance','mapBalance'])
    $(id).textContent=state.progression.balance;
  }

  function openGarage(){
    if(state.screen!=='start'&&state.screen!=='over')
    return;
    state.garageReturn=state.screen;
    state.playing=false;
    showScreen('garage');
    renderGarage();
    $('garageMessage').textContent='';
    $('garageBack').focus();
  }

  function closeGarage(){
    if(state.garageReturn==='store'){showScreen('store');renderStore();$('storeBack').focus();return;}
    showScreen(state.garageReturn);
    $(state.garageReturn==='start'?'startGarage':'endGarage').focus();
  }

  function statSummary(key,stats){
    const BASE_VEHICLE=vehicleBase(state.progression.selected);
    switch(key){case 'engine':
    return `Power ${Math.round(stats.enginePower/BASE_VEHICLE.enginePower*100)}% · Axle torque ${Math.round(stats.engineTorque/BASE_VEHICLE.engineTorque*100)}%${VEHICLES[state.progression.selected].suspensionUpgrade==='airControl'?'':` · Air acceleration ${(stats.airTilt*stats.airControl).toFixed(2)} rad/s²`}`;case 'suspension':
    if(VEHICLES[state.progression.selected].suspensionUpgrade==='airControl')
    return `Air acceleration ${(stats.airTilt*stats.airControl).toFixed(2)} rad/s² · Spin cap ${stats.maxRotation.toFixed(1)} rad/s`;
    return `Springs ${Math.round(stats.suspension/BASE_VEHICLE.suspension*100)}% · Damping ${Math.round(stats.suspensionDamping/BASE_VEHICLE.suspensionDamping*100)}%`;case 'tires':
    if(VEHICLES[state.progression.selected].tiresUpgrade==='downforce')
    return `Track load +${Math.round(stats.downforce*100)}% local weight · Compressed grip ×${(1+stats.downforceGrip).toFixed(1)}`;
    return `Static grip ${stats.staticGrip.toFixed(2)} · Sliding grip ${stats.dynamicGrip.toFixed(2)}`;case 'fuel':
    return `Capacity ${Math.round(stats.fuelCapacity)} · ${Math.round(stats.fuelCapacity/(stats.fuelBurn*1.12))}s at full throttle`;}
  }

  function upgradeBenefit(key,current,next){

    const increase=(a,b)=>Math.round((b/a-1)*100);

    switch(key){
 case 'engine':
    return `+${increase(current.enginePower,next.enginePower)}% power · +${increase(current.engineTorque,next.engineTorque)}% climbing torque`;
 case 'suspension':
    return VEHICLES[state.progression.selected].suspensionUpgrade==='airControl'?`+${increase(current.airTilt,next.airTilt)}% air acceleration; same spin cap`:`+${increase(current.suspensionDamping,next.suspensionDamping)}% landing damping · +${increase(current.suspension,next.suspension)}% spring support`;
 case 'tires':
    return VEHICLES[state.progression.selected].tiresUpgrade==='downforce'?`+${increase(1+current.downforceGrip,1+next.downforceGrip)}% fully compressed track grip`:`+${increase(current.staticGrip,next.staticGrip)}% hill traction · +${increase(current.dynamicGrip,next.dynamicGrip)}% sliding grip`;
 case 'fuel':
    return `+${increase(current.fuelCapacity/current.fuelBurn,next.fuelCapacity/next.fuelBurn)}% driving time per full tank`;
 }

  }

  function renderGarage(){
    $('garageVehicle').innerHTML=VEHICLE_ORDER.filter(id=>state.progression.owned.includes(id)).map(id=>`<option value="${id}" ${id===state.progression.selected?'selected':''}>${VEHICLES[id].name}</option>`).join('');
    const goal=economy.nextGoal(state.progression.selectedMap);
    $('garageInvestment').textContent='Best on '+MAPS[state.progression.selectedMap].name+': '+state.progression.best[state.progression.selectedMap]+' m · Next goal: '+goal.distance+' m (+'+goal.reward+' coins)';
    $('selectedGarage').textContent=VEHICLES[state.progression.selected].name+' · '+UPGRADE_PROFILES[state.progression.selected].focus;
    $('garageBalance').textContent=state.progression.balance.toLocaleString('en-US');
    workshop.garage();
  }

  function openStore(){
    if(!['start','garage'].includes(state.screen))
    return;
    state.storeReturn=state.screen;
    state.playing=false;
    workshop.enter();
    showScreen('store');
    renderStore();
    $('storeMessage').textContent='';
    $('storeBack').focus();
  }

  function closeStore(){
    $('resetConfirm').hidden=true;
    showScreen(state.storeReturn);
    if(state.storeReturn==='garage')
    renderGarage();
    $(state.storeReturn==='garage'?'garageStore':'startStore').focus();
  }

  function renderStore(){ workshop.store(); }

  function resetAllProgress(){

    if(state.screen!=='store')
    return false;

    state.progression=save.freshProgress();
    save.saveProgress();

    main.reset();
    state.playing=false;

    state.storeReturn='start';
    $('resetConfirm').hidden=true;

    workshop.enter();
    showScreen('store');
    renderStore();

    $('storeMessage').textContent='Progress reset. Your Jeep and Countryside are ready for a fresh start.';

    $('resetProgress').focus();
    return true;

  }

  function openMaps(){
    if(!['start','garage','store','over'].includes(state.screen))
    return;
    state.mapReturn=state.screen;
    state.playing=false;
    showScreen('maps');
    renderMaps();
    $('mapMessage').textContent='';
    $('mapBack').focus();
  }

  function closeMaps(){
    showScreen(state.mapReturn);
    if(state.mapReturn==='garage')
    renderGarage();
    if(state.mapReturn==='store')
    renderStore();
    $(state.mapReturn==='garage'?'garageDrive':state.mapReturn==='store'?'storeDrive':state.mapReturn==='over'?'again':'startRun').focus();
  }

  function renderMaps(){
    $('mapBalance').textContent=state.progression.balance.toLocaleString('en-US');
    $('mapSelected').textContent=VEHICLES[state.progression.selected].name+' · '+MAPS[state.progression.selectedMap].name;
    $('mapCards').innerHTML=MAP_CATALOG.map(([id,price,tier],index)=>{
      const m=MAPS[id];
      const owned=state.progression.ownedMaps.includes(id),selected=id===state.progression.selectedMap,affordable=state.progression.balance>=m.price;
      return `<article class="map-card ${selected?'selected':''}" data-status="${selected?'equipped':owned?'owned':'locked'}"><div class="vehicle-tag">${index+1} · Tier ${tier}: ${MAP_TIERS[tier-1]}</div><h2>${m.name}</h2><canvas id="map-preview-${id}" width="500" height="150" aria-label="${m.name} terrain preview"></canvas><p>${m.description}</p><div class="map-physics">Gravity: ${Number(m.gravity.toFixed(3))} m/s² · Grip: ${m.gripLabel}<br>${m.flags.seasons?`New season every ${m.seasonDistance} m`:m.terrainLabel}</div><div class="map-physics">Best ${state.progression.best[id]} m · Next goal ${economy.nextGoal(id).distance} m</div><div class="price-line">${owned?(selected?'Selected':'Owned'):m.price.toLocaleString('en-US')+' coins'}</div><button class="buy" data-map="${id}" data-action="${owned?'select':'unlock'}" ${selected||(!owned&&!affordable)?'disabled':''}>${owned?(selected?'Selected':'Select'):'Unlock · '+m.price.toLocaleString('en-US')+' coins'}</button>${!owned&&!affordable?`<div style="font-size:12px;color:var(--text-secondary);margin-top:8px">Need ${(m.price-state.progression.balance).toLocaleString('en-US')} more coins</div>`:''}</article>`;
    }).join('');
    for(const [id,m] of Object.entries(MAPS)){
      const g=$('map-preview-'+id).getContext('2d');
      g.fillStyle=m.sky[0];
      g.fillRect(0,0,500,150);
      if(m.flags.seasons){
        for(let i=0;i<4;i++){
          g.fillStyle=SEASONS[i].sky[0];
          g.fillRect(i*125,0,125,150);
          g.fillStyle=UI_THEME.colors.secondary;
          g.font=canvasFont(12,700);
          g.fillText(SEASONS[i].name,i*125+12,24);
        }
      }else{
        g.beginPath();
        g.arc(415,32,16,0,Math.PI*2);
        g.fillStyle=m.flags.starfield?'#a4cbdc':'#f8e5ad';
        g.fill();
      }
      g.beginPath();
      g.moveTo(0,150);
      for(let x=0;x<=500;x+=2)
      g.lineTo(x,Math.min(148,80+(terrain.terrainHeight(id,800+x*6)-90)*.28));
      g.lineTo(500,150);
      g.closePath();
      g.fillStyle=m.soil;
      g.fill();
      g.strokeStyle=m.edge;
      g.lineWidth=4;
      g.stroke();
      if(m.flags.ceiling){
        g.beginPath();
        g.moveTo(0,0);
        for(let x=0;x<=500;x+=2)
        g.lineTo(x,80+(terrain.caveCeiling(800+x*6,id)-90)*.28);
        g.lineTo(500,0);
        g.closePath();
        g.fillStyle='#252e37';
        g.fill();
      }
    }
  }

  function bindEvents() {

    $('pauseButton').addEventListener('click',pauseRun);

    $('resumeRun').addEventListener('click',resumeRun);

    $('quitGarage').addEventListener('click',exitToGarage);

    $('again').addEventListener('click',openMaps);

    $('upgradeCards').addEventListener('click',e=>{
      const button=e.target.closest('[data-upgrade]');
      if(button){
        const key=button.dataset.upgrade;
        economy.buyUpgrade(key);
        const next=$('upgradeCards').querySelector(`[data-upgrade="${key}"]`);
        if(next&&!next.disabled)
        next.focus();else
        $('garageDrive').focus();
      }
    });

    $('garageVehicle').addEventListener('change',e=>{
      const id=e.target.value;
      if(state.screen!=='garage'||!state.progression.owned.includes(id))
      return;
      workshop.move(id);
      $('garageMessage').textContent='Upgrades below apply only to '+VEHICLES[id].name+'.';
    });

    $('startRun').addEventListener('click',openMaps);

    $('garageDrive').addEventListener('click',openMaps);

    $('startGarage').addEventListener('click',openGarage);

    $('endGarage').addEventListener('click',openGarage);

    $('garageBack').addEventListener('click',closeGarage);

    $('resetProgress').addEventListener('click',()=>{
      if(state.screen==='store'){
        $('resetConfirm').hidden=false;
        $('cancelReset').focus();
      }
    });

    $('cancelReset').addEventListener('click',()=>{
      $('resetConfirm').hidden=true;
      $('resetProgress').focus();
    });

    $('confirmReset').addEventListener('click',resetAllProgress);

    $('vehicleCards').addEventListener('click',e=>{
      const b=e.target.closest('[data-vehicle]');
      if(!b)
      return;
      const id=b.dataset.vehicle;
      if(b.dataset.action==='unlock')
      economy.unlockVehicle(id);else
      economy.selectVehicle(id);
      const next=$('vehicleCards').querySelector(`[data-vehicle="${id}"]`);
      if(next&&!next.disabled)
      next.focus();else
      $('storeDrive').focus();
    });

    $('startStore').addEventListener('click',openStore);

    $('garageStore').addEventListener('click',openStore);

    $('storeBack').addEventListener('click',closeStore);

    $('storeDrive').addEventListener('click',openMaps);

    $('mapCards').addEventListener('click',e=>{
      const b=e.target.closest('[data-map]');
      if(!b)
      return;
      const id=b.dataset.map;
      if(b.dataset.action==='unlock')
      economy.unlockMap(id);else
      economy.selectMap(id);
      const next=$('mapCards').querySelector(`[data-map="${id}"]`);
      if(next&&!next.disabled)
      next.focus();else
      $('mapDrive').focus();
    });

    $('mapBack').addEventListener('click',closeMaps);

    $('mapDrive').addEventListener('click',main.reset);

  }

  return { resize, end, updateHUD, showBonus, drawBonuses, pauseRun, resumeRun, exitToGarage, showScreen, openGarage, closeGarage, statSummary, upgradeBenefit, renderGarage, openStore, closeStore, renderStore, resetAllProgress, openMaps, closeMaps, renderMaps, bindEvents };

}

import { CONFIG } from './config.js';
import { MAPS, MAP_CATALOG } from './maps.js';
import { VEHICLES, VEHICLE_ORDER } from './vehicles.js';
import { $ } from './utils.js';

const totals={totalDistance:0,totalRuns:0,totalCoins:0,totalFlips:0,fuelCans:0,checkpoints:0};
const records={bestDistance:0,mostCoins:0,longestJump:0,longestAirtime:0,mostFlipsJump:0,mostFlipsRun:0};
const labels={bestDistance:'Longest run distance',mostCoins:'Most coins in one run',longestJump:'Longest jump',longestAirtime:'Longest airtime',mostFlipsJump:'Most flips in one jump',mostFlipsRun:'Most flips in one run',totalDistance:'Total distance driven',totalRuns:'Total runs',totalCoins:'Total coins earned',totalFlips:'Total flips',fuelCans:'Fuel cans collected',checkpoints:'Checkpoints reached'};
const valid=n=>Number.isFinite(n)&&n>=0?n:0;
export function freshStats(){return {version:1,global:{...totals,...records},maps:Object.fromEntries(Object.keys(MAPS).map(id=>[id,{bestDistance:0,vehicleId:null}])),vehicles:Object.fromEntries(Object.keys(VEHICLES).map(id=>[id,{...totals,...records}])),lastRun:null};}
export function normalizeStats(raw,legacy={}){
  const out=freshStats();
  for(const key of Object.keys(out.global))out.global[key]=valid(raw?.global?.[key]);
  for(const id of Object.keys(VEHICLES))for(const key of Object.keys(out.global))out.vehicles[id][key]=valid(raw?.vehicles?.[id]?.[key]);
  for(const id of Object.keys(MAPS)){
    const r=raw?.maps?.[id],old=valid(legacy[id]);out.maps[id].bestDistance=Math.max(valid(r?.bestDistance),old);
    if(r?.bestDistance>=old&&Object.hasOwn(VEHICLES,r?.vehicleId))out.maps[id].vehicleId=r.vehicleId;
    out.global.bestDistance=Math.max(out.global.bestDistance,out.maps[id].bestDistance);
  }
  if(raw?.lastRun&&Object.hasOwn(MAPS,raw.lastRun.mapId)&&Object.hasOwn(VEHICLES,raw.lastRun.vehicleId)){
    out.lastRun={mapId:raw.lastRun.mapId,vehicleId:raw.lastRun.vehicleId};
    for(const key of [...Object.keys(records),...Object.keys(totals)])out.lastRun[key]=valid(raw.lastRun[key]);
    out.lastRun.broken=Array.isArray(raw.lastRun.broken)?raw.lastRun.broken.filter(s=>typeof s==='string').slice(0,30):[];
  }
  return out;
}

/** Read-only observers of physics and reward events; no gameplay tuning here. */
export function createStats({state,economy,save,ui,moments}){
  let run=null,flight=null,previousX=0,wasGrounded=false,sequenceFlips=0,tab='career',vehicle='base';
  const num=n=>Math.floor(n||0).toLocaleString('en-US');
  const format=(key,n)=>key==='longestAirtime'?`${(n||0).toFixed(2)} s`:/Distance|Jump$/.test(key)&&key!=='mostFlipsJump'?`${num(n)} m`:num(n);
  function prepare(){run=null;flight=null;wasGrounded=false;sequenceFlips=0;previousX=state.car.x;}
  function begin(){
    if(run)return;
    run={...totals,...records,mapId:state.activeMap,vehicleId:state.progression.selected,broken:[],finished:false};
    run.totalRuns=1;previousX=state.car.x;wasGrounded=state.car.grounded;
  }
  function beforeStep(){begin();previousX=state.car.x;}
  function recordCandidates(){return {bestDistance:run.bestDistance,mostCoins:run.totalCoins,longestJump:run.longestJump,longestAirtime:run.longestAirtime,mostFlipsJump:run.mostFlipsJump,mostFlipsRun:run.totalFlips};}
  function findRecords(){
    if(!run||run.finished)return;
    const s=state.progression.stats,newLabels=[];
    for(const [key,value] of Object.entries(recordCandidates())){
      if(value>s.global[key])newLabels.push(labels[key]);
      if(value>s.vehicles[run.vehicleId][key])newLabels.push(`${VEHICLES[run.vehicleId].name} · ${labels[key]}`);
    }
    if(run.bestDistance>s.maps[run.mapId].bestDistance)newLabels.push(`New ${MAPS[run.mapId].name} record`);
    const added=newLabels.filter(label=>!run.broken.includes(label));
    if(added.length){run.broken.push(...added);moments.notify('NEW RECORD',added[0]+(added.length>1?` · +${added.length-1} more`:''),2.5,'record');}
  }
  function measurePosition(){
    if(!run||run.finished)return;
    run.totalDistance+=Math.abs(state.car.x-previousX)/CONFIG.world.pixelsPerMeter;previousX=state.car.x;
    run.bestDistance=Math.max(run.bestDistance,Math.floor(economy.runMeters(Math.max(state.furthest,state.car.x))));
  }
  function afterStep(dt){
    if(!run||run.finished)return;
    const takeoffX=previousX;measurePosition();
    if(!state.car.grounded){
      if(wasGrounded){flight={x:takeoffX,time:0};sequenceFlips=0;}
      if(flight)flight.time+=dt;
    }else{
      if(flight){run.longestJump=Math.max(run.longestJump,Math.abs(state.car.x-flight.x)/CONFIG.world.pixelsPerMeter);run.longestAirtime=Math.max(run.longestAirtime,flight.time);}
      flight=null;sequenceFlips=0;
    }
    wasGrounded=state.car.grounded;findRecords();
  }
  function coins(amount){if(run&&!run.finished){run.totalCoins+=amount;findRecords();}}
  function flip(){if(run&&!run.finished){run.totalFlips++;run.mostFlipsJump=Math.max(run.mostFlipsJump,++sequenceFlips);findRecords();}}
  function fuel(){if(run&&!run.finished)run.fuelCans++;}
  function checkpoint(){if(run&&!run.finished)run.checkpoints++;}
  function finish(){
    if(!run||run.finished)return [];
    measurePosition();findRecords();const s=state.progression.stats;
    for(const target of [s.global,s.vehicles[run.vehicleId]]){
      for(const key of Object.keys(totals))target[key]+=run[key];
      for(const [key,value] of Object.entries(recordCandidates()))target[key]=Math.max(target[key],value);
    }
    const map=s.maps[run.mapId];if(run.bestDistance>map.bestDistance){map.bestDistance=run.bestDistance;map.vehicleId=run.vehicleId;}
    Object.assign(run,recordCandidates());run.finished=true;flight=null;
    s.lastRun=JSON.parse(JSON.stringify(run));save.saveProgress();
    $('runRecords').innerHTML=run.broken.length?`<h2>✦ New records</h2>${run.broken.map(x=>`<div>${x}</div>`).join('')}`:'';
    return run.broken;
  }
  const card=(key,value)=>`<article class="record-card"><span>${labels[key]}</span><strong>${format(key,value)}</strong></article>`;
  function render(){
    const s=state.progression.stats;
    for(const id of ['career','maps','vehicles','runs'])$(`records-${id}`).setAttribute('aria-selected',String(tab===id));
    $('recordVehiclePicker').hidden=tab!=='vehicles';
    let html='';
    if(tab==='maps')html=`<div class="map-records">${MAP_CATALOG.map(([id])=>{const r=s.maps[id];return `<article class="record-card"><span>⚑ ${MAPS[id].name}</span><strong>${num(r.bestDistance)} <small>m</small></strong><p>${r.vehicleId?VEHICLES[r.vehicleId].name:r.bestDistance?'Previous record · vehicle unknown':'No completed run yet'}</p></article>`;}).join('')}</div>`;
    else if(tab==='runs'){
      html='<h2>Personal bests</h2><div class="record-grid">'+Object.keys(records).map(k=>card(k,s.global[k])).join('')+'</div>';
      const r=s.lastRun;html+=r?`<h2>Latest run · ${MAPS[r.mapId].name}</h2><p>${VEHICLES[r.vehicleId].name}</p><div class="record-grid">${['bestDistance','totalCoins','longestJump','longestAirtime','totalFlips','mostFlipsJump','fuelCans','checkpoints'].map(k=>card(k,r[k])).join('')}</div><div class="record-wins">${r.broken.map(x=>`<p>✦ ${x}</p>`).join('')}</div>`:'<p>Finish a run to start your story.</p>';
    }else{
      const data=tab==='vehicles'?s.vehicles[vehicle]:s.global;
      html=`<h2>${tab==='vehicles'?VEHICLES[vehicle].name:'Your highlights'}</h2><div class="record-grid prominent">${['bestDistance','longestJump','mostFlipsJump','mostCoins'].map(k=>card(k,data[k])).join('')}</div><h2>${tab==='vehicles'?'Behind the wheel':'Career totals'}</h2><div class="record-grid">${['totalDistance','totalRuns','totalCoins','longestAirtime','mostFlipsRun','totalFlips','fuelCans','checkpoints'].map(k=>card(k,data[k])).join('')}</div>`;
    }
    $('recordsContent').innerHTML=html;
  }
  function open(){ui.showScreen('stats');vehicle=state.progression.selected;$('recordVehicle').value=vehicle;render();$('recordsBack').focus();}
  function close(){ui.showScreen('start');$('startStats').focus();}
  function bindEvents(){
    $('startStats').addEventListener('click',open);$('endStats').addEventListener('click',open);$('recordsBack').addEventListener('click',close);
    for(const id of ['career','maps','vehicles','runs'])$(`records-${id}`).addEventListener('click',()=>{tab=id;render();});
    $('recordVehicle').innerHTML=VEHICLE_ORDER.map(id=>`<option value="${id}">${VEHICLES[id].name}</option>`).join('');
    $('recordVehicle').addEventListener('change',e=>{vehicle=e.target.value;render();});
    // A closing tab ends its active run once; bfcache restoration starts a new tracking segment.
    addEventListener('pagehide',()=>{finish();});
    addEventListener('pageshow',e=>{if(e.persisted&&run?.finished){prepare();}});
  }
  return {prepare,beforeStep,afterStep,coins,flip,fuel,checkpoint,finish,open,close,render,bindEvents,debug:()=>run};
}

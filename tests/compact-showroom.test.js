import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkshop} from '../dist/workshop.js';
import {createSave} from '../dist/save.js';
import {createUpgrades} from '../dist/upgrades.js';
import {VEHICLE_ORDER} from '../dist/vehicles.js';

test('compact showroom browses every vehicle without changing the equipped car',()=>{
 const previous=globalThis.document,nodes=new Map();
 const g=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true});
 globalThis.document={getElementById(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},querySelector:()=>({focus(){}}),getContext:()=>g});return nodes.get(id);}};
 try{
  const state={screen:'store'},save=createSave({state,cloudSave:{initialSave:()=>null,localKey:k=>k},economy:{}});
  state.progression=save.freshProgress();
  const workshop=createWorkshop({state,save,upgrades:createUpgrades({state,save}),render:{paintVehicle(){}},physics:{rideHeight:()=>50}});
  workshop.bindEvents();workshop.store();
  const cards=nodes.get('vehicleCards');
  assert.equal((cards.innerHTML.match(/<option /g)||[]).length,20);
  for(const id of VEHICLE_ORDER){
   cards.handlers.change({target:{matches:()=>true,value:id}});
   assert.equal(workshop.current(),id);
   assert.ok(cards.innerHTML.includes(`value="${id}" selected`));
   assert.equal(state.progression.selected,'base');
  }
 }finally{globalThis.document=previous;}
});

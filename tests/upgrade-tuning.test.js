import test from 'node:test';
import assert from 'node:assert/strict';
import { createSave } from '../dist/save.js';
import { createUpgrades } from '../dist/upgrades.js';
import { MAX_LEVEL } from '../dist/config.js';
import { VEHICLE_ORDER, vehicleBase } from '../dist/vehicles.js';

function fixture(){
  const state={progression:null};
  let writes=0;
  const cloudSave={initialSave:()=>null,localKey:key=>key,saved:()=>{writes++;}};
  const save=createSave({state,cloudSave,economy:{}});
  state.progression=save.freshProgress();
  return {state,save,writes:()=>writes,upgrades:createUpgrades({state,save})};
}

test('legacy fully upgraded vehicles remain fully applied until tuned down',()=>{
  const {state,save}=fixture();
  const old=save.freshProgress();
  old.balance=500;
  old.levelsByVehicle.base={engine:MAX_LEVEL,suspension:MAX_LEVEL,tires:MAX_LEVEL,fuel:MAX_LEVEL};
  delete old.activeLevelsByVehicle;
  save.loadProgress(old);
  assert.deepEqual(save.activeLevelsFor(),save.levelsFor());
  assert.deepEqual(save.activeLevelsFor('bike'),save.levelsFor('bike'));
});

test('tuning keeps purchases and supports 0, fractional, and full purchased levels',()=>{
  const {state,save,upgrades,writes}=fixture();
  state.progression.owned.push('bike');
  state.progression.levelsByVehicle.base={engine:MAX_LEVEL,suspension:MAX_LEVEL,tires:MAX_LEVEL,fuel:MAX_LEVEL};
  state.progression.activeLevelsByVehicle.base={...state.progression.levelsByVehicle.base};
  state.progression.balance=10000;
  const installed=structuredClone(state.progression.levelsByVehicle.base);
  const before=upgrades.vehicleStats(save.activeLevelsFor());
  assert.equal(save.setActiveLevel('engine',2.75),2.75);
  assert.equal(save.setActiveLevel('tires',0),0);
  assert.equal(save.setActiveLevel('fuel',100),MAX_LEVEL);
  assert.equal(save.setActiveLevel('engine',-10),0);
  assert.equal(save.setActiveLevel('engine',2.75),2.75);
  assert.deepEqual(save.levelsFor(),installed,'purchase levels cannot be lost through tuning');
  assert.equal(state.progression.balance,10000,'tuning should not cost or refund coins');
  assert.ok(writes()>=5,'tuning is saved');
  assert.equal(save.activeLevelsFor('bike').engine,0,'other vehicles have independent tuning');
  const tuned=upgrades.vehicleStats(save.activeLevelsFor());
  assert.ok(tuned.enginePower<before.enginePower);
  assert.ok(tuned.tireGrip<before.tireGrip);
  assert.equal(save.setActiveLevel('fake',1),false);
  assert.equal(save.setActiveLevel('engine',NaN),false);
  assert.equal(save.setActiveLevel('engine',2,'tank'),false,'cannot tune unowned vehicles');
});

test('fractional levels interpolate every upgrade without changing integer levels',()=>{
  const {save,upgrades}=fixture();
  for(const id of VEHICLE_ORDER){
    const stock={engine:0,suspension:0,tires:0,fuel:0};
    for(const key of Object.keys(stock)){
      const first=upgrades.vehicleStats({...stock,[key]:2},id);
      const middle=upgrades.vehicleStats({...stock,[key]:2.5},id);
      const third=upgrades.vehicleStats({...stock,[key]:3},id);
      const characteristic=key==='engine'?'enginePower':key==='suspension'?(vehicleBase(id).suspensionUpgrade==='airControl'?'airTilt':'suspension'):key==='tires'?(vehicleBase(id).tiresUpgrade==='downforce'?'downforce':'tireGrip'):'fuelCapacity';
      const min=Math.min(first[characteristic],third[characteristic]),max=Math.max(first[characteristic],third[characteristic]);
      assert.ok(Number.isFinite(middle[characteristic])&&middle[characteristic]>min&&middle[characteristic]<max,
        id+' '+key+' should interpolate '+characteristic);
    }
  }
  const base={engine:MAX_LEVEL,suspension:MAX_LEVEL,tires:MAX_LEVEL,fuel:MAX_LEVEL};
  assert.deepEqual(upgrades.vehicleStats(base,'base'),upgrades.vehicleStats({...base},'base'));
});

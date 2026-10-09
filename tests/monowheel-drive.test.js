import test from 'node:test';
import assert from 'node:assert/strict';
import {createPhysics} from '../dist/physics.js';
import {createUpgrades} from '../dist/upgrades.js';
import {CONFIG} from '../dist/config.js';

function setup(angle,control,airborne=false){
  const v=createUpgrades({state:{},save:{}}).vehicleStats({engine:0,suspension:0,tires:0,fuel:0},'monowheel');
  CONFIG.vehicle=v;
  const state={playing:true,started:true,paused:false,activeMap:'countryside',time:0,bonusEvents:[],bridgeMotion:new Map(),items:[],fuel:100,furthest:0,progression:{best:{countryside:100000}},toastTime:0,car:{x:0,y:0,a:angle,vx:0,vy:0,av:0,grounded:false,wheels:[],wheelLengths:[v.suspensionTravel],wheelSpeeds:[0],wheelPhases:[0],wheelSlip:[false],wheelSpin:0}};
  const noop=()=>{};
  const physics=createPhysics({state,input:{input:key=>control===1?key==='gas':control===-1?key==='brake':false},terrain:{ground:()=>0,slope:()=>0,biomeNear:()=>[],biomeAt:()=>null,surfaceAt:()=>({grip:1,drag:1}),seasonalSurface:()=>({index:0})},stats:{beforeStep:noop,afterStep:noop},moments:{beforeStep:noop,afterStep:noop},economy:{updateTricks:noop,runMeters:()=>0,updateCheckpoints:noop,generate:noop},ui:{end:noop},save:{saveProgress:noop}});
  const wheel=physics.wheelPose(v.wheels[0],v.suspensionTravel);
  state.car.y=-(wheel.y+wheel.r)-(airborne?200:0);
  physics.syncWheelGeometry();
  return {state,physics,v};
}

test('Monowheel drives in both directions from upright, side and inverted tire contact',()=>{
  for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const control of [-1,1]){
    const {state,physics}=setup(a,control);physics.step(1/240);
    assert(state.car.vx*control>0,`angle ${a}, input ${control}`);
  }
});
test('Monowheel fallback does not propel an airborne vehicle or handle another vehicle type',()=>{
  const {state,physics,v}=setup(Math.PI/2,1,true);
  assert.equal(physics.monowheelContact(v),null);
  assert.equal(physics.monowheelContact({...v,visualType:'base'}),null);
  physics.step(1/240);assert.equal(state.car.vx,0);
});

test('Monowheel gently rights itself only on the ground',()=>{
  for(const angle of [-.8,.8]){
    const {state,physics,v}=setup(angle,0);
    assert(physics.groundPitchTorque(v,1)*angle<0);
    assert.equal(physics.groundPitchTorque(v,0),0);
    for(let n=0;n<720;n++)physics.step(1/240);
    assert(Math.abs(state.car.a)<.15,`settled angle ${state.car.a}`);
  }
});

test('Monowheel does not spring-hop on flat ground at rest or under throttle',()=>{
  for(const control of [0,-1,1]){
    const {state,physics}=setup(0,control),startY=state.car.y,length=state.car.wheelLengths[0];
    let rise=0,minVy=0;
    for(let n=0;n<1200;n++){
      physics.step(1/240);rise=Math.max(rise,startY-state.car.y);minVy=Math.min(minVy,state.car.vy);
      assert.equal(state.car.wheelLengths[0],length);
    }
    assert(rise<3,`uncommanded rise ${rise}`);
    assert(minVy>-15,`upward launch speed ${minVy}`);
  }
});

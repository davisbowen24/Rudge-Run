import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createFlipDetector} from '../dist/flipDetection.js';
import {createEconomy} from '../dist/economy.js';
import {createMoments} from '../dist/moments.js';

const pi=Math.PI;
const airborne=(detector,angle,delta=0)=>detector.step({angle,delta,grounded:false});
const touchdown=(detector,angle,onWheels=true)=>detector.step({
  angle,grounded:true,onWheels
});

test('a full inverted-to-upright airborne recovery is one flip, not a net 360 degree threshold',()=>{
  const d=createFlipDetector();
  assert.equal(airborne(d,0).length,0);
  assert.equal(airborne(d,pi/2,pi/2).length,0);
  assert.equal(airborne(d,pi,pi/2).length,0);
  assert.equal(airborne(d,3*pi/2,pi/2).length,0);
  assert.deepEqual(airborne(d,2*pi,pi/2),[{direction:1,landing:false}]);
  assert.equal(touchdown(d,2*pi).length,0,'must not score the same flip twice at landing');
});

test('double and triple flips re-arm on each subsequent upside-down crossing',()=>{
  const d=createFlipDetector();
  let flips=0;
  for(let n=0;n<=12;n++)flips+=airborne(d,n*pi/2,pi/2).length;
  assert.equal(flips,3);
  assert.equal(touchdown(d,6*pi).length,0);
});

test('counterrotation can finish an inversion instead of cancelling signed angular travel',()=>{
  const d=createFlipDetector();
  airborne(d,0);
  airborne(d,pi/2,pi/2);
  airborne(d,pi,pi/2);
  airborne(d,pi/2,-pi/2);
  assert.deepEqual(airborne(d,0,-pi/2),[{direction:-1,landing:false}]);
  assert.equal(touchdown(d,0).length,0);
});

test('a slightly tilted wheel landing can finish the last flip after inversion',()=>{
  const d=createFlipDetector();
  airborne(d,0);
  airborne(d,pi,pi);
  airborne(d,1.5*pi,pi/2);
  airborne(d,1.72*pi,.22*pi);
  const award=touchdown(d,1.78*pi);
  assert.equal(award.length,1);
  assert.equal(award[0].landing,true);
  assert.equal(touchdown(d,1.78*pi).length,0,'contact cannot double count');
});

test('last partial rotation in a double flip can count on wheel-first landing',()=>{
  const d=createFlipDetector();
  const awards=[];
  for(const angle of [0,pi/2,pi,1.5*pi,2*pi,2.5*pi,3*pi,3.5*pi])
    awards.push(...airborne(d,angle,pi/2));
  awards.push(...touchdown(d,3.75*pi));
  assert.equal(awards.length,2);
  assert.deepEqual(awards.map(f=>f.landing),[false,true]);
});

test('upright wobble, upside-down landing and hard sideways landing do not earn flips',()=>{
  const wobble=createFlipDetector();
  for(const angle of [0,.3,-.3,.4,0])assert.equal(airborne(wobble,angle).length,0);
  assert.equal(touchdown(wobble,0).length,0);
  const inverted=createFlipDetector();
  airborne(inverted,0);airborne(inverted,pi);
  assert.equal(touchdown(inverted,pi).length,0,'inverted landing is not a flip');
  const sideways=createFlipDetector();
  airborne(sideways,0);airborne(sideways,pi);airborne(sideways,1.5*pi);
  assert.equal(touchdown(sideways,1.6*pi).length,0,'72 degrees off upright is too tilted');
  const noWheel=createFlipDetector();
  airborne(noWheel,0);airborne(noWheel,pi);
  assert.equal(touchdown(noWheel,1.85*pi,false).length,0,'landing must be on wheels');
});

test('backflips count, and each flight starts with a fresh state',()=>{
  const d=createFlipDetector();
  for(const angle of [0,-pi/2,-pi])assert.equal(airborne(d,angle,-pi/2).length,0);
  assert.deepEqual(airborne(d,-2*pi,-pi),[{direction:-1,landing:false}]);
  d.reset();
  assert.equal(touchdown(d,0).length,0);
  assert.equal(airborne(d,0).length,0);
  assert.equal(touchdown(d,0).length,0);
});

function simulateJump(multiplayerRaceActive){
  const previousDocument=globalThis.document;
  const nodes=new Map();
  globalThis.document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:true});
    return nodes.get(id);
  }};
  try{
    const state={activeMap:'countryside',multiplayerRaceActive,coins:0,
      airRotation:0,airTime:0,stuntLanding:null,
      car:{x:800,y:-80,vx:0,vy:0,av:0,a:0,grounded:true,
        wheels:[{x:800,y:0,normal:1}]},
      progression:{balance:0,best:{countryside:0}}};
    const terrain={ground:()=>0,slope:()=>0};
    const effects={burst(){},materialAt:()=> 'soil'};
    const moments=createMoments({state,terrain,effects,workshop:{}});
    let counted=0;
    const stats={flip(){counted++},coins(){}};
    const economy=createEconomy({state,stats,moments,save:{saveProgress(){}},terrain,ui:{},upgrades:{}});
    moments.reset();economy.resetTricks();
    moments.afterStep(.1); // Start on wheels, preparing the next takeoff.
    let prior=0;
    for(const angle of [pi/2,pi,1.5*pi,2*pi,2.5*pi,3*pi,3.5*pi]){
      state.car.a=angle;
      state.car.grounded=false;
      state.car.wheels=[{x:800,y:0,normal:0}];
      economy.updateTricks(angle-prior,false,.15);
      moments.afterStep(.15);
      prior=angle;
    }
    state.car.a=3.75*pi;
    state.car.grounded=true;
    state.car.wheels=[{x:800,y:0,normal:1}];
    // Must run awards BEFORE the landing observer captures stuntLanding.
    economy.updateTricks(state.car.a-prior,true,.01);
    moments.afterStep(.01);
    return {counted,coins:state.coins,stuntLanding:state.stuntLanding};
  }finally{
    globalThis.document=previousDocument;
  }
}

test('solo and multiplayer both award two shared flip rewards, including on landing',()=>{
  const solo=simulateJump(false);
  const multi=simulateJump(true);
  assert.equal(solo.counted,2);
  assert.equal(multi.counted,2);
  assert.equal(solo.coins,multi.coins);
  assert.ok(solo.coins>0);
  assert.equal(solo.stuntLanding,null,'solo mode does not activate multiplayer stunt bonus');
  assert.equal(multi.stuntLanding.flips,2,'Stuntman receives both global flips, including landing');
  assert.ok(multi.stuntLanding.airtime>0.12);
});

test('physics executes shared flip awards before landing stats and stunt observers',async()=>{
  const code=await readFile(new URL('../dist/physics.js',import.meta.url),'utf8');
  const trick=code.indexOf('economy.updateTricks(state.car.a-angleBefore,state.car.grounded,dt)');
  const stats=code.indexOf('stats.afterStep(dt)',trick);
  const moments=code.indexOf('moments.afterStep(dt)',stats);
  assert.ok(trick>=0&&stats>trick&&moments>stats);
});

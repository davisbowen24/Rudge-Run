import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEffects } from '../dist/effects.js';

function canvasSpy(){
  const positions=[];
  let strokes=0,puffs=0,saves=0,restores=0;
  return {
    positions,
    get strokes(){return strokes;},
    get puffs(){return puffs;},
    get saves(){return saves;},
    get restores(){return restores;},
    save(){saves++;},restore(){restores++;},
    beginPath(){},moveTo(x,y){positions.push([x,y]);},
    lineTo(){},stroke(){strokes++;},
    arc(){},fill(){puffs++}
  };
}

function setup(){
  const state={
    activeMap:'cave',screen:'run',playing:true,paused:false,
    chaosWindAcceleration:-280,W:950,H:600,camera:{x:0,y:0},
    car:{vx:0,wheels:[],wheelSlip:[]}
  };
  const fx=createEffects({state,terrain:{}});
  fx.reset();
  return {state,fx};
}

test('Windstorm fills the viewport with animated dust and diagonal motion streaks',()=>{
  const {state,fx}=setup();
  const canvas=canvasSpy();
  fx.drawWindstorm(canvas,'back');
  fx.drawWindstorm(canvas,'front');
  assert.ok(canvas.strokes>60,'both background and foreground should have plentiful visible streaks');
  assert.ok(canvas.puffs>15,'dust particles should accompany the streaks');
  assert.equal(canvas.saves,2);
  assert.equal(canvas.restores,2);
  const xValues=canvas.positions.map(p=>p[0]);
  assert.ok(xValues.some(x=>x>state.W*.7),'particles should cover right side');
  assert.ok(xValues.some(x=>x<state.W*.3),'particles should cover left side');
  const initial=canvas.positions[0];
  fx.update(0.05);
  const later=canvasSpy();
  fx.drawWindstorm(later,'back');
  assert.notDeepEqual(later.positions[0],initial,'dust visibly moves across frames');
});

test('windstorm stops drawing immediately when effect expires or race is over',()=>{
  const {state,fx}=setup();
  const g=canvasSpy();
  state.chaosWindAcceleration=0;
  fx.drawWindstorm(g,'front');
  assert.equal(g.strokes,0);
  state.chaosWindAcceleration=-280;
  state.playing=false;
  fx.drawWindstorm(g,'front');
  assert.equal(g.strokes,0);
  state.playing=true;
  state.screen='start';
  fx.drawWindstorm(g,'back');
  assert.equal(g.strokes,0);
});

test('Windstorm overlay follows actual live Chaos force, not warning text',async()=>{
  const [render,physics]=await Promise.all([
    readFile(new URL('../dist/render.js',import.meta.url),'utf8'),
    readFile(new URL('../dist/physics.js',import.meta.url),'utf8')
  ]);
  assert.match(render,/effects\.drawWindstorm\(state\.ctx,'back'\)/);
  assert.match(render,/effects\.drawWindstorm\(state\.ctx,'front'\)/);
  assert.match(physics,/chaosWindAcceleration\|\|0\)\*chaosWindGust\(state\.time,contacts===0\)/);
});

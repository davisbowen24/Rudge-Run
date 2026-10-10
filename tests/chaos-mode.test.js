import test from 'node:test';
import assert from 'node:assert/strict';
import {chaosGravityAt,CHAOS_CYCLE_MS,CHAOS_LOW_GRAVITY_MS} from '../dist/chaosMode.js';

const start='2026-10-10T12:00:00.000Z';
const room={status:'racing',chaosModeEnabled:true,raceStartAt:start,chaseModeEnabled:true};
const at=t=>chaosGravityAt(room,Date.parse(start)+t);
test('server race clock drives the same 50% gravity window for every racer',()=>{
  assert.equal(CHAOS_CYCLE_MS,30000);
  assert.equal(CHAOS_LOW_GRAVITY_MS,10000);
  for(const ms of [0,29999,40000,59999])assert.equal(at(ms).multiplier,1);
  for(const ms of [30000,35000,39999,60000,69000])assert.equal(at(ms).multiplier,0.5);
  assert.equal(at(30000).remainingMs,10000);
  assert.equal(at(39999).remainingMs,1);
  assert.equal(at(69000).remainingMs,1000);
  assert.equal(at(70000).multiplier,1);
});
test('Chaos is independent of Chase and never affects single-player or ended races',()=>{
  assert.equal(at(35000).active,true,'Chase and Chaos may run together');
  assert.equal(chaosGravityAt({...room,chaseModeEnabled:false},Date.parse(start)+35000).active,true);
  assert.equal(chaosGravityAt({...room,chaosModeEnabled:false},Date.parse(start)+35000).multiplier,1);
  assert.equal(chaosGravityAt({...room,status:'results'},Date.parse(start)+35000).multiplier,1);
  assert.equal(chaosGravityAt({...room,raceStartAt:null},Date.parse(start)+35000).multiplier,1);
  assert.equal(chaosGravityAt(room,Date.parse(start)+35000,false).multiplier,1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {STUNT_ASSIST_SECONDS,stuntBonusForLanding,stuntAndLoserMultipliers} from '../dist/stuntAssist.js';

test('stunts use the strongest landing reward for exactly six seconds',()=>{
  assert.equal(STUNT_ASSIST_SECONDS,6);
  assert.deepEqual(stuntBonusForLanding({flips:1,airtime:1}),{bonus:.25,label:'FLIP'});
  assert.deepEqual(stuntBonusForLanding({flips:2,airtime:1}),{bonus:.4,label:'DOUBLE FLIP'});
  assert.deepEqual(stuntBonusForLanding({flips:3,airtime:1}),{bonus:.5,label:'3+ FLIPS'});
  assert.deepEqual(stuntBonusForLanding({flips:4,airtime:8}),{bonus:.5,label:'3+ FLIPS'});
  assert.deepEqual(stuntBonusForLanding({flips:0,airtime:3}),{bonus:.2,label:'BIG AIR'});
  assert.deepEqual(stuntBonusForLanding({flips:1,airtime:4}),{bonus:.25,label:'FLIP'});
  assert.equal(stuntBonusForLanding({flips:0,airtime:2.99}),null);
  assert.equal(stuntBonusForLanding(null),null);
});

test('stunt and catch-up engine bonuses add, never multiply',()=>{
  assert.deepEqual(stuntAndLoserMultipliers(1.56,.4),
    {enginePower:1.96,engineTorque:1.56,acceleration:1.56});
  assert.deepEqual(stuntAndLoserMultipliers(2,.5),
    {enginePower:2.5,engineTorque:2,acceleration:2});
  assert.deepEqual(stuntAndLoserMultipliers(1,0),
    {enginePower:1,engineTorque:1,acceleration:1});
  assert.deepEqual(stuntAndLoserMultipliers(1,.2),
    {enginePower:1.2,engineTorque:1,acceleration:1});
});

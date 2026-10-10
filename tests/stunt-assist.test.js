import test from 'node:test';
import assert from 'node:assert/strict';
import {STUNT_ASSIST_SECONDS,STUNT_TORQUE_ACCEL_RATIO,stuntBonusForLanding,stuntAndLoserMultipliers} from '../dist/stuntAssist.js';

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

test('stunt boosts add to catch-up bonuses across power, torque, acceleration',()=>{
  assert.equal(STUNT_TORQUE_ACCEL_RATIO,0.4);
  const cases=[
    {loser:1,stunt:0,power:1,torque:1},
    {loser:1,stunt:0.2,power:1.2,torque:1.08},
    {loser:1,stunt:0.25,power:1.25,torque:1.10},
    {loser:1,stunt:0.4,power:1.4,torque:1.16},
    {loser:1,stunt:0.5,power:1.5,torque:1.2},
    {loser:1.56,stunt:0.4,power:1.96,torque:1.72},
    {loser:2,stunt:0.5,power:2.5,torque:2.2}
  ];
  for(const {loser,stunt,power,torque} of cases){
    const actual=stuntAndLoserMultipliers(loser,stunt);
    assert.ok(Math.abs(actual.enginePower-power)<1e-10,'additive power');
    assert.ok(Math.abs(actual.engineTorque-torque)<1e-10,'additive torque');
    assert.ok(Math.abs(actual.acceleration-torque)<1e-10,'additive acceleration');
  }
});
test('stunt bonuses are bounded and never compound by themselves',()=>{
  const capped=stuntAndLoserMultipliers(2,100);
  assert.equal(capped.enginePower,2.5);
  assert.equal(capped.engineTorque,2.2);
  const normal=stuntAndLoserMultipliers(1,0);
  assert.deepEqual(normal,{enginePower:1,engineTorque:1,acceleration:1});
});

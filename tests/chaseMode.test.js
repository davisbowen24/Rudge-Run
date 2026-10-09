import test from 'node:test';
import assert from 'node:assert/strict';
import {createChaseMode} from '../dist/chaseMode.js';

const member=(id,positionMeters,velocityMetersPerSecond=0,sampledAtMs=0,raceStatus='racing')=>({
  id,positionMeters,velocityMetersPerSecond,sampledAtMs,raceStatus,raceActive:true
});
test('disabled by default and clears state when switched off',()=>{
  const chase=createChaseMode();
  assert.equal(chase.snapshot().enabled,false);
  chase.setEnabled(true);
  chase.setParticipants([member('a',2000)]);
  assert.equal(chase.update(0,0).positionMeters,1250);
  chase.setEnabled(false);
  assert.equal(chase.snapshot().positionMeters,null);
});
test('trails exactly 750 meters behind current leader',()=>{
  const chase=createChaseMode({enabled:true});
  chase.setParticipants([member('a',2000),member('b',1600)]);
  assert.equal(chase.update(0,0).positionMeters,1250);
  assert.equal(chase.snapshot().leaderId,'a');
});
test('dead reckons locally between network updates',()=>{
  const chase=createChaseMode({enabled:true});
  chase.setParticipants([member('a',2000,10)]);
  chase.update(0,0);
  assert.ok(chase.update(.5,500).positionMeters>1250);
});
test('smoothly retreats after lead racer is eliminated',()=>{
  const chase=createChaseMode({enabled:true});
  chase.setParticipants([member('a',2000),member('b',1800)]);
  chase.update(0,0);
  chase.setParticipants([member('a',2000,0,0,'dead'),member('b',1800)]);
  const next=chase.update(.1,100);
  assert.ok(next.positionMeters<1250&&next.positionMeters>1050);
});
test('handles backward leader velocity',()=>{
  const chase=createChaseMode({enabled:true});
  chase.setParticipants([member('a',2000,-30)]);
  chase.update(0,0);
  assert.ok(chase.update(1,1000).positionMeters<1250);
});
test('freezes a stale hazard until fresh data arrives',()=>{
  const chase=createChaseMode({enabled:true});
  chase.setParticipants([member('a',2000,100)]);
  chase.update(0,0);
  const before=chase.update(.1,1000).positionMeters;
  assert.equal(chase.update(2,5000).positionMeters,before);
  assert.equal(chase.snapshot().predictionStale,true);
  chase.setParticipants([member('a',2100,0,5100)]);
  const after=chase.update(.1,5150).positionMeters;
  assert.ok(after>before&&after<1350);
});
test('excludes stale racer from fresh leaderboard',()=>{
  const chase=createChaseMode({enabled:true});
  chase.setParticipants([member('stale',10000,0,0),member('fresh',2000,0,3000)]);
  assert.equal(chase.update(.1,3001).leaderId,'fresh');
});
test('hides when all racers are eliminated',()=>{
  const chase=createChaseMode({enabled:true});
  chase.setParticipants([member('a',2000)]);
  chase.update(0,0);
  chase.setParticipants([member('a',2000,0,0,'dead')]);
  assert.equal(chase.update(.1,100).positionMeters,null);
});
test('ignores out-of-order movement packets',()=>{
  const chase=createChaseMode({enabled:true});
  chase.setParticipants([member('a',1000,0,500)]);
  chase.setParticipants([member('a',1,0,400)]);
  assert.equal(chase.update(0,500).positionMeters,250);
});
test('warning and contact are informational only',()=>{
  const chase=createChaseMode({enabled:true});
  chase.setParticipants([member('a',2000)]);
  chase.update(0,0);
  assert.equal(chase.proximity(1400).warning,true);
  assert.equal(chase.proximity(1250).caught,true);
});

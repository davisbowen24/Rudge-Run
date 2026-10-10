import test from 'node:test';
import assert from 'node:assert/strict';
import {losersAssistTarget,smoothLosersAssist,LOSERS_ASSIST_MAX_MULTIPLIER} from '../dist/losersAssist.js';

const drivers=distances=>distances.map((distance,index)=>({
  id:String(index+1),raceActive:true,raceStatus:'racing',connected:true,distance
}));
const room=distances=>({status:'racing',losersAssistEnabled:true,members:drivers(distances)});
test('the bottom half of racers, rounded up, qualifies in 2 through 8-player races',()=>{
  for(let count=2;count<=8;count++){
    const distances=Array.from({length:count},(_,i)=>1000-i*100);
    const r=room(distances);
    const eligible=Math.ceil(count/2);
    for(let place=1;place<=count;place++){
      const result=losersAssistTarget(r,String(place),distances[place-1]);
      assert.equal(result.rank,place);
      assert.equal(result.eligibleCount,eligible);
      assert.equal(result.eligible,place>count-eligible,'players='+count+' place='+place);
      assert.equal(result.multiplier>1,place>count-eligible);
    }
  }
});
test('2-player race helps second place; 3-player race helps second and third',()=>{
  const two=room([550,200]);
  assert.equal(losersAssistTarget(two,'1',550).multiplier,1);
  assert.ok(losersAssistTarget(two,'2',200).multiplier>1);
  const three=room([1000,800,300]);
  assert.ok(losersAssistTarget(three,'2',800).multiplier>1);
  assert.ok(losersAssistTarget(three,'3',300).multiplier>losersAssistTarget(three,'2',800).multiplier);
});
test('power grows with leader gap, approaches a 2x cap, and never rewards a tied leader',()=>{
  const r=room([1000,950,500,50]);
  assert.equal(losersAssistTarget(r,'1',1000).multiplier,1);
  assert.equal(losersAssistTarget(r,'2',950).multiplier,1);
  assert.equal(LOSERS_ASSIST_MAX_MULTIPLIER,2);
  assert.equal(losersAssistTarget(room([500,0]),'2',0).multiplier,1+500/900);
  assert.equal(losersAssistTarget(room([400,0]),'2',0).multiplier,1.5);
  assert.ok(losersAssistTarget(r,'4',50).multiplier>losersAssistTarget(r,'3',500).multiplier);
  assert.ok(losersAssistTarget(room([100000000,0]),'2',0).multiplier<=LOSERS_ASSIST_MAX_MULTIPLIER);
  assert.equal(losersAssistTarget(room([400,400]),'2',400).multiplier,1);
});
test('assist uses live local progress and removes bonuses from eliminated/solo players',()=>{
  const r=room([1000,800,100]);
  assert.equal(losersAssistTarget(r,'3',100).eligible,true);
  assert.equal(losersAssistTarget(r,'3',1100).eligible,false);
  assert.equal(losersAssistTarget({...r,losersAssistEnabled:false},'3',100).multiplier,1);
  assert.equal(losersAssistTarget({...r,status:'results'},'3',100).multiplier,1);
  assert.equal(losersAssistTarget(room([1000]),'1',1000).multiplier,1);
  const eliminated=room([1000,900,300]);
  eliminated.members[2].raceStatus='dead';
  assert.ok(losersAssistTarget(eliminated,'2',900).multiplier>1);
  assert.equal(losersAssistTarget(eliminated,'3',300).multiplier,1);
});
test('boost transitions smoothly without stat compounding or spikes',()=>{
  let current=1;
  for(let i=0;i<50;i++)current=smoothLosersAssist(current,2,0.016);
  assert.ok(current>1&&current<2);
  for(let i=0;i<500;i++)current=smoothLosersAssist(current,1,0.016);
  assert.ok(Math.abs(current-1)<0.001);
  assert.equal(smoothLosersAssist(1,2,0),1);
  assert.ok(smoothLosersAssist(3,100,0.016)<=2);
});

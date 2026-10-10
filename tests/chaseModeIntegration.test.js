import test from 'node:test';
import assert from 'node:assert/strict';
import {createMultiplayerRace} from '../dist/multiplayerRace.js';

test('Chase Mode uses live positions and original multiplayer scoring remains unchanged',async()=>{
  const previousDocument=globalThis.document;
  const previousPerformance=globalThis.performance;
  let tick=1000;
  const nodes=new Map();
  const element=id=>{
    if(!nodes.has(id))nodes.set(id,{
      hidden:false,textContent:'',innerHTML:'',
      style:{width:'',cssText:''},
      setAttribute(){},
      classList:{add(){},remove(){},toggle(){}},
      addEventListener(){},focus(){}
    });
    return nodes.get(id);
  };
  globalThis.document={getElementById:element};
  globalThis.performance={now:()=>tick};
  try{
    const calls=[];
    let room={
      code:'ABCDE',status:'racing',selectedMap:'countryside',raceNumber:1,
      chaseModeEnabled:true,serverTime:new Date().toISOString(),
      members:[
        {id:'self',displayName:'Me',vehicleId:'base',raceActive:true,raceStatus:'racing',distance:580},
        {id:'other',displayName:'Leader',vehicleId:'base',raceActive:true,raceStatus:'racing',
          distance:2000,livePosition:2000,liveVelocity:5,liveSampledAt:new Date().toISOString()}
      ]
    };
    const state={screen:'run',playing:true,furthest:6000,car:{x:6000,vx:180}};
    const multiplayer={
      room:()=>room,session:()=>({memberId:'self'}),
      renderRoomScoreboard(){},subscribe(){},
      async progress(distance){calls.push(['legacy',distance]);},
      async progressLive(distance,position,velocity){calls.push(['live',distance,position,velocity]);},
      async refresh(){}
    };
    const race=createMultiplayerRace({
      multiplayer,state,
      main:{reset(){state.playing=true;state.furthest=6000;state.car={x:6000,vx:180};}},
      ui:{showScreen(){}},
      economy:{runMeters:x=>Math.max(0,(x-140)/10)}
    });
    race.syncFromRoom(room);
    race.update(1/60);
    assert.equal(state.chaseModeSnapshot.enabled,true);
    assert.equal(state.chaseModeSnapshot.leaderId,'other');
    assert.ok(state.chaseModeSnapshot.positionMeters>=1250);
    assert.deepEqual(calls[0],['live',586,586,18]);
    await Promise.resolve();await Promise.resolve();

    room={...room,chaseModeEnabled:false};
    tick=1400;
    race.update(1/60);
    assert.equal(state.chaseModeSnapshot,null);
    assert.deepEqual(calls[1],['legacy',586]);
    assert.equal(state.playing,true); // visual simulation cannot inflict damage
  }finally{
    globalThis.document=previousDocument;
    globalThis.performance=previousPerformance;
  }
});

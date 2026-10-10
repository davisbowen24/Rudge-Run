import test from 'node:test';
import assert from 'node:assert/strict';
import { createMultiplayerRace } from '../dist/multiplayerRace.js';
import { MULTIPLAYER_CONFIG } from '../dist/multiplayerConfig.js';

test('racing polls the room independently of progress pushes',async()=>{
  const oldDocument=globalThis.document;
  const oldPerformance=Object.getOwnPropertyDescriptor(globalThis,'performance');
  const nodes=new Map();
  globalThis.document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:'',innerHTML:'',disabled:false});
    return nodes.get(id);
  }};
  let clock=1000,pushes=0,polls=0;
  Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>clock}});
  try{
    const room={
      id:'room-1',code:'ABCDE',status:'racing',raceNumber:1,
      selectedMap:'countryside',chaseModeEnabled:false,
      members:[{id:'player',displayName:'Player',vehicleId:'base',raceActive:true,raceStatus:'racing',distance:0}]
    };
    const multiplayer={
      room:()=>room,session:()=>({memberId:'player'}),
      renderRoomScoreboard(){},subscribe(){},
      async progress(){pushes++;},async progressLive(){pushes++;},
      async refresh(){polls++;}
    };
    const state={playing:true,furthest:140,car:{x:140,vx:0},screen:'run'};
    const race=createMultiplayerRace({
      multiplayer,state,main:{reset(){}},ui:{},
      economy:{runMeters:x=>Math.max(0,(x-140)/10)}
    });
    race.syncFromRoom(room);
    const interval=Math.max(MULTIPLAYER_CONFIG.raceProgressMs,MULTIPLAYER_CONFIG.raceRefreshMs);
    for(clock of [1000,1000+interval+1,1000+2*(interval+1)]){
      race.update(0.016);
      await Promise.resolve();
      await Promise.resolve();
    }
    assert.equal(pushes,3);
    assert.equal(polls,3);
  }finally{
    globalThis.document=oldDocument;
    if(oldPerformance)Object.defineProperty(globalThis,'performance',oldPerformance);
    else delete globalThis.performance;
  }
});

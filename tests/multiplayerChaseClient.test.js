import test from 'node:test';
import assert from 'node:assert/strict';
import {createMultiplayerRace} from '../dist/multiplayerRace.js';

test('only Chase Mode displays health and server-confirmed catches stop the run',()=>{
  const original=globalThis.document;
  const elements=new Map();
  globalThis.document={getElementById(id){
    if(!elements.has(id))elements.set(id,{hidden:true,textContent:'',innerHTML:'',
      style:{width:''},classList:{toggle(){}},disabled:false});
    return elements.get(id);
  }};
  try{
    const player={id:'self',displayName:'Driver',vehicleId:'base',raceActive:true,
      raceStatus:'racing',distance:900,chaseHealth:55,chaseCaught:false};
    const room={id:'r1',code:'ABCDE',status:'racing',raceNumber:1,
      selectedMap:'countryside',chaseModeEnabled:true,members:[player]};
    const state={playing:true,car:{x:9140,vx:0},furthest:9140,screen:'run'};
    const mp={room:()=>room,session:()=>({memberId:'self'}),renderRoomScoreboard(){},subscribe(){}};
    const race=createMultiplayerRace({multiplayer:mp,state,main:{reset(){}},ui:{},
      economy:{runMeters:x=>Math.max(0,(x-140)/10)}});
    race.syncFromRoom(room);
    race.update(0.016);
    assert.equal(elements.get('chaseHealthHud').hidden,false);
    assert.equal(elements.get('chaseHealthPercent').textContent,'55%');
    player.chaseCaught=true;player.chaseHealth=0;player.raceStatus='dead';player.finalDistance=900;
    race.syncFromRoom(room);
    assert.equal(state.playing,false);
    assert.equal(elements.get('multiplayerRaceEndReason').textContent,'Caught by the chase!');
    assert.equal(elements.get('multiplayerRaceEnd').hidden,false);
    assert.equal(elements.get('chaseHealthHud').hidden,true);
  }finally{globalThis.document=original;}
});

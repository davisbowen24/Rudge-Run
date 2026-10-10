import test from 'node:test';
import assert from 'node:assert/strict';
import {createMultiplayerRace} from '../dist/multiplayerRace.js';

test('first three maps share Chase tracking but show their own warning copy',()=>{
  const originalDocument=globalThis.document;
  const elements=new Map();
  globalThis.document={getElementById(id){
    if(!elements.has(id))elements.set(id,{
      hidden:true,innerHTML:'',textContent:'',style:{width:''},
      disabled:false,classList:{toggle(){},remove(){}}
    });
    return elements.get(id);
  }};
  try{
    const sample=new Date().toISOString();
    const room={id:'r1',code:'ABCDE',status:'racing',
      selectedMap:'arctic',chaseModeEnabled:true,raceNumber:1,serverTime:sample,
      members:[
        {id:'self',displayName:'Self',vehicleId:'base',distance:1300,
         raceActive:true,raceStatus:'racing',chaseHealth:60},
        {id:'leader',displayName:'Leader',vehicleId:'base',distance:2000,
         raceActive:true,raceStatus:'racing',livePosition:2000,
         liveVelocity:0,liveSampledAt:sample}
      ]
    };
    const state={screen:'run',playing:true,furthest:13140,
      car:{x:13140,vx:0},activeMap:'arctic'};
    const multiplayer={
      room:()=>room,session:()=>({memberId:'self'}),
      renderRoomScoreboard(){},subscribe(){},
      async progress(){},async progressLive(){},async refresh(){}
    };
    const race=createMultiplayerRace({
      multiplayer,state,main:{reset(){}},ui:{},
      economy:{runMeters:x=>Math.max(0,(x-140)/10)}
    });
    race.syncFromRoom(room);
    for(const [mapId,copy] of [
      ['arctic','Avalanche'],['desert','Sandstorm'],['jungle','Flash flood']
    ]){
      room.selectedMap=mapId;state.activeMap=mapId;
      race.update(.016);race.update(.016);
      assert.equal(elements.get('chaseWarning').hidden,false,mapId);
      assert.match(elements.get('chaseWarningText').textContent,new RegExp(copy,'i'),mapId);
      assert.match(elements.get('multiplayerProgressMarkers').innerHTML,/chase-hazard-marker/,mapId);
      assert.equal(elements.get('chaseHealthPercent').textContent,'60%');
    }
    room.chaseModeEnabled=false;
    race.update(.016);race.update(.016);
    assert.equal(elements.get('chaseWarning').hidden,true);
    assert.equal(elements.get('chaseHealthHud').hidden,true);
    assert.doesNotMatch(elements.get('multiplayerProgressMarkers').innerHTML,/chase-hazard-marker/);
    assert.equal(state.chaseModeSnapshot,null);
  }finally{globalThis.document=originalDocument;}
});

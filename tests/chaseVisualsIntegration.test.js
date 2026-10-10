import test from 'node:test';
import assert from 'node:assert/strict';
import {createMultiplayerRace} from '../dist/multiplayerRace.js';

test('all eighteen themed maps display compact icon-only chase warnings and distance',()=>{
  const originalDocument=globalThis.document;
  const elements=new Map();
  globalThis.document={getElementById(id){
    if(!elements.has(id)){
      const classes=new Set();
      const attributes=new Map();
      elements.set(id,{
        hidden:true,innerHTML:'',textContent:'',style:{width:'',cssText:''},
        disabled:false,attributes,
        setAttribute(name,value){attributes.set(name,value);},
        classList:{
          toggle(name,force){if(force===undefined? !classes.has(name):force)classes.add(name);
            else classes.delete(name);},
          remove(name){classes.delete(name);},
          contains(name){return classes.has(name);}
        }
      });
    }
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
    const mapIds=[
      'arctic','desert','jungle','volcano','haunted','underwater',
      'countryside','mars','rooftops','highway','cave','moon','alien',
      'construction','bootcamp','seasons','wasteland','neon'
    ];
    const icons=new Set();
    for(const mapId of mapIds){
      room.selectedMap=mapId;state.activeMap=mapId;
      race.update(.016);race.update(.016);
      const warning=elements.get('chaseWarning');
      const svg=elements.get('chaseWarningIcon').innerHTML;
      assert.equal(warning.hidden,false,mapId);
      assert.match(svg,/<svg[^>]+viewBox="0 0 64 64"/,mapId);
      icons.add(svg);
      assert.equal(elements.get('chaseWarningDistance').textContent,'50 m',mapId);
      assert.match(warning.style.cssText,/--chase-accent:#[0-9a-f]{6}/,mapId);
      assert.match(warning.attributes.get('aria-label'),/50 meters until caught/,mapId);
      assert.equal(warning.classList.contains('is-disco'),mapId==='neon',mapId);
      assert.match(elements.get('multiplayerProgressMarkers').innerHTML,/chase-hazard-marker/,mapId);
      assert.equal(elements.get('chaseHealthPercent').textContent,'60%');
    }
    // Volcano and Mars intentionally share a lava silhouette: the remaining
    // sixteen map hazards each have their own unique illustration.
    assert.equal(icons.size,17,'all 17 hazard types have distinct SVG icons');
    // Caught means 0 m, a pulsing state, and accessible health notification.
    state.car.x=11640;
    race.update(.016);
    assert.equal(elements.get('chaseWarningDistance').textContent,'0 m');
    assert.equal(elements.get('chaseWarning').classList.contains('is-caught'),true);
    assert.match(elements.get('chaseWarning').attributes.get('aria-label'),/Health draining/);
    // Returning to safety clears the caught state and remains distance-only.
    state.car.x=13140;
    race.update(.016);
    assert.equal(elements.get('chaseWarning').classList.contains('is-caught'),false);
    room.chaseModeEnabled=false;
    race.update(.016);race.update(.016);
    assert.equal(elements.get('chaseWarning').hidden,true);
    assert.equal(elements.get('chaseHealthHud').hidden,true);
    assert.equal(elements.get('chaseWarningDistance').textContent,'50 m');
    assert.doesNotMatch(elements.get('multiplayerProgressMarkers').innerHTML,/chase-hazard-marker/);
    assert.equal(state.chaseModeSnapshot,null);
  }finally{globalThis.document=originalDocument;}
});

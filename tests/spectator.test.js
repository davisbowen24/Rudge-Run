import test from 'node:test';
import assert from 'node:assert/strict';
import {spectatorStandings} from '../dist/spectator.js';
import {createMultiplayerRace} from '../dist/multiplayerRace.js';

const member=(id,name,distance,extra={})=>({
  id,displayName:name,distance,raceActive:true,raceStatus:'racing',connected:true,
  ...extra
});

test('spectator standings sort all participating racers by authoritative distance',()=>{
  const room={status:'racing',members:[
    member('out','Eliminated',1200,{raceStatus:'dead',finalDistance:500}),
    member('b','Second',800),
    member('c','First',1450),
    member('other','Lobby only',4000,{raceActive:false})
  ]};
  const result=spectatorStandings(room);
  assert.deepEqual(result.racers.map(m=>[m.rank,m.name,m.distance,m.racing]),[
    [1,'First',1450,true],[2,'Second',800,true],[3,'Eliminated',500,false]
  ]);
  assert.equal(result.leader.id,'c');
  assert.equal(result.activeCount,2);
  room.members[1].distance=1750;
  assert.equal(spectatorStandings(room).leader.name,'Second',
    'a new distance snapshot updates the leader without any extra telemetry');
});

test('spectator view supports missing data, ties, disconnected racers and no drivers',()=>{
  const room={members:[
    member('z','Zed',NaN,{connected:false}),
    member('a','Ana',0),
    member('v','Vera',1000,{raceStatus:'dead',finalDistance:650})
  ]};
  const result=spectatorStandings(room);
  assert.equal(result.racers[0].distance,650);
  assert.deepEqual(result.racers.slice(1).map(r=>r.name),['Ana','Zed']);
  assert.equal(result.racers[2].connected,false);
  assert.deepEqual(spectatorStandings(null),{leader:null,activeCount:0,racers:[]});
});

function withDom(run){
  const original=globalThis.document;
  const nodes=new Map();
  globalThis.document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{hidden:true,textContent:'',innerHTML:'',
      style:{width:''},classList:{toggle(){},remove(){}},disabled:false});
    return nodes.get(id);
  }};
  return Promise.resolve().then(()=>run(id=>globalThis.document.getElementById(id)))
    .finally(()=>{globalThis.document=original;});
}

test('local elimination shows live distance leaderboard until server results, never sends extra progress',async()=>{
  await withDom(async get=>{
    const me=member('self','You',900);
    const leader=member('leader','Leader',1250);
    const other=member('other','Other',1100);
    const room={id:'r1',code:'ABCDE',status:'racing',raceNumber:1,
      selectedMap:'countryside',chaseModeEnabled:false,members:[me,leader,other]};
    let sent=0,refreshed=0,results=0;
    const multiplayer={
      room:()=>room,session:()=>({memberId:'self'}),
      renderRoomScoreboard(){},subscribe(){},
      async refresh(){refreshed++;},
      async progress(){sent++;},async progressLive(){sent++;},
      async finish(distance,status){
        assert.equal(distance,900);
        assert.equal(status,'dead');
        me.raceStatus='dead';me.finalDistance=900;
        race.syncFromRoom(room);
      }
    };
    const state={playing:true,car:{x:9140,vx:0},furthest:9140,screen:'run'};
    const race=createMultiplayerRace({multiplayer,state,main:{reset(){}},
      ui:{showScreen(name){results++;state.screen=name}},
      economy:{runMeters:x=>Math.max(0,(x-140)/10)}});
    race.syncFromRoom(room);
    assert.equal(get('multiplayerSpectator').hidden,true);
    state.playing=false;
    await race.finish('Crashed');
    assert.equal(get('multiplayerRaceEnd').hidden,false);
    assert.equal(get('multiplayerSpectator').hidden,false);
    assert.equal(get('spectatorLeader').textContent,'Leader');
    assert.equal(get('spectatorLeaderDistance').textContent,'1,250 m');
    assert.match(get('spectatorStandings').innerHTML,/Other/);
    assert.match(get('spectatorStandings').innerHTML,/900 m/);
    assert.match(get('spectatorStandings').innerHTML,/OUT · YOU/);
    assert.equal(sent,0,'eliminated clients do not submit progress');

    // The race leader can change while the eliminated player waits.
    other.distance=1600;
    race.syncFromRoom(room);
    assert.equal(get('spectatorLeader').textContent,'Other');
    assert.equal(get('spectatorLeaderDistance').textContent,'1,600 m');

    // Existing per-frame polling still refreshes the spectator's race snapshots.
    const previousPerformance=Object.getOwnPropertyDescriptor(globalThis,'performance');
    Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>2000}});
    try{
      race.update(.016);
      await Promise.resolve();
      assert.ok(refreshed>0,'eliminated player still fetches race updates');
      assert.equal(sent,0);
    }finally{
      if(previousPerformance)Object.defineProperty(globalThis,'performance',previousPerformance);
      else delete globalThis.performance;
    }

    // Final server outcome replaces the spectator card with normal results.
    room.status='results';
    for(const racer of [leader,other]){
      racer.finalDistance=racer.distance;
      racer.raceStatus='dead';
    }
    race.syncFromRoom(room);
    assert.equal(get('multiplayerSpectator').hidden,true);
    assert.equal(get('multiplayerRaceEnd').hidden,true);
    assert.equal(results,1);
    assert.equal(state.screen,'multiplayerResults');
  });
});

test('server-confirmed Chase elimination enables spectator distances as well',async()=>{
  await withDom(async get=>{
    const self=member('self','Player',200,{chaseCaught:false,chaseHealth:30});
    const leader=member('leader','Leader',900);
    const room={id:'r1',status:'racing',selectedMap:'countryside',raceNumber:1,
      chaseModeEnabled:true,members:[self,leader]};
    const state={playing:true,car:{x:2140,vx:0},furthest:2140,screen:'run'};
    const multiplayer={room:()=>room,session:()=>({memberId:'self'}),
      renderRoomScoreboard(){},subscribe(){},async refresh(){}};
    const race=createMultiplayerRace({multiplayer,state,main:{reset(){}},ui:{},
      economy:{runMeters:x=>Math.max(0,(x-140)/10)}});
    race.syncFromRoom(room);
    self.chaseCaught=true;self.raceStatus='dead';self.finalDistance=200;
    race.syncFromRoom(room);
    assert.equal(state.playing,false);
    assert.equal(get('multiplayerRaceEnd').hidden,false);
    assert.equal(get('multiplayerSpectator').hidden,false);
    assert.equal(get('spectatorLeaderDistance').textContent,'900 m');
  });
});

test('spectator names are HTML-escaped before inserting into the leaderboard',async()=>{
  await withDom(async get=>{
    const self=member('self','You',100);
    const attacker=member('other','<img src=x onerror=alert(1)>',500);
    const room={status:'racing',selectedMap:'countryside',raceNumber:1,
      members:[self,attacker]};
    const state={playing:true,car:{x:1140,vx:0},furthest:1140,screen:'run'};
    const multiplayer={room:()=>room,session:()=>({memberId:'self'}),subscribe(){},
      renderRoomScoreboard(){},async finish(){}};
    const race=createMultiplayerRace({multiplayer,state,main:{reset(){}},ui:{},
      economy:{runMeters:x=>(x-140)/10}});
    race.syncFromRoom(room);
    state.playing=false;
    await race.finish('Done');
    assert.ok(!get('spectatorStandings').innerHTML.includes('<img'));
    assert.ok(get('spectatorStandings').innerHTML.includes('&lt;img'));
  });
});

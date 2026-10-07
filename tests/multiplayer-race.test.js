import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {createHandler} from '../supabase/functions/ridge-multiplayer/handler.js';

async function sha(value){
  const data=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(data)].map(n=>n.toString(16).padStart(2,'0')).join('');
}

async function setup(){
  const db=new PGlite({extensions:{pgcrypto}});
  await db.exec('create schema extensions;create role anon;create role authenticated;create role service_role;');
  await db.exec(await readFile(new URL('../supabase/migrations/202610070001_accounts.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202610070002_multiplayer.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202610070004_multiplayer_races.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202610070005_multiplayer_rematches.sql',import.meta.url),'utf8'));

  const rawA='a'.repeat(64),rawB='b'.repeat(64),hashA=await sha(rawA),hashB=await sha(rawB);
  await db.query('select public.ridge_auth($1,$2,$3,$4)',[true,'Driver_A','Password-testing-123',hashA]);
  await db.query('select public.ridge_auth($1,$2,$3,$4)',[true,'Driver_B','Password-testing-456',hashB]);
  await db.query('select public.ridge_save($1,$2,$3,$4,$5)',[hashA,'save',0,1,{balance:100,owned:['base','bike']}]);
  await db.query('select public.ridge_save($1,$2,$3,$4,$5)',[hashB,'save',0,1,{balance:100,owned:['base']}]);

  const rpc=async(name,args)=>{
    const keys=Object.keys(args),params=Object.values(args);
    const sql='select public.'+name+'('+keys.map((key,i)=>key+' => $'+(i+1)).join(',')+') as result';
    return (await db.query(sql,params)).rows[0].result;
  };
  const handler=createHandler({origins:['https://game.test'],pepper:'multiplayer-race-test-pepper-'.repeat(2),rpc});
  const send=async(action,body={},headers={})=>{
    const response=await handler(new Request('https://edge.test',{
      method:'POST',
      headers:{origin:'https://game.test','Content-Type':'application/json',...headers},
      body:JSON.stringify({action,...body})
    }));
    return {status:response.status,data:await response.json()};
  };
  return {db,send,rawA,rawB};
}

test('multiplayer race lifecycle is authoritative from voting through results',async()=>{
  const {db,send,rawA,rawB}=await setup();
  try{
    const host=await send('create',{vehicleId:'base'},{'X-Ridge-Session':rawA});
    assert.equal(host.status,200);
    const code=host.data.room.code;
    const h={'X-Ridge-Multiplayer':host.data.memberToken};

    const second=await send('join',{roomCode:code,vehicleId:'base'},{'X-Ridge-Session':rawB});
    assert.equal(second.status,200);
    const s={'X-Ridge-Multiplayer':second.data.memberToken};

    const guest=await send('join',{roomCode:code,guestName:'Trail Guest',vehicleId:'base'});
    assert.equal(guest.status,200);
    const g={'X-Ridge-Multiplayer':guest.data.memberToken};

    await send('ready',{ready:true},h);
    await send('ready',{ready:true},s);
    await send('ready',{ready:true},g);

    const vehicle=await send('vehicle',{vehicleId:'bike'},h);
    assert.equal(vehicle.status,200);
    assert.equal(vehicle.data.room.members.find(m=>m.id===host.data.memberId).ready,false);
    await send('ready',{ready:true},h);

    const nonHostStart=await send('start',{},s);
    assert.equal(nonHostStart.status,403);

    const started=await send('start',{},h);
    assert.equal(started.status,200);
    assert.equal(started.data.room.status,'voting');
    assert.ok(started.data.room.voteEndsAt);
    assert.equal(started.data.room.members.filter(m=>m.raceActive).length,3);

    const voteA=await send('vote',{mapId:'countryside'},h);
    const voteB=await send('vote',{mapId:'highway'},s);
    const voteG=await send('vote',{mapId:'countryside'},g);
    assert.equal(voteA.status,200);
    assert.equal(voteB.status,200);
    assert.equal(voteG.status,200);
    assert.equal(voteG.data.room.members.find(m=>m.id===guest.data.memberId).voteMapId,'countryside');

    await db.query("update ridge_private.multiplayer_rooms set vote_ends_at=now()-interval '1 second' where code=$1",[code]);
    const countdown=await send('state',{},h);
    assert.equal(countdown.status,200);
    assert.equal(countdown.data.room.status,'countdown');
    assert.equal(countdown.data.room.selectedMap,'countryside');
    assert.ok(countdown.data.room.raceStartAt);
    assert.ok(countdown.data.room.serverTime);

    await db.query("update ridge_private.multiplayer_rooms set race_start_at=now()-interval '1 second' where code=$1",[code]);
    const racing=await send('state',{},h);
    assert.equal(racing.status,200);
    assert.equal(racing.data.room.status,'racing');
    assert.ok(racing.data.room.members.filter(m=>m.raceActive).every(m=>m.raceStatus==='racing'));

    const hostProgress=await send('progress',{distance:123},h);
    assert.equal(hostProgress.status,200);
    assert.equal(hostProgress.data.room.members.find(m=>m.id===host.data.memberId).distance,123);

    const secondProgress=await send('progress',{distance:99},s);
    assert.equal(secondProgress.status,200);
    assert.equal(secondProgress.data.room.members.find(m=>m.id===host.data.memberId).distance,123);
    assert.equal(secondProgress.data.room.members.find(m=>m.id===second.data.memberId).distance,99);

    const hostDead=await send('finish',{distance:123,finishStatus:'dead'},h);
    assert.equal(hostDead.status,200);
    assert.equal(hostDead.data.room.status,'racing');
    const hostRow=hostDead.data.room.members.find(m=>m.id===host.data.memberId);
    assert.equal(hostRow.raceStatus,'dead');
    assert.equal(hostRow.finalDistance,123);

    const cannotRewriteFinal=await send('progress',{distance:999},h);
    assert.equal(cannotRewriteFinal.status,409);
    const afterBlocked=await send('state',{},s);
    assert.equal(afterBlocked.data.room.members.find(m=>m.id===host.data.memberId).finalDistance,123);

    await send('finish',{distance:101,finishStatus:'dead'},s);
    const results=await send('finish',{distance:88,finishStatus:'dead'},g);
    assert.equal(results.status,200);
    assert.equal(results.data.room.status,'results');

    const ranked=results.data.room.members.filter(m=>m.raceActive).sort((a,b)=>(b.finalDistance??b.distance)-(a.finalDistance??a.distance));
    assert.deepEqual(ranked.map(m=>Math.round(m.finalDistance)),[123,101,88]);
    assert.equal(results.data.room.members.find(m=>m.id===host.data.memberId).roomWins,1);
    assert.equal(results.data.room.members.find(m=>m.id===second.data.memberId).roomWins,0);
    assert.equal(results.data.room.members.find(m=>m.id===guest.data.memberId).roomWins,0);

    const nonHostRematch=await send('rematch',{},s);
    assert.equal(nonHostRematch.status,403);

    const rematch=await send('rematch',{},h);
    assert.equal(rematch.status,200);
    assert.equal(rematch.data.room.status,'lobby');
    assert.ok(rematch.data.room.members.every(m=>m.ready===false));
    assert.ok(rematch.data.room.members.every(m=>m.raceActive===false));
    assert.equal(rematch.data.room.members.find(m=>m.id===host.data.memberId).roomWins,1,'room wins survive a rematch');

    await send('ready',{ready:true},h);
    await send('ready',{ready:true},s);
    await send('ready',{ready:true},g);
    const secondRace=await send('start',{},h);
    assert.equal(secondRace.status,200);
    assert.equal(secondRace.data.room.raceNumber,2);

    await send('vote',{mapId:'highway'},h);
    await send('vote',{mapId:'highway'},s);
    await send('vote',{mapId:'countryside'},g);
    await db.query("update ridge_private.multiplayer_rooms set vote_ends_at=now()-interval '1 second' where code=$1",[code]);
    const secondCountdown=await send('state',{},h);
    assert.equal(secondCountdown.data.room.selectedMap,'highway');
    await db.query("update ridge_private.multiplayer_rooms set race_start_at=now()-interval '1 second' where code=$1",[code]);
    await send('state',{},h);

    await send('finish',{distance:80,finishStatus:'dead'},h);
    await send('finish',{distance:160,finishStatus:'dead'},s);
    const secondResults=await send('finish',{distance:90,finishStatus:'dead'},g);
    assert.equal(secondResults.data.room.status,'results');
    assert.equal(secondResults.data.room.members.find(m=>m.id===host.data.memberId).roomWins,1);
    assert.equal(secondResults.data.room.members.find(m=>m.id===second.data.memberId).roomWins,1);
    assert.equal(secondResults.data.room.members.find(m=>m.id===guest.data.memberId).roomWins,0);

    const roomCount=(await db.query('select count(*)::int as n from ridge_private.multiplayer_rooms where code=$1',[code])).rows[0].n;
    assert.equal(roomCount,1,'results room should remain available until players leave or it expires');
  }finally{
    await db.close();
  }
});

test('four clients keep a room scoreboard across races and rematches',async()=>{
  const {db,send,rawA}=await setup();
  try{
    const host=await send('create',{vehicleId:'base'},{'X-Ridge-Session':rawA});
    assert.equal(host.status,200);
    const code=host.data.room.code;
    const h={'X-Ridge-Multiplayer':host.data.memberToken};

    const guests=[];
    for(const name of ['Guest One','Guest Two','Guest Three']){
      const joined=await send('join',{roomCode:code,guestName:name,vehicleId:'base'});
      assert.equal(joined.status,200);
      guests.push({data:joined.data,headers:{'X-Ridge-Multiplayer':joined.data.memberToken}});
    }
    assert.equal(guests[2].data.room.members.length,4);

    for(const headers of [h,...guests.map(g=>g.headers)])await send('ready',{ready:true},headers);
    let started=await send('start',{},h);
    assert.equal(started.status,200);
    assert.equal(started.data.room.raceNumber,1);

    for(const headers of [h,...guests.map(g=>g.headers)])await send('vote',{mapId:'countryside'},headers);
    await db.query("update ridge_private.multiplayer_rooms set vote_ends_at=now()-interval '1 second' where code=$1",[code]);
    await send('state',{},h);
    await db.query("update ridge_private.multiplayer_rooms set race_start_at=now()-interval '1 second' where code=$1",[code]);
    await send('state',{},h);

    await send('finish',{distance:100,finishStatus:'dead'},h);
    await send('finish',{distance:130,finishStatus:'dead'},guests[0].headers);
    await send('finish',{distance:90,finishStatus:'dead'},guests[1].headers);
    let firstResults=await send('finish',{distance:80,finishStatus:'dead'},guests[2].headers);
    assert.equal(firstResults.data.room.status,'results');

    const firstWinner=firstResults.data.room.members.find(m=>m.id===guests[0].data.memberId);
    assert.equal(firstWinner.roomWins,1);
    assert.deepEqual(
      firstResults.data.room.members.map(m=>Number(m.roomWins||0)).sort((a,b)=>b-a),
      [1,0,0,0]
    );

    const rematch=await send('rematch',{},h);
    assert.equal(rematch.status,200);
    assert.equal(rematch.data.room.status,'lobby');
    assert.equal(rematch.data.room.raceNumber,1);
    assert.equal(rematch.data.room.members.find(m=>m.id===guests[0].data.memberId).roomWins,1);

    for(const headers of [h,...guests.map(g=>g.headers)])await send('ready',{ready:true},headers);
    started=await send('start',{},h);
    assert.equal(started.data.room.raceNumber,2);

    for(const headers of [h,...guests.map(g=>g.headers)])await send('vote',{mapId:'highway'},headers);
    await db.query("update ridge_private.multiplayer_rooms set vote_ends_at=now()-interval '1 second' where code=$1",[code]);
    await send('state',{},h);
    await db.query("update ridge_private.multiplayer_rooms set race_start_at=now()-interval '1 second' where code=$1",[code]);
    await send('state',{},h);

    await send('finish',{distance:170,finishStatus:'dead'},h);
    await send('finish',{distance:120,finishStatus:'dead'},guests[0].headers);
    await send('finish',{distance:115,finishStatus:'dead'},guests[1].headers);
    const secondResults=await send('finish',{distance:110,finishStatus:'dead'},guests[2].headers);

    assert.equal(secondResults.data.room.status,'results');
    assert.equal(secondResults.data.room.raceNumber,2);
    assert.equal(secondResults.data.room.members.find(m=>m.id===host.data.memberId).roomWins,1);
    assert.equal(secondResults.data.room.members.find(m=>m.id===guests[0].data.memberId).roomWins,1);
    assert.deepEqual(
      secondResults.data.room.members.map(m=>Number(m.roomWins||0)).sort((a,b)=>b-a),
      [1,1,0,0]
    );
  }finally{
    await db.close();
  }
});

test('frontend multiplayer wiring includes voting, progress, countdown and results without remote physics',async()=>{
  const [multiplayer,lobby,race,main,physics]=await Promise.all([
    readFile(new URL('../dist/multiplayer.js',import.meta.url),'utf8'),
    readFile(new URL('../dist/lobby.js',import.meta.url),'utf8'),
    readFile(new URL('../dist/multiplayerRace.js',import.meta.url),'utf8'),
    readFile(new URL('../dist/main.js',import.meta.url),'utf8'),
    readFile(new URL('../dist/physics.js',import.meta.url),'utf8')
  ]);
  assert.match(multiplayer,/startRace/);
  assert.match(multiplayer,/vote\(mapId\)/);
  assert.match(multiplayer,/progress\(distance\)/);
  assert.match(multiplayer,/async function rematch\(\)/);
  assert.match(lobby,/lobbyVoteGrid/);
  assert.match(lobby,/roomWins/);
  assert.match(lobby,/is-room-leader/);
  assert.match(race,/roomWins/);
  assert.match(race,/multiplayerResultsRematch/);
  assert.match(race,/multiplayerRematchTransition/);
  assert.match(multiplayer,/renderRoomScoreboard/);
  assert.match(multiplayer,/NEXT ·/);
  assert.match(multiplayer,/is-room-leader/);
  assert.match(race,/raceProgressMs/);
  assert.match(race,/main\.reset\(\{mapId:room\.selectedMap,vehicleId:me\.vehicleId,multiplayer:true\}\)/);
  assert.match(main,/options\.mapId/);
  assert.doesNotMatch(physics,/multiplayer/i,'core vehicle physics should not own multiplayer synchronization');
});

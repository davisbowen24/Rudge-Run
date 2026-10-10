import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {createHandler} from '../supabase/functions/ridge-multiplayer/handler.js';

async function sha(value){const data=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(data)].map(n=>n.toString(16).padStart(2,'0')).join('');}

test('multiplayer rooms support guests, accounts, ownership, ready state, host transfer and cleanup',async()=>{
  const db=new PGlite({extensions:{pgcrypto}});
  try{
    await db.exec('create schema extensions;create role anon;create role authenticated;create role service_role;');
    await db.exec(await readFile(new URL('../supabase/migrations/202610070001_accounts.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/202610070002_multiplayer.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/202610070004_multiplayer_races.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/202610070005_multiplayer_rematches.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/202610100001_chase_live_sync.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/202610100002_chase_damage.sql',import.meta.url),'utf8'));
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
    const handler=createHandler({origins:['https://game.test'],pepper:'phase-one-multiplayer-test-pepper-'.repeat(2),rpc});
    const send=async(action,body={},headers={})=>{
      const response=await handler(new Request('https://edge.test',{method:'POST',headers:{origin:'https://game.test','Content-Type':'application/json',...headers},body:JSON.stringify({action,...body})}));
      return {status:response.status,data:await response.json()};
    };

    const guest=await send('create',{guestName:'Guest Host',vehicleId:'base'});assert.equal(guest.status,200);assert.match(guest.data.room.code,/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/);
    const code=guest.data.room.code,guestHeaders={'X-Ridge-Multiplayer':guest.data.memberToken};
    const a=await send('join',{roomCode:code,vehicleId:'bike'},{'X-Ridge-Session':rawA});assert.equal(a.status,200);assert.equal(a.data.room.members.length,2);
    const blocked=await send('join',{roomCode:code,vehicleId:'bike'},{'X-Ridge-Session':rawB});assert.equal(blocked.status,403);
    const b=await send('join',{roomCode:code,vehicleId:'base'},{'X-Ridge-Session':rawB});assert.equal(b.status,200);
    const duplicate=await send('join',{roomCode:code,vehicleId:'base'},{'X-Ridge-Session':rawB});assert.equal(duplicate.status,409);
    assert.equal(guest.data.room.chaseModeEnabled,false);
    const notHost=await send('chase_mode',{enabled:true},{'X-Ridge-Multiplayer':a.data.memberToken});
    assert.equal(notHost.status,403);
    const modeOn=await send('chase_mode',{enabled:true},guestHeaders);
    assert.equal(modeOn.status,200);
    assert.equal(modeOn.data.room.chaseModeEnabled,true);
    const modeOff=await send('chase_mode',{enabled:false},guestHeaders);
    assert.equal(modeOff.data.room.chaseModeEnabled,false);
    const ready=await send('ready',{ready:true},{'X-Ridge-Multiplayer':a.data.memberToken});assert.equal(ready.status,200);assert.equal(ready.data.room.members.find(m=>m.id===a.data.memberId).ready,true);
    const badVehicle=await send('vehicle',{vehicleId:'bike'},{'X-Ridge-Multiplayer':b.data.memberToken});assert.equal(badVehicle.status,403);
    await send('leave',{},guestHeaders);
    const afterHostLeave=await send('state',{}, {'X-Ridge-Multiplayer':a.data.memberToken});assert.equal(afterHostLeave.status,200);assert.equal(afterHostLeave.data.room.hostMemberId,a.data.memberId);
    await send('leave',{}, {'X-Ridge-Multiplayer':a.data.memberToken});
    await send('leave',{}, {'X-Ridge-Multiplayer':b.data.memberToken});
    const count=(await db.query('select count(*)::int as n from ridge_private.multiplayer_rooms')).rows[0].n;assert.equal(count,0);
    const missing=await send('join',{roomCode:'ABCDE',guestName:'Guest Two',vehicleId:'base'});assert.equal(missing.status,404);

    const accountHost=await send('create',{vehicleId:'bike'},{'X-Ridge-Session':rawA});assert.equal(accountHost.status,200);assert.equal(accountHost.data.room.members[0].displayName,'Driver_A');
    const accountHeaders={'X-Ridge-Multiplayer':accountHost.data.memberToken};
    const liveDisabled=await send('progress_live',{distance:10,position:10,velocity:1},accountHeaders);
    assert.equal(liveDisabled.status,409);
    const enable=await send('chase_mode',{enabled:true},accountHeaders);
    assert.equal(enable.data.room.chaseModeEnabled,true);
    // Drive the server directly into racing state; the normal voting countdown
    // is covered elsewhere and must not require wall-clock waits in this test.
    await db.query("update ridge_private.multiplayer_rooms set status='racing',selected_map='countryside' where id=$1",[accountHost.data.room.id]);
    await db.query("update ridge_private.multiplayer_members set race_active=true,race_status='racing' where room_id=$1",[accountHost.data.room.id]);
    const firstLive=await send('progress_live',{distance:300,position:300,velocity:18},accountHeaders);
    assert.equal(firstLive.status,200);
    assert.equal(firstLive.data.room.members[0].livePosition,300);
    assert.equal(firstLive.data.room.members[0].liveVelocity,18);
    assert.ok(firstLive.data.room.members[0].liveSampledAt);
    const reversed=await send('progress_live',{distance:270,position:250,velocity:-10},accountHeaders);
    assert.equal(reversed.status,200);
    assert.equal(reversed.data.room.members[0].distance,300);
    assert.equal(reversed.data.room.members[0].livePosition,250);
    const malformed=await send('progress_live',{distance:300,position:-1,velocity:10},accountHeaders);
    assert.equal(malformed.status,400);
    const completed=await send('finish',{distance:300,finishStatus:'dead'},accountHeaders);
    assert.equal(completed.status,200);
    assert.equal(completed.data.room.status,'results');
    const rematch=await send('rematch',{},accountHeaders);
    assert.equal(rematch.status,200);
    assert.equal(rematch.data.room.members[0].livePosition,null);
    assert.equal(rematch.data.room.members[0].liveVelocity,null);
    assert.equal(rematch.data.room.members[0].liveSampledAt,null);
    await send('leave',{},accountHeaders);
  }finally{await db.close();}
});

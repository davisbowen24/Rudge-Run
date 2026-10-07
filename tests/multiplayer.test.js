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
    const ready=await send('ready',{ready:true},{'X-Ridge-Multiplayer':a.data.memberToken});assert.equal(ready.status,200);assert.equal(ready.data.room.members.find(m=>m.id===a.data.memberId).ready,true);
    const badVehicle=await send('vehicle',{vehicleId:'bike'},{'X-Ridge-Multiplayer':b.data.memberToken});assert.equal(badVehicle.status,403);
    await send('leave',{},guestHeaders);
    const afterHostLeave=await send('state',{}, {'X-Ridge-Multiplayer':a.data.memberToken});assert.equal(afterHostLeave.status,200);assert.equal(afterHostLeave.data.room.hostMemberId,a.data.memberId);
    await send('leave',{}, {'X-Ridge-Multiplayer':a.data.memberToken});
    await send('leave',{}, {'X-Ridge-Multiplayer':b.data.memberToken});
    const count=(await db.query('select count(*)::int as n from ridge_private.multiplayer_rooms')).rows[0].n;assert.equal(count,0);
    const missing=await send('join',{roomCode:'ABCDE',guestName:'Guest Two',vehicleId:'base'});assert.equal(missing.status,404);

    const accountHost=await send('create',{vehicleId:'bike'},{'X-Ridge-Session':rawA});assert.equal(accountHost.status,200);assert.equal(accountHost.data.room.members[0].displayName,'Driver_A');
    await send('leave',{}, {'X-Ridge-Multiplayer':accountHost.data.memberToken});
  }finally{await db.close();}
});

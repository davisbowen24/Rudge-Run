import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {createHandler} from '../supabase/functions/ridge-account/handler.js';

test('actual PostgreSQL schema, bcrypt, RLS grants, full Edge registration/login/save/load/logout',async()=>{
 const db=new PGlite({extensions:{pgcrypto}});
 try{
  await db.exec('create schema extensions;create role anon;create role authenticated;create role service_role;');
  await db.exec(await readFile(new URL('../supabase/migrations/202610070001_accounts.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/tests/security.sql',import.meta.url),'utf8'));
  const handler=createHandler({origins:['https://game.test'],pepper:'test-pepper-not-a-secret-'.repeat(3),rpc:async(name,args)=>{
   const params=Object.values(args);const names=Object.keys(args);const query=`select public.${name}(${names.map((n,i)=>n+' => $'+(i+1)).join(',')}) as result`;
   return (await db.query(query,params)).rows[0].result;
  }});
  const send=async(action,body={},token)=>{
   const response=await handler(new Request('https://edge.test',{method:'POST',headers:{origin:'https://game.test','Content-Type':'application/json',...(token?{'X-Ridge-Session':token}:{})},body:JSON.stringify({action,...body})}));return {status:response.status,data:await response.json()};
  };
  const a=await send('register',{username:'Actual_Driver',password:'Password-testing-123'});assert.equal(a.status,200);
  const b=await send('register',{username:'Another_Driver',password:'Password-testing-456'});assert.equal(b.status,200);
  assert.equal((await send('register',{username:'ACTUAL_DRIVER',password:'Password-testing-123'})).status,409);
  const login=await send('login',{username:'actual_driver',password:'Password-testing-123'});assert.equal(login.status,200);assert.equal(login.data.user.username,'Actual_Driver');
  assert.equal((await send('login',{username:'actual_driver',password:'Password-wrong-123'})).status,401);
  const saved=await send('save',{expectedRevision:0,saveVersion:1,progression:{balance:123,settings:{sound:false}},userId:b.data.user.id},a.data.token);assert.equal(saved.status,200);assert.equal(saved.data.save.userId,a.data.user.id);
  assert.equal((await send('load',{},b.data.token)).data.save,null);
  assert.equal((await send('load',{},login.data.token)).data.save.progression.balance,123);
  assert.equal((await send('save',{expectedRevision:0,saveVersion:1,progression:{balance:999}},a.data.token)).status,409);
  await send('logout',{},a.data.token);assert.equal((await send('load',{},a.data.token)).status,401);
  await db.exec('set role anon');await assert.rejects(()=>db.query('select * from ridge_private.accounts'));await assert.rejects(()=>db.query("select public.ridge_save($1,'load')",['a'.repeat(64)]));await db.exec('reset role');
 }finally{await db.close();}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeSaves } from '../dist/saveMerge.js';
import { validateCredentials } from '../dist/auth.js';
import { createCloudSave } from '../dist/cloudSave.js';
import { createSave } from '../dist/save.js';
import { createHandler } from '../supabase/functions/ridge-account/handler.js';

const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};
function storage(){globalThis.localStorage=memory();globalThis.sessionStorage=memory();globalThis.addEventListener=()=>{};}
const progress=(balance=100)=>({version:4,balance,owned:['base'],ownedMaps:['countryside'],selected:'base',selectedMap:'countryside',levelsByVehicle:{base:{engine:1}},best:{countryside:500},checkpoints:{countryside:['150']},stats:{global:{totalRuns:2,totalCoins:100},maps:{countryside:{bestDistance:500,vehicleId:'base'}},vehicles:{base:{totalRuns:2}},lastRun:null},settings:{sound:false}});

test('merge is idempotent, never adds duplicated currency/totals and retains record attribution',()=>{
 const a=progress(100),b=progress(150);b.owned.push('bike');b.ownedMaps.push('moon');b.levelsByVehicle.base.engine=3;b.stats.global.totalRuns=3;b.stats.maps.countryside={bestDistance:900,vehicleId:'bike'};b.best.countryside=900;b.settings.sound=true;
 const m=mergeSaves(a,b);assert.equal(m.balance,150);assert.equal(m.stats.global.totalRuns,3);assert.equal(m.levelsByVehicle.base.engine,3);assert.equal(m.stats.maps.countryside.vehicleId,'bike');assert.equal(m.settings.sound,false);assert(m.owned.includes('bike'));assert(m.ownedMaps.includes('moon'));assert.deepEqual(mergeSaves(m,b),m);
 assert.equal(Object.hasOwn(mergeSaves(JSON.parse('{"__proto__":{"polluted":true}}'),{}),'__proto__'),false);
});
test('credential validation: case preserved, strong password bounds, no silent bcrypt truncation',()=>{
 assert.doesNotThrow(()=>validateCredentials('Driver_One','long-enough-password'));for(const name of ['ab','has space','x@y','a'.repeat(21)])assert.throws(()=>validateCredentials(name,'long-enough-password'));
 for(const p of ['short','é'.repeat(37),'012345678901\0'])assert.throws(()=>validateCredentials('Driver_One',p));
});
test('legacy guest saves and optional settings survive without account configuration',()=>{
 storage();const s=progress();localStorage.setItem('ridge-run-progress-v3',JSON.stringify(s));const state={};const save=createSave({state,economy:{checkpointDistance:n=>n*500},cloudSave:{initialSave:()=>null,localKey:k=>k,saved(){}}});state.progression=save.freshProgress();save.loadProgress();assert.equal(state.progression.balance,100);assert.equal(state.progression.settings.sound,false);assert.equal(state.progression.levelsByVehicle.base.engine,1);save.saveProgress();assert.equal(JSON.parse(localStorage.getItem('ridge-run-progress-v3')).balance,100);
});

function cloudFixture(){
 storage();let session=null,remote=null,offline=false,conflict=false;const guest=progress(120),state={progression:structuredClone(guest),playing:false};let requests=[];
 const auth={current:()=>session,adopt:s=>session=s,async signOut(){session=null;},async request(action,body){requests.push({action,body});if(offline)throw new Error('offline');if(action==='load')return {save:remote};if(conflict){const e=new Error('conflict');e.status=409;e.remote=remote;throw e;}remote={revision:(remote?.revision||0)+1,progression:body.progression,lastUpdated:'now'};return {save:remote};}};
 let cloud;const save={freshProgress:()=>progress(0),loadProgress:p=>{state.progression=structuredClone(p||guest);},saveProgress:()=>cloud.saved(state.progression)};
 cloud=createCloudSave({auth,state,save,main:{reset(){}},ui:{showScreen(){}}});return {cloud,auth,state,guest,session:{user:{id:'A',username:'Driver_A'},token:'a'.repeat(64)},setOffline:x=>offline=x,setConflict:x=>conflict=x,setRemote:x=>remote=x,requests};
}
test('cloud migration, offline retry, conflict resolution and guest restoration',async()=>{
 const f=cloudFixture();await f.cloud.connect(f.session);assert(f.cloud.choice());await f.cloud.choose('local');assert.equal(f.cloud.user().id,'A');assert.equal(f.requests.at(-1).body.progression.balance,120);
 f.setOffline(true);f.state.progression.balance=333;f.cloud.saved(f.state.progression);await f.cloud.sync();assert.match(f.cloud.status(),/Offline/);assert.equal(JSON.parse(localStorage.getItem('ridge-run-user-v1:A')).progression.balance,333);
 f.setOffline(false);await f.cloud.sync();assert.equal(f.cloud.status(),'Cloud saved');
 f.setRemote({revision:8,progression:progress(444)});f.setConflict(true);f.state.progression.balance=350;f.cloud.saved(f.state.progression);await f.cloud.sync();assert(f.cloud.choice());assert.equal(f.state.progression.balance,350);
 f.setConflict(false);await f.cloud.choose('merge');assert.equal(f.state.progression.balance,444);assert.equal(f.requests.at(-1).body.expectedRevision,8);
 await f.cloud.signOut();assert.equal(f.state.progression.balance,120);assert.equal(f.cloud.user(),null);assert.equal(f.cloud.localKey('ridge-run-progress-v3'),'ridge-run-progress-v3');assert(localStorage.getItem('ridge-run-user-v1:A'));
});
test('pending account cache survives reload and is isolated from another account',async()=>{
 const f=cloudFixture();await f.cloud.connect(f.session);await f.cloud.choose('local');f.setOffline(true);f.state.progression.balance=900;f.cloud.saved(f.state.progression);await f.cloud.signOut();
 f.setOffline(false);await f.cloud.connect(f.session);assert.equal(f.cloud.choice().local.balance,900);await f.cloud.choose('local');assert.equal(f.state.progression.balance,900);await f.cloud.signOut();
 await f.cloud.connect({user:{id:'B',username:'Driver_B'},token:'b'.repeat(64)});assert.equal(f.cloud.choice().local.balance,120);f.cloud.cancel();
});

test('Edge handler validates sessions, rejects wrong origins and never trusts supplied ownership',async()=>{
 let args,lastName;const handler=createHandler({origins:['https://game.test'],pepper:'x'.repeat(64),rpc:async(name,body)=>{args=body;lastName=name;if(name==='ridge_limit')return true;if(name==='ridge_auth')return {user:{id:'A',username:'Driver_A'}};return {save:{userId:'A',revision:1}};}});
 const send=(body,token,origin='https://game.test')=>handler(new Request('https://edge.test',{method:'POST',headers:{origin,'Content-Type':'application/json',...(token?{'X-Ridge-Session':token}:{})},body:JSON.stringify(body)}));
 let r=await send({action:'login',username:'Driver_A',password:'safe-password-123'});assert.equal(r.status,200);const login=await r.json();assert.match(login.token,/^[a-f0-9]{64}$/);assert.notEqual(args.p_token_hash,login.token);assert.equal(login.user.username,'Driver_A');assert.equal(login.password,undefined);
 r=await send({action:'save',userId:'B',username:'Victim',expectedRevision:0,saveVersion:1,progression:progress()},login.token);assert.equal(r.status,200);assert.equal(lastName,'ridge_save');assert.equal(args.userId,undefined);assert.equal(args.p_user_id,undefined);assert.equal((await r.json()).save.userId,'A');
 assert.equal((await send({action:'load'})).status,401);assert.equal((await send({action:'load'},login.token,'https://evil.test')).status,403);
 const expired=createHandler({origins:['https://game.test'],pepper:'x'.repeat(64),rpc:async()=>({unauthorized:true})});assert.equal((await expired(new Request('https://edge.test',{method:'POST',headers:{origin:'https://game.test','Content-Type':'application/json','X-Ridge-Session':login.token},body:'{"action":"load"}'}))).status,401);
});
test('Edge handler propagates revision conflict and fails closed on throttling',async()=>{
 const req=()=>new Request('https://edge.test',{method:'POST',headers:{origin:'https://game.test','Content-Type':'application/json','X-Ridge-Session':'a'.repeat(64)},body:JSON.stringify({action:'save',expectedRevision:1,saveVersion:1,progression:progress()})});
 const h=createHandler({origins:['https://game.test'],pepper:'x'.repeat(64),rpc:async()=>({conflict:true,save:{revision:4}})});assert.equal((await h(req())).status,409);
 const limited=createHandler({origins:['https://game.test'],pepper:'x'.repeat(64),rpc:async()=>false});const r=await limited(new Request('https://edge.test',{method:'POST',headers:{origin:'https://game.test','Content-Type':'application/json'},body:JSON.stringify({action:'login',username:'Driver_A',password:'safe-password-123'})}));assert.equal(r.status,429);
});

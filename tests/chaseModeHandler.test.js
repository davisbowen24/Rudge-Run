import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/ridge-multiplayer/handler.js';

test('separate live telemetry route validates speed without altering normal progress',async()=>{
  const calls=[];
  const rpc=async(name,args)=>{
    calls.push({name,args});
    if(name==='ridge_limit')return true;
    return {room:{chaseModeEnabled:true}};
  };
  const handle=createHandler({
    rpc,origins:['https://game.test'],
    pepper:'valid-test-pepper'.repeat(3)
  });
  const send=async(body)=>{
    const response=await handle(new Request('https://edge.test',{
      method:'POST',
      headers:{origin:'https://game.test','content-type':'application/json',
        'x-ridge-multiplayer':'a'.repeat(64)},
      body:JSON.stringify(body)
    }));
    return {status:response.status,body:await response.json()};
  };

  const live=await send({action:'progress_live',distance:1500,position:1300,velocity:-7});
  assert.equal(live.status,200);
  assert.equal(calls.at(-1).name,'ridge_mp_progress_live');
  assert.equal(calls.at(-1).args.p_distance,1500);
  assert.equal(calls.at(-1).args.p_live_position,1300);
  assert.equal(calls.at(-1).args.p_live_velocity,-7);

  const normal=await send({action:'progress',distance:1550});
  assert.equal(normal.status,200);
  assert.equal(calls.at(-1).name,'ridge_mp_progress');

  const count=calls.filter(({name})=>name==='ridge_mp_progress_live').length;
  for(const invalid of [
    {action:'progress_live',distance:3,position:8,velocity:300},
    {action:'progress_live',distance:3,position:-1,velocity:5},
    {action:'progress_live',distance:3,position:8,velocity:'15'},
    {action:'progress_live',distance:3,position:8,velocity:null}
  ]){
    assert.equal((await send(invalid)).status,400);
  }
  assert.equal(calls.filter(({name})=>name==='ridge_mp_progress_live').length,count);
});

test('mode-disabled response is a conflict instead of silently changing normal races',async()=>{
  const handle=createHandler({
    rpc:async(name)=>name==='ridge_limit'?true:{error:'mode_disabled'},
    origins:['https://game.test'],
    pepper:'valid-test-pepper'.repeat(3)
  });
  const response=await handle(new Request('https://edge.test',{
    method:'POST',
    headers:{origin:'https://game.test','content-type':'application/json',
      'x-ridge-multiplayer':'b'.repeat(64)},
    body:JSON.stringify({action:'progress_live',distance:3,position:2,velocity:1})
  }));
  assert.equal(response.status,409);
});

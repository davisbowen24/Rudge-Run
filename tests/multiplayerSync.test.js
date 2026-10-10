import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldApplyRoomSnapshot } from '../dist/roomRevision.js';
import { createMultiplayer } from '../dist/multiplayer.js';

const TOKEN_A='a'.repeat(64),TOKEN_B='b'.repeat(64);
const time=n=>new Date(1791580000000+n*1000).toISOString();
const room=(revision,players=[],now=revision)=>({
  id:'room-1',code:'ABCDE',revision,serverTime:time(now),
  status:'racing',chaseModeEnabled:true,
  members:players
});

test('room revision guard rejects late, equal-but-older and different-room snapshots',()=>{
  const previous=room(10,[],20);
  assert.equal(shouldApplyRoomSnapshot(previous,room(9,[],21),'ABCDE'),false);
  assert.equal(shouldApplyRoomSnapshot(previous,room(10,[],19),'ABCDE'),false);
  assert.equal(shouldApplyRoomSnapshot(previous,room(10,[],21),'ABCDE'),true);
  assert.equal(shouldApplyRoomSnapshot(previous,room(11,[],18),'ABCDE'),true);
  assert.equal(shouldApplyRoomSnapshot(previous,{...room(11),id:'old-room'},'ABCDE'),false);
  assert.equal(shouldApplyRoomSnapshot(previous,{...room(11),code:'WRONG'},'ABCDE'),false);
  assert.equal(shouldApplyRoomSnapshot(null,room(1),'ABCDE'),true);
});

function withMockBrowser(mockFetch){
  const prior={fetch:globalThis.fetch,document:globalThis.document,sessionStorage:globalThis.sessionStorage};
  globalThis.fetch=mockFetch;
  globalThis.document={getElementById:()=>null};
  let token=TOKEN_A;
  globalThis.sessionStorage={
    getItem:()=>JSON.stringify({memberToken:token,memberId:token===TOKEN_A?'a':'b',roomCode:'ABCDE'}),
    setItem(){},removeItem(){}
  };
  return {
    create(which=TOKEN_A){
      token=which;
      return createMultiplayer({
        auth:{current:()=>null},cloudSave:{user:()=>null},
        state:{screen:'run'}
      });
    },
    restore(){
      globalThis.fetch=prior.fetch;
      globalThis.document=prior.document;
      globalThis.sessionStorage=prior.sessionStorage;
    }
  };
}

test('late refresh cannot overwrite newer progress response',async()=>{
  let count=0,completeLate=null;
  const browser=withMockBrowser(async (_url,options)=>{
    const action=JSON.parse(options.body).action;
    if(action==='state'){
      count++;
      if(count===2)return new Promise(resolve=>{
        completeLate=()=>resolve(new Response(JSON.stringify({room:room(2)})));
      });
      return new Response(JSON.stringify({room:room(1)}));
    }
    if(action==='progress_live')return new Response(JSON.stringify({room:room(5,[{id:'a',livePosition:500}])}));
    throw new Error('Unexpected action: '+action);
  });
  try{
    const client=browser.create();
    assert.equal(await client.refresh(),true);
    const old=client.refresh();
    await client.progressLive(500,500,12);
    assert.equal(client.room().revision,5);
    completeLate();
    await old;
    assert.equal(client.room().revision,5);
    assert.equal(client.room().members[0].livePosition,500);
    client.stopPolling();
  }finally{browser.restore();}
});

test('two separate simulated clients exchange live positions without changing max-distance scoring',async()=>{
  const drivers=new Map([['a',{id:'a',distance:0,livePosition:null,liveVelocity:null}],['b',{id:'b',distance:0,livePosition:null,liveVelocity:null}]]);
  let revision=1;
  const browser=withMockBrowser(async (_url,options)=>{
    const action=JSON.parse(options.body);
    const member=options.headers['X-Ridge-Multiplayer']===TOKEN_A?'a':'b';
    if(action.action==='progress_live'){
      const current=drivers.get(member);
      current.distance=Math.max(current.distance,action.distance);
      current.livePosition=action.position;
      current.liveVelocity=action.velocity;
      current.liveSampledAt=time(revision+1);
      revision++;
    }
    return new Response(JSON.stringify({room:room(revision,[...drivers.values()].map(m=>({...m})))}));
  });
  try{
    const a=browser.create(TOKEN_A),b=browser.create(TOKEN_B);
    await Promise.all([a.refresh(),b.refresh()]);
    await a.progressLive(300,300,20);
    await b.progressLive(280,280,15);
    await a.progressLive(250,210,-10); // moving backward does not decrease score
    await Promise.all([a.refresh(),b.refresh()]);
    for(const client of [a,b]){
      const participants=client.room().members;
      assert.equal(participants.find(p=>p.id==='a').distance,300);
      assert.equal(participants.find(p=>p.id==='a').livePosition,210);
      assert.equal(participants.find(p=>p.id==='a').liveVelocity,-10);
      assert.equal(participants.find(p=>p.id==='b').livePosition,280);
    }
    a.stopPolling();b.stopPolling();
  }finally{browser.restore();}
});

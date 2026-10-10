import test from 'node:test';
import assert from 'node:assert/strict';
import {createLobbyUi} from '../dist/lobby.js';

function fakeDom(){
  const nodes=new Map();
  function node(){
    const handlers=new Map();
    return {
      hidden:false, disabled:false, checked:false, value:'',
      textContent:'', innerHTML:'', className:'', dataset:{},
      children:[],
      classList:{toggle(){}},
      addEventListener(type,fn){handlers.set(type,fn);},
      dispatch(type){
        const handler=handlers.get(type);
        assert.ok(handler,'missing '+type+' listener');
        return handler({target:this,currentTarget:this});
      },
      append(...children){this.children.push(...children);},
      focus(){}
    };
  }
  const document={
    createElement:()=>node(),
    getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);}
  };
  return {document,get:id=>document.getElementById(id)};
}

test('host Chase Mode toggle preserves clicked value through lobby redraw and updates room',async()=>{
  const previous=globalThis.document;
  const dom=fakeDom();
  globalThis.document=dom.document;
  try{
    const host={
      id:'host',displayName:'Host',vehicleId:'base',
      connected:true,isHost:true,ready:false,roomWins:0
    };
    const room={
      code:'ABCDE',status:'lobby',raceNumber:0,
      members:[host],chaseModeEnabled:false
    };
    const requested=[];
    const multiplayer={
      room:()=>room,member:()=>host,session:()=>({memberId:'host'}),
      status:()=> 'Connected',subscribe(){},
      async setChaseMode(enabled){
        requested.push(enabled);
        room.chaseModeEnabled=enabled;
        return room;
      }
    };
    const lobby=createLobbyUi({
      multiplayer,cloudSave:{user:()=>null},
      state:{progression:{selected:'base',owned:['base']}},
      ui:{showScreen(){}},
      race:{syncFromRoom(){}}
    });
    lobby.bindEvents();
    lobby.renderLobby();
    const toggle=dom.get('lobbyChaseMode');
    assert.equal(toggle.disabled,false,'the room host can change Chase Mode');
    assert.equal(toggle.checked,false);

    // A change is fired after the browser updates checked. The action helper
    // redraws with the old server value BEFORE sending the requested update.
    // This previously meant ON clicks always sent OFF to the server.
    toggle.checked=true;
    await toggle.dispatch('change');
    assert.deepEqual(requested,[true]);
    assert.equal(room.chaseModeEnabled,true);
    assert.equal(toggle.checked,true);
    assert.match(dom.get('lobbyChaseModeStatus').textContent,/^ON/);

    toggle.checked=false;
    await toggle.dispatch('change');
    assert.deepEqual(requested,[true,false]);
    assert.equal(room.chaseModeEnabled,false);
    assert.equal(toggle.checked,false);
    assert.match(dom.get('lobbyChaseModeStatus').textContent,/^OFF/);

    host.isHost=false;
    lobby.renderLobby();
    assert.equal(toggle.disabled,true,'a non-host cannot control the lobby setting');
  }finally{
    globalThis.document=previous;
  }
});

test('Chase Mode toggle rolls back visibly and displays request errors',async()=>{
  const previous=globalThis.document;
  const dom=fakeDom();
  globalThis.document=dom.document;
  try{
    const host={
      id:'host',displayName:'Host',vehicleId:'base',
      connected:true,isHost:true,ready:false
    };
    const room={code:'ABCDE',status:'lobby',members:[host],chaseModeEnabled:false};
    const multiplayer={
      room:()=>room,member:()=>host,session:()=>({memberId:'host'}),
      status:()=> 'Connected',subscribe(){},
      async setChaseMode(enabled){
        assert.equal(enabled,true,'the attempted setting reaches the request');
        throw new Error('Unable to save Chase Mode');
      }
    };
    const lobby=createLobbyUi({
      multiplayer,cloudSave:{user:()=>null},
      state:{progression:{selected:'base',owned:['base']}},
      ui:{showScreen(){}},race:{syncFromRoom(){}}
    });
    lobby.bindEvents();
    lobby.renderLobby();
    const toggle=dom.get('lobbyChaseMode');
    toggle.checked=true;
    await toggle.dispatch('change');
    assert.equal(toggle.checked,false,'failed requests restore the server setting');
    assert.equal(room.chaseModeEnabled,false);
    assert.equal(dom.get('multiplayerError').textContent,'Unable to save Chase Mode');
    assert.equal(toggle.disabled,false,'host can retry after an error');
  }finally{
    globalThis.document=previous;
  }
});


test('every waiting-room player can change owned cars and must ready up again',async()=>{
  const previous=globalThis.document;
  const dom=fakeDom();
  globalThis.document=dom.document;
  try{
    const player={
      id:'player',displayName:'Guest',vehicleId:'base',
      connected:true,isHost:false,ready:true,roomWins:0
    };
    const host={
      id:'host',displayName:'Host',vehicleId:'base',
      connected:true,isHost:true,ready:true,roomWins:0
    };
    const room={
      code:'ABCDE',status:'lobby',raceNumber:0,
      members:[host,player],chaseModeEnabled:false
    };
    const updates=[];
    const multiplayer={
      room:()=>room,member:()=>player,session:()=>({memberId:'player'}),
      status:()=> 'Connected',subscribe(){},
      async updateVehicle(id){
        updates.push(id);
        player.vehicleId=id;
        player.ready=false;
        return room;
      }
    };
    const lobby=createLobbyUi({
      multiplayer,cloudSave:{user:()=>null},
      state:{progression:{selected:'base',owned:['base','bike','buggy']}},
      ui:{showScreen(){}},race:{syncFromRoom(){}}
    });
    lobby.bindEvents();
    lobby.renderLobby();

    const picker=dom.get('lobbyVehicle');
    assert.equal(dom.get('lobbyChaseMode').disabled,true,'non-host cannot change Chase Mode');
    assert.equal(picker.disabled,false,'non-host can still change their car');
    assert.match(picker.innerHTML,/value="bike"/);
    assert.match(picker.innerHTML,/value="buggy"/);
    assert.doesNotMatch(picker.innerHTML,/value="supercar"/,'only owned cars are listed');

    // Re-render before request previously reverted the dropdown and sent base.
    picker.value='bike';
    await picker.dispatch('change');
    assert.deepEqual(updates,['bike']);
    assert.equal(player.vehicleId,'bike');
    assert.equal(player.ready,false,'changing cars cancels ready state');
    assert.equal(host.ready,true,'another driver stays ready');
    assert.equal(host.vehicleId,'base','another driver keeps their vehicle');
    assert.equal(picker.value,'bike');
    assert.match(dom.get('lobbyReady').textContent,/Ready Up/);

    picker.value='buggy';
    await picker.dispatch('change');
    assert.deepEqual(updates,['bike','buggy']);
    assert.equal(player.vehicleId,'buggy');
    assert.equal(picker.value,'buggy');

    room.status='voting';
    lobby.renderLobby();
    assert.equal(picker.disabled,true,'cannot change cars after lobby closes');
  }finally{
    globalThis.document=previous;
  }
});

test('failed waiting-room car changes restore previous selection and show an error',async()=>{
  const previous=globalThis.document;
  const dom=fakeDom();
  globalThis.document=dom.document;
  try{
    const player={id:'self',displayName:'Host',vehicleId:'base',ready:false,isHost:true,connected:true};
    const room={code:'ABCDE',status:'lobby',raceNumber:0,members:[player]};
    const requests=[];
    const multiplayer={
      room:()=>room,member:()=>player,session:()=>({memberId:'self'}),
      status:()=> 'Connected',subscribe(){},
      async updateVehicle(id){
        requests.push(id);
        throw new Error('Unable to change vehicle');
      }
    };
    const lobby=createLobbyUi({
      multiplayer,cloudSave:{user:()=>null},
      state:{progression:{selected:'base',owned:['base','bike']}},
      ui:{showScreen(){}},race:{syncFromRoom(){}}
    });
    lobby.bindEvents();
    lobby.renderLobby();
    const picker=dom.get('lobbyVehicle');
    picker.value='bike';
    await picker.dispatch('change');
    assert.deepEqual(requests,['bike'],'new car is sent even if request fails');
    assert.equal(picker.value,'base','failed update rolls back to saved vehicle');
    assert.equal(player.vehicleId,'base');
    assert.equal(dom.get('multiplayerError').textContent,'Unable to change vehicle');
    assert.equal(picker.disabled,false,'can retry');

    picker.value='supercar';
    await picker.dispatch('change');
    assert.deepEqual(requests,['bike'],'cannot request an unowned car');
    assert.equal(picker.value,'base');
    assert.equal(dom.get('multiplayerError').textContent,'That vehicle is not owned.');
  }finally{
    globalThis.document=previous;
  }
});

test('Chaos Mode toggle sends ON and OFF before redraw, including guest host restrictions',async()=>{
  const previous=globalThis.document;
  const dom=fakeDom();globalThis.document=dom.document;
  try{
    const host={id:'host',displayName:'Host',vehicleId:'base',connected:true,isHost:true,ready:false};
    const room={code:'ABCDE',status:'lobby',members:[host],chaosModeEnabled:false,chaseModeEnabled:true};
    const requests=[];
    const multiplayer={room:()=>room,member:()=>host,session:()=>({memberId:'host'}),status:()=> 'Connected',subscribe(){},
      async setChaosMode(enabled){requests.push(enabled);room.chaosModeEnabled=enabled;}};
    const lobby=createLobbyUi({multiplayer,cloudSave:{user:()=>null},state:{progression:{selected:'base',owned:['base']}},ui:{showScreen(){}},race:{syncFromRoom(){}}});
    lobby.bindEvents();lobby.renderLobby();
    const toggle=dom.get('lobbyChaosMode');
    assert.equal(toggle.disabled,false);assert.equal(toggle.checked,false);
    toggle.checked=true;await toggle.dispatch('change');
    assert.deepEqual(requests,[true]);assert.equal(toggle.checked,true);
    assert.equal(room.chaseModeEnabled,true,'Chaos never changes Chase');
    toggle.checked=false;await toggle.dispatch('change');
    assert.deepEqual(requests,[true,false]);assert.equal(toggle.checked,false);
    host.isHost=false;lobby.renderLobby();
    assert.equal(toggle.disabled,true);
    host.isHost=true;room.status='racing';lobby.renderLobby();
    assert.equal(toggle.disabled,true,'no changes during race');
  }finally{globalThis.document=previous;}
});
test('Chaos checkbox rolls back if the server rejects a change',async()=>{
  const previous=globalThis.document;
  const dom=fakeDom();globalThis.document=dom.document;
  try{
    const host={id:'host',displayName:'Host',vehicleId:'base',connected:true,isHost:true,ready:false};
    const room={code:'ABCDE',status:'lobby',members:[host],chaosModeEnabled:false};
    const multiplayer={room:()=>room,member:()=>host,session:()=>({memberId:'host'}),status:()=> 'Connected',subscribe(){},
      async setChaosMode(enabled){assert.equal(enabled,true);throw new Error('Unable to save Chaos Mode');}};
    const lobby=createLobbyUi({multiplayer,cloudSave:{user:()=>null},state:{progression:{selected:'base',owned:['base']}},ui:{showScreen(){}},race:{syncFromRoom(){}}});
    lobby.bindEvents();lobby.renderLobby();
    const toggle=dom.get('lobbyChaosMode');
    toggle.checked=true;await toggle.dispatch('change');
    assert.equal(toggle.checked,false);
    assert.equal(dom.get('multiplayerError').textContent,'Unable to save Chaos Mode');
  }finally{globalThis.document=previous;}
});

test("Loser's Assist is an independent, host-only lobby toggle",async()=>{
  const previous=globalThis.document;
  const dom=fakeDom();globalThis.document=dom.document;
  try{
    const host={id:'host',displayName:'Host',vehicleId:'base',connected:true,isHost:true,ready:false};
    const room={code:'ABCDE',status:'lobby',members:[host],chaseModeEnabled:true,chaosModeEnabled:true,losersAssistEnabled:false};
    const calls=[];
    const multiplayer={room:()=>room,member:()=>host,session:()=>({memberId:'host'}),status:()=> 'Connected',subscribe(){},
      async setLosersAssist(enabled){calls.push(enabled);room.losersAssistEnabled=enabled;}};
    const lobby=createLobbyUi({multiplayer,cloudSave:{user:()=>null},state:{progression:{selected:'base',owned:['base']}},ui:{showScreen(){}},race:{syncFromRoom(){}}});
    lobby.bindEvents();lobby.renderLobby();
    const option=dom.get('lobbyLosersAssist');
    assert.equal(option.disabled,false);
    option.checked=true;await option.dispatch('change');
    assert.deepEqual(calls,[true]);assert.equal(option.checked,true);
    assert.equal(room.chaseModeEnabled,true);assert.equal(room.chaosModeEnabled,true);
    option.checked=false;await option.dispatch('change');
    assert.deepEqual(calls,[true,false]);assert.equal(option.checked,false);
    host.isHost=false;lobby.renderLobby();assert.equal(option.disabled,true);
    host.isHost=true;room.status='racing';lobby.renderLobby();assert.equal(option.disabled,true);
  }finally{globalThis.document=previous;}
});

test("Loser's Assist toggle restores server setting when request fails",async()=>{
  const previous=globalThis.document;
  const dom=fakeDom();globalThis.document=dom.document;
  try{
    const host={id:'host',displayName:'Host',vehicleId:'base',connected:true,isHost:true,ready:false};
    const room={code:'ABCDE',status:'lobby',members:[host],losersAssistEnabled:false};
    const multiplayer={room:()=>room,member:()=>host,session:()=>({memberId:'host'}),status:()=> 'Connected',subscribe(){},
      async setLosersAssist(enabled){assert.equal(enabled,true);throw new Error('Unable to enable assist');}};
    const lobby=createLobbyUi({multiplayer,cloudSave:{user:()=>null},state:{progression:{selected:'base',owned:['base']}},ui:{showScreen(){}},race:{syncFromRoom(){}}});
    lobby.bindEvents();lobby.renderLobby();
    const option=dom.get('lobbyLosersAssist');
    option.checked=true;await option.dispatch('change');
    assert.equal(option.checked,false);
    assert.equal(dom.get('multiplayerError').textContent,'Unable to enable assist');
  }finally{globalThis.document=previous;}
});

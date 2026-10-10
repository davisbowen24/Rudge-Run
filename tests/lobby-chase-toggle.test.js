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

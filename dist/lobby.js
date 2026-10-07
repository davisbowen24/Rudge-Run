import { $ } from './utils.js';
import { VEHICLES, VEHICLE_ORDER } from './vehicles.js';

export function createLobbyUi({multiplayer,cloudSave,state,ui}){
  let busy=false;

  function setError(message=''){$('multiplayerError').textContent=message;}
  function signedUser(){return cloudSave.user();}
  function renderMenu(){
    const user=signedUser();
    $('multiplayerIdentity').textContent=user?'Signed in as '+user.username:'Playing as Guest';
    $('multiplayerGuestWrap').hidden=Boolean(user);
    $('multiplayerVehicle').textContent='Vehicle: '+VEHICLES[state.progression.selected].name;
    $('multiplayerStatus').textContent=multiplayer.status();
    for(const id of ['multiplayerCreate','multiplayerJoin','multiplayerBack'])$(id).disabled=busy;
  }

  function renderMembers(room){
    const list=$('lobbyMembers');list.innerHTML='';
    for(const member of room?.members||[]){
      const card=document.createElement('div');card.className='lobby-member'+(member.id===multiplayer.session()?.memberId?' is-you':'')+(member.connected?'':' is-disconnected');
      const main=document.createElement('div');
      const name=document.createElement('strong');name.textContent=member.displayName+(member.id===multiplayer.session()?.memberId?' (You)':'');
      const meta=document.createElement('small');meta.textContent=(VEHICLES[member.vehicleId]?.name||member.vehicleId)+' · '+(member.connected?'Connected':'Reconnecting');
      main.append(name,meta);
      const badges=document.createElement('div');badges.className='lobby-badges';
      if(member.isHost){const host=document.createElement('span');host.className='lobby-host';host.textContent='HOST';badges.append(host);}
      const ready=document.createElement('span');ready.className=member.ready?'lobby-ready':'lobby-not-ready';ready.textContent=member.ready?'READY':'NOT READY';badges.append(ready);
      card.append(main,badges);list.append(card);
    }
  }

  function renderLobby(){
    const room=multiplayer.room(),me=multiplayer.member();
    if(!room)return;
    $('lobbyCode').textContent=room.code;
    $('lobbyStatus').textContent=multiplayer.status();
    renderMembers(room);
    const owned=new Set(state.progression.owned||['base']);
    $('lobbyVehicle').innerHTML=VEHICLE_ORDER.filter(id=>owned.has(id)).map(id=>'<option value="'+id+'">'+VEHICLES[id].name+'</option>').join('');
    if(me&&owned.has(me.vehicleId))$('lobbyVehicle').value=me.vehicleId;else $('lobbyVehicle').value=state.progression.selected;
    $('lobbyReady').textContent=me?.ready?'Not Ready':'Ready Up';
    $('lobbyReady').classList.toggle('is-ready',Boolean(me?.ready));
    for(const id of ['lobbyReady','lobbyLeave','lobbyVehicle','lobbyCopy'])$(id).disabled=busy;
  }

  async function action(fn){
    if(busy)return;busy=true;setError();renderMenu();renderLobby();
    try{await fn();}
    catch(error){setError(error.message||'Multiplayer request failed.');}
    finally{busy=false;renderMenu();renderLobby();}
  }

  function guestName(){return signedUser()?null:$('multiplayerGuestName').value.trim();}
  function validateGuest(){if(!signedUser()&&!/^[A-Za-z0-9_ -]{2,20}$/.test(guestName()||''))throw new Error('Guest name must be 2–20 letters, numbers, spaces, underscores or hyphens.');}
  function selectedVehicle(){const id=state.progression.selected;return state.progression.owned.includes(id)?id:'base';}

  async function open(){
    if(state.playing)return;
    setError();ui.showScreen('multiplayer');renderMenu();
    if(multiplayer.session())await action(async()=>{if(await multiplayer.resume()){ui.showScreen('lobby');renderLobby();}});
    $('multiplayerCreate').focus();
  }
  function back(){if(busy)return;multiplayer.stopPolling();ui.showScreen('start');$('startMultiplayer').focus();}
  async function createRoom(){validateGuest();await multiplayer.create(guestName(),selectedVehicle());ui.showScreen('lobby');renderLobby();$('lobbyReady').focus();}
  async function joinRoom(){validateGuest();const code=$('multiplayerCode').value.trim().toUpperCase();if(!/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/.test(code))throw new Error('Enter the 5-character room code.');await multiplayer.join(code,guestName(),selectedVehicle());ui.showScreen('lobby');renderLobby();$('lobbyReady').focus();}

  function bindEvents(){
    multiplayer.subscribe(()=>{
      if(state.screen==='multiplayer')renderMenu();
      if(state.screen==='lobby'){
        if(multiplayer.room())renderLobby();else{ui.showScreen('multiplayer');renderMenu();setError(multiplayer.status());}
      }
    });
    $('startMultiplayer').addEventListener('click',()=>open());
    $('multiplayerBack').addEventListener('click',back);
    $('multiplayerCreate').addEventListener('click',()=>action(createRoom));
    $('multiplayerJoin').addEventListener('click',()=>action(joinRoom));
    $('multiplayerCode').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);});
    $('lobbyCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(multiplayer.room()?.code||'');$('lobbyStatus').textContent='Room code copied';}catch{$('lobbyStatus').textContent='Copy unavailable · code is '+(multiplayer.room()?.code||'');}});
    $('lobbyVehicle').addEventListener('change',e=>action(async()=>{const id=e.target.value;if(!state.progression.owned.includes(id))throw new Error('That vehicle is not owned.');await multiplayer.updateVehicle(id);}));
    $('lobbyReady').addEventListener('click',()=>action(()=>multiplayer.setReady(!multiplayer.member()?.ready)));
    $('lobbyLeave').addEventListener('click',()=>action(async()=>{await multiplayer.leave();ui.showScreen('multiplayer');renderMenu();$('multiplayerCreate').focus();}));
    renderMenu();
  }

  return {open,back,bindEvents,renderMenu,renderLobby};
}

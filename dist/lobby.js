import { $ } from './utils.js';
import { VEHICLES, VEHICLE_ORDER } from './vehicles.js';
import { MAPS, MAP_CATALOG } from './maps.js';

export function createLobbyUi({multiplayer,cloudSave,state,ui,race}){
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
    const list=$('lobbyMembers');
    list.innerHTML='';
    for(const member of room?.members||[]){
      const card=document.createElement('div');
      card.className='lobby-member'+(member.id===multiplayer.session()?.memberId?' is-you':'')+(member.connected?'':' is-disconnected');
      const main=document.createElement('div');
      const name=document.createElement('strong');
      name.textContent=member.displayName+(member.id===multiplayer.session()?.memberId?' (You)':'');
      const meta=document.createElement('small');
      const raceLabel=member.raceActive&&room.status!=='lobby'?' · '+String(member.raceStatus||'waiting').toUpperCase():'';
      meta.textContent=(VEHICLES[member.vehicleId]?.name||member.vehicleId)+' · '+(member.connected?'Connected':'Reconnecting')+raceLabel;
      main.append(name,meta);
      const badges=document.createElement('div');
      badges.className='lobby-badges';
      if(member.isHost){
        const host=document.createElement('span');
        host.className='lobby-host';
        host.textContent='HOST';
        badges.append(host);
      }
      const ready=document.createElement('span');
      ready.className=member.ready?'lobby-ready':'lobby-not-ready';
      ready.textContent=member.ready?'READY':'NOT READY';
      badges.append(ready);
      card.append(main,badges);
      list.append(card);
    }
  }

  function voteCounts(room){
    const counts=new Map(MAP_CATALOG.map(([id])=>[id,0]));
    for(const member of room.members||[]){
      if(member.raceActive&&member.voteMapId&&counts.has(member.voteMapId))counts.set(member.voteMapId,counts.get(member.voteMapId)+1);
    }
    return counts;
  }

  function renderVoting(room,me){
    const voting=room.status==='voting',countdown=room.status==='countdown';
    $('lobbyVotePanel').hidden=!voting&&!countdown;
    if(!voting&&!countdown)return;

    const counts=voteCounts(room);
    const deadline=voting?Date.parse(room.voteEndsAt||''):Date.parse(room.raceStartAt||'');
    const server=Date.parse(room.serverTime||'');
    const seconds=Number.isFinite(deadline)&&Number.isFinite(server)?Math.max(0,Math.ceil((deadline-server)/1000)):0;

    if(voting){
      $('lobbyVoteTitle').textContent='Vote for the race map · '+seconds+'s';
      $('lobbyVoteGrid').hidden=false;
      $('lobbyVoteGrid').innerHTML=MAP_CATALOG.map(([id])=>{
        const selected=me?.voteMapId===id;
        return '<button class="map-vote'+(selected?' selected':'')+'" data-vote-map="'+id+'" '+((busy||!me?.raceActive)?'disabled':'')+'><strong>'+MAPS[id].name+'</strong><span>'+counts.get(id)+' vote'+(counts.get(id)===1?'':'s')+'</span></button>';
      }).join('');
      $('lobbyCountdown').hidden=true;
    }else{
      $('lobbyVoteTitle').textContent='Map selected: '+(MAPS[room.selectedMap]?.name||room.selectedMap||'Choosing…');
      $('lobbyVoteGrid').hidden=true;
      $('lobbyCountdown').hidden=false;
      $('lobbyCountdown').textContent=seconds>0?String(Math.min(3,seconds)):'GO';
    }
  }

  function renderLobby(){
    const room=multiplayer.room(),me=multiplayer.member();
    if(!room)return;

    $('lobbyCode').textContent=room.code;
    $('lobbyStatus').textContent=multiplayer.status()+' · '+room.status.toUpperCase();
    $('lobbyFlow').dataset.phase=room.status;
    renderMembers(room);

    const owned=new Set(state.progression.owned||['base']);
    $('lobbyVehicle').innerHTML=VEHICLE_ORDER.filter(id=>owned.has(id)).map(id=>'<option value="'+id+'">'+VEHICLES[id].name+'</option>').join('');
    if(me&&owned.has(me.vehicleId))$('lobbyVehicle').value=me.vehicleId;
    else $('lobbyVehicle').value=state.progression.selected;

    const inLobby=room.status==='lobby';
    $('lobbyReady').textContent=me?.ready?'Not Ready':'Ready Up';
    $('lobbyReady').classList.toggle('is-ready',Boolean(me?.ready));
    $('lobbyReady').disabled=busy||!inLobby;
    $('lobbyVehicle').disabled=busy||!inLobby;
    $('lobbyLeave').disabled=busy;
    $('lobbyCopy').disabled=busy;

    const connected=(room.members||[]).filter(member=>member.connected);
    const everyoneReady=connected.length>0&&connected.every(member=>member.ready);
    const host=Boolean(me?.isHost);
    $('lobbyStart').hidden=!inLobby;
    $('lobbyStart').disabled=busy||!host||!everyoneReady;
    $('lobbyStart').textContent=host?(everyoneReady?'Start Race':'Waiting for Ready Players'):'Host Starts Race';

    renderVoting(room,me);
    race.syncFromRoom(room);
  }

  async function action(fn){
    if(busy)return;
    busy=true;
    setError();
    renderMenu();
    renderLobby();
    try{await fn();}
    catch(error){setError(error.message||'Multiplayer request failed.');}
    finally{
      busy=false;
      renderMenu();
      renderLobby();
    }
  }

  function guestName(){return signedUser()?null:$('multiplayerGuestName').value.trim();}
  function validateGuest(){
    if(!signedUser()&&!/^[A-Za-z0-9_ -]{2,20}$/.test(guestName()||''))throw new Error('Guest name must be 2–20 letters, numbers, spaces, underscores or hyphens.');
  }
  function selectedVehicle(){
    const id=state.progression.selected;
    return state.progression.owned.includes(id)?id:'base';
  }

  async function open(){
    if(state.playing)return;
    setError();
    ui.showScreen('multiplayer');
    renderMenu();
    if(multiplayer.session()){
      await action(async()=>{
        if(await multiplayer.resume()){
          ui.showScreen('lobby');
          renderLobby();
          race.syncFromRoom(multiplayer.room());
        }
      });
    }
    if(state.screen==='multiplayer')$('multiplayerCreate').focus();
  }

  function back(){
    if(busy)return;
    multiplayer.stopPolling();
    ui.showScreen('start');
    $('startMultiplayer').focus();
  }

  async function createRoom(){
    validateGuest();
    await multiplayer.create(guestName(),selectedVehicle());
    ui.showScreen('lobby');
    renderLobby();
    $('lobbyReady').focus();
  }

  async function joinRoom(){
    validateGuest();
    const code=$('multiplayerCode').value.trim().toUpperCase();
    if(!/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/.test(code))throw new Error('Enter the 5-character room code.');
    await multiplayer.join(code,guestName(),selectedVehicle());
    ui.showScreen('lobby');
    renderLobby();
    $('lobbyReady').focus();
  }

  function bindEvents(){
    multiplayer.subscribe(()=>{
      if(state.screen==='multiplayer')renderMenu();
      if(state.screen==='lobby'){
        if(multiplayer.room())renderLobby();
        else{
          ui.showScreen('multiplayer');
          renderMenu();
          setError(multiplayer.status());
        }
      }else if(multiplayer.room()){
        race.syncFromRoom(multiplayer.room());
      }
    });

    $('startMultiplayer').addEventListener('click',()=>open());
    $('multiplayerBack').addEventListener('click',back);
    $('multiplayerCreate').addEventListener('click',()=>action(createRoom));
    $('multiplayerJoin').addEventListener('click',()=>action(joinRoom));
    $('multiplayerCode').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);});
    $('lobbyCopy').addEventListener('click',async()=>{
      try{
        await navigator.clipboard.writeText(multiplayer.room()?.code||'');
        $('lobbyStatus').textContent='Room code copied';
      }catch{
        $('lobbyStatus').textContent='Copy unavailable · code is '+(multiplayer.room()?.code||'');
      }
    });
    $('lobbyVehicle').addEventListener('change',e=>action(async()=>{
      const id=e.target.value;
      if(!state.progression.owned.includes(id))throw new Error('That vehicle is not owned.');
      await multiplayer.updateVehicle(id);
    }));
    $('lobbyReady').addEventListener('click',()=>action(()=>multiplayer.setReady(!multiplayer.member()?.ready)));
    $('lobbyStart').addEventListener('click',()=>action(()=>multiplayer.startRace()));
    $('lobbyVoteGrid').addEventListener('click',e=>{
      const button=e.target.closest('[data-vote-map]');
      if(button)action(()=>multiplayer.vote(button.dataset.voteMap));
    });
    $('lobbyLeave').addEventListener('click',()=>action(async()=>{
      await multiplayer.leave();
      ui.showScreen('start');
      $('startMultiplayer').focus();
    }));
    renderMenu();
  }

  return {open,back,bindEvents,renderMenu,renderLobby};
}

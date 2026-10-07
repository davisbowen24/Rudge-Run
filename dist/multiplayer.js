import { MULTIPLAYER_CONFIG } from './multiplayerConfig.js';

const SESSION_KEY='ridge-run-multiplayer-session-v1';

export function createMultiplayer({auth,cloudSave,state}){
  let session=null,room=null,pollTimer=null,status='Not in a room';
  const listeners=new Set();

  try{
    const saved=JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if(saved?.memberToken&&/^[a-f0-9]{64}$/.test(saved.memberToken)&&saved?.memberId&&saved?.roomCode)session=saved;
  }catch{}

  function emit(){for(const fn of listeners)fn();}
  function setStatus(next){status=next;emit();}
  function persist(){try{if(session)sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));else sessionStorage.removeItem(SESSION_KEY);}catch{}}
  function clearSession(message='Not in a room'){
    stopPolling();
    session=null;
    room=null;
    persist();
    status=message;
    emit();
  }

  async function request(action,body={},useAccount=false){
    if(!MULTIPLAYER_CONFIG.endpoint)throw new Error('Multiplayer is not configured yet.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),MULTIPLAYER_CONFIG.requestTimeoutMs);
    const headers={'Content-Type':'application/json'};
    const accountToken=auth.current()?.token;
    if(useAccount&&accountToken)headers['X-Ridge-Session']=accountToken;
    if(!useAccount&&session?.memberToken)headers['X-Ridge-Multiplayer']=session.memberToken;
    try{
      const response=await fetch(MULTIPLAYER_CONFIG.endpoint,{
        method:'POST',
        headers,
        body:JSON.stringify({action,...body}),
        signal:controller.signal,
        cache:'no-store',
        credentials:'omit'
      });
      let data={};try{data=await response.json();}catch{}
      if(!response.ok){const error=new Error(data.error||'Multiplayer request failed.');error.status=response.status;throw error;}
      return data;
    }catch(error){
      if(error?.name==='AbortError')throw new Error('Multiplayer request timed out.');
      throw error;
    }finally{
      clearTimeout(timer);
    }
  }

  function adopt(data){
    session={memberToken:data.memberToken,memberId:data.memberId,roomCode:data.room.code};
    room=data.room;
    persist();
    status='Connected';
    emit();
    startPolling();
  }

  function applyRoom(data,nextStatus='Connected'){
    if(data?.room)room=data.room;
    status=nextStatus;
    emit();
    return room;
  }

  async function enter(action,guestName,vehicleId,roomCode){
    if(cloudSave.user())await cloudSave.sync();
    setStatus(action==='create'?'Creating room…':'Joining room…');
    const data=await request(action,{guestName:guestName||null,vehicleId,roomCode:roomCode||null},true);
    adopt(data);
    return data.room;
  }

  const create=(guestName,vehicleId)=>enter('create',guestName,vehicleId,null);
  const join=(roomCode,guestName,vehicleId)=>enter('join',guestName,vehicleId,String(roomCode||'').trim().toUpperCase());

  async function refresh(){
    if(!session)return false;
    try{
      applyRoom(await request('state'));
      return true;
    }catch(error){
      if([401,404,410].includes(error.status)){clearSession(error.message||'Room ended');return false;}
      status='Reconnecting…';
      emit();
      return false;
    }
  }

  function startPolling(){
    stopPolling();
    pollTimer=setInterval(()=>{
      if(['lobby','multiplayerResults'].includes(state.screen))refresh();
    },MULTIPLAYER_CONFIG.lobbyPollMs);
  }

  function stopPolling(){
    if(pollTimer){clearInterval(pollTimer);pollTimer=null;}
  }

  async function resume(){
    if(!session)return false;
    const ok=await refresh();
    if(ok)startPolling();
    return ok;
  }

  async function updateVehicle(vehicleId){
    if(!session)throw new Error('Join a room first.');
    return applyRoom(await request('vehicle',{vehicleId}));
  }

  async function setReady(ready){
    if(!session)throw new Error('Join a room first.');
    return applyRoom(await request('ready',{ready:Boolean(ready)}));
  }

  async function startRace(){
    if(!session)throw new Error('Join a room first.');
    return applyRoom(await request('start'));
  }

  async function vote(mapId){
    if(!session)throw new Error('Join a room first.');
    return applyRoom(await request('vote',{mapId}));
  }

  async function progress(distance){
    if(!session)throw new Error('Join a room first.');
    return applyRoom(await request('progress',{distance:Number(distance)}));
  }

  async function finish(distance,finishStatus='dead'){
    if(!session)throw new Error('Join a room first.');
    return applyRoom(await request('finish',{distance:Number(distance),finishStatus}));
  }

  async function rematch(){
    if(!session)throw new Error('Join a room first.');
    return applyRoom(await request('rematch'));
  }

  async function leave(){
    if(!session){clearSession();return;}
    try{await request('leave');}
    finally{clearSession('Left room');}
  }

  function start(){
    addEventListener('online',()=>{if(session&&['lobby','multiplayerResults'].includes(state.screen))refresh();});
    addEventListener('visibilitychange',()=>{if(!document.hidden&&session&&['lobby','multiplayerResults'].includes(state.screen))refresh();});
    if(session)status='Room available to reconnect';
  }

  function member(){
    return room?.members?.find(m=>m.id===session?.memberId)||null;
  }

  return {
    create,join,refresh,resume,updateVehicle,setReady,startRace,vote,progress,finish,rematch,leave,start,startPolling,stopPolling,
    room:()=>room,
    member,
    session:()=>session,
    status:()=>status,
    configured:()=>Boolean(MULTIPLAYER_CONFIG.endpoint),
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
  };
}

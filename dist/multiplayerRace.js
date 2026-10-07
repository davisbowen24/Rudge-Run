import { $ } from './utils.js';
import { VEHICLES } from './vehicles.js';
import { MAPS } from './maps.js';
import { MULTIPLAYER_CONFIG } from './multiplayerConfig.js';

export function createMultiplayerRace({multiplayer,state,main,ui,economy}){
  let active=false,finished=false,serverOffset=0,countdownKey='',countdownTimer=null;
  let lastPush=0,lastRefresh=0,pushInFlight=false,refreshInFlight=false;
  const targets=new Map(),displayed=new Map();

  function nowServer(){return Date.now()+serverOffset;}
  function updateClock(room){
    const server=Date.parse(room?.serverTime||'');
    if(Number.isFinite(server))serverOffset=server-Date.now();
  }
  function distanceNow(){
    return state.furthest===undefined?0:Math.max(0,economy.runMeters(state.furthest));
  }
  function participantMembers(room=multiplayer.room()){
    return (room?.members||[]).filter(member=>member.raceActive);
  }

  function updateTargets(room){
    for(const member of participantMembers(room)){
      const target=Number(member.finalDistance??member.distance??0);
      targets.set(member.id,Math.max(0,target));
      if(!displayed.has(member.id))displayed.set(member.id,target);
    }
  }

  function clearCountdown(){
    if(countdownTimer){clearTimeout(countdownTimer);countdownTimer=null;}
    countdownKey='';
  }

  function startRun(room){
    const me=room?.members?.find(member=>member.id===multiplayer.session()?.memberId);
    if(active||!me?.raceActive||!room?.selectedMap||!MAPS[room.selectedMap])return;
    clearCountdown();
    active=true;
    finished=false;
    state.multiplayerRaceActive=true;
    state.multiplayerRaceNumber=room.raceNumber;
    $('multiplayerRaceEnd').hidden=true;
    $('multiplayerProgress').hidden=false;
    main.reset({mapId:room.selectedMap,vehicleId:me.vehicleId,multiplayer:true});
    updateTargets(room);
  }

  function armCountdown(room){
    const me=room?.members?.find(member=>member.id===multiplayer.session()?.memberId);
    if(!me?.raceActive||!room?.raceStartAt)return;
    const key=room.raceNumber+':'+room.raceStartAt;
    if(countdownKey===key)return;
    clearCountdown();
    countdownKey=key;
    const delay=Math.max(0,Date.parse(room.raceStartAt)-nowServer());
    countdownTimer=setTimeout(()=>startRun(multiplayer.room()||room),delay);
  }

  function resultsRows(room){
    return participantMembers(room).slice().sort((a,b)=>{
      const da=Number(a.finalDistance??a.distance??0),db=Number(b.finalDistance??b.distance??0);
      return db-da||String(a.displayName).localeCompare(String(b.displayName));
    });
  }

  function renderResults(room){
    clearCountdown();
    active=false;
    finished=true;
    state.multiplayerRaceActive=false;
    state.playing=false;
    $('multiplayerProgress').hidden=true;
    $('multiplayerRaceEnd').hidden=true;
    const rows=resultsRows(room),selfId=multiplayer.session()?.memberId;
    $('multiplayerResultsMap').textContent=(MAPS[room.selectedMap]?.name||room.selectedMap||'Unknown map')+' · Room '+room.code;
    $('multiplayerResultsList').innerHTML=rows.map((member,index)=>{
      const distance=Math.round(Number(member.finalDistance??member.distance??0));
      const result=member.raceStatus==='finished'?'FINISHED':'OUT';
      return '<div class="multiplayer-result-row'+(member.id===selfId?' is-you':'')+'"><strong>#'+(index+1)+' '+escapeHtml(member.displayName)+'</strong><span>'+escapeHtml(VEHICLES[member.vehicleId]?.name||member.vehicleId)+' · '+distance.toLocaleString('en-US')+' m · '+result+'</span></div>';
    }).join('');
    ui.showScreen('multiplayerResults');
  }

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function syncFromRoom(room=multiplayer.room()){
    if(!room)return;
    updateClock(room);
    updateTargets(room);
    if(room.status==='countdown')armCountdown(room);
    if(room.status==='racing'){
      const me=room.members?.find(member=>member.id===multiplayer.session()?.memberId);
      if(me?.raceActive&&!active&&!finished)startRun(room);
    }
    if(room.status==='results')renderResults(room);
  }

  function renderProgress(dt){
    if(!active)return;
    const room=multiplayer.room();
    if(!room)return;
    const members=participantMembers(room);
    if(!members.length)return;
    const selfId=multiplayer.session()?.memberId;

    for(const member of members){
      const target=member.id===selfId&&!finished?distanceNow():targets.get(member.id)??0;
      targets.set(member.id,target);
      const current=displayed.get(member.id)??target;
      displayed.set(member.id,current+(target-current)*(1-Math.exp(-dt*8)));
    }

    const scale=Math.max(500,...members.map(member=>Math.max(targets.get(member.id)||0,displayed.get(member.id)||0)))*1.12;
    $('multiplayerProgressMarkers').innerHTML=members.map(member=>{
      const distance=displayed.get(member.id)||0;
      const left=Math.max(1,Math.min(99,distance/scale*100));
      const dead=['dead','finished'].includes(member.raceStatus);
      return '<div class="race-marker'+(member.id===selfId?' is-you':'')+(dead?' is-dead':'')+'" style="left:'+left.toFixed(2)+'%" title="'+escapeHtml(member.displayName)+' · '+Math.round(targets.get(member.id)||0)+' m"><span>'+escapeHtml(member.displayName.slice(0,10))+'</span></div>';
    }).join('');
    $('multiplayerProgressScale').textContent='0 — '+Math.round(scale).toLocaleString('en-US')+' m';
  }

  async function pushProgress(){
    if(pushInFlight||!active||finished||!state.playing)return;
    pushInFlight=true;
    try{
      await multiplayer.progress(distanceNow());
    }catch(error){
      if(error?.status===409)await multiplayer.refresh();
    }finally{
      pushInFlight=false;
    }
  }

  async function refreshAfterFinish(){
    if(refreshInFlight)return;
    refreshInFlight=true;
    try{await multiplayer.refresh();}
    finally{refreshInFlight=false;}
  }

  function update(dt){
    renderProgress(dt);
    if(!active)return;
    const now=performance.now();
    if(!finished&&state.playing&&now-lastPush>=MULTIPLAYER_CONFIG.raceProgressMs){
      lastPush=now;
      pushProgress();
    }else if((finished||!state.playing)&&now-lastRefresh>=MULTIPLAYER_CONFIG.raceRefreshMs){
      lastRefresh=now;
      refreshAfterFinish();
    }
  }

  async function finish(reason,status='dead'){
    if(!active||finished)return;
    finished=true;
    const distance=distanceNow();
    $('multiplayerRaceEndReason').textContent=reason||'Run complete';
    $('multiplayerRaceEndDistance').textContent=Math.round(distance).toLocaleString('en-US')+' m';
    $('multiplayerRaceEnd').hidden=false;
    try{
      await multiplayer.finish(distance,status);
    }catch{
      await multiplayer.refresh();
    }
  }

  function activeRace(){return active;}

  function bindEvents(){
    multiplayer.subscribe(()=>syncFromRoom(multiplayer.room()));
    $('multiplayerResultsLeave').addEventListener('click',async()=>{
      $('multiplayerResultsLeave').disabled=true;
      try{await multiplayer.leave();}
      finally{
        active=false;finished=false;state.multiplayerRaceActive=false;clearCountdown();
        $('multiplayerProgress').hidden=true;$('multiplayerRaceEnd').hidden=true;
        ui.showScreen('start');
        $('multiplayerResultsLeave').disabled=false;
      }
    });
  }

  return {bindEvents,update,finish,active:activeRace,syncFromRoom};
}

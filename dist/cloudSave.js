import { ACCOUNT_CONFIG } from './accountConfig.js';
import { mergeSaves } from './saveMerge.js';
const PREFIX='ridge-run-user-v1:';
export function createCloudSave({auth,state,save,main,ui}){
  let owner=auth.current()?.user||null,pending=null,timer=null,inFlight=false,generation=0,connection=null,status='Guest · saved on this device';
  let onChange=()=>{};
  function read(id){try{return JSON.parse(localStorage.getItem(PREFIX+id));}catch{return null;}}
  if(owner){pending=read(owner.id);if(!pending?.progression){owner=null;auth.adopt(null);}else status=pending.dirty?'Pending Sync':'Checking cloud save…';}
  const localKey=key=>owner?PREFIX+owner.id+':progression':key;
  function initialSave(){return owner?pending?.progression:null;}
  function notify(text){status=text;onChange();}
  function persist(){if(owner&&pending){try{localStorage.setItem(PREFIX+owner.id,JSON.stringify(pending));}catch{notify('Local storage full · keep this tab open');}}}
  function saved(progression){
    if(!owner)return;
    pending={...pending,progression:JSON.parse(JSON.stringify(progression)),dirty:true};generation++;persist();
    if(!connection){notify('Pending Sync');schedule();}
  }
  function schedule(){if(timer)return;timer=setTimeout(()=>{timer=null;sync();},ACCOUNT_CONFIG.syncDelayMs);}
  async function sync(){
    if(!owner||connection||inFlight||!pending?.dirty)return;
    inFlight=true;const userId=owner.id,token=auth.current()?.token,version=generation,snapshot=JSON.parse(JSON.stringify(pending));
    try{
      const result=await auth.request('save',{expectedRevision:snapshot.revision||0,saveVersion:1,progression:snapshot.progression},token);
      if(owner?.id!==userId||auth.current()?.token!==token)return;
      pending.revision=result.save.revision;pending.lastUpdated=result.save.lastUpdated;pending.dirty=version!==generation;persist();notify(pending.dirty?'Pending Sync':'Cloud saved');
    }catch(error){
      if(owner?.id!==userId||auth.current()?.token!==token)return;
      if(error.status===409){connection={session:auth.current(),remote:error.remote,local:pending.progression,conflict:true};notify('Save conflict · choose which progress to keep');}
      else notify(error.status===401?'Session expired · sign in again':'Offline · Pending Sync');
    }finally{inFlight=false;if(owner&&pending?.dirty&&!connection)schedule();}
  }
  async function connect(session){
    const result=await auth.request('load',{},session.token);
    const cached=read(session.user.id);
    connection={session,remote:result.save,local:cached?.dirty?cached.progression:JSON.parse(JSON.stringify(state.progression)),conflict:Boolean(cached?.dirty)};
    notify('Choose the progress to use');
  }
  function apply(progression){
    state.progression=save.freshProgress();save.loadProgress(progression);save.saveProgress();
    main.reset();state.playing=false;ui.showScreen('account');
  }
  async function choose(mode){
    if(!connection||state.playing)return;
    const c=connection,remote=c.remote?.progression;
    // Read current local progress at the moment of conflict resolution, including play while offline.
    const local=!c.conflict||owner?.id===c.session.user.id?state.progression:c.local;
    const next=mode==='cloud'?(remote||save.freshProgress()):mode==='merge'?mergeSaves(local,remote):local;
    auth.adopt(c.session);owner=c.session.user;generation++;
    pending={progression:next,revision:c.remote?.revision||0,dirty:mode!=='cloud',lastUpdated:c.remote?.lastUpdated||null};connection=null;persist();
    apply(next);notify('Pending Sync');await sync();
  }
  async function signOut(){
    clearTimeout(timer);timer=null;const old=owner;owner=null;pending=null;connection=null;generation++;
    // Each user's cache is retained, but guest storage is never replaced by account progress.
    await auth.signOut();state.progression=save.freshProgress();save.loadProgress();main.reset();state.playing=false;ui.showScreen('account');notify('Guest · saved on this device');return old;
  }
  async function refresh(){
    if(!owner)return;
    if(pending?.dirty){await sync();return;}
    const id=owner.id;
    try{
      const result=await auth.request('load');if(owner?.id!==id)return;
      if((result.save?.revision||0)!==(pending?.revision||0)){
        connection={session:auth.current(),remote:result.save,local:state.progression,conflict:true};notify('Cloud progress changed · choose a save');
      }else notify('Cloud saved');
    }catch(error){notify(error.status===401?'Session expired · sign in again':'Offline · local save available');}
  }
  function start(){addEventListener('online',refresh);addEventListener('pagehide',()=>{persist();});refresh();}
  function cancel(){connection=null;notify(owner?'Pending Sync':'Guest · saved on this device');if(owner)schedule();}
  return {localKey,initialSave,saved,sync,connect,choose,signOut,refresh,start,cancel,status:()=>status,user:()=>owner,choice:()=>connection,subscribe:fn=>onChange=fn};
}

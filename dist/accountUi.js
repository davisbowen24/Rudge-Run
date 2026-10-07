import { $ } from './utils.js';
export function createAccountUi({auth,cloudSave,state,ui}){
  let busy=false;
  function render(){
    const user=cloudSave.user(),choice=cloudSave.choice();
    $('accountStatus').textContent=cloudSave.status();$('accountName').textContent=user?.username||'Guest driver';$('menuProfile').textContent=user?.username||'Guest';
    $('accountForms').hidden=Boolean(user)&&!cloudSave.status().startsWith('Session expired');
    $('accountSignedIn').hidden=!user;$('accountChoice').hidden=!choice;
    $('accountSetup').hidden=auth.configured();
    $('accountBack').textContent='Home';
    $('accountLocalChoice').textContent=choice?.conflict?'Use Local Save':'Use Guest Save';
    const describe=p=>`${(p?.balance||0).toLocaleString('en-US')} coins · ${(p?.owned||['base']).length} vehicles · ${(p?.ownedMaps||['countryside']).length} maps`;
    $('accountLocalSummary').textContent=choice?describe(choice.local):'';
    $('accountCloudSummary').textContent=choice?describe(choice.remote?.progression):'';
    for(const id of ['accountLogin','accountRegister','accountLogout','accountSync','accountLocalChoice','accountCloudChoice','accountMergeChoice','accountCancel','accountBack'])$(id).disabled=busy;
  }
  async function action(fn){if(busy)return;busy=true;$('accountError').textContent='';render();try{await fn();}catch(e){$('accountError').textContent=e.message||'Unable to connect. Local progress is safe.';}finally{busy=false;render();}}
  function open(){if(state.playing)return;ui.showScreen('account');render();$('accountBack').focus();}
  function close(){if(busy)return;ui.showScreen('start');$('startAccount').focus();}
  function bindEvents(){
    cloudSave.subscribe(render);$('startAccount').addEventListener('click',open);$('accountBack').addEventListener('click',close);
    async function login(register){await action(async()=>{const username=$('accountUsername').value.trim(),password=$('accountPassword').value;$('accountPassword').value='';const session=await auth.signIn(username,password,register);await cloudSave.connect(session);});}
    $('accountForm').addEventListener('submit',e=>{e.preventDefault();login(false);});
    $('accountRegister').addEventListener('click',()=>login(true));
    $('accountLogout').addEventListener('click',()=>action(()=>cloudSave.signOut()));
    $('accountSync').addEventListener('click',()=>action(()=>cloudSave.refresh()));
    for(const [id,mode] of [['accountLocalChoice','local'],['accountCloudChoice','cloud'],['accountMergeChoice','merge']])$(id).addEventListener('click',()=>action(()=>cloudSave.choose(mode)));
    $('accountCancel').addEventListener('click',()=>cloudSave.cancel());render();
  }
  return {open,close,bindEvents,render};
}

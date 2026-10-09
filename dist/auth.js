import { ACCOUNT_CONFIG } from './accountConfig.js';
const KEY='ridge-run-account-session-v1';
export function validateCredentials(username,password){
  if(!/^[A-Za-z0-9_]{3,20}$/.test(username))throw new Error('Use 3–20 letters, numbers or underscores for your username.');
  const bytes=new TextEncoder().encode(password).length;
  if(password.length<1||bytes>72||password.includes('\0'))throw new Error('Use any non-empty password up to 72 UTF-8 bytes.');
}
export function createAuth(){
  let session=null;
  try{const s=JSON.parse(sessionStorage.getItem(KEY));if(s?.user?.id&&s?.user?.username&&/^[a-f0-9]{64}$/.test(s.token))session=s;}catch{}
  async function request(action,body={},token=session?.token){
    if(!ACCOUNT_CONFIG.endpoint)throw new Error('Accounts are not configured yet. Guest play and local saving are available.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ACCOUNT_CONFIG.requestTimeoutMs);
    try{
      const response=await fetch(ACCOUNT_CONFIG.endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(token?{'X-Ridge-Session':token}:{})},body:JSON.stringify({action,...body}),signal:controller.signal,cache:'no-store',credentials:'omit'});
      const data=await response.json();
      if(!response.ok){const error=new Error(data.error||'Cloud request failed. Your local save is safe.');error.status=response.status;error.remote=data.save;throw error;}
      return data;
    }finally{clearTimeout(timer);}
  }
  async function signIn(username,password,register=false){validateCredentials(username,password);return request(register?'register':'login',{username,password},null);}
  function adopt(next){session=next;try{if(next)sessionStorage.setItem(KEY,JSON.stringify(next));else sessionStorage.removeItem(KEY);}catch{}}
  async function signOut(){const token=session?.token;adopt(null);if(token)try{await request('logout',{},token);}catch{/* Local logout is immediate; server sessions expire automatically. */}}
  return {request,signIn,signOut,adopt,current:()=>session,configured:()=>Boolean(ACCOUNT_CONFIG.endpoint)};
}

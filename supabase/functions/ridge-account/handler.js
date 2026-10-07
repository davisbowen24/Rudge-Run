// Transport adapter is injected so security behavior can be tested without live secrets.
export function createHandler({rpc,origins,pepper}){
  const encoder=new TextEncoder();
  async function digest(value){const b=await crypto.subtle.digest('SHA-256',encoder.encode(value));return [...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,'0')).join('');}
  async function bucket(value){const key=await crypto.subtle.importKey('raw',encoder.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
  return async function handle(req){
    const origin=req.headers.get('origin')||'',allowed=origins.includes(origin);
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'content-type,x-ridge-session','Access-Control-Allow-Methods':'POST,OPTIONS'}:{})};
    const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
    if(!allowed)return reply({error:'Origin not allowed'},403);
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(req.method!=='POST')return reply({error:'Method not allowed'},405);
    if(!pepper||pepper.length<32)return reply({error:'Account service is not configured'},503);
    try{
      if(!req.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON required'},415);
      // Stream cap prevents an unbounded body allocation (do not trust Content-Length).
      const reader=req.body?.getReader();let size=0,chunks=[];
      if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1100000){await reader.cancel();return reply({error:'Request too large'},413);}chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
      let body;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply({error:'Invalid JSON'},400);}
      if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'Invalid request'},400);
      const {action}=body;
      if(action==='register'||action==='login'){
        const {username,password}=body;
        if(typeof username!=='string'||!/^[A-Za-z0-9_]{3,20}$/.test(username)||typeof password!=='string'||password.length<12||encoder.encode(password).length>72||password.includes('\0'))return reply({error:'Invalid username or password format'},400);
        // Username bucket cannot be bypassed by spoofing a proxy/IP header. Global limit bounds signup abuse.
        for(const [name,limit,seconds] of [['auth-global',120,60],['user:'+username.toLowerCase(),10,900],...(action==='register'?[['signup-global',30,3600]]:[])]){
          if(!await rpc('ridge_limit',{p_bucket:await bucket(name),p_limit:limit,p_seconds:seconds}))return reply({error:'Too many attempts. Try again later.'},429);
        }
        const token=[...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');
        const result=await rpc('ridge_auth',{p_register:action==='register',p_username:username,p_password:password,p_token_hash:await digest(token)});
        if(result.error)return reply({error:result.error},action==='register'?409:401);
        return reply({user:result.user,token});
      }
      if(!['load','save','logout'].includes(action))return reply({error:'Unknown action'},400);
      const token=req.headers.get('x-ridge-session')||'';
      if(!/^[a-f0-9]{64}$/.test(token))return reply({error:'Please sign in'},401);
      if(action==='save'&&(!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0||body.saveVersion!==1||!body.progression||typeof body.progression!=='object'||Array.isArray(body.progression)||!Number.isSafeInteger(body.progression.balance)||body.progression.balance<0))return reply({error:'Invalid save'},400);
      const result=await rpc('ridge_save',{p_token_hash:await digest(token),p_action:action,p_expected:body.expectedRevision??null,p_version:body.saveVersion??1,p_progression:body.progression??null});
      if(result.unauthorized)return reply({error:'Session expired. Sign in again.'},401);
      if(result.conflict)return reply({error:'Cloud save changed',save:result.save},409);
      if(result.error)return reply({error:result.error},400);
      return reply(result);
    }catch{return reply({error:'Cloud service unavailable. Your local progress is safe.'},503);}
  };
}

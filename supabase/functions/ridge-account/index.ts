import { createHandler } from './handler.js';
const url=Deno.env.get('SUPABASE_URL')!;
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const handler=createHandler({
 origins:(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(s=>s.trim()).filter(Boolean),
 pepper:Deno.env.get('RATE_LIMIT_PEPPER')||'',
 async rpc(name:string,args:Record<string,unknown>){
   const response=await fetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'},body:JSON.stringify(args)});
   // Never log request bodies, password inputs, tokens, keys or database error details.
   if(!response.ok)throw new Error('Database request failed');
   return response.json();
 }
});
Deno.serve(handler);

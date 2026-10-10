const CODE_ALPHABET='ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function createHandler({rpc,origins,pepper}){
  const encoder=new TextEncoder();
  const randomHex=bytes=>[...crypto.getRandomValues(new Uint8Array(bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
  const randomCode=()=>Array.from({length:5},()=>CODE_ALPHABET[crypto.getRandomValues(new Uint32Array(1))[0]%CODE_ALPHABET.length]).join('');
  async function digest(value){const b=await crypto.subtle.digest('SHA-256',encoder.encode(value));return [...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,'0')).join('');}
  async function bucket(value){const key=await crypto.subtle.importKey('raw',encoder.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
  function statusFor(result){
    if(result?.unauthorized)return 401;
    if(result?.error==='room_not_found')return 404;
    if(['vehicle_not_owned','host_only'].includes(result?.error))return 403;
    if(['room_full','already_in_room','room_closed','code_taken','invalid_state','not_ready','not_participant','race_finished','mode_disabled'].includes(result?.error))return 409;
    return result?.error?400:200;
  }
  return async function handle(req){
    const origin=req.headers.get('origin')||'',allowed=origins.includes(origin);
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'content-type,x-ridge-session,x-ridge-multiplayer','Access-Control-Allow-Methods':'POST,OPTIONS'}:{})};
    const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
    if(!allowed)return reply({error:'Origin not allowed'},403);
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(req.method!=='POST')return reply({error:'Method not allowed'},405);
    if(!pepper||pepper.length<32)return reply({error:'Multiplayer service is not configured'},503);
    try{
      if(!req.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON required'},415);
      const reader=req.body?.getReader();let size=0,chunks=[];
      if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();return reply({error:'Request too large'},413);}chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
      let body;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply({error:'Invalid JSON'},400);}
      if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'Invalid request'},400);
      const action=body.action;

      if(action==='create'||action==='join'){
        const accountToken=req.headers.get('x-ridge-session')||'';
        if(accountToken&&!/^[a-f0-9]{64}$/.test(accountToken))return reply({error:'Invalid account session'},401);
        const guestName=typeof body.guestName==='string'?body.guestName.trim():'';
        const vehicleId=typeof body.vehicleId==='string'?body.vehicleId:'';
        if(!accountToken&&!/^[A-Za-z0-9_ -]{2,20}$/.test(guestName))return reply({error:'Guest name must be 2–20 letters, numbers, spaces, underscores or hyphens.'},400);
        if(!/^[a-z0-9_-]{1,32}$/.test(vehicleId))return reply({error:'Invalid vehicle'},400);
        const identity=accountToken||origin+':guest:'+guestName.toLowerCase();
        for(const [name,limit,seconds] of [['mp-global',180,60],['mp:'+action+':'+identity,20,60]]){
          if(!await rpc('ridge_limit',{p_bucket:await bucket(name),p_limit:limit,p_seconds:seconds}))return reply({error:'Too many multiplayer requests. Try again shortly.'},429);
        }
        const memberToken=randomHex(32),memberHash=await digest(memberToken),accountHash=accountToken?await digest(accountToken):null;
        if(action==='create'){
          for(let attempt=0;attempt<8;attempt++){
            const result=await rpc('ridge_mp_create',{p_account_token_hash:accountHash,p_member_token_hash:memberHash,p_room_code:randomCode(),p_guest_name:guestName||null,p_vehicle_id:vehicleId});
            if(result?.error==='code_taken')continue;
            const status=statusFor(result);if(status!==200)return reply({error:result.error||'Unable to create room'},status);
            return reply({...result,memberToken});
          }
          return reply({error:'Unable to allocate a room code. Try again.'},503);
        }
        const roomCode=typeof body.roomCode==='string'?body.roomCode.trim().toUpperCase():'';
        if(!/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/.test(roomCode))return reply({error:'Invalid room code'},400);
        const result=await rpc('ridge_mp_join',{p_account_token_hash:accountHash,p_member_token_hash:memberHash,p_room_code:roomCode,p_guest_name:guestName||null,p_vehicle_id:vehicleId});
        const status=statusFor(result);if(status!==200)return reply({error:result.error||'Unable to join room'},status);
        return reply({...result,memberToken});
      }

      if(!['state','vehicle','ready','chase_mode','start','vote','progress','progress_live','finish','rematch','leave'].includes(action))return reply({error:'Unknown action'},400);
      const memberToken=req.headers.get('x-ridge-multiplayer')||'';
      if(!/^[a-f0-9]{64}$/.test(memberToken))return reply({error:'Join a room first'},401);
      const tokenHash=await digest(memberToken);

      if(!await rpc('ridge_limit',{p_bucket:await bucket('mp-member:'+tokenHash),p_limit:600,p_seconds:60})){
        return reply({error:'Too many multiplayer requests. Try again shortly.'},429);
      }

      let result;
      if(action==='state')result=await rpc('ridge_mp_state',{p_member_token_hash:tokenHash});

      if(action==='vehicle'){
        if(typeof body.vehicleId!=='string'||!/^[a-z0-9_-]{1,32}$/.test(body.vehicleId))return reply({error:'Invalid vehicle'},400);
        result=await rpc('ridge_mp_vehicle',{p_member_token_hash:tokenHash,p_vehicle_id:body.vehicleId});
      }

      if(action==='ready'){
        if(typeof body.ready!=='boolean')return reply({error:'Invalid ready state'},400);
        result=await rpc('ridge_mp_ready',{p_member_token_hash:tokenHash,p_ready:body.ready});
      }

      if(action==='chase_mode'){
        if(typeof body.enabled!=='boolean')return reply({error:'Invalid Chase Mode setting'},400);
        result=await rpc('ridge_mp_chase_mode',{p_member_token_hash:tokenHash,p_enabled:body.enabled});
      }

      if(action==='start')result=await rpc('ridge_mp_start',{p_member_token_hash:tokenHash});

      if(action==='vote'){
        if(typeof body.mapId!=='string'||!/^[a-z0-9_-]{1,32}$/.test(body.mapId))return reply({error:'Invalid map'},400);
        result=await rpc('ridge_mp_vote',{p_member_token_hash:tokenHash,p_map_id:body.mapId});
      }

      if(action==='progress'){
        if(typeof body.distance!=='number'||!Number.isFinite(body.distance)||body.distance<0||body.distance>10000000)return reply({error:'Invalid distance'},400);
        result=await rpc('ridge_mp_progress',{p_member_token_hash:tokenHash,p_distance:body.distance});
      }

      // Live telemetry is a separate opt-in route. Ordinary races still use
      // the unchanged progress action and monotonic distance scoring.
      if(action==='progress_live'){
        const inRange=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
        if(!inRange(body.distance,0,10000000)||!inRange(body.position,0,10000000)||!inRange(body.velocity,-200,200))
          return reply({error:'Invalid live telemetry'},400);
        result=await rpc('ridge_mp_progress_live',{
          p_member_token_hash:tokenHash,
          p_distance:body.distance,
          p_live_position:body.position,
          p_live_velocity:body.velocity
        });
      }

      if(action==='finish'){
        if(typeof body.distance!=='number'||!Number.isFinite(body.distance)||body.distance<0||body.distance>10000000)return reply({error:'Invalid distance'},400);
        if(!['dead','finished'].includes(body.finishStatus))return reply({error:'Invalid finish state'},400);
        result=await rpc('ridge_mp_finish',{p_member_token_hash:tokenHash,p_distance:body.distance,p_status:body.finishStatus});
      }

      if(action==='rematch')result=await rpc('ridge_mp_rematch',{p_member_token_hash:tokenHash});

      if(action==='leave')result=await rpc('ridge_mp_leave',{p_member_token_hash:tokenHash});

      const status=statusFor(result);
      if(status!==200)return reply({error:result.error||'Room unavailable'},status);
      return reply(result);
    }catch{
      return reply({error:'Multiplayer service unavailable.'},503);
    }
  };
}

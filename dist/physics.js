import { MAPS, SEASONS } from './maps.js';
import { CONFIG, GRAVITY_SCALE, MAX_LEVEL } from './config.js';
import { $, clamp } from './utils.js';

export function createPhysics({ stats, moments, state, terrain, ui, save, input, economy }) {

  function environmentalLoss(v){
    if(biomeLoss())
    return true;
    if(state.activeMap==='construction'){
      const s=terrain.constructionAt(state.car.x);
      if(s.kind==='gap'&&state.car.y>Math.max(s.y0,s.y1)+160){
        ui.end('Fell into the construction pit');
        return true;
      }
    }

    if(MAPS[state.activeMap].flags.rooftops){
      const r=terrain.roofAt(state.car.x);
      if(state.car.x>=r.edge&&state.car.y>Math.max(r.y,terrain.roofAt(r.end+1).y)+140){
        ui.end('Fell between rooftops');
        return true;
      }
    }

    if(MAPS[state.activeMap].flags.ceiling){
      const h=point(v.head.x,v.head.y);
      if(h.y-12<=terrain.caveCeiling(h.x)){
        ui.end('Hit the cave ceiling');
        return true;
      }
    }

    return false;

  }

  function effectiveGravity(id,t){
    return MAPS[id].gravity*GRAVITY_SCALE*(id==='alien'?1+.12*Math.sin(t*Math.PI/6):1);
  }

  function bubbleLift(x,y){
    if(state.activeMap!=='underwater')
    return 0;
    const f=terrain.biomeAt(state.activeMap,x);
    if(f?.kind!=='bubbles')
    return 0;
    const h=terrain.ground(x)-y;
    if(h<0||h>360)
    return 0;
    return CONFIG.world.gravity*1.65*MAPS.underwater.hazardSeverity*(1-.4*Math.abs(x-f.x)/f.width)*(1-h/500);
  }

  function hydraulicImpact(v,incoming){

    if(v.visualType!=='lowrider'||!state.car.grounded||incoming<150||state.time<(state.car.hydraulicReady||0))
    return false;

    state.car.hydraulicReady=state.time+.9;
    const tuning=save.levelsFor('lowrider').suspension/MAX_LEVEL;

    state.car.vy=Math.min(state.car.vy,-Math.min(260+100*tuning,incoming*(.24+.12*tuning)));
    return true;

  }

  function speedPadImpact(){
    if(state.activeMap!=='neon')
    return false;
    const w=state.car.wheels.find(w=>w.normal>0&&terrain.biomeAt(state.activeMap,w.x)?.kind==='boost');
    if(!w)
    return false;
    const f=terrain.biomeAt(state.activeMap,w.x);
    if(state.usedBoostPads.has(f.key))
    return false;
    state.usedBoostPads.add(f.key);
    state.car.vx+=180*MAPS.neon.hazardSeverity;
    ui.showBonus('NEON BOOST!','Keep your wheels level');
    return true;
  }

  function updateBridgeMotion(dt){
    if(!['jungle','countryside'].includes(state.activeMap))
    return;

    for(const f of terrain.biomeNear(state.activeMap,state.car.x)){
      if(f.kind!=='bridge')
      continue;
      let b=state.bridgeMotion.get(f.key)||{y:0,v:0};

      const loaded=state.car.grounded&&state.car.x>f.a&&state.car.x<f.b;

      const target=loaded?MAPS[state.activeMap].hazardSeverity*Math.min(32,10+CONFIG.vehicle.mass*.6)*Math.sin((state.car.x-f.a)/(f.b-f.a)*Math.PI):0;

      b.v+=((target-b.y)*45-b.v*4)*dt;
      b.y=clamp(b.y+b.v*dt,-12,40);
      state.bridgeMotion.set(f.key,b);

    }
    for(const key of state.bridgeMotion.keys())
    if(!terrain.biomeNear(state.activeMap,state.car.x).some(f=>f.key===key))
    state.bridgeMotion.delete(key);

  }

  function thermalAcceleration(x,y){
    if(state.activeMap!=='volcano')
    return 0;
    const f=terrain.biomeNear(state.activeMap,x).find(f=>f.kind==='lava'&&Math.abs(x-f.a)<180);
    if(!f)
    return 0;
    const h=f.ya-y;
    if(h<0||h>330)
    return 0;
    const pulse=((state.time+f.cell*.7)%5)<3;
    return pulse?CONFIG.world.gravity*1.8*MAPS.volcano.hazardSeverity*(1-Math.abs(x-f.a)/180)*(1-h/400):0;
  }

  function slimeImpact(v,incoming){
    if(!['wasteland','alien'].includes(state.activeMap)||state.time<state.slimeCooldown||incoming<45)
    return false;

    const hit=state.car.wheels.some(w=>w.normal>0&&terrain.biomeAt(state.activeMap,w.x)?.kind===(state.activeMap==='alien'?'crystal':'slime'));
    if(!hit)
    return false;

    state.car.vy=-Math.min(820,380+incoming*.85)*MAPS[state.activeMap].hazardSeverity;
    state.car.grounded=false;
    state.slimeCooldown=state.time+.65;
    ui.showBonus(state.activeMap==='alien'?'CRYSTAL LAUNCH!':'SLIME LAUNCH!','Level out for the landing');
    return true;

  }

  function biomeLoss(){
    const f=terrain.biomeAt(state.activeMap,state.car.x);
    if(f&&['crevasse','lava','spectral'].includes(f.kind)&&state.car.y>Math.max(f.ya,f.yb)+125){
      ui.end(f.kind==='spectral'?'Lost in the haunted trench':f.kind==='lava'?'Landed in lava':'Fell into a crevasse');
      return true;
    }
    return false;
  }

  function point(x,y){
    y-=CONFIG.vehicle.comOffsetY;
    const c=Math.cos(state.car.a),s=Math.sin(state.car.a);
    return {x:state.car.x+x*c-y*s,y:state.car.y+x*s+y*c};
  }

  function rideHeight(v){
    return v.wheels.reduce((sum,w)=>sum+w.y+w.r+v.suspensionTravel,0)/v.wheels.length-v.mass*CONFIG.world.gravity/(v.wheels.length*v.suspension)-v.comOffsetY;
  }

  function wheelFloor(x,r){
    let y=Infinity;
    for(const fraction of [-.8,-.4,0,.4,.8]){
      const dx=r*fraction;
      y=Math.min(y,terrain.ground(x+dx)-Math.sqrt(r*r-dx*dx));
    }
    return y;
  }

  function wheelPose(w,length){
    const anchor=point(w.x,w.y),center=point(w.x,w.y+length);
    return {...center,anchor,r:w.r,length};
  }

  function terrainNormal(x,r){
    const k=(wheelFloor(x+1,r)-wheelFloor(x-1,r))/2,d=Math.hypot(k,1);
    return {x:k/d,y:-1/d,tx:1/d,ty:k/d};
  }

  function strutContact(w,v){
    const min=v.suspensionMin,max=v.suspensionTravel,gap=l=>{
      const p=wheelPose(w,l);
      return wheelFloor(p.x,w.r)-p.y;
    };
    let lo=min,hi=min,hit=gap(min)<=0;
    if(!hit){
      for(let l=min+6;l<max+6;l+=6){
        hi=Math.min(max,l);
        if(gap(hi)<=0){
          hit=true;
          break;
        }
        lo=hi;
      }
    }
    if(hit&&hi>lo)
    for(let n=0;n<7;n++){
      const mid=(lo+hi)/2;
      if(gap(mid)>0)
      lo=mid;else
      hi=mid;
    }
    const length=hit?hi:max,p=wheelPose(w,length),normal=terrainNormal(p.x,w.r);
    return {...p,normal,hit,compression:max-length};
  }

  function syncWheelGeometry(){
    const v=CONFIG.vehicle;
    state.car.wheels=v.wheels.map((w,i)=>({...wheelPose(w,state.car.wheelLengths[i]),normal:state.car.wheels[i]?.normal||0,spin:state.car.wheelPhases[i]}));
  }

  function engineForce(v,speed,radius){
    return Math.min(v.acceleration*v.mass,v.engineTorque/radius,v.enginePower/Math.max(20,Math.abs(speed)));
  }

  function applyContactImpulse(p,n,depth){
    const v=CONFIG.vehicle,rx=p.x-state.car.x,ry=p.y-state.car.y,arm=rx*n.y-ry*n.x,inverseMass=1/v.mass+arm*arm/v.inertia;
    const vn=(state.car.vx-state.car.av*ry)*n.x+(state.car.vy+state.car.av*rx)*n.y;
    if(vn<0){
      const impulse=-vn/inverseMass;
      state.car.vx+=n.x*impulse/v.mass;
      state.car.vy+=n.y*impulse/v.mass;
      state.car.av+=arm*impulse/v.inertia;
    }
    const correction=Math.min(Math.max(0,depth),14)*.7;
    let positionalImpulse=correction/inverseMass;
    if(Math.abs(arm)>1e-8)
    positionalImpulse=Math.min(positionalImpulse,.12*v.inertia/Math.abs(arm));
    state.car.x+=n.x*positionalImpulse/v.mass;
    state.car.y+=n.y*positionalImpulse/v.mass;
    state.car.a+=arm*positionalImpulse/v.inertia;
  }

  function touchesPickup(item,v){
    const x=item.x,y=item.y+Math.sin(state.time*2.8+item.x)*4-(item.type==='coin'?2:0),r=item.type==='coin'?14:13;

    if(state.car.wheels.some(w=>Math.hypot(x-w.x,y-w.y)<=w.r+(v.tracked?6:2)+r))
    return true;

    const dx=x-state.car.x,dy=y-state.car.y,c=Math.cos(state.car.a),s=Math.sin(state.car.a),lx=dx*c+dy*s,ly=-dx*s+dy*c+v.comOffsetY;

    if(Math.hypot(lx-v.head.x,ly-v.head.y)<=12+r)
    return true;

    const poly=v.pickupPolygon??(v.visualType==='bike'?[[-26,-22],[5,-22],[26,-10],[31,12],[-31,10]]:v.visualType==='tractor'?[[-57,9],[-57,-17],[-27,-20],[3,-23],[51,-16],[58,11]]:v.tracked?[[-95,-12],[-84,7],[61,-4],[86,-17],[85,-28],[49,-21]]:[[-v.halfWidth,-7],[-38,-20],[20,-20],[30,-10],[v.halfWidth,-7],[v.halfWidth,13],[-v.halfWidth,13]]);

    const cab=v.visualType==='tractor'?[-40,-55,3,-18]:v.tracked?null:v.visualType==='base'?[-28,-37,13,-18]:v.visualType==='monster'?[-28,-51,13,-18]:null;
    if(cab&&Math.hypot(lx-clamp(lx,cab[0],cab[2]),ly-clamp(ly,cab[1],cab[3]))<=r)
    return true;

    let inside=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const [ax,ay]=poly[j],[bx,by]=poly[i],ex=bx-ax,ey=by-ay,t=clamp(((lx-ax)*ex+(ly-ay)*ey)/(ex*ex+ey*ey),0,1);
      if(Math.hypot(lx-ax-t*ex,ly-ay-t*ey)<=r)
      return true;
      if((ay>ly)!==(by>ly)&&lx<(bx-ax)*(ly-ay)/(by-ay)+ax)
      inside=!inside;
    }
    return inside;
  }

  function monowheelContact(v){
    if(v.visualType!=='monowheel')return null;
    const candidates=[];
    // The entire round tire can grip, even when the chassis strut points sideways/up.
    for(let i=0;i<v.wheels.length;i++){
      const w=v.wheels[i],p=wheelPose(w,state.car.wheelLengths[i]);
      candidates.push({p,n:terrainNormal(p.x,w.r),depth:p.y-wheelFloor(p.x,w.r),radius:w.r});
    }
    // Sample the existing visible frame perimeter, not a larger invisible drive zone.
    const frame=[[-22,4],[-24,-30],[18,-32],[24,4]];
    for(let i=0;i<frame.length;i++){
      const a=frame[i],b=frame[(i+1)%frame.length];
      for(let j=0;j<=8;j++){
        const p=point(a[0]+(b[0]-a[0])*j/8,a[1]+(b[1]-a[1])*j/8),k=terrain.slope(p.x),d=Math.hypot(k,1);
        candidates.push({p,n:{x:k/d,y:-1/d,tx:1/d,ty:k/d},depth:p.y-terrain.ground(p.x),radius:v.wheelRadius});
      }
    }
    return candidates.filter(c=>c.depth>=-.5).sort((a,b)=>b.depth-a.depth)[0]||null;
  }

  function groundSupportFactor(v){
    const supported=v.wheels.filter((w,i)=>state.car.wheels[i]?.normal>0);
    if(supported.length<2)
    return .2;
    const span=Math.max(...supported.map(w=>w.x))-Math.min(...supported.map(w=>w.x));
    return .2+.8*clamp(span/(v.wheelBase*.7),0,1);
  }

  function groundPitchTorque(v,contacts){
    if(!contacts)
    return 0;
    const span=v.halfWidth,target=Math.atan2((MAPS[state.activeMap].flags.rooftops?terrain.roofDeck(state.car.x+span):state.activeMap==='construction'?terrain.segmentHeight(terrain.constructionAt(state.car.x+span),state.car.x+span):['arctic','volcano','haunted'].includes(state.activeMap)?terrain.baseTerrainHeight(state.activeMap,state.car.x+span):terrain.ground(state.car.x+span))-(MAPS[state.activeMap].flags.rooftops?terrain.roofDeck(state.car.x-span):state.activeMap==='construction'?terrain.segmentHeight(terrain.constructionAt(state.car.x-span),state.car.x-span):['arctic','volcano','haunted'].includes(state.activeMap)?terrain.baseTerrainHeight(state.activeMap,state.car.x-span):terrain.ground(state.car.x-span)),2*span),error=Math.atan2(Math.sin(state.car.a-target),Math.cos(state.car.a-target)),fade=clamp((1.1-Math.abs(error))/.55,0,1),lean=Math.sign(error)*Math.max(0,Math.abs(error)-.1),strength=v.pitchSupport*groundSupportFactor(v);
    return v.inertia*fade*strength*clamp(-lean*9-state.car.av*1.8,-9,9);
  }

  function airAngularAcceleration(omega,control,v){
    let acceleration=-control*v.airTilt*v.airControl*(v.airResponse??1)*MAPS[state.activeMap].air;
    // Agile vehicles can counter-rotate harder than they accelerate in the same direction,
    // so the rider can arrest a flip quickly instead of waiting for momentum to bleed away.
    if(acceleration*omega<0)
    acceleration*=v.airBrake??1;
    if(Math.abs(omega)>=v.maxRotation&&acceleration*omega>0)
    return 0;
    return acceleration;
  }

  function step(dt){
    if(!state.playing||state.paused)
    return;
    if(Math.hypot(state.car.vx,state.car.vy)*dt>8&&dt>1/480){
      const parts=Math.min(4,Math.ceil(Math.hypot(state.car.vx,state.car.vy)*dt/8));
      for(let j=0;j<parts;j++)
      step(dt/parts);
      return;
    }
    const v=CONFIG.vehicle;
    const gas=input.input('gas'),brake=input.input('brake');
    if(gas||brake)
    state.started=true;
    state.time+=dt;
    CONFIG.world.gravity=effectiveGravity(state.activeMap,state.time);
    state.bonusEvents=state.bonusEvents.filter(e=>(e.age+=dt)<3);
    if(!state.started)
    return;
    updateBridgeMotion(dt);
    stats.beforeStep();
    moments.beforeStep();
    const impactVelocity=state.car.vy;
    const angleBefore=state.car.a,control=Number(gas)-Number(brake),axis={x:-Math.sin(state.car.a),y:Math.cos(state.car.a)},forward={x:Math.cos(state.car.a),y:Math.sin(state.car.a)};

    const previousTrackLoad=state.car.wheels.reduce((sum,w)=>sum+(w.normal||0),0);// Downforce tilts forward from the local suspension axis; magnitude scales with map gravity.

    const raceDownforce=v.visualType==='formula'&&state.car.grounded?v.downforceScale*Math.min(2.5,Math.pow(state.car.vx/400,2)):0;
    const downforce=v.mass*CONFIG.world.gravity*(v.downforce+raceDownforce),downforceAngle=v.downforceAngle*Math.PI/180,downAxis={x:axis.x*Math.cos(downforceAngle)+forward.x*Math.sin(downforceAngle),y:axis.y*Math.cos(downforceAngle)+forward.y*Math.sin(downforceAngle)},supportLoad=v.mass*CONFIG.world.gravity+downforce*Math.cos(downforceAngle);
    let fx=downAxis.x*downforce,fy=v.mass*CONFIG.world.gravity+downAxis.y*downforce,torque=0,contacts=0;
    fy-=v.mass*bubbleLift(state.car.x,state.car.y);
    if(state.activeMap==='underwater'){
      fx-=v.mass*.14*MAPS[state.activeMap].drag*state.car.vx;
      fy-=v.mass*.38*MAPS[state.activeMap].drag*state.car.vy;
    }
    state.car.wheels=[];

    for(let i=0;i<v.wheels.length;i++){
      const w=v.wheels[i],contact=strutContact(w,v);
      state.car.wheelLengths[i]=contact.hit?contact.length:state.car.wheelLengths[i]+(v.suspensionTravel-state.car.wheelLengths[i])*(1-Math.exp(-dt*18));
      const p=wheelPose(w,state.car.wheelLengths[i]),n=contact.normal,alignment=-(axis.x*n.x+axis.y*n.y),rx=p.x-state.car.x,ry=p.y-state.car.y,vx=state.car.vx-state.car.av*ry,vy=state.car.vy+state.car.av*rx,along=vx*n.tx+vy*n.ty,normalSpeed=vx*n.x+vy*n.y,surface=terrain.surfaceAt(p.x);
      if(v.visualType==='snowmobile'&&((MAPS[state.activeMap].flags.seasons&&surface.index===3)||state.activeMap==='arctic'))
      surface.grip*=1.6;
      let normal=0;

      if(contact.hit&&alignment>.15){
// Spring/damper acts along the chassis strut. The rigid guide transfers lateral ground load.

        const compressionSpeed=-normalSpeed/alignment,spring=clamp(contact.compression*v.suspension+Math.max(0,contact.compression-(v.suspensionTravel-v.suspensionMin)*.7)*v.suspension*5+compressionSpeed*v.suspensionDamping,0,supportLoad*4/v.wheels.length),springX=-axis.x*spring,springY=-axis.y*spring;

        normal=Math.min(spring/alignment,supportLoad*5/v.wheels.length);
        const guideX=normal*n.x-springX,guideY=normal*n.y-springY;

        if(normal>0){
          contacts++;
          fx+=springX+guideX;
          fy+=springY+guideY;
          torque+=rx*(springY+guideY)-ry*(springX+guideX);

          const direction=v.visualType==='monowheel'?1:(forward.x*n.tx+forward.y*n.ty)>=0?1:-1,localSpeed=along*direction,radius=v.wheels.reduce((sum,q)=>sum+q.r,0)/v.wheels.length,share=v.tracked?normal/Math.max(v.mass*CONFIG.world.gravity*.3,previousTrackLoad):v.rearDriveShare!==null?(i===0?v.rearDriveShare:1-v.rearDriveShare):1/v.wheels.length;
// F = min(torque / radius, power / speed). Grip limits the delivered tractive force.

          const shaftSpeed=Math.max(Math.abs(along),Math.abs(state.car.wheelSpeeds[i])*w.r),available=engineForce(v,shaftSpeed,radius);
          let requested=0;

          requested=v.visualType==='hovercraft'?0:control*available*share*direction*(surface.drive??1);
// The new vehicles use the requested Jeep-relative motor RPM ceiling. Engine
// upgrades lift that ceiling; downhill momentum remains free to exceed it.

          if(v.wheelSpeedLimited&&control*localSpeed>0)
          requested*=clamp(1-Math.pow(Math.abs(localSpeed)/(v.wheelSpeedLimit*radius),8),0,1);

          const trackCompression=clamp(contact.compression/(v.suspensionTravel-v.suspensionMin),0,1),trackBite=1+v.downforceGrip*trackCompression;
          const tractionLoad=normal*(MAPS[state.activeMap].traction||1)*trackBite;
          const staticLimit=tractionLoad*v.staticGrip*surface.grip,slipSpeed=Math.abs(state.car.wheelSpeeds[i]*w.r-along);
          state.car.wheelSlip[i]=Math.abs(requested)>staticLimit*1.02||slipSpeed>(state.car.wheelSlip[i]?12:30);
          const limit=tractionLoad*(state.car.wheelSlip[i]?v.dynamicGrip:v.staticGrip)*surface.grip,drive=clamp(requested,-limit,limit),rolling=-Math.tanh(along/12)*normal*v.rollingResistance*surface.drag-along*v.mass*(surface.motionDrag||0)/v.wheels.length,traction=clamp(drive+rolling,-limit,limit),motorTorque=requested*w.r;

          fx+=traction*n.tx;
          fy+=traction*n.ty;
// Only torque delivered through grip pitches the body; excess demand spins the wheels.

          torque+=(rx*traction*n.ty-ry*traction*n.tx-drive*w.r)*(MAPS[state.activeMap].pitch||1)*v.drivePitch*(.55+.45*Math.min(1,Math.abs(localSpeed)/350));

          const wheelInertia=v.mass*.06*w.r*w.r;
          state.car.wheelSpeeds[i]+=(motorTorque-drive*w.r)/wheelInertia*dt;
          state.car.wheelSpeeds[i]+=(along/w.r-state.car.wheelSpeeds[i])*(1-Math.exp(-dt*(state.car.wheelSlip[i]?5:16)*surface.grip));

        }
      }

      if(normal===0){
        state.car.wheelSpeeds[i]+=control*v.airTilt*MAPS[state.activeMap].air*dt*9;
        state.car.wheelSpeeds[i]*=Math.exp(-dt*.12);
      }
      state.car.wheelSpeeds[i]-=state.car.wheelSpeeds[i]*Math.abs(state.car.wheelSpeeds[i])*.0005*dt;
      if(v.wheelSpeedLimited)
      state.car.wheelSpeeds[i]=clamp(state.car.wheelSpeeds[i],-v.wheelSpeedLimit,v.wheelSpeedLimit);
      state.car.wheelPhases[i]=(state.car.wheelPhases[i]+state.car.wheelSpeeds[i]*dt)%(Math.PI*2);
      state.car.wheels.push({...p,normal,spin:state.car.wheelPhases[i]});
    }

    // Fallback traction for side/top tire and frame contact. Do not double the motor
    // when the ordinary suspension contact already supplies drive force.
    if(v.visualType==='monowheel'&&!contacts){
      const hit=monowheelContact(v);
      if(hit){
        const {p,n,radius,depth}=hit,surface=terrain.surfaceAt(p.x);
        const along=state.car.vx*n.tx+state.car.vy*n.ty;
        const load=v.mass*CONFIG.world.gravity*Math.max(.15,-n.y);
        const limit=load*(MAPS[state.activeMap].traction||1)*v.staticGrip*surface.grip;
        const fade=v.wheelSpeedLimited&&control*along>0?clamp(1-Math.pow(Math.abs(along)/(v.wheelSpeedLimit*radius),8),0,1):1;
        const requested=control*engineForce(v,Math.abs(along),radius)*fade*(surface.drive??1);
        const rolling=-Math.tanh(along/12)*load*v.rollingResistance*surface.drag-along*v.mass*(surface.motionDrag||0);
        const drive=clamp(requested+rolling,-limit,limit);
        fx+=drive*n.tx+load*n.x;fy+=drive*n.ty+load*n.y;
        torque+=((p.x-state.car.x)*drive*n.ty-(p.y-state.car.y)*drive*n.tx)*v.drivePitch;
        applyContactImpulse(p,n,Math.max(0,depth)*(-n.y));
        contacts=1;
        state.car.wheels[0].normal=load;
        state.car.wheelSlip[0]=Math.abs(requested)>limit;
        state.car.wheelSpeeds[0]+=(along/radius-state.car.wheelSpeeds[0])*(1-Math.exp(-dt*12));
      }
    }

    if(v.tracked){
      const beltSpeed=state.car.wheelSpeeds.reduce((a,b)=>a+b,0)/state.car.wheelSpeeds.length;
      state.car.wheelSpeeds.fill(beltSpeed);
      state.car.trackPhase+=beltSpeed*v.wheelRadius*dt;
      state.car.wheelPhases.fill(state.car.trackPhase/v.wheelRadius);
    }
    state.car.grounded=contacts>0;
    torque+=groundPitchTorque(v,contacts);
    if(!contacts)
    torque+=airAngularAcceleration(state.car.av,control,v)*v.inertia;else
    torque-=state.car.av*v.inertia*v.groundDamping*.55*groundSupportFactor(v);

    if(!contacts)
    fy-=v.mass*thermalAcceleration(state.car.x,state.car.y);
// Air-cushion propulsion acts at the chassis center, independently of tire grip.

    if(v.visualType==='hovercraft'){

      const radius=v.wheels.reduce((sum,w)=>sum+w.r,0)/v.wheels.length,along=state.car.vx*forward.x+state.car.vy*forward.y;

      const ceiling=v.wheelSpeedLimit*radius,fade=control*along>0?clamp(1-Math.pow(Math.abs(along)/ceiling,8),0,1):1;

      const thrust=control*engineForce(v,Math.abs(along),radius)*fade*(contacts?1:.12);

      fx+=forward.x*thrust;
      fy+=forward.y*thrust;

    }

// Quadratic air drag and rolling resistance produce a natural terminal speed, never a hard cap.

    fx-=v.aeroDrag*(MAPS[state.activeMap].drag??1)*state.car.vx*Math.abs(state.car.vx);
    fy-=v.aeroDrag*(MAPS[state.activeMap].drag??1)*.12*state.car.vy*Math.abs(state.car.vy);
    state.car.vx+=fx/v.mass*dt;
    state.car.vy+=fy/v.mass*dt;
    state.car.av+=torque/v.inertia*dt;
    if(!contacts)
    state.car.av=clamp(state.car.av,-v.maxRotation,v.maxRotation);
    state.car.x+=state.car.vx*dt;
    state.car.y+=state.car.vy*dt;
    state.car.a+=state.car.av*dt;
    state.car.wheelSpin+=state.car.vx*dt;
// Bottom stops and chassis contacts prevent penetration without unparenting the wheels.

    for(const w of v.wheels){
      const p=wheelPose(w,v.suspensionMin),depth=p.y-wheelFloor(p.x,w.r);
      if(depth>0){
        const n=terrainNormal(p.x,w.r);
        applyContactImpulse(p,n,depth*(-n.y));
      }
    }

    for(const bx of [-v.halfWidth,v.halfWidth]){
      const p=point(bx,9),depth=p.y-terrain.ground(p.x);
      if(depth>0){
        const k=terrain.slope(p.x),d=Math.hypot(k,1);
        applyContactImpulse(p,{x:k/d,y:-1/d},depth/d);
      }
    }

    syncWheelGeometry();
    hydraulicImpact(v,impactVelocity);
    slimeImpact(v,impactVelocity);
    speedPadImpact();
    if(environmentalLoss(v))
    return;
    const head=point(v.head.x,v.head.y);
    if(head.y+12>=terrain.ground(head.x)){
      ui.end('Head over heels');
      return;
    }

    stats.afterStep(dt);
    moments.afterStep(dt);
    economy.updateTricks(state.car.a-angleBefore,state.car.grounded,dt);
    state.furthest=Math.max(state.furthest,state.car.x);
    const best=Math.floor(economy.runMeters(state.furthest));
    if(best>state.progression.best[state.activeMap]){
      const old=state.progression.best[state.activeMap];
      state.progression.best[state.activeMap]=best;
      if(Math.floor(old/50)!==Math.floor(best/50))
      save.saveProgress();
    }
    state.fuel=Math.max(0,state.fuel-v.fuelBurn*(control!==0?1.12:.7)*dt);

    for(const item of state.items){
      if(!item.taken&&touchesPickup(item,v)){
        item.taken=true;
        if(item.type==='coin')
        economy.awardCoins(item.tier.value);else{
          state.fuel=v.fuelCapacity;
          stats.fuel();
          moments.emit('fuel',{x:item.x,y:item.y});
        }
      }
    }

    economy.updateCheckpoints();
    const nextSeason=terrain.seasonalSurface(state.car.x).index;
    if(MAPS[state.activeMap].flags.seasons&&nextSeason!==state.seasonIndex){
      state.seasonIndex=nextSeason;
      ui.showBonus(SEASONS[state.seasonIndex].name.toUpperCase(),'The trail has changed');
    }
    if(state.fuel<=0)
    ui.end('Out of fuel');
    economy.generate();
    state.toastTime=Math.max(0,state.toastTime-dt);
  }

  return { environmentalLoss, effectiveGravity, bubbleLift, hydraulicImpact, speedPadImpact, updateBridgeMotion, thermalAcceleration, slimeImpact, biomeLoss, point, rideHeight, wheelFloor, wheelPose, terrainNormal, strutContact, syncWheelGeometry, engineForce, applyContactImpulse, touchesPickup, monowheelContact, groundSupportFactor, groundPitchTorque, airAngularAcceleration, step };

}

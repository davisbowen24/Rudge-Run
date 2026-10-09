import { BIOMES, MAPS } from './maps.js';
import { CONFIG, GRAVITY_SCALE } from './config.js';

export function createTerrain({ state, economy, upgrades, physics }) {

  function seasonalSurface(x,id=state.activeMap){
    const map=MAPS[id],seasonLength=map.seasonDistance*CONFIG.world.pixelsPerMeter,blendLength=map.seasonBlendDistance*CONFIG.world.pixelsPerMeter,distance=Math.max(0,x-140),zone=Math.floor(distance/seasonLength),index=zone%4,previous=zone===0?index:(index+3)%4,u=Math.min(1,(distance%seasonLength)/blendLength),blend=u*u*(3-2*u);
    const wet=.5+.32*Math.sin(x/173)+.18*Math.sin(x/61);
    const values=i=>i===0?{grip:.92-.34*wet,drag:1+2.2*wet,bump:7+6*wet}:i===2?{grip:.85-.34*wet,drag:1.2+2.6*wet,bump:10+8*wet}:i===3?{grip:map.winterGrip,drag:.85,bump:2}:{grip:1,drag:1,bump:0};
    const a=values(previous),b=values(index);
    return {index,grip:(a.grip+(b.grip-a.grip)*blend)*map.grip,drag:(a.drag+(b.drag-a.drag)*blend)*map.surfaceDrag,bump:(a.bump+(b.bump-a.bump)*blend)*map.seasonBumpScale};
  }

  function surfaceAt(x){
    const m=MAPS[state.activeMap],s=m.flags.seasons?seasonalSurface(x):{grip:m.grip,drag:m.surfaceDrag,bump:0};
    s.motionDrag=0;
    s.label=m.flags.seasons&&s.index===3?'Winter · 85% grip':m.flags.seasons&&s.index===1?'Dry road':'Trail';
    for(const f of featuresNear(state.activeMap,x)){
      const u=Math.abs(x-f.x)/f.width;
      if(u>=1)
      continue;
      const strength=Math.min(1,(1-u)*5),severity=m.hazardSeverity;
      if(f.kind==='mud'){
        s.grip*=1+(Math.pow(m.mudGrip,severity)-1)*strength;
        s.drag*=1+12*strength*severity;
        s.motionDrag=.85*strength*severity;
        s.label='Mud pit · low grip';
      }
      if(f.kind==='ice'){
        s.grip=s.grip*(1-strength)+Math.pow(m.iceGrip,severity)*m.grip*strength;
        s.label='Ice patch · slippery';
      }
      if(f.kind==='leaves'){
        s.motionDrag=.18*strength*severity;
        s.label='Leaf pile';
      }
    }
    return biomeSurface(x,s);
  }

  function difficultyAt(x,id=state.activeMap){
    const meters=economy.runMeters(x),scaled=meters*MAPS[id].difficultyRate,growth=scaled/(scaled+MAPS[id].difficultyDistance),stage=scaled<150?'1 · FOOTHILLS':scaled<350?'2 · CLIMBS':scaled<600?'3 · RIDGELINE':scaled<1000?'4 · CANYONS':scaled<1500?'5 · HIGHLANDS':'6 · EXTREME';
    return {meters,growth,stage};
  }

  function baseTerrainHeight(id,x){
    const m=MAPS[id],f=m.flags,t=Math.max(0,x-m.terrainStart),r=1-Math.exp(-t/m.introLength),g=difficultyAt(x,id).growth,phase=(period,strength=2)=>(t+strength*(t-(m.frequencyRamp/m.difficultyRate)*Math.log1p(t/(m.frequencyRamp/m.difficultyRate))))/period;

    const hills=(m.hillBase+m.hillGrowth*g)*Math.sin(phase(m.hillPeriod/m.rampFrequency))*m.hillScale,ridges=f.ridges?(m.ridgeBase+m.ridgeGrowth*g*g)*Math.sin(phase(m.ridgePeriod/m.obstacleDensity,3)):0,trenches=f.trenches?m.trenchGrowth*g*g*Math.pow(Math.max(0,Math.sin(phase(m.trenchPeriod/m.obstacleDensity,4))),m.trenchSharpness)*m.trenchScale:0,bumps=f.bumps?m.bumpGrowth*g*g*Math.sin(phase(m.bumpPeriod/m.obstacleDensity,3))*m.bumpScale:0;

    const ramps=f.sharpRamps?(m.rampBase+m.rampGrowth*g)*Math.tanh(m.rampSharpness*Math.sin(phase(m.rampPeriod/m.rampFrequency,3))):0,craters=f.craters?(m.craterBase+m.craterGrowth*g)*Math.pow(Math.sin(phase(m.craterPeriod/m.rampFrequency,3)),m.craterSharpness):0,seasonal=f.seasons?(.15+.85*g)*seasonalSurface(x,id).bump*(Math.sin(x/22)+.4*Math.sin(x/11)):0;

    return m.terrainHeight+m.terrainAmplitude*(r*(hills+craters*m.terrainRoughness*m.hazardSeverity+m.terrainRoughness*(ridges+ramps+bumps+seasonal)+trenches*m.hazardSeverity)+signatureHeight(id,x));
  }

  function segmentHeight(s,x){
    const u=Math.max(0,Math.min(1,(x-s.a)/(s.b-s.a))),u2=u*u,u3=u2*u,L=s.b-s.a;
    return (2*u3-3*u2+1)*s.y0+(u3-2*u2+u)*L*s.s0+(-2*u3+3*u2)*s.y1+(u3-u2)*L*s.s1;
  }

  function segmentAt(list,x){
    let lo=0,hi=list.length-1;
    while(lo<hi){
      const mid=(lo+hi)>>1;
      if(x>=list[mid].b)
      lo=mid+1;else
      hi=mid;
    }
    return list[lo];
  }

  function appendSection(list,length,y,material,kind,s1=0,extra={}){
    const previous=list[list.length-1],a=previous?previous.b:0,y0=previous?previous.y1:90,s0=previous&&previous.kind!=='gap'?previous.s1:0;
    const s={a,b:a+length,y0,y1:y,s0,s1,material,kind,...extra};
    list.push(s);
    return s;
  }

  function constructionAt(x){

    if(!state.constructionSegments.length)
    appendSection(state.constructionSegments,2100,90,'dirt','recovery');

    while(state.constructionSegments.at(-1).b<=x){
      const i=state.constructionSegments.length,last=state.constructionSegments.at(-1),g=difficultyAt(last.b,'construction').growth,m=MAPS.construction,h=(65+145*g)*m.terrainAmplitude,base=90+(roadHash(i+531)-.5)*180*g,pattern=Math.floor(roadHash(i+701)*4),space=1/(.8+.2*m.obstacleDensity),run=450*space/Math.sqrt(m.rampFrequency);

      appendSection(state.constructionSegments,450+350*(1-g),last.y1,'dirt','runup');

      if(pattern===0){ // Dirt mound -> concrete launch -> load-bearing steel bridge -> dirt landing.

        appendSection(state.constructionSegments,run*1.3,base-h*.45,'dirt','mound');

        appendSection(state.constructionSegments,run,base-h,'concrete','ramp');

        appendSection(state.constructionSegments,420+200*g,base-h,'steel','bridge');

        appendSection(state.constructionSegments,run*1.5,base+25,'dirt','landing');

      }else
      if(pattern===1){ // Scaffold tiers lead to a rounded drop, with a long dirt runout.

        const tiers=g>.35?3:2;

        for(let j=0;j<tiers;j++){
          appendSection(state.constructionSegments,run*.75,base-h*(j+1)/tiers,'steel','scaffold');
          appendSection(state.constructionSegments,180,base-h*(j+1)/tiers,'steel','platform');
        }

        appendSection(state.constructionSegments,360+160*(1-g),base+50,'dirt','drop');

        appendSection(state.constructionSegments,550,base+50,'dirt','landing');

      }else
      if(pattern===2){ // Slab -> tested small gap -> lower steel landing.

        appendSection(state.constructionSegments,650,base,'concrete','slab');

        const angle=.20+.13*g,length=260,launch=appendSection(state.constructionSegments,length,base-length*Math.tan(angle)/2,'concrete','ramp',-Math.tan(angle));

        let gap=45+65*g,landingY=launch.y1+90+30*g;

        while(gap>12&&!jumpEnvelope(launch.y1,angle,gap,landingY,650,310,'construction').ok)
        gap*=.8;

        const pit=appendSection(state.constructionSegments,gap,landingY,'none','gap',0,{floor:Math.max(launch.y1,landingY)+1100});

        appendSection(state.constructionSegments,650,landingY,'steel','landing');

        appendSection(state.constructionSegments,550,base,'dirt','recovery');

      }else{ // Dirt pile -> slab with integrated low barriers/debris -> platform.

        appendSection(state.constructionSegments,run*1.5,base-h,'dirt','pile');

        appendSection(state.constructionSegments,300,base-h,'concrete','slab');

        const count=1+Math.floor(g*m.obstacleDensity*2);

        for(let j=0;j<count;j++){
          const y=state.constructionSegments.at(-1).y1,bump=(8+14*g)*m.terrainRoughness;
          appendSection(state.constructionSegments,95,y-bump,'concrete','barrier');
          appendSection(state.constructionSegments,110,y,'concrete','debris');
        }

        appendSection(state.constructionSegments,run*1.4,base,'steel','platform');

      }

    }

    return segmentAt(state.constructionSegments,x);

  }

  function constructionGround(x){
    const s=constructionAt(x);
    return s.kind==='gap'?s.floor:segmentHeight(s,x);
  }

  function highwayAt(x){

    if(!state.highwaySegments.length)
    appendSection(state.highwaySegments,2100,90,'asphalt','straight');

    while(state.highwaySegments.at(-1).b<=x){
      const i=state.highwaySegments.length,last=state.highwaySegments.at(-1),m=MAPS.highway,g=difficultyAt(last.b,'highway').growth,H=(220+1600*g)*m.terrainAmplitude,L=(680+roadHash(i+951)*240)/Math.sqrt(m.rampFrequency)*(1-.30*g),base=90+(roadHash(i+899)-.5)*300*g;

      appendSection(state.highwaySegments,900+1200*(1-g),last.y1,'asphalt','recovery');

      const type=Math.floor(roadHash(i+311)*6),patterns=[
   [0,.8,1.1,-1.15,-.4,.2], // descending grade -> deep valley -> uphill launch
   [0,-1.15,-1.25,.55,.1], // giant crest -> long descending landing
   [-.25,.45,-.65,.8,-1.2,.3], // progressively larger rollers
   [.9,1.2,-.95,-.8,.15], // long downhill -> abrupt, smooth climb
   [-1,-1.15,.9,.4,0], // sharp crest into lower highway
   [.15,-.5,.55,-1.35,.25] // consecutive climbs and oversize final ramp
  ],values=[last.y1,...patterns[type].map(v=>base+v*H)],positions=[state.highwaySegments.at(-1).b];

      for(let j=1;j<values.length;j++)
      positions.push(positions.at(-1)+L*(j===values.length-1?1.5:1));

      const slopes=values.map((y,j)=>{
        if(j===0||j===values.length-1)
        return 0;
        const a=(y-values[j-1])/(positions[j]-positions[j-1]),b=(values[j+1]-y)/(positions[j+1]-positions[j]);
        return a*b<=0?0:2*a*b/(a+b);
      });

      for(let j=1;j<values.length;j++)
      appendSection(state.highwaySegments,positions[j]-positions[j-1],values[j],'asphalt',values[j]<values[j-1]?'uphill launch':'downhill',slopes[j]);

    }

    return segmentAt(state.highwaySegments,x);

  }

  function highwayGround(x){
    return segmentHeight(highwayAt(x),x);
  }

  function jumpTrajectory(launchY,angle,gap,landingY,landingLength,speed,id){

    const v=upgrades.vehicleStats({engine:2,tires:2,suspension:2,fuel:2},'base'),gravity=MAPS[id].gravity*GRAVITY_SCALE,drag=v.aeroDrag*MAPS[id].drag/v.mass,dt=1/240;

    let x=0,y=launchY,vx=speed*Math.cos(angle),vy=-speed*Math.sin(angle);

    for(let j=0;j<1200;j++){
      const prevY=y,prevX=x;
      vx-=drag*vx*Math.abs(vx)*dt;
      vy+=(gravity-drag*.12*vy*Math.abs(vy))*dt;
      x+=vx*dt;
      y+=vy*dt;

      if(vy>0&&prevY<=landingY&&y>=landingY){
        const at=prevX+(x-prevX)*(landingY-prevY)/(y-prevY);
        return {ok:at>=gap+35&&at<=gap+landingLength-70,x:at,speed};
      }

      if(y>Math.max(launchY,landingY)+1000)
      break;

    }

    return {ok:false,x,speed};

  }

  function jumpEnvelope(launchY,angle,gap,landingY,landingLength,speed,id){
    const trials=[.88,1,1.12].map(k=>jumpTrajectory(launchY,angle,gap,landingY,landingLength,speed*k,id));
    return {ok:trials.every(t=>t.ok),trials};
  }

  function referenceRunupSpeed(length,id){
    const v=upgrades.vehicleStats({engine:2,tires:2,suspension:2,fuel:2},'base'),gravity=MAPS[id].gravity*GRAVITY_SCALE;
    let x=0,speed=80;
    for(let j=0;j<3600&&x<length;j++){
      const force=Math.min(physics.engineForce(v,speed,19),v.mass*gravity*v.staticGrip*MAPS[id].grip),drag=v.aeroDrag*MAPS[id].drag*speed*speed;
      speed=Math.max(1,speed+(force-drag)/v.mass/120);
      x+=speed/120;
    }
    return speed;
  }

  function addRoof(){
    const i=state.roofSegments.length,prev=state.roofSegments.at(-1),start=prev?prev.end:0,g=difficultyAt(start,'rooftops').growth,m=MAPS.rooftops;

    const y=prev?prev.nextY:90,landingLength=i===0?650:prev.landingLengthNext;
 // Always reserve a flat touchdown zone, a runup, then a curved takeoff ramp.

    const chain=i>2&&i%5===3&&g>.25,runup=(chain?500:750+450*(1-g))/Math.sqrt(m.rampFrequency),rampLength=280+80*g,length=landingLength+runup+rampLength;

    const angle=.20+.32*g,edge=start+length,rampStart=edge-rampLength,rise=rampLength*Math.tan(angle)/2;

    const slope=i>2&&i%4===1?.08*g*(roadHash(i+20)>.5?1:-1):0;

    const rampBase=y+slope*runup,launchY=rampBase-rise;

    const expectedSpeed=Math.min(480,referenceRunupSpeed(runup,'rooftops')*.75),nextLanding=700-200*g;

    let gap=(50+185*g)*(.9+.2*roadHash(i+913))*m.hazardSeverity,nextY=launchY+(i>2&&i%4===2?-25*g:45+100*g*roadHash(i+541))*m.terrainAmplitude;

    let validation=jumpEnvelope(launchY,angle,gap,nextY,nextLanding,expectedSpeed,'rooftops');

    for(let attempt=0;!validation.ok&&attempt<30;attempt++){
      gap*=.88;
      nextY+=12;
      validation=jumpEnvelope(launchY,angle,gap,nextY,nextLanding,expectedSpeed,'rooftops');
    }

    if(!validation.ok)
    throw Error('Rooftop trajectory could not be validated');

    const equipment=g>.18&&Math.floor(i*m.obstacleDensity/3)>Math.floor((i-1)*m.obstacleDensity/3)?{x:start+landingLength+runup*.36,width:140,height:(8+15*g)*m.terrainRoughness}:null;

    state.roofSegments.push({i,start,edge,end:edge+gap,y,step:0,g,gap,length,landingLength,rampStart,rampLength,rampBase,angle,rise,runup,slope,nextY,nextLanding,expectedSpeed,validation,equipment});
 // The next roof's flat landing must use this outgoing jump's reserved width.

    state.roofSegments.at(-1).landingLengthNext=nextLanding;

  }

  function roofAt(x){
    while(!state.roofSegments.length||state.roofSegments.at(-1).end<=x)
    addRoof();
    let lo=0,hi=state.roofSegments.length-1;
    while(lo<hi){
      const mid=(lo+hi)>>1;
      if(x>=state.roofSegments[mid].end)
      lo=mid+1;else
      hi=mid;
    }
    return state.roofSegments[lo];
  }

  function roofDeck(x,r=roofAt(x)){
    const local=x-r.start;
    let y=r.y;

    if(x>=r.rampStart){
      const u=Math.max(0,Math.min(1,(x-r.rampStart)/r.rampLength));
      y=r.rampBase-r.rise*u*u;
    }
 else
    if(local>r.landingLength){
      const u=(local-r.landingLength)/r.runup;
      y+=r.slope*r.runup*(u*u*(3-2*u));
    }

    if(r.equipment){
      const u=(x-r.equipment.x)/r.equipment.width;
      if(Math.abs(u)<1)
      y-=r.equipment.height*Math.pow(Math.cos(u*Math.PI/2),2);
    }

    return y;

  }

  function roofGround(x){
    const r=roofAt(x);
    return x<r.edge?roofDeck(x,r):Math.max(r.y,r.nextY)+1400;
  }

  function safePickupX(x){
    if(state.activeMap==='construction'){
      const s=constructionAt(x);
      return s.kind==='gap'||(s.kind==='ramp'&&constructionAt(s.b+1).kind==='gap')?constructionAt(s.b+1).kind==='gap'?constructionAt(s.b+1).b+120:s.b+120:x;
    }
    const f=biomeAt(state.activeMap,x);
    if(f&&['crevasse','lava','bridge','slime','spectral','crystal','bubbles','boost'].includes(f.kind))
    return f.b+100;
    if(!MAPS[state.activeMap].flags.rooftops)
    return x;
    const r=roofAt(x);
    return x>r.rampStart-50?r.end+Math.min(140,r.landingLengthNext/3):x;
  }

  function caveCeiling(x,id=state.activeMap){
    const m=MAPS[id],g=difficultyAt(x,id).growth;
    return baseTerrainHeight(id,x)-m.ceilingClearance/m.hazardSeverity+m.terrainRoughness*(55*g+18*Math.sin(x/280)+10*Math.sin(x/103));
  }

  function biomeCellSpacing(id){
    return 3000/MAPS[id].obstacleDensity;
  }

  function biomeFeature(id,cell){

    if(id==='construction'||(!BIOMES.has(id)&&id!=='countryside')||cell<1)
    return null;

    const key=id+':'+cell;
    if(state.biomeCache.has(key))
    return state.biomeCache.get(key);

    let x=140+cell*biomeCellSpacing(id)+350*roadHash(cell+81)/MAPS[id].obstacleDensity,g=difficultyAt(x,id).growth,kind,width;

    if(id==='countryside'){
      // Match Jungle's bridge spacing/width progression while leaving alternating cells as open hills.
      if(cell%2===0){
        state.biomeCache.set(key,null);
        return null;
      }
      kind='bridge';
      width=180+180*g;
    }

    if(id==='desert'){
      kind='sand';
      width=220;
    }

    if(id==='arctic'){
      kind='crevasse';
      width=38+125*g;
    }

    if(id==='volcano'){
      kind='lava';
      width=45+115*g;
    }

    if(id==='jungle'){
      kind=cell%2?'bridge':'bog';
      width=kind==='bridge'?180+180*g:160;

      if(kind==='bog'){
        let best=-Infinity;
        for(let q=x-500;q<=x+500;q+=25){
          const h=baseTerrainHeight(id,q);
          if(h>best){
            best=h;
            var low=q;
          }
        }
        x=low;
      }
    }

    if(id==='wasteland'){
      kind='slime';
      width=130+70*g;
    }

    if(id==='underwater'){
      kind='bubbles';
      width=120;
    }

    if(id==='construction'){
      kind=cell%2?'steel':'concrete';
      width=190+80*g;
    }

    if(id==='haunted'){
      kind='spectral';
      // Short early crossings; quadratic growth preserves demanding late trenches.
      width=120+270*g*g;
    }

    if(id==='neon'){
      kind='boost';
      width=115;
    }

    if(id==='alien'){
      kind='crystal';
      width=90+40*g;
    }

    if(['crevasse','lava','spectral'].includes(kind))
    width*=MAPS[id].hazardSeverity;

    const f={key,id,cell,x,g,kind,width,a:x-width,b:x+width};

    f.ya=baseTerrainHeight(id,f.a);
    f.yb=baseTerrainHeight(id,f.b);
    if(kind==='spectral'){
      // Canvas Y grows downward. Every platform and the far bank descend.
      f.yb=f.ya+60+100*g;
      f.platformHalfWidth=60-22*g;
      f.bankBlend=240;
    }

    state.biomeCache.set(key,f);
    if(state.biomeCache.size>600)
    state.biomeCache.delete(state.biomeCache.keys().next().value);
    return f;

  }

  function biomeNear(id,x){
    const cell=Math.floor((x-140)/biomeCellSpacing(id));
    return [cell-1,cell,cell+1].map(c=>biomeFeature(id,c)).filter(Boolean);
  }

  function biomeAt(id,x){
    return biomeNear(id,x).find(f=>x>=f.a&&x<=f.b);
  }

  function spectralPlatforms(f){
    return [.25,.5,.75].map((u,i)=>{
      const x=f.a+(f.b-f.a)*u;
      return {a:x-f.platformHalfWidth,b:x+f.platformHalfWidth,y:f.ya+(f.yb-f.ya)*u};
    });
  }

  function biomeTerrain(id,x,y){
    const amplitude=MAPS[id].terrainAmplitude,roughness=MAPS[id].terrainRoughness,severity=MAPS[id].hazardSeverity;

    for(const f of biomeNear(id,x)){

      if(f.kind==='spectral'){
        // Ease into a level takeoff and out of a level landing with no vertical seams.
        const blend=f.bankBlend;
        if(x>=f.a-blend&&x<f.a){
          const u=(x-f.a+blend)/blend,t=u*u*(3-2*u);
          return y*(1-t)+f.ya*t;
        }
        if(x>f.b&&x<=f.b+blend){
          const u=(x-f.b)/blend,t=u*u*(3-2*u);
          return f.yb*(1-t)+y*t;
        }
        if(x===f.a)return f.ya;
        if(x===f.b)return f.yb;
      }

      if(x>=f.a&&x<=f.b){
        const u=(x-f.a)/(f.b-f.a),line=f.ya+(f.yb-f.ya)*u;

        if(f.kind==='spectral'){
          const p=spectralPlatforms(f).find(p=>x>=p.a&&x<=p.b);
          return p?p.y:1600;
        }

        if(f.kind==='steel')
        return line-amplitude*roughness*(70+150*f.g)*(u<.72?u/.72:(1-u)/.28);

        if(f.kind==='concrete')
        return line-amplitude*roughness*severity*(55+90*f.g)*Math.pow(Math.sin(u*Math.PI),2);

        if(f.kind==='crystal')
        return line-Math.sin(u*Math.PI)*(18+20*f.g)*amplitude;

        if(f.kind==='crevasse'||f.kind==='lava')
        return 1600;

        if(f.kind==='bridge')
        return line+Math.sin(u*Math.PI)*(15+(state.bridgeMotion.get(f.key)?.y||0));

        if(f.kind==='slime'||f.kind==='bog')
        return line+Math.sin(u*Math.PI)*(f.kind==='slime'?26:18);

      }

      if((f.kind==='crevasse'||f.kind==='lava')&&x>f.a-150&&x<f.a)
      y-=(x-(f.a-150))/150*(25+25*f.g)*amplitude;

      if(id==='wasteland'&&x>f.b+140&&x<f.b+470){
        const u=(x-f.b-140)/330;
        y-=Math.pow(Math.sin(u*Math.PI),2)*(80+95*f.g)*amplitude*roughness;
      }

    }

    return y;

  }

  function biomeSurface(x,s){
    const severity=MAPS[state.activeMap].hazardSeverity;
    if(state.activeMap==='construction'){
      const segment=constructionAt(x);
      s.grip=segment.material==='steel'?1.5:segment.material==='concrete'?1.2:.75;
      s.label=segment.material==='steel'?'Steel girders':segment.material==='concrete'?'Concrete '+segment.kind:'Construction dirt';
      return s;
    }
    const f=biomeAt(state.activeMap,x);
    if(!f)
    return s;

    if(f.kind==='steel'){
      s.grip=1.5;
      s.label='High-grip steel';
    }
    if(f.kind==='concrete'){
      s.grip=1.2;
      s.label='Concrete barrier';
    }
    if(f.kind==='spectral'){
      s.label='Spectral platform';
    }
    if(f.kind==='boost'){
      s.label='Neon boost pad';
    }
    if(f.kind==='crystal'){
      s.label='Spring crystals';
    }
    if(f.kind==='bubbles'){
      s.label='Bubble plume';
    }

    if(f.kind==='sand'){
      const steep=Math.min(1,Math.abs(slope(x))*2);
      s.drag*=1+(.8+steep*2.2)*severity;
      s.motionDrag=(.06+.08*steep)*severity;
      s.label='Deep sand';
    }

    if(f.kind==='bog'){
      s.grip*=Math.pow(.36,severity);
      s.drag*=1+8*severity;
      s.motionDrag=.95*severity;
      s.drive=Math.pow(.5,severity);
      s.label='Mud bog · keep momentum';
    }

    if(f.kind==='bridge'){
      s.grip=1.35;
      s.drag=.8;
      s.label='Flexible wooden bridge';
    }

    if(f.kind==='slime'){
      s.grip*=Math.pow(.6,severity);
      s.label='Slime spring pad';
    }
    return s;

  }

  function roadHash(n){
    const v=Math.sin(n*127.1+311.7)*43758.5453;
    return v-Math.floor(v);
  }

  function roadFeatures(id,cell){
    const m=MAPS[id];
    if(cell<1||(!m.flags.seasons&&!m.flags.mudTexture))
    return [];
    const key=id+':'+cell;
    if(state.roadFeatureCache.has(key))
    return state.roadFeatureCache.get(key);
    const out=[],center=140+(cell+.5)*m.obstacleSpacing,seed=cell+(m.flags.mudTexture?913:17);

    if(roadHash(seed)>.22){
      const x=center+(roadHash(seed+4)-.5)*m.obstacleSpacing*.4,season=seasonalSurface(x,id).index,kind=m.flags.mudTexture?'ridge':season===2?'leaves':season===3?'snow':season===0?'log':'rock',height=(kind==='leaves'?12:kind==='snow'?9:kind==='ridge'?22:16)*m.obstacleHeight*m.terrainAmplitude*m.terrainRoughness*m.hazardSeverity;
      out.push({x,width:kind==='leaves'?65:kind==='ridge'?70:45,height,kind});
    }

    if(m.flags.seasons){
      const x=center+300;
      if(seasonalSurface(x,id).index===3&&roadHash(seed+21)>.25)
      out.push({x,width:105+roadHash(seed+3)*90,height:0,kind:'ice'});
    }

    if(m.flags.mudTexture&&roadHash(seed+31)>.3){
      let x=center,best=-Infinity;
      for(let q=center-600;q<=center+600;q+=20){
        const y=baseTerrainHeight(id,q);
        if(y>best){
          best=y;
          x=q;
        }
      }
      if(best>baseTerrainHeight(id,x-160)+8&&best>baseTerrainHeight(id,x+160)+8)
      out.push({x,width:105,height:0,kind:'mud'});
    }

    state.roadFeatureCache.set(key,out);
    if(state.roadFeatureCache.size>400)
    state.roadFeatureCache.delete(state.roadFeatureCache.keys().next().value);
    return out;
  }

  function featuresNear(id,x){
    const cell=Math.floor((x-140)/MAPS[id].obstacleSpacing);
    return [cell-1,cell,cell+1].flatMap(n=>roadFeatures(id,n));
  }

  function terrainHeight(id,x){
    if(id==='construction')
    return constructionGround(x);
    if(id==='highway')
    return highwayGround(x);
    if(MAPS[id].flags.rooftops)
    return roofGround(x);
    let y=biomeTerrain(id,x,baseTerrainHeight(id,x));
    // Fade random bumps out on the approach and back in beyond the landing.
    let featureGain=1;
    if(id==='haunted')for(const f of biomeNear(id,x)){
      if(f.kind!=='spectral')continue;
      if(x>=f.a&&x<=f.b)return y;
      if(x>=f.a-f.bankBlend&&x<f.a){const u=(x-f.a+f.bankBlend)/f.bankBlend;featureGain=1-u*u*(3-2*u);}
      if(x>f.b&&x<=f.b+f.bankBlend){const u=(x-f.b)/f.bankBlend;featureGain=u*u*(3-2*u);}
    }
    for(const f of featuresNear(id,x)){
      const u=Math.abs(x-f.x)/f.width;
      if(u<1&&f.height)
      y-=featureGain*f.height*Math.pow(Math.cos(u*Math.PI/2),2);
    }
    return y;
  }

  function signatureAt(id,x){
    const m=MAPS[id],n=Math.round((x-140)/m.signatureSpacing);
    return {n,x:140+n*m.signatureSpacing,width:m.signatureWidth};
  }

  function signatureHeight(id,x){
    const m=MAPS[id],section=signatureAt(id,x);
    if(section.n<1)
    return 0;
    const u=(x-section.x)/section.width;
    if(Math.abs(u)>=1)
    return 0;
    const envelope=Math.pow(Math.cos(u*Math.PI/2),2),h=m.signatureHeight;
    return m.character==='crater'?h*1.5*envelope:m.character==='training'?-h*envelope*(.5+.5*Math.cos(u*Math.PI*3)):m.character==='grove'?-h*.6*envelope:-h*envelope;
  }

  function ground(x){
    return terrainHeight(state.activeMap,x);
  }

  function slope(x){
    return (ground(x+2)-ground(x-2))/4;
  }

  return { seasonalSurface, surfaceAt, difficultyAt, baseTerrainHeight, segmentHeight, segmentAt, appendSection, constructionAt, constructionGround, highwayAt, highwayGround, jumpTrajectory, jumpEnvelope, referenceRunupSpeed, addRoof, roofAt, roofDeck, roofGround, safePickupX, caveCeiling, biomeCellSpacing, biomeFeature, biomeNear, biomeAt, spectralPlatforms, biomeTerrain, biomeSurface, roadHash, roadFeatures, featuresNear, terrainHeight, signatureAt, signatureHeight, ground, slope };

}

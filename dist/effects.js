import { canvasFont, UI_THEME } from './theme.js';
import { MAP_VISUALS, MATERIALS } from './visuals.js';
import { clamp } from './utils.js';

/** Bounded pooled particles + deterministic, viewport-culled terrain decoration.
 * Reads simulation state only. Its RNG, clocks and quality budget are independent. */
export function createEffects({state, terrain}) {
  const particles=[], pool=[];
  let seed=9173, clock=0, emission=0, frameAverage=1/60, quality=1, carRef=null;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  const profile=()=>MAP_VISUALS[state.activeMap]||MAP_VISUALS.countryside;
  function materialAt(x) {
    const surface=terrain.surfaceAt(x),label=surface.label.toLowerCase();
    for(const [word,type] of [['steel','steel'],['mud','mud'],['ice','ice'],['leaf','leaf'],['winter','snow'],['wood','wood'],['sand','sand'],['slime','slime'],['concrete','concrete']])
      if(label.includes(word)) return type;
    return profile().material;
  }
  function reset(){while(particles.length)pool.push(particles.pop());emission=0;clock=0;carRef=state.car;}
  function emit(x,y,type,speed,slip=false) {
    if(particles.length>=Math.floor(180*quality))return;
    const m=MATERIALS[type],p=pool.pop()||{};
    Object.assign(p,{x,y,kind:m.particle,color:m.color,size:m.size*(.6+random()*.8),vx:-speed*(.12+random()*.12)+(random()-.5)*45,vy:-20-random()*(35+Math.min(160,Math.abs(speed)*.11)+(slip?35:0)),life:.35+random()*.65,maxLife:1,angle:random()*6.28});
    p.maxLife=p.life;particles.push(p);
  }
  function burst(x,y,type,count,strength=1,color=null) {
    for(let i=0;i<Math.min(36,count);i++) {
      const before=particles.length;
      emit(x+(random()-.5)*32,y-5,type,0);
      if(particles.length===before)break;
      const p=particles[particles.length-1];p.vx=(random()-.5)*150*strength;p.vy=-40-random()*110*strength;
      if(color)p.color=color;
    }
  }
  function update(dt) {
    if(carRef!==state.car)reset();
    frameAverage+=(dt-frameAverage)*.04;
    quality=clamp((1/45)/Math.max(1/120,frameAverage),.35,1);
    if(state.paused)return;
    clock+=dt;
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){pool.push(p);particles[i]=particles[particles.length-1];particles.pop();continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.kind==='bubble'?-20:p.kind==='dust'?30:170)*dt;p.angle+=dt*3;}
    if(state.screen!=='run'||!state.playing)return;
    const speed=state.car.vx,magnitude=Math.abs(speed);
    emission+=dt*(3+Math.min(70,magnitude*.08))*quality;
    const count=Math.min(4,Math.floor(emission));emission-=Math.floor(emission);
    for(let i=0;i<state.car.wheels.length;i++){
      const w=state.car.wheels[i],slip=state.car.wheelSlip[i];
      if(!w.normal||(!slip&&magnitude<30))continue;
      const type=materialAt(w.x);
      for(let j=0;j<count;j++) if(type!=='steel'||random()<.25) emit(w.x,w.y+w.r-3,type,speed,slip);
    }
  }
  function line(g,pts,color,width=2){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=width;g.stroke();}
  function poly(g,pts,color){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();}
  function circle(g,x,y,r,color){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=color;g.fill();}
  function rect(g,x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h);}
  function crystal(g,x,y,h,color){poly(g,[[x-12,y],[x-9,y-h*.7],[x,y-h],[x+10,y-h*.65],[x+13,y]],color);line(g,[[x,y],[x,y-h]],'#e2f6ff',1);}
  function valid(x){if(state.activeMap==='rooftops'){const r=terrain.roofAt(x);return x>r.start+45&&x<r.edge-65;}if(state.activeMap==='construction')return terrain.constructionAt(x).kind!=='gap';return terrain.ground(x)<1200;}
  function surface(g,left,right) {
    const spacing=quality<.65?64:32;
    for(let x=Math.floor(left/spacing)*spacing;x<right;x+=spacing){
      if(!valid(x)||!valid(x+spacing))continue;
      const y=terrain.ground(x),slope=(terrain.ground(x+5)-terrain.ground(x-5))/10,type=materialAt(x),m=MATERIALS[type];
      g.save();g.translate(x,y+8);g.rotate(Math.atan(slope));
      if(type==='steel'){rect(g,0,0,spacing+2,8,'#677e89');line(g,[[1,1],[spacing,1]],'#d1e2e8',2);circle(g,8,6,1.5,'#243946');}
      else if(type==='concrete'){rect(g,0,0,spacing+1,10,'#9aa5a7');line(g,[[0,1],[0,10]],'#526472',2);}
      else if(type==='asphalt'){rect(g,0,-3,spacing+2,17,'#39464f');if(Math.floor(x/64)%2===0)rect(g,0,3,spacing,3,'#f2dfa1');rect(g,0,14,spacing+1,2,'#c7d1cd');}
      else if(type==='ice'){line(g,[[1,0],[17,4],[9,10],[24,14]],m.stroke,1.5);line(g,[[3,-3],[25,-3]],'#f4ffff',2);}
      else if(type==='grid'){line(g,[[0,0],[spacing,0]],'#45efff',2);line(g,[[0,1],[12,24]],'#994eb7',1);}
      else if(type==='sand'){line(g,[[0,4],[9,6],[22,5],[29,7]],m.stroke,1);}
      else if(type==='mud'||type==='slime'){g.globalAlpha=.55;line(g,[[2,3],[25,4]],m.stroke,5);line(g,[[8,10],[19,11]],m.stroke,2);}
      else {g.globalAlpha=.7;for(let j=0;j<3;j++){const q=hash(x+j);rect(g,j*10,3+q*16,2+q*3,2,m.stroke);}}
      g.restore();
    }
  }
  function prop(g,kind,n,color) {
    const alt=n%3;
    switch(kind){
      case 'fence':
        for(let x=-45;x<=45;x+=45){rect(g,x,-31,4,33,'#846745');circle(g,x+14,-5,3,'#efde8b');}line(g,[[-45,-22],[45,-22]],'#c1a475',3);line(g,[[-45,-9],[45,-9]],'#c1a475',3);break;
      case 'highway':
        rect(g,-2,-58,4,60,'#72808a');rect(g,-7,-52,14,8,'#fce6a1');
        if(alt===0){rect(g,-3,-120,5,120,'#5e717e');rect(g,-27,-120,78,33,'#176d76');g.fillStyle=UI_THEME.colors.secondary;g.font=canvasFont(12,700);g.fillText(n%2?'RIDGE HWY':'OPEN ROAD',-21,-99);}
        else if(alt===1){line(g,[[0,0],[0,-148],[40,-148]],'#657986',4);rect(g,29,-146,23,5,'#fff1bf');}break;
      case 'cactus':
        line(g,[[0,0],[0,-61]],'#53795c',11);line(g,[[-20,-40],[-20,-23],[0,-23],[20,-23],[20,-48]],'#668d62',8);poly(g,[[28,0],[36,-9],[47,-6],[52,0]],'#b68952');break;
      case 'barricade':
        for(let k=0;k<3;k++)rect(g,-32+k*24,-14,23,13,'#65714d');rect(g,-21,-39,5,26,'#4b5642');rect(g,20,-39,5,26,'#4b5642');rect(g,-29,-39,62,12,'#c6ae61');for(let k=0;k<4;k++)line(g,[[-28+k*16,-39],[-19+k*16,-27]],'#343f37',5);break;
      case 'grove': {
        const season=state.seasonIndex;line(g,[[0,0],[0,-85],[-20,-107],[0,-80],[23,-100]],'#6b594a',6);
        if(season!==3){for(let k=0;k<3;k++)circle(g,(k-1)*21,-85-(k===1?20:0),23,['#b2d983','#568b53','#d48a41'][season]);if(season===0)for(let k=0;k<6;k++)circle(g,-23+k*9,-90+Math.sin(k)*17,3,'#ffdce5');}
        else line(g,[[-20,-108],[-1,-90],[23,-101]],'#eef9f9',4);break;}
      case 'construction':
        if(alt===0){line(g,[[0,0],[0,-160],[-40,-160],[105,-160],[0,-180],[0,-160]],'#dba847',6);line(g,[[91,-159],[91,-93],[98,-89]],'#566373',2);for(let y=-150;y<0;y+=25)line(g,[[-8,y],[8,y+25],[-8,y+25]],'#b68536',2);}
        else if(alt===1){for(let x=-36;x<=36;x+=36)line(g,[[x,0],[x,-91]],'#899da5',4);for(let y=-90;y<=-10;y+=40){line(g,[[-40,y],[40,y]],'#deae56',5);line(g,[[-36,y],[36,y+40]],'#899da5',2);}}
        else {rect(g,-34,-27,68,27,'#96a1a4');for(let k=0;k<5;k++)poly(g,[[-34+k*15,-27],[-24+k*15,-27],[-34+k*15,-10],[-44+k*15,-10]],'#e9bb48');circle(g,0,-33,4,'#ffbd51');}break;
      case 'ice': crystal(g,-8,0,36,'#79bddb');crystal(g,12,0,23,'#c3f2f9');break;
      case 'jungle':
        for(let i=-2;i<=2;i++)poly(g,[[0,0],[i*15,-43-Math.abs(i)*5],[i*23,-16]],i%2?'#347f65':'#64a66d');line(g,[[-30,2],[-16,-7],[7,0],[25,-5],[38,3]],'#755b40',5);break;
      case 'cave': crystal(g,-10,0,27,'#447b81');crystal(g,11,0,17,color);break;
      case 'volcano':
        poly(g,[[-37,3],[-22,-27],[-6,-18],[8,-34],[33,2]],'#493d43');line(g,[[-22,-22],[-11,-13],[-3,-16],[10,-3]],'#ff9a52',3);circle(g,0,-50-(clock*13+n)%30,2,'#ffa66b');break;
      case 'rooftop':
        if(alt===0){rect(g,-34,-33,68,33,'#758692');rect(g,-30,-30,60,7,'#a5b7bf');for(let i=0;i<7;i++)line(g,[[-27+i*8,-20],[-27+i*8,-5]],'#354c5b',3);}
        else if(alt===1){line(g,[[0,0],[0,-98],[-27,-72],[27,-72],[-19,-88],[19,-88]],'#c5d1d6',3);}
        else{line(g,[[-21,0],[-15,-48],[15,-48],[21,0]],'#748a98',4);rect(g,-25,-81,50,40,'#95785d');poly(g,[[-30,-81],[0,-96],[30,-81]],'#b3a393');}break;
      case 'barrels':
        for(let k=0;k<2;k++){rect(g,k*27-20,-34,23,34,'#556d4b');rect(g,k*27-20,-29,23,3,'#a9b85a');circle(g,k*27-8,-16,7,'#b5eb61');circle(g,k*27-8,-16,3,'#3c5245');}break;
      case 'mars':
        poly(g,[[-32,0],[-20,-21],[8,-27],[31,-6],[26,0]],'#b4654b');line(g,[[-17,-16],[5,-22],[23,-5]],'#e7a176',3);if(!alt){line(g,[[50,0],[50,-55]],'#b5bfc0',3);poly(g,[[50,-55],[76,-47],[50,-38]],'#e6d8ba');}break;
      case 'grave':
        g.fillStyle='#807b94';g.beginPath();g.roundRect(-17,-40,34,42,[15,15,0,0]);g.fill();line(g,[[-8,-23],[8,-23],[0,-23],[0,-33],[0,-9]],'#b7aec7',3);circle(g,32,-10,11,'#d88a43');circle(g,28,-11,2,'#ffe6a1');circle(g,36,-11,2,'#ffe6a1');break;
      case 'moon':
        line(g,[[-27,0],[-14,-44],[15,-44],[28,0]],'#a0b3bf',3);poly(g,[[-22,-60],[-11,-38],[15,-32],[30,-48]],'#c5d5de');line(g,[[4,-45],[20,-66]],'#eaf4f5',2);circle(g,20,-66,3,'#85dce8');break;
      case 'coral':
        for(let k=-2;k<=2;k++){line(g,[[0,0],[k*8,-20],[k*14,-40-Math.abs(k)*6]],k%2?'#bd82d2':'#5ac4bf',5);circle(g,k*14,-40-Math.abs(k)*6,3,'#b9f8e7');}break;
      case 'neon':
        line(g,[[-25,0],[-25,-50],[25,-50],[25,0]],'#7f58b8',3);line(g,[[-10,-33],[0,-25],[-10,-17],[5,-33],[15,-25],[5,-17]],'#65faff',4);break;
      case 'crystal':
        crystal(g,0,0,64,'#a66cdf');crystal(g,-22,0,32,'#7b66cc');crystal(g,22,0,42,'#72d0d3');circle(g,0,-50,3,'#fff0ff');break;
    }
  }
  function drawWorld(g,left,right) {
    g.save();surface(g,left,right);
    const p=profile(),spacing=state.activeMap==='highway'?125:260;
    // World-anchored objects remain stable when reversing; skip gaps and steep faces.
    for(let n=Math.floor(left/spacing);n<=Math.ceil(right/spacing);n++){
      const x=n*spacing+60;if(!valid(x))continue;
      const y=terrain.ground(x),a=Math.atan((terrain.ground(x+8)-terrain.ground(x-8))/16);
      if(Math.abs(a)>.9)continue;
      if(quality<.6&&n%2!==0&&state.activeMap!=='highway')continue;
      g.save();g.translate(x,y+13);g.globalAlpha=.88;prop(g,p.prop,Math.abs(n),p.accent);g.restore();
    }
    if(state.activeMap==='rooftops') {
      let roof=terrain.roofAt(left);
      for(let i=0;i<20&&roof.start<right;i++) {
        const x=roof.edge,y=terrain.roofDeck(x,roof);
        line(g,[[x,y],[x,y+160]],'#d08c65',3);
        for(let j=0;j<4;j++) line(g,[[x-26+j*7,y-3],[x-21+j*7,y+5]],'#f4c373',3);
        const next=terrain.roofAt(roof.end+1);
        if(next.i===roof.i)break;
        roof=next;
      }
    }
    if(state.activeMap==='highway')for(let x=Math.floor(left/60)*60;x<right;x+=60){const y=terrain.ground(x);line(g,[[x,y+30],[x,y+53]],'#7b8e98',3);line(g,[[x,y+30],[x+60,terrain.ground(x+60)+30]],'#adbfc7',4);rect(g,x,y+27,5,6,'#ffe6a1');}
    g.restore();
  }
  function drawParticles(g) {
    g.save();for(const p of particles){g.globalAlpha=Math.min(.75,p.life/p.maxLife);if(p.kind==='spark'||p.kind==='ember')line(g,[[p.x,p.y],[p.x-p.vx*.035,p.y-p.vy*.035]],p.color,p.size);else if(p.kind==='bubble'){g.beginPath();g.arc(p.x,p.y,p.size,0,6.283);g.strokeStyle=p.color;g.lineWidth=1;g.stroke();}else if(p.kind==='dust'){circle(g,p.x,p.y,p.size*(1+(1-p.life/p.maxLife)*2),p.color);}else{g.save();g.translate(p.x,p.y);g.rotate(p.angle);rect(g,-p.size/2,-p.size/2,p.size,p.size,p.color);g.restore();}}g.restore();
  }
  function drawSpeed(g) {
    if(state.screen!=='run'||state.paused)return;
    const speed=Math.hypot(state.car.vx,state.car.vy),strength=clamp((speed-220)/1100,0,1)*(state.activeMap==='highway'?1:.6);
    if(strength<=0)return;
    const count=Math.floor(18*strength*quality),direction=state.car.vx<0?-1:1;
    g.save();g.globalAlpha=.14*strength;g.lineWidth=1.5;g.strokeStyle=profile().accent;g.beginPath();
    for(let i=0;i<count;i++){const y=(i%2? .80+hash(i)*.13:.13+hash(i)*.13)*state.H,x=((hash(i+30)*state.W-clock*speed*.6*direction)%state.W+state.W)%state.W;g.moveTo(x,y);g.lineTo(x+direction*(18+strength*80),y);}
    g.stroke();g.restore();
  }
  return {burst,update,drawWorld,drawParticles,drawSpeed,reset,materialAt,diagnostics:()=>({particles:particles.length,pooled:pool.length,quality})};
}

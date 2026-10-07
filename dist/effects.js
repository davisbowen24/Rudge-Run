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
  function detail(g,kind,n,color) {
    const alt=n%4;
    switch(kind){
      case 'meadow':
        if(alt===0){circle(g,-12,-8,9,'#caa15d');circle(g,1,-10,10,'#dfbd72');line(g,[[-20,0],[18,0]],'#876c47',3);}
        else{for(let j=-2;j<=2;j++){line(g,[[j*8,0],[j*8,-13-Math.abs(j)*3]],'#608553',2);circle(g,j*8,-15-Math.abs(j)*3,2,j%2?'#f5c0d0':'#f5e29d');}}break;
      case 'roadside':
        if(alt===0){rect(g,-34,-18,68,5,'#b8c5ca');for(let j=-30;j<=30;j+=30)rect(g,j,-17,4,24,'#697d86');circle(g,0,-27,3,'#ffe7a1');}
        else{rect(g,-3,-38,6,40,'#62757e');rect(g,-12,-42,24,8,'#e9d891');}break;
      case 'desert':
        if(alt===0){poly(g,[[-27,1],[-18,-10],[-5,-16],[8,-11],[20,-2]],'#9d7145');line(g,[[-17,-8],[-4,-3],[8,-7]],'#d8ad72',2);}
        else{line(g,[[-25,0],[-7,-6],[10,-1],[25,-9]],'#d6bb8e',3);circle(g,-8,-7,4,'#efe1bf');circle(g,12,-3,3,'#efe1bf');}break;
      case 'bootcamp':
        if(alt===0){for(let j=0;j<3;j++){circle(g,-18+j*18,-7,8,'#2f3932');circle(g,-18+j*18,-7,4,'#75806c');}}
        else{for(let j=-2;j<=2;j++)rect(g,j*13-6,-9-Math.abs(j%2)*4,13,10,'#8b7854');}break;
      case 'seasonal': {
        const s=state.seasonIndex;
        if(s===0){for(let j=-2;j<=2;j++){line(g,[[j*7,0],[j*7,-14]],'#557950',2);circle(g,j*7,-15,3,j%2?'#ffd2dc':'#fff0ae');}}
        else if(s===1){circle(g,-7,-5,7,'#b9864e');circle(g,7,-4,6,'#d3a85f');}
        else if(s===2){for(let j=-2;j<=2;j++)poly(g,[[j*8,0],[j*8+5,-5],[j*8+10,0],[j*8+4,3]],j%2?'#bd6c34':'#de9a45');}
        else{circle(g,0,-11,9,'#edf8fb');circle(g,0,-25,6,'#f7ffff');circle(g,-2,-27,1.5,'#2b4149');circle(g,2,-27,1.5,'#2b4149');}
        break;}
      case 'construction':
        if(alt===0){poly(g,[[-10,0],[-5,-23],[5,-23],[11,0]],'#e8873f');line(g,[[-7,-9],[8,-9]],'#fff0bf',4);}
        else{rect(g,-22,-16,44,16,'#596a70');rect(g,-18,-20,36,5,'#d6a64d');for(let j=-13;j<=13;j+=13)circle(g,j,-8,2,'#dde1d7');}break;
      case 'arctic':
        if(alt===0){crystal(g,-8,0,23,'#b8edf5');crystal(g,9,0,34,'#79c9e1');}
        else{line(g,[[0,0],[0,-43]],'#dceff2',4);poly(g,[[0,-43],[25,-36],[0,-29]],'#67a8c5');}break;
      case 'jungle':
        if(alt===0){for(let j=-2;j<=2;j++)poly(g,[[0,0],[j*10,-25-Math.abs(j)*4],[j*17,-8]],j%2?'#3d8354':'#62a568');}
        else{circle(g,-8,-5,7,'#b95d55');circle(g,8,-4,6,'#d39a55');for(let j=-1;j<=1;j++)circle(g,j*8,-7,1.5,'#f4e3c4');}break;
      case 'cave':
        if(alt===0){poly(g,[[-24,0],[-14,-26],[-4,0],[7,-18],[17,0]],'#60767b');}
        else{line(g,[[0,0],[0,-31]],'#7c6850',3);circle(g,0,-37,5,'#f2ca72');circle(g,0,-37,13,'#f2ca7222');}break;
      case 'volcano':
        if(alt===0){poly(g,[[-28,0],[-17,-18],[-3,-13],[9,-25],[26,0]],'#473a3f');line(g,[[-13,-10],[-3,-4],[5,-12],[14,-4]],'#ff7950',2);}
        else{for(let j=0;j<3;j++){circle(g,-10+j*10,-8-j*4,3,'#ff8a4a');line(g,[[-10+j*10,-5-j*4],[-13+j*10,0]],'#713f3c',2);}}break;
      case 'rooftop':
        if(alt===0){rect(g,-25,-25,50,25,'#637783');for(let j=-18;j<=18;j+=9)line(g,[[j,-21],[j,-5]],'#2d4654',2);}
        else{line(g,[[0,0],[0,-58],[-12,-44],[12,-44]],'#c7d4d7',3);line(g,[[-18,-58],[18,-58]],'#d8e1e3',2);}break;
      case 'wasteland':
        if(alt===0){line(g,[[-26,0],[-26,-26],[8,-26],[8,-8],[24,-8]],'#8b765b',8);circle(g,24,-8,7,'#afd95d');}
        else{rect(g,-22,-32,44,27,'#5c6753');poly(g,[[-17,-27],[0,-5],[17,-27]],'#c7df67');circle(g,0,-20,4,'#26352e');}break;
      case 'mars':
        if(alt===0){poly(g,[[-26,0],[-15,-14],[0,-19],[20,-6],[27,0]],'#995e49');circle(g,3,-9,3,'#d79d77');}
        else{line(g,[[0,0],[0,-39]],'#aeb9b6',3);circle(g,0,-44,5,'#70cbd4');line(g,[[-14,-25],[14,-25]],'#d9cab0',2);}break;
      case 'haunted':
        if(alt===0){for(let j=-1;j<=1;j++){line(g,[[j*14,0],[j*14,-29-Math.abs(j)*8]],'#6e5d6f',3);line(g,[[j*14,-24],[j*14+8,-18]],'#6e5d6f',2);}}
        else{circle(g,0,-7,5,'#f0bd62');circle(g,0,-7,13,'#e1a85e22');rect(g,-2,-5,4,7,'#ded0b2');}break;
      case 'moon':
        if(alt===0){line(g,[[0,0],[0,-46]],'#b8c4c8',3);poly(g,[[0,-45],[28,-37],[0,-29]],'#d8d2b8');}
        else{line(g,[[0,0],[0,-31]],'#aebcc1',3);circle(g,0,-36,7,'#6bcdd8');line(g,[[-17,-20],[17,-20]],'#c9d3d5',2);}break;
      case 'underwater':
        if(alt===0){for(let j=-2;j<=2;j++)line(g,[[0,0],[j*7,-18],[j*12,-37-Math.abs(j)*4]],j%2?'#62c49b':'#4ea996',4);}
        else{poly(g,[[-18,0],[-9,-9],[0,-3],[9,-11],[19,0]],'#caa4bd');circle(g,0,-5,3,'#f0ddc4');}break;
      case 'neon':
        if(alt===0){rect(g,-3,-39,6,40,'#44536d');circle(g,0,-45,6,'#65faff');circle(g,0,-45,14,'#65faff22');}
        else{line(g,[[-20,-8],[0,-31],[20,-8]],'#e26cff',4);line(g,[[-10,-8],[0,-20],[10,-8]],'#62f6ff',3);}break;
      case 'alien':
        if(alt===0){circle(g,-10,-8,8,'#9f75cf');circle(g,7,-11,11,'#73c4b6');circle(g,19,-6,6,'#ca8ce0');for(let j=-1;j<=1;j++)circle(g,j*10,-9,2,'#f5e6ff');}
        else{crystal(g,-8,0,25,'#805ec0');crystal(g,11,0,36,'#68c0c5');}break;
    }
  }

  function atmosphereSpec(){
    const base=profile().atmosphere||{kind:'pollen',density:0,color:profile().accent,speed:0};
    if(base.kind!=='seasonal')return base;
    return [
      {kind:'petals',density:.48,color:'#ffd9e4',speed:18},
      {kind:'pollen',density:.34,color:'#f4e6a1',speed:10},
      {kind:'leaves',density:.76,color:'#d58b42',speed:31},
      {kind:'snow',density:.84,color:'#f5fdff',speed:29}
    ][state.seasonIndex]||base;
  }

  function drawAtmosphere(g,layer='back'){
    if(state.screen!=='run'||!state.W||!state.H)return;
    const a=atmosphereSpec(),front=layer==='front',count=Math.floor((front?20:46)*a.density*quality);
    if(count<=0)return;
    const drift=a.speed||12;
    g.save();
    for(let i=0;i<count;i++){
      const hx=hash(i*17+31),hy=hash(i*29+7),hz=hash(i*41+13);
      let x=(hx*state.W+clock*drift*(.3+hz)*(i%2?1:-.35)+state.camera.x*(front?.015:.005))%(state.W+80)-40;
      if(x<-40)x+=state.W+80;
      let y=(hy*state.H+clock*drift*(.35+hz))%(state.H+100)-50;
      const alpha=(front?.28:.16)*(.55+hz*.75);
      g.globalAlpha=alpha;
      if(a.kind==='snow'){
        circle(g,x,y,front?2.2+hz*2:1.2+hz*1.5,a.color);
      }else if(a.kind==='petals'||a.kind==='leaves'){
        g.save();g.translate(x,y);g.rotate(clock*(1+hz*2)+i);rect(g,-3-hz*2,-1.5,6+hz*4,3,a.color);g.restore();
      }else if(a.kind==='embers'){
        const yy=state.H-((hy*state.H+clock*(26+hz*45))%(state.H+80));
        line(g,[[x,yy],[x-2-hz*4,yy+9+hz*8]],a.color,front?2.2:1.3);
      }else if(a.kind==='bubbles'){
        const yy=state.H-((hy*state.H+clock*(18+hz*30))%(state.H+60));
        g.beginPath();g.arc(x,yy,2+hz*(front?5:3),0,6.283);g.strokeStyle=a.color;g.lineWidth=front?1.4:1;g.stroke();
      }else if(a.kind==='fog'||a.kind==='haze'){
        if(i>Math.max(4,count*.3))continue;
        const yy=state.H*(.30+hy*.55);
        g.globalAlpha=alpha*(a.kind==='fog'?1.3:.55);
        g.fillStyle=a.color;
        g.beginPath();g.ellipse(x,yy,70+hz*130,10+hz*24,0,0,6.283);g.fill();
      }else if(a.kind==='wind'){
        line(g,[[x,y],[x+35+hz*80,y-4+hz*8]],a.color,front?1.5:1);
      }else if(a.kind==='neon'){
        line(g,[[x,y],[x+8+hz*18,y-5-hz*13]],i%2?a.color:'#e16cff',front?2:1.2);
      }else if(a.kind==='toxic'){
        circle(g,x,state.H-((hy*state.H+clock*(8+hz*18))%(state.H+40)),2+hz*4,a.color);
      }else if(a.kind==='dust'){
        circle(g,x,y,front?2+hz*5:1+hz*3,a.color);
      }else if(a.kind==='spores'||a.kind==='pollen'||a.kind==='motes'||a.kind==='spaceDust'||a.kind==='alien'){
        const color=a.kind==='alien'&&i%3===0?'#73e6ca':a.color;
        circle(g,x,y,(front?1.5:.8)+hz*(front?2.5:1.6),color);
      }
    }
    g.restore();
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

      const dx=x+spacing*.48;
      if(p.detail&&valid(dx)){
        const dy=terrain.ground(dx),da=Math.atan((terrain.ground(dx+7)-terrain.ground(dx-7))/14);
        if(Math.abs(da)<.8&&(quality>=.55||n%2===0)){
          g.save();g.translate(dx,dy+10);g.rotate(da*.35);g.globalAlpha=.82;detail(g,p.detail,Math.abs(n),p.accent);g.restore();
        }
      }
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
  return {burst,update,drawWorld,drawParticles,drawSpeed,drawAtmosphere,reset,materialAt,diagnostics:()=>({particles:particles.length,pooled:pool.length,quality,atmosphere:atmosphereSpec().kind})};
}

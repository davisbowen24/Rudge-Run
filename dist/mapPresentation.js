import { MAP_VISUALS } from './visuals.js';

// Presentation only: deterministic artwork never calls terrain generation or game RNG.
export function drawMapLandmark(g,id,x,y,size=1){
  g.save();g.translate(x,y);g.scale(size,size);
  const accent=MAP_VISUALS[id].accent;
  const line=(p,c,w=2)=>{g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=c;g.lineWidth=w;g.stroke();};
  const poly=(p,c)=>{g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=c;g.fill();};
  const box=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  const disc=(x,y,r,c)=>{g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=c;g.fill();};
  const tree=(x,y,c)=>{box(x-2,y-42,4,42,'#293c38');poly([[x-24,y-17],[x,y-71],[x+24,y-17]],c);};
  switch(id){
    case 'countryside':
      box(-38,-32,64,32,'#9b5850');poly([[-46,-32],[-6,-59],[34,-32]],'#d9c6a0');box(-11,-25,20,25,'#543d38');
      box(42,-51,7,51,'#687b6a');disc(45,-48,5,'#f4dfb0');line([[15,-69],[75,-29]],'#e0dac4',6);line([[25,-20],[64,-79]],'#e0dac4',6);break;
    case 'highway':
      line([[-90,-5],[-30,-33],[30,-38],[90,-9]],'#b8c8c8',12);line([[-90,-8],[-30,-36],[30,-41],[90,-12]],'#344b5b',7);
      line([[-26,-32],[-26,18],[38,-34],[38,17]],'#849a9e',7);box(-18,-66,58,21,'#2f7363');line([[0,-45],[0,-32]],'#aebdba',3);line([[-8,-55],[25,-55],[20,-60]],'#f3ecd4',2);break;
    case 'desert':
      poly([[-80,0],[-25,-80],[27,0]],'#d19b58');poly([[-25,-80],[-8,0],[27,0]],'#ac763e');
      box(55,-52,8,52,'#536b45');line([[58,-22],[42,-22],[42,-39]],'#536b45',7);line([[60,-32],[75,-32],[75,-49]],'#536b45',7);break;
    case 'bootcamp':
      poly([[-80,0],[-66,-32],[10,-32],[28,0]],'#4e5940');box(-28,-25,37,10,'#202f30');box(39,-65,5,65,'#677565');box(26,-75,31,12,'#7c896b');
      line([[27,-64],[23,0],[58,-64],[64,0]],'#65755f',4);line([[29,-47],[56,-27],[26,-15],[55,-48]],'#65755f',2);break;
    case 'seasons':
      ['#f0b4bc','#5c986a','#d0924e','#d8eced'].forEach((c,i)=>{const x=-67+i*45;box(x-2,-44,4,44,'#626658');disc(x,-48,21,c);disc(x-10,-37,15,c);disc(x+12,-34,15,c);});break;
    case 'construction':
      box(-7,-96,7,96,'#dca14e');line([[-58,-83],[70,-83],[-3,-100],[-58,-83]],'#ecc16a',4);line([[48,-83],[48,-35],[39,-29],[48,-23]],'#c3cac2',2);
      for(let i=0;i<4;i++)line([[-7,-i*22],[0,-i*22-20]],'#86673f',2);
      box(-65,-29,32,29,'#73878c');box(24,-11,50,11,'#879595');break;
    case 'arctic':
      poly([[-92,0],[-48,-87],[-12,-27],[22,-104],[90,0]],'#7098b6');poly([[-48,-87],[-66,-51],[-45,-58],[-29,-52]],'#e1f4f5');poly([[22,-104],[-1,-55],[21,-66],[44,-59]],'#ecfaff');break;
    case 'jungle':
      tree(-68,0,'#295c50');tree(63,4,'#287058');box(-27,-37,54,37,'#6c8266');box(-18,-52,36,15,'#7f9270');box(-9,-28,18,28,'#263f3d');
      line([[-58,-54],[-15,-21],[28,-30],[62,-55]],'#6a9b67',3);break;
    case 'cave':
      poly([[-95,-105],[-65,-48],[-47,-98],[-14,-73],[0,-108],[35,-56],[56,-96],[94,-71],[95,-115]],'#2a444e');
      poly([[-35,0],[-27,-42],[-15,-21],[-10,0]],'#6fc9cc');poly([[28,0],[41,-27],[50,0]],'#658ba1');break;
    case 'volcano':
      poly([[-93,0],[-32,-85],[-9,-75],[8,-84],[87,0]],'#42404b');line([[-29,-79],[-8,-73],[5,-80]],'#ffb565',5);line([[-8,-72],[8,-43],[0,-34],[21,-10]],'#ee7049',4);
      for(let i=0;i<4;i++)disc(-11+i*9,-92-i*12,11+i*3,'#72646b55');break;
    case 'rooftops':
      for(let i=0;i<4;i++){const x=-88+i*48,h=[53,87,64,101][i];box(x,-h,38,h,'#465568');box(x-3,-h,44,5,'#c7b4a1');for(let j=0;j<3;j++)box(x+8+j*9,-h+12,4,7,'#d4b983');}
      box(-30,-114,23,20,'#775e51');line([[-28,-94],[-30,-86],[-10,-94],[-8,-86]],'#b3a18f',2);break;
    case 'wasteland':
      box(-52,-58,55,58,'#43584c');box(-35,-93,13,38,'#526655');box(13,-38,49,38,'#384c46');
      disc(-25,-29,13,'#b2e273');disc(-25,-29,5,'#405541');for(let i=0;i<3;i++)line([[-25,-29],[-25+Math.cos(i*2.094)*11,-29+Math.sin(i*2.094)*11]],'#405541',4);break;
    case 'mars':
      poly([[-90,0],[-68,-37],[-36,-52],[-7,-17],[22,-63],[50,-31],[82,0]],'#a96151');line([[5,0],[5,-69]],'#d0b5a1',3);poly([[7,-68],[39,-64],[35,-50],[7,-54]],'#ddc2a2');break;
    case 'haunted':
      box(-19,-51,39,51,'#3b354f');poly([[-28,-50],[0,-84],[29,-50]],'#514360');box(-4,-40,9,20,'#cfc18b');
      line([[-61,0],[-60,-54],[-78,-73],[-60,-49],[-42,-67]],'#44394e',5);disc(59,-8,12,'#e99753');box(54,-12,3,3,'#332837');box(62,-12,3,3,'#332837');break;
    case 'moon':
      g.beginPath();g.ellipse(-36,-5,45,10,0,0,Math.PI*2);g.fillStyle='#74818e';g.fill();g.beginPath();g.ellipse(-36,-6,32,5,0,0,Math.PI*2);g.fillStyle='#475765';g.fill();
      line([[42,0],[42,-53]],'#c8d7db',3);poly([[43,-53],[73,-49],[73,-32],[43,-36]],'#d5e0db');break;
    case 'underwater':
      poly([[-76,-12],[55,-12],[35,8],[-54,8]],'#3d6e79');line([[-15,-12],[-15,-82]],'#588791',4);poly([[-19,-74],[-58,-28],[-19,-28]],'#78a5a4');
      for(let i=0;i<3;i++)line([[69+i*8,3],[65+i*10,-25-i*10],[55+i*10,-33-i*10]],i%2?'#c087b5':'#69c4bd',4);break;
    case 'neon':
      for(let i=0;i<5;i++){const x=-84+i*35,h=[51,78,100,63,85][i];box(x,-h,25,h,'#252648');line([[x,0],[x,-h],[x+25,-h],[x+25,0]],i%2?'#eb75ca':'#64dce7',1.5);}
      break;
    case 'alien':
      for(let i=0;i<4;i++){const x=-65+i*40,h=[42,70,52,93][i];poly([[x-13,0],[x-16,-h*.6],[x,-h],[x+15,-h*.55],[x+10,0]],i%2?'#ac80cf':'#6eaab8');line([[x,0],[x,-h]],'#e5baff',1.5);}break;
  }
  g.restore();
}

export function drawMapPreview(g,id,map){
  const W=600,H=240,accent=MAP_VISUALS[id].accent;
  g.save();g.clearRect(0,0,W,H);
  const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,map.sky[0]);sky.addColorStop(1,map.sky[1]||map.sky[0]);g.fillStyle=sky;g.fillRect(0,0,W,H);
  const night=['moon','mars','alien','neon','haunted','cave','underwater'].includes(id);
  if(night){g.fillStyle='#e6f4ff88';for(let i=0;i<27;i++)g.fillRect((i*113+17)%W,(i*47+13)%130,i%4===0?2:1,1);}
  if(!['cave','underwater'].includes(id)){
    const glow=g.createRadialGradient(480,52,8,480,52,55);glow.addColorStop(0,accent+'aa');glow.addColorStop(1,accent+'00');g.fillStyle=glow;g.fillRect(425,0,110,110);
    g.beginPath();g.arc(480,52,id==='neon'?30:19,0,Math.PI*2);g.fillStyle=accent;g.fill();
    if(id==='alien'){g.beginPath();g.arc(432,33,10,0,Math.PI*2);g.fillStyle='#c0cbea';g.fill();}
  }
  for(let layer=0;layer<2;layer++){
    g.beginPath();g.moveTo(0,H);for(let x=0;x<=W;x+=8)g.lineTo(x,143+layer*24+Math.sin(x/83+layer*2)*14+Math.sin(x/39)*6);g.lineTo(W,H);g.closePath();g.fillStyle=layer?'#152c3940':'#17384430';g.fill();
  }
  drawMapLandmark(g,id,300,163,1.35);
  if(id==='rooftops'){
    for(let i=0;i<5;i++){const x=i*130-20,y=190-(i%2)*16;g.fillStyle=map.soil;g.fillRect(x,y,104,H-y);g.fillStyle=map.edge;g.fillRect(x,y,104,4);g.fillStyle='#e6c893';for(let j=0;j<5;j++)g.fillRect(x+10+j*17,y+16,6,9);}
  }else{
    const surface=x=>191+Math.sin(x/95)*13+Math.sin(x/41)*3;
    g.beginPath();g.moveTo(0,H);for(let x=0;x<=W;x+=4)g.lineTo(x,surface(x));g.lineTo(W,H);g.closePath();g.fillStyle=map.soil;g.fill();
    g.beginPath();for(let x=0;x<=W;x+=4)x?g.lineTo(x,surface(x)):g.moveTo(x,surface(x));g.strokeStyle=map.edge;g.lineWidth=5;g.stroke();
    if(id==='highway'||id==='neon'){g.setLineDash([20,17]);g.strokeStyle=id==='neon'?'#79faff':'#f1e2b0';g.lineWidth=2;g.stroke();g.setLineDash([]);}
    g.fillStyle=accent+'50';for(let i=0;i<42;i++){const x=(i*83)%W;g.fillRect(x,surface(x)+12+i%4*7,5+i%3*3,1);}
  }
  if(id==='seasons'){['SPRING','SUMMER','AUTUMN','WINTER'].forEach((s,i)=>{g.fillStyle=['#ffccd6','#b7ebaf','#ffcc8f','#e1f7ff'][i];g.font='bold 11px sans-serif';g.fillText(s,22+i*148,26);});}
  const shade=g.createLinearGradient(0,185,0,H);shade.addColorStop(0,'#08192300');shade.addColorStop(1,'#08192366');g.fillStyle=shade;g.fillRect(0,185,W,55);g.restore();
}

export function drawMapHorizon(g,id,width,height,cameraX){
  // One low-contrast landmark per screen, behind all playable terrain and hazards.
  const period=Math.max(900,width*1.4),offset=((cameraX*.055)%period+period)%period;
  g.save();g.globalAlpha=.18;
  for(let i=-1;i<2;i++){const x=width*.72+i*period-offset;if(x < -150 || x>width+150)continue;drawMapLandmark(g,id,x,height*.51,Math.min(1.3,height/650));}
  g.restore();
}

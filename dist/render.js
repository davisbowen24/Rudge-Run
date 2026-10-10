import { drawMapHorizon } from './mapPresentation.js';
import { drawChaseHazard } from './chaseVisuals.js';
import { canvasFont, UI_THEME } from './theme.js';
import { BIOMES, LATE_BIOMES, MAPS, SEASONS } from './maps.js';
import { VEHICLES } from './vehicles.js';
import { CONFIG } from './config.js';
import { $ } from './utils.js';

export function createRender({ moments, effects, state, terrain, economy, physics, input, ui }) {

  function environment(){
    const map=MAPS[state.activeMap];
    return MAPS[state.activeMap].flags.seasons?{...map,...SEASONS[state.seasonIndex]}:map;
  }

  function drawConstructionSegments(left,right){
    terrain.constructionAt(right);
    for(const s of state.constructionSegments){
      if(s.b<left||s.a>right)
      continue;
      const a=Math.max(left,s.a),b=Math.min(right,s.b);
      if(s.kind==='gap'){
        path([[s.a,s.y0],[s.b,s.y1],[s.b,Math.max(s.y0,s.y1)+1100],[s.a,Math.max(s.y0,s.y1)+1100]],'#253440');
        continue;
      }

      const pts=[];
      for(let x=a;x<b;x+=6)
      pts.push([x,terrain.segmentHeight(s,x)]);
      pts.push([b,terrain.segmentHeight(s,b)]);
      path(pts,null,s.material==='steel'?'#b6c8d1':s.material==='concrete'?'#c2bcb0':'#ad7950',s.material==='dirt'?9:13);

      if(s.material==='steel'){
        const under=pts.map(([x,y])=>[x,y+8]);
        path([...under,[b,terrain.segmentHeight(s,b)+210],[a,terrain.segmentHeight(s,a)+210]],'#34444d');
        for(let x=Math.ceil(a/90)*90;x<b;x+=90){
          const y=terrain.segmentHeight(s,x);
          path([[x,y+7],[x,y+200]],null,'#d38b47',6);
          path([[x,y+170],[x+90,terrain.segmentHeight(s,Math.min(x+90,s.b))+10]],null,'#7999a4',4);
          path([[x,y+45],[Math.min(x+90,b),terrain.segmentHeight(s,Math.min(x+90,b))+45]],null,'#657e8e',5);
        }
      }

      if(['ramp','barrier','slab','debris','platform'].includes(s.kind)){
        for(let x=a+15;x<b;x+=45){
          const y=terrain.segmentHeight(s,x);
          path([[x,y+3],[x+18,y+3]],null,'#f7d366',5);
          path([[x+18,y+3],[x+30,y+3]],null,'#354352',5);
        }
      }

      if(s.kind==='barrier'||s.kind==='debris'){
        const x=(s.a+s.b)/2,y=terrain.segmentHeight(s,x);
        path([[x-14,y+5],[x,y-2],[x+14,y+5]],null,'#f2a451',5);
      }

    }
  }

  function drawRoadFeatures(left,right){
    const id=state.activeMap,m=MAPS[id];
    for(let cell=Math.max(1,Math.floor((left-140)/m.obstacleSpacing)-1);cell<=Math.ceil((right-140)/m.obstacleSpacing)+1;cell++)
    for(const f of terrain.roadFeatures(id,cell)){
      if(f.x+f.width<left||f.x-f.width>right)
      continue;
      const colors={mud:'#58402e',ice:'#b6e5f0',leaves:'#b86c32',log:'#795037',rock:'#85897b',ridge:'#85734c',snow:'#edf5ec'},pts=[];
      for(let x=f.x-f.width;x<=f.x+f.width;x+=6)
      pts.push([x,terrain.ground(x)+2]);
      path(pts,null,colors[f.kind],f.kind==='mud'?12:8);
      if(f.kind==='leaves'){
        for(let j=0;j<16;j++){
          const x=f.x-f.width+terrain.roadHash(j+cell)*f.width*2,y=terrain.ground(x)-2;
          path([[x-4,y],[x,y-4],[x+5,y],[x,y+2]],j%2?'#d89b43':'#91462d');
        }
      }
      if(f.kind==='ice')
      path(pts.map(([x,y])=>[x,y-3]),null,'#f1ffff',2);
    }
  }

  function drawLandmarks(left,right){
    if(state.activeMap==='countryside')
    drawBiomeFeatures(left,right);
    if(BIOMES.has(state.activeMap)){
      drawBiomeFeatures(left,right);
      return;
    }
    if(['highway','rooftops','mars','cave'].includes(state.activeMap)){
      drawMapCharacter(left,right);
      return;
    }
    const m=MAPS[state.activeMap],first=Math.max(1,Math.floor((left-140)/m.signatureSpacing)),last=Math.ceil((right-140)/m.signatureSpacing);
    for(let n=first;n<=last;n++){
      const x=140+n*m.signatureSpacing;
      if(x<left-500||x>right+500)
      continue;
      const y=terrain.ground(x),name=m.character==='meadow'?'MEADOW CREST':m.character==='grove'?'FOUR-SEASON GROVE':m.character==='training'?'TRAINING BERMS':'CRATER BASIN';

      if(m.character==='meadow'){
        for(let j=-4;j<=4;j++){
          const q=x+j*55,yy=terrain.ground(q)+5;
          path([[q,yy],[q,yy-28]],null,'#8c7754',4);
          if(j<4)
          path([[q,yy-17],[q+55,terrain.ground(q+55)-12]],null,'#bca474',3);
        }
        circle(x-150,terrain.ground(x-150)-16,16,'#c3a65b');
      }
else
      if(m.character==='grove'){
        for(let j=-2;j<=2;j++){
          const q=x+j*85,yy=terrain.ground(q)+4,season=terrain.seasonalSurface(q).index;
          path([[q,yy],[q,yy-90]],null,'#675444',8);
          if(season!==3){
            const color=['#87b665','#57934f','#c17c3d'][season];
            circle(q,yy-92,27,color);
            circle(q-18,yy-76,21,color);
            circle(q+17,yy-76,23,color);
          }else{
            path([[q,yy-60],[q-23,yy-80],[q,yy-66],[q+22,yy-90]],null,'#e0eceb',4);
          }
        }
      }
else
      if(m.character==='training'){
        for(let j=-2;j<=2;j++){
          const q=x+j*100,yy=terrain.ground(q);
          path([[q-20,yy-35],[q+20,yy-35]],null,'#d8be66',8);
          path([[q-15,yy],[q-15,yy-38],[q+15,yy-38],[q+15,yy]],null,'#3b4939',5);
        }
        path([[x-200,terrain.ground(x-200)],[x-200,terrain.ground(x-200)-110]],null,'#aeb5a0',4);
        path([[x-200,terrain.ground(x-200)-110],[x-151,terrain.ground(x-200)-98],[x-200,terrain.ground(x-200)-85]],'#aa6244');
      }
else{
        const q=x+170,yy=terrain.ground(q);
        path([[q-20,yy],[q,yy-50],[q+20,yy]],null,'#aebaca',4);
        path([[q-32,yy-65],[q-21,yy-40],[q+20,yy-33],[q+40,yy-52]],null,'#c0d1d9',7);
        circle(q+3,yy-52,4,'#87c9d8');
      }

      const sx=x-230,sy=terrain.ground(sx);
      path([[sx,sy],[sx,sy-68]],null,'#c2b28f',4);
      rounded(sx-7,sy-85,162,26,4,'#183e49');
      state.ctx.fillStyle=UI_THEME.colors.secondary;
      state.ctx.font=canvasFont(10,700);
      state.ctx.fillText(name+' '+n,sx,sy-68);
    }
  }

  function paintVehicle(g,v,x,y,angle,wheels,spin){

    const shape=(p,fill,stroke='#183740',line=3)=>{
      g.beginPath();
      p.forEach((q,i)=>i?g.lineTo(...q):g.moveTo(...q));
      if(fill){
        g.closePath();
        g.fillStyle=fill;
        g.fill();
      }
      if(stroke){
        g.strokeStyle=stroke;
        g.lineWidth=line;
        g.stroke();
      }
    };

    const box=(x,y,w,h,color)=>{
      g.fillStyle=color;
      g.fillRect(x,y,w,h);
    };

    const disk=(x,y,r,color)=>{
      g.beginPath();
      g.arc(x,y,r,0,Math.PI*2);
      g.fillStyle=color;
      g.fill();
    };

    let trackLoop=[];

    if(v.tracked&&wheels.length){
      const up={x:Math.sin(angle),y:-Math.cos(angle)},first=wheels[0],last=wheels[wheels.length-1],r=first.r+4;
      for(const w of wheels)
      trackLoop.push([w.x+up.x*(w.r+4),w.y+up.y*(w.r+4)]);
      for(let j=1;j<=12;j++){
        const a=angle-Math.PI/2+j*Math.PI/12;
        trackLoop.push([last.x+Math.cos(a)*(last.r+4),last.y+Math.sin(a)*(last.r+4)]);
      }
      for(const w of [...wheels].reverse())
      trackLoop.push([w.x-up.x*(w.r+4),w.y-up.y*(w.r+4)]);
      for(let j=1;j<=12;j++){
        const a=angle+Math.PI/2+j*Math.PI/12;
        trackLoop.push([first.x+Math.cos(a)*r,first.y+Math.sin(a)*r]);
      }
      shape(trackLoop,'#233b42','#14292e',8);
    }

    if(v.visualType==='atv')
    for(const w of wheels){
      disk(w.x+8*Math.cos(angle)+6*Math.sin(angle),w.y+8*Math.sin(angle)-6*Math.cos(angle),w.r,'#192e35');
    }

    for(let wi=0;wi<wheels.length;wi++){
      const w=wheels[wi];
      if(v.visualType==='hovercraft')
      continue;

      if(v.visualType==='steamroller'&&wi===1){
        shape([[w.anchor.x,w.anchor.y],[w.x,w.y]],null,'#637477',12);
        g.save();
        g.translate(w.x,w.y);
        g.rotate(angle+(w.spin??0));
        disk(0,0,w.r+2,'#263d42');
        disk(0,0,w.r-2,'#a8b8b8');
        disk(0,0,w.r*.72,'#6a8186');
        for(let j=0;j<8;j++){
          const a=j*Math.PI/4;
          disk(Math.cos(a)*w.r*.5,Math.sin(a)*w.r*.5,3,'#d7e1d9');
        }
        disk(0,0,8,'#eeb73e');
        g.restore();
        continue;
      }

      if(v.visualType==='snowmobile'){

        shape([[w.anchor.x,w.anchor.y],[w.x,w.y]],null,'#a5bcc0',5);
        g.save();
        g.translate(w.x,w.y);
        g.rotate(angle);

        if(wi===0){
          g.beginPath();
          g.roundRect(-34,-17,68,41,17);
          g.fillStyle='#172e37';
          g.fill();
          g.strokeStyle='#849998';
          g.lineWidth=4;
          g.stroke();
          for(let k=-24;k<=24;k+=24)
          disk(k,3,10,'#819398');
          for(let k=-28;k<33;k+=12){
            const offset=((w.spin??spin/w.r)*w.r%12+12)%12;
            box(k+offset-6,20,7,4,'#bac9bd');
          }
        }
 else{
          shape([[-30,8],[20,10],[36,-1]],null,'#c0d7e1',6);
          shape([[-10,6],[5,-9],[18,7]],null,'#8196a0',4);
        }

        g.restore();
        continue;
      }
      if(v.tracked&&wi%2)
      continue;
      if(!v.tracked){
        shape([[w.anchor.x,w.anchor.y],[w.x,w.y]],null,'#183740',8);
        const spring=[];
        const dx=w.x-w.anchor.x,dy=w.y-w.anchor.y,length=Math.max(1,Math.hypot(dx,dy));
        for(let j=0;j<=8;j++){
          const offset=j===0||j===8?0:(j%2?5:-5);
          spring.push([w.anchor.x+dx*j/8+dy/length*offset,w.anchor.y+dy*j/8-dx/length*offset]);
        }
        shape(spring,null,'#c4d5ca',2);
      }
      g.save();
      g.translate(w.x,w.y);
      g.rotate(angle+(w.spin??spin/w.r));
      // Layered rubber, machined rims and rotating hub hardware; collision radius is untouched.
      const rubber=g.createRadialGradient(-w.r*.25,-w.r*.3,w.r*.15,0,0,w.r+2);
      rubber.addColorStop(0,'#46535b');rubber.addColorStop(.68,'#202d35');rubber.addColorStop(1,'#0c1921');
      disk(0,0,w.r+2,rubber);
      for(let n=0;n<16;n++){
        const a=n*Math.PI/8,c=Math.cos(a),sn=Math.sin(a);
        shape([[c*(w.r-3)-sn*2,sn*(w.r-3)+c*2],[c*w.r+sn*2,sn*w.r-c*2]],null,'#53636a',2);
      }
      disk(0,0,w.r*.66,'#111e26');
      disk(0,0,w.r*.57,'#c3cdd0');
      disk(0,0,w.r*.47,'#384952');
      for(let n=0;n<8;n++){
        const a=n*Math.PI/4;
        shape([[Math.cos(a)*w.r*.14,Math.sin(a)*w.r*.14],[Math.cos(a)*w.r*.5,Math.sin(a)*w.r*.5]],null,'#a6b8c0',2);
      }
      disk(0,0,w.r*.19,'#e0e5df');
      for(let n=0;n<5;n++){
        const a=n*Math.PI*2/5;
        disk(Math.cos(a)*w.r*.12,Math.sin(a)*w.r*.12,Math.max(.65,w.r*.035),'#445962');
      }
      disk(0,0,w.r*.065,'#21353e');
      g.restore();
    }

    if(trackLoop.length){
      const points=[...trackLoop,trackLoop[0]],segments=[];
      let total=0;
      for(let i=1;i<points.length;i++){
        const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
        segments.push({a,b,len,start:total});
        total+=len;
      }
      for(let d=((spin%14)+14)%14;d<total;d+=14){
        const seg=segments.find(q=>d>=q.start&&d<=q.start+q.len);
        if(!seg||seg.len<.001)
        continue;
        const u=(d-seg.start)/seg.len,px=seg.a[0]+(seg.b[0]-seg.a[0])*u,py=seg.a[1]+(seg.b[1]-seg.a[1])*u,nx=(seg.b[1]-seg.a[1])/seg.len,ny=-(seg.b[0]-seg.a[0])/seg.len;
        shape([[px-nx*5,py-ny*5],[px+nx*5,py+ny*5]],null,'#8b9c92',3);
      }
    }

    g.save();
    g.translate(x,y);
    g.rotate(angle);
    // Local metallic paint follows chassis rotation; purely visual, shared by every view.
    const paint=VEHICLES[v.id].color;
    const shade=(hex,f)=>'#'+hex.slice(1).match(/../g).map(c=>Math.min(255,Math.round(parseInt(c,16)*f)).toString(16).padStart(2,'0')).join('');
    const color=g.createLinearGradient(0,-65,0,16);
    color.addColorStop(0,shade(paint,1.32));color.addColorStop(.46,shade(paint,1.12));
    color.addColorStop(.49,paint);color.addColorStop(1,shade(paint,.62));

    if(v.visualType==='monowheel'){

      shape([[-22,4],[-17,-10],[17,-10],[22,4]],color);
      shape([[-19,-5],[-24,-30],[18,-32],[24,-7]],null,'#d4e1d5',4);
      box(-14,-7,25,7,'#293f47');
      box(8,-19,8,7,'#70eae7');

    }else
    if(v.visualType==='lowrider'){

      shape([[-88,8],[-86,-8],[-43,-13],[-26,-30],[17,-30],[38,-12],[87,-8],[91,8]],color);
      shape([[-35,-14],[-22,-26],[13,-26],[29,-13]],'#83cfdf');
      shape([[-84,3],[85,3]],null,'#f4dbba',4);
      box(-88,-3,11,5,'#fa718c');
      box(77,-4,13,5,'#fff2bf');
      box(-32,-10,60,3,'#883d82');

    }else
    if(v.visualType==='steamroller'){

      shape([[-84,9],[-79,-17],[-35,-20],[24,-9],[72,8]],color);
      box(-56,-51,49,35,'#385461');
      box(-50,-46,36,25,'#9bc5ce');
      box(-63,-57,65,7,color);
      box(6,-38,7,24,'#344952');
      box(-79,-14,28,15,'#c47f2d');
      shape([[20,-3],[60,10]],null,'#e6ae37',11);

    }else
    if(v.visualType==='formula'){

      shape([[-80,8],[-66,-11],[-30,-14],[-14,-23],[7,-19],[28,-9],[94,4],[91,10]],color);
      box(-87,-29,7,25,'#334751');
      box(-99,-32,38,7,color);
      box(75,7,31,6,'#e1e6d7');
      shape([[-45,1],[24,1]],null,'#fff0cb',6);
      box(4,-10,24,6,'#263c45');

    }else
    if(v.visualType==='hovercraft'){

      g.beginPath();
      g.ellipse(0,20,82,19,0,0,Math.PI*2);
      g.fillStyle='#223d49';
      g.fill();
      for(let k=-65;k<=65;k+=13)
      shape([[k,13],[k,31]],null,'#486674',3);

      shape([[-79,14],[-64,-8],[-25,-16],[-12,-34],[20,-32],[41,-12],[70,-3],[81,15]],color);
      shape([[-11,-29],[17,-27],[31,-13],[-21,-13]],'#9ae2e8');
      disk(-55,-27,22,'#243d4b');
      disk(-55,-27,17,'#809ca6');
      for(let j=0;j<5;j++){
        const a=j*Math.PI*2/5+spin*.025;
        shape([[-55,-27],[-55+Math.cos(a)*15,-27+Math.sin(a)*15]],null,'#263f4c',4);
      }
      shape([[-69,10],[65,10]],null,'#e4eac4',4);

    }else
    if(v.visualType==='supercar'){

      shape([[-72,8],[-68,-6],[-36,-13],[-19,-32],[14,-31],[40,-13],[72,-7],[75,8]],color);
      shape([[-26,-15],[-15,-28],[11,-28],[28,-14]],'#1b3d52');
      shape([[-68,9],[69,9]],null,'#172d3c',5);
      box(-68,-22,6,16,'#26485b');
      box(-77,-24,24,5,'#c7e5ec');
      shape([[48,-5],[66,-5]],null,'#f8e6aa',4);

    }else
    if(v.visualType==='firetruck'){

      box(-111,-36,141,46,color);
      box(35,-54,66,64,color);
      shape([[101,-54],[112,-33],[112,10],[98,10]],'#b43230');
      box(63,-46,33,29,'#afd5dd');
      box(39,-46,19,26,'#356376');
      for(let k=0;k<3;k++){
        box(-103+k*42,-29,36,29,'#aab9b7');
        for(let j=0;j<4;j++)
        box(-100+k*42,-24+j*6,30,2,'#758b91');
      }
      shape([[-105,-47],[65,-47],[-105,-57],[65,-57]],null,'#b9cccb',3);
      for(let k=-95;k<65;k+=18)
      shape([[k,-47],[k,-57]],null,'#d8d9ca',3);
      box(45,-62,25,7,'#77c9ed');
      box(72,-62,22,7,'#ff9582');
      box(-108,4,217,5,'#f6db9d');

    }else
    if(v.visualType==='snowmobile'){

      shape([[-64,4],[-45,-13],[-20,-16],[-1,-29],[35,-21],[62,-4],[50,9]],color);
      shape([[12,-27],[25,-46],[39,-39],[37,-21]],'#98d0df');
      box(-29,-24,29,8,'#1b3541');
      shape([[-56,-6],[-34,-10],[15,1],[50,1]],null,'#e77746',5);
      shape([[1,-26],[10,-38],[20,-36]],null,'#273c44',4);

    }else
    if(v.visualType==='hotrod'){

      shape([[-75,10],[-69,-20],[-37,-27],[-20,-19],[13,-15],[71,-10],[76,10]],color);
      shape([[-48,-25],[-47,-48],[-15,-48],[-6,-20]],'#43535f');
      shape([[-41,-27],[-40,-42],[-21,-42],[-16,-26]],'#bddddd');
      box(7,-29,37,17,'#a3b2ae');
      for(let k=0;k<4;k++){
        box(10+k*8,-35,5,7,'#dae2cf');
        shape([[13+k*8,-15],[17+k*8,-3]],null,'#d3d3ba',3);
      }
      shape([[-3,2],[12,-8],[20,1],[32,-7],[45,3]],null,'#ffd67d',4);
      box(65,-13,8,24,'#31484a');

    }else
    if(v.visualType==='rover'){

      shape([[-69,6],[-57,-12],[-22,-19],[24,-16],[66,-3],[69,11]],color);
      box(-29,-23,40,9,'#c6be95');
      shape([[18,-12],[38,-36],[60,-18]],null,'#c0d5d3',3);
      shape([[-55,-11],[-56,-53],[-34,-76]],null,'#bfd2d2',3);
      shape([[-48,-82],[-35,-69],[-15,-76]],null,'#e0ded1',5);
      disk(-32,-75,4,'#73d3da');
      box(22,-23,41,6,'#3b6488');
      for(let k=0;k<4;k++)
      box(25+k*10,-23,2,6,'#8bacc6');
      shape([[-57,12],[-24,21],[13,14],[50,22]],null,'#b9c8c2',3);

    }else
    if(v.visualType==='buggy'){

      shape([[-65,8],[-54,-13],[-18,-18],[32,-9],[65,2],[62,12]],color);
      shape([[-43,-9],[-30,-49],[6,-52],[31,-12]],null,'#e0dac0',5);
      shape([[-29,-47],[7,-13],[-41,-10],[6,-50]],null,'#344a4d',3);
      box(-66,-17,21,14,'#37454b');
      box(20,-17,25,7,color);
      shape([[32,-10],[51,-18],[67,-9]],null,color,6);

    }else
    if(v.visualType==='bus'){

      box(-112,-62,214,73,color);
      shape([[102,-62],[112,-43],[112,12],[96,12],[96,-62]],'#c9e4e0');
      box(-111,-2,221,8,'#e4794b');
      for(let k=0;k<6;k++){
        box(-102+k*28,-52,22,27,'#366c7d');
        box(-100+k*28,-49,6,21,'#89bec4');
      }
      box(67,-54,28,35,'#c0e0da');
      box(-90,-70,105,7,'#62717b');
      g.fillStyle=UI_THEME.colors.ink;
      g.font=canvasFont(13,700);
      // Side lettering is supplied by the expedition livery below.

    }else
    if(v.visualType==='battletank'){

      shape([[-94,9],[-89,-19],[-52,-31],[48,-31],[93,-14],[91,11]],color);
      box(-27,-49,69,21,'#728451');
      shape([[31,-42],[96,-47],[105,-40],[37,-34]],'#687a4c');
      box(-83,-20,40,6,'#b5bc89');
      box(-21,-55,27,7,'#334731');
      disk(62,-13,6,'#d7c982');
      shape([[-82,3],[76,3]],null,'#465837',4);

    }else
    if(v.visualType==='dragster'){

      shape([[-105,9],[-96,-21],[-51,-26],[-29,-11],[104,-1],[108,8]],color);
      shape([[-60,-20],[-62,-45],[-33,-47],[-22,-14]],null,'#b9d0cc',4);
      box(-100,-50,7,33,'#46575d');
      box(-115,-53,44,7,'#df6a81');
      box(-25,-19,24,16,'#4f6066');
      for(let k=0;k<3;k++)
      box(-25+k*9,-25,5,8,'#b7bdb0');
      shape([[6,2],[94,3]],null,'#f1d090',3);

    }else
    if(v.visualType==='atv'){

      shape([[-49,8],[-43,-16],[-20,-19],[3,-28],[32,-20],[49,2],[41,12]],color);
      box(-24,-27,28,9,'#253941');
      shape([[17,-21],[25,-43],[39,-40]],null,'#c9d8cf',4);
      shape([[-44,-19],[-27,-22]],null,'#d4e7d7',5);
      shape([[25,-22],[45,-15]],null,'#d4e7d7',5);

    }else
    if(v.visualType==='bike'){
      // Cosmetic motocross bodywork only; wheel anchors and rider hitbox stay unchanged.
      shape([[-31,10],[-12,-13],[18,-10],[31,12],[0,9],[-12,-13]],null,'#263742',7);
      shape([[-31,10],[-12,-13],[18,-10],[0,9],[-31,10]],null,'#bcc8ce',3);
      shape([[20,-11],[26,-32],[17,-35]],null,'#d8e2e8',5);
      shape([[22,-14],[26,-29]],null,'#e7b44e',3);
      shape([[16,-35],[26,-35],[30,-32]],null,'#182b35',4);
      // Engine case, cooling fins, skid plate and high exhaust.
      shape([[-12,-8],[3,-12],[12,-3],[10,10],[-9,10]],'#5d707c','#172d38',2);
      for(let fin=0;fin<4;fin++) box(-9,-7+fin*3,15,1,'#b5c3cb');
      disk(2,4,6,'#9babb5');
      disk(2,4,2,'#344853');
      shape([[-12,12],[10,13],[17,7]],null,'#d2dce1',3);
      shape([[11,0],[18,-6],[11,-15],[-25,-15]],null,'#8e9fa9',4);
      shape([[-25,-15],[-37,-18]],null,'#dce3e7',6);
      // Crisp red plastics and white race panels retain the existing silhouette.
      shape([[-38,-22],[-23,-26],[-7,-23],[-12,-17],[-34,-18]],'#ed4947','#263742',2);
      shape([[-7,-23],[5,-31],[19,-25],[15,-13],[3,-16]],'#ef4945','#263742',2);
      shape([[0,-25],[7,-28],[15,-24],[10,-20]],'#ffb08d',null);
      shape([[-23,-17],[-5,-19],[1,-13],[-10,-5],[-25,-8]],'#f3f5e9','#263742',2);
      shape([[-25,-24],[-7,-25],[2,-23],[-1,-19],[-25,-19]],'#182b35',null);
      shape([[20,-20],[32,-23],[43,-17],[30,-17]],'#ef4945','#263742',2);
      shape([[20,-29],[29,-29],[30,-20],[21,-21]],'#f3f5e9','#263742',2);
      g.fillStyle='#233642';
      g.font=canvasFont(9,900);
      g.fillText('07',-20,-8);
    }
else
    if(v.visualType==='tractor'){
      shape([[-57,9],[-57,-17],[-27,-20],[3,-23],[51,-16],[58,11]],color);
      box(-40,-55,43,37,'#244752');
      box(-35,-49,32,25,'#b4dcce');
      box(-46,-60,57,7,color);
      box(29,-45,7,26,'#213c42');
      box(30,-48,13,5,'#213c42');
      box(39,-12,17,15,'#2e5149');
      shape([[-67,-4],[-60,-22],[-31,-26],[-21,-5]],null,color,6);
    }
else
    if(v.visualType==='tank'){
// Exposed rear engine, cross-braced wing tower, low olive side panel and open cockpit.

      box(-54,-43,43,27,'#414b47');
      box(-48,-47,27,12,'#a6aaa0');
      box(-45,-44,21,7,'#737e76');
      g.fillStyle=UI_THEME.colors.secondary;
      g.font=canvasFont(6,700);
      g.fillText('V8',-39,-38);

      for(let j=0;j<4;j++){
        box(-53+j*10,-32,7,18,'#a1a797');
        shape([[-69,-27+j*4],[-48,-27+j*4]],null,'#afb5a8',3);
      }

      shape([[-67,-17],[-77,-83],[-63,-85],[-12,-21]],null,'#242e25',7);
      shape([[-67,-17],[-77,-83],[-63,-85],[-12,-21]],null,'#9baba0',3);
      shape([[-70,-62],[-53,-62],[-64,-42],[-33,-42],[-61,-22]],null,'#818f83',3);

      shape([[-96,-107],[-84,-65],[-32,-75],[-36,-88]],'#6e7e3f','#263522',3);
      shape([[-97,-110],[-88,-67],[-76,-69],[-84,-106]],'#566a34');

      const star=(x,y,r)=>{
        const pts=[];
        for(let j=0;j<10;j++){
          const a=-Math.PI/2+j*Math.PI/5,rr=j%2?r*.43:r;
          pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);
        }
        shape(pts,'#d3d3a1',null);
      };
      star(-67,-86,8);

      shape([[12,-15],[5,-43],[-2,-45],[-6,-39],[2,-16]],'#8a672c');
      disk(-6,-52,6,'#927434');

      shape([[28,-45],[40,-43],[46,-22],[22,-22]],'#b94c4b');
      shape([[40,-38],[51,-25],[68,-29]],null,'#c85b55',6);
      shape([[25,-19],[44,-17],[53,-10]],null,'#43503d',6);

      shape([[12,-34],[92,-35],[89,-15],[59,-4]],null,'#27352b',6);
      shape([[12,-34],[92,-35],[89,-15],[59,-4]],null,'#87937a',2);
      shape([[68,-36],[61,-70],[49,-99]],null,'#202c24',2);

      shape([[-95,-12],[-84,7],[61,-4],[86,-17],[85,-28],[49,-21]],'#4f632f','#263621',3);
      shape([[-88,-10],[-81,4],[53,-7],[49,-22]],'#7d8944','#354124',2);
      shape([[-80,-6],[45,-17]],null,'#9aa55d',2);

      star(70,-20,7);
      star(-69,-3,3);
      star(40,-13,3);
      g.save();
      g.rotate(-.08);
      g.fillStyle=UI_THEME.colors.secondary;
      g.font=canvasFont(9,900);
      g.fillText('SUPER OFF-ROAD',-58,-2);
      g.restore();

      const h=v.head;
      disk(h.x,h.y,10,'#decaa0');
      shape([[h.x+7,h.y-2],[h.x+15,h.y],[h.x+8,h.y+3]],'#decaa0',null);
      shape([[h.x-10,h.y-4],[h.x-11,h.y+6],[h.x-6,h.y+10]],null,'#6b503c',4);
      g.beginPath();
      g.arc(h.x,h.y-3,11,Math.PI,Math.PI*2);
      g.fillStyle='#bd4f52';
      g.fill();
      shape([[h.x-12,h.y-3],[h.x+13,h.y-7]],null,'#d76964',3);
      disk(h.x+5,h.y-3,1.5,'#222c25');

    }
else {
      const monster=v.visualType==='monster';
      shape([[-v.halfWidth,-7],[-38,-20],[20,-20],[30,-10],[v.halfWidth,-7],[v.halfWidth,10],[-v.halfWidth,10]],color);
      box(-v.halfWidth,5,v.halfWidth*2,8,monster?'#7656a1':'#b74e33');
      shape([[-33,-18],[-31,monster?-54:-40],[13,monster?-54:-40],[28,-17]],null,'#183a42',5);
      shape([[13,monster?-50:-38],[24,-18],[7,-18],[7,monster?-50:-38]],'#b5e0d9');
      if(monster){
        shape([[-42,14],[-22,33],[23,33],[44,14]],null,'#899a9f',5);
        box(-26,-18,45,6,'#e6d4f5');
      }
    }

    // Small, vehicle-specific details share the existing local body frame in game and garage.
    const vent=(x,y,count=4)=>{for(let j=0;j<count;j++)box(x+j*4,y,2,6,'#172c37');};
    const bolts=(x,y,count=4,step=10)=>{for(let j=0;j<count;j++){disk(x+j*step,y,1.4,'#d0dadd');disk(x+j*step,y,.55,'#50636b');}};
    const trim=(points)=>shape(points,null,'#e2f0ef',1.2);
    const glass=(x,y,w,h)=>{shape([[x,y+h],[x+w*.4,y],[x+w*.65,y],[x+w*.25,y+h]],'#ffffff35',null);};
    const lamp=(x,y,c)=>{box(x-1,y-1,9,6,'#24343c');box(x,y,7,4,c);box(x+1,y,5,1,'#fffce5');};
    switch(v.visualType){
      case 'base':case 'monster':
        shape([[-26,-13],[-26,6],[14,6],[14,-13]],null,'#623c4566',1.5);
        box(-20,-10,9,2,'#d9dedd');vent(27,-5,4);bolts(-39,9,7,12);
        trim([[-36,-18],[17,-18],[29,-8],[v.halfWidth-9,-8]]);
        glass(9,-34,12,14);lamp(-v.halfWidth+2,-4,'#fb6260');
        box(-20,8,34,3,'#263c45');break;
      case 'bike':
        bolts(-9,10,3,8);trim([[-33,-22],[-24,-24],[-12,-22]]);
        box(-3,-28,5,2,'#f8d882');break;
      case 'atv':
        shape([[-43,-18],[-31,-18],[-31,-14],[-43,-14]],null,'#cad9db',2);
        shape([[28,-18],[42,-14],[42,-9]],null,'#cad9db',2);
        vent(-18,-6,5);bolts(-26,6,5,12);lamp(31,-12,'#fff2b7');
        trim([[-18,-17],[3,-25],[23,-20]]);break;
      case 'tractor':case 'steamroller':
        vent(v.visualType==='tractor'?13:-73,-10,5);
        glass(v.visualType==='tractor'?-33:-49,-45,22,20);
        bolts(-29,6,5,12);lamp(v.visualType==='tractor'?45:12,-13,'#ffefb0');
        box(-15,-16,8,2,'#dce2d8');break;
      case 'bus':
        for(let j=0;j<6;j++){glass(-100+j*28,-49,17,21);box(-92+j*28,-21,6,2,'#d4ddd7');}
        shape([[71,-15],[71,8],[91,8],[91,-15]],null,'#9b763a',1);
        bolts(-99,8,10,20);lamp(100,-3,'#ffefbe');lamp(-109,-9,'#fa6563');break;
      case 'firetruck':
        for(let j=0;j<3;j++){box(-90+j*42,-7,13,2,'#2c4752');bolts(-99+j*42,-26,3,12);}
        glass(66,-43,23,22);disk(47,-8,7,'#eee7bc');disk(47,-8,4,'#c84239');
        lamp(101,-9,'#fff0be');break;
      case 'supercar':case 'lowrider':case 'hotrod':
        shape([[-26,-8],[-24,6],[23,6],[25,-9]],null,'#132b3b88',1.3);
        box(-16,-7,10,2,'#c5dce1');vent(34,-3,5);
        trim([[-57,-6],[-37,-10],[-28,-11]]);glass(-18,-25,26,10);
        lamp(-65,0,'#ff5f64');break;
      case 'formula':case 'dragster':
        trim([[12,1],[68,4],[85,5]]);vent(-20,-6,5);bolts(-47,7,5,23);
        box(-42,-4,14,8,'#e8eddf');g.fillStyle='#253b46';g.font=canvasFont(7,900);g.fillText(v.visualType==='formula'?'01':'09',-40,3);
        shape([[-91,-28],[-69,-28]],null,'#f3e4b8',1.5);break;
      case 'buggy':
        trim([[-29,-45],[5,-48],[26,-14]]);vent(-59,-13,3);
        shape([[-29,1],[16,1],[30,7]],null,'#e5dbb4',2);bolts(-38,8,7,11);
        lamp(41,-6,'#fff1b4');break;
      case 'tank':case 'battletank':
        bolts(-69,2,9,17);vent(v.visualType==='tank'?-48:-73,-12,6);
        trim(v.visualType==='tank'?[[18,-33],[86,-33]]:[[-51,-28],[45,-28],[75,-17]]);
        lamp(65,-7,'#fff0ad');break;
      case 'rover':
        for(let j=0;j<4;j++)trim([[25+j*10,-22],[25+j*10,-18],[32+j*10,-18]]);
        box(-23,-18,27,10,'#e4e6d8');box(-19,-15,6,3,'#72cfe1');vent(-10,-16,3);
        bolts(-48,6,8,13);trim([[-54,-10],[-24,-16],[17,-13]]);break;
      case 'snowmobile':
        vent(19,-14,5);trim([[-52,-4],[-34,-8],[2,-2]]);glass(26,-39,10,13);
        bolts(-36,5,5,15);lamp(47,-6,'#eaf9ff');break;
      case 'hovercraft':
        glass(-7,-26,22,12);bolts(-65,7,10,14);vent(37,-6,6);
        shape([[-67,18],[65,18]],null,'#698b9a',1.5);
        lamp(63,5,'#c1f6ff');break;
      case 'monowheel':
        bolts(-15,1,4,10);trim([[-21,-26],[15,-28]]);
        box(-13,-6,15,2,'#a0e6ec');break;
    }

    // Model-specific liveries and hardware stay inside the existing visual envelope.
    const decal=(text,x,y,size=7,ink='#f7f2d9')=>{g.fillStyle=ink;g.font=canvasFont(size,900);g.fillText(text,x,y);};
    const slashes=(x,y,n,c)=>{for(let j=0;j<n;j++)shape([[x+j*8,y],[x+j*8+4,y],[x+j*8-1,y+9],[x+j*8-5,y+9]],c,null);};
    const grille=(x,y,w)=>{box(x,y,w,9,'#132530');for(let j=2;j<w;j+=4)box(x+j,y+1,1,7,'#a2b7bf');};
    const badge=(text,x,y,c)=>{box(x-2,y-8,21,11,'#152a35');decal(text,x,y,8,c);};
    switch(v.visualType){
      case 'base':
        shape([[-39,-4],[-23,-4],[-14,4],[-39,4]],'#203645',null);
        slashes(-20,-4,3,'#ffe6aa');badge('4X4',-24,4,'#fff0c4');
        grille(29,-3,17);box(-40,10,29,3,'#9daeb2');break;
      case 'monster':
        shape([[-46,0],[-28,-12],[-31,-3],[-5,-13],[-11,-3],[16,-10],[5,4]],'#ffbb45',null);
        shape([[-44,2],[-20,-4],[-23,1],[0,-4],[-9,5]],'#f26447',null);
        decal('BIG FINGER',-37,10,7);grille(30,-5,19);break;
      case 'bike':
        slashes(5,-25,2,'#fff1cb');box(-24,-20,15,1,'#ef9a79');
        decal('RR',-14,-12,5,'#e64b42');break;
      case 'atv':
        shape([[-28,-10],[-8,-17],[9,-17],[1,-9]],'#e3f68f',null);
        badge('04',-19,3,'#a5f2dd');grille(19,-6,18);
        shape([[-39,5],[-33,10],[-24,10]],null,'#bccacf',3);break;
      case 'tractor':
        box(8,-19,33,3,'#e5d46a');grille(31,-10,16);
        decal('FIELD 60',7,5,6,'#e8ecc1');box(-33,-20,15,3,'#344533');break;
      case 'steamroller':
        slashes(-69,-8,4,'#ffdb64');grille(-75,-13,25);
        badge('08',-18,2,'#ffd46c');box(20,4,27,2,'#f7d57e');break;
      case 'bus':
        shape([[-106,-9],[-71,-9],[-57,0],[47,0],[62,7],[-106,7]],'#267e88',null);
        shape([[-103,-7],[-73,-7],[-58,2],[45,2]],null,'#e7f4cc',2);
        decal('EXPEDITION',-38,-9,8,'#213d4d');grille(77,0,16);break;
      case 'firetruck':
        slashes(38,-3,4,'#ffe6a0');box(-102,1,116,2,'#eaf2dc');
        decal('RESCUE',-67,-37,8);badge('112',68,3,'#ffe3a1');
        for(let k=0;k<3;k++)box(49+k*7,-60,3,4,'#e7fbff');break;
      case 'supercar':
        shape([[-61,1],[-24,1],[-5,7],[-61,7]],'#1a3549',null);
        slashes(-40,-6,3,'#70eff8');badge('GT',3,3,'#aef8ff');
        shape([[42,-3],[63,-4]],null,'#edffff',2);break;
      case 'lowrider':
        shape([[-66,-2],[-31,-2],[-12,3],[16,-2],[61,-2]],null,'#f8d88e',1.5);
        shape([[-66,0],[-31,0],[-12,5],[16,0],[61,0]],null,'#341e48',1.5);
        grille(66,-1,14);decal('DELUXE',-15,-4,5,'#ffefbc');break;
      case 'hotrod':
        shape([[-5,5],[12,-8],[9,0],[27,-8],[24,0],[44,-6],[31,7]],'#ffd258',null);
        shape([[1,6],[17,0],[14,5],[30,1],[24,7]],'#ff7044',null);
        for(let j=0;j<3;j++){box(11+j*9,-27,5,10,'#d1dce0');box(12+j*9,-27,2,3,'#253945');}break;
      case 'formula':
        slashes(28,-4,4,'#fff2d1');box(-91,-30,23,2,'#fff3ce');
        decal('APEX',-58,-4,7);grille(9,-9,16);break;
      case 'dragster':
        shape([[-17,-5],[82,2],[57,5],[-9,0]],'#ffe795',null);
        shape([[-14,-3],[55,3],[-6,2]],'#f57441',null);
        decal('NITRO',-99,-9,8);box(-108,-51,28,2,'#fbe5b0');break;
      case 'buggy':
        shape([[-39,0],[-16,-8],[3,-6],[-10,4]],'#283b46',null);
        badge('21',-25,2,'#ffe482');slashes(28,-3,3,'#fcf0c5');
        shape([[-23,-40],[-10,-20],[7,-42]],null,'#e88445',2);break;
      case 'tank':
        decal('TRAIL COMMAND',-42,-8,6,'#e7dfa9');slashes(57,-28,3,'#d5c984');
        grille(-46,-37,23);box(-88,-88,6,13,'#e1dcb0');break;
      case 'battletank':
        shape([[-77,-14],[-56,-23],[-36,-14],[-12,-20],[0,-10],[-32,-4]],'#45553c',null);
        shape([[7,-19],[33,-25],[47,-13],[26,-7]],'#98a071',null);
        decal('IRON 03',-20,5,7,'#ece7c2');bolts(-21,-43,5,12);break;
      case 'rover':
        slashes(-48,-3,3,'#dabb64');badge('LUNA',-11,3,'#aeeffc');
        box(38,-9,17,7,'#223e57');for(let j=0;j<3;j++)box(40+j*5,-8,3,2,'#9beeff');break;
      case 'snowmobile':
        shape([[-48,0],[-26,-7],[0,-1],[22,-8],[38,-3],[2,6]],'#233c53',null);
        shape([[-38,1],[-22,-3],[0,3],[24,-3]],null,'#a7f3ff',2);
        decal('POLAR',-19,2,6);break;
      case 'hovercraft':
        box(-34,2,66,4,'#203b4e');slashes(36,0,3,'#b7fff2');
        decal('AIR RUNNER',-27,5,7,'#bcfff2');
        g.beginPath();g.arc(-55,-27,19,0,Math.PI*2);g.strokeStyle='#6bdccb';g.lineWidth=1.5;g.stroke();break;
      case 'monowheel':
        badge('01',-10,2,'#8af7ee');box(11,-17,3,4,'#e1ffff');
        shape([[-19,-23],[-15,-27],[10,-28]],null,'#77e9e4',2);break;
    }

    if(v.visualType==='bike'){
      const h=v.head;
      shape([[h.x-3,h.y+11],[-7,-21],[5,-7],[12,-6]],null,'#213945',7);
      shape([[h.x,h.y+12],[12,-23],[24,-32]],null,'#e64c48',6);
      disk(h.x,h.y,12,'#f1f4e9');
      shape([[h.x-10,h.y-5],[h.x+4,h.y-11],[h.x+13,h.y-6]],null,'#ed4947',4);
      shape([[h.x+1,h.y-4],[h.x+12,h.y-4],[h.x+10,h.y+2],[h.x+2,h.y+2]],'#233c4a',null);
      shape([[h.x-1,h.y+6],[h.x+10,h.y+6],[h.x+14,h.y+2]],null,'#ed4947',4);
      shape([[h.x+1,h.y-8],[h.x+16,h.y-7]],null,'#f1f4e9',3);
    }else if(v.visualType!=='tank'){
      const h=v.head;
      shape([[h.x,h.y+12],[h.x+10,-12],[h.x+22,-22]],null,'#244752',6);
      disk(h.x,h.y,12,'#f2c594');
      g.beginPath();
      g.arc(h.x,h.y-3,12,Math.PI,Math.PI*2+.4);
      g.fillStyle='#eae9ce';
      g.fill();
      box(h.x+2,h.y-5,12,5,'#244652');
      box(v.halfWidth-7,-8,10,6,'#ffe9a4');
    }
    g.restore();
  }

  function path(points,fill,stroke,width=1){
    state.ctx.beginPath();
    points.forEach((p,i)=>i?state.ctx.lineTo(...p):state.ctx.moveTo(...p));
    if(fill){
      state.ctx.closePath();
      state.ctx.fillStyle=fill;
      state.ctx.fill();
    }
    if(stroke){
      state.ctx.strokeStyle=stroke;
      state.ctx.lineWidth=width;
      state.ctx.stroke();
    }
  }

  function circle(x,y,r,color){
    state.ctx.beginPath();
    state.ctx.arc(x,y,r,0,Math.PI*2);
    state.ctx.fillStyle=color;
    state.ctx.fill();
  }

  function rounded(x,y,w,h,r,color){
    state.ctx.fillStyle=color;
    state.ctx.beginPath();
    state.ctx.roundRect(x,y,w,h,r);
    state.ctx.fill();
  }

  function drawRoofs(left,right,bottom){

    let r=terrain.roofAt(left);

    while(r.start<right){

      const a=Math.max(left,r.start),b=Math.min(right,r.edge);

      if(a<b){
        const pts=[[a,bottom]];
        for(let x=a;x<b;x+=6)
        pts.push([x,terrain.roofDeck(x,r)]);
        pts.push([b,terrain.roofDeck(b,r)],[b,bottom]);
        path(pts,r.i%2?'#465269':'#354359');
        const edge=[];
        for(let x=a;x<b;x+=6)
        edge.push([x,terrain.roofDeck(x,r)]);
        edge.push([b,terrain.roofDeck(b,r)]);
        path(edge,null,'#bdcbd3',8);

        for(let x=Math.ceil(a/70)*70;x<b-15;x+=70)
        for(let row=0;row<5;row++)
        rounded(x,terrain.roofDeck(x,r)+45+row*65,23,34,2,(r.i+row)%3?'#d2a569':'#63839c');

        if(r.equipment){
          const e=r.equipment,q=e.x,yy=terrain.roofDeck(q,r);
          path([[q-e.width*.5,terrain.roofDeck(q-e.width*.5,r)+2],[q,yy+2],[q+e.width*.5,terrain.roofDeck(q+e.width*.5,r)+2]],null,'#899ea8',7);
          for(let k=-3;k<=3;k++)
          path([[q+k*9,terrain.roofDeck(q+k*9,r)],[q+k*9,terrain.roofDeck(q+k*9,r)+8]],null,'#34475c',2);
        }

        if(r.step){
          path([[r.start+270,terrain.roofDeck(r.start+270,r)-40],[r.start+295,terrain.roofDeck(r.start+270,r)-40]],null,'#f6d08b',5);
        }

        const q=r.rampStart-55;
        if(q>left&&q<right){
          rounded(q-28,terrain.roofDeck(q,r)-46,56,24,3,'#e6b65e');
          state.ctx.fillStyle=UI_THEME.colors.ink;
          state.ctx.font=canvasFont(12,700);
          state.ctx.fillText('JUMP',q-17,terrain.roofDeck(q,r)-29);
        }

      }

      const next=terrain.roofAt(r.end+1);
      if(next.i===r.i)
      break;
      r=next;

    }

  }

  function drawCaveCeiling(left,right,top){
    const pts=[[left,top]],edge=[];
    for(let x=left;x<=right;x+=8){
      const y=terrain.caveCeiling(x);
      pts.push([x,y]);
      edge.push([x,y]);
    }
    pts.push([right,top]);
    path(pts,'#252e37');
    path(edge,null,'#91a2a4',6);
    path(edge.map(([x,y])=>[x,y-14]),null,'#46565f',9);
  }

  function drawMapCharacter(left,right){

    const m=MAPS[state.activeMap];
    if(m.flags.rooftops)
    return;

    for(let x=Math.floor(left/750)*750;x<right;x+=750){
      const y=terrain.ground(x);

      if(state.activeMap==='highway'){
        path([[x,y-1],[x+45,terrain.ground(x+45)-1]],null,'#f4d489',3);
        path([[x,y],[x,y-55]],null,'#9caeb7',4);
        rounded(x-12,y-74,74,25,4,'#286876');
        state.ctx.fillStyle=UI_THEME.colors.secondary;
        state.ctx.font=canvasFont(12,700);
        state.ctx.fillText(Math.floor(economy.runMeters(x))+' m',x-5,y-57);
      }

      if(state.activeMap==='mars'){
        path([[x-30,y+3],[x-23,y-14],[x+5,y-24],[x+28,y-5],[x+35,y+4]],'#a95539');
        if(Math.floor(x/750)%4===2){
          path([[x,y],[x,y-65]],null,'#c2ad8c',4);
          path([[x,y-65],[x+40,y-54],[x,y-42]],'#dae0bc');
        }
      }

      if(state.activeMap==='cave'){
        const cy=terrain.caveCeiling(x);
        path([[x-12,cy-2],[x,cy+14],[x+12,cy-2]],'#64767b');
        circle(x,cy+33,6,'#e4c47f');
        circle(x,cy+33,16,'#e4c47f22');
        if(Math.floor(x/750)%3===1){
          path([[x-22,y],[x-14,y-24],[x-1,y-7],[x+11,y-34],[x+25,y]],'#5eabb3');
        }
      }

    }

  }

  function drawLateBackdrop(){
    const id=state.activeMap;

    if(id==='haunted'){
      circle(state.W*.8,state.H*.22,48,'#e8d7ec');
      circle(state.W*.81,state.H*.21,9,'#c3b6d1');
      for(let j=0;j<5;j++){
        state.ctx.fillStyle='#d3b5ec10';
        state.ctx.fillRect(0,state.H*(.45+j*.09)+Math.sin(state.time*.3+j)*12,state.W,28);
      }
    }

    if(id==='alien'){
      circle(state.W*.74,state.H*.19,48,'#bea3db');
      circle(state.W*.87,state.H*.31,26,'#80c8c5');
    }

    if(id==='neon'){
      circle(state.W*.76,state.H*.27,70,'#f7a66e');
      for(let j=0;j<7;j++){
        state.ctx.fillStyle='#6c2f73';
        state.ctx.fillRect(state.W*.76-75,state.H*.27+j*10,150,3+j*.6);
      }
    }

    for(let i=-1;i<7;i++){
      const x=i*260-((state.camera.x*.1)%260),y=state.H*.68;

      if(id==='construction'){
        path([[x,y],[x,y-240],[x+160,y-240]],null,'#d6a05f',8);
        for(let j=0;j<5;j++){
          path([[x-40,y-j*38],[x+90,y-j*38]],null,'#788992',5);
          path([[x-30,y-j*38],[x+70,y-(j+1)*38]],null,'#7c959c',2);
        }
        path([[x+130,y-240],[x+130,y-130]],null,'#424e58',2);
      }

      if(id==='neon'){
        state.ctx.strokeStyle=i%2?'#36ced6':'#cb5ada';
        state.ctx.lineWidth=2;
        state.ctx.strokeRect(x,y-140-terrain.roadHash(i+41)*160,105,360);
        for(let j=0;j<5;j++)
        path([[x,y-j*30],[x+105,y-j*30]],null,'#654492',1);
      }

      if(id==='underwater'){
        path([[x-70,y],[x-42,y+50],[x+115,y+50],[x+140,y]],'#16364c');
        path([[x+20,y+10],[x+20,y-100],[x+83,y-26]],null,'#326073',5);
      }

    }

    if(id==='underwater')
    for(let i=0;i<48;i++){
      const x=((i*137-state.camera.x*.15+Math.sin(state.time+i)*10)%state.W+state.W)%state.W,y=state.H-((i*87+state.time*28)%state.H);
      state.ctx.strokeStyle='#72cddd66';
      state.ctx.lineWidth=1;
      state.ctx.beginPath();
      state.ctx.arc(x,y,3+i%5,0,Math.PI*2);
      state.ctx.stroke();
    }

  }

  function drawLateFeatures(left,right){
    const id=state.activeMap;

    if(id==='construction'){
      drawConstructionSegments(left,right);
      return;
    }

    if(id==='neon'){
      for(let x=Math.floor(left/55)*55;x<right;x+=55)
      path([[x,terrain.ground(x)+8],[x+55,terrain.ground(x+55)+120]],null,'#bd51e844',1);
      for(let j=1;j<5;j++){
        const row=[];
        for(let x=left;x<right;x+=12)
        row.push([x,terrain.ground(x)+j*38]);
        path(row,null,'#42cdda44',1);
      }
      if(state.playing){
        const p=physics.point(-CONFIG.vehicle.halfWidth,6);
        path([[p.x,p.y],[p.x-Math.min(150,Math.abs(state.car.vx)*.15),p.y+10]],null,'#fd7bec88',4);
      }
    }

    for(let cell=Math.max(1,Math.floor((left-140)/terrain.biomeCellSpacing(id))-1);cell<=Math.ceil((right-140)/terrain.biomeCellSpacing(id))+1;cell++){
      const f=terrain.biomeFeature(id,cell);
      if(!f||f.b<left||f.a>right)
      continue;

      if(f.kind==='spectral'){
        const bottom=state.camera.y+state.H/state.scale+100;
        path([[f.a,f.ya],[f.b,f.yb],[f.b,bottom],[f.a,bottom]],'#1b1632');
        for(const p of terrain.spectralPlatforms(f)){
          rounded(p.a,p.y,p.b-p.a,12,6,'#a1e9d6');
          path([[p.a,p.y+17],[p.b,p.y+17]],null,'#b3b2ed66',6);
          circle((p.a+p.b)/2,p.y-20,9,'#d7d4f133');
        }
      }

      if(f.kind==='steel'||f.kind==='concrete'){
        const pts=[];
        for(let x=f.a;x<=f.b;x+=6)
        pts.push([x,terrain.ground(x)]);
        path(pts,null,f.kind==='steel'?'#b9cbd1':'#b4ada0',12);
        for(let x=f.a+15;x<f.b;x+=35){
          const y=terrain.ground(x);
          path([[x,y+4],[x,y+45]],null,'#dc924b',5);
          path([[x-9,y-3],[x+9,y-3]],null,'#f2cc69',3);
        }
      }

      if(f.kind==='bubbles'){
        for(let j=0;j<18;j++){
          const x=f.a+terrain.roadHash(j+11)*(f.b-f.a),y=terrain.ground(x)-((state.time*95+j*31)%330);
          state.ctx.strokeStyle='#9ef4ed88';
          state.ctx.lineWidth=2;
          state.ctx.beginPath();
          state.ctx.arc(x,y,5+j%7,0,Math.PI*2);
          state.ctx.stroke();
        }
      }

      if(f.kind==='boost'){
        const pts=[];
        for(let x=f.a;x<=f.b;x+=8)
        pts.push([x,terrain.ground(x)-3]);
        path(pts,null,'#f369e9',9);
        for(let x=f.a+20;x<f.b-10;x+=36){
          const y=terrain.ground(x)-14;
          path([[x-9,y-8],[x+3,y],[x-9,y+8]],null,'#adfcff',4);
        }
      }

      if(f.kind==='crystal'){
        for(let x=f.a+12;x<f.b;x+=28){
          const y=terrain.ground(x);
          path([[x-10,y+4],[x-4,y-22],[x+4,y-32],[x+12,y+4]],'#b281ed','#e5bef8',2);
        }
      }

    }

    for(let x=Math.floor(left/500)*500;x<right;x+=500){
      if(terrain.biomeAt(id,x))
      continue;
      const y=terrain.ground(x);

      if(id==='underwater'){
        for(let k=-2;k<=2;k++)
        path([[x,y],[x+k*11,y-22],[x+k*19,y-37-Math.abs(k)*5]],null,k%2?'#b766cc':'#5fe5ce',5);
      }

      if(id==='construction'){
        path([[x-15,y],[x,y-34],[x+15,y]],'#f09841');
        path([[x-9,y-14],[x+9,y-14]],null,'#fff1c8',5);
      }

      if(id==='haunted'){
        rounded(x-18,y-46,36,46,12,'#8c8396');
        path([[x-7,y-27],[x+7,y-27],[x,y-27],[x,y-37]],null,'#55465c',3);
        circle(x+50,terrain.ground(x+50)-12,15,'#eeb160');
        path([[x+42,terrain.ground(x+50)-16],[x+46,terrain.ground(x+50)-13],[x+54,terrain.ground(x+50)-16],[x+58,terrain.ground(x+50)-13]],null,'#372348',3);
        if(Math.floor(x/500)%2===0)
        path([[x+95,terrain.ground(x+95)],[x+89,y-70],[x+68,y-107],[x+89,y-70],[x+119,y-88],[x+126,y-111]],null,'#342a40',7);
      }

      if(id==='alien'){
        path([[x,y],[x-8,y-57],[x+8,y-89]],null,'#80aab5',6);
        circle(x+8,y-87,15,'#c085ef');
        circle(x-18,y-46,9,'#70edc0');
      }

    }

  }

  function drawBiomeBackdrop(){
    if(!BIOMES.has(state.activeMap))
    return;
    if(LATE_BIOMES.has(state.activeMap)){
      drawLateBackdrop();
      return;
    }

    const id=state.activeMap;

    for(let i=-1;i<6;i++){
      const x=i*300-((state.camera.x*.12)%300),y=state.H*.62;

      if(id==='desert'){
        path([[x-140,y],[x,y-160],[x+160,y]],'#c18f43');
        path([[x,y-160],[x+45,y],[x+160,y]],'#dfb566');
      }

      if(id==='arctic'){
        path([[x-190,y],[x,y-260],[x+190,y]],'#72a9c8');
        path([[x-56,y-182],[x,y-260],[x+68,y-168],[x+21,y-187],[x-8,y-178]],'#eefbff');
      }

      if(id==='volcano'){
        for(let j=0;j<5;j++){
          const yy=y-170-j*38-(state.time*12%38);
          circle(x+Math.sin(j+state.time*.2)*23,yy,28+j*8,'#75636b55');
        }
      }

      if(id==='jungle'){
        path([[x,y+150],[x,y-170]],null,'#235b4c',22);
        for(let j=-1;j<=1;j++)
        circle(x+j*60,y-155+Math.abs(j)*25,90,'#246d5266');
      }

      if(id==='wasteland'){
        rounded(x,y-160,65,220,3,'#334437');
        path([[x+32,y-160],[x+32,y-230]],null,'#73865e',12);
        circle(x+32,y-120,17,'#b8f568');
        path([[x+10,y-40],[x+53,y-40]],null,'#99d857',4);
      }

    }

    if(id==='arctic'||id==='volcano'){
      for(let i=0;i<70;i++){
        const x=((i*173.7-state.camera.x*.15+state.time*18)%state.W+state.W)%state.W,y=(i*97.3+state.time*(id==='arctic'?35:14))%state.H;
        circle(x,y,i%3+1,id==='arctic'?'#f1fbffbb':'#aaa0a088');
      }
    }

  }

  function drawBiomeFeatures(left,right){
    if(LATE_BIOMES.has(state.activeMap)){
      drawLateFeatures(left,right);
      return;
    }
    const id=state.activeMap;

    for(let cell=Math.max(1,Math.floor((left-140)/terrain.biomeCellSpacing(id))-1);cell<=Math.ceil((right-140)/terrain.biomeCellSpacing(id))+1;cell++){
      const f=terrain.biomeFeature(id,cell);
      if(!f||f.b<left||f.a>right)
      continue;

      if(['crevasse','lava','bridge'].includes(f.kind)){

        const deep=Math.max(f.ya,f.yb)+180,color=f.kind==='lava'?'#fc6138':f.kind==='bridge'?'#318d92':'#16405e';

        path([[f.a,f.ya+12],[f.b,f.yb+12],[f.b,deep+500],[f.a,deep+500]],f.kind==='bridge'?'#163f43':'#222d3a');

        path([[f.a,deep],[f.b,deep],[f.b,deep+500],[f.a,deep+500]],color);
        path([[f.a,deep],[f.b,deep]],null,f.kind==='lava'?'#ffca58':'#72d5e3',5);

        if(f.kind==='bridge'){
          const deck=[];
          for(let x=f.a;x<=f.b;x+=10)
          deck.push([x,terrain.ground(x)]);
          deck.push([f.b,terrain.ground(f.b)]);
          path(deck,null,'#b99b67',10);
          path(deck.map(([x,y])=>[x,y-30]),null,'#7b6947',3);
          for(let x=f.a;x<f.b;x+=25){
            const y=terrain.ground(x);
            path([[x-8,y-4],[x+8,y+4]],null,'#635139',2);
            path([[x,y-30],[x,y+6]],null,'#a18b5d',2);
          }
        }
   else{
          const q=f.a-100,y=terrain.ground(q);
          path([[q,y],[q,y-55]],null,'#dfc8a0',3);
          path([[q-15,y-55],[q+15,y-55],[q,y-80]],'#f8c468');
          if(f.kind==='lava')
          for(let j=0;j<6;j++){
            const y=f.ya-((state.time*65+j*45)%280);
            path([[f.a-50+j*20,y],[f.a-43+j*20,y-25]],null,'#ffab5366',4);
          }
        }

      }else{
        const pts=[];
        for(let x=f.a;x<=f.b;x+=8)
        pts.push([x,terrain.ground(x)+3]);
        path(pts,null,f.kind==='slime'?'#a8f148':f.kind==='bog'?'#71503a':'#f0c97e',f.kind==='sand'?11:14);
        if(f.kind==='slime'){
          path(pts.map(([x,y])=>[x,y+12]),null,'#559832',22);
          path(pts,null,'#b0f34a',10);
          for(let j=0;j<5;j++){
            const q=f.a+25+j*(f.b-f.a-50)/4;
            circle(q,terrain.ground(q)-3+Math.sin(state.time*3+j)*4,5,'#e4ff80');
          }
          const ramp=[];
          for(let q=f.b+140;q<=f.b+470;q+=8)
          ramp.push([q,terrain.ground(q)]);
          path(ramp,null,'#a7805c',11);
          path(ramp.map(([x,y])=>[x,y-3]),null,'#c2c9ae',3);
          for(let q=f.b+155;q<f.b+455;q+=30)
          path([[q,terrain.ground(q)+6],[q,terrain.ground(q)+35]],null,'#765a44',5);
        }
      }

    }

    for(let x=Math.floor(left/580)*580;x<right;x+=580){
      if(terrain.biomeAt(id,x))
      continue;
      const y=terrain.ground(x);

      if(id==='desert'){
        path([[x,y],[x,y-65]],null,'#518557',12);
        path([[x,y-24],[x-23,y-24],[x-23,y-49]],null,'#518557',9);
        path([[x,y-36],[x+21,y-36],[x+21,y-65]],null,'#67934f',8);
      }

      if(id==='arctic')
      path([[x-22,y],[x-9,y-35],[x+1,y-9],[x+21,y-52],[x+31,y]],'#a7e3ee');

      if(id==='volcano')
      path([[x-30,y],[x-14,y-25],[x+12,y-38],[x+26,y]],'#51444c');

      if(id==='jungle'){
        path([[x,y],[x-6,y-115]],null,'#586442',12);
        for(let j=-2;j<=2;j++)
        path([[x-6,y-112],[x+j*32,y-143+Math.abs(j)*20],[x+j*42,y-96]],'#408652');
        if(Math.floor(x/580)%3===1){
          rounded(x+40,terrain.ground(x+40)-44,42,44,2,'#8b9b72');
          path([[x+44,terrain.ground(x+40)-30],[x+76,terrain.ground(x+40)-30]],null,'#4c6951',4);
        }
      }

      if(id==='wasteland'){
        rounded(x-15,y-40,30,40,5,'#78934d');
        path([[x-14,y-31],[x+14,y-31],[x+14,y-10],[x-14,y-10]],null,'#c6f078',3);
        circle(x,y-21,5,'#ddff80');
        path([[x+70,terrain.ground(x+70)],[x+70,terrain.ground(x+70)-45],[x+105,terrain.ground(x+70)-45]],null,'#aa7853',10);
      }

    }

  }

  function visualGround(x){
    return state.activeMap==='haunted'&&terrain.biomeAt(state.activeMap,x)?.kind==='spectral'?1600:terrain.ground(x);
  }

  function draw(){
    const palette=environment();
    state.ctx.setTransform(state.dpr,0,0,state.dpr,0,0);
    const sky=state.ctx.createLinearGradient(0,0,0,state.H);
    sky.addColorStop(0,palette.sky[0]);
    sky.addColorStop(.72,palette.sky[1]);
    sky.addColorStop(1,palette.sky[2]);
    state.ctx.fillStyle=sky;
    state.ctx.fillRect(0,0,state.W,state.H);
    if(MAPS[state.activeMap].flags.starfield){
      for(let i=0;i<65;i++){
        const x=((i*137.31-state.camera.x*.02)%state.W+state.W)%state.W,y=(i*79.37)%(state.H*.65);
        circle(x,y,i%4===0?1.5:1,'#e9edf6');
      }
      if(state.activeMap!=='alien'){
        circle(state.W*.78,state.H*.23,37*state.scale,'#85bacf');
        circle(state.W*.77,state.H*.225,18*state.scale,'#87b494');
      }
    }else
    if(!MAPS[state.activeMap].flags.ceiling&&!LATE_BIOMES.has(state.activeMap))
    circle(state.W*.78,state.H*.27,43*state.scale,state.activeMap==='mars'?'#f1b37c':'#fff1bf');
// Distant ridges scroll more slowly than the playable terrain.

    if(MAPS[state.activeMap].flags.rooftops){
      for(let layer=0;layer<3;layer++){
        const width=85+layer*35;
        state.ctx.fillStyle=['#756478','#5d576c','#39485e'][layer];
        for(let i=-2;i<state.W/width+2;i++){
          const q=i+Math.floor(state.camera.x*(.08+layer*.06)/width),x=i*width-((state.camera.x*(.08+layer*.06)%width)+width)%width,y=state.H*.62-terrain.roadHash(q+layer*41)*state.H*.3;
          state.ctx.fillRect(x,y,width-8,state.H-y);
          for(let row=0;row<5;row++)
          for(let col=0;col<3;col++){
            state.ctx.fillStyle=(q+row+col)%4?'#a18d92':'#e2b982';
            state.ctx.fillRect(x+12+col*20,y+20+row*33,7,12);
          }
          state.ctx.fillStyle=['#756478','#5d576c','#39485e'][layer];
        }
      }
    }else
    for(let layer=0;layer<3;layer++){
      const pts=[[0,state.H]];
      for(let x=0;x<=state.W+10;x+=10){
        const u=x/state.scale+state.camera.x*(.12+layer*.1);
        pts.push([x,state.H*(.49+layer*.095)+state.scale*(Math.sin(u/340+layer)*48+Math.sin(u/137+layer*3)*23)]);
      }
      pts.push([state.W,state.H]);
      path(pts,palette.ridges[layer]);
    }

    drawMapHorizon(state.ctx,state.activeMap,state.W,state.H,state.camera.x);
    drawBiomeBackdrop();
    effects.drawAtmosphere(state.ctx,'back');
    state.ctx.save();
    const cameraEffect=moments.camera();
    state.ctx.translate(state.W/2+cameraEffect.x,state.H/2+cameraEffect.y);
    state.ctx.scale(cameraEffect.zoom,cameraEffect.zoom);
    state.ctx.translate(-state.W/2,-state.H/2);
    state.ctx.scale(state.scale,state.scale);
    state.ctx.translate(-state.camera.x,-state.camera.y);
    const left=state.camera.x-150,right=state.camera.x+state.W/state.scale+150,bottom=state.camera.y+state.H/state.scale+160;
    if(MAPS[state.activeMap].flags.rooftops)
    drawRoofs(left,right,bottom);else{

      const terrain=[[left,bottom]];
      for(let x=left;x<=right;x+=8)
      terrain.push([x,visualGround(x)]);
      terrain.push([right,bottom]);
      path(terrain,palette.soil);
      const edge=[];
      for(let x=left;x<=right;x+=8)
      edge.push([x,visualGround(x)]);
      path(edge,null,palette.edge,10);
      path(edge.map(p=>[p[0],p[1]+11]),null,palette.sub,8);

      state.ctx.globalAlpha=.35;
      for(let x=Math.floor(left/57)*57;x<right;x+=57){
        const y=visualGround(x)+40+(Math.sin(x*4)+1)*24;
        if(MAPS[state.activeMap].flags.starfield){
          state.ctx.beginPath();
          state.ctx.ellipse(x,y,11,4,0,0,Math.PI*2);
          state.ctx.fillStyle='#3d4655';
          state.ctx.fill();
        }else
        if(MAPS[state.activeMap].flags.seasons&&state.seasonIndex===3){
          path([[x,y],[x+17,y]],null,'#dfeef3',4);
        }else
        if(MAPS[state.activeMap].flags.seasons&&state.seasonIndex===2){
          path([[x,y-3],[x+5,y+4],[x+13,y-2]],'#d29a60',null);
        }else
        if(MAPS[state.activeMap].flags.seasons&&state.seasonIndex===0){
          circle(x,y,3,'#efc0c7');
        }else
        path([[x,y],[x+11,y+3]],null,state.activeMap==='mars'?'#c27b4e':state.activeMap==='cave'?'#80959c':state.activeMap==='highway'?'#69737a':MAPS[state.activeMap].flags.mudTexture?'#2d3027':'#bed1a6',3);
      }
      state.ctx.globalAlpha=1;

    }

    if(MAPS[state.activeMap].flags.ceiling)
    drawCaveCeiling(left,right,state.camera.y-100);

    drawRoadFeatures(left,right);

    drawLandmarks(left,right);
    effects.drawWorld(state.ctx,left,right);
// Checkpoint flags align exactly with the distance meter's 140 px starting origin.

    for(let n=1;140+economy.checkpointDistance(n)*10<right;n++){
      const meters=economy.checkpointDistance(n),x=terrain.safePickupX(140+meters*10);
      if(x<left-140)
      continue;
      const y=terrain.ground(x),passed=n<state.nextCheckpoint,claimed=economy.checkpointClaimed(n);
      path([[x,y],[x,y-125]],null,'#e5e8d1',5);
      path([[x,y-125],[x+152,y-125],[x+139,y-86],[x,y-86]],passed?'#629d74':'#e8bc64');
      state.ctx.fillStyle=UI_THEME.colors.ink;
      state.ctx.font=canvasFont(13,900);
      state.ctx.fillText(passed?'CHECKPOINT ✓':meters+' m CHECKPOINT',x+8,y-109);
      state.ctx.font=canvasFont(12,700);
      state.ctx.fillText(claimed?'BONUS CLAIMED':'+'+economy.milestoneReward(n)+' COINS',x+8,y-94);
    }

    for(const item of state.items){
      if(item.taken||item.x<left-40||item.x>right+40)
      continue;
      const bob=Math.sin(state.time*2.8+item.x)*4,y=item.y+bob;
      if(item.type==='coin'){
        const tier=item.tier;
        circle(item.x,y,14,tier.rim);
        circle(item.x,y-2,14,tier.face);
        circle(item.x,y-2,11,tier.inner);
        state.ctx.fillStyle=UI_THEME.colors.ink;
        state.ctx.font=canvasFont(tier.value>=100?9:12,900);
        state.ctx.textAlign='center';
        state.ctx.fillText(tier.value,item.x,y+2);
        state.ctx.textAlign='start';
      }else{
        state.ctx.save();
        state.ctx.translate(item.x,y);
        state.ctx.rotate(-.12);
        rounded(-13,-16,26,32,4,'#e86d47');
        rounded(-7,-23,13,9,2,'#193c45');
        path([[-7,-7],[7,7],[-7,7],[7,-7]],null,'#ffbd8b',2);
        rounded(6,-20,8,5,1,'#ffbe81');
        state.ctx.restore();
      }
    }

    // Shared Chase Mode boundary, behind the driver but above the terrain.
    // Visual only; authoritative health and elimination remain on the server.
    if(state.multiplayerRaceActive && state.chaseModeSnapshot?.enabled){
      drawChaseHazard(state.ctx,{
        mapId:state.activeMap,snapshot:state.chaseModeSnapshot,
        viewLeft:left,viewRight:right,
        viewTop:state.camera.y-50,
        viewBottom:state.camera.y+state.H/state.scale+100,
        pixelsPerMeter:CONFIG.world.pixelsPerMeter,timeMs:performance.now()
      });
    }
    effects.drawParticles(state.ctx);
    const v=CONFIG.vehicle;
    paintVehicle(state.ctx,v,physics.point(0,0).x,physics.point(0,0).y,state.car.a,state.car.wheels,v.tracked?state.car.trackPhase:state.car.wheelSpin);
    state.ctx.restore();

    effects.drawSpeed(state.ctx);
    moments.drawOverlay(state.ctx);

    $('gas').classList.toggle('active',input.input('gas'));
    $('brake').classList.toggle('active',input.input('brake'));
    $('toast').style.opacity=state.toastTime>0?1:0;
    ui.drawBonuses();
  }

  return { environment, drawConstructionSegments, drawRoadFeatures, drawLandmarks, paintVehicle, path, circle, rounded, drawRoofs, drawCaveCeiling, drawMapCharacter, drawLateBackdrop, drawLateFeatures, drawBiomeBackdrop, drawBiomeFeatures, visualGround, draw };

}

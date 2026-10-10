/**
 * Chase Mode presentation presets. Add future maps to CHASE_HAZARD_THEMES;
 * physics, network prediction, damage and scoring never depend on these values.
 * Every themed map shares this single canvas renderer and warning logic.
 */
export const CHASE_HAZARD_THEMES = Object.freeze({
  countryside: Object.freeze({
    type:'cows', name:'ANGRY COW HERD',
    approaching:'Angry cows stampeding toward you!',
    caught:'TRAMPLED BY THE HERD · HEALTH DRAINING',
    tint:'rgba(113,85,58,0.16)', front:'#e8d1a7', accent:'#79553b', particle:'#fff0d0',
    pace:1.2
  }),
  mars: Object.freeze({
    // Reuse the Volcano lava animation, with a slightly different Martian palette.
    type:'lava', name:'MARTIAN LAVA',
    approaching:'Martian lava approaching!',
    caught:'CAUGHT IN MARTIAN LAVA · HEALTH DRAINING',
    tint:'rgba(158,55,18,0.23)', front:'#ffa843', accent:'#cd3916', particle:'#ffd36c',
    pace:0.86
  }),
  rooftops: Object.freeze({
    type:'grandmas', name:'ANGRY GRANDMAS',
    approaching:'Angry grandmothers are coming!',
    caught:'CAUGHT BY THE GRANDMAS · HEALTH DRAINING',
    tint:'rgba(112,66,100,0.15)', front:'#f4bed4', accent:'#b65a8f', particle:'#ffdeee',
    pace:1.27
  }),
  arctic: Object.freeze({
    type:'avalanche', name:'AVALANCHE',
    approaching:'Avalanche approaching!',
    caught:'CAUGHT IN THE AVALANCHE · HEALTH DRAINING',
    tint:'rgba(204,239,250,0.19)', front:'#e4fcff', accent:'#9cdae9', particle:'#f6ffff',
    pace:1.0
  }),
  desert: Object.freeze({
    type:'sandstorm', name:'SANDSTORM',
    approaching:'Sandstorm approaching!',
    caught:'CAUGHT IN THE SANDSTORM · HEALTH DRAINING',
    tint:'rgba(175,115,51,0.25)', front:'#e2aa60', accent:'#916033', particle:'#f6ce85',
    pace:1.3
  }),
  jungle: Object.freeze({
    type:'flood', name:'FLASH FLOOD',
    approaching:'Flash flood approaching!',
    caught:'CAUGHT IN THE FLOOD · HEALTH DRAINING',
    tint:'rgba(39,134,155,0.22)', front:'#b0fff3', accent:'#2e8caa', particle:'#e0fff9',
    pace:1.15
  }),
  volcano: Object.freeze({
    type:'lava', name:'LAVA SURGE',
    approaching:'Lava surge approaching!',
    caught:'SWALLOWED BY LAVA · HEALTH DRAINING',
    tint:'rgba(170,39,10,0.27)', front:'#ffb432', accent:'#f04414', particle:'#ffe074',
    pace:0.92
  }),
  haunted: Object.freeze({
    type:'ghosts', name:'GHOST SWARM',
    approaching:'Ghosts are closing in!',
    caught:'SURROUNDED BY GHOSTS · HEALTH DRAINING',
    tint:'rgba(82,65,133,0.16)', front:'#beb0ff', accent:'#6d54b9', particle:'#e1d5ff',
    pace:0.96
  }),
  underwater: Object.freeze({
    type:'piranhas', name:'PIRANHA SCHOOL',
    approaching:'Piranhas are closing in!',
    caught:'CAUGHT BY PIRANHAS · HEALTH DRAINING',
    tint:'rgba(15,85,107,0.18)', front:'#7bd0d4', accent:'#296b83', particle:'#d5f5f5',
    pace:1.24
  })
});

// Remaining maps intentionally retain a basic hazard until themed in batches.
export const DEFAULT_CHASE_HAZARD = Object.freeze({
  type:'generic', name:'CHASE',
  approaching:'Chasing hazard approaching!',
  caught:'CAUGHT BY THE HAZARD · HEALTH DRAINING',
  tint:'rgba(104,123,135,0.18)', front:'#e4e8e9', accent:'#8299a4', particle:'#ffffff',
  pace:1
});
export function chaseHazardForMap(mapId){
  return Object.hasOwn(CHASE_HAZARD_THEMES,mapId)
    ? CHASE_HAZARD_THEMES[mapId] : DEFAULT_CHASE_HAZARD;
}

export function chaseWarningFor(mapId, proximity, stale=false){
  if(stale || !proximity || !Number.isFinite(proximity.distanceMeters))return null;
  const theme=chaseHazardForMap(mapId),distance=proximity.distanceMeters;
  if(distance<=0)return {level:'caught',label:theme.caught,distanceMeters:0};
  if(distance<=200)return {level:'near',label:theme.approaching,distanceMeters:Math.ceil(distance)};
  return null;
}

/**
 * Small world-space sprites used only by the visual renderer.
 * Everything is drawn using the existing canvas context: no image assets,
 * collision shapes, networking, or new effects system required.
 */
function drawLavaGlob(ctx,x,y,r,time,i){
  const wobble=Math.sin(time*3+i*2.7)*r*.2;
  ctx.globalAlpha=.85;
  ctx.fillStyle='#a62a0c';
  ctx.beginPath();ctx.arc(x,y,r*1.45,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff6a12';
  ctx.beginPath();ctx.arc(x+2,y-2+wobble,r*1.1,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffdc55';
  ctx.beginPath();ctx.arc(x+r*.2,y-r*.2+wobble,r*.48,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.6;
  ctx.fillStyle='#ffef96';
  ctx.beginPath();ctx.arc(x-r*.4,y-r*.45,r*.17,0,Math.PI*2);ctx.fill();
}
function drawGhost(ctx,x,y,r,time,i){
  const drift=Math.sin(time*2.2+i*1.7)*r*.38;
  y+=drift;
  const w=r*1.15,h=r*1.7;
  ctx.globalAlpha=.57+Math.sin(time*2.8+i)*.2;
  ctx.fillStyle='#c5b8f7';
  ctx.beginPath();
  ctx.arc(x,y,r*1.08,Math.PI,0);
  ctx.lineTo(x+w,y+h);
  // An uneven, fluttering lower edge makes the silhouettes look like spirits.
  for(let k=3;k>=0;k--){
    const px=x-w+2*w*k/3;
    const py=y+h+Math.sin(time*3+i+k)*r*.36;
    ctx.lineTo(px,py);
  }
  ctx.closePath();ctx.fill();
  ctx.globalAlpha=.85;
  ctx.fillStyle='#291d56';
  ctx.beginPath();ctx.ellipse(x-r*.36,y-r*.07,r*.17,r*.3,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+r*.3,y-r*.07,r*.17,r*.3,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x,y+r*.56,r*.2,r*.34,0,0,Math.PI*2);ctx.fill();
}
function drawPiranha(ctx,x,y,r,time,i){
  const tail=Math.sin(time*11+i*1.8)*r*.46;
  ctx.globalAlpha=.9;
  // The school swims toward +X; the forked tail trails on the left.
  ctx.fillStyle='#b7dad6';
  ctx.beginPath();
  ctx.moveTo(x-r*.75,y);
  ctx.lineTo(x-r*2.1,y-r*.8+tail);
  ctx.lineTo(x-r*1.75,y);
  ctx.lineTo(x-r*2.1,y+r*.8+tail);
  ctx.closePath();ctx.fill();
  ctx.fillStyle='#637b87';
  ctx.beginPath();
  ctx.moveTo(x-r*.55,y-r*.5);
  ctx.lineTo(x-r*.2,y-r*1.42);
  ctx.lineTo(x+r*.45,y-r*.46);
  ctx.closePath();ctx.fill();
  ctx.fillStyle='#c8dfe0';
  ctx.beginPath();ctx.ellipse(x,y,r*1.15,r*.64,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d94c43';
  ctx.beginPath();ctx.ellipse(x+r*.5,y+r*.26,r*.56,r*.29,0,0,Math.PI*2);ctx.fill();
  // Jagged white mouth, dark eye, and distinct red belly read as piranhas.
  ctx.strokeStyle='#f8f4e7';ctx.lineWidth=Math.max(1,r*.13);
  ctx.beginPath();
  ctx.moveTo(x+r*.68,y+r*.23);
  ctx.lineTo(x+r*.84,y+r*.39);
  ctx.lineTo(x+r*.94,y+r*.19);
  ctx.lineTo(x+r*1.12,y+r*.32);
  ctx.stroke();
  ctx.fillStyle='#102b39';
  ctx.beginPath();ctx.arc(x+r*.57,y-r*.15,r*.18,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.arc(x+r*.63,y-r*.22,r*.065,0,Math.PI*2);ctx.fill();
}

/**
 * A small cartoon cow charging toward +X with horns, cow spots, and angry eyes.
 * y is the ground/roof surface; no collision or physics is involved.
 */
function drawAngryCow(ctx,x,y,scale,time,i){
  const stride=Math.sin(time*11+i*1.7);
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  ctx.globalAlpha=.96;
  // Dust trailing behind the running herd.
  ctx.fillStyle='rgba(205,173,122,.35)';
  ctx.beginPath();ctx.ellipse(-24,-3,12,5,0,0,Math.PI*2);ctx.fill();
  // Animated hooves.
  ctx.strokeStyle='#483e37';ctx.lineWidth=4;ctx.lineCap='round';
  for(let j=0;j<4;j++){
    const legX=j<2?-18:11,phase=stride*(j%2===0?1:-1);
    const offset=j%2?4:-4;
    ctx.beginPath();ctx.moveTo(legX+offset,-19);
    ctx.lineTo(legX+offset+phase*7,-3-Math.max(0,phase)*5);ctx.stroke();
  }
  // Tail lashes as the herd charges.
  ctx.strokeStyle='#493e37';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-32,-26);
  ctx.quadraticCurveTo(-45,-30+stride*5,-48,-17+stride*8);ctx.stroke();
  // Stocky hide with black patches.
  ctx.fillStyle='#f4eee2';ctx.beginPath();
  ctx.ellipse(-8,-28,30,19,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#353139';
  ctx.beginPath();ctx.ellipse(-20,-36,11,8,-.35,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(2,-22,9,11,.35,0,Math.PI*2);ctx.fill();
  // Head, ears, and visible pointed horns.
  ctx.fillStyle='#f4eee2';ctx.beginPath();
  ctx.ellipse(26,-38,17,17,-.12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e6c6b3';
  ctx.beginPath();ctx.ellipse(11,-48,8,4,-.35,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(42,-49,8,4,.35,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d2c6b2';ctx.beginPath();
  ctx.moveTo(18,-50);ctx.lineTo(12,-66);ctx.lineTo(27,-54);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(34,-53);ctx.lineTo(43,-68);ctx.lineTo(44,-50);ctx.closePath();ctx.fill();
  // Nose is prominent enough to read even at reduced scale.
  ctx.fillStyle='#e4a3a3';ctx.beginPath();ctx.ellipse(34,-29,13,9,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#75434b';for(const n of [28,39]){
    ctx.beginPath();ctx.arc(n,-28,2,0,Math.PI*2);ctx.fill();
  }
  // Downward-slanted eyebrows make the cows clearly furious.
  ctx.fillStyle='#191c21';
  for(const eyeX of [25,37]){
    ctx.beginPath();ctx.arc(eyeX,-43,2.5,0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle='#3b2423';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(18,-49);ctx.lineTo(29,-46);ctx.stroke();
  ctx.beginPath();ctx.moveTo(36,-46);ctx.lineTo(46,-50);ctx.stroke();
  ctx.restore();
}

/** Cartoon grandmothers chase across roofs with raised rolling pins. */
function drawAngryGrandma(ctx,x,y,scale,time,i){
  const stride=Math.sin(time*12+i*2);
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  ctx.globalAlpha=.96;
  // Running slippers and animated legs.
  ctx.strokeStyle='#45344e';ctx.lineWidth=3.5;ctx.lineCap='round';
  for(const [dx,phase] of [[-8,stride],[7,-stride]]){
    ctx.beginPath();ctx.moveTo(dx,-13);ctx.lineTo(dx+phase*9,-1-Math.max(0,phase)*5);ctx.stroke();
    ctx.fillStyle='#462f50';ctx.beginPath();ctx.ellipse(dx+phase*9+3,-1-Math.max(0,phase)*5,6,2.5,0,0,Math.PI*2);ctx.fill();
  }
  // Bright patterned dress / apron.
  const colors=['#ba668c','#657eb3','#a76f4e','#6d9a82'];
  ctx.fillStyle=colors[i%colors.length];
  ctx.beginPath();ctx.moveTo(-10,-47);ctx.lineTo(10,-47);
  ctx.lineTo(18,-14);ctx.lineTo(-18,-14);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f1e0be';ctx.beginPath();ctx.ellipse(1,-30,8,12,0,0,Math.PI*2);ctx.fill();
  // Waving a rolling pin like an angry cartoon pursuer.
  ctx.strokeStyle='#e8b18f';ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(10,-44);ctx.lineTo(20+stride*4,-59);ctx.stroke();
  ctx.strokeStyle='#93613e';ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(14+stride*4,-65);ctx.lineTo(28+stride*4,-80);ctx.stroke();
  ctx.strokeStyle='#e8b18f';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(-10,-44);ctx.lineTo(-22,-33+stride*4);ctx.stroke();
  // Face, silver hair/bun and spectacles.
  ctx.fillStyle='#eed0af';ctx.beginPath();ctx.arc(0,-57,13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#dedbe1';ctx.beginPath();
  ctx.arc(-6,-68,11,Math.PI,Math.PI*2);ctx.lineTo(8,-66);
  ctx.arc(8,-72,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d1cbd5';ctx.beginPath();ctx.arc(-10,-74,9,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#523f50';ctx.lineWidth=1.7;
  for(const eye of [-5,6]){
    ctx.beginPath();ctx.arc(eye,-57,4,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#211d24';ctx.beginPath();ctx.arc(eye+1,-56,1.5,0,Math.PI*2);ctx.fill();
  }
  // Furious eyebrows and a determined frown.
  ctx.strokeStyle='#553d43';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(-11,-65);ctx.lineTo(-2,-61);ctx.stroke();
  ctx.beginPath();ctx.moveTo(2,-61);ctx.lineTo(12,-65);ctx.stroke();
  ctx.beginPath();ctx.arc(2,-45,4,Math.PI*1.16,Math.PI*1.84);ctx.stroke();
  ctx.restore();
}

/**
 * World-space hazard, rendered under the vehicle after terrain; never collides.
 * The camera transform has already been applied by render.js.
 *
 * positionMeters is the same locally smoothed boundary used by the warning and
 * distance tracker. Conversion uses the game's 140px world origin.
 */
export function drawChaseHazard(ctx,{
  mapId,snapshot,viewLeft,viewRight,viewTop,viewBottom,
  pixelsPerMeter=10,originX=140,timeMs=0,groundAt=null
}={}){
  if(!snapshot?.enabled || !Number.isFinite(snapshot.positionMeters) ||
     !Number.isFinite(viewLeft) || !Number.isFinite(viewRight) ||
     !Number.isFinite(viewTop) || !Number.isFinite(viewBottom) ||
     !Number.isFinite(pixelsPerMeter) || pixelsPerMeter<=0)return;
  const boundaryX=originX+snapshot.positionMeters*pixelsPerMeter;
  const theme=chaseHazardForMap(mapId);
  const height=Math.max(1,viewBottom-viewTop),time=(Number.isFinite(timeMs)?timeMs:0)*0.001;
  // Nothing to paint if the entire rushing front is well behind the camera.
  if(boundaryX<viewLeft-160)return;
  const left=viewLeft-30,top=viewTop-30,bottom=viewBottom+30;
  const amplitude=theme.type==='flood'?25:theme.type==='avalanche'?36:
    theme.type==='lava'?35:theme.type==='ghosts'?45:theme.type==='piranhas'?31:
    theme.type==='cows'?34:theme.type==='grandmas'?29:50;
  const edge=y=>boundaryX+
    Math.sin(y*0.022+time*theme.pace*2.4)*amplitude+
    Math.sin(y*0.051-time*theme.pace*1.2)*amplitude*.32;

  ctx.save();
  // A translucent region behind the leading edge communicates which direction
  // is unsafe, without blocking cars, coins, roads or vehicle controls.
  ctx.beginPath();
  ctx.moveTo(left,top);
  for(let y=top;y<=bottom;y+=24)ctx.lineTo(edge(y),y);
  ctx.lineTo(edge(bottom),bottom);
  ctx.lineTo(left,bottom);
  ctx.closePath();
  ctx.fillStyle=theme.tint;
  ctx.fill();

  // The visible edge is a moving vertical wall, not a terrain collision.
  ctx.beginPath();
  for(let y=top;y<=bottom;y+=10){
    const x=edge(y);
    if(y===top)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.lineTo(edge(bottom),bottom);
  ctx.strokeStyle=theme.front;
  ctx.lineWidth=theme.type==='flood'?16:theme.type==='avalanche'?26:
    theme.type==='ghosts'?12:theme.type==='piranhas'?9:theme.type==='lava'?29:
    theme.type==='cows'?8:theme.type==='grandmas'?8:28;
  ctx.globalAlpha=.8;
  ctx.stroke();
  ctx.globalAlpha=1;

  // One shared animation loop with map-specific silhouettes. Sprite size and
  // density are bounded for mobile performance, irrespective of map distance.
  const particleCount=theme.type==='ghosts'?32:theme.type==='piranhas'?38:
    theme.type==='cows'?30:theme.type==='grandmas'?30:48;
  for(let i=0;i<particleCount;i++){
    const seed=i*73.37;
    const y=top+((seed*3.23+time*(theme.type==='flood'?-90:65)*theme.pace)%height+height)%height;
    const drift=(seed*5.4+time*155*theme.pace)%500;
    const x=edge(y)-drift;
    if(x<viewLeft-50 || x>viewRight+50)continue;
    const r=2+(i%5)*1.2;
    ctx.globalAlpha=.24+(i%5)*.11;
    ctx.strokeStyle=theme.particle;
    ctx.fillStyle=theme.particle;
    if(theme.type==='cows' || theme.type==='grandmas'){
      // Anchor cartoon characters to terrain/roofs rather than floating through
      // the background. Skip rooftop gaps and offscreen heights altogether.
      const surface=typeof groundAt==='function'?groundAt(x):bottom-28;
      if(Number.isFinite(surface) && surface>=viewTop-110 && surface<=viewBottom+40){
        if(theme.type==='cows')drawAngryCow(ctx,x,surface,0.65+(i%4)*.06,time,i);
        else drawAngryGrandma(ctx,x,surface,0.68+(i%4)*.05,time,i);
      }
    }else if(theme.type==='lava'){
      if(i%3===0)drawLavaGlob(ctx,x,y,9+(i%4)*4,time,i);
      else{
        // Glowing embers blow up from the molten front.
        ctx.fillStyle=theme.particle;ctx.beginPath();
        ctx.arc(x,y,r*.75,0,Math.PI*2);ctx.fill();
      }
    }else if(theme.type==='ghosts'){
      drawGhost(ctx,x,y,9+(i%4)*2.4,time,i);
    }else if(theme.type==='piranhas'){
      drawPiranha(ctx,x,y,7+(i%4)*2.3,time,i);
    }else if(theme.type==='sandstorm'){
      ctx.lineWidth=1.5+i%3;
      ctx.beginPath();ctx.moveTo(x-15,y+7);ctx.lineTo(x+12,y-4);ctx.stroke();
    }else if(theme.type==='flood'){
      ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(x,y,r*1.8,r*.7,-.24,0,Math.PI*2);
      ctx.stroke();
    }else{
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      if(theme.type==='avalanche' && i%6===0){
        ctx.beginPath();ctx.arc(x+9,y-8,r*2.3,0,Math.PI*2);ctx.fill();
      }
    }
  }
  ctx.globalAlpha=1;
  // An accent band gives a readable front even on similarly colored terrain.
  ctx.beginPath();
  for(let y=top;y<=bottom;y+=12){
    if(y===top)ctx.moveTo(edge(y)-25,y);else ctx.lineTo(edge(y)-25,y);
  }
  ctx.strokeStyle=theme.accent;
  ctx.lineWidth=3;
  ctx.stroke();
  ctx.restore();
}

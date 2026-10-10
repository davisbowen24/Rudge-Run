/**
 * Chase Mode presentation presets. Add future maps to CHASE_HAZARD_THEMES;
 * physics, network prediction, damage and scoring never depend on these values.
 * The three launch themes deliberately share a single canvas renderer.
 */
export const CHASE_HAZARD_THEMES = Object.freeze({
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
 * World-space hazard, rendered under the vehicle after terrain; never collides.
 * The camera transform has already been applied by render.js.
 *
 * positionMeters is the same locally smoothed boundary used by the warning and
 * distance tracker. Conversion uses the game's 140px world origin.
 */
export function drawChaseHazard(ctx,{
  mapId,snapshot,viewLeft,viewRight,viewTop,viewBottom,
  pixelsPerMeter=10,originX=140,timeMs=0
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
  const amplitude=theme.type==='flood'?25:theme.type==='avalanche'?36:50;
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
  ctx.lineWidth=theme.type==='flood'?16:theme.type==='avalanche'?26:28;
  ctx.globalAlpha=.8;
  ctx.stroke();
  ctx.globalAlpha=1;

  // Three render variations, all driven by the same positions and animation.
  const particleCount=48;
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
    if(theme.type==='sandstorm'){
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

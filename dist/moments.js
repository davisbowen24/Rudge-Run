import { CONFIG } from './config.js';
import { $, clamp } from './utils.js';

/** Transient presentation events. Never writes simulation, rewards, or save data. */
export function createMoments({workshop,state, terrain, effects}) {
  const notices=[];
  let clock=0,shake=0,punch=0,zoom=1,flash=0,carRef=null;
  let flight=null,wasGrounded=false,flips=0,baselineRecord=0,recordShown=false;
  let prior={vx:0,vy:0,av:0},coinDisplay=0,coinTarget=0,reveal=null,lastMarkup='';
  const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt=n=>Math.floor(n).toLocaleString('en-US');
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function pulse(id,strength=1) {
    const el=$(id);
    if(!reduced&&el.animate)el.animate([{filter:'brightness(1.7)',transform:`scale(${1+.055*strength})`},{filter:'brightness(1)',transform:'scale(1)'}],{duration:450,easing:'ease-out'});
  }
  function notify(title,detail='',level=1,kind='trail') {
    // One popup per category; a combo upgrades the existing flip popup.
    const same=notices.findIndex(n=>n.kind===kind);if(same>=0)notices.splice(same,1);
    notices.unshift({title,detail,level,kind,born:clock});notices.length=Math.min(3,notices.length);
    $('bonusAnnounce').textContent=title+(detail?' · '+detail:'');
  }
  function emit(type,data={}) {
    const strength=clamp(data.strength||1,.2,3);
    if(type==='landing'){
      shake=Math.max(shake,Math.min(5,strength*1.7));punch=Math.max(punch,.006*strength);
      effects.burst(data.x,data.y,effects.materialAt(data.x),Math.round(9*strength),strength);
      if(data.huge)notify('HUGE JUMP',`${fmt(data.distance)} m in the air · ${data.airtime.toFixed(1)} s`,2,'jump');
    }else if(type==='jump'){
      notify('BIG AIR',`${fmt(data.distance)} m and counting`,1.5,'jump');
    }else if(type==='flip'){
      flips++;
      notify(flips>1?`${flips}× ${data.direction}`:data.direction,`+${fmt(data.reward)} coins${flips>1?' · Keep it going':''}`,Math.min(3,1+flips*.35),'flip');
      punch=Math.max(punch,Math.min(.018,.005+flips*.003));pulse('coins',Math.min(2,flips));
      effects.burst(state.car.x,state.car.y-25,'steel',Math.min(26,8+flips*4),1,'#ffe2a0');
    }else if(type==='fuel'){
      notify('TANK FULL','Ready for the next ridge',1.2,'fuel');pulse('fuelBox',2);flash=Math.max(flash,.08);
      effects.burst(data.x,data.y,'crystal',22,1.2,'#b9f69b');
    }else if(type==='checkpoint'){
      notify(data.claimed?'CHECKPOINT':'MILESTONE COMPLETE',`${fmt(data.distance)} m${data.claimed?' · Keep climbing':` · +${fmt(data.reward)} coins`}`,2,'checkpoint');pulse('runInfo',1.3);if(!data.claimed)pulse('coins',2);
      effects.burst(state.car.x,state.car.y-35,'steel',24,1.4,'#ffde83');
    }else if(type==='record'){
      notify('NEW PERSONAL BEST',`${fmt(data.distance)} m · A new mark to beat`,2.5,'record');pulse('distance',2);flash=Math.max(flash,.07);
      effects.burst(state.car.x,state.car.y-35,'crystal',28,1.6,'#c5f6ec');
    }else if(type==='unlock'||type==='upgrade'){
      workshop.celebrate();
      reveal={title:data.title,detail:data.detail,kind:type,subject:data.subject,major:type==='unlock'||!!data.major,born:clock};
      if(!reduced)$('momentReveal').animate?.([{transform:'translateX(-50%) translateY(-12px) scale(.94)'},{transform:'translateX(-50%) translateY(0) scale(1)'}],{duration:420,easing:'cubic-bezier(.16,1,.3,1)'});
      const target=data.target?document.querySelector?.(data.target):null;
      target?.closest('article')?.animate?.([{boxShadow:'0 0 0 2px #ffe3a1, 0 0 40px #ffc56680',transform:'scale(1.015)'},{boxShadow:'0 0 0 1px #ffc56600',transform:'scale(1)'}],{duration:1100,easing:'ease-out'});
      $('bonusAnnounce').textContent=data.title+' · '+data.detail;
    }
  }
  function reset() {
    carRef=state.car;notices.length=0;flight=null;wasGrounded=false;flips=0;shake=0;punch=0;zoom=1;flash=0;
    baselineRecord=state.progression.best[state.activeMap]||0;recordShown=false;coinDisplay=state.coins||0;coinTarget=coinDisplay;reveal=null;
  }
  function beforeStep(){if(carRef!==state.car)reset();prior={vx:state.car.vx,vy:state.car.vy,av:state.car.av};}
  function afterStep(dt) {
    const car=state.car;
    if(!car.grounded){
      if(!flight&&wasGrounded)flight={x:car.x,airtime:0,announced:false};
      if(flight){flight.airtime+=dt;const distance=Math.abs(car.x-flight.x)/CONFIG.world.pixelsPerMeter;if(!flight.announced&&((flight.airtime>1.4&&distance>35)||flight.airtime>3.5)){flight.announced=true;emit('jump',{distance});}}
    }else{
      if(flight&&flight.airtime>.12){
        let impact=0;
        for(const w of car.wheels){if(!w.normal)continue;const k=terrain.slope(w.x),d=Math.hypot(k,1),vx=prior.vx-prior.av*(w.y-car.y),vy=prior.vy+prior.av*(w.x-car.x);impact=Math.max(impact,(vy-vx*k)/d);}
        const distance=Math.abs(car.x-flight.x)/CONFIG.world.pixelsPerMeter;
        if(impact>95||flight.announced)emit('landing',{x:car.x,y:terrain.ground(car.x),strength:clamp((impact-65)/200,.25,3),huge:flight.announced,distance,airtime:flight.airtime});
      }
      flight=null;flips=0;
    }
    wasGrounded=car.grounded;
    const distance=Math.max(0,(car.x-140)/CONFIG.world.pixelsPerMeter);
    // Record notifications are centralized in stats.js.
  }
  function update(dt) {
    if(carRef!==state.car)reset();
    if(!state.paused){clock+=dt;shake*=Math.exp(-dt*12);punch*=Math.exp(-dt*9);flash*=Math.exp(-dt*7);const target=flight?.announced ? .94 : 1;zoom+=(target-zoom)*(1-Math.exp(-dt*2.6));}
    if(state.coins!==coinTarget){coinTarget=state.coins;pulse('coins',.5);}
    coinDisplay+=(coinTarget-coinDisplay)*(1-Math.exp(-dt*12));if(Math.abs(coinTarget-coinDisplay)<1)coinDisplay=coinTarget;
  }
  function camera(){return {zoom:reduced?1:zoom+punch,x:reduced?0:Math.sin(clock*91)*shake,y:reduced?0:Math.cos(clock*77)*shake*.65};}
  function drawOverlay(g) {
    if(flash<.003||state.screen!=='run')return;
    g.save();g.globalAlpha=flash;g.strokeStyle='#d0ffc0';g.lineWidth=12;g.strokeRect(6,6,state.W-12,state.H-12);g.restore();
  }
  function drawPopups() {
    while(notices.length&&clock-notices[notices.length-1].born>3.3)notices.pop();
    const html=notices.map(n=>{const age=clock-n.born,opacity=Math.min(1,Math.max(0,(3.3-age)/.45)),scale=reduced?1:1+Math.max(0,.16-age)*n.level;return `<div class="moment-popup moment-${n.kind}${n.level>=2?' is-major':''}${n.kind==='flip'&&n.title.includes('×')?' is-combo is-major':''}${n.kind==='flip'&&n.level>=2?' is-combo-high':''}" style="opacity:${opacity.toFixed(2)};transform:translateY(${-Math.min(16,age*6)}px) scale(${scale.toFixed(3)})"><b>${escape(n.title)}</b><small>${escape(n.detail).replace(/(\+[\d,]+ coins)/g,'<span class="reward-amount">$1</span>')}</small></div>`;}).join('');
    if(html!==lastMarkup){$('bonusPopups').innerHTML=html;lastMarkup=html;}
    if(reveal&&clock-reveal.born>3.8)reveal=null;
    const el=$('momentReveal');el.hidden=!reveal;
    if(reveal){el.setAttribute('data-event',reveal.kind);el.setAttribute('data-major',String(reveal.major));$('revealLabel').textContent=reveal.kind==='unlock'?(reveal.subject==='map'?'MAP UNLOCKED':'VEHICLE UNLOCKED'):'UPGRADE INSTALLED';$('revealTitle').textContent=reveal.title;$('revealDetail').textContent=reveal.detail;el.style.opacity=String(Math.min(1,(3.8-(clock-reveal.born))/.4));}
  }
  return {emit,notify,reset,beforeStep,afterStep,update,camera,drawOverlay,drawPopups,coinValue:()=>Math.round(coinDisplay),debug:()=>({flips,flight,baselineRecord,recordShown,popups:notices.length,reveal})};
}

import { canvasFont, UI_THEME } from './theme.js';
import { VEHICLES, VEHICLE_ORDER, VEHICLE_TIERS, VEHICLE_STAT_TABLE, vehicleBase, UPGRADES } from './vehicles.js';
import { MAX_LEVEL } from './config.js';
import { $ } from './utils.js';

/** Menu-only staging. All vehicle geometry and upgrade calculations stay authoritative. */
export function createWorkshop({state,save,upgrades,economy,render,physics,ui}) {
  let browsing='base',clock=0,transition=1,direction=1,lastVehicle=null,glow=0;
  const fmt=n=>n.toLocaleString('en-US');
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icons={engine:'ϟ',suspension:'≋',tires:'◉',fuel:'⛽'};
  function personality(id){const v=vehicleBase(id);return v.mass>=25?'HEAVY MACHINERY':v.tracked||['monster','buggy','tractor'].includes(id)?'BUILT FOR THE ROUGH':v.mass<10?'LIGHT & AGILE':v.maxSpeed>vehicleBase('base').maxSpeed*1.4?'PERFORMANCE SERIES':'TRAIL ORIGINALS';}
  function progress(id){return Object.values(save.levelsFor(id)).reduce((a,b)=>a+b,0);}
  function stage(id,mode){return `<div class="vehicle-stage"><div class="stage-caption"><span>${personality(id)}</span><span>RIDGE RUN / MOTOR WORKS</span></div><canvas id="${mode}Stage" width="1000" height="460" aria-label="${esc(VEHICLES[id].name)} on the showroom platform"></canvas><div class="stage-nav"><button data-step="-1" aria-label="Previous vehicle">‹</button><span>${mode==='store'?VEHICLE_ORDER.indexOf(id)+1:state.progression.owned.indexOf(id)+1} / ${mode==='store'?20:state.progression.owned.length}</span><button data-step="1" aria-label="Next vehicle">›</button></div></div>`;}
  function bars(id){const v=vehicleBase(id),all=VEHICLE_ORDER.map(vehicleBase);const traits=[['Power',x=>x.enginePower],['Speed',x=>x.maxSpeed],['Grip',x=>x.tireGrip],['Air agility',x=>x.airTilt*x.airControl]];return `<div class="character-bars">${traits.map(([label,get])=>{const pct=Math.round(get(v)/Math.max(...all.map(get))*100);return `<div><span>${label}</span><i aria-label="${label}: ${pct}% of lineup maximum"><b style="width:${pct}%"></b></i></div>`;}).join('')}</div><small class="bar-note">Base traits · relative to the lineup</small>`;}
  function details(id){const m=VEHICLE_STAT_TABLE[id];return `<details class="vehicle-details"><summary>Exact vehicle specs</summary><dl>${[['Mass','mass'],['Torque','motorTorque'],['Power','enginePower'],['Acceleration cap','accelerationLimit'],['Gearing','wheelSpeedLimit'],['Grip','tireGrip'],['Air control','airControl'],['Ground stability','pitchSupport'],['Ground damping','groundDamping'],['Suspension travel','suspensionTravel']].map(([label,key])=>`<div><dt>${label}</dt><dd>${(m[key]??1).toFixed(2)}×</dd></div>`).join('')}</dl><small>Jeep = 1.00× · base tuning before upgrades</small></details>`;}
  function store(){
    if(!VEHICLES[browsing])browsing=state.progression.selected;
    const id=browsing,d=VEHICLES[id],owned=state.progression.owned.includes(id),equipped=id===state.progression.selected,affordable=state.progression.balance>=d.price;
    $('storeBalance').textContent=fmt(state.progression.balance);
    $('vehicleCards').innerHTML=`<div class="showcase-layout"><div>${stage(id,'store')}</div><article class="vehicle-dossier"><div class="vehicle-tag">${VEHICLE_TIERS[Math.floor(VEHICLE_ORDER.indexOf(id)/5)]}</div><div class="ownership ${owned?'is-owned':''}">${equipped?'● EQUIPPED':owned?'✓ OWNED':'◇ LOCKED'}</div><h2>${esc(d.name)}</h2><p>${esc(d.description)}</p>${bars(id)}<div class="investment"><span>Upgrades installed</span><strong>${progress(id)} / ${MAX_LEVEL*4}</strong><i><b style="width:${progress(id)/(MAX_LEVEL*4)*100}%"></b></i></div><div class="purchase-price">${owned?'Ready for the trail':fmt(d.price)+' <small>coins</small>'}</div><button class="buy showcase-buy" data-vehicle="${id}" data-action="${owned?'select':'unlock'}" ${equipped||(!owned&&!affordable)?'disabled':''}>${equipped?'Equipped':owned?'Equip vehicle':'Unlock vehicle'}</button>${owned?'<button class="secondary tune-vehicle" data-tune="'+id+'">Tune in Garage</button>':!affordable?'<p class="shortfall">'+fmt(d.price-state.progression.balance)+' more coins to unlock</p>':''}${details(id)}</article></div><nav class="vehicle-rail" aria-label="Browse all vehicles">${VEHICLE_ORDER.map((key,i)=>{const own=state.progression.owned.includes(key);return `<button data-status="${key===state.progression.selected?'equipped':own?'owned':'locked'}" data-browse="${key}" class="${key===id?'active':''}" aria-pressed="${key===id}"><small>${String(i+1).padStart(2,'0')} · ${key===state.progression.selected?'EQUIPPED':own?'OWNED':fmt(VEHICLES[key].price)+' ◈'}</small><strong>${esc(VEHICLES[key].name.replace(' / Base Vehicle','').replace(' (Monster Truck)','').replace(' (ATV)',''))}</strong></button>`;}).join('')}</nav>`;
    drawStage('store',id);
  }
  function garage(){
    const id=state.progression.selected;
    $('garagePresentation').innerHTML=stage(id,'garage')+`<div class="garage-identity"><span class="ownership is-owned">● EQUIPPED</span><h2>${esc(VEHICLES[id].name)}</h2><p>${esc(VEHICLES[id].description)}</p>${bars(id)}</div>`;
    const current=upgrades.vehicleStats(save.levelsFor());
    $('upgradeCards').innerHTML=Object.keys(UPGRADES).map(key=>{
      const entry=upgrades.upgradeEntry(key),level=save.levelsFor()[key],max=level===MAX_LEVEL,cost=economy.upgradeCost(key),next=upgrades.vehicleStats({...save.levelsFor(),[key]:Math.min(MAX_LEVEL,level+1)}),affordable=state.progression.balance>=cost;
      return `<article class="upgrade workshop-upgrade" data-status="${max?'max':affordable?'ready':'locked'}"><div class="upgrade-heading"><span class="upgrade-icon">${icons[key]}</span><div><h2>${entry.name}</h2><span class="upgrade-level">${max?'MAXED OUT':`Level ${level+1} → ${level+2}`}</span></div></div><div class="level-bars" aria-label="Level ${level+1} of ${MAX_LEVEL+1}">${Array.from({length:MAX_LEVEL+1},(_,i)=>`<span class="${i<=level?'filled':''}"></span>`).join('')}</div><p class="upgrade-benefit">${max?'Built to its full potential.':ui.upgradeBenefit(key,current,next)}</p><button class="buy" data-upgrade="${key}" ${max||!affordable?'disabled':''}>${max?'Fully upgraded':`Install · ${fmt(cost)} ◈`}</button>${!max&&!affordable?`<small class="shortfall">Need ${fmt(cost-state.progression.balance)} more coins</small>`:''}<details class="upgrade-detail"><summary>What changes?</summary><p>${entry.description}</p><p>Now: ${ui.statSummary(key,current)}</p>${max?'':'<p>Next: '+ui.statSummary(key,next)+'</p>'}</details></article>`;
    }).join('');
    drawStage('garage',id);
  }
  function enter(){browsing=state.progression.selected;lastVehicle=null;transition=1;}
  function move(id,dir=1){
    if(!VEHICLES[id])return;
    direction=dir;transition=0;
    if(state.screen==='store'){browsing=id;store();$('vehicleCards').querySelector(`[data-browse="${id}"]`)?.focus({preventScroll:true});}
    else if(state.screen==='garage'&&state.progression.owned.includes(id)){state.progression.selected=id;save.saveProgress();ui.renderGarage();}
  }
  function activate(event){
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.step){const list=state.screen==='store'?VEHICLE_ORDER:VEHICLE_ORDER.filter(id=>state.progression.owned.includes(id)),id=state.screen==='store'?browsing:state.progression.selected;move(list[(list.indexOf(id)+Number(b.dataset.step)+list.length)%list.length],Number(b.dataset.step));if(state.screen==='garage')$('garagePresentation').querySelector(`[data-step="${b.dataset.step}"]`)?.focus();}
    else if(b.dataset.browse)move(b.dataset.browse,VEHICLE_ORDER.indexOf(b.dataset.browse)>=VEHICLE_ORDER.indexOf(browsing)?1:-1);
    else if(b.dataset.tune&&state.progression.owned.includes(b.dataset.tune)){economy.selectVehicle(b.dataset.tune);state.garageReturn='store';ui.showScreen('garage');ui.renderGarage();$('garageVehicle').focus();}
  }
  function celebrate(){glow=1;}
  function drawStage(mode,id){
    const canvas=$(mode+'Stage'),g=canvas.getContext('2d'),v=upgrades.vehicleStats(save.levelsFor(id),id),heavy=v.mass>=25;
    const gradient=g.createLinearGradient(0,0,0,460);gradient.addColorStop(0,'#0b1925');gradient.addColorStop(.68,'#1c3440');gradient.addColorStop(1,'#10232e');g.fillStyle=gradient;g.fillRect(0,0,1000,460);
    // Workshop staging: back wall panels, cabinets, work lights, and marked lift deck.
    g.strokeStyle='#66809218';g.lineWidth=1;for(let x=0;x<=1000;x+=100){g.beginPath();g.moveTo(x,0);g.lineTo(x,335);g.stroke();}
    for(const x of [45,865]){g.fillStyle='#203b49';g.fillRect(x,246,90,96);for(let y=252;y<337;y+=21){g.fillStyle='#112b38';g.fillRect(x+6,y,78,16);g.fillStyle='#738a94';g.fillRect(x+34,y+4,20,3);}}
    for(const x of [180,760]){g.fillStyle='#bfd6dc';g.fillRect(x,69,64,4);const light=g.createLinearGradient(x,70,x,340);light.addColorStop(0,'#d4edff17');light.addColorStop(1,'#d4edff00');g.fillStyle=light;g.beginPath();g.moveTo(x,75);g.lineTo(x+64,75);g.lineTo(x+180,340);g.lineTo(x-110,340);g.fill();}
    g.fillStyle='#10212b';g.fillRect(0,342,1000,118);g.strokeStyle='#6a8b9725';for(let x=-300;x<1400;x+=125){g.beginPath();g.moveTo(500+(x-500)*.6,342);g.lineTo(x,460);g.stroke();}
    g.fillStyle=heavy?'#3b4b53':'#354a54';g.beginPath();g.ellipse(500,364,345,37,0,0,Math.PI*2);g.fill();g.strokeStyle='#c1d2cf';g.lineWidth=2;g.stroke();
    g.strokeStyle='#dea768';g.lineWidth=3;for(let x=185;x<=780;x+=40){g.beginPath();g.moveTo(x,390);g.lineTo(x+18,397);g.stroke();}
    const span=Math.max(...v.wheels.map(w=>w.x+w.r))-Math.min(...v.wheels.map(w=>w.x-w.r))+55;
    const h=physics.rideHeight(v)+v.comOffsetY,top=Math.min(v.head.y-17,-55),size=Math.min(heavy?3.4:3,650/span,240/(h-top));
    const offset=reduced?0:direction*(1-transition)*70;
    g.save();g.translate(500+offset,351);g.scale(size,size);
    g.fillStyle='#0007';g.beginPath();g.ellipse(0,4,span*.43,7,0,0,6.283);g.fill();
    const y=-h+(reduced?0:Math.sin(clock*.8)*.25),wheels=v.wheels.map(w=>({x:w.x,y:v.tracked?y+w.y+v.suspensionTravel:-w.r,r:w.r,anchor:{x:w.x,y:y+w.y}}));
    g.globalAlpha=.85+.15*transition;render.paintVehicle(g,v,0,y,0,wheels,0);g.restore();
    // Moving floor highlight stays out of the vehicle silhouette.
    g.strokeStyle=`rgba(147,206,220,${.18+(glow*.6)})`;g.lineWidth=2;g.beginPath();g.ellipse(500,364,343,36,0,.1,Math.PI-.1);g.stroke();
    if(glow>.01){g.globalAlpha=glow*.18;g.fillStyle='#fbd285';g.fillRect(0,0,1000,460);g.globalAlpha=1;}
    g.fillStyle=UI_THEME.colors.secondary;g.font=canvasFont(11,600);g.textAlign='center';g.fillText(mode==='garage'?'SERVICE BAY  /  READY TO BUILD':'MOTOR WORKS  /  THE COLLECTION',500,433);g.textAlign='start';
  }
  function update(dt){
    if(!['store','garage'].includes(state.screen))return;
    clock+=dt;transition=Math.min(1,transition+dt*4);glow=Math.max(0,glow-dt*1.4);
    const id=state.screen==='store'?browsing:state.progression.selected;if(lastVehicle!==id){lastVehicle=id;}
    drawStage(state.screen,id);
  }
  function bindEvents(){
    $('vehicleCards').addEventListener('click',activate);$('garagePresentation').addEventListener('click',activate);
    // Arrow navigation only when focus belongs to the showroom; form controls keep native keys.
    $('storeScreen').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();const i=VEHICLE_ORDER.indexOf(browsing),dir=e.key==='ArrowRight'?1:-1;move(VEHICLE_ORDER[(i+dir+20)%20],dir);}});
  }
  return {store,garage,enter,update,bindEvents,celebrate,move,drawStage,current:()=>browsing};
}

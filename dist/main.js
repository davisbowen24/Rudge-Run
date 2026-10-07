import { CONFIG, GRAVITY_SCALE } from './config.js';
import { MAPS } from './maps.js';
import { $, clamp } from './utils.js';

export function createMain({ stats, workshop, effects, moments, state, upgrades, save, ui, terrain, physics, economy, feedback, render, input }) {

  function reset(){
    state.usedBoostPads.clear();
    state.bridgeMotion.clear();
    state.slimeCooldown=0;
    state.spray=[];
    state.sprayClock=0;
    state.paused=false;
    state.activeMap=state.progression.ownedMaps.includes(state.progression.selectedMap)?state.progression.selectedMap:'countryside';
    CONFIG.world.gravity=MAPS[state.activeMap].gravity*GRAVITY_SCALE;
    state.nextCheckpoint=1;
    state.seasonIndex=0;
    state.airRotation=0;
    state.airTime=0;
    state.bonusEvents=[];
    $('bonusPopups').innerHTML='';
    Object.assign(CONFIG.vehicle,upgrades.vehicleStats(save.levelsFor()));
    ui.showScreen('run');
    state.car={x:140,y:terrain.ground(140)-physics.rideHeight(CONFIG.vehicle),vx:0,vy:0,a:0,av:0,wheelSpin:0,trackPhase:0,wheelLengths:CONFIG.vehicle.wheels.map(w=>clamp(physics.rideHeight(CONFIG.vehicle)+CONFIG.vehicle.comOffsetY-w.y-w.r,CONFIG.vehicle.suspensionMin,CONFIG.vehicle.suspensionTravel)),wheelPhases:CONFIG.vehicle.wheels.map(()=>0),wheelSlip:CONFIG.vehicle.wheels.map(()=>false),wheelSpeeds:CONFIG.vehicle.wheels.map(()=>0),wheels:[],grounded:false};
    state.camera={x:state.car.x-230,y:state.car.y-120};
    state.items=[];
    state.nextCoin=450;
    state.coinGroupIndex=0;
    state.gasGap=CONFIG.pickups.firstFuelMeters;
    state.previousFuel=140;
    state.nextFuel=140+state.gasGap*CONFIG.world.pixelsPerMeter;
    state.furthest=140;
    state.fuel=CONFIG.vehicle.fuelCapacity;
    state.coins=0;
    state.playing=true;
    state.started=false;
    state.time=0;
    state.toastTime=0;
    state.keys.clear();
    state.pointers.gas.clear();
    state.pointers.brake.clear();
    $('overlay').hidden=true;
    physics.syncWheelGeometry();
    economy.generate();
    effects.reset();
    moments.reset();
    stats.prepare();
    $('runRecords').innerHTML='';
    ui.updateHUD();
  }

  function frame(now){
    const elapsed=Math.min((now-state.last)/1000,.05);
    state.last=now;
    if(!state.paused){
      state.accumulator+=elapsed;
      while(state.accumulator>=1/120){
        physics.step(1/120);
        state.accumulator-=1/120;
      }
      const targetX=state.car.x-state.W/state.scale*.30+clamp(state.car.vx*.12,-100,140),targetY=state.car.y-state.H/state.scale*.53;
      const ease=1-Math.exp(-elapsed*4);
      state.camera.x+=(targetX-state.camera.x)*ease;
      state.camera.y+=(targetY-state.camera.y)*ease;
    }
    feedback.updateFeedback(elapsed);
    moments.update(elapsed);
    render.draw();
    workshop.update(elapsed);
    ui.updateHUD();
    requestAnimationFrame(frame);
  }

  function start() {

    state.activeMap = 'countryside';

    state.mapReturn = 'start';

    state.nextCheckpoint = 1;

    state.seasonIndex = 0;

    state.airRotation = 0;

    state.airTime = 0;

    state.bonusEvents = [];

    state.constructionSegments = [];

    state.highwaySegments = [];

    state.roofSegments = [];

    state.biomeCache = new Map();

    state.bridgeMotion = new Map();

    state.slimeCooldown = 0;

    state.usedBoostPads = new Set();

    state.roadFeatureCache = new Map();

    state.progression = save.freshProgress();

    save.loadProgress();

    state.screen = 'start';

    state.garageReturn = 'start';

    state.storeReturn = 'start';

    state.canvas = document.getElementById('game');

    state.ctx = state.canvas.getContext('2d');

    state.W = undefined;

    state.H = undefined;

    state.scale = undefined;

    state.dpr = undefined;

    state.car = undefined;

    state.camera = undefined;

    state.items = undefined;

    state.nextCoin = undefined;

    state.nextFuel = undefined;

    state.gasGap = undefined;

    state.previousFuel = undefined;

    state.coinGroupIndex = undefined;

    state.furthest = undefined;

    state.fuel = undefined;

    state.coins = undefined;

    state.playing = undefined;

    state.started = undefined;

    state.paused = false;

    state.time = 0;

    state.toastTime = 0;

    state.keys = new Set();

    state.pointers = {gas:new Set(),brake:new Set()};

    addEventListener('resize',ui.resize);

    ui.resize();

    state.spray = [];

    state.sprayClock = 0;

    state.audioRig = null;

    state.soundEnabled = false;

    state.last = performance.now();

    state.accumulator = 0;

    input.bindEvents();

    ui.bindEvents();

    feedback.bindEvents();

    reset();

    state.playing=false;

    ui.showScreen('start');

    save.saveProgress();

    requestAnimationFrame(frame);

  }

  return { reset, frame, start };

}

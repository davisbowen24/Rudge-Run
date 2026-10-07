import { $ } from './utils.js';

export function createInput({ state, ui, stats }) {

  function input(name){
    return state.pointers[name].size>0 || (name==='gas'?(state.keys.has('ArrowRight')||state.keys.has('KeyD')):(state.keys.has('ArrowLeft')||state.keys.has('KeyA')));
  }

  function clearControls(){
    state.keys.clear();
    state.pointers.gas.clear();
    state.pointers.brake.clear();
  }

  function bindEvents() {

    for(const name of ['gas','brake']){
      const el=$(name);
      el.addEventListener('pointerdown',e=>{
        e.preventDefault();
        if(state.screen!=='run')
        return;
        state.pointers[name].add(e.pointerId);
        el.setPointerCapture(e.pointerId);
      });
      for(const evt of ['pointerup','pointercancel','lostpointercapture'])
      el.addEventListener(evt,e=>state.pointers[name].delete(e.pointerId));
      el.addEventListener('contextmenu',e=>e.preventDefault());
    }

    addEventListener('keydown',e=>{
      if((e.code==='Escape'||e.code==='KeyP')&&(state.screen==='run'||state.screen==='paused')){
        e.preventDefault();
        if(!e.repeat){
          if(state.screen==='paused')
          ui.resumeRun();else
          ui.pauseRun();
        }
        return;
      }
      if(['ArrowRight','ArrowLeft','KeyA','KeyD'].includes(e.code)&&state.screen==='run'){
        e.preventDefault();
        state.keys.add(e.code);
      }
      if(e.code==='Escape'){
        if(state.screen==='stats')stats.close();
        if(state.screen==='maps')
        ui.closeMaps();else
        if(state.screen==='store')
        ui.closeStore();else
        if(state.screen==='garage')
        ui.closeGarage();
      }
    });

    addEventListener('keyup',e=>state.keys.delete(e.code));

    addEventListener('blur',()=>{
      clearControls();
      if(state.screen==='run'&&state.playing)
      ui.pauseRun();
    });

    addEventListener('focus',()=>{
      state.last=performance.now();
    });

    document.addEventListener('visibilitychange',()=>{
      clearControls();
      if(document.hidden&&state.screen==='run'&&state.playing)
      ui.pauseRun();
      state.last=performance.now();
    });

  }

  return { input, clearControls, bindEvents };

}

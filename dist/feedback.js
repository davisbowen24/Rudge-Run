import { MAPS } from './maps.js';
import { $ } from './utils.js';

export function createFeedback({ effects, state, terrain, input }) {

  function updateFeedback(dt){
    const running=state.screen==='run'&&state.playing&&!state.paused;
    let slipping=0,material='dirt';
    effects.update(dt);
    if(running) for(let i=0;i<state.car.wheels.length;i++){
      const w=state.car.wheels[i];
      if(!w.normal) continue;
      if(state.car.wheelSlip[i]) slipping++;
      material=effects.materialAt(w.x);
    }

    if(state.audioRig&&state.soundEnabled){
      const a=state.audioRig,t=a.ac.currentTime,throttle=running&&(input.input('gas')||input.input('brake')),speed=Math.abs(state.car.vx);
      a.engine.frequency.setTargetAtTime(35+Math.min(150,speed*.06)+(throttle?35:0)+slipping*5,t,.08);
      a.engineGain.gain.setTargetAtTime(running&&state.started?(throttle?.12:.04):0,t,.06);
      a.filter.frequency.setTargetAtTime(material==='mud'?350:material==='ice'?2200:material==='leaf'?850:1400,t,.08);
      a.noiseGain.gain.setTargetAtTime(running?Math.min(.16,slipping*.025+(material==='mud'&&state.car.grounded?.05:0)):0,t,.06);
    }
  }

  function bindEvents() {

    $('soundButton').addEventListener('click',async()=>{
      try{
        if(!state.audioRig){
          const AC=window.AudioContext||window.webkitAudioContext;
          if(!AC)
          throw Error('unsupported');
          const ac=new AC(),master=ac.createGain(),engine=ac.createOscillator(),engineGain=ac.createGain(),noise=ac.createBufferSource(),noiseGain=ac.createGain(),filter=ac.createBiquadFilter(),buffer=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),data=buffer.getChannelData(0);
          for(let i=0;i<data.length;i++)
          data[i]=Math.random()*2-1;
          noise.buffer=buffer;
          noise.loop=true;
          engine.type='triangle';
          filter.type='bandpass';
          filter.frequency.value=1300;
          engineGain.gain.value=0;
          noiseGain.gain.value=0;
          master.gain.value=.22;
          engine.connect(engineGain).connect(master);
          noise.connect(filter).connect(noiseGain).connect(master);
          master.connect(ac.destination);
          engine.start();
          noise.start();
          state.audioRig={ac,master,engine,engineGain,noiseGain,filter};
        }
        state.soundEnabled=!state.soundEnabled;
        if(state.soundEnabled)
        await state.audioRig.ac.resume();else
        await state.audioRig.ac.suspend();
        $('soundButton').textContent='Sound: '+(state.soundEnabled?'On':'Off');
        $('soundButton').setAttribute('aria-pressed',String(state.soundEnabled));
      }catch(e){
        state.soundEnabled=false;
        $('soundButton').textContent='Sound unavailable';
      }
    });

  }

  return { updateFeedback, bindEvents };

}

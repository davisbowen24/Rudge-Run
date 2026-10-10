import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chaosPaintWheels} from '../dist/chaosVisuals.js';
import {chaosVehicleFor} from '../dist/chaosMode.js';

const chassis={x:520,y:240};

test('Giant Cars scales wheel hubs and suspension anchors together in world space',()=>{
  const wheels=[{x:460,y:325,r:55,anchor:{x:464,y:290},spin:1.2,normal:4},
    {x:580,y:325,r:55,anchor:{x:576,y:290},spin:2.1,normal:5}];
  const scale=1.5,paint=chaosPaintWheels(wheels,chassis.x,chassis.y,scale);
  for(let i=0;i<2;i++){
    for(const name of ['x','y']){
      assert.ok(Math.abs(chassis[name]+(paint[i][name]-chassis[name])*scale-wheels[i][name])<1e-9,
        'wheel centers must stay aligned with physics');
      assert.ok(Math.abs(chassis[name]+(paint[i].anchor[name]-chassis[name])*scale-wheels[i].anchor[name])<1e-9,
        'suspension anchors must stay aligned with physics');
    }
    assert.equal(paint[i].r*scale,wheels[i].r);
    assert.equal(paint[i].spin,wheels[i].spin);
    assert.equal(paint[i].normal,wheels[i].normal);
  }
  assert.deepEqual(wheels[0].anchor,{x:464,y:290},'render conversion cannot modify physics positions');
});

test('Tiny Cars applies the same correction without producing detached suspension',()=>{
  const wheels=[{x:495,y:284,r:12,anchor:{x:495,y:258}}];
  const paint=chaosPaintWheels(wheels,chassis.x,chassis.y,.6);
  for(const name of ['x','y']){
    assert.ok(Math.abs(chassis[name]+(paint[0][name]-chassis[name])*.6-wheels[0][name])<1e-9);
    assert.ok(Math.abs(chassis[name]+(paint[0].anchor[name]-chassis[name])*.6-wheels[0].anchor[name])<1e-9);
  }
});

test('Big Finger Giant Cars increases vertical wheel clearance without changing the normal car',()=>{
  const base={
    wheelRadius:44,halfWidth:61,wheelBase:126,driveLever:12,
    suspensionTravel:46,suspensionMin:19,comOffsetY:15,
    mass:30,inertia:40000,suspension:1300,suspensionDamping:200,
    wheels:[{x:-63,y:12,r:44},{x:63,y:12,r:44}],
    head:{x:-13,y:-43}
  };
  const giant=chaosVehicleFor(base,['giant']);
  assert.equal(giant.size,1.5);
  assert.equal(giant.vehicle.wheels[0].r,66);
  assert.equal(giant.vehicle.wheels[0].y,40,'monster tires gain 22px extra body clearance');
  assert.equal(giant.vehicle.wheels[1].y,40);
  assert.equal(giant.vehicle.suspensionTravel,69);
  assert.equal(giant.vehicle.comOffsetY,22.5);
  assert.equal(chaosVehicleFor(base,[]).vehicle.wheels[0].y,12,
    'clearing giant effect restores exact original wheel layout');
  assert.equal(base.wheels[0].y,12,'giant mode never mutates base vehicle geometry');
});

test('vehicle renderer paints wheel links through corrected inverse-scale helper',async()=>{
  const src=await readFile(new URL('../dist/render.js',import.meta.url),'utf8');
  assert.match(src,/import \{ chaosPaintWheels \} from '\.\/chaosVisuals\.js'/);
  assert.match(src,/chaosPaintWheels\(state\.car\.wheels,x,y,scale\)/);
  const race=await readFile(new URL('../dist/multiplayerRace.js',import.meta.url),'utf8');
  assert.match(race,/extraClearance/,'enlarging the car also raises it for the new wheel offset');
});

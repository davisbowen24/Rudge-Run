import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHASE_HAZARD_THEMES,DEFAULT_CHASE_HAZARD,chaseHazardForMap,
  chaseWarningFor,drawChaseHazard
} from '../dist/chaseVisuals.js';

test('fifteen configured maps have reusable Chase hazard presets',()=>{
  assert.deepEqual(Object.keys(CHASE_HAZARD_THEMES).sort(),
    ['alien','arctic','bootcamp','cave','construction','countryside','desert','haunted','highway','jungle','mars','moon','rooftops','underwater','volcano']);
  assert.equal(chaseHazardForMap('arctic').type,'avalanche');
  assert.equal(chaseHazardForMap('desert').type,'sandstorm');
  assert.equal(chaseHazardForMap('jungle').type,'flood');
  assert.equal(chaseHazardForMap('volcano').type,'lava');
  assert.equal(chaseHazardForMap('haunted').type,'ghosts');
  assert.equal(chaseHazardForMap('underwater').type,'piranhas');
  assert.equal(chaseHazardForMap('countryside').type,'cows');
  assert.equal(chaseHazardForMap('mars').type,'lava');
  assert.equal(chaseHazardForMap('rooftops').type,'grandmas');
  assert.equal(chaseHazardForMap('highway').type,'semi');
  assert.equal(chaseHazardForMap('cave').type,'spiders');
  assert.equal(chaseHazardForMap('moon').type,'ufos');
  assert.equal(chaseHazardForMap('alien').type,'aliens');
  assert.equal(chaseHazardForMap('construction').type,'pipes');
  assert.equal(chaseHazardForMap('bootcamp').type,'mud');
  assert.equal(chaseHazardForMap('seasons'),DEFAULT_CHASE_HAZARD);
  for(const id of Object.keys(CHASE_HAZARD_THEMES)){
    assert.notEqual(chaseHazardForMap(id).approaching,DEFAULT_CHASE_HAZARD.approaching);
    assert.ok(chaseHazardForMap(id).caught.length>10);
  }
});

test('warnings appear within 200 meters, intensify when caught and clear when safe or stale',()=>{
  assert.equal(chaseWarningFor('arctic',{distanceMeters:201}),null);
  const approaching=chaseWarningFor('arctic',{distanceMeters:200});
  assert.equal(approaching.level,'near');
  assert.match(approaching.label,/Avalanche/);
  assert.equal(approaching.distanceMeters,200);
  assert.equal(chaseWarningFor('desert',{distanceMeters:0}).level,'caught');
  assert.match(chaseWarningFor('volcano',{distanceMeters:199}).label,/Lava surge/);
  assert.match(chaseWarningFor('haunted',{distanceMeters:199}).label,/Ghosts/);
  assert.match(chaseWarningFor('underwater',{distanceMeters:199}).label,/Piranhas/);
  assert.match(chaseWarningFor('countryside',{distanceMeters:199}).label,/cows/i);
  assert.match(chaseWarningFor('mars',{distanceMeters:199}).label,/Martian lava/);
  assert.match(chaseWarningFor('rooftops',{distanceMeters:199}).label,/grandmothers/i);
  assert.match(chaseWarningFor('highway',{distanceMeters:199}).label,/semi/i);
  assert.match(chaseWarningFor('cave',{distanceMeters:199}).label,/spiders/i);
  assert.match(chaseWarningFor('moon',{distanceMeters:199}).label,/UFOs/i);
  assert.match(chaseWarningFor('alien',{distanceMeters:199}).label,/green aliens/i);
  assert.match(chaseWarningFor('construction',{distanceMeters:199}).label,/pipes/i);
  assert.match(chaseWarningFor('bootcamp',{distanceMeters:199}).label,/mud/i);
  assert.match(chaseWarningFor('volcano',{distanceMeters:-1}).label,/LAVA/);
  assert.match(chaseWarningFor('haunted',{distanceMeters:-1}).label,/GHOSTS/);
  assert.match(chaseWarningFor('underwater',{distanceMeters:-1}).label,/PIRANHAS/);
  assert.match(chaseWarningFor('countryside',{distanceMeters:-1}).label,/HERD/);
  assert.match(chaseWarningFor('mars',{distanceMeters:-1}).label,/MARTIAN LAVA/);
  assert.match(chaseWarningFor('rooftops',{distanceMeters:-1}).label,/GRANDMAS/);
  assert.match(chaseWarningFor('highway',{distanceMeters:-1}).label,/SEMI/);
  assert.match(chaseWarningFor('cave',{distanceMeters:-1}).label,/SPIDERS/);
  assert.match(chaseWarningFor('moon',{distanceMeters:-1}).label,/UFO/);
  assert.match(chaseWarningFor('alien',{distanceMeters:-1}).label,/ALIENS/);
  assert.match(chaseWarningFor('construction',{distanceMeters:-1}).label,/PIPES/);
  assert.match(chaseWarningFor('bootcamp',{distanceMeters:-1}).label,/MUD/);
  assert.match(chaseWarningFor('jungle',{distanceMeters:-25}).label,/FLOOD/);
  assert.equal(chaseWarningFor('arctic',{distanceMeters:50},true),null);
  assert.equal(chaseWarningFor('arctic',null),null);
  assert.equal(chaseWarningFor('arctic',{distanceMeters:Infinity}),null);
});

function context(){
  const calls=[];
  const ctx={calls,save(){calls.push('save')},restore(){calls.push('restore')},
    beginPath(){calls.push('begin')},moveTo(x,y){calls.push(['moveTo',x,y])},
    lineTo(x,y){calls.push(['lineTo',x,y])},closePath(){},
    fill(){calls.push('fill')},stroke(){calls.push('stroke')},
    arc(){calls.push('arc')},ellipse(){calls.push('ellipse')},
    translate(x,y){calls.push(['translate',x,y])},scale(){calls.push('scale')},
    quadraticCurveTo(){calls.push('quad')},
    fillRect(x,y,w,h){calls.push(['fillRect',x,y,w,h])},
    rotate(a){calls.push(['rotate',a])}};
  return ctx;
}
test('all fifteen hazards render safely with the same camera and live boundary',()=>{
  for(const mapId of Object.keys(CHASE_HAZARD_THEMES)){
    const ctx=context();
    drawChaseHazard(ctx,{
      mapId,snapshot:{enabled:true,positionMeters:100},
      pixelsPerMeter:10,viewLeft:500,viewRight:1700,
      viewTop:-100,viewBottom:700,timeMs:1500,groundAt:()=>350
    });
    assert.ok(ctx.calls.includes('save'),mapId);
    assert.ok(ctx.calls.includes('restore'),mapId);
    assert.ok(ctx.calls.includes('fill'),mapId);
    assert.ok(ctx.calls.includes('stroke'),mapId);
    // Position 100m maps to world x=1140 from the existing +140px origin.
    const edgePoints=ctx.calls.filter(c=>Array.isArray(c)&&c[0]==='lineTo');
    assert.ok(edgePoints.some(c=>c[1]>900&&c[1]<1350),mapId);
  }
});
test('batch-two hazards draw distinct molten glob, ghost and fish silhouettes',()=>{
  const counts={};
  for(const mapId of ['volcano','haunted','underwater']){
    const ctx=context();
    drawChaseHazard(ctx,{
      mapId,snapshot:{enabled:true,positionMeters:100},
      viewLeft:500,viewRight:1700,viewTop:-100,viewBottom:700,
      timeMs:1500,pixelsPerMeter:10
    });
    counts[mapId]={
      arcs:ctx.calls.filter(c=>c==='arc').length,
      ellipses:ctx.calls.filter(c=>c==='ellipse').length
    };
  }
  assert.ok(counts.volcano.arcs>20,'lava uses glowing blob circles');
  assert.ok(counts.haunted.ellipses>20,'ghosts have visible eyes and mouths');
  assert.ok(counts.underwater.ellipses>20,'piranhas have fish bodies and bellies');
  assert.ok(counts.underwater.arcs>20,'piranhas have visible eyes');
});

test('batch-three hazards reuse lava rendering and animate grounded animal/people sprites',()=>{
  const volcano=context(),mars=context();
  const options={
    snapshot:{enabled:true,positionMeters:100},
    viewLeft:500,viewRight:1700,viewTop:-100,viewBottom:700,
    timeMs:1500,pixelsPerMeter:10,groundAt:()=>350
  };
  drawChaseHazard(volcano,{...options,mapId:'volcano'});
  drawChaseHazard(mars,{...options,mapId:'mars'});
  assert.equal(volcano.calls.filter(c=>c==='arc').length,
    mars.calls.filter(c=>c==='arc').length,'Mars reuses the lava-glob drawing path');

  for(const id of ['countryside','rooftops']){
    const ctx=context(),samples=[];
    drawChaseHazard(ctx,{...options,mapId:id,groundAt:x=>{
      samples.push(x);return 350;
    }});
    assert.ok(samples.length>10,id+' queries the local surface');
    assert.ok(ctx.calls.filter(c=>Array.isArray(c)&&c[0]==='translate').length>10,
      id+' renders a herd/crowd of grounded characters');
    assert.ok(ctx.calls.filter(c=>c==='scale').length>10,id+' scales the character sprites');
    assert.ok(ctx.calls.filter(c=>c==='arc').length>30,id+' draws animated faces');
    assert.ok(ctx.calls.includes('restore'),id+' restores canvas state');
  }
  const gap=context();
  drawChaseHazard(gap,{...options,mapId:'rooftops',groundAt:()=>3000});
  assert.equal(gap.calls.filter(c=>c==='scale').length,0,
    'grandmothers never hover over rooftop gaps');
});

test('batch-four semi rides the road, spiders crawl on cave floor, and UFOs scan from above',()=>{
  const opts={
    snapshot:{enabled:true,positionMeters:100},viewLeft:500,viewRight:1700,
    viewTop:-100,viewBottom:700,pixelsPerMeter:10,timeMs:1500,groundAt:()=>400
  };
  const road=context();
  drawChaseHazard(road,{...opts,mapId:'highway'});
  assert.ok(road.calls.some(c=>Array.isArray(c)&&c[0]==='fillRect'),'semi cab and trailer are visible');
  assert.ok(road.calls.some(c=>Array.isArray(c)&&c[0]==='translate'),'semi is anchored at ground level');
  const cave=context();
  drawChaseHazard(cave,{...opts,mapId:'cave'});
  assert.ok(cave.calls.filter(c=>Array.isArray(c)&&c[0]==='fillRect').length>25,'angular spider bodies render');
  assert.ok(cave.calls.filter(c=>Array.isArray(c)&&c[0]==='translate').length>15,'spider swarm crawls on ground');
  const moon=context();
  drawChaseHazard(moon,{...opts,mapId:'moon'});
  assert.ok(moon.calls.filter(c=>c==='ellipse').length>20,'UFO discs and lights render');
  assert.ok(moon.calls.filter(c=>Array.isArray(c)&&c[0]==='translate').length>3,'UFO formation is airborne');
  const off=context();
  drawChaseHazard(off,{...opts,mapId:'highway',snapshot:{enabled:false,positionMeters:100}});
  assert.equal(off.calls.length,0,'classic multiplayer does not render a semi');
});

test('batch-five aliens, tumbling pipes and mud have unique animated drawing paths',()=>{
  const options={
    snapshot:{enabled:true,positionMeters:100},viewLeft:500,viewRight:1700,
    viewTop:-100,viewBottom:700,pixelsPerMeter:10,timeMs:1500,groundAt:()=>350
  };
  const alien=context();
  drawChaseHazard(alien,{...options,mapId:'alien'});
  assert.ok(alien.calls.filter(c=>Array.isArray(c)&&c[0]==='translate').length>15,
    'alien mob is composed of many grounded creatures');
  assert.ok(alien.calls.filter(c=>c==='quad').length>15,'aliens have wobbly antennae');
  assert.ok(alien.calls.filter(c=>c==='arc').length>50,'aliens have large cartoon eyes');

  const pipes=context();
  drawChaseHazard(pipes,{...options,mapId:'construction'});
  assert.ok(pipes.calls.filter(c=>Array.isArray(c)&&c[0]==='rotate').length>10,
    'large pipes tumble independently');
  assert.ok(pipes.calls.filter(c=>Array.isArray(c)&&c[0]==='fillRect').length>40,
    'pipes have long steel cylinder bodies');
  assert.ok(pipes.calls.filter(c=>c==='ellipse').length>20,'pipes have visible hollow openings');

  const mud=context();
  drawChaseHazard(mud,{...options,mapId:'bootcamp'});
  assert.ok(mud.calls.filter(c=>c==='ellipse').length>30,'the mud surge has chunky globs');
  assert.ok(mud.calls.filter(c=>c==='arc').length>20,'mud droplets and blisters render');

  const gaps=context();
  drawChaseHazard(gaps,{...options,mapId:'construction',groundAt:()=>3500});
  assert.equal(gaps.calls.filter(c=>Array.isArray(c)&&c[0]==='rotate').length,0,
    'pipes do not float over construction gaps');

  const off=context();
  drawChaseHazard(off,{...options,mapId:'alien',snapshot:{enabled:false,positionMeters:100}});
  assert.equal(off.calls.length,0,'Chase OFF disables the alien mob');
});

test('hazards never draw outside Chase Mode or when fully off camera',()=>{
  const ctx=context();
  const options={mapId:'arctic',pixelsPerMeter:10,viewLeft:3000,viewRight:4500,viewTop:0,viewBottom:800,timeMs:0};
  drawChaseHazard(ctx,{...options,snapshot:{enabled:false,positionMeters:200}});
  drawChaseHazard(ctx,{...options,snapshot:{enabled:true,positionMeters:100}});
  assert.equal(ctx.calls.length,0);
});

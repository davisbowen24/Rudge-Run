import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHASE_HAZARD_THEMES,DEFAULT_CHASE_HAZARD,chaseHazardForMap,
  chaseWarningFor,drawChaseHazard
} from '../dist/chaseVisuals.js';

test('three launch maps have distinct, configurable Chase hazard types and warnings',()=>{
  assert.deepEqual(Object.keys(CHASE_HAZARD_THEMES).sort(),['arctic','desert','jungle']);
  assert.equal(chaseHazardForMap('arctic').type,'avalanche');
  assert.equal(chaseHazardForMap('desert').type,'sandstorm');
  assert.equal(chaseHazardForMap('jungle').type,'flood');
  assert.equal(chaseHazardForMap('countryside'),DEFAULT_CHASE_HAZARD);
  for(const id of ['arctic','desert','jungle']){
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
    arc(){calls.push('arc')},ellipse(){calls.push('ellipse')}};
  return ctx;
}
test('all three hazards render safely with the same camera and live boundary',()=>{
  for(const mapId of ['arctic','desert','jungle']){
    const ctx=context();
    drawChaseHazard(ctx,{
      mapId,snapshot:{enabled:true,positionMeters:100},
      pixelsPerMeter:10,viewLeft:500,viewRight:1700,
      viewTop:-100,viewBottom:700,timeMs:1500
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
test('hazards never draw outside Chase Mode or when fully off camera',()=>{
  const ctx=context();
  const options={mapId:'arctic',pixelsPerMeter:10,viewLeft:3000,viewRight:4500,viewTop:0,viewBottom:800,timeMs:0};
  drawChaseHazard(ctx,{...options,snapshot:{enabled:false,positionMeters:200}});
  drawChaseHazard(ctx,{...options,snapshot:{enabled:true,positionMeters:100}});
  assert.equal(ctx.calls.length,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {CHASE_HAZARD_THEMES, chaseHazardForMap} from '../dist/chaseVisuals.js';
import {chaseWarningVisualForMap} from '../dist/chaseWarningIcons.js';

test('all 18 maps have trusted vector icon badges with appropriate color themes',()=>{
  const mapIds=Object.keys(CHASE_HAZARD_THEMES);
  assert.equal(mapIds.length,18);
  const designs=new Set();
  const colors=new Set();
  for(const mapId of mapIds){
    const {svg,color,background,border,type}=chaseWarningVisualForMap(mapId);
    assert.equal(type,chaseHazardForMap(mapId).type,mapId);
    assert.match(svg,/^<svg [^>]*viewBox="0 0 64 64"[^>]*>/,mapId);
    assert.match(svg,/<\/svg>$/,mapId);
    assert.doesNotMatch(svg,/<(?:script|foreignObject|image|text)\b|onload=|href=/i,mapId);
    assert.match(color,/^#[\da-f]{6}$/i,mapId);
    assert.match(background,/^#[\da-f]{6}$/i,mapId);
    assert.match(border,/^#[\da-f]{6}$/i,mapId);
    assert.ok(/<(?:path|ellipse|circle|rect)\b/.test(svg),mapId);
    designs.add(svg);colors.add(color);
  }
  // Volcano and Mars intentionally share the lava silhouette, each with
  // its own map title. Every other hazard has a unique silhouette.
  assert.equal(designs.size,17);
  assert.equal(colors.size,17);
  assert.equal(chaseWarningVisualForMap('mars').svg,
    chaseWarningVisualForMap('volcano').svg);
  assert.notEqual(chaseWarningVisualForMap('mars').color,
    chaseWarningVisualForMap('volcano').color);
});

test('the rooftop granny icon has a recognizable figure and raised rolling pin',()=>{
  const icon=chaseWarningVisualForMap('rooftops');
  assert.equal(icon.type,'grandmas');
  assert.ok((icon.svg.match(/<path\b/g)||[]).length>=5);
  assert.match(icon.svg,/circle cx="23" cy="12"/);
  assert.match(icon.svg,/M45 7l9-9/);
  assert.match(icon.svg,/stroke-width="2"/);
});

test('icon fallback is safe for unconfigured map identifiers',()=>{
  const fallback=chaseWarningVisualForMap('unknown-map');
  assert.equal(fallback.type,'generic');
  assert.match(fallback.svg,/<svg/);
});

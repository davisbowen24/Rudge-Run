import test from 'node:test';
import assert from 'node:assert/strict';
import { MAP_CATALOG } from '../dist/maps.js';
import { MAP_VISUALS, MATERIALS } from '../dist/visuals.js';

test('every map has a distinct detail and atmosphere profile',()=>{
  const ids=MAP_CATALOG.map(([id])=>id);
  assert.equal(ids.length,18);

  for(const id of ids){
    const profile=MAP_VISUALS[id];
    assert.ok(profile,`missing visual profile for ${id}`);
    assert.ok(profile.detail,`${id} needs secondary world detail`);
    assert.ok(profile.atmosphere?.kind,`${id} needs atmosphere`);
    assert.ok(Number.isFinite(profile.atmosphere.density)&&profile.atmosphere.density>0&&profile.atmosphere.density<=.2,`${id} atmosphere should stay subtle`);
    assert.ok(Number.isFinite(profile.atmosphere.speed),`${id} needs atmosphere speed`);
    assert.ok(MATERIALS[profile.material],`${id} references unknown material ${profile.material}`);
  }
});

test('major map families use recognizable atmospheric identities',()=>{
  assert.equal(MAP_VISUALS.arctic.atmosphere.kind,'snow');
  assert.equal(MAP_VISUALS.desert.atmosphere.kind,'dust');
  assert.equal(MAP_VISUALS.seasons.atmosphere.kind,'seasonal');
  assert.equal(MAP_VISUALS.volcano.atmosphere.kind,'embers');
  assert.equal(MAP_VISUALS.moon.atmosphere.kind,'spaceDust');
  assert.equal(MAP_VISUALS.mars.atmosphere.kind,'dust');
  assert.equal(MAP_VISUALS.underwater.atmosphere.kind,'bubbles');
  assert.equal(MAP_VISUALS.haunted.atmosphere.kind,'fog');
  assert.equal(MAP_VISUALS.neon.atmosphere.kind,'neon');
});

test('renderer keeps atmosphere behind the playable action and secondary details sparse',async()=>{
  const [render,effects]=await Promise.all([
    import('node:fs/promises').then(({readFile})=>readFile(new URL('../dist/render.js',import.meta.url),'utf8')),
    import('node:fs/promises').then(({readFile})=>readFile(new URL('../dist/effects.js',import.meta.url),'utf8'))
  ]);

  assert.match(render,/effects\.drawAtmosphere\(state\.ctx,'back'\)/);
  assert.doesNotMatch(render,/effects\.drawAtmosphere\(state\.ctx,'front'\)/);
  assert.match(effects,/function detail\(/);
  assert.match(effects,/Math\.abs\(n\)%3===1/);
  assert.match(effects,/function drawAtmosphere\(/);
  assert.match(effects,/particles\.length>=Math\.floor\(180\*quality\)/,'existing bounded gameplay particle cap should remain in place');
});

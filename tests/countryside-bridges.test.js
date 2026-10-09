import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MAPS } from '../dist/maps.js';

test('Countryside advertises swinging wooden bridges',()=>{
  assert.match(MAPS.countryside.description,/wooden bridges/i);
  assert.match(MAPS.countryside.terrainLabel,/swinging wooden bridges/i);
});

test('Countryside reuses Jungle flexible bridge mechanics and rendering',async()=>{
  const [terrain,physics,render]=await Promise.all([
    readFile(new URL('../dist/terrain.js',import.meta.url),'utf8'),
    readFile(new URL('../dist/physics.js',import.meta.url),'utf8'),
    readFile(new URL('../dist/render.js',import.meta.url),'utf8')
  ]);

  assert.match(terrain,/id==='countryside'[\s\S]*kind='bridge'[\s\S]*width=180\+180\*g/);
  assert.match(terrain,/if\(f\.kind==='bridge'\)[\s\S]*state\.bridgeMotion\.get\(f\.key\)/);
  assert.match(physics,/\['jungle','countryside'\]\.includes\(state\.activeMap\)/);
  assert.match(physics,/MAPS\[state\.activeMap\]\.hazardSeverity/);
  assert.match(render,/state\.activeMap==='countryside'[\s\S]*drawBiomeFeatures\(left,right\)/);
  assert.match(render,/if\(f\.kind==='bridge'\)[\s\S]*const deck=\[\]/);
});

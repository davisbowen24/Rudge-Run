import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_MAP_TRAITS, MAPS, MAP_STAT_TABLE } from '../dist/maps.js';

const originalBaseRate=.51;
const originalMultipliers={
  countryside:1,
  highway:.8,
  desert:.95,
  bootcamp:1.05,
  seasons:1.05,
  construction:1.05,
  arctic:1.05,
  jungle:1.1,
  cave:.8,
  volcano:1.15,
  rooftops:1.1,
  wasteland:1.15,
  mars:1.05,
  haunted:1.1,
  moon:1.2,
  underwater:1.1,
  neon:1.3,
  alien:1.3
};

function close(actual,expected,label){
  const tolerance=1e-12*Math.max(1,Math.abs(expected));
  assert.ok(Math.abs(actual-expected)<=tolerance,`${label}: expected ${expected}, got ${actual}`);
}

test('all maps receive a 30 percent slower difficulty increase rate',()=>{
  close(BASE_MAP_TRAITS.difficultyRate,originalBaseRate*.70,'base difficulty rate');

  for(const [id,multiplier] of Object.entries(originalMultipliers)){
    const special=id==='construction'||id==='rooftops';
    const expected=originalBaseRate*multiplier*.70*(special?1.5:1);
    close(MAPS[id].difficultyRate,expected,id+' difficulty rate');
  }
});

test('Construction Site and Rooftops get a 50 percent boost after the global reduction',()=>{
  close(MAP_STAT_TABLE.construction.difficultyRate,originalMultipliers.construction*1.5,'Construction multiplier');
  close(MAP_STAT_TABLE.rooftops.difficultyRate,originalMultipliers.rooftops*1.5,'Rooftops multiplier');

  close(
    MAPS.construction.difficultyRate,
    originalBaseRate*originalMultipliers.construction*.70*1.5,
    'Construction final rate'
  );
  close(
    MAPS.rooftops.difficultyRate,
    originalBaseRate*originalMultipliers.rooftops*.70*1.5,
    'Rooftops final rate'
  );
});

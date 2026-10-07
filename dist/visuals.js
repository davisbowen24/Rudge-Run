/** Presentation-only profiles. Never used by terrain, physics or economy. */
export const MAP_VISUALS = Object.freeze({
  countryside: {material:'dirt', prop:'fence', detail:'meadow', accent:'#e1c579', atmosphere:{kind:'pollen',density:.12,color:'#f7e8ae',speed:15}},
  highway: {material:'asphalt', prop:'highway', detail:'roadside', accent:'#f6e4a1', atmosphere:{kind:'haze',density:.08,color:'#dbe7e8',speed:38}},
  desert: {material:'sand', prop:'cactus', detail:'desert', accent:'#ffdc91', atmosphere:{kind:'dust',density:.18,color:'#e9c47c',speed:44}},
  bootcamp: {material:'mud', prop:'barricade', detail:'bootcamp', accent:'#c9b979', atmosphere:{kind:'dust',density:.10,color:'#b9aa7a',speed:28}},
  seasons: {material:'dirt', prop:'grove', detail:'seasonal', accent:'#dfab64', atmosphere:{kind:'seasonal',density:.18,color:'#dfab64',speed:22}},
  construction: {material:'concrete', prop:'construction', detail:'construction', accent:'#ffbf50', atmosphere:{kind:'dust',density:.12,color:'#d0b184',speed:30}},
  arctic: {material:'ice', prop:'ice', detail:'arctic', accent:'#d2faff', atmosphere:{kind:'snow',density:.06,color:'#f3fdff',speed:32}},
  jungle: {material:'mud', prop:'jungle', detail:'jungle', accent:'#85cb78', atmosphere:{kind:'spores',density:.16,color:'#c8eda5',speed:12}},
  cave: {material:'rock', prop:'cave', detail:'cave', accent:'#87dfde', atmosphere:{kind:'motes',density:.12,color:'#b8d4d2',speed:8}},
  volcano: {material:'basalt', prop:'volcano', detail:'volcano', accent:'#ff7c3d', atmosphere:{kind:'embers',density:.06,color:'#ff9a52',speed:20}},
  rooftops: {material:'concrete', prop:'rooftop', detail:'rooftop', accent:'#e9c993', atmosphere:{kind:'wind',density:.12,color:'#d7d9df',speed:72}},
  wasteland: {material:'slime', prop:'barrels', detail:'wasteland', accent:'#b6fa5e', atmosphere:{kind:'toxic',density:.14,color:'#b7ef68',speed:13}},
  mars: {material:'mars', prop:'mars', detail:'mars', accent:'#f7b986', atmosphere:{kind:'dust',density:.14,color:'#d88d69',speed:25}},
  haunted: {material:'mud', prop:'grave', detail:'haunted', accent:'#c5a6f3', atmosphere:{kind:'fog',density:.16,color:'#cdbce0',speed:10}},
  moon: {material:'moon', prop:'moon', detail:'moon', accent:'#e3e9ee', atmosphere:{kind:'spaceDust',density:.08,color:'#dbe4eb',speed:7}},
  underwater: {material:'silt', prop:'coral', detail:'underwater', accent:'#70e7e8', atmosphere:{kind:'bubbles',density:.05,color:'#a9f3f0',speed:21}},
  neon: {material:'grid', prop:'neon', detail:'neon', accent:'#59efff', atmosphere:{kind:'neon',density:.14,color:'#75fbff',speed:31}},
  alien: {material:'crystal', prop:'crystal', detail:'alien', accent:'#d595ff', atmosphere:{kind:'alien',density:.14,color:'#d8a0ff',speed:14}}
});

export const MATERIALS = Object.freeze({
  dirt: {color:'#b79b6d', stroke:'#796044', particle:'dust', size:4},
  sand: {color:'#f2c87b', stroke:'#dcad5c', particle:'dust', size:5},
  asphalt: {color:'#9ca8ae', stroke:'#737f87', particle:'dust', size:2},
  concrete: {color:'#b1b7b6', stroke:'#778587', particle:'chip', size:2},
  steel: {color:'#ffe5a4', stroke:'#b5d2db', particle:'spark', size:2},
  ice: {color:'#dcfaff', stroke:'#c8f3ff', particle:'chip', size:3},
  snow: {color:'#f5ffff', stroke:'#dbeff2', particle:'dust', size:4},
  leaf: {color:'#dc9a40', stroke:'#bd792d', particle:'leaf', size:4},
  mud: {color:'#705039', stroke:'#382f29', particle:'chip', size:4},
  rock: {color:'#849496', stroke:'#6e858a', particle:'chip', size:2},
  basalt: {color:'#fa9460', stroke:'#a16451', particle:'ember', size:2},
  slime: {color:'#a7ea59', stroke:'#81a942', particle:'chip', size:4},
  mars: {color:'#d98c61', stroke:'#a9654f', particle:'dust', size:4},
  moon: {color:'#c3cbd2', stroke:'#7c8894', particle:'dust', size:3},
  silt: {color:'#9fe4e6', stroke:'#4a9baf', particle:'bubble', size:4},
  grid: {color:'#7bffff', stroke:'#35b9d7', particle:'spark', size:2},
  crystal: {color:'#dcb1ff', stroke:'#b981e3', particle:'spark', size:3},
  wood: {color:'#b48857', stroke:'#735435', particle:'chip', size:3}
});

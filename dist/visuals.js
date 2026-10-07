/** Presentation-only profiles. Never used by terrain, physics or economy. */
export const MAP_VISUALS = Object.freeze({
  countryside: {material:'dirt', prop:'fence', accent:'#e1c579'},
  highway: {material:'asphalt', prop:'highway', accent:'#f6e4a1'},
  desert: {material:'sand', prop:'cactus', accent:'#ffdc91'},
  bootcamp: {material:'mud', prop:'barricade', accent:'#c9b979'},
  seasons: {material:'dirt', prop:'grove', accent:'#dfab64'},
  construction: {material:'concrete', prop:'construction', accent:'#ffbf50'},
  arctic: {material:'ice', prop:'ice', accent:'#d2faff'},
  jungle: {material:'mud', prop:'jungle', accent:'#85cb78'},
  cave: {material:'rock', prop:'cave', accent:'#87dfde'},
  volcano: {material:'basalt', prop:'volcano', accent:'#ff7c3d'},
  rooftops: {material:'concrete', prop:'rooftop', accent:'#e9c993'},
  wasteland: {material:'slime', prop:'barrels', accent:'#b6fa5e'},
  mars: {material:'mars', prop:'mars', accent:'#f7b986'},
  haunted: {material:'mud', prop:'grave', accent:'#c5a6f3'},
  moon: {material:'moon', prop:'moon', accent:'#e3e9ee'},
  underwater: {material:'silt', prop:'coral', accent:'#70e7e8'},
  neon: {material:'grid', prop:'neon', accent:'#59efff'},
  alien: {material:'crystal', prop:'crystal', accent:'#d595ff'}
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

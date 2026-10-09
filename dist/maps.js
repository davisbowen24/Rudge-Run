const BASE_MAP_TRAITS=Object.freeze({
  "terrainAmplitude":1,"terrainRoughness":1,"obstacleDensity":1,"rampFrequency":1,"hazardSeverity":1,
  "gravity": 9.8,
  "grip": 1,
  "traction": 1,
  "drag": 1,
  "pitch": 1,
  "air": 1,
  "surfaceDrag": 1,
  "cost": 2000,
  "difficultyRate": 0.357,
  "difficultyDistance": 1000,
  "terrainStart": 260,
  "terrainHeight": 90,
  "introLength": 900,
  "frequencyRamp": 18000,
  "hillScale": 1,
  "hillBase": 34,
  "hillGrowth": 115,
  "hillPeriod": 360,
  "ridgeBase": 2,
  "ridgeGrowth": 38,
  "ridgePeriod": 108,
  "trenchScale": 1,
  "trenchGrowth": 140,
  "trenchPeriod": 440,
  "trenchSharpness": 8,
  "bumpScale": 1,
  "bumpGrowth": 12,
  "bumpPeriod": 38,
  "rampBase": 8,
  "rampGrowth": 110,
  "rampPeriod": 155,
  "rampSharpness": 2.6,
  "craterBase": 12,
  "craterGrowth": 65,
  "craterPeriod": 210,
  "craterSharpness": 4,
  "seasonDistance": 500,
  "seasonBlendDistance": 40,
  "seasonBumpScale": 1,
  "obstacleSpacing": 1800,
  "obstacleHeight": 1,
  "winterGrip": 0.85,
  "iceGrip": 0.16,
  "mudGrip": 0.38,
  "maxFuelSpacing": 100000,
  "signatureSpacing": 9000,
  "signatureWidth": 650,
  "signatureHeight": 65,
  "fuelSpacing": 1950,
  "fuelGrowthMeters": 1100,
  "checkpointSpacing": 1,
  "firstFuelDistance": 1500,
  "roofLength": 1150,
  "roofGap": 70,
  "roofGapGrowth": 370,
  "ceilingClearance": 260
});

const BASE_MAP_FLAGS=Object.freeze({
  "freeStarter": true,
  "seasons": false,
  "ridges": true,
  "trenches": true,
  "bumps": true,
  "sharpRamps": false,
  "craters": false,
  "starfield": false,
  "mudTexture": false,
  "rooftops": false,
  "ceiling": false
});

const MAP_DEFINITIONS={
 countryside:{
  "character": "meadow",
  "name": "Countryside",
  "description": "Rolling green hills, dependable grip, and occasional flexible wooden bridges that sway under the vehicle.",
  "multipliers": {
    "obstacleSpacing": 1,
    "obstacleHeight": 1,
    "winterGrip": 1,
    "iceGrip": 1,
    "mudGrip": 1,
    "gravity": 1,
    "grip": 1,
    "traction": 1,
    "drag": 1,
    "pitch": 1,
    "air": 1,
    "surfaceDrag": 1,
    "cost": 1,
    "difficultyRate": 1,
    "difficultyDistance": 1,
    "terrainStart": 1,
    "terrainHeight": 1,
    "introLength": 1,
    "frequencyRamp": 1,
    "hillScale": 1,
    "hillBase": 1,
    "hillGrowth": 1,
    "hillPeriod": 1,
    "ridgeBase": 1,
    "ridgeGrowth": 1,
    "ridgePeriod": 1,
    "trenchScale": 1,
    "trenchGrowth": 1,
    "trenchPeriod": 1,
    "trenchSharpness": 1,
    "bumpScale": 1,
    "bumpGrowth": 1,
    "bumpPeriod": 1,
    "rampBase": 1,
    "rampGrowth": 1,
    "rampPeriod": 1,
    "rampSharpness": 1,
    "craterBase": 1,
    "craterGrowth": 1,
    "craterPeriod": 1,
    "craterSharpness": 1,
    "seasonDistance": 1,
    "seasonBlendDistance": 1,
    "seasonBumpScale": 1,
    "fuelSpacing": 1,
    "fuelGrowthMeters": 1,
    "terrainAmplitude": 1,
    "terrainRoughness": 1,
    "checkpointSpacing": 1,
    "obstacleDensity": 1,
    "rampFrequency": 1,
    "hazardSeverity": 0.5
  },
  "flags": {
    "freeStarter": true,
    "seasons": false,
    "ridges": true,
    "trenches": true,
    "bumps": true,
    "sharpRamps": false,
    "craters": false,
    "starfield": false,
    "mudTexture": false
  },
  "visuals": {
    "sky": [
      "#559eaf",
      "#c8e5d9",
      "#ecedd4"
    ],
    "ridges": [
      "#8bb9b9",
      "#6c9e9f",
      "#4d8588"
    ],
    "soil": "#374d48",
    "edge": "#aec66e",
    "sub": "#71864d"
  },
  "gripLabel": "1.00×",
  "terrainLabel": "Classic rolling hills with swinging wooden bridges"
},
 seasons:{
  "character": "grove",
  "name": "Seasons",
  "description": "Seasons change every 500 m: patchy mud and ruts in Spring and Autumn, dry Summer roads, and occasional Winter ice patches on otherwise 85%-grip roads.",
  "multipliers": {
    "obstacleSpacing": 1,
    "obstacleHeight": 1,
    "winterGrip": 1,
    "iceGrip": 1,
    "mudGrip": 1,
    "gravity": 1,
    "grip": 1,
    "traction": 1,
    "drag": 1,
    "pitch": 1,
    "air": 1,
    "surfaceDrag": 1,
    "cost": 15,
    "difficultyRate": 1.05,
    "difficultyDistance": 1,
    "terrainStart": 1,
    "terrainHeight": 1,
    "introLength": 1,
    "frequencyRamp": 1,
    "hillScale": 1,
    "hillBase": 1,
    "hillGrowth": 1,
    "hillPeriod": 1,
    "ridgeBase": 1,
    "ridgeGrowth": 1,
    "ridgePeriod": 1,
    "trenchScale": 1,
    "trenchGrowth": 1,
    "trenchPeriod": 1,
    "trenchSharpness": 1,
    "bumpScale": 1,
    "bumpGrowth": 1,
    "bumpPeriod": 1,
    "rampBase": 1,
    "rampGrowth": 1,
    "rampPeriod": 1,
    "rampSharpness": 1,
    "craterBase": 1,
    "craterGrowth": 1,
    "craterPeriod": 1,
    "craterSharpness": 1,
    "seasonDistance": 1,
    "seasonBlendDistance": 1,
    "seasonBumpScale": 1,
    "fuelSpacing": 1,
    "fuelGrowthMeters": 1,
    "terrainAmplitude": 1.1,
    "terrainRoughness": 1.1,
    "checkpointSpacing": 1,
    "obstacleDensity": 1,
    "rampFrequency": 1,
    "hazardSeverity": 0.9
  },
  "flags": {
    "freeStarter": false,
    "seasons": true,
    "ridges": true,
    "trenches": true,
    "bumps": true,
    "sharpRamps": false,
    "craters": false,
    "starfield": false,
    "mudTexture": false
  },
  "visuals": {
    "sky": [
      "#82b8bd",
      "#d3e8c3",
      "#f0ecc4"
    ],
    "ridges": [
      "#a3c5a7",
      "#80a98b",
      "#5e8971"
    ],
    "soil": "#465546",
    "edge": "#b4cd79",
    "sub": "#7d9657"
  },
  "gripLabel": "1.00× · seasonal changes",
  "terrainLabel": "New season every 500 m"
},
 bootcamp:{
  "character": "training",
  "name": "Bootcamp",
  "description": "Steep ramps, occasional ridges, and sticky mud in low spots. Bring torque, grip, and strong suspension.",
  "multipliers": {
    "obstacleSpacing": 1,
    "obstacleHeight": 1,
    "winterGrip": 1,
    "iceGrip": 1,
    "mudGrip": 1,
    "gravity": 1,
    "grip": 0.85,
    "traction": 1,
    "drag": 1.05,
    "pitch": 1,
    "air": 1,
    "surfaceDrag": 1.05,
    "cost": 7.5,
    "difficultyRate": 1.05,
    "difficultyDistance": 1,
    "terrainStart": 1,
    "terrainHeight": 1,
    "introLength": 1,
    "frequencyRamp": 1,
    "hillScale": 0.8,
    "hillBase": 1,
    "hillGrowth": 1,
    "hillPeriod": 1,
    "ridgeBase": 1,
    "ridgeGrowth": 1,
    "ridgePeriod": 1,
    "trenchScale": 1.4,
    "trenchGrowth": 1,
    "trenchPeriod": 1,
    "trenchSharpness": 1,
    "bumpScale": 1,
    "bumpGrowth": 1,
    "bumpPeriod": 1,
    "rampBase": 1,
    "rampGrowth": 1,
    "rampPeriod": 1,
    "rampSharpness": 1,
    "craterBase": 1,
    "craterGrowth": 1,
    "craterPeriod": 1,
    "craterSharpness": 1,
    "seasonDistance": 1,
    "seasonBlendDistance": 1,
    "seasonBumpScale": 1,
    "fuelSpacing": 1,
    "fuelGrowthMeters": 1,
    "terrainAmplitude": 1.1,
    "terrainRoughness": 1.3,
    "checkpointSpacing": 0.95,
    "obstacleDensity": 1.35,
    "rampFrequency": 1.2,
    "hazardSeverity": 1
  },
  "flags": {
    "freeStarter": false,
    "seasons": false,
    "ridges": true,
    "trenches": true,
    "bumps": true,
    "sharpRamps": true,
    "craters": false,
    "starfield": false,
    "mudTexture": true
  },
  "visuals": {
    "sky": [
      "#7f8e81",
      "#bcc3a0",
      "#d5c59b"
    ],
    "ridges": [
      "#8b967b",
      "#717f65",
      "#556549"
    ],
    "soil": "#514638",
    "edge": "#8d9160",
    "sub": "#706343"
  },
  "gripLabel": "0.85×",
  "terrainLabel": "Technical climbs & drops"
},
 moon:{
  "character": "crater",
  "name": "The Moon",
  "description": "Build speed on grippy lunar flats, then carry momentum over long, low-gravity crater jumps.",
  "multipliers": {
    "obstacleSpacing": 1,
    "obstacleHeight": 1,
    "winterGrip": 1,
    "iceGrip": 1,
    "mudGrip": 1,
    "gravity": 0.17,
    "grip": 0.65,
    "traction": 1,
    "drag": 0.6,
    "pitch": 0.3,
    "air": 1,
    "surfaceDrag": 0.6,
    "cost": 375,
    "difficultyRate": 1.2,
    "difficultyDistance": 1,
    "terrainStart": 1,
    "terrainHeight": 1,
    "introLength": 1,
    "frequencyRamp": 1,
    "hillScale": 0.9,
    "hillBase": 1,
    "hillGrowth": 1,
    "hillPeriod": 1,
    "ridgeBase": 1,
    "ridgeGrowth": 1,
    "ridgePeriod": 1,
    "trenchScale": 1.35,
    "trenchGrowth": 1,
    "trenchPeriod": 1,
    "trenchSharpness": 1,
    "bumpScale": 0.4,
    "bumpGrowth": 1,
    "bumpPeriod": 1,
    "rampBase": 1,
    "rampGrowth": 1,
    "rampPeriod": 1,
    "rampSharpness": 1,
    "craterBase": 1,
    "craterGrowth": 1,
    "craterPeriod": 1,
    "craterSharpness": 1,
    "seasonDistance": 1,
    "seasonBlendDistance": 1,
    "seasonBumpScale": 1,
    "fuelSpacing": 1.1,
    "fuelGrowthMeters": 1,
    "terrainAmplitude": 1.35,
    "terrainRoughness": 1.35,
    "checkpointSpacing": 1.05,
    "obstacleDensity": 1.2,
    "rampFrequency": 1.4,
    "hazardSeverity": 1.3
  },
  "flags": {
    "freeStarter": false,
    "seasons": false,
    "ridges": false,
    "trenches": true,
    "bumps": true,
    "sharpRamps": false,
    "craters": true,
    "starfield": true,
    "mudTexture": false
  },
  "visuals": {
    "sky": [
      "#091528",
      "#172740",
      "#344158"
    ],
    "ridges": [
      "#576477",
      "#465267",
      "#343f54"
    ],
    "soil": "#676c76",
    "edge": "#c0c6d1",
    "sub": "#8b919f"
  },
  "gripLabel": "0.65×",
  "terrainLabel": "Standard air control"
},
};

Object.assign(MAP_DEFINITIONS,{
  "highway": {
    "name": "Highway",
    "description": "Long paved climbs and sweeping descents. Difficulty grows at 70% of the normal rate, but fuel and milestones are farther apart.",
    "character": "highway",
    "multipliers": {
      "cost": 1.25,
      "grip": 1.15,
      "difficultyRate": 0.8,
      "hillScale": 2.8,
      "hillPeriod": 3.2,
      "hillGrowth": 1.8,
      "signatureHeight": 0,
      "fuelSpacing": 1.25,
      "fuelGrowthMeters": 1.3,
      "maxFuelSpacing": 1.4,
      "checkpointSpacing": 1.25,
      "firstFuelDistance": 1.25,
      "gravity": 1,
      "drag": 0.95,
      "terrainAmplitude": 0.65,
      "terrainRoughness": 0.35,
      "obstacleDensity": 0.4,
      "rampFrequency": 0.45,
      "hazardSeverity": 0.4,
      "traction": 1,
      "surfaceDrag": 0.95
    },
    "flags": {
      "freeStarter": false,
      "ridges": false,
      "trenches": false,
      "bumps": false
    },
    "visuals": {
      "sky": [
        "#689dad",
        "#c5dae1",
        "#ecdec7"
      ],
      "ridges": [
        "#8eacb4",
        "#6d939f",
        "#507785"
      ],
      "soil": "#3e454d",
      "edge": "#abb6bb",
      "sub": "#606975"
    },
    "gripLabel": "1.15×",
    "terrainLabel": "Smooth endurance climbs"
  },
  "rooftops": {
    "name": "Rooftops",
    "description": "Accelerate across city roofs and launch from small ramps. Gaps widen with distance; falling between buildings ends the run. Some roofs have steep ramps to a higher deck.",
    "character": "rooftops",
    "multipliers": {
      "cost": 150,
      "grip": 1,
      "difficultyRate": 1.65,
      "signatureHeight": 0,
      "gravity": 1,
      "drag": 0.95,
      "terrainAmplitude": 1.25,
      "terrainRoughness": 0.75,
      "fuelSpacing": 1.05,
      "checkpointSpacing": 1,
      "obstacleDensity": 1.2,
      "rampFrequency": 1.5,
      "hazardSeverity": 2,
      "traction": 1,
      "surfaceDrag": 0.95
    },
    "flags": {
      "freeStarter": false,
      "rooftops": true,
      "ridges": false,
      "trenches": false,
      "bumps": false
    },
    "visuals": {
      "sky": [
        "#334768",
        "#b87a87",
        "#f4b18e"
      ],
      "ridges": [
        "#7c6b86",
        "#625d79",
        "#414b65"
      ],
      "soil": "#414c61",
      "edge": "#b9c5cd",
      "sub": "#67768a"
    },
    "gripLabel": "1.00×",
    "terrainLabel": "Jump ramps \u00b7 fatal gaps"
  },
  "mars": {
    "name": "Mars",
    "description": "Rust-red hills, rocky crater basins, and Mars gravity at 3.71 m/s\u00b2. Carry speed into long jumps and settle carefully onto the dusty slopes.",
    "character": "mars",
    "multipliers": {
      "cost": 250,
      "gravity": 0.4,
      "grip": 0.8,
      "traction": 1,
      "drag": 0.8,
      "pitch": 0.65,
      "bumpScale": 0.6,
      "craterBase": 0.6,
      "craterGrowth": 0.65,
      "hillPeriod": 1.15,
      "difficultyRate": 1.05,
      "terrainAmplitude": 1.3,
      "terrainRoughness": 1.3,
      "fuelSpacing": 1.1,
      "checkpointSpacing": 1.05,
      "obstacleDensity": 1.1,
      "rampFrequency": 1.3,
      "hazardSeverity": 1.2,
      "surfaceDrag": 0.8
    },
    "flags": {
      "freeStarter": false,
      "craters": true
    },
    "visuals": {
      "sky": [
        "#5a2930",
        "#bd6545",
        "#e7a16c"
      ],
      "ridges": [
        "#b57255",
        "#965039",
        "#723a31"
      ],
      "soil": "#843e2c",
      "edge": "#d99258",
      "sub": "#ac613b"
    },
    "gripLabel": "0.80×",
    "terrainLabel": "Mars gravity \u00b7 crater hills"
  },
  "cave": {
    "name": "Cave",
    "description": "A winding underground trail beneath a solid rock ceiling. Progression is 20% slower; keep jumps low and protect your head through tight passages.",
    "character": "cave",
    "multipliers": {
      "cost": 80,
      "difficultyRate": 0.8,
      "grip": 0.95,
      "bumpScale": 0.65,
      "signatureHeight": 0.6,
      "gravity": 1,
      "drag": 1,
      "terrainAmplitude": 1.2,
      "terrainRoughness": 1.2,
      "fuelSpacing": 1,
      "checkpointSpacing": 1,
      "obstacleDensity": 1.2,
      "rampFrequency": 0.95,
      "hazardSeverity": 1.4,
      "traction": 1,
      "surfaceDrag": 1
    },
    "flags": {
      "freeStarter": false,
      "ceiling": true
    },
    "visuals": {
      "sky": [
        "#101d2c",
        "#243343",
        "#3b4850"
      ],
      "ridges": [
        "#364350",
        "#293640",
        "#1d2b35"
      ],
      "soil": "#3b4448",
      "edge": "#8faaa3",
      "sub": "#616d6e"
    },
    "gripLabel": "0.95×",
    "terrainLabel": "Overhead collision \u00b7 tight tunnels"
  }
});

Object.assign(MAP_DEFINITIONS,{
  "desert": {
    "name": "Desert Dunes",
    "character": "desert",
    "description": "Sweeping dunes and steep sandy drops. Deep sand adds resistance on climbs; carry momentum into jumps.",
    "multipliers": {
      "cost": 3.75,
      "grip": 0.8,
      "signatureHeight": 0,
      "hillPeriod": 1.8,
      "hillScale": 1.7,
      "ridgeGrowth": 0.35,
      "trenchScale": 1.3,
      "trenchPeriod": 1.8,
      "bumpScale": 0.2,
      "gravity": 1,
      "drag": 1,
      "difficultyRate": 0.95,
      "terrainAmplitude": 1.2,
      "terrainRoughness": 1.1,
      "fuelSpacing": 1.05,
      "checkpointSpacing": 1,
      "obstacleDensity": 0.7,
      "rampFrequency": 1.1,
      "hazardSeverity": 0.7,
      "traction": 1,
      "surfaceDrag": 1
    },
    "flags": {
      "freeStarter": false
    },
    "visuals": {
      "sky": [
        "#57a7c9",
        "#f5d99b",
        "#ffe8b3"
      ],
      "ridges": [
        "#e3ba6c",
        "#ce9a48",
        "#b77b34"
      ],
      "soil": "#c79347",
      "edge": "#ffe093",
      "sub": "#eab660"
    },
    "gripLabel": "0.80×",
    "terrainLabel": "Sweeping dunes and steep sandy drops"
  },
  "arctic": {
    "name": "Arctic Glacier",
    "character": "arctic",
    "description": "Slick ice and widening crevasses. Build speed on the flats, then leap the blue chasms.",
    "multipliers": {
      "cost": 37.5,
      "grip": 0.55,
      "signatureHeight": 0,
      "hillPeriod": 1.45,
      "hillScale": 0.85,
      "bumpScale": 0.35,
      "ridgeGrowth": 0.6,
      "difficultyRate": 1.05,
      "gravity": 1,
      "drag": 0.95,
      "terrainAmplitude": 1.15,
      "terrainRoughness": 1.05,
      "fuelSpacing": 1.05,
      "checkpointSpacing": 1,
      "obstacleDensity": 0.9,
      "rampFrequency": 1.1,
      "hazardSeverity": 1.2,
      "traction": 1,
      "surfaceDrag": 0.95
    },
    "flags": {
      "freeStarter": false
    },
    "visuals": {
      "sky": [
        "#548db9",
        "#b7def0",
        "#effbff"
      ],
      "ridges": [
        "#dbf2ff",
        "#99cadd",
        "#6a9cbf"
      ],
      "soil": "#448aac",
      "edge": "#d9f9ff",
      "sub": "#8cdbec"
    },
    "gripLabel": "0.55×",
    "terrainLabel": "Slick ice and widening crevasses"
  },
  "volcano": {
    "name": "Volcano Ridge",
    "character": "volcano",
    "description": "Jagged high-grip basalt climbs above lava. Pulsing thermal vents boost airborne vehicles near crater jumps.",
    "multipliers": {
      "cost": 110,
      "grip": 0.9,
      "signatureHeight": 0,
      "hillScale": 1.3,
      "ridgeGrowth": 1.5,
      "trenchScale": 1.4,
      "rampGrowth": 1.2,
      "bumpScale": 1.1,
      "gravity": 1,
      "drag": 1.05,
      "difficultyRate": 1.15,
      "terrainAmplitude": 1.45,
      "terrainRoughness": 1.35,
      "fuelSpacing": 1,
      "checkpointSpacing": 1,
      "obstacleDensity": 1.35,
      "rampFrequency": 1.2,
      "hazardSeverity": 1.7,
      "traction": 1,
      "surfaceDrag": 1.05
    },
    "flags": {
      "freeStarter": false,
      "sharpRamps": true,
      "craters": true
    },
    "visuals": {
      "sky": [
        "#291f31",
        "#674049",
        "#b6694d"
      ],
      "ridges": [
        "#70454d",
        "#513740",
        "#302934"
      ],
      "soil": "#302e37",
      "edge": "#ae6251",
      "sub": "#51404a"
    },
    "gripLabel": "0.90×",
    "terrainLabel": "Jagged high-grip basalt climbs above lava"
  },
  "jungle": {
    "name": "Deep Jungle",
    "character": "deep",
    "description": "Muddy valleys and flexible wooden bridges across rivers. Keep momentum in bogs and expect the bridges to bounce.",
    "multipliers": {
      "cost": 55,
      "grip": 0.8,
      "signatureHeight": 0,
      "hillPeriod": 1.25,
      "hillScale": 1.1,
      "bumpScale": 0.65,
      "gravity": 1,
      "drag": 1.2,
      "difficultyRate": 1.1,
      "terrainAmplitude": 1.25,
      "terrainRoughness": 1.4,
      "fuelSpacing": 1,
      "checkpointSpacing": 1,
      "obstacleDensity": 1.45,
      "rampFrequency": 1.15,
      "hazardSeverity": 1.2,
      "traction": 1,
      "surfaceDrag": 1.2
    },
    "flags": {
      "freeStarter": false
    },
    "visuals": {
      "sky": [
        "#164d4d",
        "#65a287",
        "#c0d298"
      ],
      "ridges": [
        "#417c68",
        "#2a614f",
        "#194838"
      ],
      "soil": "#4b4930",
      "edge": "#96b963",
      "sub": "#707447"
    },
    "gripLabel": "0.80×",
    "terrainLabel": "Muddy valleys and flexible wooden bridges across rivers"
  },
  "wasteland": {
    "name": "Toxic Wasteland",
    "character": "toxic",
    "description": "Rusted pipe ramps and glowing slime springs. Hit a green pad to launch into the lower-gravity sky.",
    "multipliers": {
      "cost": 200,
      "grip": 0.8,
      "signatureHeight": 0,
      "gravity": 1,
      "hillScale": 0.9,
      "ridgeGrowth": 1.35,
      "bumpScale": 0.5,
      "drag": 1.1,
      "difficultyRate": 1.15,
      "terrainAmplitude": 1.2,
      "terrainRoughness": 1.3,
      "fuelSpacing": 1.05,
      "checkpointSpacing": 1.05,
      "obstacleDensity": 1.4,
      "rampFrequency": 1.1,
      "hazardSeverity": 1.7,
      "traction": 1,
      "surfaceDrag": 1.1
    },
    "flags": {
      "freeStarter": false,
      "sharpRamps": true
    },
    "visuals": {
      "sky": [
        "#171e31",
        "#58664d",
        "#b6c46c"
      ],
      "ridges": [
        "#657252",
        "#455541",
        "#2e4037"
      ],
      "soil": "#48524b",
      "edge": "#c6b875",
      "sub": "#777b57"
    },
    "gripLabel": "0.80×",
    "terrainLabel": "Rusted pipe ramps and glowing slime springs"
  }
});

Object.assign(MAP_DEFINITIONS,{
  "underwater": {
    "name": "Underwater Trench",
    "description": "Float over coral ridges in 4.5 m/s\u00b2 effective gravity. Water resistance slows motion; bubble plumes lift you over undersea ramps.",
    "character": "underwater",
    "multipliers": {
      "cost": 425,
      "signatureHeight": 0,
      "gravity": 0.45,
      "drag": 1.7,
      "traction": 1,
      "grip": 0.8,
      "hillPeriod": 1.3,
      "hillScale": 1.2,
      "bumpScale": 0.5,
      "difficultyRate": 1.1,
      "terrainAmplitude": 1.2,
      "terrainRoughness": 1.15,
      "fuelSpacing": 1,
      "checkpointSpacing": 1,
      "obstacleDensity": 1.2,
      "rampFrequency": 0.9,
      "hazardSeverity": 1.5,
      "surfaceDrag": 1.7
    },
    "flags": {
      "freeStarter": false
    },
    "visuals": {
      "sky": [
        "#081831",
        "#103e66",
        "#126675"
      ],
      "ridges": [
        "#1a4c67",
        "#164259",
        "#102e4e"
      ],
      "soil": "#24495a",
      "edge": "#70c9c1",
      "sub": "#3b8494"
    },
    "gripLabel": "0.80×",
    "terrainLabel": "Float over coral ridges in 4"
  },
  "construction": {
    "name": "Construction Site",
    "description": "High-grip steel ramps alternate with loose dirt and harsh concrete drops. Bring strong suspension for the landings.",
    "character": "construction",
    "multipliers": {
      "cost": 25,
      "signatureHeight": 0,
      "grip": 1,
      "hillScale": 0.8,
      "bumpScale": 0.7,
      "rampGrowth": 1.2,
      "gravity": 1,
      "drag": 1,
      "difficultyRate": 1.575,
      "terrainAmplitude": 1.2,
      "terrainRoughness": 1.25,
      "fuelSpacing": 1,
      "checkpointSpacing": 1,
      "obstacleDensity": 1.5,
      "rampFrequency": 1.35,
      "hazardSeverity": 1.1,
      "traction": 1,
      "surfaceDrag": 1
    },
    "flags": {
      "freeStarter": false,
      "sharpRamps": true
    },
    "visuals": {
      "sky": [
        "#678da1",
        "#c5c4b0",
        "#e4bd89"
      ],
      "ridges": [
        "#9d9e93",
        "#7c8988",
        "#5b6f78"
      ],
      "soil": "#726550",
      "edge": "#d0a46f",
      "sub": "#988566"
    },
    "gripLabel": "Steel 1.50× / dirt 0.75×",
    "terrainLabel": "High-grip steel ramps alternate with loose dirt and harsh concrete drops"
  },
  "haunted": {
    "name": "Haunted Graveyard",
    "description": "Slick graveyard mud and wide haunted trenches. Land on the glowing spectral platforms to leap safely across.",
    "character": "haunted",
    "multipliers": {
      "cost": 312.5,
      "signatureHeight": 0,
      "grip": 0.75,
      "hillScale": 1.1,
      "bumpScale": 0.4,
      "gravity": 0.95,
      "drag": 1.05,
      "difficultyRate": 1.1,
      "terrainAmplitude": 1.15,
      "terrainRoughness": 1.2,
      "fuelSpacing": 1.05,
      "checkpointSpacing": 1,
      "obstacleDensity": 1.3,
      "rampFrequency": 1,
      "hazardSeverity": 1.5,
      "traction": 1,
      "surfaceDrag": 1.05
    },
    "flags": {
      "freeStarter": false
    },
    "visuals": {
      "sky": [
        "#1d1437",
        "#54416b",
        "#91828d"
      ],
      "ridges": [
        "#665375",
        "#473858",
        "#2b2442"
      ],
      "soil": "#3e3447",
      "edge": "#938190",
      "sub": "#62566d"
    },
    "gripLabel": "0.75×",
    "terrainLabel": "Slick graveyard mud and wide haunted trenches"
  },
  "neon": {
    "name": "Cyberpunk Neon Grid",
    "description": "Smooth synthetic hills with 1.20\u00d7 traction. Roll over neon arrows for an instant forward speed boost.",
    "character": "cyberpunk",
    "multipliers": {
      "cost": 462.5,
      "signatureHeight": 0,
      "grip": 1.2,
      "hillPeriod": 1.8,
      "hillScale": 1.35,
      "bumpScale": 0,
      "gravity": 1,
      "drag": 0.9,
      "difficultyRate": 1.3,
      "terrainAmplitude": 0.8,
      "terrainRoughness": 0.55,
      "fuelSpacing": 1.15,
      "checkpointSpacing": 1.1,
      "obstacleDensity": 1.15,
      "rampFrequency": 1.3,
      "hazardSeverity": 1.3,
      "traction": 1,
      "surfaceDrag": 0.9
    },
    "flags": {
      "freeStarter": false,
      "bumps": false,
      "ridges": false,
      "trenches": false
    },
    "visuals": {
      "sky": [
        "#170d37",
        "#5f2269",
        "#e56685"
      ],
      "ridges": [
        "#643367",
        "#45265c",
        "#252045"
      ],
      "soil": "#171a3b",
      "edge": "#48f1fa",
      "sub": "#cc62e9"
    },
    "gripLabel": "1.20×",
    "terrainLabel": "Smooth synthetic hills with 1"
  },
  "alien": {
    "name": "Alien Exoplanet",
    "description": "Low gravity pulses gently around 3.8 m/s\u00b2. Strike glowing spring crystals for high-altitude launches beneath twin moons.",
    "character": "alien",
    "multipliers": {
      "cost": 500,
      "signatureHeight": 0,
      "gravity": 0.55,
      "traction": 1,
      "grip": 0.9,
      "hillPeriod": 1.3,
      "drag": 0.85,
      "bumpScale": 0.5,
      "difficultyRate": 1.3,
      "terrainAmplitude": 1.4,
      "terrainRoughness": 1.4,
      "fuelSpacing": 1.15,
      "checkpointSpacing": 1.1,
      "obstacleDensity": 1.5,
      "rampFrequency": 1.4,
      "hazardSeverity": 1.8,
      "surfaceDrag": 0.85
    },
    "flags": {
      "freeStarter": false,
      "craters": true,
      "starfield": true
    },
    "visuals": {
      "sky": [
        "#110c29",
        "#352153",
        "#654171"
      ],
      "ridges": [
        "#674a83",
        "#493865",
        "#32284c"
      ],
      "soil": "#583969",
      "edge": "#c885dc",
      "sub": "#855897"
    },
    "gripLabel": "0.90×",
    "terrainLabel": "Low gravity pulses gently around 3"
  }
});

const MAP_CATALOG=[
 ['countryside',1],
 ['highway',1],
 ['desert',1],
 ['bootcamp',1],
 ['seasons',2],
 ['construction',2],
 ['arctic',2],
 ['jungle',2],
 ['cave',2],
 ['volcano',3],
 ['rooftops',3],
 ['wasteland',3],
 ['mars',3],
 ['haunted',3],
 ['moon',4],
 ['underwater',4],
 ['neon',4],
 ['alien',4]
].map(([id,tier])=>[
 id,
 MAP_DEFINITIONS[id].flags?.freeStarter?0:Math.round(BASE_MAP_TRAITS.cost*MAP_DEFINITIONS[id].multipliers.cost),
 tier
]);

const MAP_TIERS=['Starter & Standard Terrain','Dynamic Environments & Physical Obstacles','Environmental Hazards & Low Gravity','Wild & Sci-Fi Environments'];



// Map definitions above are the single source of gameplay tuning.
// Preserve the existing stat-table export as a computed compatibility view.
const MAP_STAT_KEYS=["gravity","grip","drag","difficultyRate","terrainAmplitude","terrainRoughness","fuelSpacing","checkpointSpacing","obstacleDensity","rampFrequency","hazardSeverity"];
const MAP_STAT_TABLE=Object.fromEntries(MAP_CATALOG.map(([id,price])=>{
 const multipliers=MAP_DEFINITIONS[id].multipliers;
 return [id,{price,...Object.fromEntries(MAP_STAT_KEYS.map(key=>[key,multipliers[key]??1]))}];
}));

// Historical checkpoint spacing used when migrating older saved progress.
// Highway's old 1.4 spacing must not be replaced by the active 1.25 value.
const PREVIOUS_CHECKPOINT_SPACING=Object.fromEntries(MAP_CATALOG.map(([id])=>[id,id==='highway'?1.4:1]));

function mapTraits(id){
  const d=MAP_DEFINITIONS[id]||MAP_DEFINITIONS.countryside,traits=Object.fromEntries(Object.entries(BASE_MAP_TRAITS).map(([key,value])=>[key,value*(d.multipliers[key]??1)])),flags={...BASE_MAP_FLAGS,...d.flags};
  return {...traits,obstacleSpacing:traits.obstacleSpacing/traits.obstacleDensity,signatureSpacing:traits.signatureSpacing/traits.rampFrequency,...d.visuals,name:d.name,description:d.description,gripLabel:d.gripLabel,terrainLabel:d.terrainLabel,flags,character:d.character,price:flags.freeStarter?0:Math.round(traits.cost)};
}

const MAPS=Object.fromEntries(MAP_CATALOG.map(([id])=>[id,mapTraits(id)]));

MAPS.highway.description='A high-speed stunt road: recovery straights feed sweeping descents, deep valleys, giant crests and uphill launches.';

MAPS.construction.description='Connected work zones: dirt piles, concrete ramps, scaffold climbs and steel bridges. Match your momentum to each surface.';

MAPS.rooftops.description='Building-to-building jumps with planned takeoffs and wide landings. Carry speed over the gaps and level out before touchdown.';

const SEASONS=[
 {name:'Spring',grip:.95,sky:['#7fbdc0','#d8edcd','#edf1cf'],ridges:['#a0c7ad','#75aa86','#55845e'],soil:'#495541',edge:'#b8d98b',sub:'#829d58'},
 {name:'Summer',grip:1,sky:['#459eae','#bde3d1','#f0e5b1'],ridges:['#8bb8a2','#689a73','#47785d'],soil:'#545140',edge:'#b7c56b',sub:'#87934b'},
 {name:'Autumn',grip:.85,sky:['#9a9eae','#e1c6ac','#efdaa8'],ridges:['#b79c87','#a18264','#806744'],soil:'#594a3d',edge:'#d09a55',sub:'#a36d3e'},
 {name:'Winter',grip:.2,sky:['#7d9cad','#dae7ef','#f4f8f6'],ridges:['#bdcbd2','#95aebc','#6c899e'],soil:'#647580',edge:'#eff8fa',sub:'#c5dce6'}
];

const BIOMES=new Set(['desert','arctic','volcano','jungle','wasteland','underwater','construction','haunted','neon','alien']);

const LATE_BIOMES=new Set(['underwater','construction','haunted','neon','alien']);

export { BASE_MAP_TRAITS, BASE_MAP_FLAGS, MAP_DEFINITIONS, MAP_CATALOG, MAP_TIERS, MAP_STAT_TABLE, PREVIOUS_CHECKPOINT_SPACING, mapTraits, MAPS, SEASONS, BIOMES, LATE_BIOMES };

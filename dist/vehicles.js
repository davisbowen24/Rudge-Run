import { BASE_VEHICLE_TRAITS, MAX_LEVEL } from './config.js';

const VEHICLES={
 base:{
  "name": "Jeep / Base Vehicle",
  "tag": "THE ALL-ROUNDER",
  "description": "Short-travel, firm suspension and a low ride height. Launch hard for a wheelie; ease off to settle the front.",
  "color": "#ed8452",
  "visualType": "base",
  "freeStarter": true,
  "tracked": false,
  "suspensionUpgrade": "suspension",
  "tiresUpgrade": "tires",
  "rearDriveShare": 0.85,
  "multipliers": {
    "downforceAngle": 1,
    "rollingResistance": 1,
    "downforceScale": 1,
    "drivePitch": 1,
    "mass": 1,
    "inertia": 1,
    "enginePower": 1,
    "tireGrip": 1,
    "suspension": 1,
    "suspensionDamping": 1,
    "suspensionTravel": 1,
    "suspensionMin": 1,
    "fuelCapacity": 1,
    "fuelBurn": 1,
    "airTilt": 1,
    "maxRotation": 1,
    "wheelRadius": 1,
    "halfWidth": 1,
    "driveLever": 1,
    "groundDamping": 1,
    "acceleration": 1,
    "maxSpeed": 1,
    "wheelBase": 1,
    "pitchSupport": 1,
    "cost": 1,
    "upgradeCost1": 1,
    "upgradeCost2": 1,
    "upgradeCost3": 1,
    "upgradeCost4": 1,
    "upgradeCost5": 1
  },
  "geometry": {
    "wheels": [
      {
        "x": -0.5,
        "y": 9,
        "r": 1
      },
      {
        "x": 0.5,
        "y": 9,
        "r": 1
      }
    ],
    "head": {
      "x": -12,
      "y": -33
    },
    "comOffsetY": 0
  }
},
 bike:{
  "name": "Motocross Bike",
  "tag": "LIGHT & AGILE",
  "description": "Lightweight and quick. Short wheelbase and fast air rotation reward a careful throttle.",
  "color": "#edbd49",
  "visualType": "bike",
  "freeStarter": false,
  "tracked": false,
  "suspensionUpgrade": "airControl",
  "tiresUpgrade": "tires",
  "rearDriveShare": 0.85,
  "multipliers": {
    "downforceAngle": 1,
    "rollingResistance": 1,
    "downforceScale": 1,
    "drivePitch": 1,
    "mass": 0.5,
    "inertia": 0.21875,
    "enginePower": 0.5882352941176471,
    "tireGrip": 0.9545454545454545,
    "suspension": 0.5,
    "suspensionDamping": 0.5,
    "suspensionTravel": 1.1111111111111112,
    "suspensionMin": 1.3333333333333333,
    "fuelCapacity": 1,
    "fuelBurn": 1,
    "airTilt": 1.55,
    "maxRotation": 1.5,
    "wheelRadius": 1.105263157894737,
    "halfWidth": 0.6470588235294118,
    "driveLever": 1.1176470588235294,
    "groundDamping": 0.5,
    "acceleration": 0.42892416225749563,
    "maxSpeed": 1.2084372700535,
    "wheelBase": 0.8363636363636363,
    "pitchSupport": 0.65,
    "cost": 25,
    "upgradeCost1": 5,
    "upgradeCost2": 3.75,
    "upgradeCost3": 2.7777777777777777,
    "upgradeCost4": 2,
    "upgradeCost5": 1.3333333333333333
  },
  "geometry": {
    "wheels": [
      {
        "x": -0.5,
        "y": 9,
        "r": 1
      },
      {
        "x": 0.5,
        "y": 9,
        "r": 1
      }
    ],
    "head": {
      "x": 1,
      "y": -42
    },
    "comOffsetY": 6
  }
},
 tractor:{
  "name": "Tractor",
  "tag": "TORQUE OVER SPEED",
  "description": "Heavy, slow, and stubborn. Deep-grip tires and a powerful engine pull up steep grades.",
  "color": "#95b65b",
  "visualType": "tractor",
  "freeStarter": false,
  "tracked": false,
  "suspensionUpgrade": "suspension",
  "tiresUpgrade": "tires",
  "rearDriveShare": null,
  "multipliers": {
    "downforceAngle": 1,
    "rollingResistance": 1,
    "downforceScale": 1,
    "drivePitch": 1,
    "mass": 2.1666666666666665,
    "inertia": 1.3125,
    "enginePower": 1,
    "tireGrip": 1.6363636363636362,
    "suspension": 2.7777777777777777,
    "suspensionDamping": 2.3636363636363638,
    "suspensionTravel": 1,
    "suspensionMin": 1.6666666666666667,
    "fuelCapacity": 1.4285714285714286,
    "fuelBurn": 1,
    "airTilt": 0.37931034482758624,
    "maxRotation": 0.625,
    "wheelRadius": 2,
    "halfWidth": 1.1176470588235294,
    "driveLever": 0.5294117647058824,
    "groundDamping": 1.777777777777778,
    "acceleration": 2.091844125742431,
    "maxSpeed": 0.6436595897370865,
    "wheelBase": 1.0909090909090908,
    "pitchSupport": 1,
    "cost": 100,
    "upgradeCost1": 20,
    "upgradeCost2": 12.5,
    "upgradeCost3": 6.666666666666667,
    "upgradeCost4": 3.7333333333333334,
    "upgradeCost5": 2
  },
  "geometry": {
    "wheels": [
      {
        "x": -0.4895833333333333,
        "y": 9,
        "r": 1
      },
      {
        "x": 0.5104166666666666,
        "y": 26,
        "r": 0.5526315789473685
      }
    ],
    "head": {
      "x": -17,
      "y": -45
    },
    "comOffsetY": 0
  }
},
 tank:{
  "name": "Super Offroad",
  "tag": "CONTINUOUS-TRACK CRAWLER",
  "description": "A continuous powered belt bridges gaps. Upgrade Downforce to squash the tracks into the terrain for exceptional grip and acceleration.",
  "color": "#718044",
  "visualType": "tank",
  "freeStarter": false,
  "tracked": true,
  "suspensionUpgrade": "suspension",
  "tiresUpgrade": "downforce",
  "rearDriveShare": null,
  "multipliers": {
    "downforceAngle": 1,
    "rollingResistance": 1,
    "downforceScale": 0.15,
    "drivePitch": 0.7,
    "mass": 3.1666666666666665,
    "inertia": 3.59375,
    "enginePower": 1.6470588235294117,
    "tireGrip": 2,
    "suspension": 1.8148148148148149,
    "suspensionDamping": 1.1313131313131313,
    "suspensionTravel": 0.5555555555555556,
    "suspensionMin": 1,
    "fuelCapacity": 1.4285714285714286,
    "fuelBurn": 1,
    "airTilt": 0.43448275862068964,
    "maxRotation": 0.5,
    "wheelRadius": 1.263157894736842,
    "halfWidth": 1.5098039215686274,
    "driveLever": 0.17647058823529413,
    "groundDamping": 2.6666666666666665,
    "acceleration": 2.037037037037037,
    "maxSpeed": 1.2185304615453336,
    "wheelBase": 1.9318181818181819,
    "pitchSupport": 1,
    "cost": 500,
    "upgradeCost1": 50,
    "upgradeCost2": 25,
    "upgradeCost3": 12.222222222222221,
    "upgradeCost4": 6,
    "upgradeCost5": 2.6666666666666665
  },
  "geometry": {
    "wheels": [
      {
        "x": -0.5,
        "y": 3,
        "r": 0.7083333333333334
      },
      {
        "x": -0.375,
        "y": 11,
        "r": 0.7916666666666666
      },
      {
        "x": -0.25,
        "y": 15,
        "r": 0.875
      },
      {
        "x": -0.125,
        "y": 15,
        "r": 0.875
      },
      {
        "x": 0,
        "y": 15,
        "r": 0.875
      },
      {
        "x": 0.125,
        "y": 15,
        "r": 0.875
      },
      {
        "x": 0.25,
        "y": 15,
        "r": 0.875
      },
      {
        "x": 0.375,
        "y": 5,
        "r": 0.7916666666666666
      },
      {
        "x": 0.5,
        "y": -7,
        "r": 0.7083333333333334
      }
    ],
    "head": {
      "x": 35,
      "y": -58
    },
    "comOffsetY": 0
  }
},
 monster:{
  "name": "The Big Finger",
  "tag": "MONSTER TRUCK",
  "description": "Oversized tires, long-travel suspension, and serious power carry speed over rough ground.",
  "color": "#c49ae5",
  "visualType": "monster",
  "freeStarter": false,
  "tracked": false,
  "suspensionUpgrade": "suspension",
  "tiresUpgrade": "tires",
  "rearDriveShare": null,
  "multipliers": {
    "downforceAngle": 1,
    "rollingResistance": 1,
    "downforceScale": 1,
    "drivePitch": 1,
    "mass": 2.5,
    "inertia": 2.5,
    "enginePower": 3.0588235294117645,
    "tireGrip": 1.6818181818181817,
    "suspension": 1.4444444444444444,
    "suspensionDamping": 1.8181818181818181,
    "suspensionTravel": 2.111111111111111,
    "suspensionMin": 2.6666666666666665,
    "fuelCapacity": 1.4285714285714286,
    "fuelBurn": 1,
    "airTilt": .9,
    "maxRotation": 0.8125,
    "wheelRadius": 2.3157894736842106,
    "halfWidth": 1.196078431372549,
    "driveLever": 0.7058823529411765,
    "groundDamping": 1.6666666666666665,
    "acceleration": 0.4606060606060607,
    "maxSpeed": 1.3789098615149806,
    "wheelBase": 1.4318181818181819,
    "pitchSupport": 1,
    "cost": 500,
    "upgradeCost1": 100,
    "upgradeCost2": 45,
    "upgradeCost3": 17.77777777777778,
    "upgradeCost4": 7.466666666666667,
    "upgradeCost5": 3.3333333333333335
  },
  "geometry": {
    "wheels": [
      {
        "x": -0.5,
        "y": 12,
        "r": 1
      },
      {
        "x": 0.5,
        "y": 12,
        "r": 1
      }
    ],
    "head": {
      "x": -13,
      "y": -43
    },
    "comOffsetY": 15
  }
},
};

Object.assign(VEHICLES,{
  "buggy": {
    "name": "Dune Buggy",
    "tag": "SAND RUNNER",
    "description": "Lightweight tube frame, oversized rear tires, agile flips, and strong climbing traction.",
    "color": "#f3aa36",
    "visualType": "buggy",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": 0.8,
    "multipliers": {
      "mass": 0.75,
      "maxSpeed": 1.35,
      "wheelSpeedLimit": 1.35,
      "airTilt": 1.4,
      "enginePower": 1.25,
      "motorTorque": 1.25,
      "tireGrip": 1.3,
      "inertia": 1.05,
      "wheelBase": 1.2727272727272727,
      "halfWidth": 1.2745098039215685,
      "suspension": 1.2,
      "suspensionDamping": 1.2,
      "suspensionTravel": 1.2222222222222223,
      "suspensionMin": 1.1666666666666667,
      "pitchSupport": 1.0,
      "cost": 100.0,
      "drivePitch": 1,
      "fuelCapacity": 1,
      "upgradeCost1": 15.0,
      "upgradeCost2": 11.25,
      "upgradeCost3": 6.666666666666667,
      "upgradeCost4": 3.7333333333333334,
      "upgradeCost5": 2.0
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 9,
          "r": 1.4736842105263157
        },
        {
          "x": 0.5,
          "y": 16,
          "r": 1.105263157894737
        }
      ],
      "head": {
        "x": -12,
        "y": -39
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -65,
          10
        ],
        [
          -65,
          -12
        ],
        [
          -25,
          -28
        ],
        [
          20,
          -28
        ],
        [
          65,
          -5
        ],
        [
          65,
          12
        ]
      ]
    }
  },
  "bus": {
    "name": "Tourist Bus",
    "tag": "MOMENTUM MACHINE",
    "description": "Long and heavy. Carry momentum up hills, watch the tall cabin, and plan slow aerial corrections.",
    "color": "#edc65d",
    "visualType": "bus",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": 0.6,
    "multipliers": {
      "mass": 2.8,
      "maxSpeed": 1.1,
      "wheelSpeedLimit": 1.1,
      "airTilt": 0.35,
      "enginePower": 1.6,
      "motorTorque": 1.6,
      "tireGrip": 0.9,
      "inertia": 7.0,
      "wheelBase": 2.1136363636363638,
      "halfWidth": 2.196078431372549,
      "suspension": 3.1,
      "suspensionDamping": 2.7,
      "suspensionTravel": 0.8888888888888888,
      "suspensionMin": 1.1666666666666667,
      "pitchSupport": 0.6,
      "cost": 180.0,
      "drivePitch": 1,
      "fuelCapacity": 1.5,
      "upgradeCost1": 30.0,
      "upgradeCost2": 18.75,
      "upgradeCost3": 10.0,
      "upgradeCost4": 5.333333333333333,
      "upgradeCost5": 2.5
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 9,
          "r": 1.263157894736842
        },
        {
          "x": 0.5,
          "y": 9,
          "r": 1.263157894736842
        }
      ],
      "head": {
        "x": 77,
        "y": -58
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -110,
          10
        ],
        [
          -110,
          -60
        ],
        [
          98,
          -60
        ],
        [
          112,
          -38
        ],
        [
          112,
          12
        ]
      ]
    }
  },
  "battletank": {
    "name": "Tank",
    "tag": "ARMORED CLIMBER",
    "description": "Heavy continuous tracks deliver immense torque and grip. Crawl up extreme slopes with a low, planted hull.",
    "color": "#91a06b",
    "visualType": "battletank",
    "freeStarter": false,
    "tracked": true,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": null,
    "multipliers": {
      "mass": 3.2,
      "maxSpeed": 0.85,
      "wheelSpeedLimit": 0.85,
      "airTilt": 0.25,
      "enginePower": 2.4,
      "motorTorque": 2.4,
      "tireGrip": 2.5,
      "inertia": 4.3,
      "wheelBase": 1.8636363636363635,
      "halfWidth": 1.7843137254901962,
      "suspension": 1.6,
      "suspensionDamping": 1.2,
      "suspensionTravel": 0.6666666666666666,
      "suspensionMin": 1.1666666666666667,
      "pitchSupport": 1.25,
      "cost": 300.0,
      "drivePitch": 1,
      "fuelCapacity": 1.5,
      "upgradeCost1": 45.0,
      "upgradeCost2": 27.5,
      "upgradeCost3": 13.88888888888889,
      "upgradeCost4": 6.666666666666667,
      "upgradeCost5": 3.0
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 9,
          "r": 1.0
        },
        {
          "x": -0.375,
          "y": 9,
          "r": 1.0
        },
        {
          "x": -0.25,
          "y": 9,
          "r": 1.0
        },
        {
          "x": -0.125,
          "y": 9,
          "r": 1.0
        },
        {
          "x": 0,
          "y": 9,
          "r": 1.0
        },
        {
          "x": 0.125,
          "y": 9,
          "r": 1.0
        },
        {
          "x": 0.25,
          "y": 9,
          "r": 1.0
        },
        {
          "x": 0.375,
          "y": 9,
          "r": 1.0
        },
        {
          "x": 0.5,
          "y": 9,
          "r": 1.0
        }
      ],
      "head": {
        "x": -8,
        "y": -49
      },
      "comOffsetY": 4,
      "pickupPolygon": [
        [
          -90,
          9
        ],
        [
          -88,
          -22
        ],
        [
          -45,
          -32
        ],
        [
          50,
          -32
        ],
        [
          91,
          -13
        ],
        [
          90,
          12
        ]
      ]
    }
  },
  "dragster": {
    "name": "Dragster",
    "tag": "STRAIGHT-LINE ROCKET",
    "description": "Huge rear slicks, a long narrow nose, and enormous torque. Hard acceleration lifts the front: feather the throttle to land it.",
    "color": "#dd526a",
    "visualType": "dragster",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": 0.95,
    "multipliers": {
      "mass": 0.85,
      "maxSpeed": 1.85,
      "wheelSpeedLimit": 1.85,
      "airTilt": 0.7,
      "enginePower": 2.1,
      "motorTorque": 2.1,
      "tireGrip": 1.15,
      "inertia": 1.7,
      "wheelBase": 2.022727272727273,
      "halfWidth": 2.0784313725490198,
      "suspension": 1.3,
      "suspensionDamping": 1.3,
      "suspensionTravel": 0.8333333333333334,
      "suspensionMin": 1.1666666666666667,
      "pitchSupport": 0.6,
      "cost": 500.0,
      "drivePitch": 1.75,
      "fuelCapacity": 1,
      "upgradeCost1": 80.0,
      "upgradeCost2": 45.0,
      "upgradeCost3": 20.0,
      "upgradeCost4": 8.666666666666666,
      "upgradeCost5": 3.6666666666666665
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 9,
          "r": 1.736842105263158
        },
        {
          "x": 0.5,
          "y": 28,
          "r": 0.7368421052631579
        }
      ],
      "head": {
        "x": -47,
        "y": -37
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -106,
          10
        ],
        [
          -99,
          -18
        ],
        [
          -43,
          -21
        ],
        [
          104,
          0
        ],
        [
          104,
          10
        ]
      ]
    }
  },
  "atv": {
    "name": "Quad Bike (ATV)",
    "tag": "FLIP SPECIALIST",
    "description": "Ultra-light single-rider quad with quick aerial response. Compact proportions reward precise landings and multi-flips.",
    "color": "#4ad0ba",
    "visualType": "atv",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": 0.55,
    "multipliers": {
      "mass": 0.6,
      "maxSpeed": 1.2,
      "wheelSpeedLimit": 1.2,
      "airTilt": 1.65,
      "enginePower": 1.15,
      "motorTorque": 1.15,
      "tireGrip": 1.2,
      "inertia": 0.52,
      "wheelBase": 0.8863636363636364,
      "halfWidth": 0.9607843137254902,
      "suspension": 1,
      "suspensionDamping": 1,
      "suspensionTravel": 1.1111111111111112,
      "suspensionMin": 1.1666666666666667,
      "pitchSupport": 0.9,
      "cost": 750.0,
      "drivePitch": 1,
      "fuelCapacity": 1,
      "upgradeCost1": 100.0,
      "upgradeCost2": 55.0,
      "upgradeCost3": 23.333333333333332,
      "upgradeCost4": 10.0,
      "upgradeCost5": 4.166666666666667
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 9,
          "r": 1.263157894736842
        },
        {
          "x": 0.5,
          "y": 9,
          "r": 1.263157894736842
        }
      ],
      "head": {
        "x": -6,
        "y": -48
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -49,
          10
        ],
        [
          -49,
          -12
        ],
        [
          -25,
          -28
        ],
        [
          20,
          -28
        ],
        [
          49,
          -5
        ],
        [
          49,
          12
        ]
      ]
    }
  }
});

Object.assign(VEHICLES,{
  "supercar": {
    "name": "Supercar",
    "tag": "PAVED-ROAD PRECISION",
    "description": "Low aerodynamic body, responsive control, and high speed on smooth roads.",
    "color": "#52aee6",
    "visualType": "supercar",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": null,
    "multipliers": {
      "mass": 0.9,
      "maxSpeed": 1.6,
      "wheelSpeedLimit": 1.6,
      "airTilt": 1.1,
      "enginePower": 1.7,
      "motorTorque": 1.7,
      "tireGrip": 1.25,
      "inertia": 1.1,
      "wheelBase": 1.3636363636363635,
      "halfWidth": 1.411764705882353,
      "suspension": 1.1,
      "suspensionDamping": 1.2,
      "suspensionTravel": 0.7222222222222222,
      "suspensionMin": 1.1666666666666667,
      "pitchSupport": 1,
      "cost": 1000.0,
      "drivePitch": 1,
      "fuelCapacity": 1.2,
      "upgradeCost1": 150.0,
      "upgradeCost2": 75.0,
      "upgradeCost3": 30.555555555555557,
      "upgradeCost4": 12.666666666666666,
      "upgradeCost5": 5.0
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 7,
          "r": 1.0
        },
        {
          "x": 0.5,
          "y": 7,
          "r": 1.0
        }
      ],
      "head": {
        "x": -12,
        "y": -27
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -72,
          10
        ],
        [
          -72,
          -12
        ],
        [
          -36.0,
          -30
        ],
        [
          43.199999999999996,
          -30
        ],
        [
          72,
          -8
        ],
        [
          72,
          12
        ]
      ]
    }
  },
  "firetruck": {
    "name": "Fire Truck",
    "tag": "HEAVY RESCUE",
    "description": "Long heavy rescue truck with strong torque and momentum. Its tall cab requires careful landings.",
    "color": "#e55743",
    "visualType": "firetruck",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": null,
    "multipliers": {
      "mass": 2.5,
      "maxSpeed": 1.05,
      "wheelSpeedLimit": 1.05,
      "airTilt": 0.4,
      "enginePower": 2.2,
      "motorTorque": 2.2,
      "tireGrip": 1.1,
      "inertia": 5.8,
      "wheelBase": 2.159090909090909,
      "halfWidth": 2.196078431372549,
      "suspension": 1.7,
      "suspensionDamping": 1.8,
      "suspensionTravel": 0.9444444444444444,
      "suspensionMin": 1.1666666666666667,
      "pitchSupport": 1,
      "cost": 1500.0,
      "drivePitch": 1,
      "fuelCapacity": 1.6,
      "upgradeCost1": 200.0,
      "upgradeCost2": 100.0,
      "upgradeCost3": 41.666666666666664,
      "upgradeCost4": 16.666666666666668,
      "upgradeCost5": 6.666666666666667
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 7,
          "r": 1.3157894736842106
        },
        {
          "x": -0.25,
          "y": 7,
          "r": 1.3157894736842106
        },
        {
          "x": 0.5,
          "y": 7,
          "r": 1.3157894736842106
        }
      ],
      "head": {
        "x": 75,
        "y": -49
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -112,
          10
        ],
        [
          -112,
          -12
        ],
        [
          -56.0,
          -55
        ],
        [
          67.2,
          -55
        ],
        [
          112,
          -8
        ],
        [
          112,
          12
        ]
      ]
    }
  },
  "snowmobile": {
    "name": "Snowmobile",
    "tag": "WINTER FLIP MACHINE",
    "description": "Light rear-track machine with a front ski. Quick flips and extra bite on winter snow; slippery on dry ground.",
    "color": "#dcdfe5",
    "visualType": "snowmobile",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": 1,
    "multipliers": {
      "mass": 0.65,
      "maxSpeed": 1.45,
      "wheelSpeedLimit": 1.45,
      "airTilt": 1.5,
      "enginePower": 1.3,
      "motorTorque": 1.3,
      "tireGrip": 0.85,
      "inertia": 0.65,
      "wheelBase": 1.1363636363636365,
      "halfWidth": 1.2745098039215685,
      "suspension": 1,
      "suspensionDamping": 1.15,
      "suspensionTravel": 1.0,
      "suspensionMin": 1.1666666666666667,
      "pitchSupport": 1,
      "cost": 2250.0,
      "drivePitch": 1,
      "fuelCapacity": 1.2,
      "upgradeCost1": 250.0,
      "upgradeCost2": 137.5,
      "upgradeCost3": 55.55555555555556,
      "upgradeCost4": 22.0,
      "upgradeCost5": 8.333333333333334
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 7,
          "r": 1.263157894736842
        },
        {
          "x": 0.5,
          "y": 19,
          "r": 0.631578947368421
        }
      ],
      "head": {
        "x": -4,
        "y": -43
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -65,
          10
        ],
        [
          -65,
          -12
        ],
        [
          -32.5,
          -30
        ],
        [
          39.0,
          -30
        ],
        [
          65,
          -8
        ],
        [
          65,
          12
        ]
      ]
    }
  },
  "hotrod": {
    "name": "Hot Rod",
    "tag": "WHEELIE KING",
    "description": "Huge rear tires, exposed engine, and fierce launch torque. Heavy throttle brings the nose up immediately.",
    "color": "#b983e5",
    "visualType": "hotrod",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": 0.9,
    "multipliers": {
      "mass": 1.1,
      "maxSpeed": 1.75,
      "wheelSpeedLimit": 1.75,
      "airTilt": 0.9,
      "enginePower": 2.3,
      "motorTorque": 2.3,
      "tireGrip": 1.4,
      "inertia": 1.6,
      "wheelBase": 1.4545454545454546,
      "halfWidth": 1.5098039215686274,
      "suspension": 1.35,
      "suspensionDamping": 1.3,
      "suspensionTravel": 0.8888888888888888,
      "suspensionMin": 1.1666666666666667,
      "pitchSupport": 0.7,
      "cost": 3500.0,
      "drivePitch": 1.65,
      "fuelCapacity": 1.2,
      "upgradeCost1": 350.0,
      "upgradeCost2": 187.5,
      "upgradeCost3": 75.0,
      "upgradeCost4": 29.333333333333332,
      "upgradeCost5": 11.666666666666666
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 7,
          "r": 1.631578947368421
        },
        {
          "x": 0.5,
          "y": 18,
          "r": 1.0526315789473684
        }
      ],
      "head": {
        "x": -24,
        "y": -41
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -77,
          10
        ],
        [
          -77,
          -12
        ],
        [
          -38.5,
          -30
        ],
        [
          46.199999999999996,
          -30
        ],
        [
          77,
          -8
        ],
        [
          77,
          12
        ]
      ]
    }
  },
  "rover": {
    "name": "Moon Rover",
    "tag": "SIX-WHEEL EXPLORER",
    "description": "Ultra-light six-wheel explorer with exceptional aerial agility. Float across gaps and correct your landing in flight.",
    "color": "#e9ddae",
    "visualType": "rover",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": null,
    "multipliers": {
      "mass": 0.5,
      "maxSpeed": 1.3,
      "wheelSpeedLimit": 1.3,
      "airTilt": 1.8,
      "enginePower": 1.5,
      "motorTorque": 1.5,
      "tireGrip": 0.7,
      "inertia": 0.7,
      "wheelBase": 1.3636363636363635,
      "halfWidth": 1.392156862745098,
      "suspension": 0.5,
      "suspensionDamping": 0.55,
      "suspensionTravel": 1.3333333333333333,
      "suspensionMin": 1.3333333333333333,
      "pitchSupport": 1,
      "cost": 5000.0,
      "drivePitch": 1,
      "fuelCapacity": 1.2,
      "upgradeCost1": 500.0,
      "upgradeCost2": 250.0,
      "upgradeCost3": 100.0,
      "upgradeCost4": 40.0,
      "upgradeCost5": 16.666666666666668
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 7,
          "r": 0.9473684210526315
        },
        {
          "x": -0.3,
          "y": 7,
          "r": 0.9473684210526315
        },
        {
          "x": -0.1,
          "y": 7,
          "r": 0.9473684210526315
        },
        {
          "x": 0.1,
          "y": 7,
          "r": 0.9473684210526315
        },
        {
          "x": 0.3,
          "y": 7,
          "r": 0.9473684210526315
        },
        {
          "x": 0.5,
          "y": 7,
          "r": 0.9473684210526315
        }
      ],
      "head": {
        "x": -8,
        "y": -39
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -71,
          10
        ],
        [
          -71,
          -12
        ],
        [
          -35.5,
          -30
        ],
        [
          42.6,
          -30
        ],
        [
          71,
          -8
        ],
        [
          71,
          12
        ]
      ]
    }
  }
});

Object.assign(VEHICLES,{
  "monowheel": {
    "name": "Monowheel",
    "tag": "A single-wheel experiment",
    "description": "A single-wheel experiment. Featherweight balance and rapid air rotation.",
    "color": "#e2ad41",
    "visualType": "monowheel",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": null,
    "multipliers": {
      "mass": 0.45,
      "maxSpeed": 1.35,
      "wheelSpeedLimit": 1.35,
      "airTilt": 2.1,
      "enginePower": 1.2,
      "motorTorque": 1.2,
      "tireGrip": 0.8,
      "inertia": 0.5,
      "wheelBase": 0.6818181818181818,
      "halfWidth": 0.47058823529411764,
      "suspension": 0.65,
      "suspensionDamping": 0.7,
      "suspensionTravel": 0.6666666666666666,
      "cost": 7500.0,
      "fuelCapacity": 1.3,
      "pitchSupport": 2.5,
      "rollingResistance": 1,
      "drivePitch": 0.8,
      "suspensionMin": 0.5,
      "upgradeCost1": 180.0,
      "upgradeCost2": 112.5,
      "upgradeCost3": 61.111111111111114,
      "upgradeCost4": 33.333333333333336,
      "upgradeCost5": 18.333333333333332
    },
    "geometry": {
      "wheels": [
        {
          "x": 0,
          "y": -18,
          "r": 2.4210526315789473
        }
      ],
      "head": {
        "x": -4,
        "y": -22
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -24,
          8
        ],
        [
          -24,
          -12
        ],
        [
          0,
          -25
        ],
        [
          24,
          -8
        ],
        [
          24,
          8
        ]
      ]
    }
  },
  "lowrider": {
    "name": "Lowrider",
    "tag": "Hydraulic cruiser",
    "description": "Hydraulic cruiser. Controlled rebound turns hard landings into small leaps.",
    "color": "#d780cf",
    "visualType": "lowrider",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": null,
    "multipliers": {
      "mass": 1.2,
      "maxSpeed": 1.5,
      "wheelSpeedLimit": 1.5,
      "airTilt": 1.15,
      "enginePower": 1.6,
      "motorTorque": 1.6,
      "tireGrip": 1.1,
      "inertia": 1.65,
      "wheelBase": 1.5,
      "halfWidth": 1.6666666666666667,
      "suspension": 1.3,
      "suspensionDamping": 1.8,
      "suspensionTravel": 1.6666666666666667,
      "cost": 12000.0,
      "fuelCapacity": 1.3,
      "pitchSupport": 1.2,
      "rollingResistance": 1,
      "drivePitch": 0.8,
      "upgradeCost1": 300.0,
      "upgradeCost2": 175.0,
      "upgradeCost3": 94.44444444444444,
      "upgradeCost4": 52.0,
      "upgradeCost5": 26.666666666666668
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 7,
          "r": 1.0526315789473684
        },
        {
          "x": 0.5,
          "y": 7,
          "r": 1.0526315789473684
        }
      ],
      "head": {
        "x": -16,
        "y": -31
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -85,
          8
        ],
        [
          -85,
          -12
        ],
        [
          0,
          -25
        ],
        [
          85,
          -8
        ],
        [
          85,
          8
        ]
      ]
    }
  },
  "steamroller": {
    "name": "Steam Roller",
    "tag": "Massive steel drum, relentless climbing torque and heavyweight momentum",
    "description": "Massive steel drum, relentless climbing torque and heavyweight momentum.",
    "color": "#efb43e",
    "visualType": "steamroller",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": null,
    "multipliers": {
      "mass": 3.8,
      "maxSpeed": 0.75,
      "wheelSpeedLimit": 0.75,
      "airTilt": 0.2,
      "enginePower": 2.8,
      "motorTorque": 2.8,
      "tireGrip": 2.2,
      "inertia": 5,
      "wheelBase": 1.4318181818181819,
      "halfWidth": 1.5098039215686274,
      "suspension": 3.8,
      "suspensionDamping": 3.9,
      "suspensionTravel": 0.7777777777777778,
      "cost": 18000.0,
      "fuelCapacity": 1.3,
      "pitchSupport": 1.2,
      "rollingResistance": 1,
      "drivePitch": 0.8,
      "upgradeCost1": 450.0,
      "upgradeCost2": 275.0,
      "upgradeCost3": 144.44444444444446,
      "upgradeCost4": 77.33333333333333,
      "upgradeCost5": 40.0
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 19,
          "r": 1.4210526315789473
        },
        {
          "x": 0.5,
          "y": 7,
          "r": 2.0526315789473686
        }
      ],
      "head": {
        "x": -29,
        "y": -48
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -77,
          8
        ],
        [
          -77,
          -12
        ],
        [
          0,
          -25
        ],
        [
          77,
          -8
        ],
        [
          77,
          8
        ]
      ]
    }
  },
  "formula": {
    "name": "Formula Racer",
    "tag": "Open-wheel speed machine",
    "description": "Open-wheel speed machine. Aerodynamic downforce builds with ground speed.",
    "color": "#fa6250",
    "visualType": "formula",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": null,
    "multipliers": {
      "mass": 0.7,
      "maxSpeed": 2.2,
      "wheelSpeedLimit": 2.2,
      "airTilt": 1.2,
      "enginePower": 2.5,
      "motorTorque": 2.5,
      "tireGrip": 1.6,
      "inertia": 1.25,
      "wheelBase": 1.6363636363636365,
      "halfWidth": 1.8431372549019607,
      "suspension": 1,
      "suspensionDamping": 1.3,
      "suspensionTravel": 0.6666666666666666,
      "cost": 25000.0,
      "fuelCapacity": 1.3,
      "pitchSupport": 1.2,
      "rollingResistance": 1,
      "drivePitch": 0.8,
      "upgradeCost1": 650.0,
      "upgradeCost2": 400.0,
      "upgradeCost3": 211.11111111111111,
      "upgradeCost4": 113.33333333333333,
      "upgradeCost5": 56.666666666666664
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 7,
          "r": 1.105263157894737
        },
        {
          "x": 0.5,
          "y": 9,
          "r": 1.0
        }
      ],
      "head": {
        "x": -18,
        "y": -29
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -94,
          8
        ],
        [
          -94,
          -12
        ],
        [
          0,
          -25
        ],
        [
          94,
          -8
        ],
        [
          94,
          8
        ]
      ]
    }
  },
  "hovercraft": {
    "name": "Hovercraft",
    "tag": "Low-friction air cushion with power-limited thrusters for effortless gliding",
    "description": "Low-friction air cushion with power-limited thrusters for effortless gliding.",
    "color": "#55d8cd",
    "visualType": "hovercraft",
    "freeStarter": false,
    "tracked": false,
    "wheelSpeedLimited": true,
    "directMotorTorque": true,
    "suspensionUpgrade": "suspension",
    "tiresUpgrade": "tires",
    "rearDriveShare": null,
    "multipliers": {
      "mass": 0.8,
      "maxSpeed": 1.9,
      "wheelSpeedLimit": 1.9,
      "airTilt": 1.75,
      "enginePower": 2,
      "motorTorque": 2,
      "tireGrip": 0.25,
      "inertia": 1.15,
      "wheelBase": 1.25,
      "halfWidth": 1.5686274509803921,
      "suspension": 0.9,
      "suspensionDamping": 1.5,
      "suspensionTravel": 1.5555555555555556,
      "cost": 35000.0,
      "fuelCapacity": 1.3,
      "pitchSupport": 1.2,
      "rollingResistance": 0.08,
      "drivePitch": 0.2,
      "upgradeCost1": 900.0,
      "upgradeCost2": 550.0,
      "upgradeCost3": 288.8888888888889,
      "upgradeCost4": 153.33333333333334,
      "upgradeCost5": 76.66666666666667
    },
    "geometry": {
      "wheels": [
        {
          "x": -0.5,
          "y": 7,
          "r": 0.6842105263157895
        },
        {
          "x": 0.5,
          "y": 7,
          "r": 0.6842105263157895
        }
      ],
      "head": {
        "x": -12,
        "y": -36
      },
      "comOffsetY": 0,
      "pickupPolygon": [
        [
          -80,
          8
        ],
        [
          -80,
          -12
        ],
        [
          0,
          -25
        ],
        [
          80,
          -8
        ],
        [
          80,
          8
        ]
      ]
    }
  }
});

const VEHICLE_CATALOG = [
 ['base',0],['bike',500],['bus',2000],['tractor',5000],['atv',10000],
 ['snowmobile',20000],['lowrider',35000],['monowheel',55000],['firetruck',80000],['steamroller',120000],
 ['rover',175000],['battletank',250000],['formula',350000],['hovercraft',450000],['supercar',550000],
 ['hotrod',675000],['dragster',775000],['tank',850000],['buggy',925000],['monster',1000000]
];

const VEHICLE_ORDER=VEHICLE_CATALOG.map(([id])=>id);

const VEHICLE_TIERS=['Starter & Early-Game','Mid-Game Specialty','Advanced Heavyweights & Gimmicks','Endgame Powerhouses'];

for(const [id,price] of VEHICLE_CATALOG){
  if(id!=='base')
  VEHICLES[id].multipliers.cost=price/BASE_VEHICLE_TRAITS.cost;
}

VEHICLES.monster.name='The Big Finger (Monster Truck)';

VEHICLES.tank.name='Super Offroader';

// AUTHORITATIVE VEHICLE PERFORMANCE TABLE.
// Jeep is the 1.0 reference. The earlier vehicle blocks define chassis geometry and special behavior;
// all performance tuning below overwrites their performance multipliers before gameplay.
// accelerationLimit is a desired-acceleration force cap (physics uses F = m*a), not measured acceleration.
// Torque, power, traction, mass, gearing, stability/damping and air control are independent tuning inputs.
// Power generally rises with vehicle price; torque follows vehicle role/mass, so heavy climbers can be torque-rich
// without also becoming the fastest vehicles.
// Base suspension travel is 20% longer; non-base travel multipliers are compensated so their absolute travel stays unchanged.
// Bike, ATV and Moon Rover use stronger air correction with lower spin caps; added inertia and lower drivePitch calm ground rotation without weakening air input.
const VEHICLE_STAT_TABLE={
  "base": {
    "price": 0,
    "mass": 1,
    "motorTorque": 1,
    "enginePower": 1,
    "accelerationLimit": 1,
    "wheelSpeedLimit": 1,
    "tireGrip": 1,
    "airControl": 1,
    "maxRotation": 1,
    "inertia": 1,
    "suspension": 1,
    "suspensionDamping": 1,
    "suspensionTravel": 1,
    "pitchSupport": 1,
    "groundDamping": 1,
    "fuelCapacity": 1,
    "fuelBurn": 1,
    "downforceScale": 0
  },
  "bike": {
    "price": 500,
    "mass": 0.4,
    "motorTorque": 1,
    "enginePower": 1.08,
    "accelerationLimit": 1.35,
    "wheelSpeedLimit": 1.1,
    "tireGrip": 1.35,
    "airControl": 2.6,
    "maxRotation": 1.8,
    "inertia": 1.4,
    "suspension": 0.85,
    "suspensionDamping": 0.9,
    "suspensionTravel": 1.2083333333333333,
    "pitchSupport": 1.15,
    "groundDamping": 1.45,
    "fuelCapacity": 0.35,
    "fuelBurn": 0.4,
    "downforceScale": 0,
    "drivePitch": 0.65
  },
  "bus": {
    "price": 2000,
    "mass": 2.8,
    "motorTorque": 1.85,
    "enginePower": 1.12,
    "accelerationLimit": 0.85,
    "wheelSpeedLimit": 1.05,
    "tireGrip": 1.15,
    "airControl": 0.42250000000000004,
    "maxRotation": 0.65,
    "inertia": 3.5,
    "suspension": 2.2,
    "suspensionDamping": 2,
    "suspensionTravel": 0.8750000000000001,
    "pitchSupport": 2.3,
    "groundDamping": 2.3,
    "fuelCapacity": 2.4,
    "fuelBurn": 1.8,
    "downforceScale": 0
  },
  "tractor": {
    "price": 5000,
    "mass": 2.17,
    "motorTorque": 3,
    "enginePower": 1.18,
    "accelerationLimit": 0.85,
    "wheelSpeedLimit": 0.9,
    "tireGrip": 2.1,
    "airControl": 0.48999999999999994,
    "maxRotation": 0.7,
    "inertia": 2,
    "suspension": 1.7,
    "suspensionDamping": 1.5,
    "suspensionTravel": 1.1250000000000002,
    "pitchSupport": 1.9,
    "groundDamping": 1.9,
    "fuelCapacity": 2,
    "fuelBurn": 1.5,
    "downforceScale": 0
  },
  "atv": {
    "price": 10000,
    "mass": 0.6,
    "motorTorque": 1.2,
    "enginePower": 1.25,
    "accelerationLimit": 1.45,
    "wheelSpeedLimit": 1.25,
    "tireGrip": 1.45,
    "airControl": 2.25,
    "maxRotation": 1.65,
    "inertia": 1.35,
    "suspension": 0.9,
    "suspensionDamping": 1,
    "suspensionTravel": 1.25,
    "pitchSupport": 1.1,
    "groundDamping": 1.4,
    "fuelCapacity": 0.85,
    "fuelBurn": 0.9,
    "downforceScale": 0,
    "drivePitch": 0.7
  },
  "snowmobile": {
    "price": 20000,
    "mass": 0.8,
    "motorTorque": 1.3,
    "enginePower": 1.35,
    "accelerationLimit": 1.4,
    "wheelSpeedLimit": 1.4,
    "tireGrip": 1.75,
    "airControl": 1.6875,
    "maxRotation": 1.35,
    "inertia": 1.05,
    "suspension": 1,
    "suspensionDamping": 1.05,
    "suspensionTravel": 1.1666666666666667,
    "pitchSupport": 1.1,
    "groundDamping": 1.1,
    "fuelCapacity": 1,
    "fuelBurn": 1.05,
    "downforceScale": 0,
    "drivePitch": 0.8
  },
  "lowrider": {
    "price": 35000,
    "mass": 1.1,
    "motorTorque": 1.4,
    "enginePower": 1.45,
    "accelerationLimit": 1.35,
    "wheelSpeedLimit": 1.45,
    "tireGrip": 1.1,
    "airControl": 1,
    "maxRotation": 1.05,
    "inertia": 1.35,
    "suspension": 1.4,
    "suspensionDamping": 1.5,
    "suspensionTravel": 0.6666666666666667,
    "pitchSupport": 1.5,
    "groundDamping": 1.5,
    "fuelCapacity": 1,
    "fuelBurn": 1.1,
    "downforceScale": 0
  },
  "monowheel": {
    "price": 55000,
    "mass": 0.3,
    "motorTorque": 0.9,
    "enginePower": 1.55,
    "accelerationLimit": 1.55,
    "wheelSpeedLimit": 1.5,
    "tireGrip": 1.05,
    "airControl": 2.0999999999999996,
    "maxRotation": 1.5,
    "inertia": 0.85,
    "suspension": 0.8,
    "suspensionDamping": 0.9,
    "suspensionTravel": 0.8333333333333334,
    "pitchSupport": 1.3,
    "groundDamping": 1.3,
    "fuelCapacity": 0.65,
    "fuelBurn": 0.65,
    "downforceScale": 0
  },
  "firetruck": {
    "price": 80000,
    "mass": 2.8,
    "motorTorque": 2.6,
    "enginePower": 1.65,
    "accelerationLimit": 0.95,
    "wheelSpeedLimit": 1.15,
    "tireGrip": 1.35,
    "airControl": 0.42250000000000004,
    "maxRotation": 0.65,
    "inertia": 4,
    "suspension": 2.3,
    "suspensionDamping": 2.2,
    "suspensionTravel": 0.8333333333333334,
    "pitchSupport": 2.5,
    "groundDamping": 2.5,
    "fuelCapacity": 2.5,
    "fuelBurn": 2.2,
    "downforceScale": 0
  },
  "steamroller": {
    "price": 120000,
    "mass": 4.5,
    "motorTorque": 3.8,
    "enginePower": 1.75,
    "accelerationLimit": 0.75,
    "wheelSpeedLimit": 0.9,
    "tireGrip": 2.2,
    "airControl": 0.2025,
    "maxRotation": 0.45,
    "inertia": 4.8,
    "suspension": 3.2,
    "suspensionDamping": 2.8,
    "suspensionTravel": 0.5416666666666667,
    "pitchSupport": 2.6,
    "groundDamping": 2.6,
    "fuelCapacity": 3,
    "fuelBurn": 2.5,
    "downforceScale": 0
  },
  "rover": {
    "price": 175000,
    "mass": 0.5,
    "motorTorque": 1.35,
    "enginePower": 1.85,
    "accelerationLimit": 1.5,
    "wheelSpeedLimit": 1.55,
    "tireGrip": 1.05,
    "airControl": 2.9,
    "maxRotation": 1,
    "inertia": 1.55,
    "suspension": 0.85,
    "suspensionDamping": 0.9,
    "suspensionTravel": 1.375,
    "pitchSupport": 1.1,
    "groundDamping": 1.45,
    "fuelCapacity": 1.2,
    "fuelBurn": 0.9,
    "downforceScale": 0,
    "drivePitch": 0.75
  },
  "battletank": {
    "price": 250000,
    "mass": 3.5,
    "motorTorque": 4,
    "enginePower": 1.95,
    "accelerationLimit": 1.1,
    "wheelSpeedLimit": 1,
    "tireGrip": 2.6,
    "airControl": 0.275,
    "maxRotation": 0.55,
    "inertia": 3.8,
    "suspension": 2.6,
    "suspensionDamping": 2.3,
    "suspensionTravel": 0.8333333333333334,
    "pitchSupport": 2.6,
    "groundDamping": 2.6,
    "fuelCapacity": 3.2,
    "fuelBurn": 2.7,
    "downforceScale": 0
  },
  "formula": {
    "price": 350000,
    "mass": 0.95,
    "motorTorque": 1.9,
    "enginePower": 2.35,
    "accelerationLimit": 2.15,
    "wheelSpeedLimit": 2.25,
    "tireGrip": 1.75,
    "airControl": 0.9,
    "maxRotation": 1,
    "inertia": 1.6,
    "suspension": 1.55,
    "suspensionDamping": 1.7,
    "suspensionTravel": 0.5833333333333334,
    "pitchSupport": 1.9,
    "groundDamping": 1.9,
    "fuelCapacity": 1.4,
    "fuelBurn": 1.6,
    "downforceScale": 0
  },
  "hovercraft": {
    "price": 450000,
    "mass": 0.8,
    "motorTorque": 1.36,
    "enginePower": 2.0825,
    "accelerationLimit": 1.7,
    "wheelSpeedLimit": 2.05,
    "tireGrip": 0.2,
    "airControl": 2.1025,
    "maxRotation": 1.35,
    "inertia": 1.25,
    "suspension": 0.55,
    "suspensionDamping": 0.85,
    "suspensionTravel": 1.25,
    "pitchSupport": 1.1,
    "groundDamping": 1.1,
    "fuelCapacity": 1.3,
    "fuelBurn": 1.4,
    "downforceScale": 0
  },
  "supercar": {
    "price": 550000,
    "mass": 1,
    "motorTorque": 2.15,
    "enginePower": 2.65,
    "accelerationLimit": 2.25,
    "wheelSpeedLimit": 2.2,
    "tireGrip": 1.4,
    "airControl": 1.1025,
    "maxRotation": 1.05,
    "inertia": 1.35,
    "suspension": 1.45,
    "suspensionDamping": 1.6,
    "suspensionTravel": 0.6666666666666667,
    "pitchSupport": 1.7,
    "groundDamping": 1.7,
    "fuelCapacity": 1.5,
    "fuelBurn": 1.5,
    "downforceScale": 0
  },
  "hotrod": {
    "price": 675000,
    "mass": 1.1,
    "motorTorque": 2.8,
    "enginePower": 2.75,
    "accelerationLimit": 2.15,
    "wheelSpeedLimit": 2.05,
    "tireGrip": 1.5,
    "airControl": 1,
    "maxRotation": 1,
    "inertia": 1.55,
    "suspension": 1.35,
    "suspensionDamping": 1.4,
    "suspensionTravel": 0.7083333333333334,
    "pitchSupport": 1.35,
    "groundDamping": 1.35,
    "fuelCapacity": 1.4,
    "fuelBurn": 1.7,
    "downforceScale": 0
  },
  "dragster": {
    "price": 775000,
    "mass": 1,
    "motorTorque": 3.3,
    "enginePower": 3,
    "accelerationLimit": 2.45,
    "wheelSpeedLimit": 2.4,
    "tireGrip": 1.6,
    "airControl": 0.68,
    "maxRotation": 0.85,
    "inertia": 2,
    "suspension": 1.7,
    "suspensionDamping": 1.55,
    "suspensionTravel": 0.5833333333333334,
    "pitchSupport": 1.9,
    "groundDamping": 1.9,
    "fuelCapacity": 1.4,
    "fuelBurn": 1.8,
    "downforceScale": 0
  },
  "tank": {
    "price": 850000,
    "mass": 3.17,
    "motorTorque": 4.2,
    "enginePower": 3.05,
    "accelerationLimit": 1.45,
    "wheelSpeedLimit": 1.8,
    "tireGrip": 2.5,
    "airControl": 0.81,
    "maxRotation": 0.9,
    "inertia": 2.2,
    "suspension": 2.2,
    "suspensionDamping": 1.8,
    "suspensionTravel": 0.9583333333333333,
    "pitchSupport": 2,
    "groundDamping": 2,
    "fuelCapacity": 2.2,
    "fuelBurn": 1.9,
    "downforceScale": 1
  },
  "buggy": {
    "price": 925000,
    "mass": 0.75,
    "motorTorque": 2.04,
    "enginePower": 2.635,
    "accelerationLimit": 2,
    "wheelSpeedLimit": 2,
    "tireGrip": 1.5,
    "airControl": 2.03,
    "maxRotation": 1.45,
    "inertia": 1.1,
    "suspension": 0.9,
    "suspensionDamping": 1,
    "suspensionTravel": 1.5,
    "pitchSupport": 1.265,
    "groundDamping": 1.15,
    "fuelCapacity": 1,
    "fuelBurn": 0.95,
    "downforceScale": 0
  },
  "monster": {
    "price": 1000000,
    "mass": 2.5,
    "motorTorque": 4.6,
    "enginePower": 3.25,
    "accelerationLimit": 1.55,
    "wheelSpeedLimit": 1.9,
    "tireGrip": 1.5,
    "airControl": 1.1550000000000002,
    "maxRotation": 1.05,
    "inertia": 1.8,
    "suspension": 2,
    "suspensionDamping": 1.8,
    "suspensionTravel": 1.7500000000000002,
    "pitchSupport": 2,
    "groundDamping": 2,
    "fuelCapacity": 2.6,
    "fuelBurn": 2.2,
    "downforceScale": 0
  }
};

const OFFROAD_DOWNFORCE_REFERENCE=0.15;

for(const [id,row] of Object.entries(VEHICLE_STAT_TABLE)){

  const d=VEHICLES[id],m=d.multipliers,stopRatio=(m.suspensionMin??1)/(m.suspensionTravel??1);

  // Map the clear authoring names into the existing runtime physics fields.
  // Keeping these aliases here makes this refactor behavior-preserving and avoids touching the physics engine.
  m.mass=row.mass;
  m.motorTorque=row.motorTorque;
  m.enginePower=row.enginePower;
  m.acceleration=row.accelerationLimit;
  m.maxSpeed=row.wheelSpeedLimit;
  m.wheelSpeedLimit=row.wheelSpeedLimit;
  m.tireGrip=row.tireGrip;

  // One per-vehicle air-control multiplier. airTilt remains the common Jeep baseline/upgradable term.
  m.airTilt=1;
  m.airControl=row.airControl;
  m.maxRotation=row.maxRotation;

  m.inertia=row.inertia;
  m.suspension=row.suspension;
  m.suspensionDamping=row.suspensionDamping;
  m.suspensionTravel=row.suspensionTravel;
  m.pitchSupport=row.pitchSupport;
  m.groundDamping=row.groundDamping;
  if(Number.isFinite(row.drivePitch))m.drivePitch=row.drivePitch;
  m.fuelCapacity=row.fuelCapacity;
  m.fuelBurn=row.fuelBurn;
  m.downforceScale=row.downforceScale;

  // Keep each chassis's original bottom-stop fraction while applying the authoritative travel.
  m.suspensionMin=stopRatio*row.suspensionTravel;

  if(id!=='base')
  m.cost=row.price/BASE_VEHICLE_TRAITS.cost;

  d.directMotorTorque=true;
  d.wheelSpeedLimited=true;

}

function vehicleTraits(id){
  const d=VEHICLES[id]||VEHICLES.base;
  return Object.fromEntries(Object.entries(BASE_VEHICLE_TRAITS).map(([key,value])=>[key,value*(d.multipliers[key]??1)]));
}

for(const [id,d] of Object.entries(VEHICLES))
Object.defineProperty(d,'price',{get:()=>d.freeStarter?0:Math.round(vehicleTraits(id).cost)});

function vehicleBase(id){
  if(!VEHICLES[id])
  id='base';
  const d=VEHICLES[id],t=vehicleTraits(id),wheels=d.geometry.wheels.map(w=>({x:w.x*t.wheelBase,y:w.y,r:w.r*t.wheelRadius})),radius=wheels.reduce((sum,w)=>sum+w.r,0)/wheels.length;
  return {...t,id,visualType:d.visualType,wheels,head:d.geometry.head,comOffsetY:d.geometry.comOffsetY,tracked:d.tracked,suspensionUpgrade:d.suspensionUpgrade,tiresUpgrade:d.tiresUpgrade,rearDriveShare:d.rearDriveShare,wheelSpeedLimited:!!d.wheelSpeedLimited,pickupPolygon:d.geometry.pickupPolygon,engineTorque:t.motorTorque,aeroDrag:t.enginePower/Math.pow(t.maxSpeed,3)};
}

const UPGRADES={
 engine:{name:'Engine',description:'More axle torque for climbs and more power to sustain speed.'},
 suspension:{name:'Suspension',description:'Stronger springs and more damping for controlled landings.'},
 tires:{name:'Tires',description:'More traction to put power down on steep slopes.'},
 fuel:{name:'Fuel Tank',description:'A larger tank and less fuel burned every second.'}
};

const freshLevels=()=>({engine:0,suspension:0,tires:0,fuel:0});

const UPGRADE_CURVES={downforce:[0,.3,.7,1.35,2.4,4.5],airControl:[1,1.2,1.5,1.9,2.4,3],power:[.5,1.15,2.85,6.5,13.5,24],torque:[.62,1.15,1.85,2.9,4.4,6],spring:[1,1.15,1.35,1.6,1.9,2.2],damping:[1,1.15,1.35,1.6,1.9,2.2],grip:[.7,1.05,1.55,2.3,3.3,4.4],dynamic:[.82,.85,.88,.9,.92,.94],tank:[1,1.4,2,2.9,4.2,6],burn:[1,.9,.79,.67,.55,.44]};

const UPGRADE_PROFILES={
 base:{power:1.3,torque:1.35,spring:1.1,damping:1.3,grip:1.25,tank:1.2,burn:.9,focus:'Balanced power, traction and control'},
 bike:{power:1.55,torque:1.25,airControl:1.25,grip:1.2,tank:1.15,burn:.9,focus:'High speed and independent aerial control'},
 tractor:{power:1.25,torque:1.8,spring:1.1,damping:1.3,grip:1.45,tank:1.25,burn:.85,focus:'Climbing torque, hill grip and endurance'},
 tank:{power:1.5,torque:1.5,spring:1.1,damping:1.35,trackGrip:1.6,tank:1.25,burn:.9,focus:'Explosive tracked acceleration and compressed-track grip'},
 monster:{power:1.5,torque:1.5,spring:1.15,damping:1.5,grip:1.35,tank:1.3,burn:.85,focus:'High-speed climbs and controlled heavy landings'}
};

Object.assign(UPGRADE_PROFILES,{
  "buggy": {
    "power": 1.45,
    "torque": 1.5,
    "spring": 1.15,
    "damping": 1.45,
    "grip": 1.4,
    "tank": 1.2,
    "burn": 0.88,
    "focus": "Agile climbs and controlled landings"
  },
  "bus": {
    "power": 1.4,
    "torque": 1.6,
    "spring": 1.2,
    "damping": 1.5,
    "grip": 1.35,
    "tank": 1.35,
    "burn": 0.85,
    "focus": "Heavy momentum and long-distance endurance"
  },
  "battletank": {
    "power": 1.35,
    "torque": 1.9,
    "spring": 1.1,
    "damping": 1.4,
    "grip": 1.6,
    "tank": 1.3,
    "burn": 0.85,
    "focus": "Extreme climbing torque and track traction"
  },
  "dragster": {
    "power": 1.8,
    "torque": 1.6,
    "spring": 1.1,
    "damping": 1.35,
    "grip": 1.45,
    "tank": 1.15,
    "burn": 0.9,
    "focus": "Raw speed, launch torque and wheelie control"
  },
  "atv": {
    "power": 1.45,
    "torque": 1.35,
    "spring": 1.15,
    "damping": 1.5,
    "grip": 1.3,
    "tank": 1.2,
    "burn": 0.88,
    "focus": "Quick flips, responsive driving and safe landings"
  }
});

Object.assign(UPGRADE_PROFILES,{
  "supercar": {
    "power": 1.5,
    "torque": 1.4,
    "spring": 1.15,
    "damping": 1.5,
    "grip": 1.4,
    "tank": 1.25,
    "burn": 0.85,
    "focus": "Smooth-road speed and precise landings"
  },
  "firetruck": {
    "power": 1.5,
    "torque": 1.6,
    "spring": 1.15,
    "damping": 1.5,
    "grip": 1.4,
    "tank": 1.25,
    "burn": 0.85,
    "focus": "Heavy torque, stability and endurance"
  },
  "snowmobile": {
    "power": 1.5,
    "torque": 1.4,
    "spring": 1.15,
    "damping": 1.5,
    "grip": 1.4,
    "tank": 1.25,
    "burn": 0.85,
    "focus": "Snow traction and quick aerial corrections"
  },
  "hotrod": {
    "power": 1.7,
    "torque": 1.6,
    "spring": 1.15,
    "damping": 1.5,
    "grip": 1.4,
    "tank": 1.25,
    "burn": 0.85,
    "focus": "Explosive launches and wheelie control"
  },
  "rover": {
    "power": 1.5,
    "torque": 1.4,
    "spring": 1.15,
    "damping": 1.5,
    "grip": 1.4,
    "tank": 1.25,
    "burn": 0.85,
    "focus": "Aerial agility and six-wheel terrain contact"
  }
});

Object.assign(UPGRADE_PROFILES,{
  "monowheel": {
    "power": 1.1,
    "torque": 1.1,
    "spring": 1.05,
    "damping": 1.1,
    "grip": 1.1,
    "tank": 1.1,
    "burn": 0.95,
    "focus": "A single-wheel experiment. Featherweight balance and rapid air rotation."
  },
  "lowrider": {
    "power": 1.1,
    "torque": 1.1,
    "spring": 1.25,
    "damping": 1.4,
    "grip": 1.1,
    "tank": 1.1,
    "burn": 0.95,
    "focus": "Hydraulic cruiser. Controlled rebound turns hard landings into small leaps."
  },
  "steamroller": {
    "power": 1.1,
    "torque": 1.1,
    "spring": 1.05,
    "damping": 1.1,
    "grip": 1.1,
    "tank": 1.1,
    "burn": 0.95,
    "focus": "Massive steel drum, relentless climbing torque and heavyweight momentum."
  },
  "formula": {
    "power": 1.1,
    "torque": 1.1,
    "spring": 1.05,
    "damping": 1.1,
    "grip": 1.1,
    "tank": 1.1,
    "burn": 0.95,
    "focus": "Open-wheel speed machine. Aerodynamic downforce builds with ground speed."
  },
  "hovercraft": {
    "power": 1.1,
    "torque": 1.1,
    "spring": 1.05,
    "damping": 1.1,
    "grip": 1.1,
    "tank": 1.1,
    "burn": 0.95,
    "focus": "Low-friction air cushion with power-limited thrusters for effortless gliding."
  }
});

function upgradeScale(id,key,level){
  return 1+((UPGRADE_PROFILES[id][key]??1)-1)*level/MAX_LEVEL;
}

const UPGRADE_PRICES=Object.fromEntries(Object.keys(VEHICLES).map(id=>[id,Array.from({length:5},(_,i)=>Math.round(vehicleTraits(id)['upgradeCost'+(i+1)]))]));

export { VEHICLES, VEHICLE_CATALOG, VEHICLE_ORDER, VEHICLE_TIERS, VEHICLE_STAT_TABLE, OFFROAD_DOWNFORCE_REFERENCE, vehicleTraits, vehicleBase, UPGRADES, freshLevels, UPGRADE_CURVES, UPGRADE_PROFILES, upgradeScale, UPGRADE_PRICES };

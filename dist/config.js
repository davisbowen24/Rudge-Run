const BASE_VEHICLE_TRAITS=Object.freeze({
  "rollingResistance": 0.012,
  "downforceScale": 1,
  "downforceAngle": 10,
  "drivePitch": 0.35,
  "mass": 12,
  "inertia": 16000,
  "enginePower": 892500,
  "motorTorque": 148500,
  "wheelSpeedLimit": 21.776711233442143,
  "tireGrip": 1.1,
  "suspension": 900,
  "suspensionDamping": 110,
  "suspensionTravel": 21.6,
  "suspensionMin": 7.2,
  "fuelCapacity": 44.8 * 0.70,
  "fuelBurn": 2.5,
  "airTilt": 4.466,
  "airControl": 1,
  "airResponse": 1,
  "airBrake": 1,
  "maxRotation": 4.48,
  "wheelRadius": 19,
  "halfWidth": 51,
  "driveLever": 17,
  "groundDamping": 0.675,
  "acceleration": 592.1052631578947,
  "maxSpeed": 413.7575134354007,
  "wheelBase": 88,
  "pitchSupport": 1,
  "cost": 100,
  "upgradeCost1": 100,
  "upgradeCost2": 400,
  "upgradeCost3": 1800,
  "upgradeCost4": 7500,
  "upgradeCost5": 30000
});

const BASE_VEHICLE=BASE_VEHICLE_TRAITS;

const CONFIG={vehicle:{...BASE_VEHICLE_TRAITS},world:{gravity:600,pixelsPerMeter:10},pickups:{firstFuelMeters:150,fuelGapIncrement:250,maxFuelGapMeters:10000,coinSpacing:230},progression:{firstCheckpointMeters:500,checkpointGapGrowth:1.35,silverMeters:500,goldMeters:1500}};

const GRAVITY_SCALE=600/9.8;

const MILESTONES=[150,350,600,1000,1500,2200,3200,4500,5000];

const MAX_LEVEL=5, SAVE_KEY='ridge-run-garage-v1', PERSISTENT_KEY='ridge-run-progress-v3';

export { BASE_VEHICLE_TRAITS, BASE_VEHICLE, CONFIG, GRAVITY_SCALE, MILESTONES, MAX_LEVEL, SAVE_KEY, PERSISTENT_KEY };

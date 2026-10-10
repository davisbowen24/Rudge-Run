/** Shared flip recognition for solo runs and every multiplayer mode.
 *
 * A flip is a complete upside-down -> upright recovery within one flight.
 * Successful recoveries while airborne score immediately, allowing combos.
 * After inversion, a wheel-first landing can finish the last recovery even
 * when the chassis is still slightly tilted.
 */
export const FLIP_INVERTED_TOLERANCE=Math.PI*35/180;
export const FLIP_AIR_UPRIGHT_TOLERANCE=Math.PI*25/180;
export const FLIP_LANDING_UPRIGHT_TOLERANCE=Math.PI*65/180;

export function uprightAngleError(angle){
  return Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)));
}

export function createFlipDetector(){
  let airborne=false,awaitingUpright=false,lastDirection=1;

  function reset(){
    airborne=false;
    awaitingUpright=false;
    lastDirection=1;
  }

  function step({angle,delta=0,grounded=false,onWheels=false}={}){
    if(!Number.isFinite(angle))return [];
    if(Number.isFinite(delta)&&Math.abs(delta)>1e-5)lastDirection=Math.sign(delta);
    const error=uprightAngleError(angle);
    if(grounded){
      // Only award the last half-rotation if a prior inversion occurred
      // during this flight AND the car survives a wheel-first landing.
      const landedFlip=airborne&&awaitingUpright&&onWheels
        &&error<=FLIP_LANDING_UPRIGHT_TOLERANCE;
      const direction=lastDirection;
      reset();
      return landedFlip?[{direction,landing:true}]:[];
    }
    airborne=true;
    if(error>=Math.PI-FLIP_INVERTED_TOLERANCE){
      awaitingUpright=true;
    }else if(awaitingUpright&&error<=FLIP_AIR_UPRIGHT_TOLERANCE){
      // One inverted -> upright recovery, then re-arm on the next inversion.
      awaitingUpright=false;
      return [{direction:lastDirection,landing:false}];
    }
    return [];
  }

  return {step,reset};
}

/**
 * The car and all suspension geometry are already scaled in world space.
 * paintVehicle() draws inside a scale transform centered on the chassis,
 * so BOTH wheel centers AND their suspension anchors must be converted
 * back to unscaled drawing coordinates before painting. Otherwise links
 * float away from their real attachments as Giant/Tiny Cars activates.
 */
export function chaosPaintWheels(wheels,centerX,centerY,scale){
  if(!Number.isFinite(scale)||scale<=0)return wheels;
  const unscale=(x,center)=>center+(x-center)/scale;
  return wheels.map(w=>({
    ...w,
    x:unscale(w.x,centerX),
    y:unscale(w.y,centerY),
    r:w.r/scale,
    anchor:w.anchor?{
      ...w.anchor,
      x:unscale(w.anchor.x,centerX),
      y:unscale(w.anchor.y,centerY)
    }:w.anchor
  }));
}

/** Stuntman's Assist bonuses are earned on a survived landing, not midair.
 * All rewards last six seconds. Stunt engine power is additive with catch-up.
 */
export const STUNT_ASSIST_SECONDS=6;
export function stuntBonusForLanding(landing){
  const flips=Math.max(0,Math.floor(Number(landing?.flips)||0));
  const airtime=Math.max(0,Number(landing?.airtime)||0);
  if(flips>=3)return {bonus:0.5,label:'3+ FLIPS'};
  if(flips===2)return {bonus:0.4,label:'DOUBLE FLIP'};
  if(flips===1)return {bonus:0.25,label:'FLIP'};
  if(airtime>=3)return {bonus:0.2,label:'BIG AIR'};
  return null;
}
export function stuntAndLoserMultipliers(loserMultiplier,stuntBonus){
  const loser=Number.isFinite(loserMultiplier)?Math.max(1,loserMultiplier):1;
  const stunt=Number.isFinite(stuntBonus)?Math.max(0,Math.min(0.5,stuntBonus)):0;
  return {enginePower:loser+stunt,engineTorque:loser,acceleration:loser};
}

/** Read-only race standings for eliminated drivers.
 * Uses furthest race distance, not live chassis position; this is the same
 * scoring metric used to determine race results, regardless of Chase Mode.
 */
export function spectatorStandings(room){
  const safeMeters=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
  const racers=(room?.members||[])
    .filter(member=>member.raceActive===true)
    .map(member=>{
      const racing=member.raceStatus==='racing';
      return {
        id:member.id,
        name:String(member.displayName||'Driver'),
        distance:safeMeters(racing?member.distance:member.finalDistance??member.distance),
        racing,
        connected:member.connected!==false
      };
    })
    .sort((a,b)=>b.distance-a.distance||a.name.localeCompare(b.name)||String(a.id).localeCompare(String(b.id)));
  return {
    leader:racers[0]||null,
    activeCount:racers.filter(member=>member.racing).length,
    racers:racers.map((member,index)=>({...member,rank:index+1}))
  };
}

/**
 * Accept only monotonically newer room snapshots. Polls, progress pushes, and
 * other room actions can finish out of order over independent HTTP requests.
 * Changing rooms must go through adopt(), not through a delayed old response.
 */
export function shouldApplyRoomSnapshot(current, incoming, roomCode = null) {
  if (!incoming || typeof incoming !== 'object') return false;
  if (roomCode && incoming.code !== roomCode) return false;
  if (!current) return true;
  if (current.id !== incoming.id) return false;
  const previousRevision=Number(current.revision);
  const nextRevision=Number(incoming.revision);
  if(Number.isFinite(previousRevision) && Number.isFinite(nextRevision)){
    if(nextRevision<previousRevision)return false;
    if(nextRevision>previousRevision)return true;
  }
  // A state read can have the same revision and a later serverTime. Prefer
  // that read; an older equal-revision response must never roll back the clock.
  const previousTime=Date.parse(current.serverTime||'');
  const nextTime=Date.parse(incoming.serverTime||'');
  if(Number.isFinite(previousTime) && Number.isFinite(nextTime))
    return nextTime>=previousTime;
  return true;
}

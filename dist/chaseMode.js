/**
 * Multiplayer-only Chase Mode simulation.
 *
 * This module deliberately has no DOM, network, physics, or game-over dependencies.
 * All distances are meters and all sampledAtMs/nowMs values must be on the same
 * client-local monotonic clock (e.g. performance.now()). A caller must translate
 * server timestamps before passing them in.
 *
 * Future integration should provide LIVE position, not the existing farthest-
 * distance score. Status and membership come from the authoritative room state.
 * The resulting boundary is for smooth local presentation; authoritative damage
 * and elimination must be resolved separately by the multiplayer backend.
 */
export const CHASE_MODE_DEFAULTS = Object.freeze({
  enabled: false,
  trailMeters: 750,
  warningMeters: 200,
  correctionRate: 5,
  maxPredictionMs: 1500,
  staleAfterMs: 3000,
});

const finite = value => typeof value === 'number' && Number.isFinite(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createChaseMode(options = {}) {
  const settings = {...CHASE_MODE_DEFAULTS, ...options};
  for (const key of ['trailMeters', 'warningMeters', 'correctionRate', 'maxPredictionMs', 'staleAfterMs']) {
    if (!finite(settings[key]) || settings[key] < 0) throw new RangeError('Invalid Chase Mode ' + key);
  }
  if (settings.trailMeters === 0 || settings.correctionRate === 0) {
    throw new RangeError('Chase Mode trailMeters and correctionRate must be positive');
  }

  let enabled = Boolean(settings.enabled);
  let members = new Map();
  let positionMeters = null;
  let targetMeters = null;
  let leaderId = null;
  let leaderMeters = null;
  let predictionAgeMs = null;

  function reset() {
    members.clear();
    positionMeters = targetMeters = leaderId = leaderMeters = predictionAgeMs = null;
  }

  function setEnabled(next) {
    const value = Boolean(next);
    if (value !== enabled) {
      enabled = value;
      reset(); // Never carry an old room's positions into a new mode/race.
    }
  }

  /**
   * Ingest a COMPLETE room participant snapshot. Each participating racer needs:
   * {id, positionMeters, velocityMetersPerSecond, sampledAtMs, raceStatus}.
   * sampledAtMs is when the position was sampled, NOT the time a repeated room
   * snapshot was received. Out-of-order position samples are ignored.
   */
  function setParticipants(participants) {
    if (!enabled) return;
    if (!Array.isArray(participants)) throw new TypeError('Expected a participant array');
    const next = new Map();
    for (const item of participants) {
      if (!item || (typeof item.id !== 'string' && typeof item.id !== 'number')) continue;
      const previous = members.get(item.id);
      const hasSample = finite(item.positionMeters) && finite(item.velocityMetersPerSecond) && finite(item.sampledAtMs);
      const newerSample = hasSample && (!previous || item.sampledAtMs >= previous.sampledAtMs);
      const sample = newerSample ? {
        positionMeters: Math.max(0, item.positionMeters),
        velocityMetersPerSecond: clamp(item.velocityMetersPerSecond, -200, 200),
        sampledAtMs: item.sampledAtMs,
      } : previous;
      if (!sample) continue;
      next.set(item.id, {
        id: item.id,
        positionMeters: sample.positionMeters,
        velocityMetersPerSecond: sample.velocityMetersPerSecond,
        sampledAtMs: sample.sampledAtMs,
        raceStatus: item.raceStatus ?? previous?.raceStatus ?? 'waiting',
        raceActive: item.raceActive ?? previous?.raceActive ?? true,
      });
    }
    members = next;
  }

  function predictedPosition(member, nowMs) {
    const age = clamp(nowMs - member.sampledAtMs, 0, settings.maxPredictionMs);
    return Math.max(0, member.positionMeters + member.velocityMetersPerSecond * age / 1000);
  }

  /** Advance the visual boundary each animation frame (not each network poll). */
  function update(dtSeconds, nowMs) {
    if (!enabled) return snapshot();
    if (!finite(dtSeconds) || dtSeconds < 0 || !finite(nowMs)) {
      throw new RangeError('Chase Mode requires a nonnegative dt and finite local timestamp');
    }
    let leader = null;
    let furthest = -Infinity;
    for (const member of members.values()) {
      if (member.raceActive === false || member.raceStatus !== 'racing') continue;
      const predicted = predictedPosition(member, nowMs);
      if (predicted > furthest) {
        furthest = predicted;
        leader = member;
      }
    }
    if (!leader) {
      // No surviving racing players. The visual hazard should disappear.
      positionMeters = targetMeters = leaderId = leaderMeters = predictionAgeMs = null;
      return snapshot();
    }

    const sameLeader = leader.id === leaderId;
    leaderId = leader.id;
    leaderMeters = furthest;
    predictionAgeMs = Math.max(0, nowMs - leader.sampledAtMs);
    targetMeters = furthest - settings.trailMeters;

    if (positionMeters === null) {
      positionMeters = targetMeters;
    } else {
      // Velocity feed-forward removes the constant lag caused by simple lerping.
      // The spring-like correction also permits a smooth RETREAT on leader loss.
      const predictionFresh = predictionAgeMs < settings.maxPredictionMs;
      const feedForward = sameLeader && predictionFresh ? leader.velocityMetersPerSecond * dtSeconds : 0;
      const projected = positionMeters + feedForward;
      const correction = 1 - Math.exp(-settings.correctionRate * dtSeconds);
      positionMeters = projected + (targetMeters - projected) * correction;
    }
    return snapshot();
  }

  function snapshot() {
    return {
      enabled,
      leaderId,
      leaderMeters,
      positionMeters,
      targetMeters,
      predictionStale: predictionAgeMs !== null && predictionAgeMs > settings.staleAfterMs,
      predictionAgeMs,
      trailMeters: settings.trailMeters,
      warningMeters: settings.warningMeters,
    };
  }

  /** Informational proximity only; NEVER use local predictions to finalize kills. */
  function proximity(position) {
    if (!enabled || positionMeters === null || !finite(position)) return null;
    const distanceMeters = position - positionMeters;
    return {
      distanceMeters,
      caught: distanceMeters <= 0,
      warning: distanceMeters > 0 && distanceMeters <= settings.warningMeters,
    };
  }

  return {setEnabled, setParticipants, update, snapshot, proximity, reset};
}

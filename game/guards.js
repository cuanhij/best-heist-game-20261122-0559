// Midnight Vault — guards. One job: guard brains.
// Patrol a waypoint loop, spot the thief inside a vision cone with a clear line
// of sight, chase when the alarm is high, and walk over to investigate a noise.
// The thief is invisible to them while standing in a shadow patch.

import { angleDiff, moveCircle, pointInShadow, segmentBlocked } from './level.js';

export const GUARD_RANGE = 175;
export const GUARD_FOV = 1.25; // radians, about 72 degrees
export const PATROL_SPEED = 55;
export const CHASE_SPEED = 118;
export const INVESTIGATE_SPEED = 85;

export function createGuard(def, index) {
  const start = def.waypoints[0];
  return {
    name: def.name,
    x: start.x,
    y: start.y,
    r: 15,
    waypoints: def.waypoints,
    waypointIndex: 1 % def.waypoints.length,
    facing: Math.PI / 2,
    mode: 'patrol', // patrol | chase | investigate
    lastSeen: null, // {x, y} of the thief, last spotted
    lostSightFor: 0,
    investigateTarget: null,
    investigateFor: 0,
    seenNow: false,
  };
}

// Can this guard see the thief right now? Disguise shrinks the range.
export function guardCanSee(guard, thief, disguised) {
  if (pointInShadow(thief.x, thief.y)) return false;
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = disguised ? GUARD_RANGE * 0.45 : GUARD_RANGE;
  if (dist > range) return false;
  if (dist < 30) return true; // bumped into the thief: seen, disguise or not
  const angle = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(angle, guard.facing)) > GUARD_FOV / 2) return false;
  return !segmentBlocked(guard.x, guard.y, thief.x, thief.y);
}

export function updateGuard(guard, dt, thief, alarm, disguised) {
  guard.seenNow = guardCanSee(guard, thief, disguised);
  if (guard.seenNow) {
    guard.lastSeen = { x: thief.x, y: thief.y };
    guard.lostSightFor = 0;
  } else {
    guard.lostSightFor += dt;
  }

  if (guard.mode === 'investigate') {
    guard.investigateFor -= dt;
    if (guard.investigateFor <= 0 || guard.seenNow) {
      guard.mode = guard.seenNow ? 'chase' : 'patrol';
      guard.investigateTarget = null;
    }
  }

  if (guard.mode !== 'investigate') {
    if (guard.seenNow || alarm >= 70) guard.mode = 'chase';
    else if (guard.mode === 'chase' && guard.lostSightFor > 4) guard.mode = 'patrol';
  }

  if (guard.mode === 'chase' && guard.lastSeen) {
    const target = guard.seenNow ? { x: thief.x, y: thief.y } : guard.lastSeen;
    stepToward(guard, target.x, target.y, CHASE_SPEED, dt);
    if (!guard.seenNow && guard.lostSightFor > 4) guard.mode = 'patrol';
    return;
  }

  if (guard.mode === 'investigate' && guard.investigateTarget) {
    const arrived = stepToward(
      guard,
      guard.investigateTarget.x,
      guard.investigateTarget.y,
      INVESTIGATE_SPEED,
      dt,
    );
    if (arrived) {
      guard.mode = 'patrol';
      guard.investigateTarget = null;
    }
    return;
  }

  // Patrol: walk the loop, pausing a beat at each waypoint.
  const wp = guard.waypoints[guard.waypointIndex];
  const arrived = stepToward(guard, wp.x, wp.y, PATROL_SPEED, dt);
  if (arrived) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
  }
}

// Walk toward a point at a speed, sliding along walls. Returns true on arrival.
function stepToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  const moved = moveCircle(guard.x, guard.y, guard.r, nx - guard.x, ny - guard.y);
  guard.x = moved.x;
  guard.y = moved.y;
  guard.facing = Math.atan2(dy, dx);
  return dist - step < 6;
}

// A noise-maker ping at (x, y): the nearest guard on patrol walks over to look.
export function divertNearestGuard(guards, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const guard of guards) {
    if (guard.mode === 'chase') continue;
    const dist = Math.hypot(guard.x - x, guard.y - y);
    if (dist < bestDist) {
      bestDist = dist;
      best = guard;
    }
  }
  if (!best || bestDist > 520) return null;
  best.mode = 'investigate';
  best.investigateTarget = { x, y };
  best.investigateFor = 5;
  return best;
}

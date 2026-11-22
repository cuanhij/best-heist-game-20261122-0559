// Midnight Vault — security cameras. One job: sweeping camera cones.
// A camera sits on a wall and sweeps its cone back and forth. While its EMP
// blind timer runs it is dead: no cone, no spotting, just sparks.

import { angleDiff, pointInShadow, segmentBlocked } from './level.js';

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    fov: def.fov,
    angle: def.baseAngle,
    phase: Math.random() * Math.PI * 2,
    blind: 0, // seconds of EMP blindness left
  };
}

export function updateCamera(camera, dt, time) {
  if (camera.blind > 0) camera.blind = Math.max(0, camera.blind - dt);
  camera.angle = camera.baseAngle + Math.sin(time * camera.speed + camera.phase) * camera.sweep;
}

export function cameraCanSee(camera, thief) {
  if (camera.blind > 0) return false;
  if (pointInShadow(thief.x, thief.y)) return false;
  const dx = thief.x - camera.x;
  const dy = thief.y - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > camera.range) return false;
  const angle = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(angle, camera.angle)) > camera.fov / 2) return false;
  return !segmentBlocked(camera.x, camera.y, thief.x, thief.y);
}

// EMP blast: every camera goes dark for `seconds`.
export function blindAllCameras(cameras, seconds) {
  for (const camera of cameras) camera.blind = seconds;
}

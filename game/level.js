// Midnight Vault — level definition.
// One job: describe the museum floor plan (rooms, walls, loot, shadows, patrols,
// cameras, exit) and the small geometry helpers the rest of the game uses.
// Canvas is 1280x800; the top 64px is the HUD bar, the play area is y 64..800.

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 64;

// Axis-aligned wall rectangles {x, y, w, h}. Rooms are separated by two divider
// walls with a door gap each (y 360..460).
export const WALLS = [
  // Outer shell.
  { x: 0, y: 64, w: 1280, h: 16 }, // top
  { x: 0, y: 784, w: 1280, h: 16 }, // bottom
  { x: 0, y: 64, w: 16, h: 736 }, // left
  { x: 1264, y: 64, w: 16, h: 736 }, // right
  // Divider entry hall | gallery (door gap y 360..460).
  { x: 440, y: 64, w: 16, h: 296 },
  { x: 440, y: 460, w: 16, h: 324 },
  // Divider gallery | vault room (door gap y 360..460).
  { x: 860, y: 64, w: 16, h: 296 },
  { x: 860, y: 460, w: 16, h: 324 },
  // Entry hall furniture.
  { x: 120, y: 180, w: 70, h: 70 }, // crate
  { x: 300, y: 600, w: 80, h: 60 }, // crate
  { x: 250, y: 300, w: 36, h: 36 }, // pillar
  // Gallery pedestals.
  { x: 560, y: 200, w: 60, h: 60 },
  { x: 700, y: 560, w: 60, h: 60 },
  { x: 620, y: 380, w: 50, h: 50 },
  // Vault room furniture.
  { x: 1120, y: 180, w: 110, h: 90 }, // the vault safe itself (also a wall)
  { x: 960, y: 300, w: 36, h: 36 }, // pillar
  { x: 960, y: 600, w: 36, h: 36 }, // pillar
  { x: 1050, y: 600, w: 90, h: 50 }, // display case
];

// Room tints, drawn left to right.
export const ROOMS = [
  { name: 'Entry Hall', x: 16, y: 80, w: 424, h: 704, floor: '#1c2438', trim: '#2c3a5c' },
  { name: 'Gallery', x: 456, y: 80, w: 404, h: 704, floor: '#241c33', trim: '#3a2c52' },
  { name: 'Vault Room', x: 876, y: 80, w: 388, h: 704, floor: '#14242e', trim: '#23424f' },
];

// Loot: gems are picked up by walking over them, paintings by walking up to
// the wall frame, the vault by standing beside the safe while it cracks.
export const LOOT_DEFS = [
  { id: 'gem1', kind: 'gem', x: 590, y: 230, value: 150, label: 'Sapphire' },
  { id: 'gem2', kind: 'gem', x: 730, y: 590, value: 150, label: 'Ruby' },
  { id: 'gem3', kind: 'gem', x: 1095, y: 640, value: 150, label: 'Emerald' },
  { id: 'paint1', kind: 'painting', x: 640, y: 96, value: 200, label: 'Moonlit Portrait' },
  { id: 'paint2', kind: 'painting', x: 1010, y: 96, value: 200, label: 'Golden Horizon' },
  { id: 'vault', kind: 'vault', x: 1175, y: 225, value: 500, label: 'The Midnight Vault' },
];

// Dark patches where guards and cameras cannot spot the thief.
export const SHADOWS = [
  { x: 90, y: 480, w: 150, h: 110 },
  { x: 500, y: 620, w: 170, h: 110 },
  { x: 920, y: 120, w: 150, h: 100 },
];

// The getaway: a side door in the entry hall's left wall. Needs 4 loot pieces.
export const EXIT = { x: 16, y: 380, w: 34, h: 80 };
export const SPAWN = { x: 90, y: 700 };

// Guard patrol loops (waypoints, one loop per room).
export const GUARD_DEFS = [
  {
    name: 'Rook',
    room: 'Gallery',
    waypoints: [
      { x: 500, y: 150 },
      { x: 800, y: 150 },
      { x: 800, y: 700 },
      { x: 500, y: 700 },
    ],
  },
  {
    name: 'Bishop',
    room: 'Entry Hall',
    waypoints: [
      { x: 80, y: 150 },
      { x: 380, y: 150 },
      { x: 380, y: 700 },
      { x: 80, y: 700 },
    ],
  },
  {
    name: 'Knight',
    room: 'Vault Room',
    waypoints: [
      { x: 920, y: 150 },
      { x: 1200, y: 150 },
      { x: 1200, y: 700 },
      { x: 920, y: 700 },
    ],
  },
];

// Wall-mounted security cameras. baseAngle points into the room (down);
// each sweeps +/-sweep radians around it.
export const CAMERA_DEFS = [
  { x: 640, y: 84, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.55, range: 210, fov: 0.9 },
  { x: 1080, y: 84, baseAngle: Math.PI / 2, sweep: 0.8, speed: 0.7, range: 210, fov: 0.9 },
  { x: 220, y: 84, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.45, range: 200, fov: 0.9 },
];

// ---- geometry helpers -------------------------------------------------------

export function pointHitsWall(x, y, pad = 0) {
  for (const w of WALLS) {
    if (x >= w.x - pad && x <= w.x + w.w + pad && y >= w.y - pad && y <= w.y + w.h + pad) return true;
  }
  return false;
}

// True when the straight segment between two points is blocked by any wall.
// Samples along the segment; walls are thick enough that 6px steps cannot hop one.
export function segmentBlocked(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointHitsWall(x1 + dx * t, y1 + dy * t, 1)) return true;
  }
  return false;
}

export function pointInShadow(x, y) {
  for (const s of SHADOWS) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  }
  return false;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Move a circle (x, y, radius) by (dx, dy) with axis-separated wall sliding.
// Returns the new position.
export function moveCircle(x, y, r, dx, dy) {
  let nx = x + dx;
  if (!circleHitsWall(nx, y, r)) x = nx;
  let ny = y + dy;
  if (!circleHitsWall(x, ny, r)) y = ny;
  return { x, y };
}

export function circleHitsWall(x, y, r) {
  for (const w of WALLS) {
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    const ddx = x - cx;
    const ddy = y - cy;
    if (ddx * ddx + ddy * ddy < r * r) return true;
  }
  return false;
}

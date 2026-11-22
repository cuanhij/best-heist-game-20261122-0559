// Midnight Vault — screenshot staging. One job: put the game into a fixed,
// photogenic state for each screenshot, driven by the ?shot= URL query.
// The game is frozen in that state (no simulation) so every render is identical.

export function applyShot(state, name) {
  // Every shot starts from live play, never the title screen.
  state.screen = 'play';
  state.frozen = true;
  state.toast = null;

  const guards = state.guards;
  const cameras = state.cameras;

  if (name === 'start') {
    // COVER: the thief crossing the gallery, cones sweeping, a camera, a loot
    // target and the alarm meter all in one frame.
    state.thief.x = 640;
    state.thief.y = 470;
    state.thief.facing = -Math.PI / 2;
    state.alarm = 38;
    state.cash = 270;
    state.lootTaken = 1;
    markTaken(state, 'gem1');
    placeGuard(guards[0], 700, 330, -Math.PI / 2); // Rook, cone on the thief
    placeGuard(guards[1], 300, 300, Math.PI / 2);
    placeGuard(guards[2], 1010, 320, Math.PI / 2);
    cameras[0].angle = Math.PI / 2 + 0.35;
    cameras[1].angle = Math.PI / 2 - 0.3;
    cameras[2].angle = Math.PI / 2;
  } else if (name === 'patrol') {
    // The thief hiding in a shadow patch while the guards walk their dotted routes.
    state.thief.x = 165;
    state.thief.y = 535;
    state.thief.facing = Math.PI;
    state.alarm = 8;
    state.cash = 120;
    state.lootTaken = 0;
    placeGuard(guards[0], 500, 150, 0);
    placeGuard(guards[1], 200, 150, Math.PI / 2);
    placeGuard(guards[2], 1200, 150, Math.PI);
    cameras[0].angle = Math.PI / 2 - 0.6;
    cameras[1].angle = Math.PI / 2 + 0.5;
    cameras[2].angle = Math.PI / 2 - 0.4;
  } else if (name === 'alarm') {
    // Caught in the open: alarm nearly maxed, a guard chasing, red vignette.
    state.thief.x = 700;
    state.thief.y = 520;
    state.thief.facing = Math.PI;
    state.alarm = 82;
    state.cash = 420;
    state.lootTaken = 2;
    markTaken(state, 'gem1');
    markTaken(state, 'gem2');
    placeGuard(guards[0], 700, 380, Math.PI / 2, 'chase');
    placeGuard(guards[1], 380, 300, 0);
    placeGuard(guards[2], 1000, 300, Math.PI / 2);
    cameras[0].angle = Math.PI / 2 + 0.2;
    cameras[1].angle = Math.PI / 2;
    cameras[2].angle = Math.PI / 2;
    state.toast = { text: 'SPOTTED! RUN!', time: 99, danger: true };
  } else if (name === 'getaway') {
    // The payoff: five pieces stolen, the getaway door open, thief slipping out.
    state.thief.x = 52;
    state.thief.y = 420;
    state.thief.facing = Math.PI;
    state.alarm = 12;
    state.cash = 920;
    state.lootTaken = 5;
    markTaken(state, 'gem1');
    markTaken(state, 'gem2');
    markTaken(state, 'gem3');
    markTaken(state, 'paint1');
    markTaken(state, 'paint2');
    placeGuard(guards[0], 800, 620, -Math.PI / 2);
    placeGuard(guards[1], 300, 650, Math.PI);
    placeGuard(guards[2], 1150, 650, -Math.PI / 2);
    cameras[0].angle = Math.PI / 2 - 0.5;
    cameras[1].angle = Math.PI / 2 + 0.4;
    cameras[2].angle = Math.PI / 2 + 0.6;
    state.toast = { text: 'GETAWAY OPEN — GO!', time: 99, danger: false };
  }
}

function placeGuard(guard, x, y, facing, mode = 'patrol') {
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.mode = mode;
  guard.seenNow = mode === 'chase';
  guard.lastSeen = mode === 'chase' ? { x: 700, y: 520 } : null;
}

function markTaken(state, id) {
  const loot = state.loot.find((l) => l.id === id);
  if (loot) loot.taken = true;
}

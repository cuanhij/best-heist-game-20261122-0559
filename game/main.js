// Midnight Vault — entrypoint. One job: own the game state and the loop.
// Wires level, guards, cameras, input, audio, HUD and rendering together:
// movement and collision, loot pickup and vault cracking, the alarm meter,
// tools, win / lose, and the ?shot= staging used for screenshots.

import {
  CAMERA_DEFS,
  EXIT,
  GUARD_DEFS,
  LOOT_DEFS,
  SPAWN,
  VIEW_H,
  VIEW_W,
  moveCircle,
  pointInShadow,
} from './level.js';
import { blindAllCameras, cameraCanSee, createCamera, updateCamera } from './cameras.js';
import { createGuard, divertNearestGuard, updateGuard } from './guards.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { TOOL_DEFS } from './hud.js';
import { applyShot } from './shots.js';

const THIEF_SPEED = 175;
const THIEF_RADIUS = 14;
const VAULT_CRACK_SECONDS = 3;
const VAULT_CRACK_RANGE = 105;
const LOOT_GRAB_RANGE = 30;
const ALARM_GUARD_RATE = 30;
const ALARM_CAMERA_RATE = 20;
const ALARM_DECAY = 10;
const ALARM_SHADOW_DECAY = 25;

export function createState() {
  return {
    screen: 'title', // title | play | win | lose
    frozen: false, // ?shot= staging: render only, no simulation
    time: 0,
    cash: 120,
    lootTaken: 0,
    loot: LOOT_DEFS.map((def) => ({ ...def, taken: false })),
    vaultProgress: 0,
    alarm: 0,
    spotted: false,
    thief: { x: SPAWN.x, y: SPAWN.y, r: THIEF_RADIUS, facing: -Math.PI / 2, disguise: 0 },
    guards: GUARD_DEFS.map((def, i) => createGuard(def, i)),
    cameras: CAMERA_DEFS.map((def) => createCamera(def)),
    empTime: 0,
    toast: null,
    moveMarker: null,
    thiefHidden: false,
  };
}

function setToast(state, text, danger = false) {
  state.toast = { text, time: 3, danger };
}

function startGame(state, audio) {
  const fresh = createState();
  Object.assign(state, fresh);
  state.screen = 'play';
  audio.ensure();
}

function useTool(state, audio, slot) {
  if (state.screen !== 'play') return;
  const tool = TOOL_DEFS[slot - 1];
  if (!tool) return;
  if (state.cash < tool.cost) {
    setToast(state, `Need $${tool.cost} for ${tool.name}`, true);
    audio.denied();
    return;
  }
  if (slot === 1) {
    const guard = divertNearestGuard(state.guards, state.thief.x, state.thief.y);
    if (!guard) {
      setToast(state, 'No guard close enough to fool', true);
      audio.denied();
      return;
    }
    state.cash -= tool.cost;
    setToast(state, `${guard.name} heard something — go!`);
    audio.tool();
  } else if (slot === 2) {
    state.cash -= tool.cost;
    state.empTime = 10;
    blindAllCameras(state.cameras, 10);
    setToast(state, 'EMP blast — cameras blind for 10s');
    audio.tool();
  } else if (slot === 3) {
    state.cash -= tool.cost;
    state.thief.disguise = 8;
    setToast(state, 'Disguise on — guards barely notice you for 8s');
    audio.tool();
  }
}

function update(state, dt, input, audio) {
  if (state.screen !== 'play' || state.frozen) return;
  state.time += dt;
  if (state.toast) state.toast.time -= dt;

  // --- thief movement: keys win over click-to-move ---
  const thief = state.thief;
  const vector = input.moveVector();
  let moved = false;
  if (vector) {
    const step = moveCircle(
      thief.x,
      thief.y,
      thief.r,
      vector.x * THIEF_SPEED * dt,
      vector.y * THIEF_SPEED * dt,
    );
    moved = step.x !== thief.x || step.y !== thief.y;
    if (moved) {
      thief.x = step.x;
      thief.y = step.y;
      thief.facing = Math.atan2(vector.y, vector.x);
      input.moveTarget = null;
      state.moveMarker = null;
    }
  } else if (input.moveTarget) {
    const dx = input.moveTarget.x - thief.x;
    const dy = input.moveTarget.y - thief.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      input.moveTarget = null;
      state.moveMarker = null;
    } else {
      const stepLen = Math.min(dist, THIEF_SPEED * dt);
      const step = moveCircle(
        thief.x,
        thief.y,
        thief.r,
        (dx / dist) * stepLen,
        (dy / dist) * stepLen,
      );
      moved = step.x !== thief.x || step.y !== thief.y;
      if (moved) {
        thief.x = step.x;
        thief.y = step.y;
        thief.facing = Math.atan2(dy, dx);
        state.moveMarker = { x: input.moveTarget.x, y: input.moveTarget.y };
      } else {
        // Walked into a wall: give up on this target.
        input.moveTarget = null;
        state.moveMarker = null;
      }
    }
  }

  // --- timers ---
  if (thief.disguise > 0) thief.disguise = Math.max(0, thief.disguise - dt);
  if (state.empTime > 0) state.empTime = Math.max(0, state.empTime - dt);

  // --- guards and cameras ---
  const disguised = thief.disguise > 0;
  for (const guard of state.guards) updateGuard(guard, dt, thief, state.alarm, disguised);
  for (const camera of state.cameras) updateCamera(camera, dt, state.time);

  // --- spotting and the alarm meter ---
  state.thiefHidden = pointInShadow(thief.x, thief.y);
  let seenByGuard = false;
  let seenByCamera = false;
  for (const guard of state.guards) if (guard.seenNow) seenByGuard = true;
  for (const camera of state.cameras) if (cameraCanSee(camera, thief)) seenByCamera = true;
  const seen = seenByGuard || seenByCamera;
  if (seen && !state.spotted) {
    setToast(state, seenByGuard ? 'SPOTTED BY A GUARD!' : 'SPOTTED BY A CAMERA!', true);
    audio.spotted();
  }
  state.spotted = seen;
  if (seenByGuard) state.alarm += ALARM_GUARD_RATE * dt;
  else if (seenByCamera) state.alarm += ALARM_CAMERA_RATE * dt;
  else state.alarm -= (state.thiefHidden ? ALARM_SHADOW_DECAY : ALARM_DECAY) * dt;
  state.alarm = Math.max(0, Math.min(100, state.alarm));

  if (state.alarm >= 100) {
    state.screen = 'lose';
    audio.bust();
    return;
  }

  // --- loot pickup ---
  for (const loot of state.loot) {
    if (loot.taken || loot.kind === 'vault') continue;
    if (Math.hypot(loot.x - thief.x, loot.y - thief.y) < LOOT_GRAB_RANGE) {
      loot.taken = true;
      state.lootTaken += 1;
      state.cash += loot.value;
      setToast(state, `${loot.label} stolen! +$${loot.value}`);
      audio.pickup();
      if (state.lootTaken === 4) setToast(state, 'GETAWAY OPEN — GO!');
    }
  }

  // --- vault cracking: stand beside the safe and hold still-ish ---
  const vault = state.loot.find((l) => l.kind === 'vault');
  const vaultCenter = { x: 1175, y: 225 };
  if (vault && !vault.taken) {
    const near = Math.hypot(vaultCenter.x - thief.x, vaultCenter.y - thief.y) < VAULT_CRACK_RANGE;
    if (near) {
      state.vaultProgress += dt / VAULT_CRACK_SECONDS;
      if (state.vaultProgress >= 1) {
        vault.taken = true;
        state.lootTaken += 1;
        state.cash += vault.value;
        setToast(state, `VAULT CRACKED! +$${vault.value}`);
        audio.vaultCrack();
        if (state.lootTaken === 4) setToast(state, 'GETAWAY OPEN — GO!');
      }
    } else {
      state.vaultProgress = Math.max(0, state.vaultProgress - dt / 2);
    }
  }

  // --- getaway ---
  if (
    state.lootTaken >= 4 &&
    thief.x >= EXIT.x &&
    thief.x <= EXIT.x + EXIT.w + 20 &&
    thief.y >= EXIT.y &&
    thief.y <= EXIT.y + EXIT.h
  ) {
    state.screen = 'win';
    audio.win();
  }
}

export function boot() {
  const canvas = document.getElementById('game');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const ctx = canvas.getContext('2d');

  const state = createState();
  const audio = createAudio();

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) applyShot(state, shot);

  const input = createInput(canvas, {
    onEnter: () => {
      audio.ensure();
      if (state.screen !== 'play') startGame(state, audio);
    },
    onRestart: () => {
      if (state.screen === 'win' || state.screen === 'lose') startGame(state, audio);
    },
    onMute: () => {
      audio.muted = !audio.muted;
    },
    onTool: (slot) => useTool(state, audio, slot),
    onPointer: () => audio.ensure(),
  });

  // Handle for automated playtests (and curious players): live state, read-only use.
  window.__mv = { state, input, audio };

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(state, dt, input, audio);
    render(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot();

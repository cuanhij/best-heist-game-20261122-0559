// Midnight Vault — rendering. One job: draw one frame of the game.
// Floor, walls, shadows, loot, exit, guards with vision cones and dotted patrol
// routes, cameras with sweeping cones, the thief, and the title / win / lose
// screens. All shapes are drawn by hand: no images, no sprites to load.

import { ROOMS, SHADOWS, WALLS, EXIT, HUD_H, pointInShadow } from './level.js';
import { GUARD_RANGE, GUARD_FOV } from './guards.js';
import { drawHud, drawToast, formatTime } from './hud.js';

function conePath(ctx, x, y, angle, range, fov) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - fov / 2, angle + fov / 2);
  ctx.closePath();
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, 1280, 800);
  drawRooms(ctx);
  drawShadows(ctx, state);
  drawExit(ctx, state);
  drawWalls(ctx);
  drawLoot(ctx, state);
  drawPatrolRoutes(ctx, state);
  drawCameraCones(ctx, state);
  drawGuardCones(ctx, state);
  drawCameras(ctx, state);
  drawGuards(ctx, state);
  drawThief(ctx, state);
  drawHud(ctx, state);
  drawToast(ctx, state);
  if (state.alarm >= 70 && state.screen === 'play') drawDangerVignette(ctx, state.alarm);
  if (state.screen === 'title') drawTitle(ctx);
  if (state.screen === 'win') drawEndScreen(ctx, state, true);
  if (state.screen === 'lose') drawEndScreen(ctx, state, false);
}

function drawRooms(ctx) {
  for (const room of ROOMS) {
    ctx.fillStyle = room.floor;
    ctx.fillRect(room.x, room.y, room.w, room.h);
    // Faint checker tiles so the floor reads as a floor.
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    const tile = 64;
    for (let y = room.y; y < room.y + room.h; y += tile) {
      for (let x = room.x; x < room.x + room.w; x += tile) {
        const odd = (Math.floor((x - room.x) / tile) + Math.floor((y - room.y) / tile)) % 2 === 0;
        if (odd) ctx.fillRect(x, y, tile, tile);
      }
    }
    ctx.fillStyle = 'rgba(232,236,245,0.35)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(room.name.toUpperCase(), room.x + 14, room.y + 12);
  }
}

function drawShadows(ctx, state) {
  for (const s of SHADOWS) {
    ctx.fillStyle = 'rgba(2, 3, 8, 0.72)';
    roundRect(ctx, s.x, s.y, s.w, s.h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(126, 231, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  if (pointInShadow(state.thief.x, state.thief.y)) {
    ctx.fillStyle = '#7ee7ff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('HIDDEN', state.thief.x, state.thief.y + state.thief.r + 6);
  }
}

function drawExit(ctx, state) {
  const open = state.lootTaken >= 4;
  const x = EXIT.x;
  const y = EXIT.y;
  ctx.fillStyle = open ? '#1f7a3d' : '#3a2c14';
  ctx.fillRect(x - 2, y, 20, EXIT.h);
  ctx.fillStyle = open ? '#37d67a' : '#8a6d2f';
  ctx.fillRect(x + 4, y + 6, 8, EXIT.h - 12);
  if (open) {
    // Pulsing green glow spilling from the open door.
    const pulse = 0.25 + 0.15 * Math.sin(state.time * 4);
    ctx.fillStyle = `rgba(55, 214, 122, ${pulse})`;
    ctx.fillRect(16, y, 60, EXIT.h);
  }
  // Label sits below the door so the thief never covers it.
  const label = open ? 'GETAWAY ◀' : `LOCKED · NEED ${4 - state.lootTaken} MORE LOOT`;
  ctx.font = 'bold 13px sans-serif';
  const labelW = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(8, 10, 18, 0.85)';
  ctx.fillRect(20, y + EXIT.h + 6, labelW + 12, 22);
  ctx.fillStyle = open ? '#b8ffd2' : '#ffd166';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 26, y + EXIT.h + 17);
}

function drawLoot(ctx, state) {
  for (const loot of state.loot) {
    if (loot.taken) continue;
    const bob = Math.sin(state.time * 2.5 + loot.x) * 2;
    if (loot.kind === 'gem') {
      ctx.save();
      ctx.translate(loot.x, loot.y + bob);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#7ee7ff';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.strokeStyle = '#e8fbff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-9, -9, 18, 18);
      ctx.restore();
      drawLootLabel(ctx, loot);
    } else if (loot.kind === 'painting') {
      ctx.fillStyle = '#8a6d2f';
      ctx.fillRect(loot.x - 34, loot.y - 4, 68, 26);
      ctx.fillStyle = '#c98a4b';
      ctx.fillRect(loot.x - 29, loot.y + 1, 58, 16);
      ctx.fillStyle = '#5b3a1e';
      ctx.beginPath();
      ctx.arc(loot.x - 8, loot.y + 9, 6, 0, Math.PI * 2);
      ctx.fill();
      drawLootLabel(ctx, loot);
    }
  }
  // The vault safe: drawn as part of the furniture, with a crack ring.
  const vault = state.loot.find((l) => l.kind === 'vault');
  ctx.fillStyle = '#3d4a63';
  ctx.fillRect(1120, 180, 110, 90);
  ctx.fillStyle = '#55688a';
  ctx.fillRect(1126, 186, 98, 78);
  ctx.fillStyle = '#1a2030';
  ctx.beginPath();
  ctx.arc(1175, 225, 22, 0, Math.PI * 2);
  ctx.fill();
  // Faint track ring, then the gold crack-progress arc (only once it moves).
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(1175, 225, 22, 0, Math.PI * 2);
  ctx.stroke();
  if (state.vaultProgress > 0.005) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(1175, 225, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.vaultProgress);
    ctx.stroke();
  }
  if (vault && !vault.taken) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('CRACK THE VAULT · $500', 1256, 278);
  } else if (vault && vault.taken) {
    ctx.fillStyle = '#37d67a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('CRACKED OPEN', 1175, 278);
  }
}

function drawLootLabel(ctx, loot) {
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${loot.label} · $${loot.value}`, loot.x, loot.y + 20);
}

function drawPatrolRoutes(ctx, state) {
  ctx.save();
  ctx.setLineDash([2, 8]);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const guard of state.guards) {
    ctx.strokeStyle = 'rgba(232, 236, 245, 0.35)';
    ctx.beginPath();
    const wps = guard.waypoints;
    ctx.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) ctx.lineTo(wps[i].x, wps[i].y);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawCameraCones(ctx, state) {
  for (const cam of state.cameras) {
    if (cam.blind > 0) continue;
    ctx.fillStyle = 'rgba(255, 59, 48, 0.16)';
    conePath(ctx, cam.x, cam.y, cam.angle, cam.range, cam.fov);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 59, 48, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawGuardCones(ctx, state) {
  for (const guard of state.guards) {
    const chasing = guard.mode === 'chase';
    ctx.fillStyle = chasing ? 'rgba(255, 59, 48, 0.20)' : 'rgba(255, 176, 32, 0.15)';
    conePath(ctx, guard.x, guard.y, guard.facing, GUARD_RANGE, GUARD_FOV);
    ctx.fill();
    ctx.strokeStyle = chasing ? 'rgba(255, 59, 48, 0.5)' : 'rgba(255, 176, 32, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = '#11141d';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#2c3a5c';
    ctx.fillRect(w.x, w.y, w.w, 3);
  }
}

function drawCameras(ctx, state) {
  for (const cam of state.cameras) {
    ctx.fillStyle = '#202634';
    ctx.fillRect(cam.x - 11, cam.y - 6, 22, 12);
    if (cam.blind > 0) {
      // EMP: sparks instead of a lens.
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✕', cam.x, cam.y + 12);
      continue;
    }
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuards(ctx, state) {
  for (const guard of state.guards) {
    // Body.
    ctx.fillStyle = guard.mode === 'chase' ? '#7a1f1a' : '#2e3d5c';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, guard.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8b93a7';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing wedge / cap brim.
    const fx = guard.x + Math.cos(guard.facing) * 12;
    const fy = guard.y + Math.sin(guard.facing) * 12;
    ctx.fillStyle = '#d7dce8';
    ctx.beginPath();
    ctx.arc(fx, fy, 4, 0, Math.PI * 2);
    ctx.fill();
    // Name tag.
    ctx.fillStyle = '#c7cede';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(guard.name.toUpperCase(), guard.x, guard.y - guard.r - 4);
    // "!" when chasing, "?" when investigating.
    if (guard.mode === 'chase' || guard.mode === 'investigate') {
      ctx.fillStyle = guard.mode === 'chase' ? '#ff3b30' : '#ffd166';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(guard.mode === 'chase' ? '!' : '?', guard.x, guard.y - guard.r - 16);
    }
  }
}

function drawThief(ctx, state) {
  const t = state.thief;
  // Soft shadow under the thief.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(t.x, t.y + 10, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded figure: dark cloak, gold trim, pale face direction dot.
  ctx.fillStyle = '#14101f';
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.stroke();
  const fx = t.x + Math.cos(t.facing) * 9;
  const fy = t.y + Math.sin(t.facing) * 9;
  ctx.fillStyle = '#f2e6c9';
  ctx.beginPath();
  ctx.arc(fx, fy, 4, 0, Math.PI * 2);
  ctx.fill();
  // Disguise shimmer.
  if (t.disguise > 0) {
    ctx.strokeStyle = 'rgba(126, 231, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Click-to-move target marker.
  if (state.moveMarker) {
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.moveMarker.x, state.moveMarker.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(state.moveMarker.x - 12, state.moveMarker.y);
    ctx.lineTo(state.moveMarker.x + 12, state.moveMarker.y);
    ctx.moveTo(state.moveMarker.x, state.moveMarker.y - 12);
    ctx.lineTo(state.moveMarker.x, state.moveMarker.y + 12);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('YOU', t.x, t.y - t.r - 4);
}

function drawDangerVignette(ctx, alarm) {
  const strength = 0.12 + 0.2 * ((alarm - 70) / 30);
  const grad = ctx.createRadialGradient(640, 420, 260, 640, 420, 720);
  grad.addColorStop(0, 'rgba(255, 59, 48, 0)');
  grad.addColorStop(1, `rgba(255, 59, 48, ${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, HUD_H, 1280, 800 - HUD_H);
}

function dimScreen(ctx) {
  ctx.fillStyle = 'rgba(4, 6, 12, 0.78)';
  ctx.fillRect(0, 0, 1280, 800);
}

function drawTitle(ctx) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText('MIDNIGHT VAULT', 640, 260);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = '24px sans-serif';
  ctx.fillText('A top-down heist in three rooms. Steal 4 pieces. Slip out alive.', 640, 312);
  ctx.fillStyle = '#8b93a7';
  ctx.font = '18px sans-serif';
  ctx.fillText('WASD / arrows or click to move  ·  1 noise-maker $50  ·  2 EMP $100  ·  3 disguise $150', 640, 380);
  ctx.fillText('Hide in the dark patches. Read the cones before you move. The vault pays $500.', 640, 410);
  ctx.fillStyle = '#37d67a';
  ctx.font = 'bold 26px sans-serif';
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 350);
  ctx.globalAlpha = pulse;
  ctx.fillText('Press ENTER to begin', 640, 490);
  ctx.globalAlpha = 1;
}

function drawEndScreen(ctx, state, won) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  if (won) {
    ctx.fillStyle = '#37d67a';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText('CLEAN GETAWAY!', 640, 280);
    ctx.fillStyle = '#e8ecf5';
    ctx.font = '24px sans-serif';
    ctx.fillText(`You slipped out with ${state.lootTaken} pieces of loot.`, 640, 340);
  } else {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText('BUSTED!', 640, 280);
    ctx.fillStyle = '#e8ecf5';
    ctx.font = '24px sans-serif';
    ctx.fillText('The alarm hit 100 and the guards closed in.', 640, 340);
  }
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(
    `SCORE $${state.cash}  ·  LOOT ${state.lootTaken}/6  ·  TIME ${formatTime(state.time)}`,
    640,
    410,
  );
  ctx.fillStyle = '#8b93a7';
  ctx.font = '18px sans-serif';
  ctx.fillText('Press ENTER or R to run it again', 640, 470);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

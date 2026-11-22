// Midnight Vault — HUD. One job: draw the top bar and toast messages.
// Alarm meter, cash, loot count, timer, the three tools with their prices, and
// the current objective. Everything is canvas text and shapes: no DOM, no fonts
// to download.

export const TOOL_DEFS = [
  { key: '1', name: 'NOISE', cost: 50 },
  { key: '2', name: 'EMP', cost: 100 },
  { key: '3', name: 'DISGUISE', cost: 150 },
];

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function drawHud(ctx, state) {
  // Bar.
  ctx.fillStyle = '#0b0e16';
  ctx.fillRect(0, 0, 1280, 64);
  ctx.fillStyle = '#2a3350';
  ctx.fillRect(0, 63, 1280, 1);

  // Alarm meter.
  const alarm = state.alarm;
  const alarmColor = alarm >= 70 ? '#ff3b30' : alarm >= 40 ? '#ffb020' : '#37d67a';
  ctx.fillStyle = '#8b93a7';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ALARM', 18, 20);
  ctx.fillStyle = '#1a2030';
  ctx.fillRect(80, 10, 220, 20);
  ctx.fillStyle = alarmColor;
  ctx.fillRect(82, 12, Math.max(0, (alarm / 100) * 216), 16);
  ctx.strokeStyle = '#4a5578';
  ctx.lineWidth = 1;
  ctx.strokeRect(80.5, 10.5, 220, 20);
  // Chase threshold tick at 70.
  ctx.fillStyle = '#ff3b30';
  ctx.fillRect(80 + 0.7 * 220 - 1, 8, 2, 24);
  ctx.fillStyle = alarmColor;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${Math.round(alarm)}`, 308, 20);
  ctx.fillStyle = '#8b93a7';
  ctx.font = '12px sans-serif';
  ctx.fillText(alarm >= 70 ? 'CHASE!' : alarm >= 40 ? 'suspicious…' : 'quiet', 18, 48);

  // Cash, loot, timer.
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`$${state.cash}`, 430, 22);
  ctx.fillStyle = '#8b93a7';
  ctx.font = '12px sans-serif';
  ctx.fillText('CASH', 430, 46);

  ctx.fillStyle = '#7ee7ff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`LOOT ${state.lootTaken}/6`, 560, 22);
  ctx.fillStyle = '#8b93a7';
  ctx.font = '12px sans-serif';
  ctx.fillText(state.lootTaken >= 4 ? 'getaway open!' : 'need 4 to escape', 560, 46);

  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(formatTime(state.time), 700, 22);
  ctx.fillStyle = '#8b93a7';
  ctx.font = '12px sans-serif';
  ctx.fillText('TIME', 700, 46);

  // Tools.
  let tx = 830;
  ctx.font = 'bold 13px sans-serif';
  for (const tool of TOOL_DEFS) {
    const afford = state.cash >= tool.cost;
    const active =
      (tool.key === '2' && state.empTime > 0) || (tool.key === '3' && state.thief.disguise > 0);
    ctx.fillStyle = active ? '#37d67a' : afford ? '#e8ecf5' : '#565e73';
    ctx.fillText(`[${tool.key}] ${tool.name} $${tool.cost}`, tx, 22);
    tx += 150;
  }
  ctx.fillStyle = '#8b93a7';
  ctx.font = '12px sans-serif';
  ctx.fillText('M mute', 830, 46);
}

// A short-lived message near the bottom of the screen.
export function drawToast(ctx, state) {
  const toast = state.toast;
  if (!toast || toast.time <= 0) return;
  const alpha = Math.min(1, toast.time / 0.5);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 20px sans-serif';
  const w = ctx.measureText(toast.text).width + 36;
  const x = (1280 - w) / 2;
  const y = 716;
  ctx.fillStyle = 'rgba(8, 10, 18, 0.85)';
  ctx.fillRect(x, y, w, 40);
  ctx.strokeStyle = toast.danger ? '#ff3b30' : '#ffd166';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, 38);
  ctx.fillStyle = toast.danger ? '#ff6b61' : '#ffd166';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(toast.text, 640, y + 21);
  ctx.restore();
}

// Midnight Vault — input. One job: turn keyboard and mouse into game intents.
// WASD / arrows move, click sets a walk target, Enter starts / restarts,
// R restarts, 1/2/3 fire tools, M mutes. Nothing here knows game rules.

export function createInput(canvas, hooks) {
  const keys = new Set();
  const input = {
    keys,
    moveTarget: null, // {x, y} in canvas pixels, or null
    clickPoint: null, // last click, consumed by the game each frame

    // Unit vector from held movement keys, or null when none are held.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (x === 0 && y === 0) return null;
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
  };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === 'Enter') hooks.onEnter?.();
    if (event.code === 'KeyR') hooks.onRestart?.();
    if (event.code === 'KeyM') hooks.onMute?.();
    if (event.code === 'Digit1') hooks.onTool?.(1);
    if (event.code === 'Digit2') hooks.onTool?.(2);
    if (event.code === 'Digit3') hooks.onTool?.(3);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    input.clickPoint = point;
    input.moveTarget = point;
    hooks.onPointer?.(point);
  });

  return input;
}

export function createInput(canvas, getViewport) {
  const input = { left: false, right: false, up: false, down: false, jump: false, flip: false, jumpPressed: false };
  const keys = new Set();
  let touches = {};
  const touchInput = { left: false, right: false, jump: false };

  function updateTouchState() {
    const { vw, vh } = getViewport();
    touchInput.left = false;
    touchInput.right = false;
    touchInput.jump = false;
    const ids = Object.keys(touches);
    for (let i = 0; i < ids.length; i++) {
      const t = touches[ids[i]];
      const x = t.x; const y = t.y;
      if (y < vh * 0.35) touchInput.jump = true; else if (x < vw * 0.5) touchInput.left = true; else touchInput.right = true;
    }
  }

  function handleTouch(e) {
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const x = t.clientX - rect.left; const y = t.clientY - rect.top;
      touches[t.identifier] = { x, y };
    }
    updateTouchState();
  }

  function handleTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      delete touches[t.identifier];
    }
    updateTouchState();
  }

  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (['arrowleft', 'a'].includes(k)) keys.add('left');
    if (['arrowright', 'd'].includes(k)) keys.add('right');
    if (['arrowup', 'w'].includes(k)) keys.add('up');
    if (['arrowdown', 's'].includes(k)) keys.add('down');
    if (['g'].includes(k)) keys.add('flip');
    if ([' ', 'spacebar'].includes(k)) keys.add('jump');
  }

  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (['arrowleft', 'a'].includes(k)) keys.delete('left');
    if (['arrowright', 'd'].includes(k)) keys.delete('right');
    if (['arrowup', 'w'].includes(k)) keys.delete('up');
    if (['arrowdown', 's'].includes(k)) keys.delete('down');
    if (['g'].includes(k)) keys.delete('flip');
    if ([' ', 'spacebar'].includes(k)) keys.delete('jump');
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('touchstart', e => { handleTouch(e); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', e => { handleTouch(e); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchend', e => { handleTouchEnd(e); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchcancel', e => { handleTouchEnd(e); e.preventDefault(); }, { passive: false });

  function update() {
    input.left = !!(keys.has('left') || touchInput.left);
    input.right = !!(keys.has('right') || touchInput.right);
    input.up = !!keys.has('up');
    input.down = !!keys.has('down');
    input.jump = !!(keys.has('jump') || touchInput.jump);
    input.flip = !!keys.has('flip');
  }

  function reset() {
    keys.clear();
    touches = {};
    touchInput.left = false; touchInput.right = false; touchInput.jump = false;
    input.left = false; input.right = false; input.up = false; input.down = false; input.jump = false; input.flip = false; input.jumpPressed = false;
  }

  return { input, update, reset };
}

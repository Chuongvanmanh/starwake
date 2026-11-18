/** Keyboard and pointer state for Starwake. */
export function createInput(target) {
  const keys = new Set();
  const pointer = { x: 0, y: 0, down: false, clicked: false };
  let anyKey = false;

  const onKey = (e, down) => {
    const k = e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','enter','escape','p','r'].includes(k) || e.code === 'Space') {
      e.preventDefault();
    }
    if (down) {
      keys.add(k);
      if (e.code === 'Space') keys.add(' ');
      anyKey = true;
    } else {
      keys.delete(k);
      if (e.code === 'Space') keys.delete(' ');
    }
  };

  const onPointer = (e, down) => {
    const rect = target.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * target.width;
    pointer.y = ((e.clientY - rect.top) / rect.height) * target.height;
    if (down === true) {
      pointer.down = true;
      pointer.clicked = true;
      anyKey = true;
    } else if (down === false) {
      pointer.down = false;
    }
  };

  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));
  target.addEventListener('pointerdown', (e) => onPointer(e, true));
  target.addEventListener('pointerup', (e) => onPointer(e, false));
  target.addEventListener('pointermove', (e) => onPointer(e, null));
  window.addEventListener('blur', () => { keys.clear(); pointer.down = false; });

  return {
    keys,
    pointer,
    pressed(name) { return keys.has(name); },
    consumeClick() {
      const c = pointer.clicked;
      pointer.clicked = false;
      return c;
    },
    consumeAny() {
      const a = anyKey;
      anyKey = false;
      return a;
    },
    axis() {
      let x = 0, y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x && y) { const inv = 1 / Math.SQRT2; x *= inv; y *= inv; }
      return { x, y };
    },
  };
}

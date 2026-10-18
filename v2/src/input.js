// Input: keyboard, gamepad and touch merged into one per-frame control state.
const KEYS = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  jump: ['Space', 'KeyW', 'ArrowUp', 'KeyK'],
  action: ['KeyE', 'ShiftLeft', 'ShiftRight', 'KeyJ', 'Enter'],
  swap: ['Tab', 'KeyQ'],
  pause: ['Escape', 'KeyP'],
  skip: ['Space', 'Enter', 'Escape'],
};

export class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.touch = { x: 0, down: false, jump: false, action: false, swap: false, pause: false };
    this.touchPressed = new Set();
    this.padPrev = {};
    this.enabled = true;
    this.lastDevice = 'keys';
    this.isTouch = matchMedia('(pointer: coarse)').matches;
    addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
      this.lastDevice = 'keys';
    });
    addEventListener('keyup', (e) => this.down.delete(e.code));
    addEventListener('blur', () => this.down.clear());
  }

  any(names) { return names.some((k) => this.down.has(k)); }
  anyPressed(names) { return names.some((k) => this.pressed.has(k)); }

  poll() {
    const s = { x: 0, up: false, down: false, jump: false, jumpPressed: false, action: false, actionPressed: false, swapPressed: false, pausePressed: false, skip: false, any: false };
    if (this.any(KEYS.left)) s.x -= 1;
    if (this.any(KEYS.right)) s.x += 1;
    s.up = this.any(KEYS.up);
    s.down = this.any(KEYS.down);
    s.jump = this.any(KEYS.jump);
    s.jumpPressed = this.anyPressed(KEYS.jump);
    s.action = this.any(KEYS.action);
    s.actionPressed = this.anyPressed(KEYS.action);
    s.swapPressed = this.anyPressed(KEYS.swap);
    s.pausePressed = this.anyPressed(KEYS.pause);
    s.skip = this.any(KEYS.skip);
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const b = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
      const prev = this.padPrev[p.index] || {};
      const now = { a: b(0), b: b(1), x: b(2), y: b(3), rb: b(5), lb: b(4), start: b(9), back: b(8) };
      const ax = Math.abs(p.axes[0]) > 0.3 ? p.axes[0] : 0;
      let px = ax + (b(15) ? 1 : 0) - (b(14) ? 1 : 0);
      if (px !== 0 || Object.values(now).some(Boolean)) this.lastDevice = 'pad';
      s.x += Math.max(-1, Math.min(1, px));
      s.down = s.down || p.axes[1] > 0.55 || b(13);
      s.up = s.up || p.axes[1] < -0.55 || b(12);
      s.jump = s.jump || now.a;
      s.jumpPressed = s.jumpPressed || (now.a && !prev.a);
      s.action = s.action || now.x || now.b;
      s.actionPressed = s.actionPressed || (now.x && !prev.x) || (now.b && !prev.b);
      s.swapPressed = s.swapPressed || (now.y && !prev.y) || (now.rb && !prev.rb) || (now.lb && !prev.lb);
      s.pausePressed = s.pausePressed || (now.start && !prev.start);
      s.skip = s.skip || now.a || now.start;
      this.padPrev[p.index] = now;
    }
    const t = this.touch;
    if (t.x || t.down || t.jump || t.action) this.lastDevice = 'touch';
    s.x += t.x;
    s.down = s.down || t.down;
    s.jump = s.jump || t.jump;
    s.action = s.action || t.action;
    s.jumpPressed = s.jumpPressed || this.touchPressed.has('jump');
    s.actionPressed = s.actionPressed || this.touchPressed.has('action');
    s.swapPressed = s.swapPressed || this.touchPressed.has('swap');
    s.pausePressed = s.pausePressed || this.touchPressed.has('pause');
    s.skip = s.skip || t.jump;
    s.x = Math.max(-1, Math.min(1, s.x));
    s.any = s.x !== 0 || s.jump || s.action || s.down;
    this.pressed.clear();
    this.touchPressed.clear();
    if (!this.enabled) return { x: 0, up: false, down: false, jump: false, jumpPressed: false, action: false, actionPressed: false, swapPressed: false, pausePressed: s.pausePressed, skip: s.skip, any: false };
    return s;
  }

  mountTouch(root) {
    root.innerHTML = `
      <div class="t-stick"><div class="t-knob"></div></div>
      <div class="t-btns">
        <button class="t-btn t-swap" data-k="swap" aria-label="Switch character">⇄</button>
        <button class="t-btn t-act" data-k="action" aria-label="Action">✦</button>
        <button class="t-btn t-jump" data-k="jump" aria-label="Jump">↑</button>
      </div>
      <button class="t-pause" data-k="pause" aria-label="Pause">II</button>`;
    const stick = root.querySelector('.t-stick');
    const knob = root.querySelector('.t-knob');
    let sid = null, ox = 0, oy = 0;
    const setKnob = (dx, dy) => { knob.style.transform = `translate(${dx}px, ${dy}px)`; };
    stick.addEventListener('pointerdown', (e) => {
      sid = e.pointerId; stick.setPointerCapture(sid);
      const r = stick.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2;
      move(e);
    });
    const move = (e) => {
      if (e.pointerId !== sid) return;
      let dx = e.clientX - ox, dy = e.clientY - oy;
      const l = Math.hypot(dx, dy), m = 46;
      if (l > m) { dx *= m / l; dy *= m / l; }
      setKnob(dx, dy);
      this.touch.x = Math.abs(dx) > 10 ? dx / m : 0;
      this.touch.down = dy > 26;
    };
    stick.addEventListener('pointermove', move);
    const end = (e) => { if (e.pointerId !== sid) return; sid = null; this.touch.x = 0; this.touch.down = false; setKnob(0, 0); };
    stick.addEventListener('pointerup', end);
    stick.addEventListener('pointercancel', end);
    root.querySelectorAll('[data-k]').forEach((b) => {
      const k = b.dataset.k;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.touch[k] = true; this.touchPressed.add(k); b.classList.add('on'); });
      const up = () => { this.touch[k] = false; b.classList.remove('on'); };
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('pointerleave', up);
    });
  }
}

// Story: skippable scripted scenes that move the camera and puppeteer local characters.
import { INTRO } from './narration.js';
export class Story {
  constructor(game, world) {
    this.g = game;
    this.w = world;
    this.skipping = false;
    this.running = false;
    this.holdSkip = 0;
  }

  async run(fn) {
    if (!fn) return;
    this.running = true;
    this.skipping = false;
    this.lastCam = null;
    this.g.ui.letterbox(true);
    this.g.input.enabled = true;
    try { await fn(this); } catch (e) { if (e !== 'skip') console.error(e); }
    for (const c of this.w.chars) if (c.state === 'script') { c.state = 'walk'; c.script = null; }
    this.lastCam = this.w.cam.story;
    this.w.cam.story = null;
    this.g.ui.letterbox(false);
    this.running = false;
  }

  update(dt, inp) {
    if (!this.running) return;
    if (inp.skip) this.holdSkip += dt; else this.holdSkip = Math.max(0, this.holdSkip - dt * 2);
    this.g.ui.skipProgress(this.holdSkip / 0.8);
    if (this.holdSkip > 0.8 && !this.skipping) { this.skipping = true; this.holdSkip = 0; this.g.ui.skipProgress(0); }
  }

  wait(s) {
    if (this.skipping) return Promise.resolve();
    return new Promise((res) => {
      const t0 = this.w.time;
      const chk = () => { if (this.skipping || this.w.time - t0 >= s || this.g.world !== this.w) res(); else requestAnimationFrame(chk); };
      chk();
    });
  }

  cam(x, y, dist, yOff = 0) { this.w.cam.story = { x, y, dist, yOff }; }
  cut(x, y, dist, yOff = 0) { this.cam(x, y, dist, yOff); this.w.cam.x = x; this.w.cam.y = y + yOff; this.w.cam.dist = dist; }
  free() { this.w.cam.story = null; }

  ch(kind) { return this.w.charByKind(kind); }

  async walk(kind, x, speed = 0.65, face) {
    const c = this.ch(kind);
    if (!c || c.puppet || this.g.world !== this.w) return;
    c.state = 'script';
    c.script = { to: x, speed, face };
    if (this.skipping) { c.pos.x = x; c.prev.x = x; c.syncCol(); return; }
    await new Promise((res) => {
      const t0 = this.w.time;
      const chk = () => {
        if (this.g.world !== this.w) { res(); return; }
        if (this.skipping) { c.pos.x = x; c.prev.x = x; c.syncCol(); res(); return; }
        if (Math.abs(c.pos.x - x) < 0.12 || this.w.time - t0 > 12 || this.g.world !== this.w) res(); else requestAnimationFrame(chk);
      };
      chk();
    });
    if (face) c.face = face;
  }

  hold(kind, face) {
    const c = this.ch(kind);
    if (!c || c.puppet || this.g.world !== this.w) return;
    c.state = 'script';
    c.script = { to: undefined };
    if (face) c.face = face;
  }

  jump(kind) {
    const c = this.ch(kind);
    if (!c || c.puppet) return;
    if (c.state !== 'script') { c.state = 'script'; c.script = {}; }
    c.script.jump = true;
  }

  face(kind, dir) { const c = this.ch(kind); if (c) c.face = dir; }

  hop(kind) { const c = this.ch(kind); if (c) c.anim.squashV -= 9; }

  release(kind) {
    const c = this.ch(kind);
    if (c && c.state === 'script') { c.state = 'walk'; c.script = null; }
  }

  title(main, sub, dur) {
    if (this.skipping) return;
    this.g.ui.title(main, sub, dur);
    if (this.g.narrator && INTRO[this.g.chapter] && main !== 'Cutlery') this.g.narrator.say(INTRO[this.g.chapter], { first: true });
  }
  sfx(name, vol = 1) { this.g.audio.sfx(name, vol, 0); }
  music(theme) { this.g.audio.startMusic(theme); }
  intensity(v) { this.g.audio.setIntensity(v); }
  async fade(on, ms = 900) { await this.g.ui.fade(on, this.skipping ? 1 : ms); }
}

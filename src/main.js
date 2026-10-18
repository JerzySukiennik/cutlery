// Cutlery entry: boot, game loop, the house, solo and online chapter flow.
import { initPhysics } from './physics.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { UI, nextChapter, trackOf } from './ui.js';
import { Hub } from './hub.js';
import { World } from './world.js';
import { Story } from './story.js';
import { Net } from './net.js';
import { NOINPUT } from './characters.js';
import { LEVELS } from './levels/index.js';

const STEP = 1 / 60;
const params = new URLSearchParams(location.search);

class Game {
  constructor() {
    this.renderer = new Renderer(document.getElementById('c'));
    this.input = new Input();
    this.audio = new Audio();
    this.ui = new UI(this);
    this.state = 'loading';
    this.world = null;
    this.story = null;
    this.active = null;
    this.net = null;
    this.hub = null;
    this.chapter = 0;
    this.acc = 0;
    this.last = performance.now();
    this.pend = { jumpPressed: false, actionPressed: false, swapPressed: false };
    this.paused = false;
    this.ending = false;
    this.thermoShow = 0;
  }

  async boot() {
    this.ui.progress(0.05, 'setting the table');
    await initPhysics();
    this.ui.progress(0.2, 'tuning the piano');
    try { await this.audio.init((p) => this.ui.progress(0.2 + p * 0.7, 'tuning the piano')); } catch (e) { console.warn('audio', e); }
    this.ui.progress(0.95, 'warming the kitchen');
    if (this.input.isTouch) { this.input.mountTouch(document.getElementById('touch')); document.body.classList.add('touch'); }
    requestAnimationFrame((t) => this.loop(t));
    const legacy = { 1: 'b1', 2: 'd1', 3: 't1' };
    const ch = legacy[params.get('ch')] || params.get('ch');
    if (ch && LEVELS[ch] && ch !== 'hub') { this.ui.hideLoading(); this.startSolo(ch, { skip: params.has('skip'), cp: +params.get('cp') || 0 }); }
    else { await this.toHub(); setTimeout(() => this.ui.hideLoading(), 300); }
  }

  loadWorld(def, opts) {
    if (this.world) { this.world.dispose(); this.world = null; }
    this.world = new World(this, def, opts);
    this.story = new Story(this, this.world);
    this.world.updateCamera(1, this.world.chars[0], true);
    const R = this.renderer;
    R.dof.aperture = def.aperture ?? 1.9;
    R.grade.warmth = def.warmth ?? 0.6;
    R.sun.intensity = def.sun ?? 3.4;
    R.sun.color.set(def.sunColor || '#ffd09a');
    R.fill.intensity = def.fill ?? 0.45;
    R.grade.vignette = def.vignette ?? 0.9;
    R.hemi.intensity = def.hemi ?? 0.22;
    R.scene.environmentIntensity = def.env ?? 0.26;
    if (def.sunDir) R.sunDir.set(...def.sunDir).normalize();
    R.scene.background.set(def.bg || '#2a1d14');
    this.acc = 0;
    return this.world;
  }

  async toHub(o = {}) {
    this.leaveNetQuiet();
    if (this.hub) { const h = this.hub; this.hub = null; await h.dispose(); }
    this.state = 'entry';
    this.chapter = 'hub';
    this.paused = false;
    this.ending = false;
    this.active = null;
    this.input.enabled = true;
    document.body.classList.remove('playing', 'ended');
    this.loadWorld(LEVELS.hub, {});
    this.hub = new Hub(this, this.world);
    this.ui.letterbox(false);
    this.ui.clearHint();
    this.audio.startMusic('menu');
    this.audio.ambience('quiet');
    this.audio.setIntensity(0.5);
    this.hub.connect();
    if (o.at && this.ui.kind) this.enterHub(this.ui.kind, o.at);
    else {
      this.world.cam.story = { ...LEVELS.hub.wide };
      this.world.updateCamera(1, null, true);
      this.ui.setHUD(this);
      this.ui.showEntry();
    }
  }

  enterHub(kind, at) {
    if (!this.hub) return;
    this.ui.hideAll();
    this.ui.setKind(kind);
    this.active = this.hub.spawnLocal(kind, at);
    this.world.cam.story = null;
    if (at) this.world.updateCamera(1, this.active, true);
    this.state = 'play';
    document.body.classList.add('playing');
    this.ui.setHUD(this);
  }

  changeCharacter() {
    if (!this.hub) return;
    this.hub.despawnLocal();
    this.active = null;
    this.state = 'entry';
    document.body.classList.remove('playing');
    this.world.cam.story = { ...LEVELS.hub.wide };
    this.ui.setHUD(this);
    this.ui.showEntry();
  }

  chooseActive() {
    const w = this.world;
    const locals = w.localChars();
    const pref = LEVELS[this.chapter] && LEVELS[this.chapter].lead;
    this.active = locals.find((c) => c.kind === pref) || locals[0] || null;
  }

  async startSolo(ch, o = {}) {
    this.leaveNetQuiet();
    this.ui.hideAll();
    await this.ui.fade(true, 500);
    if (this.hub) { const h = this.hub; this.hub = null; h.dispose(); }
    this.chapter = ch;
    const def = LEVELS[ch];
    this.loadWorld(def, {});
    if (o.cp) { this.world.flags.cp = o.cp; for (const c of this.world.chars) { const sp = this.world.spawnFor(c.kind); c.place(sp.x, sp.y, sp.face || 1); if (c.kind === 'butter' && sp.temp !== undefined) c.temp = sp.temp; } }
    this.begin(o.skip || o.cp);
  }

  async begin(skipIntro) {
    const def = LEVELS[this.chapter];
    this.chooseActive();
    this.state = 'play';
    this.ending = false;
    this.paused = false;
    document.body.classList.remove('ended');
    document.body.classList.add('playing');
    this.ui.setHUD(this);
    this.world.updateCamera(1, this.active, true);
    this.audio.startMusic(def.music || 'ch1');
    this.audio.ambience(def.ambience || 'kitchen');
    await this.ui.fade(false, 900);
    if (!skipIntro && def.intro) await this.story.run(def.intro);
    else if (def.introSkipped) def.introSkipped(this.story);
  }

  swap() {
    const locals = this.world.localChars().filter((c) => c.state !== 'respawn');
    if (locals.length < 2) return;
    const i = locals.indexOf(this.active);
    this.active = locals[(i + 1) % locals.length];
    this.audio.ui('ui_toggle');
    this.ui.setHUD(this);
    this.ui.clearHint();
  }

  onOwnersChanged() {
    if (!this.world) return;
    if (!this.active || this.active.puppet) this.chooseActive();
    this.ui.setHUD(this);
  }

  nickOf(kind) {
    if (!this.net) return '';
    const o = (this.net.meta.owners || {})[kind];
    const p = this.net.players[o];
    return p ? p.nick : '';
  }

  pauseGame() {
    if (this.state !== 'play' || this.ending) return;
    this.paused = true;
    this.ui.showPause();
    this.audio.ui('ui_open');
  }

  resume() {
    this.paused = false;
    this.ui.hideAll();
    this.audio.ui('ui_close');
  }

  respawnActive() { if (this.active && this.active.state !== 'respawn') this.active.die(); }

  restartChapter() { this.startSolo(this.chapter); }

  async backToHouse() {
    const at = this.chapter;
    this.leaveNetQuiet();
    await this.ui.fade(true, 400);
    await this.toHub({ at });
    this.ui.fade(false, 600);
  }

  async endChapter() {
    if (this.ending) return;
    this.ending = true;
    const def = LEVELS[this.chapter];
    this.ui.clearHint();
    if (def.outro) await this.story.run(def.outro);
    this.ui.markDone(this.chapter);
    const next = nextChapter(this.chapter);
    this.input.enabled = true;
    this.audio.setIntensity(0.4);
    const cs = this.story.lastCam;
    if (cs) this.world.cam.story = { ...cs, yOff: (cs.yOff || 0) - cs.dist * 0.2 };
    this.ui.showEnd(this.chapter, next ? next.id : null);
  }

  afterEnd(next) {
    if (this.net) {
      if (next && this.net.isHost) this.net.startGame(trackOf(next).chars, next);
      return;
    }
    if (next) this.startSolo(next);
    else this.backToHouse();
  }

  netError(e) {
    const m = String(e && e.message || e);
    if (/permission|PERMISSION_DENIED/i.test(m)) return 'The online server refused the connection.';
    if (/timed out|network|Failed to fetch/i.test(m)) return 'Could not reach the online server. Check the connection.';
    return m;
  }

  async makeNet() {
    if (this.net) { await this.net.leave(); this.net = null; }
    const net = new Net(params.get('net') === 'local' ? 'local' : 'firebase');
    await net.connect();
    this.net = net;
    net.on('start', (meta) => { if (this.net === net) this.startOnline(meta); });
    net.on('left', (why) => { if (this.net !== net) return; this.ui.toast(why || 'The room closed.', true); this.net = null; this.backToHouse(); });
    return net;
  }

  async startOnline(meta) {
    const net = this.net;
    if (!net) return;
    this.ui.hideAll();
    document.body.classList.remove('ended');
    await this.ui.fade(true, 500);
    if (this.hub) { const h = this.hub; this.hub = null; h.dispose(); }
    this.chapter = meta.ch;
    net.detach();
    this.loadWorld(LEVELS[meta.ch], { net, uid: net.uid, isHost: meta.owners.host === net.uid, owners: meta.owners });
    net.attach(this.world);
    const wait = Math.max(0, (meta.startAt || 0) - net.tr.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, Math.min(3000, wait)));
    this.begin(false);
  }

  leaveNetQuiet() {
    if (this.net) { this.net.leave(); this.net = null; }
  }

  loop(now) {
    requestAnimationFrame((t) => this.loop(t));
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const inp = this.input.poll();
    this.pend.jumpPressed ||= inp.jumpPressed;
    this.pend.actionPressed ||= inp.actionPressed;
    this.pend.swapPressed ||= inp.swapPressed;
    if (inp.pausePressed && this.state === 'play' && !this.ending) { if (this.paused) this.resume(); else this.pauseGame(); }
    const w = this.world;
    if (w) {
      const frozen = this.paused && !this.net && !this.hub;
      if (!frozen) {
        this.acc += dt;
        let n = 0;
        while (this.acc >= STEP && n < 5) {
          const i = { ...inp, jumpPressed: this.pend.jumpPressed, actionPressed: this.pend.actionPressed, swapPressed: this.pend.swapPressed };
          this.pend.jumpPressed = this.pend.actionPressed = this.pend.swapPressed = false;
          this.fixed(STEP, this.paused ? { ...NOINPUT, skip: false } : i);
          this.acc -= STEP;
          n++;
        }
        if (n === 5) this.acc = 0;
      }
      const alpha = frozen ? 1 : this.acc / STEP;
      w.frame(frozen ? 0 : dt, alpha);
      if (this.hub) this.hub.frame(frozen ? 0 : dt);
      w.updateCamera(dt, this.active || (this.hub ? null : w.chars[0]));
      if (this.state === 'play' && !this.hub) this.hudFrame(dt);
    }
    this.renderer.render(dt);
  }

  fixed(dt, inp) {
    const w = this.world;
    if (this.hub) this.hub.step(dt);
    if (this.state === 'play') {
      if (inp.swapPressed && !this.story.running) this.swap();
      const inputs = {};
      if (this.story.running) this.story.update(dt, inp);
      else if (this.active && !this.ending && !(this.hub && this.hub.busy)) inputs[this.active.kind] = inp;
      w.tick(dt, inputs);
      if (this.net) this.net.publish(w);
      if (w.flags.end && !this.ending) this.endChapter();
      if (this.active && this.active.puppet) this.chooseActive();
    } else {
      w.tick(dt, {});
    }
  }

  hudFrame(dt) {
    const w = this.world;
    const b = w.charByKind('butter');
    if (b && !b.puppet) {
      const show = b.temp < 0.25 || b.temp > 0.55 || Math.abs(w.heatAt(b.pos.x, b.pos.y)) > 0.001;
      this.thermoShow = show ? 2.5 : Math.max(0, this.thermoShow - dt);
      this.ui.updateThermo(b.temp, this.thermoShow > 0);
    } else this.ui.updateThermo(0, false);
  }
}

const game = new Game();
window.game = game;
game.boot().catch((e) => {
  console.error(e);
  const n = document.querySelector('.load-note');
  if (n) n.textContent = 'Something went wrong: ' + e.message;
});

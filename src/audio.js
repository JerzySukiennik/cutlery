// Audio: recorded foley and room loops (freesound.org, CC0), recorded music per room with crossfades, and a rendered felt piano for stings and the toy piano.
const ASSETS = new URL('../assets/', import.meta.url).href;
const seq = (s, k) => Array.from({ length: k }, (_, i) => `${s}_${i}`);
const FILES = {
  squish: seq('squish', 5),
  squishSoft: seq('bstep', 4),
  soft: seq('soft', 4),
  metalTick: seq('tap', 5),
  metal: ['metal_a', 'metal_b', 'clink_1', 'clink_3'],
  clink: seq('clink', 4),
  plate: seq('plate', 4),
  plateSoft: ['plate_0', 'plate_1', 'plate_3'],
  plateHeavy: seq('plates', 2),
  wood: seq('wood', 4),
  woodHeavy: seq('woodheavy', 3),
  thunk: ['woodheavy_0', 'woodheavy_1'],
  stab: seq('stab', 3),
  unstab: ['pull_0'],
  draw: ['pull_0', 'drawer_0'],
  slice: seq('slice', 3),
  chop: ['chop_0'],
  cut: seq('cut', 2),
  latch: seq('latch', 2),
  tick: ['tick_0'],
  switch: ['switch_0'],
  drag: seq('drag', 2),
  crack: seq('crack', 2),
  glass: seq('glass', 3),
  door: ['door_0'],
  doorClose: ['doorclose_0'],
  creak: seq('creak', 2),
  pot: seq('pot', 2),
  cloth: ['cloth_0', 'cloth_1', 'clothdrop_0'],
  pluck: seq('pluck', 2),
  drop: ['waterdrop_0'],
  drip: ['drip_0', 'drip_1', 'waterdrop_0'],
  splash: seq('splash', 2),
  sizzle: ['sizzle_0'],
  spread: seq('spread', 3),
  wobble: ['wobble_0'],
  pop: seq('toastpop', 2),
  toast: ['toastdown_0'],
  ding: ['ding_0'],
  twang: seq('twang', 2),
  boing: ['spring_0'],
  snap: seq('trap', 2),
  whoosh: seq('whoosh', 2),
  swish: seq('swish', 2),
  poof: seq('poof', 2),
  ui_select: ['ui_select'], ui_click: ['ui_click'], ui_toggle: ['ui_toggle'], ui_back: ['ui_back'], ui_open: ['ui_open'], ui_close: ['ui_close'], ui_chime: ['ui_chime'], ui_bong: ['ui_bong'],
};

const PITCH = { clink: [0.96, 1.12], metalTick: [0.95, 1.15], tick: [1.0, 1.08], squish: [0.9, 1.15], squishSoft: [0.95, 1.2], plateSoft: [1.08, 1.22], drip: [0.85, 1.3], crack: [0.85, 1.05], ding: [1, 1], twang: [0.92, 1.08], drag: [0.9, 1.05], whoosh: [0.9, 1.15], swish: [0.95, 1.2] };
const GAIN = { drag: 0.7, sizzle: 0.8, wobble: 0.8, spread: 0.9, ding: 0.75, poof: 0.8, whoosh: 0.8, swish: 0.9 };

const AMB = {
  kitchen: { room: 0.1, birds: 0.45 },
  fridge: { fridge: 0.35, room: 0.02 },
  quiet: { room: 0.05, birds: 0.1 },
  night: { room: 0.04, night: 0.2 },
};
const AMB_PAN = { birds: -0.35, night: 0.25 };

const MUSIC = {
  menu: ['gymnopedie1'],
  end: ['gymnopedie1'],
  ch1: ['foreign_lands', 'pleading_child'],
  pantry: ['cattails'],
  living: ['traumerei'],
  ch2: ['somewhere_sunny'],
  dining: ['clear_air'],
  study: ['curious_story', 'fireside'],
  ch3: ['morning'],
  washing: ['almost_bliss'],
  night: ['child_asleep', 'poet_speaks'],
};
const ROOT = { gymnopedie1: 62, foreign_lands: 67, pleading_child: 62, curious_story: 62, fireside: 65, traumerei: 65, child_asleep: 64, poet_speaks: 67, cattails: 69, somewhere_sunny: 60, clear_air: 67, morning: 64, almost_bliss: 69 };

let silent = null;
function silence() {
  if (silent) return silent;
  const n = 4410, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
  const s = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); s(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, n * 2, true);
  silent = URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
  return silent;
}

export class Audio {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this.piano = [];
    this.vol = { master: 0.9, music: 0.55, sfx: 0.9, voice: 1 };
    this.started = false;
    this.music = null;
    this.intensity = 0.7;
    try { const s = JSON.parse(localStorage.getItem('cutlery.vol') || 'null'); if (s) Object.assign(this.vol, s); } catch (e) {}
  }

  async init(onProgress) {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC({ latencyHint: 'interactive' });
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.vol.master;
    this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.ratio.value = 3; this.comp.knee.value = 8;
    this.master.connect(this.comp).connect(c.destination);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.vol.sfx; this.sfxBus.connect(this.master);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.vol.music;
    this.reverb = c.createConvolver();
    this.reverb.buffer = this.impulse(3.4, 2.6);
    this.revGain = c.createGain(); this.revGain.gain.value = 0.42;
    this.felt = c.createBiquadFilter(); this.felt.type = 'lowpass'; this.felt.frequency.value = 3200; this.felt.Q.value = 0.3;
    this.musicBus.connect(this.felt);
    this.felt.connect(this.master);
    this.felt.connect(this.reverb);
    this.reverb.connect(this.revGain).connect(this.master);
    this.sfxRev = c.createGain(); this.sfxRev.gain.value = 0.12; this.sfxRev.connect(this.reverb);
    this.recBus = c.createGain(); this.recBus.gain.value = this.vol.music; this.recBus.connect(this.master);
    this.voiceBus = c.createGain(); this.voiceBus.gain.value = this.vol.voice ?? 1; this.voiceBus.connect(this.master);
    this.ducked = false;
    this.decks = [this.deck(), this.deck()];
    const names = new Set(Object.values(FILES).flat());
    let done = 0;
    await Promise.all([...names].map(async (n) => {
      try {
        const r = await fetch(`${ASSETS}audio/${n}.mp3`);
        const ab = await r.arrayBuffer();
        this.buffers[n] = await new Promise((res, rej) => c.decodeAudioData(ab, res, rej));
      } catch (e) {}
      done++;
      if (onProgress) onProgress(done / names.size);
    }));
    this.renderPiano().catch((e) => console.warn('piano', e));
    if (onProgress) onProgress(1);
    const unlock = () => {
      if (c.state !== 'running') c.resume();
      for (const d of this.decks) {
        if (d.want) this.go(d);
        else if (!d.primed && !d.el.getAttribute('src')) { d.el.src = silence(); d.el.play().then(() => d.el.pause()).catch(() => {}); }
        d.primed = true;
      }
    };
    addEventListener('pointerdown', unlock, { capture: true });
    addEventListener('keydown', unlock, { capture: true });
    addEventListener('touchend', unlock, { capture: true });
  }

  impulse(dur, decay) {
    const c = this.ctx, n = Math.floor(c.sampleRate * dur);
    const b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        lp += (Math.random() * 2 - 1 - lp) * (0.35 - t * 0.25);
        d[i] = lp * Math.pow(1 - t, decay) * (i < 400 ? i / 400 : 1);
      }
    }
    return b;
  }

  async renderPiano() {
    const sr = 44100, dur = 4.6;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const one = async (midi) => {
      const off = new OAC(1, Math.ceil(dur * sr), sr);
      const out = off.createGain(); out.gain.value = 0.5; out.connect(off.destination);
      const f0 = 440 * Math.pow(2, (midi - 69) / 12);
      const B = 0.0002 * Math.pow(2, (midi - 60) / 18);
      const lowness = Math.pow(261.6 / f0, 0.35);
      const lp = off.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.4;
      lp.frequency.setValueAtTime(Math.min(9000, f0 * 9 + 900), 0);
      lp.frequency.setTargetAtTime(Math.min(4000, f0 * 3.5 + 500), 0.01, 0.35);
      lp.connect(out);
      for (let k = 1; k <= 10; k++) {
        const f = k * f0 * Math.sqrt(1 + B * k * k);
        if (f > 7000) break;
        const amp = Math.pow(k, -1.25) * Math.exp(-f / 3800) * (k === 1 ? 1 : 0.9) * (k % 7 === 0 ? 0.3 : 1);
        for (const det of [-0.6, 0.7]) {
          const o = off.createOscillator();
          o.frequency.value = f * Math.pow(2, det / 1200);
          const g = off.createGain();
          g.gain.setValueAtTime(0, 0);
          g.gain.linearRampToValueAtTime(amp * 0.5, 0.004 + 0.002 * k);
          g.gain.setTargetAtTime(amp * 0.5 * 0.32, 0.01, (0.18 + 0.5 / k) * lowness);
          g.gain.setTargetAtTime(0, 0.4, (1.4 + 2.4 / k) * lowness);
          o.connect(g).connect(lp);
          o.start(0);
          o.stop(dur);
        }
      }
      const noise = off.createBuffer(1, Math.floor(sr * 0.08), sr);
      const nd = noise.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nd.length, 3);
      const ns = off.createBufferSource(); ns.buffer = noise;
      const nf = off.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = Math.min(2400, f0 * 2.2); nf.Q.value = 0.8;
      const ng = off.createGain(); ng.gain.value = 0.05;
      ns.connect(nf).connect(ng).connect(out);
      ns.start(0);
      const buf = await new Promise((res) => { off.oncomplete = (e) => res(e.renderedBuffer); const p = off.startRendering(); if (p && p.then) p.then(res); });
      return { midi, buf };
    };
    const notes = [];
    for (let m = 36; m <= 93; m += 3) notes.push(m);
    const out = [];
    for (let i = 0; i < notes.length; i += 5) out.push(...await Promise.all(notes.slice(i, i + 5).map(one)));
    this.piano = out.sort((a, b) => a.midi - b.midi);
  }

  setVol(k, v) {
    this.vol[k] = v;
    if (k === 'master' && this.master) this.master.gain.value = v;
    if (k === 'music' && this.musicBus) { this.musicBus.gain.value = v; this.recBus.gain.value = v * (this.ducked ? 0.4 : 1); }
    if (k === 'voice' && this.voiceBus) this.voiceBus.gain.value = v;
    if (k === 'sfx' && this.sfxBus) this.sfxBus.gain.value = v;
    try { localStorage.setItem('cutlery.vol', JSON.stringify(this.vol)); } catch (e) {}
  }

  play(buf, vol = 1, pan = 0, rate = 1, when = 0, bus) {
    const c = this.ctx;
    if (!c || !buf) return null;
    const s = c.createBufferSource();
    s.buffer = buf;
    s.playbackRate.value = rate;
    const g = c.createGain(); g.gain.value = vol;
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    if (p) { p.pan.value = pan; s.connect(g).connect(p).connect(bus || this.sfxBus); }
    else s.connect(g).connect(bus || this.sfxBus);
    if (!bus) g.connect(this.sfxRev);
    s.start(when || c.currentTime);
    return { s, g };
  }

  sfx(name, vol = 1, pan = 0) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const list = FILES[name];
    if (list) {
      this.last = this.last || {};
      let i = (Math.random() * list.length) | 0;
      if (list.length > 1 && i === this.last[name]) i = (i + 1) % list.length;
      this.last[name] = i;
      const b = this.buffers[list[i]];
      if (b) {
        const pr = PITCH[name] || [0.94, 1.06];
        this.play(b, vol * 0.8 * (GAIN[name] || 1), pan, pr[0] + Math.random() * (pr[1] - pr[0]));
        return;
      }
    }
    const synth = this['syn_' + name];
    if (synth) synth.call(this, vol, pan);
  }

  ui(name) { this.sfx(name, 0.55, 0); }

  voice(buf) {
    const c = this.ctx, s = c.createBufferSource();
    s.buffer = buf;
    s.connect(this.voiceBus);
    s.start();
    return s;
  }

  duck(on) {
    if (!this.ctx || this.ducked === on) return;
    this.ducked = on;
    const t = this.ctx.currentTime, v = this.vol.music * (on ? 0.4 : 1);
    this.recBus.gain.cancelScheduledValues(t);
    this.recBus.gain.setTargetAtTime(v, t, on ? 0.12 : 0.6);
  }

  sting() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const base = this.root() + 12;
    [0, 7, 12, 19, 24].forEach((s, i) => this.note(base + s, 0.3 - i * 0.035, i * 0.075, this.sfxBus));
  }

  checkpoint() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const r = this.root();
    this.note(r + 24, 0.22, 0, this.sfxBus);
    this.note(r + 31, 0.16, 0.12, this.sfxBus);
  }

  root() { return (this.music && this.music.root) || 62; }

  key(midi) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.note(midi, 0.42, 0, this.sfxBus);
  }

  syn_chime(v, p) { this.note(84, v * 0.5, 0, this.sfxBus); this.note(91, v * 0.35, 0.09, this.sfxBus); }

  note(midi, vel = 0.6, delay = 0, bus) {
    if (!this.piano.length) return;
    let best = this.piano[0];
    for (const s of this.piano) if (Math.abs(s.midi - midi) < Math.abs(best.midi - midi)) best = s;
    const rate = Math.pow(2, (midi - best.midi) / 12);
    const c = this.ctx;
    const when = (typeof delay === 'number' && delay > 1000 ? delay : c.currentTime + delay);
    this.play(best.buf, vel, (midi - 64) / 60, rate, when, bus || this.musicBus);
  }

  deck() {
    const c = this.ctx, el = document.createElement('audio');
    el.preload = 'auto';
    const g = c.createGain(); g.gain.value = 0;
    c.createMediaElementSource(el).connect(g).connect(this.recBus);
    const d = { el, g, token: 0, want: false, onEnd: null };
    el.addEventListener('ended', () => { if (d.onEnd) d.onEnd(); });
    return d;
  }

  go(d) {
    const p = d.el.play();
    d.want = true;
    if (p && p.then) p.then(() => { d.want = false; }).catch(() => {});
  }

  level() { return 0.6 + 0.4 * this.intensity; }

  startMusic(theme) {
    if (!this.ctx) return;
    if (this.music && this.music.theme === theme) return;
    const prev = this.music;
    const d = this.decks.find((x) => x !== this.lastDeck) || this.decks[0];
    if (this.lastDeck) this.fadeOut(this.lastDeck, 1.2);
    this.lastDeck = d;
    const m = this.music = { theme, list: MUSIC[theme] || MUSIC.menu, i: 0, deck: d, root: 62 };
    this.track(m, prev ? 0.9 : 0);
  }

  track(m, delay = 0) {
    const d = m.deck, c = this.ctx, tok = ++d.token;
    const name = m.list[m.i % m.list.length];
    m.root = ROOT[name] || 62;
    d.want = false;
    d.el.loop = m.list.length === 1;
    d.onEnd = () => {
      if (d.token !== tok || this.music !== m) return;
      m.i++;
      setTimeout(() => { if (d.token === tok && this.music === m) this.track(m); }, 1500);
    };
    if (!d.el.paused) delay = Math.max(delay, 0.4);
    d.g.gain.cancelScheduledValues(c.currentTime);
    d.g.gain.setTargetAtTime(0, c.currentTime, 0.08);
    setTimeout(() => {
      if (d.token !== tok) return;
      d.el.src = `${ASSETS}music/${name}.mp3`;
      const t = c.currentTime;
      d.g.gain.cancelScheduledValues(t);
      d.g.gain.setValueAtTime(0, t);
      d.g.gain.linearRampToValueAtTime(this.level(), t + (delay ? 2.4 : 1.2));
      this.go(d);
    }, delay * 1000);
  }

  fadeOut(d, dur) {
    const c = this.ctx, t = c.currentTime, tok = ++d.token;
    d.want = false;
    d.onEnd = null;
    d.g.gain.cancelScheduledValues(t);
    d.g.gain.setValueAtTime(d.g.gain.value, t);
    d.g.gain.linearRampToValueAtTime(0, t + dur);
    setTimeout(() => { if (d.token === tok) d.el.pause(); }, dur * 1000 + 80);
  }

  stopMusic() {
    if (this.lastDeck) this.fadeOut(this.lastDeck, 1.0);
    this.lastDeck = null;
    this.music = null;
  }

  setIntensity(v) {
    this.intensity = v;
    if (this.music && this.ctx) this.music.deck.g.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.8);
  }

  ambience(kind) {
    const c = this.ctx;
    if (!c) return;
    this.layers = this.layers || {};
    if (this.ambKind === kind) return;
    this.ambKind = kind;
    const mix = AMB[kind] || AMB.quiet, t = c.currentTime;
    for (const name of new Set([...Object.keys(this.layers), ...Object.keys(mix)])) {
      const L = this.layer(name);
      L.g.gain.setTargetAtTime(mix[name] || 0, t, 0.8);
    }
  }

  ambienceMix(kind) { this.ambience(kind); }

  layer(name) {
    if (this.layers[name]) return this.layers[name];
    const c = this.ctx;
    const g = c.createGain(); g.gain.value = 0;
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    if (p) { p.pan.value = AMB_PAN[name] || 0; g.connect(p).connect(this.master); } else g.connect(this.master);
    const L = this.layers[name] = { g };
    fetch(`${ASSETS}audio/amb_${name}.mp3`).then((r) => r.arrayBuffer()).then((ab) => new Promise((res, rej) => c.decodeAudioData(ab, res, rej))).then((buf) => {
      const s = c.createBufferSource(); s.buffer = buf; s.loop = true;
      s.connect(g); s.start(0, Math.random() * buf.duration);
      L.src = s;
    }).catch((e) => console.warn('ambience', name, e));
    return L;
  }
}

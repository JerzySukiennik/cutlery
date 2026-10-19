// Audio: recorded foley (freesound.org, CC0), recorded room loops, a rendered felt piano and generative chapter music.
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

const THEMES = {
  menu: { bpm: 62, key: 64, prog: [[0, 4, 7, 11, 14], [-3, 0, 4, 7, 11], [-7, -3, 0, 4, 7], [-5, -1, 2, 4, 9]], pat: 'arp', mel: 0.35, oct: 0 },
  ch1: { bpm: 58, key: 62, prog: [[0, 4, 7, 11, 14], [-3, 0, 4, 7, 10], [-5, -1, 2, 7, 11], [-3, 2, 4, 7, 9]], pat: 'box', mel: 0.25, oct: 12 },
  ch2: { bpm: 70, key: 65, prog: [[0, 4, 7, 12, 14], [-8, -5, -1, 4, 7], [-7, -3, 0, 5, 9], [-5, -1, 2, 7, 11]], pat: 'walk', mel: 0.4, oct: 0 },
  ch3: { bpm: 74, key: 67, prog: [[0, 4, 7, 11, 14], [-5, -1, 2, 7, 11], [-8, -5, -1, 2, 7], [-7, -3, 0, 4, 11]], pat: 'arp', mel: 0.55, oct: 0 },
  pantry: { bpm: 62, key: 57, prog: [[0, 3, 7, 10, 14], [-4, 0, 3, 7, 10], [-7, -4, 0, 3, 8], [-5, -2, 2, 5, 10]], pat: 'box', mel: 0.3, oct: 12 },
  living: { bpm: 66, key: 60, prog: [[0, 4, 7, 11, 14], [-3, 0, 4, 7, 11], [-8, -5, -1, 4, 7], [-5, -1, 2, 5, 9]], pat: 'arp', mel: 0.5, oct: 0 },
  dining: { bpm: 72, key: 62, prog: [[0, 4, 7, 9, 14], [-5, -1, 2, 7, 11], [-3, 0, 4, 7, 12], [-7, -3, 0, 4, 11]], pat: 'walk', mel: 0.45, oct: 0 },
  study: { bpm: 64, key: 58, prog: [[0, 4, 7, 11, 14], [-1, 2, 5, 9, 12], [-3, 0, 4, 7, 11], [-5, -1, 2, 5, 9]], pat: 'box', mel: 0.4, oct: 0 },
  washing: { bpm: 78, key: 65, prog: [[0, 4, 7, 12, 16], [-3, 0, 4, 9, 12], [-7, -3, 0, 5, 9], [-5, -1, 2, 7, 11]], pat: 'arp', mel: 0.5, oct: 12 },
  night: { bpm: 54, key: 60, prog: [[0, 3, 7, 10, 14], [-4, 0, 3, 7, 12], [-2, 2, 5, 9, 12], [-5, -1, 2, 7, 10]], pat: 'chord', mel: 0.35, oct: 0 },
  end: { bpm: 60, key: 67, prog: [[0, 4, 7, 11, 14], [-3, 0, 4, 7, 14], [-7, -3, 0, 4, 11], [-5, -1, 2, 7, 14]], pat: 'chord', mel: 0.6, oct: 0 },
};

export class Audio {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this.piano = [];
    this.vol = { master: 0.9, music: 0.55, sfx: 0.9 };
    this.started = false;
    this.music = null;
    this.amb = [];
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
    const names = new Set(Object.values(FILES).flat());
    let done = 0;
    await Promise.all([...names].map(async (n) => {
      try {
        const r = await fetch(`assets/audio/${n}.mp3`);
        const ab = await r.arrayBuffer();
        this.buffers[n] = await new Promise((res, rej) => c.decodeAudioData(ab, res, rej));
      } catch (e) {}
      done++;
      if (onProgress) onProgress(done / names.size);
    }));
    this.renderPiano().catch((e) => console.warseq('piano', e));
    if (onProgress) onProgress(1);
    const unlock = () => { if (c.state !== 'running') c.resume(); };
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
    if (this.wantTheme) { const t = this.wantTheme; this.wantTheme = null; this.startMusic(t); }
  }

  setVol(k, v) {
    this.vol[k] = v;
    if (k === 'master' && this.master) this.master.gain.value = v;
    if (k === 'music' && this.musicBus) this.musicBus.gain.value = v;
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

  sting() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const th = (this.music && this.music.th) || THEMES.menu;
    const chord = th.prog[((this.music && this.music.bar) || 0) % th.prog.length];
    const base = th.key + 12;
    [0, 1, 2, 3, 4].forEach((i) => this.note(base + chord[i % chord.length] + (i > 2 ? 12 : 0), 0.32 - i * 0.03, i * 0.075, this.sfxBus));
  }

  checkpoint() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const th = (this.music && this.music.th) || THEMES.menu;
    this.note(th.key + 24, 0.22, 0, this.sfxBus);
    this.note(th.key + 31, 0.16, 0.12, this.sfxBus);
  }

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

  startMusic(theme) {
    if (!this.ctx) return;
    if (!this.piano.length) { this.wantTheme = theme; return; }
    if (this.music && this.music.theme === theme) return;
    this.stopMusic();
    const th = THEMES[theme] || THEMES.menu;
    const m = { theme, th, next: this.ctx.currentTime + 0.4, bar: 0, motif: this.makeMotif(th), intensity: 0.7, alive: true };
    this.music = m;
    const loop = () => {
      if (!m.alive) return;
      const c = this.ctx;
      while (m.next < c.currentTime + 0.6) { this.scheduleBar(m, m.next); m.next += 4 * 60 / th.bpm; m.bar++; }
      m.timer = setTimeout(loop, 150);
    };
    loop();
  }

  stopMusic() {
    if (this.music) { this.music.alive = false; clearTimeout(this.music.timer); this.music = null; }
  }

  setIntensity(v) { if (this.music) this.music.intensity = v; }

  makeMotif(th) {
    const mot = [];
    for (let i = 0; i < 8; i++) mot.push({ beat: [0, 1, 1.5, 2, 3, 3.5][Math.floor(Math.random() * 6)], deg: Math.floor(Math.random() * 5), len: Math.random() < 0.5 ? 1 : 2 });
    return mot.sort((a, b) => a.beat - b.beat).slice(0, 3 + Math.floor(Math.random() * 2));
  }

  scheduleBar(m, t) {
    const th = m.th, beat = 60 / th.bpm;
    const chord = th.prog[m.bar % th.prog.length];
    const root = th.key + chord[0];
    const sw = (b) => t + b * beat + (Math.random() - 0.5) * 0.012;
    const hum = (v) => v * (0.85 + Math.random() * 0.3) * (0.55 + m.intensity * 0.45);
    const bass = root - 24 + (root - 24 < 36 ? 12 : 0);
    this.note(bass, hum(0.5), sw(0) - this.ctx.currentTime);
    if (Math.random() < 0.6) this.note(bass + 7, hum(0.28), sw(2) - this.ctx.currentTime);
    const tones = chord.map((c) => th.key + c + th.oct);
    const at = (b, midi, v) => this.note(midi, hum(v), sw(b) - this.ctx.currentTime);
    if (th.pat === 'arp') {
      const seq = [0, 1, 2, 3, 4, 3, 2, 1];
      for (let i = 0; i < 8; i++) if (Math.random() < 0.55 + m.intensity * 0.4) at(i * 0.5, tones[seq[i]] + (i > 3 ? 0 : -12) + 12, 0.24);
    } else if (th.pat === 'box') {
      for (let i = 0; i < 8; i++) if (Math.random() < 0.35 + m.intensity * 0.35) at(i * 0.5, tones[(i * 3 + m.bar) % tones.length] + 12, 0.18);
    } else if (th.pat === 'walk') {
      for (let i = 0; i < 4; i++) if (Math.random() < 0.7) at(i + 0.5, tones[1 + (i % 3)], 0.22);
    } else {
      at(0, tones[1], 0.25); at(0.02, tones[2], 0.22); at(0.04, tones[3], 0.2);
      if (Math.random() < 0.6) { at(2, tones[2], 0.2); at(2.03, tones[4], 0.18); }
    }
    if (m.bar % 8 === 0 && m.bar > 0 && Math.random() < 0.5) m.motif = this.makeMotif(th);
    if (Math.random() < th.mel * (0.6 + m.intensity * 0.6) && m.bar % 4 !== 3) {
      for (const n of m.motif) at(n.beat, tones[n.deg % tones.length] + 12 + (n.deg > 3 ? 0 : 12) - 12, 0.34);
    }
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
    fetch(`assets/audio/amb_${name}.mp3`).then((r) => r.arrayBuffer()).then((ab) => new Promise((res, rej) => c.decodeAudioData(ab, res, rej))).then((buf) => {
      const s = c.createBufferSource(); s.buffer = buf; s.loop = true;
      s.connect(g); s.start(0, Math.random() * buf.duration);
      L.src = s;
    }).catch((e) => console.warn('ambience', name, e));
    return L;
  }
}

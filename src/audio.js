// Audio: Kenney sample bank, synthesized foley, a rendered felt piano and generative chapter music.
const FILES = {
  squish: ['squish0', 'squish1', 'squish2', 'squish3', 'squish4'],
  squishSoft: ['soft_m0', 'soft_m1', 'soft_m2', 'soft_m3', 'soft_m4'],
  soft: ['soft_m0', 'soft_m1', 'soft_m2', 'soft_m3'],
  metalTick: ['metal_l0', 'metal_l1', 'metal_l2', 'metal_l3', 'metal_l4'],
  metal: ['metal_l0', 'metal_l1', 'metal_l2', 'metal_l3', 'metal_l4', 'metal_m0'],
  clink: ['metal_m0', 'metal_m1', 'metal_m2'],
  plate: ['plate_l0', 'plate_l1', 'plate_l2', 'plate_l3', 'plate_l4'],
  plateSoft: ['plate_l0', 'plate_l2', 'plate_l4'],
  plateHeavy: ['plate_h0', 'plate_h1', 'plate_h2'],
  wood: ['wood_m0', 'wood_m1', 'wood_m2', 'plank_m0', 'plank_m1'],
  woodHeavy: ['wood_h0', 'wood_h1', 'wood_h2'],
  thunk: ['wood_h0', 'wood_h1', 'wood_h2'],
  stab: ['soft_h0', 'soft_h1', 'soft_h2'],
  unstab: ['draw0', 'draw1'],
  draw: ['draw0', 'draw1', 'draw2'],
  slice: ['slice0', 'slice1'],
  chop: ['chop'],
  latch: ['latch'],
  tick: ['click_metal'],
  switch: ['ui_switch'],
  drag: ['plank_m2', 'wood_m1'],
  crack: ['glass_l0', 'glass_l1', 'glass_l2'],
  glass: ['glass_l0', 'glass_l1', 'glass_l2'],
  door: ['door_open'],
  doorClose: ['door_close'],
  creak: ['creak0', 'creak1'],
  pot: ['pot0', 'pot1'],
  cloth: ['cloth'],
  ui_select: ['ui_select'], ui_click: ['ui_click'], ui_toggle: ['ui_toggle'], ui_back: ['ui_back'], ui_open: ['ui_open'], ui_close: ['ui_close'], ui_chime: ['ui_chime'], ui_bong: ['ui_bong'],
  pluck: ['pluck0', 'pluck1'],
  drop: ['drop'],
};

const PITCH = { clink: [1.15, 1.45], metalTick: [1.1, 1.4], tick: [1.4, 1.6], drag: [0.65, 0.8], crack: [0.7, 0.9], squish: [0.9, 1.2], squishSoft: [1.0, 1.25], stab: [1.0, 1.25], plateSoft: [1.3, 1.5] };

const THEMES = {
  menu: { bpm: 62, key: 64, prog: [[0, 4, 7, 11, 14], [-3, 0, 4, 7, 11], [-7, -3, 0, 4, 7], [-5, -1, 2, 4, 9]], pat: 'arp', mel: 0.35, oct: 0 },
  ch1: { bpm: 58, key: 62, prog: [[0, 4, 7, 11, 14], [-3, 0, 4, 7, 10], [-5, -1, 2, 7, 11], [-3, 2, 4, 7, 9]], pat: 'box', mel: 0.25, oct: 12 },
  ch2: { bpm: 70, key: 65, prog: [[0, 4, 7, 12, 14], [-8, -5, -1, 4, 7], [-7, -3, 0, 5, 9], [-5, -1, 2, 7, 11]], pat: 'walk', mel: 0.4, oct: 0 },
  ch3: { bpm: 74, key: 67, prog: [[0, 4, 7, 11, 14], [-5, -1, 2, 7, 11], [-8, -5, -1, 2, 7], [-7, -3, 0, 4, 11]], pat: 'arp', mel: 0.55, oct: 0 },
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
    this.renderPiano().catch((e) => console.warn('piano', e));
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
    const synth = this['syn_' + name];
    if (synth) { synth.call(this, vol, pan); return; }
    const list = FILES[name];
    if (!list) return;
    const b = this.buffers[list[(Math.random() * list.length) | 0]];
    const pr = PITCH[name] || [0.93, 1.08];
    this.play(b, vol * 0.8, pan, pr[0] + Math.random() * (pr[1] - pr[0]));
  }

  ui(name) { this.sfx(name, 0.55, 0); }

  noiseBuf() {
    if (this._noise) return this._noise;
    const c = this.ctx, n = c.sampleRate;
    const b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this._noise = b;
    return b;
  }

  env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }

  route(node, pan) {
    const c = this.ctx;
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    if (p) { p.pan.value = pan; node.connect(p).connect(this.sfxBus); p.connect(this.sfxRev); }
    else { node.connect(this.sfxBus); }
  }

  noise(vol, pan, type, f0, f1, q, a, dec, rate = 1) {
    const c = this.ctx, t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf(); s.playbackRate.value = rate;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + a + dec);
    const g = c.createGain(); this.env(g, t, a, vol, dec);
    s.connect(f).connect(g); this.route(g, pan);
    s.start(t, Math.random() * 0.5); s.stop(t + a + dec + 0.05);
  }

  syn_whoosh(v, p) { this.noise(v * 0.35, p, 'bandpass', 500, 2600, 1.2, 0.05, 0.2); }
  syn_swish(v, p) { this.noise(v * 0.45, p, 'bandpass', 2400, 900, 2.0, 0.02, 0.16); }
  syn_poof(v, p) { this.noise(v * 0.5, p, 'lowpass', 1400, 200, 0.7, 0.02, 0.45); }
  syn_splash(v, p) { this.noise(v * 0.6, p, 'bandpass', 1200, 400, 0.8, 0.01, 0.5); this.noise(v * 0.3, p, 'highpass', 3000, 5000, 0.5, 0.01, 0.3); }
  syn_spread(v, p) { this.noise(v * 0.35, p, 'bandpass', 700, 1600, 1.5, 0.08, 0.6); this.sfx('squish', v * 0.7, p); }
  syn_sizzle(v, p) {
    const c = this.ctx;
    for (let i = 0; i < 6; i++) setTimeout(() => this.noise(v * 0.12, p, 'highpass', 4000 + Math.random() * 2000, 6000, 0.6, 0.005, 0.06 + Math.random() * 0.1), i * 70 + Math.random() * 60);
  }
  syn_wobble(v, p) {
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    const lfo = c.createOscillator(); lfo.frequency.value = 14;
    const lg = c.createGain(); lg.gain.value = 25; lfo.connect(lg).connect(o.frequency);
    const g = c.createGain(); this.env(g, t, 0.01, v * 0.25, 0.35);
    o.connect(g); this.route(g, p);
    o.start(t); lfo.start(t); o.stop(t + 0.45); lfo.stop(t + 0.45);
    this.sfx('soft', v * 0.6, p);
  }
  syn_twang(v, p) {
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.7);
    const lfo = c.createOscillator(); lfo.frequency.setValueAtTime(22, t); lfo.frequency.linearRampToValueAtTime(9, t + 0.8);
    const lg = c.createGain(); lg.gain.setValueAtTime(55, t); lg.gain.exponentialRampToValueAtTime(2, t + 0.8);
    lfo.connect(lg).connect(o.frequency);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.8); f.Q.value = 6;
    const g = c.createGain(); this.env(g, t, 0.005, v * 0.28, 0.85);
    o.connect(f).connect(g); this.route(g, p);
    o.start(t); lfo.start(t); o.stop(t + 0.95); lfo.stop(t + 0.95);
    this.sfx('thunk', v * 0.5, p);
  }
  syn_pop(v, p) {
    this.sfx('latch', v, p);
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(320, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.12);
    const g = c.createGain(); this.env(g, t, 0.005, v * 0.2, 0.18);
    o.connect(g); this.route(g, p); o.start(t); o.stop(t + 0.25);
    this.sfx('metal', v * 0.8, p);
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
    if (!this.layers) {
      const mk = (freq, q) => {
        const s = c.createBufferSource(); s.buffer = this.noiseBuf(); s.loop = true;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = q;
        const g = c.createGain(); g.gain.value = 0;
        s.connect(f).connect(g).connect(this.master);
        s.start(0, Math.random());
        return g;
      };
      const hum = mk(150, 0.7);
      const o = c.createOscillator(); o.frequency.value = 55; const og = c.createGain(); og.gain.value = 0.08;
      o.connect(og).connect(hum); o.start();
      this.layers = { hum, room: mk(420, 0.3), birds: false };
      const birds = () => {
        if (this.layers.birds && c.state === 'running') this.chirp();
        setTimeout(birds, 2200 + Math.random() * 6500);
      };
      setTimeout(birds, 1500);
    }
    this.ambienceMix(kind);
  }

  ambienceMix(kind) {
    if (!this.layers || this.ambKind === kind) return;
    this.ambKind = kind;
    const c = this.ctx, t = c.currentTime;
    this.layers.hum.gain.setTargetAtTime(kind === 'fridge' ? 0.2 : kind === 'quiet' ? 0 : 0.012, t, 0.8);
    this.layers.room.gain.setTargetAtTime(kind === 'quiet' ? 0 : kind === 'fridge' ? 0.015 : 0.045, t, 0.8);
    this.layers.birds = kind === 'kitchen';
  }

  chirp() {
    const c = this.ctx, t = c.currentTime;
    const n = 2 + Math.floor(Math.random() * 4);
    const base = 2600 + Math.random() * 1600;
    const pan = -0.7 + Math.random() * 0.5;
    for (let i = 0; i < n; i++) {
      const o = c.createOscillator(); o.type = 'sine';
      const tt = t + i * (0.09 + Math.random() * 0.05);
      o.frequency.setValueAtTime(base, tt);
      o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), tt + 0.05);
      o.frequency.exponentialRampToValueAtTime(base * 0.9, tt + 0.08);
      const g = c.createGain(); this.env(g, tt, 0.01, 0.01 + Math.random() * 0.01, 0.07);
      const p = c.createStereoPanner ? c.createStereoPanner() : null;
      if (p) { p.pan.value = pan; o.connect(g).connect(p).connect(this.master); p.connect(this.reverb); } else o.connect(g).connect(this.master);
      o.start(tt); o.stop(tt + 0.12);
    }
  }
}

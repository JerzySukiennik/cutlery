// The house: a public dollhouse where everyone online walks around and stands on portals to start chapters together.
import * as THREE from 'three';
import { HubLink } from './net.js';
import { CHAPTERS, TRACKS, chapterOf, trackOf, unlockedIn, GLYPH } from './ui.js';

const NAMES = { fork: 'Fork', knife: 'Knife', butter: 'Butter' };
const ORDER = { fork: 0, butter: 1, knife: 2 };
export const TRACK_COLOR = { b: '#f2cf63', d: '#a9c8ea', t: '#f3a46b' };
const HOLD = 1.6;
const SUCK = 0.9;
const params = new URLSearchParams(location.search);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms) {
  const t0 = performance.now();
  while (performance.now() - t0 < ms) { if (fn()) return true; await sleep(100); }
  return !!fn();
}
const list = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

function textSprite(w, h, height) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.03 }));
  sp.scale.set(height * w / h, height, 1);
  sp.renderOrder = 6;
  sp.userData = { cv, ctx: cv.getContext('2d'), tex, key: null };
  return sp;
}

function paintText(sp, key, draw) {
  const u = sp.userData;
  if (u.key === key) return;
  u.key = key;
  u.ctx.clearRect(0, 0, u.cv.width, u.cv.height);
  draw(u.ctx, u.cv.width, u.cv.height);
  u.tex.needsUpdate = true;
}

const glyphPaths = {};
function glyphPath(kind) {
  if (!glyphPaths[kind]) { const m = GLYPH[kind].match(/ d="([^"]+)"/); glyphPaths[kind] = m ? new Path2D(m[1]) : null; }
  return glyphPaths[kind];
}

function drawGlyph(ctx, kind, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  if (kind === 'butter') {
    const bw = w * 0.84, bh = bw * 0.62, x = (w - bw) / 2, y = h - bh - 10;
    ctx.beginPath(); ctx.roundRect(x, y, bw, bh, bw * 0.14); ctx.fill();
    ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'destination-out';
    for (const ex of [0.36, 0.64]) { ctx.beginPath(); ctx.arc(x + bw * ex, y + bh * 0.48, bw * 0.07, 0, Math.PI * 2); ctx.fill(); }
  } else {
    const s = Math.min(w / 24, (h - 8) / 48);
    ctx.translate((w - 24 * s) / 2, h - 48 * s - 4);
    ctx.scale(s, s);
    ctx.fill(glyphPath(kind));
  }
  ctx.restore();
}

const archVert = `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const archFrag = `uniform float uTime, uOn, uProg, uH, uW; uniform vec3 uColor; varying vec2 vP;
void main() {
  vec2 d = vP - vec2(0.0, uH * 0.45);
  float r = length(d / vec2(uW * 0.5, uH * 0.55));
  float a = atan(d.y, d.x);
  float sw = 0.5 + 0.5 * sin(a * 3.0 - r * 7.0 + uTime * (1.3 + uProg * 5.0));
  float core = smoothstep(1.15, 0.0, r);
  vec3 base = mix(vec3(0.05, 0.045, 0.04), uColor, uOn);
  vec3 col = base * (0.12 + core * (0.45 + 0.55 * sw)) * mix(0.25, 1.0, uOn) * (1.0 + uProg * 2.4);
  col += uColor * uProg * uProg * core * 1.4;
  gl_FragColor = vec4(col, 1.0);
}`;
const rimVert = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const rimFrag = `uniform float uTime, uOn, uProg; uniform vec3 uColor; varying vec2 vUv;
void main() {
  float e = abs(vUv.x - 0.5) * 2.0;
  float lit = step(1.0 - uProg, e) * step(0.001, uProg);
  float idle = uOn * 0.22 * (0.55 + 0.45 * sin(uTime * 2.2 - vUv.x * 14.0));
  float v = max(lit * (1.7 + 0.4 * sin(uTime * 14.0)), idle);
  if (v < 0.01) discard;
  gl_FragColor = vec4(uColor * v, 1.0);
}`;

class ArchCurve extends THREE.Curve {
  constructor(w, hs) { super(); this.w = w; this.hs = hs; this.len = hs * 2 + Math.PI * w / 2; }
  getPoint(t, out = new THREE.Vector3()) {
    const d = t * this.len, r = this.w / 2, hs = this.hs;
    if (d < hs) return out.set(-r, d, 0);
    if (d < hs + Math.PI * r) { const a = Math.PI - (d - hs) / r; return out.set(Math.cos(a) * r, hs + Math.sin(a) * r, 0); }
    return out.set(r, hs - (d - hs - Math.PI * r), 0);
  }
}

export function buildPortal(L, o) {
  const b = L.b, M = L.m;
  const ch = chapterOf(o.id), tr = trackOf(o.id);
  const color = TRACK_COLOR[tr.id];
  const kinds = [...tr.chars].sort((a, c) => ORDER[a] - ORDER[c]);
  const n = kinds.length;
  const w = n === 1 ? 2.3 : n === 2 ? 3.1 : 4.1, h = 3.9, hs = h - w / 2;
  const root = new THREE.Group();
  root.position.set(o.x, o.y, 0);
  b.add(root, true);
  const arch = new THREE.Group();
  arch.position.set(0, 0, -1.9);
  root.add(arch);
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0); shape.lineTo(-w / 2, hs); shape.absarc(0, hs, w / 2, Math.PI, 0, true); shape.lineTo(w / 2, 0); shape.lineTo(-w / 2, 0);
  const uni = { uTime: { value: 0 }, uOn: { value: 0 }, uProg: { value: 0 }, uH: { value: h }, uW: { value: w }, uColor: { value: new THREE.Color(color) } };
  const inner = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), new THREE.ShaderMaterial({ uniforms: uni, vertexShader: archVert, fragmentShader: archFrag }));
  arch.add(inner);
  const curve = new ArchCurve(w + 0.3, hs);
  const frame = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, 0.16, 10, false), M.brass);
  frame.castShadow = true;
  arch.add(frame);
  const rim = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.2, 8, false), new THREE.ShaderMaterial({ uniforms: uni, vertexShader: rimVert, fragmentShader: rimFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  rim.position.z = 0.05;
  rim.renderOrder = 4;
  arch.add(rim);
  const step = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 0.14, 1.2), M.woodDark);
  step.position.set(0, 0.07, -0.1);
  step.receiveShadow = true;
  arch.add(step);
  const gap = n === 1 ? 0 : n === 2 ? 1.7 : 1.5;
  const slots = kinds.map((k, i) => {
    const dx = (i - (n - 1) / 2) * gap;
    const mat = new THREE.MeshStandardMaterial({ color: '#2f2620', emissive: new THREE.Color(color), emissiveIntensity: 0.12, roughness: 0.35, metalness: 0.4 });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.06, 28), mat);
    plate.position.set(dx, 0.06, 0);
    plate.receiveShadow = true;
    root.add(plate);
    const glyph = textSprite(64, 128, k === 'butter' ? 0.62 : 0.95);
    glyph.position.set(dx, 2.75, 0.2);
    paintText(glyph, k, (ctx, cw, chh) => drawGlyph(ctx, k, cw, chh, '#fff4dc'));
    glyph.material.opacity = 0.5;
    root.add(glyph);
    return { kind: k, dx, mat, glyph, glow: 0, occ: null };
  });
  const title = textSprite(1024, 200, 0.92);
  title.position.set(0, h + 1.38, 0.3);
  root.add(title);
  const status = textSprite(1024, 96, 0.34);
  status.position.set(0, h + 0.66, 0.3);
  root.add(status);
  const light = new THREE.PointLight(o.light || '#ffd9a8', 0, 15, 1.4);
  light.position.set(o.roomX ?? o.x, o.y + 5.2, 2.6);
  L.light(light);
  const p = { id: o.id, ch, tr, x: o.x, y: o.y, w, h, color, kinds, slots, root, arch, uni, title, status, light, lightMax: o.lightMax ?? 9, prog: 0, on: 0, waitT: 0, stat: '', occBefore: 0 };
  return L.portal(p);
}

export function floorSign(L, x, y, trackId) {
  const tr = TRACKS.find((t) => t.id === trackId);
  const cv = document.createElement('canvas');
  cv.width = 640; cv.height = 192;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const paint = () => {
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    let gx = 40;
    for (const k of [...tr.chars].sort((a, c) => ORDER[a] - ORDER[c])) {
      const gw = k === 'butter' ? 76 : 40;
      ctx.save(); ctx.translate(gx, 36); drawGlyph(ctx, k, gw, 112, k === 'butter' ? TRACK_COLOR.b : '#e3e7ec'); ctx.restore();
      gx += gw + 10;
    }
    ctx.fillStyle = '#f4ecdf';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'italic 400 64px Fraunces, Georgia, serif';
    ctx.fillText(tr.name, gx + 18, 102);
    ctx.font = '600 26px "Instrument Sans", system-ui, sans-serif';
    ctx.fillStyle = TRACK_COLOR[tr.id];
    ctx.fillText(tr.note.toUpperCase().split('').join('\u200a'), gx + 20, 146);
    tex.needsUpdate = true;
  };
  paint();
  if (document.fonts) document.fonts.ready.then(paint);
  L.b.add(mesh3(new THREE.BoxGeometry(3.7, 1.2, 0.12), L.m.woodDark, x, y, -3.08));
  const face = mesh3(new THREE.PlaneGeometry(3.5, 1.05), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.03 }), x, y, -3.0);
  face.userData.keep = true;
  L.b.add(face, true);
}

function mesh3(geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; }

export class Hub {
  constructor(game, world) {
    this.g = game;
    this.w = world;
    this.portals = world.portals;
    this.remotes = new Map();
    this.me = null;
    this.busy = null;
    this.suck = null;
    this.pop = null;
    this.link = null;
    this.uid = 'me';
    this.online = false;
    this.fontsReady = false;
    document.fonts && document.fonts.ready.then(() => { this.fontsReady = true; for (const p of this.portals) { p.title.userData.key = null; p.status.userData.key = null; } for (const r of this.remotes.values()) r.label.userData.key = null; });
  }

  async connect() {
    const link = new HubLink(params.get('net') === 'local' ? 'local' : 'firebase');
    this.link = link;
    link.on('join', (uid, v) => this.addRemote(uid, v));
    link.on('change', (uid, v) => this.changeRemote(uid, v));
    link.on('leave', (uid) => this.dropRemote(uid));
    link.on('invite', (v) => this.onInvite(v));
    try {
      this.uid = await link.connect();
      if (this.link !== link) return;
      this.online = true;
      this.g.ui.houseCount(this.count());
    } catch (e) {
      console.warn('house offline', e);
      if (this.link === link) { this.link = null; this.g.ui.toast('Could not reach the others. The house is just yours for now.', true); }
    }
  }

  count() { let n = this.me ? 1 : 0; for (const r of this.remotes.values()) if (!r.hidden) n++; return n; }
  kinds() { const out = []; for (const r of this.remotes.values()) if (!r.hidden) out.push(r.v.k); return out; }

  spawnLocal(kind, at) {
    const p = at && this.portals.find((q) => q.id === at);
    const sp = p ? { x: p.x + p.w / 2 + 0.9 + ORDER[kind] * 0.7, y: p.y, face: -1 } : this.w.spawns[kind] || { x: 48, y: 0, face: -1 };
    this.me = this.w.addChar(kind, { id: 'me', x: sp.x, y: sp.y, face: sp.face || 1 });
    if (p) {
      this.pop = { t: 0 };
      this.w.effect('sparkle', sp.x, sp.y + 1);
      this.w.sfx('pop', sp.x, sp.y, 0.8);
    }
    this.g.ui.houseCount(this.count());
    return this.me;
  }

  despawnLocal() {
    if (!this.me) return;
    this.w.effect('puff', this.me.pos.x, this.me.pos.y);
    this.w.removeChar(this.me);
    this.me = null;
    this.suck = null;
    if (this.link) this.link.hide();
    this.g.ui.houseCount(this.count());
  }

  addRemote(uid, v) {
    if (!NAMES[v.k] || this.remotes.has(uid)) return;
    const ch = this.w.addChar(v.k, { id: 'p_' + uid, owner: uid, puppet: true, x: v.x, y: v.y - (v.hh || 0.5), face: v.f || 1 });
    const label = textSprite(512, 96, 0.34);
    ch.root.add(label);
    const r = { uid, v, ch, label, hidden: false, seen: performance.now(), suck: null };
    this.remotes.set(uid, r);
    this.paintLabel(r);
    this.w.effect('sparkle', v.x, v.y);
    this.g.ui.houseCount(this.count());
  }

  changeRemote(uid, v) {
    const r = this.remotes.get(uid);
    if (!r) { this.addRemote(uid, v); return; }
    if (r.v.k !== v.k) { this.dropRemote(uid, true); this.addRemote(uid, v); return; }
    const wasHidden = r.hidden;
    r.v = v;
    r.seen = performance.now();
    if (wasHidden) { r.hidden = false; r.ch.setVisible(true); r.ch.meta.off = false; this.g.ui.houseCount(this.count()); }
    if (v.a && !r.suck) {
      const p = this.portals.find((q) => q.id === v.a);
      if (p) r.suck = { p, t: 0, x0: r.ch.pos.x, y0: r.ch.pos.y - r.ch.hh };
    } else if (!v.a && r.suck) { r.suck = null; r.ch.root.scale.setScalar(1); r.ch.setVisible(true); }
    this.paintLabel(r);
  }

  dropRemote(uid, quiet) {
    const r = this.remotes.get(uid);
    if (!r) return;
    this.remotes.delete(uid);
    if (!quiet && !r.hidden && !r.suck) { this.w.effect('puff', r.ch.pos.x, r.ch.pos.y); }
    if (r.suck && !quiet) { this.w.effect('sparkle', r.suck.p.x, r.suck.p.y + 2); this.w.sfx('chime', r.suck.p.x, r.suck.p.y, 0.5); }
    r.label.material.map.dispose();
    r.label.material.dispose();
    this.w.removeChar(r.ch);
    this.g.ui.houseCount(this.count());
  }

  paintLabel(r) {
    const nick = String(r.v.n || NAMES[r.v.k]).slice(0, 20);
    r.label.position.set(0, r.ch.hh * 2 + 0.42, 0);
    paintText(r.label, nick + (this.fontsReady ? '1' : '0'), (ctx, w, h) => {
      ctx.font = '600 44px "Instrument Sans", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tw = Math.min(w - 8, ctx.measureText(nick).width + 40);
      ctx.fillStyle = 'rgba(20, 13, 8, 0.55)';
      ctx.beginPath(); ctx.roundRect((w - tw) / 2, 14, tw, h - 28, 30); ctx.fill();
      ctx.fillStyle = '#f4ecdf';
      ctx.fillText(nick, w / 2, h / 2 + 2);
    });
  }

  doneOf(uid) {
    if (uid === this.uid) return this.g.ui.done;
    const r = this.remotes.get(uid);
    return new Set(String((r && r.v.d) || '').split(',').filter(Boolean));
  }

  isOpenFor(uid, id) { return uid === this.uid ? this.g.ui.unlocked(id) : unlockedIn(this.doneOf(uid), id); }

  occupant(p, sl) {
    let best = null, bd = 0.62;
    for (const c of this.w.chars) {
      if (c.kind !== sl.kind) continue;
      const r = c === this.me ? null : this.remotes.get(c.owner);
      const s = c === this.me ? this.suck : r && r.suck;
      if (s) { if (s.p === p) return { ch: c, uid: c === this.me ? this.uid : c.owner }; continue; }
      if (!c.visible || c.state !== 'walk' || (r && r.hidden)) continue;
      if (Math.abs(c.bottom - p.y) > 0.35) continue;
      const d = Math.abs(c.pos.x - (p.x + sl.dx)) - (c === this.me ? 0.05 : 0);
      if (d < bd) { bd = d; best = c; }
    }
    return best ? { ch: best, uid: best === this.me ? this.uid : best.owner } : null;
  }

  onPortal(p, c) { return p.slots.some((sl) => sl.kind === c.kind && Math.abs(c.pos.x - (p.x + sl.dx)) < 0.75 && Math.abs(c.bottom - p.y) < 0.4); }

  step(dt) {
    for (const r of this.remotes.values()) {
      const s = this.link && this.link.sample(r.uid);
      if (s && !r.suck) r.ch.applyNet(s);
      if (!r.hidden && performance.now() - r.seen > 15000) { r.hidden = true; r.ch.setVisible(false); r.ch.meta.off = true; this.g.ui.houseCount(this.count()); }
    }
    for (const p of this.portals) this.stepPortal(p, dt);
    if (this.me && this.link && this.online) {
      const s = this.me.netState();
      this.link.publish({ k: this.me.kind, n: this.g.ui.nick || NAMES[this.me.kind], d: [...this.g.ui.done].join(','), a: this.suck ? this.suck.p.id : '', x: s.x, y: s.y, vx: s.vx, vy: s.vy, f: s.f, s: s.s, hw: s.hw, hh: s.hh });
    }
  }

  stepPortal(p, dt) {
    const occ = p.slots.map((sl) => this.occupant(p, sl));
    p.slots.forEach((sl, i) => { sl.occ = occ[i]; });
    const members = occ.filter(Boolean);
    const filled = members.length === p.slots.length;
    const mine = members.some((m) => m.ch === this.me);
    const openMe = this.g.ui.unlocked(p.id);
    const allOpen = filled && members.every((m) => this.isOpenFor(m.uid, p.id));
    const ready = filled && allOpen && (!this.busy || this.busy === p.id);
    if (members.length > p.occBefore) this.w.sfx('ui_click', p.x, p.y, 0.5);
    p.occBefore = members.length;
    p.prog = ready ? Math.min(1, p.prog + dt / HOLD) : this.busy === p.id ? p.prog : Math.max(0, p.prog - dt * 2.5);
    p.on += ((openMe ? 1 : 0) - p.on) * Math.min(1, dt * 3);
    if (p.prog >= 1 && mine && !this.busy) this.fire(p, members);
    if (this.busy === p.id && p.waitT && performance.now() - p.waitT > 9000 && !this.g.net) { this.cancel('The others did not come through.'); }
    let st;
    const names = p.kinds.map((k) => NAMES[k]);
    if (!openMe) { const prev = CHAPTERS[CHAPTERS.findIndex((c) => c.id === p.id) - 1]; st = 'Finish ' + (prev ? prev.title : 'the chapter before') + ' first'; }
    else if (this.busy === p.id || p.prog >= 1) st = 'Opening…';
    else if (filled && !allOpen) st = 'Not everyone here has opened this yet';
    else if (p.prog > 0) st = 'Hold still…';
    else if (members.length) st = 'Waiting for ' + list(p.slots.filter((sl) => !sl.occ).map((sl) => NAMES[sl.kind]));
    else if (p.slots.length === 1) st = 'Stand here as Butter';
    else if (!this.link) st = 'For ' + list(names) + ', each on their own device';
    else st = list(names) + ' stand here together';
    p.stat = st;
  }

  fire(p, members) {
    if (members.length === 1) {
      this.busy = p.id;
      this.startSuck(p);
      setTimeout(() => { if (this.busy === p.id) this.g.startSolo(p.id, { from: 'hub' }); }, SUCK * 1000 + 150);
      return;
    }
    if (!this.link || !this.online) return;
    const leader = members.map((m) => m.uid).sort()[0];
    this.busy = p.id;
    this.startSuck(p);
    p.waitT = performance.now();
    if (leader === this.uid) this.launch(p, members);
  }

  async launch(p, members) {
    const g = this.g;
    try {
      const net = await g.makeNet();
      if (this.busy !== p.id) { g.leaveNetQuiet(); return; }
      await net.createRoom(p.id, g.ui.nick || NAMES[this.me.kind]);
      net.pickChar(this.me.kind);
      const at = net.tr.now();
      for (const m of members) if (m.uid !== this.uid) this.link.invite(m.uid, { code: net.code, ch: p.id, k: m.ch.kind, from: this.uid, at });
      const ok = await waitFor(() => this.busy !== p.id || members.every((m) => net.players[m.uid] && net.players[m.uid].char === m.ch.kind), 12000);
      if (this.busy !== p.id) return;
      if (!ok) throw new Error('The others did not come through.');
      net.startGame(p.tr.chars, p.id);
    } catch (e) {
      console.warn(e);
      this.cancel(e.message);
    }
  }

  async onInvite(v) {
    const g = this.g;
    if (!this.me || (this.busy && this.busy !== v.ch) || g.net) return;
    if (this.link.now() - (v.at || 0) > 15000) return;
    const p = this.portals.find((q) => q.id === v.ch);
    if (!p || this.me.kind !== v.k) return;
    if (!this.busy && !this.onPortal(p, this.me)) return;
    if (!this.busy) { this.busy = p.id; this.startSuck(p); }
    p.waitT = 0;
    try {
      const net = await g.makeNet();
      await net.joinRoom(v.code, g.ui.nick || NAMES[this.me.kind]);
      net.pickChar(v.k);
      const ok = await waitFor(() => this.busy !== p.id || g.state !== 'play' || g.chapter !== 'hub', 15000);
      if (!ok && this.busy === p.id) throw new Error('The chapter did not start.');
    } catch (e) {
      console.warn(e);
      this.cancel(e.message);
    }
  }

  cancel(msg) {
    const g = this.g;
    if (!this.busy) return;
    const p = this.portals.find((q) => q.id === this.busy);
    this.busy = null;
    if (p) { p.prog = 0; p.waitT = 0; }
    g.leaveNetQuiet();
    if (this.me) {
      this.suck = null;
      this.me.root.scale.setScalar(1);
      this.me.setVisible(true);
      if (p) this.me.place(p.x + p.slots[0].dx - 1.4, p.y, -1);
      this.pop = { t: 0 };
    }
    if (msg) g.ui.toast(msg, true);
  }

  startSuck(p) {
    if (!this.me) return;
    this.suck = { p, t: 0, x0: this.me.rpos.x, y0: this.me.rpos.y - this.me.hh };
    this.me.vel.x = this.me.vel.y = 0;
    this.w.sfx('whoosh', p.x, p.y + 2, 1);
    this.w.sfx('chime', p.x, p.y + 2, 0.6);
    this.w.solve(p.x, p.y + 1.6);
  }

  animSuck(c, s, dt) {
    s.t += dt;
    const k = Math.min(1, s.t / SUCK), e = k * k * (3 - 2 * k);
    const tx = s.p.x, ty = s.p.y + 1.6;
    c.root.position.set(s.x0 + (tx - s.x0) * e, s.y0 + (ty - s.y0) * e + Math.sin(k * Math.PI) * 0.6, -1.7 * e);
    c.root.scale.setScalar(Math.max(0.02, 1 - e * 0.98));
    c.root.rotation.y = e * Math.PI * 3;
    if (k >= 1 && c.visible) { c.setVisible(false); this.w.effect('sparkle', tx, ty); this.w.fx.ring('ring', tx, ty, -1.7, 10, 3); }
  }

  frame(dt) {
    const t = this.w.time;
    for (const p of this.portals) {
      p.uni.uTime.value = t;
      p.uni.uOn.value = p.on;
      p.uni.uProg.value = p.prog;
      p.light.intensity = p.lightMax * (0.25 + 0.75 * p.on) * (1 + p.prog * 0.5);
      for (const sl of p.slots) {
        sl.glow += ((sl.occ ? 1 : 0) - sl.glow) * Math.min(1, dt * 8);
        sl.mat.emissiveIntensity = (0.12 + p.on * 0.25) + sl.glow * (1.6 + p.prog * 2);
        sl.glyph.material.opacity = (1 - sl.glow) * (0.25 + 0.45 * p.on) * (0.8 + 0.2 * Math.sin(t * 2.4 + sl.dx));
        sl.glyph.position.y = 2.75 + Math.sin(t * 1.8 + sl.dx * 2) * 0.08;
      }
      if (this.fontsReady || !document.fonts) this.paintPortal(p);
    }
    if (this.me && this.suck) this.animSuck(this.me, this.suck, dt);
    for (const r of this.remotes.values()) if (r.suck && r.ch.visible) this.animSuck(r.ch, r.suck, dt);
    if (this.me && this.pop) {
      this.pop.t += dt;
      const k = Math.min(1, this.pop.t / 0.45);
      this.me.root.scale.setScalar(k >= 1 ? 1 : Math.max(0.05, 1 + Math.sin(k * Math.PI) * 0.18 - (1 - k) * 0.9));
      if (k >= 1) this.pop = null;
    }
  }

  paintPortal(p) {
    const done = this.g.ui.done.has(p.id);
    const col = p.color;
    paintText(p.title, p.id + done + p.on.toFixed(1), (ctx, w, h) => {
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const eb = (p.tr.name + ' · ' + p.ch.num).toUpperCase().split('').join('\u200a');
      ctx.font = 'italic 400 80px Fraunces, Georgia, serif';
      const tw = ctx.measureText(p.ch.title).width + (done ? 50 : 0);
      ctx.fillStyle = 'rgba(22, 15, 10, 0.62)';
      ctx.beginPath(); ctx.roundRect((w - tw) / 2 - 44, 14, tw + 88, h - 28, 40); ctx.fill();
      ctx.globalAlpha = 0.6 + 0.4 * p.on;
      ctx.font = '600 28px "Instrument Sans", system-ui, sans-serif';
      ctx.fillStyle = col;
      ctx.fillText(eb, w / 2, 68);
      ctx.font = 'italic 400 80px Fraunces, Georgia, serif';
      ctx.fillStyle = '#f4ecdf';
      ctx.fillText(p.ch.title, w / 2 - (done ? 25 : 0), 150);
      if (done) {
        ctx.fillStyle = TRACK_COLOR.b;
        ctx.beginPath(); ctx.arc(w / 2 + tw / 2 - 18, 126, 10, 0, Math.PI * 2); ctx.fill();
      }
    });
    paintText(p.status, p.stat, (ctx, w, h) => {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '500 38px "Instrument Sans", system-ui, sans-serif';
      const tw = ctx.measureText(p.stat).width;
      ctx.fillStyle = 'rgba(22, 15, 10, 0.5)';
      ctx.beginPath(); ctx.roundRect((w - tw) / 2 - 26, 12, tw + 52, h - 24, 30); ctx.fill();
      ctx.fillStyle = 'rgba(244, 236, 223, 0.86)';
      ctx.fillText(p.stat, w / 2, h / 2 + 1);
    });
  }

  async dispose() {
    this.busy = null;
    for (const r of this.remotes.values()) { r.label.material.map.dispose(); r.label.material.dispose(); }
    for (const p of this.portals) for (const s of [p.title, p.status, ...p.slots.map((x) => x.glyph)]) { s.material.map.dispose(); s.material.dispose(); }
    const link = this.link;
    this.link = null;
    if (link) await link.leave();
  }
}

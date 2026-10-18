// World: builds a level, runs its mechanisms, characters, movers, camera and network bookkeeping.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Physics, aabbOverlap } from './physics.js';
import { Builder, mesh, rbox, mats } from './props.js';
import { Character, NOINPUT } from './characters.js';
import { FX } from './fx.js';

const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

class Mover {
  constructor(w, o) {
    this.w = w;
    this.id = o.id;
    this.type = o.type;
    this.kind = o.kind || o.type;
    this.hw = o.w / 2; this.hh = o.h / 2;
    this.home = { x: o.x + this.hw, y: o.y + this.hh };
    this.pos = { ...this.home };
    this.prev = { ...this.home };
    this.vel = { x: 0, y: 0 };
    this.weight = o.weight ?? 1;
    this.floats = !!o.floats;
    this.settle = !!o.settle;
    this.meta = { kind: this.type, mat: o.mat || 'wood', top: 0, id: o.id };
    if (this.type === 'box') this.meta.box = this; else this.meta.item = this;
    this.col = w.phys.addBox(this.pos.x, this.pos.y, this.hw, this.hh, 0, this.meta, 0.03);
    this.meta.top = this.pos.y + this.hh;
    this.group = o.group;
    w.b.add(this.group, true);
    this.carrier = null;
    this.owner = null;
    this.grounded = false;
    this.puppet = false;
    this.lastMove = -10;
    this.strain = 0;
    this.pred = (m) => {
      if (m === this.meta || m.char || m.item) return false;
      if (m.oneWay) return this.pos.y - this.hh >= m.top - 0.1 && this.vel.y <= 0.5;
      return true;
    };
  }

  step(dt) {
    this.prev.x = this.pos.x; this.prev.y = this.pos.y;
    const w = this.w;
    if (this.carrier) {
      const p = this.carrier.heldPos(this);
      this.pos.x = p.x; this.pos.y = p.y;
      this.meta.off = true;
      this.vel.x = this.vel.y = 0;
      return;
    }
    this.meta.off = false;
    if (this.puppet) return;
    if (this.type === 'box') {
      const push = w.pushersOf(this);
      const eff = w.slickAt(this.pos.x, this.pos.y - this.hh, null, this.hw) ? 1 : this.weight;
      let dir = 0;
      if (push.r >= eff && push.r > push.l) dir = 1;
      else if (push.l >= eff && push.l > push.r) dir = -1;
      if (dir) { this.pushDir = dir; this.pushMem = 0.12; }
      else if ((this.pushMem = (this.pushMem || 0) - dt) > 0 && !(push.r || push.l)) dir = this.pushDir;
      this.moving = !!dir;
      this.strain = (push.r || push.l) && !dir ? 1 : 0;
      this.vel.x = dir ? dir * (eff === 1 && this.weight > 1 ? 3.0 : 2.3) : (this.tip || 0) * 1.6;
      if (dir) { this.lastMove = w.time; if (!this.dragSnd || w.time - this.dragSnd > 0.32) { this.dragSnd = w.time; w.sfx(this.meta.mat === 'glass' || this.meta.mat === 'ceramic' ? 'plateSoft' : 'drag', this.pos.x, this.pos.y, 0.3); w.fx.emit('step', this.pos.x - dir * this.hw, this.pos.y - this.hh, 0.3, 2); } }
    } else if (this.grounded) this.vel.x *= Math.exp(-9 * dt);
    this.vel.y = Math.max(-24, this.vel.y - 30 * dt);
    const vy0 = this.vel.y;
    const res = w.phys.move(this.col, this.vel.x * dt, this.vel.y * dt, this.pred, true);
    this.pos.x += res.dx; this.pos.y += res.dy;
    const was = this.grounded;
    this.grounded = res.grounded && this.vel.y <= 0;
    if (this.grounded && !was && this.settle && vy0 < -6) { this.weight = 99; this.home = { x: this.pos.x, y: this.pos.y }; w.solve(this.pos.x, this.pos.y + this.hh); }
    if (this.grounded) {
      if (!was && vy0 < -4) {
        w.sfx(this.meta.mat === 'glass' || this.meta.mat === 'ceramic' ? 'plate' : this.type === 'item' ? 'soft' : 'wood', this.pos.x, this.pos.y, Math.min(1, -vy0 / 14));
        if (this.type === 'item' && vy0 < -7) { this.vel.y = -vy0 * 0.28; this.grounded = false; }
        else this.vel.y = 0;
      } else this.vel.y = 0;
      if (this.type === 'item' && Math.abs(this.vel.x) > 0.05) this.lastMove = w.time;
    } else this.lastMove = w.time;
    if (Math.abs(res.dx - this.vel.x * dt) > 0.001) this.vel.x = this.type === 'item' ? -this.vel.x * 0.3 : 0;
    if (this.type === 'box' && this.grounded && !this.afloat) {
      const ground = (dx) => !!w.phys.cast(this.pos.x + dx, this.pos.y, 0, -1, this.hh + 0.12, (m) => m !== this.meta && !m.char && !m.item);
      this.tip = 0;
      if (!ground(0.02) || !ground(-0.02)) {
        const l = ground(-this.hw * 0.92), r = ground(this.hw * 0.92);
        this.tip = l && !r ? 1 : r && !l ? -1 : 0;
        if (!l && !r) {
          const gh = res.hits.find((h) => h.ny > 0.45 && h.m.collider);
          if (gh) this.tip = Math.sign(this.pos.x - gh.m.collider.translation().x) || 1;
        }
      }
    }
    if (this.vel.y > 0 && res.dy < this.vel.y * dt - 0.002) this.vel.y = 0;
    const wat = this.floats ? w.waterAt(this.pos.x) : null;
    if (wat && this.pos.y - this.hh < wat.y - this.hh * 0.9) {
      if (!this.afloat) { w.sfx('splash', this.pos.x, wat.y, 0.9); w.fx.emit('splash', this.pos.x, wat.y, 0.4); this.vel.x = 0; }
      this.afloat = true;
      this.pos.y = wat.y - this.hh * 0.9 + this.hh;
      this.vel.y = 0;
      this.grounded = true;
      this.vel.x *= Math.exp(-8 * dt);
    }
    if (this.pos.y < w.killY(this.pos.x) || (!this.floats && w.inWater(this.pos.x, this.pos.y - this.hh))) this.reset();
    this.sync();
  }

  sync() {
    this.w.phys.place(this.col, this.pos.x, this.pos.y);
    this.meta.top = this.pos.y + this.hh;
  }

  reset() {
    this.pos.x = this.home.x; this.pos.y = this.home.y;
    this.prev.x = this.pos.x; this.prev.y = this.pos.y;
    this.vel.x = this.vel.y = 0;
    this.w.fx.emit('poof', this.pos.x, this.pos.y);
    this.sync();
  }

  throwFrom(x, y, vx, vy) {
    this.pos.x = x; this.pos.y = y;
    this.prev.x = x; this.prev.y = y;
    this.vel.x = vx; this.vel.y = vy;
    this.grounded = false;
    this.meta.off = false;
    this.lastMove = this.w.time;
    this.sync();
  }

  netState() {
    return { x: +this.pos.x.toFixed(3), y: +this.pos.y.toFixed(3), vx: +this.vel.x.toFixed(2), vy: +this.vel.y.toFixed(2), c: this.carrier ? this.carrier.kind : '' };
  }

  applyNet(s) {
    if (this.settle && this.weight < 99 && s.y < this.home.y - 1) this.weight = 99;
    this.pos.x = s.x; this.pos.y = s.y;
    this.vel.x = s.vx || 0; this.vel.y = s.vy || 0;
    this.carrier = s.c ? this.w.charByKind(s.c) : null;
    if (!this.carrier) this.sync();
  }

  render(alpha) {
    let x = this.prev.x + (this.pos.x - this.prev.x) * alpha, y = this.prev.y + (this.pos.y - this.prev.y) * alpha;
    if (this.carrier) { const p = this.carrier.heldPos(this, true); x = p.x; y = p.y; }
    this.group.position.set(x, y - this.hh + (this.afloat ? Math.sin(this.w.time * 1.7) * 0.03 : 0), 0);
    if (this.afloat) this.group.rotation.z = Math.sin(this.w.time * 1.3) * 0.025;
    if (this.strain) this.group.position.x += Math.sin(this.w.time * 60) * 0.01;
  }
}

export class World {
  constructor(game, def, opts = {}) {
    this.game = game;
    this.def = def;
    this.scene = game.renderer.scene;
    this.net = opts.net || null;
    this.uid = opts.uid || 'me';
    this.isHost = opts.isHost ?? true;
    this.owners = opts.owners || {};
    this.phys = new Physics();
    this.fx = new FX(this.scene);
    this.time = 0;
    this.dt = 1 / 60;
    this.flags = {};
    this.flagT = {};
    this.chars = [];
    this.movers = [];
    this.ropes = [];
    this.cuttables = [];
    this.plates = [];
    this.mechs = [];
    this.zones = [];
    this.ambients = [];
    this.waters = [];
    this.kills = [];
    this.toasters = [];
    this.checkpoints = [];
    this.triggers = [];
    this.fallers = [];
    this.topplers = [];
    this.launchers = [];
    this.pianos = [];
    this.seesaws = [];
    this.slashes = [];
    this.cams = [];
    this.updaters = [];
    this.hints = [];
    this.emitters = [];
    this.ends = [];
    this.portals = [];
    this.shown = new Set();
    this.spawns = {};
    this.abil = new Set(def.abilities || []);
    this.cam = { x: 0, y: 10, dist: 26, yOff: 0, look: new THREE.Vector3(), tx: 0, ty: 0, shake: 0 };
    this.lightsAdded = [];
    this.b = new Builder(this.scene);
    this.mt = mats();
    def.build(this.api(), this);
    for (const c of this.b.colliders) this.addStatic(c);
    this.mergeStatics();
    for (const k of def.chars) {
      const ch = new Character(this, k);
      ch.meta.id = k;
      const sp = this.spawns[k] || { x: 0, y: 10 };
      ch.place(sp.x, sp.y, sp.face || 1);
      if (k === 'butter') { ch.temp = sp.temp ?? this.ambientAt(sp.x, sp.y); ch.hard = ch.temp < 0.2; }
      const o = this.owners[k];
      ch.owner = o || this.uid;
      ch.puppet = !!(o && o !== this.uid);
      this.chars.push(ch);
    }
    for (const m of this.movers) { m.owner = this.owners.host || this.uid; m.puppet = !!this.net && !this.isHost; }
    const f = this.chars[0] || def.cam;
    if (f) { const p = f.pos || f; this.cam.x = p.x; this.cam.y = p.y; this.cam.tx = p.x; this.cam.ty = p.y; }
    this.camScale = 600;
  }

  addChar(kind, o = {}) {
    const ch = new Character(this, kind);
    ch.meta.id = o.id || kind;
    ch.owner = o.owner || this.uid;
    ch.puppet = !!o.puppet;
    ch.place(o.x ?? 0, o.y ?? 0, o.face || 1);
    if (kind === 'butter') { ch.temp = this.ambientAt(o.x ?? 0, o.y ?? 0); ch.hard = ch.temp < 0.2; }
    this.chars.push(ch);
    return ch;
  }

  removeChar(ch) {
    const i = this.chars.indexOf(ch);
    if (i < 0) return;
    this.chars.splice(i, 1);
    if (ch.held) ch.releaseHeld();
    ch.dispose();
  }

  api() {
    const W = this, b = this.b;
    return {
      b,
      m: this.mt,
      spawn: (kind, x, y, face = 1, temp) => { W.spawns[kind] = { x, y, face, temp }; },
      checkpoint: (cp) => { W.checkpoints.push(cp); return cp; },
      heat: (z) => { W.zones.push({ when: null, fx: null, ...z }); return z; },
      ambient: (a) => W.ambients.push(a),
      kill: (x0, x1, y) => W.kills.push({ x0, x1, y }),
      water: (x0, x1, y) => W.waters.push({ x0, x1, y }),
      rope: (o) => W.addRope(o),
      faller: (o) => W.addFaller(o),
      cuttable: (o) => W.addCuttable(o),
      plate: (o) => W.addPlate(o),
      mech: (o) => W.addMech(o),
      box: (o) => W.addMover({ ...o, type: 'box' }),
      item: (o) => W.addItem(o),
      toaster: (o) => W.addToaster(o),
      toppler: (o) => W.addToppler(o),
      launcher: (o) => W.addLauncher(o),
      piano: (o) => W.addPiano(o),
      seesaw: (o) => W.addSeesaw(o),
      solve: (x, y) => W.solve(x, y),
      trigger: (o) => { W.triggers.push({ done: false, ...o }); },
      hint: (o) => W.hints.push(o),
      end: (o) => W.ends.push(o),
      portal: (o) => { W.portals.push(o); return o; },
      cam: (o) => W.cams.push(o),
      update: (fn) => W.updaters.push(fn),
      emitter: (o) => W.emitters.push({ acc: 0, ...o }),
      light: (l) => { W.scene.add(l); W.lightsAdded.push(l); return l; },
      flag: (k) => W.flags[k],
      setFlag: (k, v) => W.setFlag(k, v),
    };
  }

  addStatic(c) {
    const meta = { kind: 'static', mat: c.mat, oneWay: !!c.oneWay, grate: !!c.grate, food: c.food || null, id: c.id || null, top: c.y + c.h };
    if (c.slope) meta.slope = { x0: c.x + c.w / 2, y0: c.y + c.h / 2 + c.h / 2 / Math.cos(c.rot || 0), k: Math.tan(c.rot || 0) };
    for (const k of ['gap', 'gx0', 'seep', 'spring', 'springPower', 'onBounce', 'onLand', 'key']) if (c[k] !== undefined) meta[k] = c[k];
    const col = this.phys.addBox(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, c.rot || 0, meta);
    c.meta = meta;
    return col;
  }

  mergeStatics() {
    const groups = new Map();
    this.b.statics.updateMatrixWorld(true);
    const kill = [];
    this.b.statics.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.userData.keep) return;
      const key = o.material.uuid + (o.castShadow ? 'c' : 'n');
      if (!groups.has(key)) groups.set(key, { mat: o.material, cast: o.castShadow, geos: [] });
      let geo = o.geometry.clone();
      geo.applyMatrix4(o.matrixWorld);
      if (geo.index) geo = geo.toNonIndexed();
      for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') geo.deleteAttribute(k);
      if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
      const wu = o.material.userData.worldUV;
      if (wu) {
        const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
        const s = wu, sv = wu / 2;
        for (let i = 0; i < p.count; i++) {
          const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
          if (ay >= ax && ay >= az) uv.setXY(i, p.getX(i) / s, p.getZ(i) / sv);
          else if (ax >= az) uv.setXY(i, p.getZ(i) / s, p.getY(i) / sv);
          else uv.setXY(i, p.getX(i) / s, p.getY(i) / sv);
        }
      }
      groups.get(key).geos.push(geo);
      kill.push(o);
    });
    for (const o of kill) o.parent.remove(o);
    for (const g of groups.values()) {
      const merged = mergeGeometries(g.geos, false);
      for (const x of g.geos) x.dispose();
      if (!merged) continue;
      const m = new THREE.Mesh(merged, g.mat);
      m.castShadow = g.cast;
      m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      if (g.mat.transparent) m.renderOrder = 2;
      this.b.statics.add(m);
    }
  }

  addMover(o) {
    const m = new Mover(this, o);
    this.movers.push(m);
    return m;
  }

  addItem(o) {
    const k = o.kind || 'pea';
    const sizes = { pea: [0.36, 0.36], cork: [0.42, 0.5], sugar: [0.4, 0.4], grape: [0.42, 0.48], blueberry: [0.34, 0.32] };
    const [w, h] = sizes[k] || [0.4, 0.4];
    const g = new THREE.Group();
    const M = this.mt;
    if (k === 'pea') g.add(mesh(new THREE.SphereGeometry(0.18, 16, 12), M.pea, 0, 0.18, 0));
    else if (k === 'grape') g.add(mesh(new THREE.SphereGeometry(0.21, 16, 12), M.grape, 0, 0.24, 0, { sy: 1.12 }));
    else if (k === 'cork') g.add(mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.5, 16), M.cork, 0, 0.25, 0));
    else if (k === 'sugar') g.add(mesh(rbox(0.4, 0.4, 0.4, 0.04), M.sugar, 0, 0.2, 0));
    else g.add(mesh(new THREE.SphereGeometry(0.17, 14, 10), M.grape, 0, 0.16, 0));
    return this.addMover({ id: o.id, type: 'item', kind: k, x: o.x - w / 2, y: o.y, w, h, weight: o.weight ?? 1, mat: k === 'cork' ? 'wood' : 'soft', group: g });
  }

  addRope(o) {
    const n = Math.max(6, Math.round((o.y0 - o.y1) / 0.25));
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push({ x: o.x, y: o.y0 - (o.y0 - o.y1) * i / n, px: o.x, py: o.y0 - (o.y0 - o.y1) * i / n });
    const seg = new THREE.CylinderGeometry(0.035, 0.035, 1, 6);
    seg.translate(0, 0.5, 0);
    const mat = new THREE.MeshStandardMaterial({ color: '#cdb388', roughness: 0.9 });
    const inst = new THREE.InstancedMesh(seg, mat, n);
    inst.castShadow = true;
    inst.frustumCulled = false;
    this.b.add(inst, true);
    const r = { ...o, n, pts, inst, cut: false, cutAt: -1, len: (o.y0 - o.y1) / n, attach: o.attach || null };
    if (o.knot !== false) this.b.add(mesh(new THREE.SphereGeometry(0.09, 10, 8), mat, o.x, o.y0, 0), true);
    this.ropes.push(r);
    return r;
  }

  addFaller(o) {
    const f = { t: 0, done: false, started: false, colObj: null, ...o };
    this.b.add(o.group, true);
    o.group.position.set(o.from.x, o.from.y, o.z || 0);
    o.group.rotation.z = o.from.r || 0;
    if (o.colBefore) f.colObj = this.addStatic({ ...o.colBefore, id: o.id });
    this.fallers.push(f);
    return f;
  }

  addCuttable(o) {
    const c = { cut: false, wob: 0, ...o };
    const col = this.addStatic({ x: o.x, y: o.y, w: o.w, h: o.h, mat: o.mat || 'soft', food: o.food || 'bread', id: o.id });
    c.meta = col.meta;
    c.col = col;
    this.cuttables.push(c);
    return c;
  }

  addPlate(o) {
    const M = this.mt;
    const g = new THREE.Group();
    g.position.set(o.x + o.w / 2, o.y, 0);
    if (o.look === 'handle') {
      const lever = new THREE.Group();
      lever.position.set(o.w / 2, -0.1, 0.6);
      lever.add(mesh(rbox(o.w + 0.4, 0.2, 0.6, 0.09), M.brass, -o.w / 2, 0, 0));
      g.add(lever);
      g.add(mesh(rbox(0.8, 1.6, 0.25, 0.08), M.brass, o.w / 2, -0.1, 0.35));
      this.b.add(g, true);
      const p = { pressed: false, load: 0, shown: -1, g, top: lever, handle: true, ...o };
      this.b.col(o.x, o.y - 0.2, o.w, 0.2, 'metal');
      this.plates.push(p);
      return p;
    }
    const body = mesh(rbox(o.w + 0.3, 0.55, 2.2, 0.12), M.ceramic, 0, -0.27, 0);
    const top = mesh(rbox(o.w, 0.14, 2.0, 0.05), M.steel, 0, 0.07, 0);
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 48;
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    const disp = mesh(new THREE.PlaneGeometry(0.9, 0.34), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }), 0, -0.3, 1.11, { cast: false });
    g.add(body, top, disp);
    this.b.add(g, true);
    const p = { pressed: false, load: 0, shown: -1, g, top, cv, tx, ...o };
    this.drawScale(p, 0);
    this.b.col(o.x - 0.15, o.y - 0.55, o.w + 0.3, 0.55, 'ceramic');
    this.plates.push(p);
    return p;
  }

  drawScale(p, grams) {
    const g = p.cv.getContext('2d');
    g.fillStyle = p.pressed ? '#203a2a' : '#1d2422'; g.fillRect(0, 0, 128, 48);
    g.fillStyle = p.pressed ? '#9ff0b8' : '#6f8a80';
    g.font = '600 30px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(grams).padStart(3, '0') + 'g', 64, 25);
    p.tx.needsUpdate = true;
  }

  addMech(o) {
    const m = { t: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, ...o };
    m.meta = { kind: 'mech', mat: o.mat || 'wood', mech: m, oneWay: !!o.oneWay, top: o.y + o.h };
    m.col = this.phys.addBox(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, m.meta);
    m.cx = o.x + o.w / 2; m.cy = o.y + o.h / 2;
    m.prevX = m.cx; m.prevY = m.cy;
    if (o.group) this.b.add(o.group, true);
    this.mechs.push(m);
    return m;
  }

  addToppler(o) {
    const t = { done: false, pushT: 0, started: false, ...o };
    const col = this.addStatic({ x: o.x, y: o.y, w: o.w, h: o.h, mat: o.mat || 'wood', id: o.id });
    col.meta.toppler = t;
    t.col = col;
    t.meta = col.meta;
    if (o.group) this.b.add(o.group, true);
    this.topplers.push(t);
    return t;
  }

  stepTopplers(dt) {
    for (const t of this.topplers) {
      if (t.done) continue;
      if (!t.started) {
        const p = this.pushersOf(t);
        const s = t.dir > 0 ? p.r : p.l;
        if (s > 0 && s < t.need) { t.strain = 1; if (!t.hinted) { t.hinted = true; const c = this.chars.find((c) => c.pushing && c.pushing.id === t.id); if (c && t.hint) this.hint(c, 'top-' + t.id, t.hint); } }
        else t.strain = 0;
        t.pushT = s >= t.need ? t.pushT + dt : 0;
        if (t.pushT > 0.3) this.setFlag('top_' + t.id, 1);
        if (this.flags['top_' + t.id]) { t.started = true; t.t0 = this.time; this.phys.remove(t.col); t.meta.off = true; this.sfx('creak', t.x, t.y + t.h, 0.8); }
        if (t.group && t.strain) t.group.rotation.z = Math.sin(this.time * 40) * 0.006;
        continue;
      }
      const k = Math.min(1, (this.time - t.t0) / (t.dur || 0.9));
      const e = k * k * k;
      if (t.group) t.group.rotation.z = -t.dir * Math.PI / 2 * e;
      if (k >= 1) {
        t.done = true;
        const L = t.lie;
        t.lieCol = this.addStatic({ ...L, mat: t.mat || 'wood', id: t.id + '_l' });
        this.sfx(t.sound || 'woodHeavy', L.x + L.w / 2, L.y, 1);
        this.fx.emit('dust', L.x + L.w / 2, L.y, 0.5, 16);
        this.cam.shake = 0.3;
        this.solve(L.x + L.w / 2, L.y + L.h + 0.5);
        if (t.onLand) t.onLand(this, t);
      }
    }
  }

  assignHelpers() {
    const a = this.game.active;
    for (const c of this.chars) c.helpDir = 0;
    if (!a || a.puppet || !a.pushing) return;
    const p = a.pushing;
    const tgt = p.box || this.topplers.find((t) => t.id === p.id);
    if (!tgt) return;
    const cx = tgt.pos ? tgt.pos.x : tgt.x + tgt.w / 2, hw = tgt.pos ? tgt.hw : tgt.w / 2;
    const cy = tgt.pos ? tgt.pos.y : tgt.y + tgt.h / 2, hh = tgt.pos ? tgt.hh : tgt.h / 2;
    const face = cx - p.dir * hw;
    for (const c of this.chars) {
      if (c === a || c.puppet || c.state !== 'walk' || !c.grounded) continue;
      const gap = (face - (c.pos.x + p.dir * c.hw)) * p.dir;
      if (gap > -0.1 && gap < 1.6 && Math.abs(c.pos.y - cy) < c.hh + hh) c.helpDir = p.dir;
    }
  }

  addLauncher(o) {
    const M = this.mt, w = o.w || 2.2;
    const g = new THREE.Group();
    g.position.set(o.x + w / 2, o.y, 0);
    const base = mesh(rbox(w, 0.22, 1.2, 0.05), M.woodBoard, 0, 0.11, 0);
    const plate = mesh(rbox(w * 0.36, 0.06, 0.6, 0.02), M.steel, w * 0.18, 0.25, 0);
    const bar = new THREE.Group();
    bar.position.set(-w * 0.05, 0.25, 0);
    const wire = new THREE.MeshStandardMaterial({ color: '#c9ccd0', metalness: 1, roughness: 0.3 });
    bar.add(mesh(new THREE.TorusGeometry(w * 0.32, 0.035, 6, 20, Math.PI), wire, w * 0.32, 0, 0, { rx: Math.PI / 2 }));
    const spring = mesh(new THREE.TorusGeometry(0.12, 0.04, 6, 12), wire, -w * 0.05, 0.3, 0.45);
    const bait = mesh(new THREE.ConeGeometry(0.22, 0.3, 3), M.cheese, w * 0.22, 0.42, 0, { rz: Math.PI / 2 });
    g.add(base, plate, bar, spring, bait);
    this.b.add(g, true);
    const L = { ...o, w, g, bar, armed: true, snapT: 0, armT: 0, flipN: 0, top: o.y + 0.25 };
    const col = this.addStatic({ x: o.x, y: o.y, w, h: 0.25, mat: 'wood', id: o.id });
    L.meta = col.meta;
    this.launchers.push(L);
    return L;
  }

  stepLaunchers(dt) {
    for (const L of this.launchers) {
      const f = this.flags['lt_' + L.id] || 0;
      if (f !== L.flipN) {
        L.flipN = f;
        L.snapT = 1;
        L.armed = false;
        L.armT = 1.3;
        this.sfx('snap', L.x + L.w / 2, L.y, 1);
        this.fx.emit('wood', L.x + L.w / 2, L.top, 0.3, 8);
        this.fx.emit('sparkle', L.x + L.w / 2, L.top + 0.3, 0.3, 6);
        this.fx.ring('ring', L.x + L.w / 2, L.top, 0.3, 14, 3);
        this.shake(0.2);
        for (const c of this.chars) {
          if (c.puppet || c.state !== 'walk') continue;
          if (Math.abs(c.pos.x - (L.x + L.w / 2)) < L.w / 2 + 0.1 && c.bottom < L.top + 0.4 && c.bottom > L.y - 0.1) {
            c.vel.y = L.power || 21; c.vel.x = L.push || 0; c.grounded = false; c.jumping = false; c.anim.squashV -= 14;
            c.pos.y += 0.05;
          }
        }
      }
      if (!L.armed) { L.armT -= dt; if (L.armT <= 0) { L.armed = true; this.sfx('latch', L.x + L.w / 2, L.y, 0.4); } }
      L.snapT = Math.max(0, L.snapT - dt * 2.5);
      L.bar.rotation.z = L.armed ? Math.PI * 0.82 : Math.PI * 0.82 * (L.armT < 0.6 ? (0.6 - L.armT) / 0.6 : 0);
      if (!L.armed) continue;
      const c = this.chars.find((q) => !q.puppet && q.state === 'walk' && q.grounded && q.groundM === L.meta && Math.abs(q.pos.x - (L.x + L.w / 2)) < L.w / 2 + 0.1);
      if (c) { L.armed = false; this.setFlag('lt_' + L.id, (this.flags['lt_' + L.id] || 0) + 1); }
    }
  }

  addPiano(o) {
    const M = this.mt;
    const n = o.keys || 14, kw = o.kw || 0.9, y = o.y;
    const ivory = new THREE.MeshStandardMaterial({ color: '#f6f1e6', roughness: 0.25 });
    const ebony = new THREE.MeshStandardMaterial({ color: '#1b1714', roughness: 0.2 });
    const P = { ...o, n, kw, keys: [], notes: o.notes || [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84] };
    for (let i = 0; i < n; i++) {
      const x = o.x + i * kw;
      const k = mesh(rbox(kw - 0.06, 0.5, 2.6, 0.04), ivory, x + kw / 2, y - 0.25, 0.4);
      this.b.add(k, true);
      if (i % 7 !== 2 && i % 7 !== 6 && i < n - 1) this.b.add(mesh(rbox(kw * 0.55, 0.35, 1.6, 0.03), ebony, x + kw, y + 0.12, -0.45), true);
      const col = this.addStatic({ x, y: y - 0.5, w: kw, h: 0.5, mat: 'wood', key: i, id: (o.id || 'pn') + '_' + i });
      P.keys.push({ mesh: k, meta: col.meta, down: 0, pressed: false, base: y - 0.25 });
    }
    this.pianos.push(P);
    return P;
  }

  stepPiano(P, dt) {
    for (let i = 0; i < P.keys.length; i++) {
      const k = P.keys[i];
      const x0 = P.x + i * P.kw, x1 = x0 + P.kw;
      const on = this.chars.some((c) => (c.state === 'walk' || c.state === 'script') && c.pos.x > x0 - c.hw * 0.4 && c.pos.x < x1 + c.hw * 0.4 && c.bottom > P.y - 0.15 && c.bottom < P.y + 0.12 && Math.abs(c.vel.y) < 2.5);
      if (on && !k.pressed) {
        this.game.audio.key(P.notes[i % P.notes.length]);
        this.fx.emit('note', (x0 + x1) / 2, P.y + 0.6, 0.6, 1);
      }
      k.pressed = on;
      k.down += ((on ? 1 : 0) - k.down) * Math.min(1, dt * 18);
      k.mesh.position.y = k.base - k.down * 0.12;
      k.mesh.rotation.x = k.down * 0.04;
    }
  }

  addSeesaw(o) {
    const M = this.mt, len = o.len || 5, tilt = o.tilt || 0.26;
    const g = new THREE.Group();
    g.position.set(o.x, o.y, 0);
    const plank = new THREE.Group();
    plank.add(mesh(rbox(len, 0.18, 1.4, 0.06), o.mat === 'metal' ? M.steel : M.woodBoard, 0, 0.09, 0));
    plank.add(mesh(new THREE.SphereGeometry(0.5, 16, 10), o.mat === 'metal' ? M.steel : M.woodBoard, len / 2 - 0.3, 0.12, 0, { sx: 1.2, sy: 0.35, sz: 0.9 }));
    g.add(plank);
    const fulcrum = mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.6, 20), o.fulcrumMat ? M[o.fulcrumMat] : M.ceramicCream, 0, -0.45, 0, { rx: Math.PI / 2 });
    g.add(fulcrum);
    this.b.add(g, true);
    const S = { ...o, len, tilt, g, plank, side: o.side || -1, ang: 0, flipN: 0, col: null };
    S.ang = S.side * -tilt;
    this.seesaws.push(S);
    this.placeSeesaw(S);
    return S;
  }

  placeSeesaw(S) {
    if (S.col) this.phys.remove(S.col);
    const a = S.ang;
    const cx = S.x - Math.sin(a) * 0.09, cy = S.y + Math.cos(a) * 0.09;
    const W = this;
    S.col = this.addStatic({ x: cx - S.len / 2, y: cy - 0.09, w: S.len, h: 0.18, rot: a, mat: 'wood', id: S.id, slope: false, onLand: (w, ch, v) => W.seesawLand(S, ch, v) });
    S.meta = S.col.meta;
    S.plank.rotation.z = a;
  }

  seesawLand(S, ch, v) {
    const dx = ch.pos.x - S.x;
    const high = -S.side;
    if (Math.sign(dx) === high && Math.abs(dx) > S.len * 0.2 && v > (S.minV || 5.5)) {
      this.setFlag('ss_' + S.id, (this.flags['ss_' + S.id] || 0) + 1);
    }
  }

  stepSeesaws(dt) {
    for (const S of this.seesaws) {
      const f = this.flags['ss_' + S.id] || 0;
      if (f !== S.flipN) {
        S.flipN = f;
        const old = S.side;
        S.side = -S.side;
        for (const c of this.chars) {
          if (c.puppet || c.state !== 'walk') continue;
          const dx = c.pos.x - S.x;
          if (Math.sign(dx) === old && Math.abs(dx) < S.len / 2 + 0.2 && Math.abs(dx) > 0.3 && c.bottom > S.y - 1.2 && c.bottom < S.y + 1.4) {
            c.vel.y = S.power || 18; c.vel.x = (S.push || 0) * (S.pushDir || -old); c.grounded = false; c.jumping = false; c.pos.y += 0.1; c.anim.squashV -= 12;
          }
        }
        this.sfx('woodHeavy', S.x, S.y, 0.9);
        this.sfx('twang', S.x, S.y, 0.4);
        this.fx.ring('ring', S.x + old * S.len * 0.4, S.y, 0.3, 12, 3);
        this.fx.emit('sparkle', S.x + old * S.len * 0.4, S.y + 0.5, 0.3, 6);
        this.shake(0.18);
      }
      const target = S.side * -S.tilt;
      if (Math.abs(S.ang - target) > 0.001) {
        S.ang += (target - S.ang) * Math.min(1, dt * 22);
        if (Math.abs(S.ang - target) < 0.01) S.ang = target;
        this.placeSeesaw(S);
      }
    }
  }

  addToaster(o) {
    const { gr, lever } = this.b.toaster(o.x, o.y, o.w || 3.2, o.h || 2.4);
    const t = { id: o.id, x: o.x, y: o.y, w: o.w || 3.2, top: o.y + (o.h || 2.4), slotX: o.x + (o.w || 3.2) / 2, power: o.power || 20, delay: o.delay || 1.6, push: o.push || 0, lever, gr, leverY: lever.position.y, occupied: null };
    const glow = mesh(new THREE.PlaneGeometry((o.w || 3.2) * 0.8, 1.4), new THREE.MeshBasicMaterial({ map: this.mt.shadowBlob.map, color: '#ff8a3a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), t.slotX, t.top + 0.1, 1.05, { cast: false, receive: false });
    glow.renderOrder = 6;
    this.b.add(glow, true);
    t.glow = glow;
    this.toasters.push(t);
    this.zones.push({ x: t.x, y: t.top - 0.2, w: t.w, h: 1.0, rate: 0.07, fx: 'heat', when: () => !!this.flags['ts_' + t.id] });
    return t;
  }

  setFlag(k, v) {
    if (this.flags[k] === v) return;
    this.flags[k] = v;
    if (!(k in this.flagT) || !v) this.flagT[k] = this.time;
    if (v && !this.flagT[k + '+']) this.flagT[k + '+'] = this.time;
    if (this.net) this.net.setFlag(k, v);
  }

  netFlag(k, v) {
    if (this.flags[k] === v) return;
    this.flags[k] = v;
    this.flagT[k] = this.time;
    if (v && !this.flagT[k + '+']) this.flagT[k + '+'] = this.time;
  }

  can(a) { return this.abil.has(a); }
  charByKind(k) { return this.chars.find((c) => c.kind === k) || null; }
  localChars() { return this.chars.filter((c) => !c.puppet); }

  hint(ch, key, text) {
    if (!ch || ch.puppet || ch !== this.game.active) return;
    const n = (this.shown.has(key) ? 1 : 0);
    if (n) return;
    this.shown.add(key);
    this.game.ui.hint(text, 4.5);
  }

  sfx(name, x, y, vol = 1) {
    const dx = x - this.cam.x, dy = y - this.cam.y;
    const d = Math.hypot(dx, dy * 1.3);
    const att = 1 / (1 + Math.max(0, d - 6) * 0.18);
    if (att < 0.05) return;
    this.game.audio.sfx(name, vol * att, Math.max(-0.8, Math.min(0.8, dx / 14)));
  }

  effect(type, x, y, variant, power = 0) {
    const F = this.fx;
    if (type === 'dust') F.emit(variant === 'butter' ? 'butter' : 'dust', x, y, 0.3);
    else if (type === 'crumbs') { F.emit(variant || 'bread', x, y, 0.4); F.emit('sparkle', x, y, 0.5, 3); }
    else if (type === 'chips') F.emit('wood', x, y, 0.4);
    else if (type === 'spark') F.emit('spark', x, y, 0.4);
    else if (type === 'poof') F.emit('poof', x, y, 0.3);
    else if (type === 'puff') F.emit(variant === 'butter' ? 'butterPuff' : 'puff', x, y, 0.3);
    else if (type === 'step') F.emit(variant === 'butter' ? 'butterStep' : 'step', x, y, 0.35);
    else if (type === 'land') { const n = Math.min(18, 4 + Math.round(power * 0.8)); F.ring(variant === 'butter' ? 'butterRing' : 'ring', x, y, 0.3, n, 1.2 + power * 0.18); if (variant === 'butter' && power > 6) F.emit('butter', x, y + 0.1, 0.4, 6); }
    else if (type === 'bounce') { F.ring('ring', x, y, 0.3, 14, 3.5); F.emit('sparkle', x, y + 0.2, 0.4, 6); }
    else if (type === 'splash') F.emit('splash', x, y, 0.4, 10);
    else if (type === 'steam') F.emit('steamPuff', x, y, 0.3, 8);
    else if (type === 'frostBurst') { F.emit('frostBurst', x, y, 0.4, 14); F.emit('sparkle', x, y, 0.4, 4); }
    else if (type === 'sparkle') F.emit('sparkle', x, y, 0.4, 10);
    else F.emit(type, x, y, 0.3);
  }

  shake(a) { this.cam.shake = Math.max(this.cam.shake, a); }

  solve(x, y) {
    this.game.audio.sting();
    this.fx.emit('sparkle', x, y, 0.5, 26);
    this.fx.ring('ring', x, y - 0.2, 0.4, 20, 4);
    this.shake(0.16);
  }

  slash(x, y, dir) {
    let sl = this.slashes.find((q) => q.t >= q.dur);
    if (!sl) {
      if (!this.slashGeo) {
        const sh = new THREE.Shape();
        sh.absarc(0, 0, 1, -1.1, 1.1, false);
        sh.absarc(0.25, 0, 0.82, 1.0, -1.0, true);
        this.slashGeo = new THREE.ShapeGeometry(sh, 16);
      }
      const m = new THREE.Mesh(this.slashGeo, new THREE.MeshBasicMaterial({ color: '#fff6e2', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      m.renderOrder = 12;
      sl = { m, t: 1, dur: 0.18 };
      this.slashes.push(sl);
      this.b.root.add(m);
    }
    sl.t = 0;
    sl.m.position.set(x, y, 0.6);
    sl.m.scale.set(dir * 0.9, 1.1, 1);
    sl.m.rotation.z = 0;
  }

  seepDrip(s, ch) {
    if (s.dir === 'down') {
      const n = Math.max(1, Math.floor((ch.hw * 2) / s.gap));
      const k = Math.floor(Math.random() * n);
      let gx = s.gx0 + (Math.floor((ch.pos.x - ch.hw - s.gx0) / s.gap) + k + 0.5) * s.gap;
      gx = Math.max(s.gl + 0.05, Math.min(s.gr - 0.05, gx));
      this.fx.emit('drip', gx, s.gt - 0.02, (Math.random() - 0.5) * 1.2, 1);
    } else {
      const gy = s.gb + Math.random() * (s.gt - s.gb);
      const gx = s.dir > 0 ? s.gl : s.gr;
      this.fx.emit(s.dir > 0 ? 'dripRight' : 'dripLeft', gx, Math.min(gy, ch.pos.y + 0.12), (Math.random() - 0.5) * 1.0, 1);
    }
  }

  onDeath(ch) {
    this.sfx('poof', ch.pos.x, ch.pos.y, 0.7);
    this.fx.emit('poof', ch.pos.x, ch.pos.y, 0.4);
    if (this.inWater(ch.pos.x, ch.pos.y)) this.fx.emit('splash', ch.pos.x, ch.pos.y, 0.4);
    if (ch === this.game.active) this.game.ui.flash();
  }

  killY(x) {
    let y = this.def.killY ?? -40;
    for (const k of this.kills) if (x >= k.x0 && x <= k.x1) y = Math.max(y, k.y);
    return y;
  }

  waterAt(x) {
    for (const w of this.waters) if (x >= w.x0 && x <= w.x1) return w;
    return null;
  }

  inWater(x, y) {
    for (const w of this.waters) if (x >= w.x0 && x <= w.x1 && y < w.y) return true;
    return false;
  }

  ambientAt(x, y) {
    for (const a of this.ambients) if (x >= a.x0 && x <= a.x1 && (a.y0 === undefined || (y >= a.y0 && y <= a.y1))) return a.temp;
    return this.def.ambient ?? 0.45;
  }

  heatAt(x, y, ch) {
    let r = 0;
    for (const z of this.zones) {
      if (z.when && !z.when(this)) continue;
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) r += z.rate;
    }
    return r;
  }

  spawnFor(kind) {
    const i = this.flags.cp || 0;
    for (let k = i; k >= 0; k--) {
      const cp = this.checkpoints[k];
      if (cp && cp.spawns && cp.spawns[kind]) return cp.spawns[kind];
    }
    return this.spawns[kind];
  }

  groundVelocity(m) {
    const inv = 1 / this.dt;
    if (m.char) {
      const c = m.char;
      if (c.state !== 'walk' && c.state !== 'script') return { x: 0, y: 0 };
      return { x: (c.pos.x - c.prev.x) * inv, y: (c.pos.y - c.prev.y) * inv };
    }
    if (m.box || m.item) { const o = m.box || m.item; return { x: (o.pos.x - o.prev.x) * inv, y: (o.pos.y - o.prev.y) * inv }; }
    if (m.mech) return { x: m.mech.vx, y: m.mech.vy };
    return { x: 0, y: 0 };
  }

  pushersOf(box) {
    const out = { l: 0, r: 0 };
    for (const c of this.chars) {
      const p = c.pushing;
      if (!p) continue;
      if (p.id === box.id) { if (p.dir > 0) out.r += p.s; else out.l += p.s; }
    }
    return out;
  }

  slickAt(x, y, self, hw = 0) {
    for (const c of this.chars) {
      if (c === self || c.kind !== 'butter' || !c.smear) continue;
      if (c.state === 'smear' && c.smear.kind === 'floor') {
        if (Math.abs(x - c.smear.x) < 0.75 + hw && Math.abs(y - c.smear.y) < 0.35) return true;
      } else if (c.state === 'spread') {
        if (x + hw >= c.smear.x0 - 0.1 && x - hw <= c.smear.x1 + 0.1 && Math.abs(y - c.smear.y) < 0.35) return true;
      }
    }
    return false;
  }

  grabbableNear(fork, hx, hy, hw, hh) {
    let best = null, bd = 1e9;
    const ahead = (x) => (x - fork.pos.x) * fork.face > -0.05;
    for (const m of this.movers) {
      if (m.type !== 'item' || m.carrier || !ahead(m.pos.x)) continue;
      if (!aabbOverlap(hx, hy, hw, hh, m.pos.x, m.pos.y, m.hw, m.hh)) continue;
      const d = Math.abs(m.pos.x - fork.pos.x);
      if (d < bd) { bd = d; best = m; }
    }
    for (const c of this.chars) {
      if (c.kind !== 'butter' || c === fork) continue;
      if (c.state !== 'walk' || c.melted || c.squish || !ahead(c.pos.x)) continue;
      if (!aabbOverlap(hx, hy, hw, hh, c.pos.x, c.pos.y, c.hw, c.hh)) continue;
      const d = Math.abs(c.pos.x - fork.pos.x) - 0.2;
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  butterSmearNear(knife, x, y, r) {
    for (const c of this.chars) {
      if (c.kind !== 'butter' || c.state !== 'smear' || !c.smear || c.smear.kind !== 'floor') continue;
      if (Math.abs(c.smear.x - x) < r && Math.abs(c.smear.y - y) < 0.6) return c;
    }
    return null;
  }

  spreadExtent(x, y, dir, max) {
    const ground = (px) => {
      const h = this.phys.cast(px, y + 0.25, 0, -1, 0.5, (m) => !m.char && !m.item && !m.box);
      return h && Math.abs(h.y - y) < 0.2;
    };
    const wall = (px, d) => !!this.phys.cast(px, y + 0.15, d, 0, 0.22, (m) => !m.char && !m.item && !m.box && !m.oneWay);
    let x1 = x;
    for (let s = 0.2; s <= max; s += 0.2) { const px = x + dir * s; if (!ground(px) || wall(px - dir * 0.2, dir)) break; x1 = px; }
    let x0 = x;
    for (let s = 0.2; s <= 0.6; s += 0.2) { const px = x - dir * s; if (!ground(px) || wall(px + dir * 0.2, -dir)) break; x0 = px; }
    return dir > 0 ? { x0, x1 } : { x0: x1, x1: x0 };
  }

  anchorValid(m, ch) {
    if (!m || m.off) return false;
    if (!this.phys.meta.has(m.collider ? m.collider.handle : -1)) return false;
    if (m.char) return m.char.state === 'smear' && m.char.smear && m.char.smear.kind === 'wall';
    const p = ch.plant;
    const c = m.collider.translation();
    if (p && (Math.abs(p.y - c.y) > m.hh + 0.15 || Math.abs(p.wx - c.x) > m.hw + 0.3)) return false;
    return true;
  }

  request(ch, req) {
    if (!ch.puppet) { ch.applyRequest(req); return; }
    if (this.net) this.net.request(ch.kind, req);
    if (req.t === 'grab') { ch.state = 'carried'; ch.carrier = this.charByKind(req.by); ch.override = 0.9; ch.syncCol(); }
    if (req.t === 'throw') { ch.state = 'walk'; ch.carrier = null; ch.pos.x = req.x; ch.pos.y = req.y; ch.prev.x = req.x; ch.prev.y = req.y; ch.vel.x = req.vx; ch.vel.y = req.vy; ch.override = 0.6; ch.syncCol(); }
  }

  sendRelease(butter, carrier) {
    if (!carrier) return;
    if (carrier.puppet) { if (this.net) this.net.request(carrier.kind, { t: 'release' }); }
    else carrier.held = null;
  }

  claimItem(m) {
    m.puppet = false;
    m.owner = this.uid;
    if (this.net) this.net.claim(m.id);
  }

  tryCut(knife, cx, cy, hw, hh) {
    for (const r of this.ropes) {
      if (r.cut) continue;
      const top = r.pts[0].y, bot = r.pts[r.n].y;
      const rx = r.pts[Math.floor(r.n / 2)].x;
      if (Math.abs(rx - cx) < hw + 0.1 && cy - hh < top && cy + hh > bot) {
        this.setFlag('rope_' + r.id, 1);
        this.sfx('slice', rx, cy, 0.9);
        this.fx.emit('sparkle', rx, Math.min(top, Math.max(bot, cy)), 0.3, 5);
        return true;
      }
    }
    for (const c of this.cuttables) {
      if (c.cut) continue;
      if (!aabbOverlap(cx, cy, hw, hh, c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2)) continue;
      if (c.hold) {
        const held = this.chars.some((f) => f.kind === 'fork' && f.state === 'planted' && ((f.anchor && f.anchor.id === c.id) || f.anchorId === c.id));
        if (!held) {
          c.wob = 1;
          this.sfx('wobble', c.x + c.w / 2, c.y + c.h / 2, 0.8);
          this.hint(knife, 'hold-' + c.food, c.holdHint || 'It slips away. Fork has to hold it still while Knife cuts.');
          return true;
        }
      }
      this.setFlag('cut_' + c.id, 1);
      this.sfx('slice', c.x + c.w / 2, cy, 1);
      this.fx.emit(c.food === 'cheese' ? 'cheese' : 'bread', cx, cy, 0.5, 20);
      this.fx.emit('sparkle', cx, cy, 0.5, 6);
      return true;
    }
    return false;
  }

  doCut(c) {
    if (c.cut) return;
    c.cut = true;
    if (c.after) {
      const a = c.after;
      this.phys.setBox(c.col, a.x + a.w / 2, a.y + a.h / 2, a.w / 2, a.h / 2, 0);
      c.meta.top = a.y + a.h;
    } else {
      this.phys.remove(c.col);
      c.meta.off = true;
    }
    if (c.onCut) c.onCut(this, c);
    if (!c.fallsLater) this.solve(c.x + c.w / 2, c.y + c.h * 0.6);
  }

  toasterPop(t) {
    this.setFlag('ts_' + t.id, 0);
    this.popFx(t);
  }

  popFx(t) {
    this.sfx('pop', t.slotX, t.top, 1);
    this.sfx('ding', t.slotX, t.top, 0.7);
    this.fx.emit('bread', t.slotX, t.top + 0.2, 0.3, 16);
    this.fx.emit('steamPuff', t.slotX, t.top + 0.3, 0.2, 10);
    this.fx.emit('sparkle', t.slotX, t.top + 0.4, 0.3, 8);
    this.fx.ring('ring', t.slotX, t.top + 0.05, 0.2, 14, 3);
    t.kick = 1;
    this.shake(0.25);
  }

  tick(dt, inputs) {
    this.dt = dt;
    this.time += dt;
    for (const m of this.mechs) this.stepMech(m, dt);
    for (const f of this.fallers) this.stepFaller(f, dt);
    for (const c of this.cuttables) {
      if (!c.cut && this.flags['cut_' + c.id]) this.doCut(c);
      c.wob = Math.max(0, c.wob - dt * 2.5);
      if (c.group && !c.cut) c.group.rotation.z = Math.sin(this.time * 30) * 0.04 * c.wob;
    }
    for (const r of this.ropes) if (!r.cut && this.flags['rope_' + r.id]) this.cutRope(r);
    this.assignHelpers();
    for (const c of this.chars) {
      c.step(dt, inputs[c.kind] || NOINPUT);
      if (c.puppet && c.override <= 0 && this.net) { const s = this.net.sample('c', c.kind); if (s) c.applyNet(s); }
    }
    for (const m of this.movers) {
      if (m.puppet && this.net) { const s = this.net.sample('o', m.id); if (s) { m.prev.x = m.pos.x; m.prev.y = m.pos.y; m.applyNet(s); } }
      m.step(dt);
    }
    this.claimPushed();
    this.stepTopplers(dt);
    this.stepLaunchers(dt);
    this.stepSeesaws(dt);
    this.stepToasters(dt);
    if (this.isHost) this.stepPlates();
    else for (const p of this.plates) this.updatePlateVisual(p, !!this.flags['pl_' + p.id]);
    this.stepCheckpoints();
    this.stepTriggers();
    if (this.isHost) this.stepEnd(dt);
    for (const u of this.updaters) u(this, dt);
    this.phys.step();
  }

  claimPushed() {
    if (!this.net) return;
    for (const c of this.chars) {
      if (c.puppet || !c.pushing) continue;
      const box = c.pushing.box;
      if (box && box.puppet && this.time - (box.netMoveT || -10) > 0.45) {
        box.puppet = false;
        box.owner = this.uid;
        this.net.claim(box.id);
      }
    }
  }

  stepMech(m, dt) {
    const open = m.when ? !!m.when(this) : false;
    const target = open ? 1 : 0;
    const sp = (m.speed || 2.5) / Math.max(0.1, Math.hypot(m.dx || 0, m.dy || 0));
    const pt = m.t;
    m.t = target > m.t ? Math.min(target, m.t + sp * dt) : Math.max(target, m.t - sp * dt);
    if (m.t !== pt && Math.abs(m.t - target) < 1e-6 && m.stopSfx) this.sfx(m.stopSfx, m.cx, m.cy, 0.6);
    if (m.t !== pt && !m.moving && m.startSfx) this.sfx(m.startSfx, m.cx, m.cy, 0.6);
    m.moving = m.t !== pt;
    const e = m.ease === false ? m.t : smoothstep(0, 1, m.t);
    const nx = m.x + m.w / 2 + (m.dx || 0) * e, ny = m.y + m.h / 2 + (m.dy || 0) * e;
    m.vx = (nx - m.cx) / dt; m.vy = (ny - m.cy) / dt;
    m.cx = nx; m.cy = ny;
    this.phys.place(m.col, nx, ny);
    m.meta.top = ny + m.h / 2;
    if (m.group) {
      if (m.gx0 === undefined) { m.gx0 = m.group.position.x; m.gy0 = m.group.position.y; }
      m.group.position.x = m.gx0 + (m.dx || 0) * e;
      m.group.position.y = m.gy0 + (m.dy || 0) * e;
    }
    if (m.onStep) m.onStep(this, e, dt);
  }

  stepFaller(f, dt) {
    if (!f.started) {
      if (f.when && f.when(this)) { f.started = true; f.t0 = this.time; if (f.colObj) { this.phys.remove(f.colObj); f.colObj = null; } if (f.onStart) f.onStart(this, f); }
      else return;
    }
    if (f.done) return;
    const dur = f.dur || 0.8;
    const k = Math.min(1, (this.time - f.t0) / dur);
    let e = k * k;
    if (f.bounce !== false && k >= 1) e = 1;
    const fr = f.from, to = f.to;
    const g = f.group;
    g.position.x = fr.x + (to.x - fr.x) * (f.arc ? smoothstep(0, 1, k) : e);
    g.position.y = fr.y + (to.y - fr.y) * e;
    g.rotation.z = (fr.r || 0) + ((to.r || 0) - (fr.r || 0)) * Math.min(1, e * 1.1);
    if (k >= 1) {
      f.done = true;
      if (f.col) f.colObj = this.addStatic({ ...f.col, id: f.id });
      this.sfx(f.sound || 'wood', to.x, to.y, 1);
      this.fx.emit('dust', to.x, to.y, 0.5, 12);
      this.cam.shake = Math.max(this.cam.shake, 0.18);
      if (f.solve !== false) this.solve(to.x, to.y + 0.5);
      if (f.onLand) f.onLand(this, f);
    }
  }

  cutRope(r) {
    r.cut = true;
    r.cutAt = Math.max(1, Math.floor(r.n * (r.cutFrac ?? 0.6)));
    for (let i = r.cutAt; i <= r.n; i++) { r.pts[i].px -= (Math.random() - 0.5) * 0.05; }
    this.fx.emit('wood', r.x, r.pts[r.cutAt].y, 0.3, 6);
  }

  stepRopes(dt) {
    for (const r of this.ropes) {
      const pts = r.pts;
      for (let i = 1; i <= r.n; i++) {
        const p = pts[i];
        if (!r.cut && i === r.n && r.attach) {
          const a = r.attach(this);
          if (a) { p.x = a.x; p.y = a.y; p.px = a.x; p.py = a.y; continue; }
        }
        const vx = (p.x - p.px) * 0.985, vy = (p.y - p.py) * 0.985;
        p.px = p.x; p.py = p.y;
        p.x += vx + Math.sin(this.time * 0.7 + i) * 0.00015;
        p.y += vy - 18 * dt * dt;
      }
      for (let it = 0; it < 6; it++) {
        for (let i = 0; i < r.n; i++) {
          if (r.cut && i === r.cutAt - 1) continue;
          const a = pts[i], b = pts[i + 1];
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-4;
          const diff = (d - r.len) / d;
          if (i === 0) { b.x -= dx * diff; b.y -= dy * diff; }
          else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
        }
        pts[0].x = r.x; pts[0].y = r.y0;
      }
      const o = new THREE.Object3D();
      for (let i = 0; i < r.n; i++) {
        const a = pts[i], b = pts[i + 1];
        const hide = r.cut && (i === r.cutAt - 1 || (i >= r.cutAt && r.dropLower !== false));
        o.position.set(a.x, a.y, 0.05);
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        o.rotation.set(0, 0, Math.atan2(-dx, dy));
        o.scale.set(1, hide ? 0.0001 : d, 1);
        o.updateMatrix();
        r.inst.setMatrixAt(i, o.matrix);
      }
      r.inst.instanceMatrix.needsUpdate = true;
    }
  }

  stepToasters(dt) {
    for (const t of this.toasters) {
      const busy = this.flags['ts_' + t.id];
      if (t.wasBusy && !busy && !t.kick) this.popFx(t);
      t.wasBusy = !!busy;
      t.kick = Math.max(0, (t.kick || 0) - dt * 4);
      t.gr.position.y = t.y + Math.sin(t.kick * 20) * 0.04 * t.kick;
      t.glowT = (t.glowT || 0) + ((busy ? 1 : 0) - (t.glowT || 0)) * Math.min(1, dt * 3);
      if (t.glow) t.glow.material.opacity = t.glowT * (0.55 + Math.sin(this.time * 9) * 0.08);
      const ly = t.leverY - (busy ? 0.7 : 0);
      t.lever.position.y += (ly - t.lever.position.y) * Math.min(1, dt * 14);
      if (busy && Math.random() < dt * 6) this.fx.emit('heat', t.slotX + (Math.random() - 0.5) * 1.5, t.top + 0.2, 0.2, 1);
      if (busy) {
        t.tick = (t.tick || 0) + dt;
        if (t.tick > 0.25) { t.tick = 0; this.sfx('tick', t.slotX, t.top, 0.35); }
      }
      for (const c of this.chars) {
        if (c.puppet || c.state !== 'walk' || c.vel.y > 0.5) continue;
        if (Math.abs(c.pos.x - t.slotX) < 0.9 && c.bottom > t.top - 0.08 && c.bottom < t.top + 0.35 && !busy) {
          c.enterToaster(t);
          this.setFlag('ts_' + t.id, c.kind);
          this.sfx('latch', t.slotX, t.top, 0.9);
        }
      }
    }
  }

  stepPlates() {
    for (const p of this.plates) {
      let load = 0;
      const x0 = p.x - 0.1, x1 = p.x + p.w + 0.1;
      for (const c of this.chars) {
        if (c.state !== 'walk' && c.state !== 'script' && c.state !== 'smear' && c.state !== 'carried') continue;
        const b = c.state === 'carried' && c.carrier ? c.carrier.bottom : c.bottom;
        const x = c.state === 'carried' && c.carrier ? c.carrier.pos.x : c.pos.x;
        if (x > x0 && x < x1 && b > p.y - 0.1 && b < p.y + 0.35) load += c.weight;
      }
      for (const c of this.chars) {
        if (c.state !== 'walk') continue;
        const under = this.chars.find((u) => u !== c && u.state === 'walk' && Math.abs(u.pos.x - c.pos.x) < u.hw + c.hw && Math.abs(c.bottom - (u.pos.y + u.hh)) < 0.15);
        if (under && under.pos.x > x0 && under.pos.x < x1 && under.bottom > p.y - 0.1 && under.bottom < p.y + 0.35) load += c.weight;
      }
      for (const m of this.movers) {
        if (m.carrier) continue;
        const b = m.pos.y - m.hh;
        if (m.pos.x > x0 && m.pos.x < x1 && b > p.y - 0.1 && b < p.y + 0.35) load += m.weight;
      }
      p.load = load;
      const pressed = load >= p.need;
      if (pressed !== !!this.flags['pl_' + p.id]) this.setFlag('pl_' + p.id, pressed ? 1 : 0);
      this.updatePlateVisual(p, pressed, load);
    }
  }

  updatePlateVisual(p, pressed, load) {
    if (p.handle) {
      p.top.rotation.z += ((pressed ? -0.35 : 0) - p.top.rotation.z) * 0.25;
      if (pressed && !p.pressed) this.sfx('latch', p.x + p.w / 2, p.y, 0.9);
      p.pressed = pressed;
      return;
    }
    p.top.position.y += ((pressed ? 0.0 : 0.07) - p.top.position.y) * 0.3;
    const grams = Math.round((load ?? (pressed ? p.need : 0)) * 125);
    if (p.shown !== grams || p.pressed !== pressed) {
      if (pressed && !p.pressed) this.sfx('switch', p.x + p.w / 2, p.y, 0.8);
      p.pressed = pressed;
      p.shown = grams;
      this.drawScale(p, grams);
    }
  }

  stepCheckpoints() {
    const cur = this.flags.cp || 0;
    for (let i = this.checkpoints.length - 1; i > cur; i--) {
      const cp = this.checkpoints[i];
      const hit = this.chars.some((c) => !c.puppet && c.state === 'walk' && c.pos.x >= cp.x && (cp.minY === undefined || c.pos.y >= cp.minY) && (cp.maxY === undefined || c.pos.y <= cp.maxY));
      if (hit) {
        this.setFlag('cp', i);
        const c = this.chars.find((q) => !q.puppet && q.pos.x >= cp.x) || this.chars[0];
        this.fx.emit('sparkle', c.pos.x, c.pos.y + 0.4, 0.4, 12);
        this.game.audio.checkpoint();
        break;
      }
    }
  }

  stepTriggers() {
    for (const t of this.triggers) {
      if (t.done) continue;
      const inside = (c) => c.pos.x >= t.x && c.pos.x <= t.x + t.w && c.pos.y >= t.y && c.pos.y <= t.y + t.h && c.state !== 'respawn';
      let ok;
      if (t.who === 'all') ok = this.chars.every(inside);
      else if (t.who && t.who !== 'any') { const c = this.charByKind(t.who); ok = c && inside(c); }
      else ok = this.chars.some(inside);
      if (t.when) ok = ok && t.when(this);
      if (ok) { t.done = true; t.run(this); }
    }
    const a = this.game.active;
    if (a) for (const h of this.hints) {
      if (h.done) continue;
      if (h.who && h.who !== a.kind) continue;
      if (a.pos.x >= h.x && a.pos.x <= h.x + h.w && a.pos.y >= h.y && a.pos.y <= h.y + h.h) {
        if (h.when && !h.when(this)) continue;
        h.done = true;
        this.game.ui.hint(h.text, h.dur || 5);
      }
    }
  }

  stepEnd(dt) {
    if (this.flags.end) return;
    for (const e of this.ends) {
      const all = this.chars.every((c) => c.pos.x >= e.x && c.pos.x <= e.x + e.w && c.pos.y >= e.y && c.pos.y <= e.y + e.h && (c.state === 'walk' || c.state === 'script'));
      e.t = all ? (e.t || 0) + dt : 0;
      if (e.t > 0.6) this.setFlag('end', 1);
    }
  }

  frame(dt, alpha) {
    this.stepRopes(dt);
    for (const sl of this.slashes) {
      if (sl.t >= sl.dur) { sl.m.visible = false; continue; }
      sl.t += dt;
      const k = Math.min(1, sl.t / sl.dur);
      sl.m.visible = true;
      sl.m.material.opacity = Math.sin(k * Math.PI) * 0.85;
      sl.m.rotation.z = (k - 0.5) * 1.4 * Math.sign(sl.m.scale.x);
    }
    for (const pn of this.pianos) this.stepPiano(pn, dt);
    for (const c of this.chars) c.render(dt, alpha);
    for (const m of this.movers) m.render(alpha);
    for (const z of this.zones) {
      if (!z.fx || (z.when && !z.when(this))) continue;
      if (Math.abs(z.x + z.w / 2 - this.cam.x) > 22) continue;
      z.acc = (z.acc || 0) + dt * (z.fxRate || (z.fx === 'frost' ? 8 : z.fx === 'steam' ? 3 : 5)) * (z.w * z.h) / 6;
      while (z.acc > 1) { z.acc -= 1; this.fx.emitBox(z.fx, z.x, z.y, z.w, z.h * (z.fx === 'heat' ? 0.4 : 1), z.z0 ?? -0.8, z.z1 ?? 1.4, 1); }
    }
    for (const e of this.emitters) {
      if (e.when && !e.when(this)) continue;
      e.acc += dt * e.rate;
      while (e.acc > 1) { e.acc -= 1; this.fx.emitBox(e.type, e.x, e.y, e.w, e.h, e.z0 ?? -2, e.z1 ?? 3, 1); }
    }
    this.fx.update(dt, this.camScale);
  }

  updateCamera(dt, focus, cut) {
    const cam = this.cam;
    const R = this.game.renderer;
    let tx = cam.tx, ty = cam.ty, dist = this.def.camDist || 24, yOff = 1.2;
    if (cam.story) {
      tx = cam.story.x; ty = cam.story.y; dist = cam.story.dist || dist; yOff = cam.story.yOff ?? 0;
    } else if (focus) {
      const fx = focus.rpos.x + focus.face * 0.8 + focus.vel.x * 0.18;
      const fy = focus.rpos.y;
      let minX = fx, maxX = fx, minY = fy, maxY = fy;
      for (const c of this.def.soloCam ? [] : this.chars) {
        if (c === focus || !c.root.visible) continue;
        if (Math.abs(c.rpos.x - fx) < 11 && Math.abs(c.rpos.y - fy) < 7) {
          minX = Math.min(minX, c.rpos.x); maxX = Math.max(maxX, c.rpos.x);
          minY = Math.min(minY, c.rpos.y); maxY = Math.max(maxY, c.rpos.y);
        }
      }
      tx = (minX + maxX) / 2 * 0.7 + fx * 0.3;
      ty = (minY + maxY) / 2 * 0.7 + fy * 0.3;
      dist += Math.max(0, (maxX - minX) - 8) * 0.9 + Math.max(0, (maxY - minY) - 4) * 1.2;
      for (const z of this.cams) {
        if (fx < z.x0 || fx > z.x1 || (z.y0 !== undefined && (fy < z.y0 || fy > z.y1))) continue;
        const edge = Math.min(1, (fx - z.x0) / 3, (z.x1 - fx) / 3);
        if (z.dist) dist += (z.dist - dist) * edge;
        if (z.y !== undefined) ty += (z.y - ty) * edge * (z.lockY ?? 0.6);
        if (z.yOff !== undefined) yOff += (z.yOff - yOff) * edge;
        if (z.x !== undefined) tx += (z.x - tx) * edge * (z.lockX ?? 0.5);
      }
    }
    if (this.def.camX && !cam.story) tx = Math.max(this.def.camX[0], Math.min(this.def.camX[1], tx));
    cam.tx = tx; cam.ty = ty;
    const k = cut ? 1 : 1 - Math.exp(-dt * (cam.story ? 1.6 : 3.2));
    cam.x += (tx - cam.x) * k;
    cam.y += (ty + yOff - cam.y) * (cut ? 1 : 1 - Math.exp(-dt * 2.4));
    cam.dist += (dist - cam.dist) * (cut ? 1 : 1 - Math.exp(-dt * 1.8));
    cam.shake = Math.max(0, cam.shake - dt);
    const sh = cam.shake * cam.shake * 0.6;
    const c = R.camera;
    const tilt = this.def.camTilt ?? 0.11;
    c.position.set(cam.x + (Math.random() - 0.5) * sh, cam.y + cam.dist * tilt + (Math.random() - 0.5) * sh, cam.dist);
    c.lookAt(cam.x, cam.y, 0);
    R.dof.focus = Math.hypot(cam.dist, cam.dist * tilt);
    R.followSun(cam.x, cam.y);
    this.camScale = R.h / (2 * Math.tan(THREE.MathUtils.degToRad(c.fov / 2)));
  }

  dispose() {
    this.scene.remove(this.b.root);
    this.b.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    for (const l of this.lightsAdded) this.scene.remove(l);
    for (const c of this.chars) c.dispose();
    this.fx.dispose(this.scene);
    this.phys.dispose();
  }
}

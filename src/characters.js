// Characters: Fork, Knife and Butter — models, movement, abilities, combos and network puppets.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const KINDS = {
  fork: { name: 'Fork', hw: 0.17, hh: 0.94, speed: 4.8, accel: 44, airAccel: 26, jump: 12.7, grav: 33, fall: 46, weight: 2, strength: 2, len: 1.9, emb: 0.32 },
  knife: { name: 'Knife', hw: 0.15, hh: 1.05, speed: 5.4, accel: 48, airAccel: 30, jump: 13.3, grav: 33, fall: 44, weight: 1, strength: 1, len: 2.12, emb: 0.42 },
  butter: { name: 'Butter', hw: 0.45, hh: 0.31, speed: 4.3, accel: 38, airAccel: 24, jump: 11.3, grav: 33, fall: 44, weight: 1, strength: 1 },
};

const STATE_CODE = { walk: 0, planted: 1, carried: 2, smear: 3, spread: 4, toast: 5, script: 6, respawn: 7, hidden: 8 };
const CODE_STATE = Object.fromEntries(Object.entries(STATE_CODE).map(([k, v]) => [v, k]));

const approach = (v, t, a) => (v < t ? Math.min(t, v + a) : Math.max(t, v - a));
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

let metalMat = null, eyeMats = null;
function sharedMats() {
  if (metalMat) return;
  metalMat = new THREE.MeshStandardMaterial({ color: '#eef1f4', metalness: 0.84, roughness: 0.16, envMapIntensity: 3.4 });
  eyeMats = {
    white: new THREE.MeshStandardMaterial({ color: '#fbfaf6', roughness: 0.32 }),
    pupil: new THREE.MeshStandardMaterial({ color: '#160f0b', roughness: 0.12, metalness: 0 }),
    shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
  };
}

function forkShape() {
  const s = new THREE.Shape();
  const W = 0.185, tw = 0.06, gw = (2 * W - 4 * tw) / 3, top = 1.9, gapB = 1.56;
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.13, 0.0, 0.135, 0.14);
  s.lineTo(0.12, 0.55);
  s.quadraticCurveTo(0.072, 0.92, 0.07, 1.12);
  s.bezierCurveTo(0.07, 1.27, W, 1.3, W, 1.47);
  s.lineTo(W, top - 0.035);
  let x = W;
  for (let i = 0; i < 4; i++) {
    const xl = x - tw;
    s.quadraticCurveTo(x, top, x - tw / 2, top);
    s.quadraticCurveTo(xl, top, xl, top - 0.035);
    if (i < 3) {
      s.lineTo(xl, gapB + 0.02);
      s.quadraticCurveTo(xl - gw / 2, gapB - 0.035, xl - gw, gapB + 0.02);
      s.lineTo(xl - gw, top - 0.035);
      x = xl - gw;
    }
  }
  s.lineTo(-W, 1.47);
  s.bezierCurveTo(-W, 1.3, -0.07, 1.27, -0.07, 1.12);
  s.quadraticCurveTo(-0.072, 0.92, -0.12, 0.55);
  s.lineTo(-0.135, 0.14);
  s.quadraticCurveTo(-0.13, 0, 0, 0);
  return s;
}

function bend(geo, fn) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + fn(p.getY(i), p.getX(i)));
  geo.computeVertexNormals();
  return geo;
}

function forkGeo() {
  const geo = new THREE.ExtrudeGeometry(forkShape(), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.012, bevelSegments: 2, curveSegments: 10 });
  geo.translate(0, 0, -0.02);
  return bend(geo, (y) => -0.13 * smooth(1.25, 1.9, y) * smooth(1.25, 1.9, y) + 0.05 * Math.sin((y / 1.9) * Math.PI) - 0.03 * smooth(0, 0.3, 0.3 - y));
}

function knifeGeos() {
  const h = new THREE.Shape();
  h.moveTo(0, 0);
  h.quadraticCurveTo(0.112, 0, 0.112, 0.13);
  h.lineTo(0.098, 0.8);
  h.lineTo(0.118, 0.85);
  h.lineTo(0.118, 0.93);
  h.lineTo(-0.118, 0.93);
  h.lineTo(-0.118, 0.85);
  h.lineTo(-0.098, 0.8);
  h.lineTo(-0.112, 0.13);
  h.quadraticCurveTo(-0.112, 0, 0, 0);
  const handle = new THREE.ExtrudeGeometry(h, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 3, curveSegments: 10 });
  handle.translate(0, 0, -0.035);
  const b = new THREE.Shape();
  b.moveTo(-0.105, 0.9);
  b.lineTo(0.14, 0.9);
  b.lineTo(0.138, 1.62);
  b.quadraticCurveTo(0.125, 2.0, -0.075, 2.13);
  b.quadraticCurveTo(-0.105, 2.13, -0.108, 2.08);
  b.lineTo(-0.108, 0.95);
  b.closePath();
  const blade = new THREE.ExtrudeGeometry(b, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2, curveSegments: 14 });
  blade.translate(0, 0, -0.006);
  return [handle, blade];
}

function makeEyes(size = 1) {
  const g = new THREE.Group();
  const eyes = [];
  for (const side of [-1, 1]) {
    const e = new THREE.Group();
    e.position.x = side * 0.085 * size;
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.068 * size, 18, 12), eyeMats.white);
    w.scale.set(1, 1.12, 0.55);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.04 * size, 14, 10), eyeMats.pupil);
    p.position.z = 0.03 * size;
    p.scale.set(1, 1.1, 0.5);
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.012 * size, 8, 6), eyeMats.shine);
    s.position.set(-0.014 * size, 0.018 * size, 0.022 * size);
    p.add(s);
    e.add(w, p);
    g.add(e);
    eyes.push({ e, p });
  }
  g.userData.eyes = eyes;
  return g;
}

export class Character {
  constructor(world, kind) {
    sharedMats();
    this.world = world;
    this.kind = kind;
    this.def = KINDS[kind];
    this.hw = this.def.hw;
    this.hh = this.def.hh;
    this.pos = { x: 0, y: 0 };
    this.prev = { x: 0, y: 0 };
    this.vel = { x: 0, y: 0 };
    this.rpos = new THREE.Vector2();
    this.face = 1;
    this.state = 'walk';
    this.puppet = false;
    this.owner = null;
    this.grounded = false;
    this.groundM = null;
    this.coyote = 0;
    this.jbuf = 0;
    this.jumping = false;
    this.air = 0;
    this.cool = 0;
    this.t = Math.random() * 10;
    this.temp = 0.45;
    this.hard = false; this.soft = false; this.melted = false; this.squish = false;
    this.held = null;
    this.carrier = null;
    this.anchor = null;
    this.plant = null;
    this.smear = null;
    this.toaster = null;
    this.toastT = 0;
    this.pushing = null;
    this.wallDir = 0;
    this.override = 0;
    this.lastLandV = 0;
    this.respawnT = 0;
    this.visible = true;
    this.anim = { squash: 0, squashV: 0, tilt: 0, yaw: 0, phase: 0, stab: 0, swing: 0, twang: 0, blink: 0, nextBlink: 2 + Math.random() * 3, lookX: 0, lookY: 0, wob: 0, wobV: 0, plantT: 0, melt: 0, sag: 0, flat: 0, hardV: 0, bob: 0 };
    this.meta = { kind: 'char', char: this, mat: kind === 'butter' ? 'butter' : 'metal', top: 0 };
    this.col = world.phys.addBox(0, 0, this.hw, this.hh, 0, this.meta, 0.05);
    this.pred = (m) => this.filter(m);
    this.buildModel();
  }

  get strength() { return this.kind === 'butter' ? (this.hard ? 2 : 1) : this.def.strength; }
  get weight() { return this.kind === 'butter' ? (this.hard ? 3 : 1) : this.def.weight; }
  get bottom() { return this.pos.y - this.hh; }
  get solidState() { return this.state === 'walk' || this.state === 'script'; }

  buildModel() {
    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.root.add(this.body);
    if (this.kind === 'fork') {
      const m = new THREE.Mesh(forkGeo(), metalMat);
      m.castShadow = true;
      this.body.add(m);
      this.eyes = makeEyes(1);
      this.eyes.position.set(0, 1.37, 0.05);
      this.body.add(this.eyes);
    } else if (this.kind === 'knife') {
      const [h, b] = knifeGeos();
      const hm = new THREE.Mesh(h, metalMat), bm = new THREE.Mesh(b, metalMat);
      hm.castShadow = bm.castShadow = true;
      this.body.add(hm, bm);
      this.eyes = makeEyes(1.05);
      this.eyes.position.set(0.012, 1.2, 0.03);
      this.body.add(this.eyes);
    } else {
      const geo = new RoundedBoxGeometry(0.9, 0.62, 0.66, 4, 0.11);
      geo.translate(0, 0.31, 0);
      this.base = geo.attributes.position.array.slice();
      this.butterGeo = geo;
      this.butterMat = new THREE.MeshStandardMaterial({ color: '#f7dc7c', roughness: 0.4, emissive: '#5a3c00', emissiveIntensity: 0.22 });
      const m = new THREE.Mesh(geo, this.butterMat);
      m.castShadow = true;
      m.receiveShadow = true;
      this.body.add(m);
      this.butterMesh = m;
      this.eyes = makeEyes(1.15);
      this.eyes.position.set(0, 0.38, 0.34);
      this.body.add(this.eyes);
    }
    this.world.scene.add(this.root);
  }

  filter(m) {
    if (this.state === 'carried' || this.state === 'toast' || this.state === 'hidden') return false;
    if (m.char) {
      const c = m.char;
      if (c === this) return false;
      if (c.state === 'carried' || c.state === 'toast' || c.state === 'respawn' || c.state === 'hidden') return false;
      if (this.held === c) return false;
      if (c.smear && c.smear.kind !== 'wall' && c.state !== 'walk') return false;
      return this.bottom >= m.top - 0.1 && this.vel.y <= 0.6;
    }
    if (m.item) return false;
    if (m.grate && this.melted) return false;
    if (m.oneWay) return this.bottom >= m.top - 0.1 && this.vel.y <= 0.6;
    if (m.slope) return this.bottom >= m.slope.y0 + m.slope.k * (this.pos.x - m.slope.x0) - 0.3 - this.hw * Math.abs(m.slope.k) && this.vel.y <= 0.6;
    return true;
  }

  setCol(cx, cy, hw, hh, round = 0.05) {
    this.world.phys.setBox(this.col, cx, cy, hw, hh, 0, round);
    this.meta.top = cy + hh;
    this.meta.cx = cx; this.meta.cy = cy;
  }

  syncCol() {
    if (this.state === 'walk' || this.state === 'script' || this.state === 'respawn') {
      this.setCol(this.pos.x, this.pos.y, this.hw, this.hh);
      this.meta.off = this.state === 'respawn';
    } else if (this.state === 'planted' && this.plant) {
      this.setCol(this.pos.x, this.pos.y, this.plant.len / 2, 0.1, 0.05);
      this.meta.off = false;
    } else if (this.state === 'smear' && this.smear && this.smear.kind === 'wall') {
      this.setCol(this.pos.x, this.pos.y, 0.09, 0.4, 0.04);
      this.meta.off = false;
    } else {
      this.meta.off = true;
    }
    this.meta.oneWay = this.state === 'planted';
    this.meta.spring = this.state === 'planted' && this.kind === 'knife';
    this.meta.mat = this.state === 'smear' ? 'soft' : (this.kind === 'butter' ? 'butter' : 'metal');
    this.meta.smearWall = this.state === 'smear' && this.smear && this.smear.kind === 'wall';
  }

  place(x, y, face = 1) {
    this.pos.x = x; this.pos.y = y + this.hh;
    this.prev.x = this.pos.x; this.prev.y = this.pos.y;
    this.rpos.set(this.pos.x, this.pos.y);
    this.vel.x = this.vel.y = 0;
    this.face = face;
    this.state = 'walk';
    this.plant = null; this.smear = null; this.carrier = null; this.anchor = null;
    if (this.held) this.releaseHeld();
    this.syncCol();
  }

  step(dt, inp) {
    this.prev.x = this.pos.x; this.prev.y = this.pos.y;
    this.t += dt;
    this.cool = Math.max(0, this.cool - dt);
    if (this.puppet && this.override <= 0) return;
    if (this.puppet) { this.override -= dt; inp = NOINPUT; }
    if (inp.jumpPressed) this.jbuf = 0.14; else this.jbuf -= dt;
    if (this.kind === 'butter' && !this.puppet) this.updateTemp(dt);
    switch (this.state) {
      case 'walk': this.walk(dt, inp); break;
      case 'planted': this.plantedStep(dt, inp); break;
      case 'carried': this.carriedStep(dt, inp); break;
      case 'smear': case 'spread': this.smearStep(dt, inp); break;
      case 'toast': this.toastStep(dt); break;
      case 'respawn': this.respawnStep(dt); break;
      case 'script': this.scriptStep(dt); break;
    }
    if (!this.puppet) this.hazards();
  }

  walk(dt, inp) {
    const d = this.def, w = this.world;
    let speed = d.speed, jump = d.jump;
    let accel = this.grounded ? d.accel : d.airAccel;
    if (this.kind === 'butter') {
      if (this.hard) { speed *= 0.8; jump = 9.6; }
      else if (this.melted) { speed *= 0.55; jump = 0; }
      else if (this.soft) jump = 10.6;
      const want = inp.down && !this.melted && this.temp > 0.42 && w.can('squish');
      if (inp.down && this.grounded && !want && !this.melted && w.can('squish')) w.hint(this, 'cold-squish', 'Too cold to squish. Find something warm.');
      this.setSquish(want || (this.squish && this.blockedAbove(KINDS.butter.hh)));
      if (this.squish) { speed *= 0.62; jump = 0; }
      if (this.melted) this.setMeltShape(true);
    }
    if (this.held && this.held.kind === 'butter') speed *= 0.9;
    const slick = this.grounded && w.slickAt(this.pos.x, this.bottom, this);
    if (slick) { accel *= 0.2; speed *= 1.75; }
    if (this.grounded && this.groundM && this.groundM.rot && this.kind === 'butter' && (this.melted || this.soft)) {
      this.vel.x += -Math.sin(this.groundM.rot) * 26 * dt * (this.melted ? 1 : 0.35);
    }
    const tx = inp.x * speed;
    let acc;
    if (inp.x) acc = (this.vel.x !== 0 && Math.sign(tx) !== Math.sign(this.vel.x)) ? accel * 1.6 : accel;
    else acc = slick ? 1.2 : (this.grounded ? 60 : 4.5);
    this.vel.x = approach(this.vel.x, tx, acc * dt);
    if (inp.x) this.face = Math.sign(inp.x);
    const g = (this.vel.y > 0 && inp.jump && this.jumping) ? d.grav : d.fall;
    this.vel.y = Math.max(-26, this.vel.y - g * dt);
    if (this.kind === 'butter' && this.soft && !this.melted && !this.grounded && this.wallDir && inp.x === this.wallDir && w.can('cling')) {
      if (this.vel.y < -1.4) this.vel.y = -1.4;
      this.clinging = 0.12;
    }
    if (this.clinging > 0) {
      this.clinging -= dt;
      if (this.jbuf > 0 && !this.grounded) {
        this.vel.y = 11.2; this.vel.x = -this.wallDir * 5.8; this.face = -this.wallDir;
        this.jbuf = 0; this.clinging = 0; this.jumping = true;
        w.sfx('squish', this.pos.x, this.pos.y, 0.7);
        this.anim.squashV += 6;
      }
    }
    if (this.grounded) this.coyote = 0.1; else this.coyote -= dt;
    if (this.jbuf > 0 && this.coyote > 0 && jump > 0) {
      this.vel.y = jump; this.coyote = 0; this.jbuf = 0; this.grounded = false; this.jumping = true;
      this.anim.squashV -= 7;
      w.sfx(this.kind === 'butter' ? 'squishSoft' : 'metalTick', this.pos.x, this.pos.y, 0.4);
    }
    if (this.vel.y <= 0) this.jumping = false;
    let cx = 0, cy = 0;
    if (this.grounded && this.groundM) {
      const gv = w.groundVelocity(this.groundM);
      cx = gv.x * dt; cy = gv.y * dt;
    }
    const vyBefore = this.vel.y;
    const want = { x: this.vel.x * dt + cx, y: this.vel.y * dt + cy };
    const res = w.phys.move(this.col, want.x, want.y, this.pred);
    this.pos.x += res.dx; this.pos.y += res.dy;
    let ground = null; this.wallDir = 0; let wallM = null;
    for (const h of res.hits) {
      if (h.ny > 0.45) ground = h.m;
      else if (Math.abs(h.nx) > 0.6) { this.wallDir = h.nx < 0 ? 1 : -1; wallM = h.m; }
    }
    const was = this.grounded;
    this.grounded = res.grounded && this.vel.y <= 0.01;
    if (this.grounded) {
      if (ground) this.groundM = ground;
      if (!was) this.onLand(-vyBefore, inp);
      if (this.grounded) this.vel.y = 0;
      this.air = 0;
    } else {
      this.groundM = null;
      this.air += dt;
    }
    if (this.vel.y > 0 && res.dy < want.y - 0.002 && !ground) this.vel.y = 0;
    this.pushing = null;
    if (this.wallDir && Math.abs(res.dx - want.x) > 0.0005) {
      const tgt = wallM && (wallM.box || wallM.toppler);
      if (tgt && inp.x === this.wallDir && this.grounded) {
        this.pushing = { box: wallM.box || null, id: tgt.id, dir: this.wallDir, s: this.strength };
        this.vel.x = this.wallDir * Math.min(Math.abs(this.vel.x), wallM.box && wallM.box.moving ? 3.2 : 0.6);
      } else this.vel.x = slick ? this.vel.x * 0.2 : 0;
    }
    this.depenetrate();
    this.syncCol();
    if (inp.actionPressed && this.cool <= 0) this.action(inp);
  }

  depenetrate() {
    const hits = this.world.phys.overlap(this.pos.x, this.pos.y, this.hw - 0.04, this.hh - 0.04, (m) => !m.char && !m.item && !m.oneWay && m !== this.meta && !(m.grate && this.melted));
    if (!hits.length) { this.stuck = 0; return; }
    this.stuck = (this.stuck || 0) + 1;
    if (this.stuck > 3) { this.pos.y += 0.06; this.vel.y = Math.max(this.vel.y, 0); }
  }

  onLand(v, inp) {
    const w = this.world;
    const gm = this.groundM;
    if (gm && gm.spring && v > 3.2) {
      this.vel.y = inp.jump ? 17.2 : 11.5;
      this.grounded = false; this.jumping = inp.jump;
      gm.char.anim.twang = 1;
      w.sfx('twang', this.pos.x, this.pos.y, 0.8);
      this.anim.squashV += 8;
      return;
    }
    if (v > 2) {
      this.anim.squashV += Math.min(14, v * 0.9);
      const mat = gm ? gm.mat : 'stone';
      const vol = Math.min(1, v / 16);
      if (this.kind === 'butter') w.sfx(this.hard ? 'plate' : 'squish', this.pos.x, this.pos.y, 0.35 + vol * 0.6);
      else w.sfx(mat === 'wood' || mat === 'cloth' ? 'wood' : mat === 'soft' ? 'soft' : mat === 'glass' || mat === 'ceramic' ? 'plate' : 'metal', this.pos.x, this.pos.y, 0.25 + vol * 0.6);
      if (v > 9) w.effect('dust', this.pos.x, this.bottom, this.kind === 'butter' ? 'butter' : 'dust');
    }
  }

  blockedAbove(hh) {
    const need = hh - this.hh;
    if (need <= 0.01) return false;
    const hits = this.world.phys.overlap(this.pos.x, this.bottom + hh + 0.02, this.hw * 0.8, hh - 0.04, (m) => !m.char && !m.item && !m.oneWay && !(m.grate && this.melted));
    return hits.length > 0;
  }

  setSquish(on) {
    if (on === this.squish) return;
    if (!on && this.blockedAbove(KINDS.butter.hh)) return;
    const b = this.bottom;
    this.squish = on;
    this.hw = on ? 0.5 : KINDS.butter.hw;
    this.hh = on ? 0.15 : KINDS.butter.hh;
    this.pos.y = b + this.hh;
    this.syncCol();
    if (on) this.world.sfx('squish', this.pos.x, this.pos.y, 0.4);
  }

  setMeltShape(on) {
    const wantHH = on ? 0.09 : (this.squish ? 0.15 : KINDS.butter.hh);
    const wantHW = on ? 0.56 : (this.squish ? 0.5 : KINDS.butter.hw);
    if (Math.abs(this.hh - wantHH) < 1e-4 && Math.abs(this.hw - wantHW) < 1e-4) return;
    if (!on && this.blockedAbove(wantHH)) return;
    const b = this.bottom;
    this.hh = wantHH; this.hw = wantHW;
    this.pos.y = b + this.hh;
    this.syncCol();
  }

  updateTemp(dt) {
    const w = this.world;
    const amb = w.ambientAt(this.pos.x, this.pos.y);
    const rate = w.heatAt(this.pos.x, this.pos.y, this);
    this.temp += (rate + (amb - this.temp) * 0.12) * dt;
    if (this.state === 'toast') this.temp += 0.22 * dt;
    this.temp = Math.max(0, Math.min(1, this.temp));
    const wasMelted = this.melted, wasHard = this.hard;
    this.hard = this.temp < 0.2;
    this.soft = this.temp > 0.62;
    this.melted = this.melted ? this.temp > 0.8 : this.temp > 0.93;
    if (!w.can('melt')) this.melted = false;
    if (this.melted !== wasMelted) {
      if (this.melted) { this.setSquish(false); this.setMeltShape(true); w.sfx('sizzle', this.pos.x, this.pos.y, 0.6); w.hint(this, 'melted', 'Melted. You can seep through grates now.'); }
      else this.setMeltShape(false);
      if (!this.melted && (this.hh < 0.1)) { this.melted = true; }
    }
    if (this.hard !== wasHard) {
      if (this.hard) { w.sfx('crack', this.pos.x, this.pos.y, 0.5); }
    }
  }

  action(inp) {
    const w = this.world;
    this.cool = 0.32;
    if (this.kind === 'fork') this.forkAction(inp);
    else if (this.kind === 'knife') this.knifeAction(inp);
    else this.butterAction(inp);
  }

  forkAction(inp) {
    const w = this.world, dir = this.face;
    this.anim.stab = 1;
    if (this.held) {
      if (inp.down) this.throwHeld(dir * 1.5, 1.5);
      else this.throwHeld(dir * 6.4 + this.vel.x * 0.4, 9.8);
      return;
    }
    if (!w.can('stab')) return;
    const hx = this.pos.x + dir * 0.55, hy = this.pos.y + 0.25;
    const target = w.grabbableNear(this, hx, hy, 0.55, 0.85);
    if (target) {
      if (target.kind === 'butter' && target.hard) { w.sfx('clink', hx, hy, 0.7); w.hint(this, 'hard-butter', 'Butter is frozen solid. It needs to warm up first.'); return; }
      if (target.kind === 'butter' && !w.can('carryButter')) return;
      this.pickUp(target);
      return;
    }
    const hit = w.phys.cast(this.pos.x, this.pos.y + 0.32, dir, 0, this.hw + 0.62, (m) => !m.item && !m.box && !(m.char && !m.smearWall) && !m.oneWay && !m.grate);
    if (hit && (hit.m.mat === 'soft' || hit.m.food)) {
      if (hit.m.smearWall && !w.can('bridge')) return;
      this.plantInto(hit, dir);
      w.sfx(hit.m.smearWall ? 'squish' : 'stab', hit.x, hit.y, 0.8);
      w.effect('crumbs', hit.x, hit.y, hit.m.smearWall ? 'butter' : hit.m.food === 'cheese' ? 'cheese' : 'bread');
      return;
    }
    if (hit) {
      w.sfx('clink', hit.x, hit.y, 0.6);
      w.effect('spark', hit.x, hit.y);
      w.hint(this, 'fork-hard', hit.m.mat === 'wood' ? 'Too hard for a fork. Knife can stick into wood.' : 'Fork only sticks into soft things: bread, cheese, sponge, butter.');
    } else w.sfx('whoosh', this.pos.x, this.pos.y, 0.25);
  }

  knifeAction(inp) {
    const w = this.world, dir = this.face;
    if (!w.can('cut')) return;
    this.anim.swing = 1;
    const cx = this.pos.x + dir * 0.75, cy = this.pos.y;
    if (w.tryCut(this, cx, cy, 0.75, this.hh + 0.2)) return;
    if (w.can('spread')) {
      const b = w.butterSmearNear(this, cx, this.bottom, 1.4);
      if (b) { w.request(b, { t: 'spread', dir, x: b.pos.x, y: b.pos.y }); w.sfx('spread', b.pos.x, b.pos.y, 0.8); return; }
    }
    if (w.can('plant')) {
      const hit = w.phys.cast(this.pos.x, this.pos.y + 0.3, dir, 0, this.hw + 0.7, (m) => !m.item && !m.box && !m.char && !m.oneWay && !m.grate);
      if (hit && hit.m.mat === 'wood') {
        this.plantInto(hit, dir);
        w.sfx('thunk', hit.x, hit.y, 0.9);
        w.effect('chips', hit.x, hit.y, 'wood');
        return;
      }
      if (hit) {
        w.sfx('clink', hit.x, hit.y, 0.6);
        w.effect('spark', hit.x, hit.y);
        w.hint(this, 'knife-hard', hit.m.mat === 'soft' ? 'Knife slides out of soft things. It sticks into wood.' : 'Knife only sticks into wood.');
        return;
      }
    }
    w.sfx('swish', this.pos.x, this.pos.y, 0.5);
  }

  butterAction(inp) {
    const w = this.world;
    if (!w.can('smear')) return;
    if (this.hard) { w.sfx('clink', this.pos.x, this.pos.y, 0.4); w.hint(this, 'hard-smear', 'Too cold to smear.'); return; }
    if (this.melted) return;
    const dir = this.face;
    const hit = w.phys.cast(this.pos.x, this.pos.y, dir, 0, this.hw + 0.3, (m) => !m.char && !m.item && !m.box && !m.oneWay && !m.grate);
    if (hit && Math.abs(hit.nx) > 0.7) {
      this.setSquish(false);
      this.state = 'smear';
      this.smear = { kind: 'wall', dir, x: hit.x, y: this.pos.y };
      this.pos.x = hit.x - dir * 0.09;
      this.vel.x = this.vel.y = 0;
      this.syncCol();
      w.sfx('squish', hit.x, hit.y, 0.9);
      w.effect('crumbs', hit.x, hit.y, 'butter');
      w.hint(this, 'smeared', 'Smeared on the wall. Fork can stick into you now. Jump to pop back.');
      return;
    }
    if (this.grounded) {
      this.setSquish(false);
      this.state = 'smear';
      const fy = this.bottom;
      this.smear = { kind: 'floor', dir, x: this.pos.x, y: fy, x0: this.pos.x - 0.7, x1: this.pos.x + 0.7 };
      this.vel.x = this.vel.y = 0;
      this.syncCol();
      w.sfx('squish', this.pos.x, fy, 0.9);
      w.hint(this, 'smeared-floor', 'Spread on the floor. Knife can spread you into a long slide.');
    }
  }

  plantInto(hit, dir) {
    const L = this.def.len, emb = this.def.emb, len = L - emb;
    this.state = 'planted';
    this.anchor = hit.m;
    this.plant = { dir, wx: hit.x, y: hit.y, len };
    this.pos.x = hit.x - dir * len / 2;
    this.pos.y = hit.y;
    this.vel.x = this.vel.y = 0;
    this.anim.plantT = 0;
    this.anim.twang = 0.6;
    this.syncCol();
  }

  plantedStep(dt, inp) {
    const w = this.world;
    this.anim.plantT += dt;
    if (!w.anchorValid(this.anchor, this)) { this.unplant(false); return; }
    if (this.jbuf > 0) { this.jbuf = 0; this.unplant(true); return; }
    if (inp.actionPressed && this.cool <= 0) { this.cool = 0.2; this.unplant(false); return; }
    if (inp.down) { this.unplant(false); return; }
    this.syncCol();
  }

  unplant(jump) {
    const p = this.plant;
    if (!p) { this.state = 'walk'; return; }
    const w = this.world;
    this.state = 'walk';
    this.plant = null;
    this.anchor = null;
    let x = p.wx - p.dir * (this.hw + 0.06), y = p.y + this.hh - 0.2;
    for (let i = 0; i < 12; i++) {
      const blocked = w.phys.overlap(x, y, this.hw - 0.02, this.hh - 0.02, (m) => !m.char && !m.item && !m.oneWay && m !== this.meta);
      if (!blocked.length) break;
      if (i < 6) y -= 0.18; else x -= p.dir * 0.12;
    }
    this.pos.x = x; this.pos.y = y;
    this.prev.x = x; this.prev.y = y;
    this.vel.x = 0;
    this.vel.y = jump ? this.def.jump * 1.04 : 0;
    this.jumping = jump;
    this.grounded = false;
    this.face = jump ? this.face : -p.dir;
    this.syncCol();
    w.sfx(this.kind === 'knife' ? 'draw' : 'unstab', p.wx, p.y, 0.6);
    if (jump) this.anim.squashV -= 6;
  }

  grabState() { return this.state === 'walk' && !this.melted && !this.squish; }

  pickUp(target) {
    const w = this.world;
    this.held = target;
    if (target.kind === 'butter') {
      w.request(target, { t: 'grab', by: this.kind });
      w.sfx('squish', target.pos.x, target.pos.y, 0.9);
    } else {
      target.carrier = this;
      w.claimItem(target);
      w.sfx('stab', target.pos.x, target.pos.y, 0.6);
    }
    w.hint(this, 'carry', 'Press action again to throw. Hold down to drop.');
  }

  heldPos(item, render = false) {
    const h = item || this.held;
    const hh = h ? h.hh : 0.2;
    const p = render ? this.rpos : this.pos;
    return { x: p.x + this.face * 0.05, y: p.y + this.hh + hh + 0.02 + (render ? this.anim.bob : 0) };
  }

  throwHeld(vx, vy) {
    const w = this.world, h = this.held;
    if (!h) return;
    this.held = null;
    const x = this.pos.x + this.face * 0.1, y = this.pos.y + this.hh + h.hh + 0.05;
    if (h.kind === 'butter') {
      w.request(h, { t: 'throw', x, y, vx, vy });
    } else {
      h.carrier = null;
      h.throwFrom(x, y, vx, vy);
    }
    w.sfx('whoosh', x, y, 0.6);
  }

  releaseHeld() {
    if (!this.held) return;
    this.throwHeld(0, 0);
  }

  carriedStep(dt, inp) {
    const c = this.carrier;
    if (!c || (!c.puppet && c.held !== this)) { this.state = 'walk'; this.carrier = null; this.syncCol(); return; }
    const p = c.heldPos(this);
    this.pos.x = p.x; this.pos.y = p.y;
    this.face = c.face;
    if (this.jbuf > 0 && !this.puppet) {
      this.jbuf = 0;
      this.state = 'walk';
      if (c && !c.puppet) c.held = null;
      this.carrier = null;
      this.vel.y = 6; this.vel.x = this.face * 1.5;
      this.world.sendRelease(this, c);
    }
    this.syncCol();
  }

  smearStep(dt, inp) {
    if (this.puppet) return;
    if (this.jbuf > 0 || (inp.actionPressed && this.cool <= 0)) {
      this.jbuf = 0; this.cool = 0.25;
      this.reform();
      return;
    }
    if (this.hard || this.melted) this.reform();
  }

  reform() {
    const w = this.world, s = this.smear;
    this.state = 'walk';
    this.hw = KINDS.butter.hw; this.hh = KINDS.butter.hh; this.squish = false;
    if (s && s.kind === 'wall') {
      this.pos.x = s.x - s.dir * (this.hw + 0.04);
      this.pos.y = Math.max(this.pos.y, s.y);
    } else if (s) {
      this.pos.x = s.kind === 'spread' ? s.x0 + (s.dir > 0 ? 0.6 : (s.x1 - s.x0) - 0.6) : this.pos.x;
      this.pos.y = s.y + this.hh + 0.02;
    }
    for (let i = 0; i < 10; i++) {
      const b = w.phys.overlap(this.pos.x, this.pos.y, this.hw - 0.03, this.hh - 0.03, (m) => !m.char && !m.item && !m.oneWay);
      if (!b.length) break;
      this.pos.y += 0.12;
    }
    this.prev.x = this.pos.x; this.prev.y = this.pos.y;
    this.vel.x = 0; this.vel.y = 4;
    this.smear = null;
    this.syncCol();
    this.anim.squashV -= 8;
    w.sfx('squishSoft', this.pos.x, this.pos.y, 0.7);
  }

  applyRequest(r) {
    const w = this.world;
    if (r.t === 'release') { if (this.held && this.held.kind === 'butter') this.held = null; return; }
    if (r.t === 'grab' && this.kind === 'butter') {
      if (this.state !== 'walk' || this.hard) return;
      const by = w.charByKind(r.by);
      if (!by) return;
      this.setSquish(false);
      this.state = 'carried';
      this.carrier = by;
      if (!by.puppet) by.held = this;
      this.syncCol();
    } else if (r.t === 'throw' && this.kind === 'butter') {
      if (this.state !== 'carried') return;
      this.state = 'walk';
      if (this.carrier && !this.carrier.puppet) this.carrier.held = null;
      this.carrier = null;
      this.pos.x = r.x; this.pos.y = r.y;
      this.vel.x = r.vx; this.vel.y = r.vy;
      this.jumping = false;
      this.grounded = false;
      this.syncCol();
    } else if (r.t === 'spread' && this.kind === 'butter') {
      if (this.state !== 'smear' || !this.smear || this.smear.kind !== 'floor') return;
      const ext = w.spreadExtent(this.smear.x, this.smear.y, r.dir, 7.5);
      this.state = 'spread';
      this.smear = { kind: 'spread', dir: r.dir, x0: ext.x0, x1: ext.x1, y: this.smear.y, x: (ext.x0 + ext.x1) / 2 };
      this.pos.x = this.smear.x;
      this.syncCol();
      w.hint(this, 'spread', 'A long slide. Run across it to go fast. Jump to pop back.');
    }
  }

  toastStep(dt) {
    this.toastT -= dt;
    const t = this.toaster;
    if (t) { this.pos.x = t.slotX; this.pos.y = t.y + this.hh; }
    if (this.toastT <= 0) {
      this.state = 'walk';
      this.pos.y = t.top + this.hh + 0.1;
      this.vel.y = t.power || 19.5;
      this.vel.x = (t.push || 0);
      this.jumping = false;
      this.grounded = false;
      this.toaster = null;
      this.world.toasterPop(t);
    }
    this.syncCol();
  }

  enterToaster(t) {
    this.state = 'toast';
    this.toaster = t;
    this.toastT = t.delay || 1.8;
    this.vel.x = this.vel.y = 0;
    if (this.held) this.releaseHeld();
    this.syncCol();
  }

  scriptStep(dt) {
    const s = this.script;
    if (!s) return;
    const w = this.world;
    const inp = { x: 0, jump: false, jumpPressed: false, down: false, action: false, actionPressed: false };
    if (s.to !== undefined) {
      const d = s.to - this.pos.x;
      if (Math.abs(d) > 0.08) inp.x = Math.sign(d) * Math.min(1, Math.abs(d) * 1.5) * (s.speed || 0.7);
      else if (s.face) this.face = s.face;
    }
    if (s.jump) { inp.jumpPressed = true; inp.jump = true; s.jump = false; s.holdJump = 0.25; }
    if (s.holdJump > 0) { s.holdJump -= dt; inp.jump = true; }
    this.state = 'walk';
    this.walk(dt, inp);
    this.state = 'script';
  }

  respawnStep(dt) {
    this.respawnT -= dt;
    if (this.respawnT <= 0) {
      const sp = this.world.spawnFor(this.kind);
      this.place(sp.x, sp.y, sp.face || 1);
      if (this.kind === 'butter') { this.temp = sp.temp ?? this.world.ambientAt(sp.x, sp.y); this.melted = false; this.hard = this.temp < 0.2; this.hw = KINDS.butter.hw; this.hh = KINDS.butter.hh; this.squish = false; this.place(sp.x, sp.y, sp.face || 1); }
      this.anim.squashV += 10;
      this.world.effect('poof', this.pos.x, this.pos.y, this.kind);
    }
  }

  hazards() {
    if (this.state === 'respawn' || this.state === 'hidden') return;
    const w = this.world;
    if (this.pos.y < w.killY(this.pos.x) || w.inWater(this.pos.x, this.bottom + 0.1)) this.die();
  }

  die() {
    const w = this.world;
    if (this.held) this.releaseHeld();
    if (this.state === 'planted') this.unplant(false);
    this.state = 'respawn';
    this.respawnT = 1.1;
    this.vel.x = this.vel.y = 0;
    this.syncCol();
    w.onDeath(this);
  }

  netState() {
    const s = { x: +this.pos.x.toFixed(3), y: +this.pos.y.toFixed(3), vx: +this.vel.x.toFixed(2), vy: +this.vel.y.toFixed(2), f: this.face, s: STATE_CODE[this.state] ?? 0, hw: +this.hw.toFixed(3), hh: +this.hh.toFixed(3) };
    if (this.kind === 'butter') s.t = +this.temp.toFixed(3);
    if (this.plant) s.p = [+this.plant.wx.toFixed(3), +this.plant.y.toFixed(3), this.plant.dir, +this.plant.len.toFixed(3), this.anchor && this.anchor.id ? this.anchor.id : ''];
    if (this.smear) s.m = [this.smear.kind, +(this.smear.x ?? 0).toFixed(3), +this.smear.y.toFixed(3), this.smear.dir, +(this.smear.x0 ?? 0).toFixed(3), +(this.smear.x1 ?? 0).toFixed(3)];
    if (this.carrier) s.c = this.carrier.kind;
    if (this.pushing) s.pu = [this.pushing.id, this.pushing.dir, this.pushing.s];
    if (this.held && this.held.id) s.h = this.held.id;
    if (this.anim.stab > 0.5) s.a = 1;
    if (this.anim.swing > 0.5) s.a = 2;
    return s;
  }

  applyNet(s) {
    if (this.override > 0) return;
    this.pos.x = s.x; this.pos.y = s.y;
    this.vel.x = s.vx || 0; this.vel.y = s.vy || 0;
    this.face = s.f || 1;
    const st = CODE_STATE[s.s] || 'walk';
    this.state = st === 'script' ? 'walk' : st;
    this.hw = s.hw || this.def.hw; this.hh = s.hh || this.def.hh;
    if (this.kind === 'butter' && s.t !== undefined) {
      this.temp = s.t; this.hard = s.t < 0.2; this.soft = s.t > 0.62; this.melted = this.hh < 0.1; this.squish = !this.melted && this.hh < 0.2;
    }
    this.plant = s.p ? { wx: s.p[0], y: s.p[1], dir: s.p[2], len: s.p[3] } : null;
    this.anchorId = s.p ? s.p[4] : '';
    this.smear = s.m ? { kind: s.m[0], x: s.m[1], y: s.m[2], dir: s.m[3], x0: s.m[4], x1: s.m[5] } : null;
    this.carrier = s.c ? this.world.charByKind(s.c) : null;
    this.pushing = s.pu ? { id: s.pu[0], dir: s.pu[1], s: s.pu[2] } : null;
    this.heldId = s.h || null;
    if (s.a === 1 && this.anim.stab < 0.2) this.anim.stab = 1;
    if (s.a === 2 && this.anim.swing < 0.2) this.anim.swing = 1;
    this.syncCol();
  }

  setVisible(v) { this.visible = v; this.root.visible = v; }

  render(dt, alpha) {
    const a = this.anim;
    const tgt = this.state === 'carried' && this.carrier ? this.carrier.heldPos(this, true) : null;
    if (tgt) this.rpos.set(tgt.x, tgt.y);
    else this.rpos.set(this.prev.x + (this.pos.x - this.prev.x) * alpha, this.prev.y + (this.pos.y - this.prev.y) * alpha);
    const vis = this.state !== 'toast' && this.state !== 'hidden' && !(this.state === 'respawn' && this.respawnT < 0.9);
    this.root.visible = this.visible && vis;
    if (!this.root.visible) return;
    a.squashV += (-a.squash * 220 - a.squashV * 14) * dt;
    a.squash += a.squashV * dt * 0.06;
    a.squash = Math.max(-0.35, Math.min(0.35, a.squash));
    const moving = Math.abs(this.vel.x) > 0.3 && (this.grounded || this.puppet) && this.state === 'walk' && Math.abs(this.vel.y) < 1;
    a.phase += dt * (moving ? Math.abs(this.vel.x) * 2.6 : 0);
    a.bob = moving && this.kind !== 'butter' ? Math.abs(Math.sin(a.phase * Math.PI)) * 0.1 : 0;
    a.stab = Math.max(0, a.stab - dt * 4);
    a.swing = Math.max(0, a.swing - dt * 3.4);
    a.twang = Math.max(0, a.twang - dt * 1.4);
    a.blink -= dt;
    a.nextBlink -= dt;
    if (a.nextBlink < 0) { a.blink = 0.13; a.nextBlink = 2 + Math.random() * 4; }
    const wantYaw = this.state === 'walk' ? (Math.abs(this.vel.x) > 0.2 ? Math.sign(this.vel.x) * 0.38 : this.face * 0.2) : 0;
    a.yaw += (wantYaw - a.yaw) * (1 - Math.exp(-dt * 10));
    const wantTilt = this.state === 'walk' ? -this.vel.x * 0.028 + (moving ? Math.sin(a.phase * Math.PI * 2) * 0.06 : 0) : 0;
    a.tilt += (wantTilt - a.tilt) * (1 - Math.exp(-dt * 12));
    this.root.position.set(this.rpos.x, this.rpos.y - this.hh, 0);
    this.root.rotation.set(0, 0, 0);
    this.body.rotation.set(0, 0, 0);
    this.body.position.set(0, 0, 0);
    this.body.scale.set(1, 1, 1);
    if (this.eyes) {
      const lx = Math.max(-1, Math.min(1, this.vel.x / 5)) * 0.022;
      const ly = Math.max(-1, Math.min(1, this.vel.y / 10)) * 0.015;
      for (const e of this.eyes.userData.eyes) { e.p.position.x = lx; e.p.position.y = ly; }
      this.eyes.scale.y = a.blink > 0 ? 0.12 : 1;
    }
    if (this.kind === 'butter') this.renderButter(dt);
    else this.renderCutlery(dt);
  }

  renderCutlery(dt) {
    const a = this.anim;
    if (this.state === 'planted' && this.plant) {
      const p = this.plant;
      const ox = p.wx - p.dir * p.len;
      this.root.position.set(ox, p.y, 0);
      const tw = Math.sin(this.t * 38) * 0.09 * a.twang;
      this.body.rotation.z = -p.dir * Math.PI / 2 + tw * p.dir;
      this.body.rotation.x = -0.12;
      this.eyes.rotation.z = p.dir * Math.PI / 2 * 0.0;
      return;
    }
    const sq = a.squash;
    this.body.scale.set(1 - sq * 0.4, 1 + sq, 1);
    this.body.position.y = a.bob;
    this.body.rotation.y = a.yaw;
    this.body.rotation.z = a.tilt;
    if (a.stab > 0) {
      const k = Math.sin(a.stab * Math.PI);
      this.body.rotation.z += -this.face * k * 0.9;
      this.body.position.x += this.face * k * 0.25;
    }
    if (a.swing > 0) {
      const k = a.swing;
      this.body.rotation.z += -this.face * Math.sin((1 - k) * Math.PI) * 1.0 * (k > 0.5 ? 1 : 0.6);
    }
    if (this.state === 'carried') this.body.rotation.z = Math.sin(this.t * 3) * 0.08;
    if (!this.grounded && this.state === 'walk' && !this.puppet) this.body.rotation.z += this.vel.x * -0.02;
  }

  renderButter(dt) {
    const a = this.anim;
    const tm = this.temp;
    a.wobV += (-a.wob * 160 - a.wobV * 7) * dt + (-(this.vel.x - (this._lvx || 0))) * 0.9;
    this._lvx = this.vel.x;
    a.wob += a.wobV * dt * 0.05;
    a.wob = Math.max(-0.3, Math.min(0.3, a.wob));
    const meltT = this.melted ? 1 : 0;
    a.melt += (meltT - a.melt) * (1 - Math.exp(-dt * 5));
    a.sag += ((this.soft ? (tm - 0.62) / 0.3 : 0) - a.sag) * (1 - Math.exp(-dt * 4));
    let flat = 0, sx = 1, sy = 1, sz = 1, rz = 0, ox = 0;
    if (this.state === 'smear' && this.smear) {
      if (this.smear.kind === 'wall') { sx = 0.55; sy = 1.3; sz = 1.25; ox = this.smear.dir * 0.12; this.root.position.y = this.rpos.y - 0.4; }
      else { sx = 1.55; sy = 0.17; sz = 1.25; this.root.position.y = this.smear.y; this.root.position.x = this.smear.x; }
    } else if (this.state === 'spread' && this.smear) {
      const len = this.smear.x1 - this.smear.x0;
      sx = len / 0.9; sy = 0.1; sz = 1.3;
      this.root.position.set((this.smear.x0 + this.smear.x1) / 2, this.smear.y, 0);
    } else if (this.squish) { sx = 1.15; sy = 0.48; sz = 1.1; }
    const sq = a.squash;
    this.body.scale.set(sx * (1 - sq * 0.5), sy * (1 + sq), sz * (1 - sq * 0.3));
    this.body.position.x = ox;
    this.body.rotation.y = this.state === 'walk' ? a.yaw * 0.6 : 0;
    this.body.rotation.z = rz + (this.state === 'carried' ? Math.sin(this.t * 3) * 0.1 : 0);
    const p = this.butterGeo.attributes.position, b = this.base;
    const melt = a.melt, sag = a.sag * (1 - melt), wob = a.wob;
    for (let i = 0; i < p.count; i++) {
      let x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2];
      const hn = y / 0.62;
      x += wob * hn * 0.35;
      x *= 1 + sag * (1 - hn) * 0.18;
      z *= 1 + sag * (1 - hn) * 0.12;
      y -= sag * hn * hn * 0.06;
      if (melt > 0.001) {
        const r = Math.hypot(x / 0.45, z / 0.33);
        y = y * (1 - 0.8 * melt) * (1 - 0.3 * melt * Math.min(1, r));
        x *= 1 + 0.75 * melt * (1 - hn * 0.4);
        z *= 1 + 0.45 * melt;
      }
      p.setXYZ(i, x, y, z);
    }
    p.needsUpdate = true;
    this.butterGeo.computeVertexNormals();
    const col = this.butterMat.color;
    if (this.hard) col.set('#fbeec2'); else if (this.melted) col.set('#f6cc4e'); else col.set('#f7dc7c').lerp(new THREE.Color('#f8d25c'), Math.max(0, (tm - 0.45) * 2));
    this.butterMat.roughness = this.hard ? 0.62 : this.melted ? 0.14 : 0.42 - Math.max(0, tm - 0.5) * 0.4;
    this.butterMat.emissiveIntensity = this.hard ? 0.08 : 0.22;
    const ey = 0.38 * (1 - sag * 0.15) * (1 - 0.8 * melt);
    this.eyes.position.set(wob * 0.35 * (ey / 0.62), Math.max(0.1, ey), 0.34 * (1 + 0.45 * melt) + 0.01);
    this.eyes.scale.x = 1 / Math.max(0.3, this.body.scale.x) * (this.state === 'spread' ? 1 : 1);
    this.eyes.scale.y *= 1 / Math.max(0.2, this.body.scale.y) * (this.state === 'spread' ? 0.25 : this.state === 'smear' ? (this.smear && this.smear.kind === 'wall' ? 0.75 : 0.35) : 1) * (this.squish ? 0.6 : 1);
  }

  dispose() {
    this.world.scene.remove(this.root);
    this.world.phys.remove(this.col);
    this.root.traverse((o) => { if (o.geometry && o.geometry !== this.butterGeo) o.geometry.dispose(); });
    if (this.butterGeo) this.butterGeo.dispose();
  }
}

export const NOINPUT = { x: 0, up: false, down: false, jump: false, jumpPressed: false, action: false, actionPressed: false, swapPressed: false, pausePressed: false };

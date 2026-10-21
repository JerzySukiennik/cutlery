// Kitchen props: procedural meshes plus the collider boxes that make them walkable.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';

const M = {};
const std = (o) => new THREE.MeshStandardMaterial(o);
export function mats() {
  if (M.ready) return M;
  const phys = (o) => new THREE.MeshPhysicalMaterial(o);
  const glaze = (color, o = {}) => phys({ color, roughness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.1, ...o });
  M.metal = std({ color: '#dfe3e8', metalness: 1, roughness: 0.18 });
  M.steel = std({ color: '#c9ced4', metalness: 1, roughness: 0.3, roughnessMap: T.brushed() });
  M.steel.userData.noDetail = true;
  M.chrome = std({ color: '#e6eaee', metalness: 1, roughness: 0.09 });
  M.brass = std({ color: '#c8a05a', metalness: 1, roughness: 0.28 });
  M.copper = std({ color: '#c77b4f', metalness: 1, roughness: 0.26 });
  M.iron = std({ color: '#2d2c2b', metalness: 0.35, roughness: 0.62 });
  M.dark = std({ color: '#1d1714', roughness: 0.6 });
  M.glass = std({ color: '#e6f3f0', metalness: 0, roughness: 0.03, transparent: true, opacity: 0.2, depthWrite: false, envMapIntensity: 3.2, side: THREE.DoubleSide });
  M.glassShelf = std({ color: '#d6efe9', metalness: 0, roughness: 0.04, transparent: true, opacity: 0.35, depthWrite: false, envMapIntensity: 2.8 });
  M.ceramic = glaze('#f4f1ea');
  M.ceramicBlue = glaze('#4f74a0');
  M.ceramicSage = glaze('#97ad92');
  M.ceramicCream = glaze('#efe3cb');
  M.ceramicTerracotta = phys({ color: '#b9643f', roughness: 0.75 });
  M.plastic = std({ color: '#f2f3f1', roughness: 0.4 });
  M.plasticDim = std({ color: '#dfe3e2', roughness: 0.5 });
  M.fridgeLiner = std({ color: '#dfe8ec', roughness: 0.4 });
  const tl = T.tiles('#ece3d3', '#bdb19e');
  M.tiles = std({ map: tl.map, bumpMap: tl.bump, bumpScale: 1.4, roughness: 0.22 });
  M.paint = std({ map: T.wallPaint('#efe2cc'), roughness: 0.9 });
  M.paintDark = std({ map: T.wallPaint('#d7c6ab'), roughness: 0.9 });
  M.stone = std({ map: T.stone(), roughness: 0.32 });
  M.woodBoard = std({ map: T.wood('#d39e67', '#94603a', 3), roughness: 0.55 });
  M.woodDark = std({ map: T.wood('#9a6a43', '#5c3a22', 8), roughness: 0.6 });
  M.woodDrawer = std({ map: T.wood('#d8b384', '#a87a4e', 12, 0), roughness: 0.65 });
  M.woodTable = std({ map: T.wood('#b9875a', '#7a4f2e', 17, 6), roughness: 0.5 });
  M.cabinet = std({ color: '#8ea08a', roughness: 0.5 });
  M.cabinetDark = std({ color: '#71846d', roughness: 0.55 });
  M.crust = std({ map: T.crust(), roughness: 0.75 });
  M.crumb = std({ map: T.crumb(), roughness: 0.9 });
  M.cheese = std({ map: T.cheese(), roughness: 0.5 });
  M.cheeseRind = std({ color: '#e7b43c', roughness: 0.45 });
  M.jam = std({ color: '#8f1f2e', roughness: 0.12, transparent: true, opacity: 0.92 });
  M.honey = std({ color: '#d88d1d', roughness: 0.08, transparent: true, opacity: 0.9 });
  M.pickle = std({ color: '#7d8c3a', roughness: 0.3 });
  M.milk = std({ color: '#fbfaf6', roughness: 0.3 });
  M.foil = std({ color: '#d8d8dc', metalness: 0.9, roughness: 0.3 });
  M.lidRed = std({ color: '#b5443a', roughness: 0.42 });
  M.lidGold = std({ color: '#c79c48', metalness: 0.9, roughness: 0.28 });
  M.lidGreen = std({ color: '#5f7d4c', roughness: 0.42 });
  M.sponge = std({ color: '#f2d24b', roughness: 0.95 });
  M.spongeGreen = std({ color: '#4d8a52', roughness: 0.95 });
  M.cloth = phys({ map: T.cloth(), roughness: 0.92, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide });
  M.towel = phys({ map: T.cloth('#efe9df', '#c9a26a'), roughness: 0.92, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color('#fff8ec'), side: THREE.DoubleSide });
  M.leaf = std({ color: '#5e8a45', roughness: 0.6, side: THREE.DoubleSide });
  M.lemon = std({ color: '#f1cf3b', roughness: 0.4 });
  M.orange = std({ color: '#ea8a2c', roughness: 0.45 });
  M.apple = std({ color: '#b8402f', roughness: 0.28 });
  M.pea = std({ color: '#7db443', roughness: 0.35 });
  M.grape = std({ color: '#6b3a5e', roughness: 0.2 });
  M.cork = std({ color: '#b98d5b', roughness: 0.9 });
  M.sugar = std({ color: '#fbfaf7', roughness: 0.8 });
  M.ice = new THREE.MeshStandardMaterial({ color: '#cfe8ff', roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.42, envMapIntensity: 1.5, depthWrite: false });
  M.water = new THREE.MeshStandardMaterial({ color: '#9cc3cf', roughness: 0.02, metalness: 0.2, transparent: true, opacity: 0.62, envMapIntensity: 2.2 });
  M.toast = std({ color: '#c98a45', roughness: 0.85 });
  M.toastIn = std({ color: '#ecc58d', roughness: 0.9 });
  M.coffee = std({ color: '#3a2216', roughness: 0.1 });
  M.rubber = std({ color: '#d8dcdc', roughness: 0.8 });
  M.sky = new THREE.MeshBasicMaterial({ map: T.sky(), toneMapped: true });
  M.glow = new THREE.MeshBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  M.shaft = new THREE.MeshBasicMaterial({ map: T.shaft(), color: '#ffdcae', transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  M.shadowBlob = new THREE.MeshBasicMaterial({ map: T.softDot(), color: '#000', transparent: true, opacity: 0.35, depthWrite: false });
  for (const k of ['metal', 'steel', 'chrome', 'brass', 'copper']) M[k].envMapIntensity = 2.6;
  M.glass.envMapIntensity = 3.2; M.glassShelf.envMapIntensity = 2.8; M.ice.envMapIntensity = 3;
  for (const k of ['tiles', 'paint', 'paintDark', 'stone', 'woodBoard', 'woodDark', 'woodDrawer', 'woodTable', 'crust', 'crumb', 'cheese', 'cloth', 'towel']) M[k].userData.worldUV = k === 'tiles' ? 4 : (k.startsWith('wood') ? 9 : 7);
  M.stone.userData.bumpK = 0.35;
  M.ready = true;
  return M;
}

const geoCache = new Map();
function g(key, fn) { if (!geoCache.has(key)) geoCache.set(key, fn()); return geoCache.get(key); }

export function rbox(w, h, d, r = 0.05, s = 2) {
  return g(`rb${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${r}|${s}`, () => new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)));
}
export function bx(w, h, d) { return g(`bx${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)); }

export function mesh(geo, mat, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rz) m.rotation.z = opts.rz;
  if (opts.s) m.scale.setScalar(opts.s);
  if (opts.sx || opts.sy || opts.sz) m.scale.set(opts.sx || 1, opts.sy || 1, opts.sz || 1);
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.receive !== false;
  return m;
}

function lathe(pts, segs = 28) {
  return new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), segs);
}

function tube(points, radius, segs = 40) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2] || 0))), segs, radius, 12, false);
}

export function turnedLeg(h, r = 0.3) {
  return g(`tl${h.toFixed(3)}|${r.toFixed(3)}`, () => lathe([
    [0, 0], [r * 1.25, 0], [r * 1.25, 0.14], [r * 0.9, 0.22], [r * 0.6, 0.32], [r * 0.85, 0.5], [r * 0.85, 0.58], [r * 0.6, 0.66],
    [r * 0.7, h * 0.4], [r * 0.7, h - 0.5], [r * 0.95, h - 0.42], [r * 0.75, h - 0.28], [r * 0.82, h - 0.2], [r * 0.9, h - 0.08], [r * 0.9, h], [0, h],
  ], 24));
}

function knurledLid(rl, hl) {
  return g(`kn${rl.toFixed(3)}|${hl.toFixed(3)}`, () => {
    const geo = new THREE.CylinderGeometry(rl, rl, hl, 64, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), rr = Math.hypot(x, z);
      if (rr > rl * 0.98) { const s = 1 + 0.025 * Math.sin(Math.atan2(x, z) * 48); p.setX(i, x * s); p.setZ(i, z * s); }
    }
    geo.computeVertexNormals();
    return geo;
  });
}

function labelArc(r, h, spec, y, arc = 2.3) {
  const H = Math.max(128, Math.min(512, Math.round(512 * h / (arc * r))));
  const geo = g(`la${r.toFixed(3)}|${h.toFixed(3)}|${arc}`, () => new THREE.CylinderGeometry(r * 1.02, r * 1.02, h, 40, 1, true, -arc / 2, arc));
  const m = new THREE.MeshStandardMaterial({ map: T.label({ ...spec, w: 512, h: H }), roughness: 0.5 });
  return mesh(geo, m, 0, y, 0, { cast: false });
}

export function labelWrap(r, h, spec, y) {
  const H = Math.max(128, Math.min(512, Math.round(512 * h / (2 * Math.PI * r))));
  const geo = g(`lw${r.toFixed(3)}|${h.toFixed(3)}`, () => new THREE.CylinderGeometry(r * 1.01, r * 1.01, h, 48, 1, true));
  const m = new THREE.MeshStandardMaterial({ map: T.label({ ...spec, w: 512, h: H }), roughness: 0.5 });
  const me = mesh(geo, m, 0, y, 0, { cast: false });
  me.rotation.y = Math.PI;
  return me;
}

function faceSpec(spec, w, h) {
  return { ...spec, w: Math.max(128, Math.min(512, Math.round(512 * w / h))), h: 512 };
}

const JAR = {
  Jam: { text: 'Jam', kicker: 'HOMEMADE', sub: 'cherry', italic: true, bg: '#f6eedb', fg: '#6b2a20', band: '#8f1f2e', bandY: 0.7, subfg: '#f6eedb', ty: 0.36, sy: 0.6, size: 110, subSize: 42, fine: 'NET WT 340 G', fy: 0.84, emblem: 'star', ey: 0.2, eR: 0.06, emblemCol: '#8f1f2e' },
  Honey: { text: 'Honey', kicker: 'WILDFLOWER', sub: 'raw · 350 g', italic: true, bg: '#f7e7b6', fg: '#6b4212', band: '#d88d1d', bandY: 0.7, subfg: '#fff4d6', ty: 0.36, sy: 0.6, size: 110, subSize: 40, fine: 'KEEP DRY', fy: 0.84, emblem: 'sun', ey: 0.2, eR: 0.06, emblemCol: '#d88d1d' },
  Pickles: { text: 'Pickles', kicker: 'GARDEN', sub: 'dill · 500 g', bg: '#e9e6c7', fg: '#3d4a1c', band: '#7d8c3a', bandY: 0.7, subfg: '#eef0d5', ty: 0.36, sy: 0.6, size: 100, subSize: 40, fine: 'NET WT 500 G', fy: 0.84, emblem: 'leaf', ey: 0.2, eR: 0.06, emblemCol: '#7d8c3a' },
};

const BOTTLE = {
  honey: { text: 'Honey', kicker: 'PURE', sub: 'linden', italic: true, bg: '#f5e4b0', fg: '#6b4212', band: '#d88d1d', bandY: 0.72, subfg: '#fff4d6', ty: 0.38, sy: 0.6, size: 110, subSize: 40, emblem: 'sun', ey: 0.2, eR: 0.06, emblemCol: '#d88d1d' },
  pickle: { text: 'Vinegar', kicker: 'CIDER', sub: 'apple · 500 ml', bg: '#ece8d2', fg: '#3d4a1c', band: '#7d8c3a', bandY: 0.72, subfg: '#eef0d5', ty: 0.38, sy: 0.6, size: 100, subSize: 40, emblem: 'leaf', ey: 0.2, eR: 0.06, emblemCol: '#7d8c3a' },
};

export class Builder {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.statics = new THREE.Group();
    this.root.add(this.statics);
    scene.add(this.root);
    this.colliders = [];
    this.lights = [];
    this.m = mats();
  }

  decor(fn, z = 0) {
    const pc = this.nocol, pz = this.zoff || 0;
    this.nocol = true; this.zoff = z;
    const r = fn(this);
    this.nocol = pc; this.zoff = pz;
    return r;
  }

  make(fn) {
    const prev = this.capture;
    this.capture = true;
    const r = fn(this);
    this.capture = prev;
    return r;
  }

  mini(x, y, z, s, fn) {
    const gr = new THREE.Group();
    gr.position.set(x, y, z);
    gr.scale.setScalar(s);
    (this.target || this.statics).add(gr);
    const pt = this.target, pc = this.nocol;
    this.target = gr; this.nocol = true;
    fn(this);
    this.target = pt; this.nocol = pc;
    return gr;
  }

  col(x, y, w, h, mat, extra = {}) {
    if (this.capture || this.nocol) return null;
    const c = { x, y, w, h, mat, ...extra };
    this.colliders.push(c);
    return c;
  }

  add(obj, dynamic = false) {
    (this.target || (dynamic || this.capture ? this.root : this.statics)).add(obj);
    return obj;
  }

  group(x, y, z = 0, dynamic = true) {
    const gr = new THREE.Group();
    gr.position.set(x, y, z + (this.zoff || 0));
    this.add(gr, dynamic || this.capture);
    return gr;
  }

  backWall(x0, x1, y0, y1, z = -3.6, tileTop = 14.5) {
    const m = this.m, w = x1 - x0;
    if (tileTop > y0) this.add(mesh(bx(w, tileTop - y0, 0.3), m.tiles, x0 + w / 2, (y0 + tileTop) / 2, z - 0.15, { cast: false }));
    if (y1 > tileTop) this.add(mesh(bx(w, y1 - tileTop, 0.3), m.paint, x0 + w / 2, (tileTop + y1) / 2, z - 0.15, { cast: false }));
  }

  floor(x0, x1, y = 0) {
    const w = x1 - x0;
    this.add(mesh(bx(w, 0.4, 14), this.m.woodTable, x0 + w / 2, y - 0.2, 0, { cast: false }));
  }

  counter(x, top, w, o = {}) {
    const m = this.m, floorY = o.floor ?? 0, front = o.front ?? 1.7, back = o.back ?? -3.6;
    const d = front - back, zc = (front + back) / 2;
    this.add(mesh(rbox(w, 0.42, d + 0.25, 0.06), m.stone, x + w / 2, top - 0.21, zc + 0.1));
    const bodyH = top - 0.42 - floorY;
    if (bodyH > 0.2 && !o.noBody) {
      this.add(mesh(bx(w - 0.1, bodyH, d - 0.5), m.cabinetDark, x + w / 2, floorY + bodyH / 2, zc - 0.2, { cast: false }));
      const doors = Math.max(1, Math.round(w / 4.5));
      const dw = (w - 0.2) / doors;
      for (let i = 0; i < doors; i++) {
        const cx = x + 0.1 + dw * (i + 0.5);
        if (o.drawerRow !== false && bodyH > 4) {
          this.add(mesh(rbox(dw - 0.14, 1.5, 0.22, 0.04), m.cabinet, cx, top - 0.42 - 0.85, front - 0.3));
          this.add(mesh(rbox(1.0, 0.12, 0.16, 0.05), m.brass, cx, top - 0.42 - 0.85, front - 0.12));
        }
        const dh = bodyH - (bodyH > 4 ? 1.85 : 0) - 0.9;
        if (dh > 0.4) {
          this.add(mesh(rbox(dw - 0.14, dh, 0.22, 0.04), m.cabinet, cx, floorY + 0.9 + dh / 2, front - 0.3));
          this.add(mesh(rbox(dw - 0.9, dh - 0.8, 0.08, 0.03), m.cabinetDark, cx, floorY + 0.9 + dh / 2, front - 0.17, { cast: false }));
          this.add(mesh(new THREE.SphereGeometry(0.12, 12, 8), m.brass, cx + (i % 2 ? -1 : 1) * (dw / 2 - 0.5), floorY + 0.9 + dh * 0.8, front - 0.1));
        }
      }
      this.add(mesh(bx(w - 0.1, 0.9, 0.2), m.dark, x + w / 2, floorY + 0.45, front - 0.8, { cast: false }));
    }
    this.col(x, o.colBottom ?? (top - (o.colDepth ?? 30)), w, (top - (o.colBottom ?? (top - (o.colDepth ?? 30)))), 'stone');
  }

  upperCabinets(x, w, bottom = 15.5, top = 22) {
    const m = this.m;
    this.add(mesh(bx(w, top - bottom, 3), m.cabinetDark, x + w / 2, (top + bottom) / 2, -2.6, { cast: false }));
    const doors = Math.max(1, Math.round(w / 4));
    const dw = w / doors;
    for (let i = 0; i < doors; i++) {
      this.add(mesh(rbox(dw - 0.14, top - bottom - 0.2, 0.2, 0.04), m.cabinet, x + dw * (i + 0.5), (top + bottom) / 2, -1.0, { cast: false }));
      this.add(mesh(rbox(0.12, 0.9, 0.14, 0.05), m.brass, x + dw * (i + 0.5) + (i % 2 ? -1 : 1) * (dw / 2 - 0.4), bottom + 0.8, -0.85, { cast: false }));
    }
  }

  window(x, y, w, h, z = -3.5, o = {}) {
    const m = this.m;
    if (o.night && !m.nightSky) m.nightSky = new THREE.MeshBasicMaterial({ map: T.nightSky(), toneMapped: true });
    this.add(mesh(new THREE.PlaneGeometry(w * 1.8, h * 1.8), o.night ? m.nightSky : m.sky, x + w / 2, y + h / 2, z - 3, { cast: false, receive: false }));
    const fr = 0.3;
    this.add(mesh(bx(w + fr * 2, fr, 0.6), m.plastic, x + w / 2, y + h + fr / 2, z));
    this.add(mesh(bx(w + fr * 2, fr, 0.6), m.plastic, x + w / 2, y - fr / 2, z));
    this.add(mesh(bx(fr, h, 0.6), m.plastic, x - fr / 2, y + h / 2, z));
    this.add(mesh(bx(fr, h, 0.6), m.plastic, x + w + fr / 2, y + h / 2, z));
    this.add(mesh(bx(0.16, h, 0.4), m.plastic, x + w / 2, y + h / 2, z));
    this.add(mesh(bx(w, 0.16, 0.4), m.plastic, x + w / 2, y + h * 0.62, z));
    this.add(mesh(rbox(w + 1.2, 0.3, 1.4, 0.05), m.stone, x + w / 2, y - 0.25, z + 0.6));
    for (let i = 0; i < (o.night ? 0 : 3); i++) {
      const sh = mesh(new THREE.PlaneGeometry(w * (0.4 + i * 0.15), 26), m.shaft, x + w * (0.3 + i * 0.25) + 5, y + h * 0.5 - 9, z + 3 + i, { cast: false, receive: false });
      sh.rotation.z = 0.62;
      sh.renderOrder = 5;
      this.add(sh, true);
    }
  }

  fridge(x, y, w, h, shelves = [], o = {}) {
    const m = this.m;
    const back = -3.2, front = 1.8;
    this.add(mesh(bx(w, h, 0.3), m.fridgeLiner, x + w / 2, y + h / 2, back, { cast: false }));
    if (!o.noLeft) this.add(mesh(bx(0.5, h + 1, front - back + 0.6), m.plastic, x - 0.25, y + h / 2, (front + back) / 2));
    if (!o.noRight) this.add(mesh(bx(0.5, h + 1, front - back + 0.6), m.plastic, x + w + 0.25, y + h / 2, (front + back) / 2));
    this.add(mesh(bx(w + 1, 0.5, front - back + 0.6), m.plastic, x + w / 2, y + h + 0.25, (front + back) / 2));
    this.add(mesh(bx(w + 1, 0.6, front - back + 0.6), m.plastic, x + w / 2, y - 0.3, (front + back) / 2));
    for (let i = 0; i < 8; i++) this.add(mesh(bx(0.05, h, 0.12), m.plasticDim, x + 0.35, y + h / 2, back + 0.6 + i * 0.6, { cast: false }));
    for (const s of shelves) this.shelf(s.x ?? x, s.y, s.w ?? w);
    if (!o.noLeft) this.col(x - 0.5, y - 0.6, 0.5, h + 1.1, 'plastic');
    this.col(x, y + h, w, 0.5, 'plastic');
    this.col(x, y - 0.6, w, 0.6, 'plastic');
  }

  shelf(x, y, w, mat = 'glass') {
    const m = this.m;
    this.add(mesh(bx(w, 0.12, 4.6), m.glassShelf, x + w / 2, y - 0.06, -0.7, { cast: false }));
    this.add(mesh(rbox(w, 0.22, 0.2, 0.05), m.chrome, x + w / 2, y - 0.11, 1.6));
    this.add(mesh(rbox(w, 0.18, 0.15, 0.05), m.plasticDim, x + w / 2, y - 0.1, -3.0));
    this.col(x, y - 0.22, w, 0.22, mat);
  }

  fridgeBulb(x, y) {
    const b = this.group(x, y, -2.2);
    b.add(mesh(new THREE.SphereGeometry(0.35, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff4dc' }), 0, 0, 0, { cast: false }));
    b.add(mesh(bx(1.4, 0.3, 0.8), m_(this, 'plasticDim'), 0, 0.35, 0, { cast: false }));
    const halo = mesh(new THREE.PlaneGeometry(4.5, 4.5), new THREE.MeshBasicMaterial({ map: T.softDot(), color: '#ffcf8a', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }), 0, -0.2, 0.5, { cast: false, receive: false });
    b.add(halo);
    const l = new THREE.PointLight('#ffd49a', 14, 9, 1.6);
    l.position.set(0, -0.4, 2.2);
    b.add(l);
    this.lights.push(l);
    return b;
  }

  coldLight(x, y, w) {
    const p = new THREE.PointLight('#bcd8ff', 9, w * 1.2, 1.4);
    p.position.set(x, y, 2.5);
    this.add(p, true);
    this.lights.push(p);
  }

  jar(x, y, w, h, fill = 'jam', lid = 'lidRed') {
    const m = this.m, r = w / 2;
    const gr = this.group(x + r, y, 0, false);
    gr.add(mesh(lathe([[0, 0.02], [r * 0.9, 0], [r * 0.99, 0.08], [r, 0.2], [r, h * 0.8], [r * 0.9, h * 0.88], [r * 0.82, h * 0.92], [r * 0.82, h * 0.93], [0, h * 0.93]], 36), m.glass, 0, 0, 0, { cast: false }));
    const fm = fill === 'honey' ? m.honey : fill === 'pickle' ? m.pickle : m.jam;
    gr.add(mesh(lathe([[0, 0.1], [r * 0.86, 0.1], [r * 0.88, h * 0.2], [r * 0.88, h * 0.76], [r * 0.8, h * 0.8], [0, h * 0.82]], 32), fm, 0, 0, 0));
    gr.add(mesh(knurledLid(r * 0.9, h * 0.1), m[lid], 0, h * 0.9, 0));
    const spec = JAR[fill === 'honey' ? 'Honey' : fill === 'pickle' ? 'Pickles' : 'Jam'];
    gr.add(labelArc(r, h * 0.38, spec, h * 0.44, 2.4));
    this.col(x, y, w, h * 1.0, 'glass');
    return gr;
  }

  mug(x, y, r, h, mat = 'ceramicBlue', z = 0, collide = true) {
    const m = this.m;
    const gr = this.group(x + r, y, z, false);
    gr.add(mesh(lathe([[0, 0.02], [r * 0.82, 0], [r * 0.95, 0.06], [r * 1.0, 0.14], [r * 1.0, h * 0.96], [r * 1.03, h], [r * 0.93, h], [r * 0.92, h * 0.14], [0, h * 0.12]], 32), m[mat]));
    const hw = r * 0.62;
    gr.add(mesh(tube([[r * 0.96, h * 0.84, 0], [r + hw * 0.7, h * 0.86, 0], [r + hw, h * 0.7, 0], [r + hw, h * 0.32, 0], [r + hw * 0.7, h * 0.16, 0], [r * 0.96, h * 0.2, 0]], r * 0.14), m[mat], 0, 0, 0));
    if (collide) this.col(x, y, r * 2, h, 'ceramic');
    return gr;
  }

  coffeeMug(x, y, r, h, z = 0, collide = true) {
    const gr = this.mug(x, y, r, h, 'ceramicCream', z, collide);
    gr.add(mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.05, 28), this.m.coffee, 0, h * 0.86, 0, { cast: false }));
    return gr;
  }

  yogurt(x, y, w, h, color = '#e9b8c4') {
    const m = this.m, r = w / 2;
    const gr = this.group(x + r, y, 0, false);
    const cup = mesh(new THREE.CylinderGeometry(r, r * 0.9, h, 32, 1, true), std({ color: '#fbf8f2', roughness: 0.35, side: THREE.DoubleSide }), 0, h / 2, 0);
    gr.add(cup);
    gr.add(labelArc(r * 0.97, h * 0.62, { text: 'Yogurt', kicker: 'FARM', sub: 'strawberry', bg: color, fg: '#ffffff', italic: true, size: 96, subSize: 34, frame: false, ty: 0.4, sy: 0.7 }, h * 0.5, 2.6));
    gr.add(mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.06, 0.05, 28), m.foil, 0, h + 0.02, 0));
    this.col(x + 0.05, y, w - 0.1, h + 0.05, 'plastic');
    return gr;
  }

  carton(x, y, w, h, spec = { text: 'Milk', kicker: 'FRESH', sub: 'whole · 1 L', bg: '#fbfaf5', fg: '#2f5d91', band: '#a9c6e6', bandY: 0.72, emblem: 'sun', ey: 0.22, eR: 0.08, emblemCol: '#f0b43c', ty: 0.36, sy: 0.6, size: 96, subSize: 34 }) {
    const gr = this.group(x + w / 2, y, 0, false);
    const lm = new THREE.MeshStandardMaterial({ map: T.label(faceSpec(spec, w, h)), roughness: 0.5 });
    const side = new THREE.MeshStandardMaterial({ color: spec.band || spec.bg, roughness: 0.5 });
    gr.add(mesh(bx(w, h, w * 0.95), [side, side, side, side, lm, side], 0, h / 2, 0));
    const roof = new THREE.Shape();
    roof.moveTo(-w / 2, 0); roof.lineTo(0, w * 0.32); roof.lineTo(w / 2, 0); roof.closePath();
    const rg = new THREE.ExtrudeGeometry(roof, { depth: w * 0.95, bevelEnabled: false });
    rg.translate(0, 0, -w * 0.475);
    gr.add(mesh(rg, side, 0, h, 0));
    gr.add(mesh(bx(w * 0.1, 0.25, w * 0.95), side, 0, h + w * 0.36, 0));
    this.col(x, y, w, h, 'plastic');
    return gr;
  }

  cheese(x, y, w, h, opts = {}) {
    const gr = this.group(x + w / 2, y + h / 2, opts.z || 0, !!opts.dynamic);
    gr.add(mesh(rbox(w, h, opts.d || 2.2, 0.08), this.m.cheese));
    if (!opts.noCol) this.col(x, y, w, h, 'soft', { food: 'cheese', ...(opts.col || {}) });
    return gr;
  }

  bread(x, y, w, h, opts = {}) {
    const m = this.m;
    const gr = this.group(x + w / 2, y, opts.z || 0, !!opts.dynamic);
    const body = mesh(rbox(w, h * 0.78, opts.d || 2.4, 0.35, 3), m.crust, 0, h * 0.39, 0);
    gr.add(body);
    const top = mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m.crust, 0, h * 0.7, 0, { sx: w * 0.5, sy: h * 0.32, sz: (opts.d || 2.4) * 0.5 });
    gr.add(top);
    for (let i = 0; i < Math.floor(w / 0.9); i++) {
      const sc = mesh(bx(0.08, 0.05, (opts.d || 2.4) * 0.8), m.crumb, -w / 2 + 0.6 + i * 0.9, h * 1.0, 0, { cast: false });
      sc.rotation.z = 0.5;
      gr.add(sc);
    }
    if (!opts.noCol) this.col(x, y, w, h * 0.95, 'soft', { food: 'bread', ...(opts.col || {}) });
    return gr;
  }

  breadSlice(w, h, d = 2.2) {
    const gr = new THREE.Group();
    gr.add(mesh(rbox(w, h, d, Math.min(0.12, w / 3)), this.m.crust));
    gr.add(mesh(rbox(w * 1.01, h - 0.2, d - 0.2, 0.08), this.m.crumb));
    return gr;
  }

  board(x, y, w, h, rot = 0, z = 0) {
    const gr = this.group(x + w / 2, y + h / 2, z, false);
    gr.rotation.z = rot;
    gr.add(mesh(rbox(w, h, 2.6, Math.min(0.12, h / 2.2)), this.m.woodBoard));
    this.col(x, y, w, h, 'wood', { rot });
    return gr;
  }

  toaster(x, y, w = 3.2, h = 2.4) {
    const m = this.m;
    const gr = this.group(x + w / 2, y, 0, false);
    gr.add(mesh(rbox(w, h, 2.0, 0.42, 4), m.chrome, 0, h / 2, 0));
    gr.add(mesh(rbox(w * 1.01, 0.3, 2.04, 0.12), m.dark, 0, 0.15, 0));
    for (const sx of [-0.5, 0.5]) gr.add(mesh(rbox(w * 0.66, 0.06, 0.34, 0.03), m.dark, 0, h + 0.02, sx, { cast: false }));
    for (const sx of [-w / 2 + 0.25, w / 2 - 0.25]) gr.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 12), m.dark, sx, 0.4, 1.04, { rx: Math.PI / 2 }));
    gr.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16), m.dark, -w * 0.3, h * 0.35, 1.02, { rx: Math.PI / 2 }));
    gr.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), m.chrome, -w * 0.3, h * 0.35, 1.08, { rx: Math.PI / 2 }));
    const lever = new THREE.Group();
    lever.position.set(w / 2 + 0.1, h * 0.75, 0.4);
    lever.add(mesh(rbox(0.5, 0.28, 0.35, 0.08), m.dark, 0, 0, 0));
    lever.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 10), m.chrome, 0, -0.3, 0));
    gr.add(lever);
    this.col(x, y, w, h - 0.05, 'metal');
    return { gr, lever };
  }

  kettle(x, y, r = 1.1, z = -1.2) {
    const m = this.m;
    const gr = this.group(x + r, y, z, false);
    gr.add(mesh(lathe([[0, 0], [r * 0.85, 0], [r * 0.97, 0.08], [r, 0.25], [r * 1.0, r * 1.0], [r * 0.92, r * 1.3], [r * 0.6, r * 1.5], [r * 0.28, r * 1.58], [0, r * 1.6]], 36), m.steel));
    gr.add(mesh(tube([[-r * 0.66, r * 1.42, 0], [-r * 0.82, r * 1.84, 0], [-r * 0.3, r * 2.15, 0], [r * 0.3, r * 2.15, 0], [r * 0.82, r * 1.84, 0], [r * 0.66, r * 1.42, 0]], r * 0.085), m.dark));
    gr.add(mesh(tube([[r * 0.9, r * 0.4, 0], [r * 1.3, r * 0.5, 0], [r * 1.55, r * 0.92, 0], [r * 1.62, r * 1.24, 0]], r * 0.1), m.steel));
    gr.add(mesh(new THREE.SphereGeometry(r * 0.12, 14, 10), m.dark, 0, r * 1.64, 0));
    gr.add(mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.8, 0.12, 28), m.dark, 0, 0.05, 0));
    return gr;
  }

  canister(x, y, r, h, text = 'Flour', z = 0, collide = true) {
    const m = this.m;
    const gr = this.group(x + r, y, z, false);
    gr.add(mesh(lathe([[0, 0], [r * 0.96, 0], [r, 0.1], [r, h * 0.96], [r * 0.98, h], [0, h]], 36), m.ceramicCream));
    gr.add(mesh(lathe([[0, h], [r * 0.98, h], [r * 1.05, h + 0.12], [r * 1.05, h + 0.3], [0, h + 0.3]], 36), m.steel));
    gr.add(mesh(new THREE.SphereGeometry(0.18, 14, 10), m.woodDark, 0, h + 0.5, 0));
    gr.add(labelArc(r, h * 0.36, { text, kicker: 'PANTRY', bg: '#efe1c4', fg: '#6b5236', size: 96, italic: true, sub: '500 g', subSize: 34, ty: 0.42, sy: 0.7, fine: 'KEEP DRY', fy: 0.85 }, h * 0.5, 2.4));
    if (collide) this.col(x, y, r * 2, h + 0.4, 'ceramic');
    return gr;
  }

  cereal(x, y, w, h, z = 0, collide = true) {
    const gr = this.group(x + w / 2, y, z, false);
    const front = new THREE.MeshStandardMaterial({ map: T.label(faceSpec({ text: 'Morning O’s', kicker: 'WHOLE GRAIN', sub: 'honey · family size', bg: '#e8b04a', fg: '#4a2c14', band: '#c85d3a', bandY: 0.78, size: 92, subSize: 34, ty: 0.3, sy: 0.46, italic: true, emblem: 'sun', ey: 0.56, eR: 0.09, emblemCol: '#fff1c4' }, w, h)), roughness: 0.6 });
    const side = new THREE.MeshStandardMaterial({ color: '#d99b3c', roughness: 0.6 });
    gr.add(mesh(bx(w, h, 1.2), [side, side, side, side, front, side], 0, h / 2, 0));
    if (collide) this.col(x, y, w, h, 'plastic');
    return gr;
  }

  spiceShelf(x, y, w, z = 0, collide = true) {
    const m = this.m;
    this.add(mesh(rbox(w, 0.25, 1.4, 0.05), m.woodDark, x + w / 2, y - 0.125, z - 0.7));
    const n = Math.floor(w / 0.9);
    const caps = ['lidRed', 'lidGold', 'lidGreen', 'iron'];
    for (let i = 0; i < n; i++) {
      if (i % 3 === 1) continue;
      const cx = x + 0.45 + i * 0.9;
      this.add(mesh(lathe([[0, 0], [0.26, 0], [0.3, 0.1], [0.3, 0.8], [0.27, 0.9], [0, 0.9]], 18), m.glass, cx, y, z - 1.0, { cast: false }));
      this.add(mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 16), [m.pickle, m.orange, m.toast, m.lidRed][i % 4], cx, y + 0.34, z - 1.0));
      this.add(mesh(knurledLid(0.3, 0.2), m[caps[i % 4]], cx, y + 0.98, z - 1.0));
    }
    if (collide) this.col(x, y - 0.25, w, 0.25, 'wood', { oneWay: true });
  }

  dishRack(x, y, w, h) {
    const m = this.m;
    const gr = this.group(x, y, 0, false);
    const n = Math.round(w / 0.35);
    const wire = new THREE.CylinderGeometry(0.035, 0.035, 2.4, 6);
    const inst = new THREE.InstancedMesh(wire, m.chrome, n + 1);
    const o = new THREE.Object3D();
    for (let i = 0; i <= n; i++) { o.position.set(i * (w / n), h, 0); o.rotation.set(Math.PI / 2, 0, 0); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); }
    inst.castShadow = true;
    gr.add(inst);
    gr.add(mesh(bx(w, 0.06, 0.06), m.chrome, w / 2, h, 1.2));
    gr.add(mesh(bx(w, 0.06, 0.06), m.chrome, w / 2, h, -1.2));
    for (const lx of [0.1, w - 0.1]) gr.add(mesh(bx(0.07, h, 0.07), m.chrome, lx, h / 2, 1.2));
    this.col(x, y + h - 0.12, w, 0.14, 'grate', { grate: true, gap: w / n, gx0: x });
    return gr;
  }

  sink(x, y, w, depth = 3.2) {
    const m = this.m;
    const gr = this.group(x, y, 0, false);
    gr.add(mesh(rbox(w, depth, 0.2, 0.06), m.steel, w / 2, -depth / 2, -2.6, { cast: false }));
    gr.add(mesh(rbox(w, 0.2, 4.4, 0.06), m.steel, w / 2, -depth, -0.4, { cast: false }));
    gr.add(mesh(rbox(0.15, depth, 4.4, 0.04), m.steel, 0.07, -depth / 2, -0.4));
    gr.add(mesh(rbox(0.15, depth, 4.4, 0.04), m.steel, w - 0.07, -depth / 2, -0.4));
    gr.add(mesh(rbox(w + 0.3, 0.12, 0.3, 0.04), m.steel, w / 2, -0.06, 1.75));
    const water = mesh(bx(w - 0.3, 0.1, 4.2), m.water, w / 2, -depth + 0.9, -0.4, { cast: false });
    gr.add(water);
    const f = this.group(x + w * 0.5, y, -2.8, false);
    f.add(mesh(lathe([[0, 0], [0.26, 0], [0.26, 0.2], [0.2, 0.5], [0.2, 3.9], [0.24, 4.2], [0.2, 4.4], [0, 4.4]], 16), m.chrome));
    f.add(mesh(tube([[0, 4.25, 0], [0.7, 4.7, 0], [1.6, 4.65, 0], [2.0, 4.2, 0]], 0.19, 28), m.chrome));
    f.add(mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16), m.chrome, 0, 0.05, 0));
    this.col(x - 0.01, y - depth - 1, 0.16, depth + 1, 'metal');
    this.col(x + w - 0.15, y - depth - 1, 0.16, depth + 1, 'metal');
    this.col(x, y - depth - 1, w, 1, 'metal');
    return { gr, water, waterY: y - depth + 0.95 };
  }

  stove(x, y, w, burners = 2) {
    const m = this.m;
    this.add(mesh(rbox(w, 0.22, 5.2, 0.05), m.steel, x + w / 2, y - 0.12, -0.9));
    const glows = [];
    for (let i = 0; i < burners; i++) {
      const cx = x + w * (i + 0.5) / burners;
      this.add(mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.18, 28), m.iron, cx, y + 0.09, 0));
      const ring = mesh(new THREE.TorusGeometry(0.62, 0.06, 6, 32), new THREE.MeshBasicMaterial({ color: '#3a3330' }), cx, y + 0.2, 0, { rx: Math.PI / 2, cast: false });
      this.add(ring, true);
      glows.push(ring);
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + Math.PI / 4;
        this.add(mesh(rbox(1.5, 0.14, 0.14, 0.06), m.iron, cx + Math.cos(a) * 0.75, y + 0.26, Math.sin(a) * 0.75, { ry: -a }));
      }
      this.add(mesh(rbox(2.2, 0.14, 0.14, 0.06), m.iron, cx, y + 0.3, 0));
    }
    this.col(x, y - 3, w, 3, 'metal');
    this.col(x + 0.2, y, w - 0.4, 0.3, 'grate', { grate: true, seep: false });
    return glows;
  }

  drawer(x, y, w, h, opts = {}) {
    const m = this.m;
    const gr = this.group(x, y, 0, !!opts.dynamic);
    const t = 0.3;
    gr.add(mesh(bx(w, t, 4.4), m.woodDrawer, w / 2, t / 2, -0.4));
    gr.add(mesh(bx(t, h, 4.4), m.woodDrawer, t / 2, h / 2, -0.4));
    gr.add(mesh(bx(t, h, 4.4), m.woodDrawer, w - t / 2, h / 2, -0.4));
    gr.add(mesh(bx(w, h, t), m.woodDrawer, w / 2, h / 2, -2.6, { cast: false }));
    if (!opts.noFront) {
      gr.add(mesh(rbox(w + 0.4, 0.75, 0.35, 0.06), m.cabinet, w / 2, 0.2, 1.95));
      gr.add(mesh(rbox(2.0, 0.16, 0.25, 0.07), m.brass, w / 2, 0.2, 2.2));
    }
    if (!opts.noCol) {
      this.col(x, y, w, t, 'wood');
      this.col(x, y, t, h, 'wood');
      this.col(x + w - t, y, t, h, 'wood');
    }
    return gr;
  }

  divider(x, y, h, z = -0.4) {
    this.add(mesh(rbox(0.18, h, 4.2, 0.05), this.m.woodDrawer, x + 0.09, y + h / 2, z));
    this.col(x, y, 0.18, h, 'wood');
  }

  table(x, y, w, opts = {}) {
    const m = this.m;
    this.add(mesh(rbox(w, 0.45, 7, 0.08), m.woodTable, x + w / 2, y - 0.225, -0.5));
    const cl = mesh(bx(w * 0.86, 0.04, 6.4), m.cloth, x + w / 2, y + 0.02, -0.5, { cast: false });
    this.add(cl);
    const drape = mesh(new THREE.PlaneGeometry(w * 0.86, 2.6), m.cloth, x + w / 2, y - 1.3, 2.75, { cast: false });
    this.add(drape);
    if (opts.legs !== false) for (const lx of [x + 0.8, x + w - 0.8]) this.add(mesh(turnedLeg(opts.legH || 9, 0.3), m.woodTable, lx, y - 0.45 - (opts.legH || 9), 1.6));
    this.col(x, y - 0.45, w, 0.47, 'cloth');
  }

  plate(x, y, r = 1.6, z = 0, collide = true) {
    const gr = this.group(x + r, y, z, false);
    gr.add(mesh(lathe([[0, 0], [r * 0.5, 0], [r * 0.56, 0.05], [r * 0.6, 0.08], [r * 0.9, 0.16], [r, 0.24], [r * 0.99, 0.27], [r * 0.95, 0.26], [r * 0.6, 0.14], [0, 0.14]], 44), this.m.ceramic));
    if (collide) this.col(x + r * 0.1, y, r * 1.8, 0.22, 'ceramic');
    return gr;
  }

  toast(w = 1.8, h = 1.8, t = 0.3) {
    const gr = new THREE.Group();
    gr.add(mesh(rbox(w, t, h, 0.12), this.m.toast));
    gr.add(mesh(rbox(w * 0.86, t * 1.04, h * 0.86, 0.1), this.m.toastIn));
    return gr;
  }

  butterDish(x, y, w = 2.4, open = true) {
    const m = this.m;
    const gr = this.group(x + w / 2, y, 0, false);
    gr.add(mesh(rbox(w, 0.18, 1.6, 0.08), m.ceramic, 0, 0.09, 0));
    gr.add(mesh(rbox(w - 0.3, 0.06, 1.3, 0.03), m.ceramicCream, 0, 0.2, 0, { cast: false }));
    let lid = null;
    if (open) {
      lid = mesh(rbox(w - 0.2, 0.9, 1.4, 0.28), m.ceramic, -w * 0.62, 0.5, -1.2, { rz: 0.32 });
      gr.add(lid);
    }
    this.col(x, y, w, 0.2, 'ceramic');
    return gr;
  }

  sponge(x, y, w, h, z = 0, collide = true) {
    const gr = this.group(x + w / 2, y, z, false);
    gr.add(mesh(rbox(w, h * 0.72, 1.6, 0.12), this.m.sponge, 0, h * 0.36, 0));
    gr.add(mesh(rbox(w, h * 0.28, 1.6, 0.06), this.m.spongeGreen, 0, h * 0.86, 0));
    if (collide) this.col(x, y, w, h, 'soft');
    return gr;
  }

  iceCube(x, y, s = 0.8, z = 0, collide = true) {
    const me = mesh(rbox(s, s, s, 0.12), this.m.ice, x + s / 2, y + s / 2, z, { ry: 0.3 });
    this.add(me);
    if (collide) this.col(x, y, s, s * 0.95, 'glass');
    return me;
  }

  plant(x, y, z = -2.4, s = 1) {
    const m = this.m;
    const gr = this.group(x, y, z, false);
    gr.add(mesh(lathe([[0, 0], [0.62 * s, 0], [0.8 * s, 0.4 * s], [0.9 * s, 1.0 * s], [0.95 * s, 1.3 * s], [0.9 * s, 1.36 * s], [0, 1.36 * s]], 24), m.ceramicTerracotta));
    const lf = new THREE.SphereGeometry(0.45 * s, 10, 6);
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4, rr = 0.2 + (i % 5) * 0.12;
      gr.add(mesh(lf, m.leaf, Math.cos(a) * rr * s, (1.6 + (i % 4) * 0.45) * s, Math.sin(a) * rr * s, { sx: 1, sy: 0.35, sz: 0.7, rz: a }));
    }
    return gr;
  }

  utensilCrock(x, y, z = -2.6) {
    const m = this.m;
    const gr = this.group(x, y, z, false);
    gr.add(mesh(lathe([[0, 0], [0.7, 0], [0.85, 0.3], [0.86, 2.0], [0.82, 2.2], [0, 2.2]], 24), m.ceramicSage));
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Group();
      sp.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 8), m.woodBoard, 0, 1.8, 0));
      sp.add(mesh(new THREE.SphereGeometry(0.3, 12, 8), m.woodBoard, 0, 3.7, 0, { sx: 0.8, sy: 1.3, sz: 0.35 }));
      sp.position.set((i - 1.5) * 0.3, 1.0, (i % 2) * 0.2);
      sp.rotation.z = (i - 1.5) * 0.12;
      gr.add(sp);
    }
    return gr;
  }

  fruitBowl(x, y, z = -2.2) {
    const m = this.m;
    const gr = this.group(x, y, z, false);
    gr.add(mesh(lathe([[0, 0], [0.8, 0], [1.5, 0.7], [1.6, 0.9], [1.5, 0.9], [0.7, 0.15], [0, 0.15]], 30), m.ceramicBlue));
    const fr = [[m.lemon, -0.6, 0.9, 0], [m.orange, 0.4, 0.95, 0.2], [m.apple, 0, 1.25, -0.2], [m.lemon, 0.9, 0.9, -0.3]];
    for (const [mat, fx, fy, fz] of fr) gr.add(mesh(new THREE.SphereGeometry(0.5, 16, 12), mat, fx, fy, fz, { sx: mat === m.lemon ? 1.2 : 1 }));
    return gr;
  }

  pans(x, y, z = -3.0) {
    const m = this.m;
    this.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 8, 8), m.brass, x + 4, y, z, { rz: Math.PI / 2 }));
    for (let i = 0; i < 3; i++) {
      const gr = this.group(x + 1.5 + i * 2.6, y - 0.2, z, false);
      gr.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6), m.brass, 0, -0.3, 0));
      gr.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), m.copper, 0, -1.6, 0));
      gr.add(mesh(new THREE.CylinderGeometry(1.0 + i * 0.15, 1.0 + i * 0.15, 0.14, 28), m.copper, 0, -3.2 - i * 0.15, 0, { rx: Math.PI / 2 }));
    }
  }

  clock(x, y, z = -3.3) {
    const m = this.m;
    const gr = this.group(x, y, z, true);
    gr.add(mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 48), m.ceramic, 0, 0, 0, { rx: Math.PI / 2 }));
    gr.add(mesh(new THREE.TorusGeometry(1.2, 0.1, 8, 48), m.brass, 0, 0, 0.1));
    gr.add(mesh(new THREE.CircleGeometry(1.1, 48), std({ map: T.clockFace(), roughness: 0.5 }), 0, 0, 0.115, { cast: false }));
    const hh = mesh(bx(0.08, 0.6, 0.04), m.dark, 0, 0.3, 0.14);
    const mh = mesh(bx(0.05, 0.9, 0.04), m.dark, 0, 0.45, 0.16);
    const ph = new THREE.Group(); ph.position.z = 0.0; ph.add(hh); ph.rotation.z = -1.9;
    const pm = new THREE.Group(); pm.add(mh); pm.rotation.z = -0.4;
    gr.add(ph, pm);
    return { gr, hour: ph, minute: pm };
  }

  bottle(x, y, z = -2.0, h = 3.4, mat = 'pickle') {
    const m = this.m;
    const gr = this.group(x, y, z, false);
    gr.add(mesh(lathe([[0, 0], [0.5, 0], [0.55, 0.1], [0.55, h * 0.62], [0.2, h * 0.8], [0.18, h], [0, h]], 24), m.glass, 0, 0, 0, { cast: false }));
    gr.add(mesh(lathe([[0, 0.05], [0.5, 0.05], [0.5, h * 0.55], [0, h * 0.55]], 24), m[mat]));
    gr.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 14), m.cork, 0, h + 0.1, 0));
    gr.add(labelArc(0.55, h * 0.3, BOTTLE[mat === 'honey' ? 'honey' : 'pickle'], h * 0.3, 2.2));
    return gr;
  }

  saltPepper(x, y, z = -1.8) {
    const m = this.m;
    this.add(mesh(lathe([[0, 0], [0.35, 0], [0.38, 0.9], [0.25, 1.2], [0, 1.25]], 18), m.ceramic, x, y, z));
    this.add(mesh(lathe([[0, 0], [0.35, 0], [0.38, 0.9], [0.25, 1.2], [0, 1.25]], 18), m.iron, x + 0.9, y, z));
  }

  photo(x, y, z = -3.35, w = 2.2, h = 1.6) {
    const m = this.m;
    this.add(mesh(rbox(w + 0.3, h + 0.3, 0.12, 0.04), m.woodDark, x, y, z));
    const img = new THREE.MeshStandardMaterial({ map: T.scenePhoto(), roughness: 0.6 });
    this.add(mesh(new THREE.PlaneGeometry(w, h), img, x, y, z + 0.07, { cast: false }));
  }

  towel(x, y, z = 1.9, w = 2.2, h = 3.4) {
    const m = this.m;
    const gr = this.group(x, y, z, false);
    const geo = new THREE.PlaneGeometry(w, h, 6, 10);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 2.2) * 0.12 + (p.getY(i) < 0 ? 0.05 : 0));
    geo.computeVertexNormals();
    gr.add(mesh(geo, m.towel, 0, -h / 2, 0));
    gr.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, w + 0.6, 8), m.brass, 0, 0.05, -0.05, { rz: Math.PI / 2 }));
    return gr;
  }

  woodenSpoon(len = 4.4) {
    const m = this.m;
    const gr = new THREE.Group();
    gr.add(mesh(new THREE.CylinderGeometry(0.1, 0.13, len * 0.7, 10), m.woodBoard, -len * 0.15, 0, 0, { rz: Math.PI / 2 }));
    gr.add(mesh(new THREE.SphereGeometry(0.55, 16, 10), m.woodBoard, len * 0.32, 0.05, 0, { sx: 1.3, sy: 0.35, sz: 0.9 }));
    return gr;
  }

  fgJar(x, y, z = 5.5, s = 1.4) {
    const m = this.m;
    const gr = this.group(x, y, z, false);
    gr.add(mesh(lathe([[0, 0], [0.9 * s, 0], [s, 0.1], [s, 2.2 * s], [0.8 * s, 2.4 * s], [0, 2.4 * s]], 24), m.glass, 0, 0, 0, { cast: false }));
    gr.add(mesh(new THREE.CylinderGeometry(0.9 * s, 0.9 * s, 1.4 * s, 20), m.honey, 0, 0.75 * s, 0, { cast: false }));
    return gr;
  }
}

function m_(b, k) { return b.m[k]; }

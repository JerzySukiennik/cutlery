// Kitchen props: procedural meshes plus the collider boxes that make them walkable.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';

const M = {};
export function mats() {
  if (M.ready) return M;
  const std = (o) => new THREE.MeshStandardMaterial(o);
  M.metal = std({ color: '#dfe3e8', metalness: 1, roughness: 0.16 });
  M.steel = std({ color: '#c9cdd2', metalness: 1, roughness: 0.34 });
  M.chrome = std({ color: '#eef1f4', metalness: 1, roughness: 0.08 });
  M.brass = std({ color: '#c8a05a', metalness: 1, roughness: 0.3 });
  M.copper = std({ color: '#c77b4f', metalness: 1, roughness: 0.28 });
  M.iron = std({ color: '#2b2a29', metalness: 0.6, roughness: 0.6 });
  M.dark = std({ color: '#1d1714', roughness: 0.8 });
  M.glass = new THREE.MeshStandardMaterial({ color: '#e8f2f0', metalness: 0, roughness: 0.04, transparent: true, opacity: 0.22, depthWrite: false, envMapIntensity: 1.6 });
  M.glassShelf = new THREE.MeshStandardMaterial({ color: '#d6efe9', metalness: 0, roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false, envMapIntensity: 1.4 });
  M.ceramic = std({ color: '#f4f1ea', roughness: 0.22 });
  M.ceramicBlue = std({ color: '#5c7fa8', roughness: 0.25 });
  M.ceramicSage = std({ color: '#9fb39a', roughness: 0.3 });
  M.ceramicCream = std({ color: '#efe1c4', roughness: 0.3 });
  M.ceramicTerracotta = std({ color: '#c46e4b', roughness: 0.55 });
  M.plastic = std({ color: '#f2f3f1', roughness: 0.38 });
  M.plasticDim = std({ color: '#dfe3e2', roughness: 0.45 });
  M.fridgeLiner = std({ color: '#dfe8ec', roughness: 0.35 });
  const tl = T.tiles('#ece3d3', '#bdb19e');
  M.tiles = std({ map: tl.map, bumpMap: tl.bump, bumpScale: 1.4, roughness: 0.28 });
  M.paint = std({ map: T.wallPaint('#efe2cc'), roughness: 0.9 });
  M.paintDark = std({ map: T.wallPaint('#d7c6ab'), roughness: 0.9 });
  M.stone = std({ map: T.stone(), roughness: 0.32 });
  M.woodBoard = std({ map: T.wood('#d39e67', '#94603a', 3), roughness: 0.55 });
  M.woodDark = std({ map: T.wood('#9a6a43', '#5c3a22', 8), roughness: 0.6 });
  M.woodDrawer = std({ map: T.wood('#d8b384', '#a87a4e', 12, 0), roughness: 0.65 });
  M.woodTable = std({ map: T.wood('#b9875a', '#7a4f2e', 17, 6), roughness: 0.5 });
  M.cabinet = std({ color: '#8ea08a', roughness: 0.55 });
  M.cabinetDark = std({ color: '#71846d', roughness: 0.6 });
  M.crust = std({ map: T.crust(), roughness: 0.75 });
  M.crumb = std({ map: T.crumb(), roughness: 0.9 });
  M.cheese = std({ map: T.cheese(), roughness: 0.5 });
  M.cheeseRind = std({ color: '#e7b43c', roughness: 0.45 });
  M.jam = std({ color: '#8f1f2e', roughness: 0.15, transparent: true, opacity: 0.92 });
  M.honey = std({ color: '#d88d1d', roughness: 0.1, transparent: true, opacity: 0.9 });
  M.pickle = std({ color: '#7d8c3a', roughness: 0.3 });
  M.milk = std({ color: '#fbfaf6', roughness: 0.3 });
  M.foil = std({ color: '#d8d8dc', metalness: 0.9, roughness: 0.35 });
  M.lidRed = std({ color: '#b5443a', roughness: 0.4 });
  M.lidGold = std({ color: '#c79c48', metalness: 0.8, roughness: 0.35 });
  M.lidGreen = std({ color: '#5f7d4c', roughness: 0.45 });
  M.sponge = std({ color: '#f2d24b', roughness: 0.95 });
  M.spongeGreen = std({ color: '#4d8a52', roughness: 0.95 });
  M.cloth = std({ map: T.cloth(), roughness: 0.95, side: THREE.DoubleSide });
  M.towel = std({ map: T.cloth('#efe9df', '#c9a26a'), roughness: 0.95, side: THREE.DoubleSide });
  M.leaf = std({ color: '#5e8a45', roughness: 0.7, side: THREE.DoubleSide });
  M.lemon = std({ color: '#f1cf3b', roughness: 0.45 });
  M.orange = std({ color: '#ea8a2c', roughness: 0.5 });
  M.apple = std({ color: '#b8402f', roughness: 0.3 });
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

function labelBand(r, h, spec, y) {
  const geo = new THREE.CylinderGeometry(r * 1.004, r * 1.004, h, 32, 1, true);
  const m = new THREE.MeshStandardMaterial({ map: T.label(spec), roughness: 0.6 });
  const me = mesh(geo, m, 0, y, 0, { cast: false });
  me.rotation.y = -Math.PI / 2;
  return me;
}

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

  col(x, y, w, h, mat, extra = {}) {
    if (this.capture || this.nocol) return null;
    const c = { x, y, w, h, mat, ...extra };
    this.colliders.push(c);
    return c;
  }

  add(obj, dynamic = false) {
    (dynamic || this.capture ? this.root : this.statics).add(obj);
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

  window(x, y, w, h, z = -3.5) {
    const m = this.m;
    this.add(mesh(new THREE.PlaneGeometry(w * 1.8, h * 1.8), m.sky, x + w / 2, y + h / 2, z - 3, { cast: false, receive: false }));
    const fr = 0.3;
    this.add(mesh(bx(w + fr * 2, fr, 0.6), m.plastic, x + w / 2, y + h + fr / 2, z));
    this.add(mesh(bx(w + fr * 2, fr, 0.6), m.plastic, x + w / 2, y - fr / 2, z));
    this.add(mesh(bx(fr, h, 0.6), m.plastic, x - fr / 2, y + h / 2, z));
    this.add(mesh(bx(fr, h, 0.6), m.plastic, x + w + fr / 2, y + h / 2, z));
    this.add(mesh(bx(0.16, h, 0.4), m.plastic, x + w / 2, y + h / 2, z));
    this.add(mesh(bx(w, 0.16, 0.4), m.plastic, x + w / 2, y + h * 0.62, z));
    this.add(mesh(rbox(w + 1.2, 0.3, 1.4, 0.05), m.stone, x + w / 2, y - 0.25, z + 0.6));
    for (let i = 0; i < 3; i++) {
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
    const shape = [[0, 0], [r * 0.9, 0], [r, 0.08], [r, h * 0.82], [r * 0.82, h * 0.9], [r * 0.82, h * 0.93], [0, h * 0.93]];
    gr.add(mesh(lathe(shape, 28), m.glass, 0, 0, 0, { cast: false }));
    const fm = fill === 'honey' ? m.honey : fill === 'pickle' ? m.pickle : m.jam;
    gr.add(mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, h * 0.72, 24), fm, 0, h * 0.37, 0));
    gr.add(mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.88, h * 0.11, 24), m[lid], 0, h * 0.96, 0));
    gr.add(labelBand(r * 1.0, h * 0.34, { text: fill === 'honey' ? 'Honey' : fill === 'pickle' ? 'Pickles' : 'Jam', sub: fill === 'jam' ? 'cherry · Gzowo' : 'homemade', bg: '#f4ecd9', fg: '#5a2c22', italic: true, size: 70 }, h * 0.45));
    this.col(x, y, w, h * 1.0, 'glass');
    return gr;
  }

  mug(x, y, r, h, mat = 'ceramicBlue', z = 0, collide = true) {
    const m = this.m;
    const gr = this.group(x + r, y, z, false);
    gr.add(mesh(lathe([[0, 0.02], [r * 0.85, 0], [r, 0.08], [r * 1.02, h], [r * 0.92, h], [r * 0.9, h * 0.12], [0, h * 0.12]], 28), m[mat]));
    const hd = mesh(new THREE.TorusGeometry(h * 0.26, r * 0.12, 8, 16, Math.PI * 1.2), m[mat], r * 0.98, h * 0.5, 0);
    hd.rotation.z = -Math.PI * 0.6;
    gr.add(hd);
    if (collide) this.col(x, y, r * 2, h, 'ceramic');
    return gr;
  }

  coffeeMug(x, y, r, h, z = 0, collide = true) {
    const gr = this.mug(x, y, r, h, 'ceramicCream', z, collide);
    gr.add(mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.88, 0.05, 24), this.m.coffee, 0, h * 0.86, 0, { cast: false }));
    return gr;
  }

  yogurt(x, y, w, h, color = '#e9b8c4') {
    const m = this.m, r = w / 2;
    const gr = this.group(x + r, y, 0, false);
    const mat = new THREE.MeshStandardMaterial({ map: T.label({ text: 'Yogurt', sub: 'strawberry', bg: color, fg: '#ffffff', italic: true, size: 80 }), roughness: 0.4 });
    const cup = mesh(new THREE.CylinderGeometry(r, r * 0.78, h, 28, 1, false), mat, 0, h / 2, 0);
    cup.rotation.y = -Math.PI / 2;
    gr.add(cup);
    gr.add(mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.06, 0.05, 28), m.foil, 0, h + 0.02, 0));
    this.col(x + 0.05, y, w - 0.1, h + 0.05, 'plastic');
    return gr;
  }

  carton(x, y, w, h, spec = { text: 'Milk', sub: 'fresh · 1 L', bg: '#fbfaf5', fg: '#3c6aa1', band: '#a9c6e6' }) {
    const gr = this.group(x + w / 2, y, 0, false);
    const lm = new THREE.MeshStandardMaterial({ map: T.label({ ...spec, w: 256, h: 512, size: 70, ty: 0.3, sy: 0.42 }), roughness: 0.5 });
    const side = new THREE.MeshStandardMaterial({ color: spec.bg, roughness: 0.5 });
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
    gr.add(mesh(rbox(w, h, 2.0, 0.45, 4), m.chrome, 0, h / 2, 0));
    gr.add(mesh(rbox(w * 0.98, 0.3, 2.04, 0.12), m.dark, 0, 0.15, 0));
    for (const sx of [-0.45, 0.45]) gr.add(mesh(bx(w * 0.7, 0.05, 0.3), m.dark, 0, h + 0.005, sx, { cast: false }));
    const lever = mesh(rbox(0.5, 0.28, 0.35, 0.08), m.dark, w / 2 + 0.1, h * 0.75, 0.4);
    gr.add(lever);
    gr.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16), m.dark, -w * 0.3, h * 0.35, 1.02, { rx: Math.PI / 2 }));
    this.col(x, y, w, h - 0.05, 'metal');
    return { gr, lever };
  }

  kettle(x, y, r = 1.1, z = -1.2) {
    const m = this.m;
    const gr = this.group(x + r, y, z, false);
    gr.add(mesh(lathe([[0, 0], [r * 0.95, 0], [r, 0.2], [r * 0.95, r * 1.2], [r * 0.6, r * 1.55], [r * 0.3, r * 1.62], [0, r * 1.62]], 28), m.steel));
    const h = mesh(new THREE.TorusGeometry(r * 0.6, 0.1, 8, 20, Math.PI), m.dark, 0, r * 1.62, 0);
    gr.add(h);
    const sp = mesh(new THREE.CylinderGeometry(0.1, 0.22, r * 1.1, 10), m.steel, r * 1.05, r * 0.9, 0, { rz: -0.9 });
    gr.add(sp);
    return gr;
  }

  canister(x, y, r, h, text = 'Flour', z = 0, collide = true) {
    const m = this.m;
    const gr = this.group(x + r, y, z, false);
    gr.add(mesh(new THREE.CylinderGeometry(r, r, h, 32), m.ceramicCream, 0, h / 2, 0));
    gr.add(mesh(new THREE.CylinderGeometry(r * 1.03, r * 1.03, 0.4, 32), m.woodBoard, 0, h + 0.2, 0));
    gr.add(mesh(new THREE.SphereGeometry(0.2, 12, 8), m.woodDark, 0, h + 0.45, 0));
    gr.add(labelBand(r, h * 0.3, { text, bg: '#efe1c4', fg: '#6b5236', size: 84, italic: true }, h * 0.55));
    if (collide) this.col(x, y, r * 2, h + 0.4, 'ceramic');
    return gr;
  }

  cereal(x, y, w, h, z = 0, collide = true) {
    const gr = this.group(x + w / 2, y, z, false);
    const front = new THREE.MeshStandardMaterial({ map: T.label({ text: 'Morning O’s', sub: 'whole grain · honey', bg: '#e8b04a', fg: '#4a2c14', band: '#c85d3a', size: 46, w: 256, h: 512, ty: 0.25, sy: 0.33 }), roughness: 0.6 });
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
      this.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 16), m.glass, cx, y + 0.45, z - 1.0, { cast: false }));
      this.add(mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.7, 16), [m.pickle, m.orange, m.toast, m.lidRed][i % 4], cx, y + 0.36, z - 1.0));
      this.add(mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.2, 16), m[caps[i % 4]], cx, y + 1.0, z - 1.0));
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
    this.col(x, y + h - 0.12, w, 0.14, 'grate', { grate: true });
    return gr;
  }

  sink(x, y, w, depth = 3.2) {
    const m = this.m;
    const gr = this.group(x, y, 0, false);
    gr.add(mesh(bx(w, depth, 0.2), m.steel, w / 2, -depth / 2, -2.6, { cast: false }));
    gr.add(mesh(bx(w, 0.2, 4.4), m.steel, w / 2, -depth, -0.4, { cast: false }));
    gr.add(mesh(bx(0.15, depth, 4.4), m.steel, 0.07, -depth / 2, -0.4));
    gr.add(mesh(bx(0.15, depth, 4.4), m.steel, w - 0.07, -depth / 2, -0.4));
    gr.add(mesh(rbox(w + 0.3, 0.12, 0.3, 0.04), m.steel, w / 2, -0.06, 1.75));
    const water = mesh(bx(w - 0.3, 0.1, 4.2), m.water, w / 2, -depth + 0.9, -0.4, { cast: false });
    gr.add(water);
    const f = this.group(x + w * 0.5, y, -2.8, false);
    f.add(mesh(new THREE.CylinderGeometry(0.2, 0.26, 4.4, 14), m.chrome, 0, 2.2, 0));
    const neck = mesh(new THREE.TorusGeometry(1.0, 0.16, 10, 20, Math.PI), m.chrome, 1.0, 4.4, 0);
    f.add(neck);
    f.add(mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.5, 12), m.chrome, 2.0, 4.15, 0));
    this.col(x - 0.01, y - depth - 1, 0.16, depth + 1, 'metal');
    this.col(x + w - 0.15, y - depth - 1, 0.16, depth + 1, 'metal');
    this.col(x, y - depth - 1, w, 1, 'metal');
    return { gr, water, waterY: y - depth + 0.95 };
  }

  stove(x, y, w, burners = 2) {
    const m = this.m;
    this.add(mesh(rbox(w, 0.25, 5.2, 0.05), m.iron, x + w / 2, y - 0.12, -0.9));
    const glows = [];
    for (let i = 0; i < burners; i++) {
      const cx = x + w * (i + 0.5) / burners;
      this.add(mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.18, 24), m.iron, cx, y + 0.09, 0));
      const ring = mesh(new THREE.TorusGeometry(0.62, 0.06, 6, 32), new THREE.MeshBasicMaterial({ color: '#3a3330' }), cx, y + 0.2, 0, { rx: Math.PI / 2, cast: false });
      this.add(ring, true);
      glows.push(ring);
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + Math.PI / 4;
        this.add(mesh(bx(1.5, 0.12, 0.12), m.iron, cx + Math.cos(a) * 0.75, y + 0.26, Math.sin(a) * 0.75, { ry: -a }));
      }
      this.add(mesh(bx(2.2, 0.12, 0.12), m.iron, cx, y + 0.3, 0));
    }
    this.col(x, y - 3, w, 3, 'metal');
    this.col(x + 0.2, y, w - 0.4, 0.3, 'grate', { grate: true });
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
    if (opts.legs !== false) for (const lx of [x + 0.8, x + w - 0.8]) this.add(mesh(bx(0.6, opts.legH || 9, 0.6), m.woodTable, lx, y - 0.45 - (opts.legH || 9) / 2, 1.6));
    this.col(x, y - 0.45, w, 0.47, 'cloth');
  }


  plate(x, y, r = 1.6, z = 0, collide = true) {
    const gr = this.group(x + r, y, z, false);
    gr.add(mesh(lathe([[0, 0], [r * 0.6, 0], [r * 0.65, 0.08], [r, 0.22], [r * 0.98, 0.26], [r * 0.6, 0.12], [0, 0.12]], 40), this.m.ceramic));
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
    gr.add(mesh(lathe([[0, 0], [0.7 * s, 0], [0.9 * s, 1.3 * s], [0.95 * s, 1.35 * s], [0, 1.35 * s]], 20), m.ceramicTerracotta));
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
    gr.add(mesh(new THREE.CylinderGeometry(0.85, 0.8, 2.2, 24), m.ceramicSage, 0, 1.1, 0));
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
    gr.add(mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 40), m.ceramic, 0, 0, 0, { rx: Math.PI / 2 }));
    gr.add(mesh(new THREE.TorusGeometry(1.2, 0.1, 8, 40), m.brass, 0, 0, 0.1));
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
    gr.add(mesh(lathe([[0, 0], [0.5, 0], [0.55, 0.1], [0.55, h * 0.62], [0.2, h * 0.8], [0.18, h], [0, h]], 20), m.glass, 0, 0, 0, { cast: false }));
    gr.add(mesh(lathe([[0, 0.05], [0.5, 0.05], [0.5, h * 0.55], [0, h * 0.55]], 20), m[mat]));
    gr.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12), m.cork, 0, h + 0.1, 0));
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
    const img = new THREE.MeshStandardMaterial({ map: T.sky(), roughness: 0.4 });
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

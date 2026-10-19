// House kit: rooms and furniture beyond the kitchen — pantry, living room, dining room, study, sink and night lighting.
import * as THREE from 'three';
import { mesh, rbox, bx, labelWrap, turnedLeg } from '../props.js';
import * as T from '../textures.js';

const std = (o) => new THREE.MeshStandardMaterial(o);
const cache = {};
function mat(key, fn) { if (!cache[key]) cache[key] = fn(); return cache[key]; }

export function room(L, x0, x1, o = {}) {
  const b = L.b, M = L.m, w = x1 - x0, cx = (x0 + x1) / 2, top = o.top ?? 24, fy = o.floor ?? 0;
  const wall = o.wall === 'paper' ? mat('paper' + (o.paper || ''), () => { const m = std({ map: T.wallpaper(...(o.paper || [])), roughness: 0.85 }); m.userData.worldUV = 8; return m; })
    : o.wall === 'plaster' ? mat('plaster', () => { const m = std({ map: T.wallPaint('#e6d8bf'), roughness: 0.95 }); m.userData.worldUV = 7; return m; })
    : M.paint;
  if (o.hole) {
    const h = o.hole;
    const part = (a0, a1, b0, b1) => { if (a1 > a0 && b1 > b0) b.add(mesh(bx(a1 - a0, b1 - b0, 0.3), wall, (a0 + a1) / 2, (b0 + b1) / 2, -3.75, { cast: false })); };
    part(x0, h.x0, fy, top); part(h.x1, x1, fy, top); part(h.x0, h.x1, fy, h.y0); part(h.x0, h.x1, h.y1, top);
  } else b.add(mesh(bx(w, top - fy, 0.3), wall, cx, (top + fy) / 2, -3.75, { cast: false }));
  b.add(mesh(bx(w, 0.7, 0.35), M.woodDark, cx, fy + 0.35, -3.5, { cast: false }));
  if (o.floorMesh !== false) b.add(mesh(bx(w + 20, 0.4, 14), o.floorMat ? M[o.floorMat] : M.woodTable, cx, fy - 0.2, 0, { cast: false }));
  b.col(x0 - 10, fy - 4, w + 20, 4, 'wood');
}

export function wallCol(L, x, y0, y1, w = 0.6, mat2 = 'plaster') {
  L.b.col(x, y0, w, y1 - y0, mat2);
}

export function partition(L, x, y0, y1, w = 1, opts = {}) {
  const b = L.b, M = L.m;
  b.add(mesh(bx(w, y1 - y0, 8), M.paintDark, x + w / 2, (y0 + y1) / 2, -0.2, { cast: false }));
  b.add(mesh(bx(w + 0.4, 0.5, 8.2), M.woodDark, x + w / 2, y0 + 0.25, -0.2, { cast: false }));
  b.col(x, y0, w, y1 - y0, 'plaster');
}

export function door(L, x, y0, h, o = {}) {
  const b = L.b, M = L.m, gap = o.gap ?? 0.4;
  const frame = M.woodDark;
  b.add(mesh(bx(0.3, h + 0.5, 1.2), frame, x - 0.15, y0 + h / 2, -0.2));
  b.add(mesh(bx(0.3, h + 0.5, 1.2), frame, x + (o.w || 0.6) + 0.15, y0 + h / 2, -0.2));
  const g = new THREE.Group();
  g.position.set(x, y0 + gap, 0);
  const slab = mesh(rbox(o.w || 0.6, h - gap, 7, 0.05), o.mat ? M[o.mat] : M.ceramicCream, (o.w || 0.6) / 2, (h - gap) / 2, -0.2);
  g.add(slab);
  b.add(g, true);
  if (o.glow) {
    const glow = mesh(new THREE.PlaneGeometry(3.4, 0.9), new THREE.MeshBasicMaterial({ map: M.shadowBlob.map, color: '#ffd58f', transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }), x + (o.w || 0.6) / 2, y0 + 0.15, 0.6, { cast: false, receive: false });
    b.add(glow, true);
  }
  const col = o.noCol ? null : L.b.col(x, y0 + gap, o.w || 0.6, h - gap + 6, 'wood');
  return { g, col };
}

export function shelfBoard(L, x, y, w, o = {}) {
  const b = L.b, M = L.m;
  b.add(mesh(rbox(w, 0.28, o.d || 3.0, 0.04), o.mat ? M[o.mat] : M.woodBoard, x + w / 2, y - 0.14, o.z ?? -1.0));
  b.col(x, y - 0.28, w, 0.28, 'wood', { oneWay: !!o.oneWay });
}

export function upright(L, x, y0, y1, w = 0.4, o = {}) {
  const b = L.b, M = L.m;
  b.add(mesh(bx(w, y1 - y0, o.d || 3.2), o.mat ? M[o.mat] : M.woodDark, x + w / 2, (y0 + y1) / 2, o.z ?? -1.0));
  if (o.col !== false) b.col(x, y0, w, y1 - y0, 'wood');
}

export function crate(L, x, y, w, h) {
  const b = L.b, M = L.m;
  b.add(mesh(bx(w, h, 2.6), M.woodBoard, x + w / 2, y + h / 2, -0.4));
  for (let i = 0; i < 3; i++) b.add(mesh(bx(w + 0.04, 0.12, 2.64), M.woodDark, x + w / 2, y + (i + 0.5) * h / 3, -0.4, { cast: false }));
  b.col(x, y, w, h, 'wood');
}

export function sack(L, x, y, w, h, o = {}) {
  const b = L.b;
  const cloth = mat('sack', () => std({ color: '#d9c7a4', roughness: 1 }));
  const g = b.group(x + w / 2, y, o.z || 0, false);
  g.add(mesh(rbox(w, h * 0.85, o.d || 2.0, Math.min(w, h) * 0.3, 3), cloth, 0, h * 0.42, 0));
  g.add(mesh(new THREE.ConeGeometry(w * 0.32, h * 0.3, 10), cloth, 0, h * 0.95, 0));
  g.add(mesh(new THREE.TorusGeometry(w * 0.12, 0.03, 6, 12), mat('twine', () => std({ color: '#a7865a', roughness: 1 })), 0, h * 0.86, 0, { rx: Math.PI / 2 }));
  if (o.label) g.add(mesh(new THREE.PlaneGeometry(w * 0.6, h * 0.3), std({ map: T.label({ text: o.label, kicker: 'ORGANIC', sub: '1 kg', bg: '#efe3c8', fg: '#7a4b2a', size: 84, ty: 0.42, sy: 0.7, w: 512, h: Math.round(512 * (h * 0.3) / (w * 0.6)) }), roughness: 1 }), 0, h * 0.42, (o.d || 2.0) / 2 + 0.02, { cast: false }));
  if (o.col !== false) b.col(x, y, w, h * 0.85, 'cloth');
  return g;
}

export function tinCan(L, w, h, color = '#c0473a', text = 'Peas') {
  const g = new THREE.Group();
  const M = L.m, r = w / 2;
  g.add(mesh(new THREE.CylinderGeometry(r, r, h, 36, 1, true), M.steel, 0, h / 2, 0));
  g.add(labelWrap(r, h * 0.9, { text, kicker: 'GARDEN', sub: '400 g', bg: color, fg: '#fff6e6', size: 74, subSize: 34, ty: 0.4, sy: 0.7 }, h * 0.5));
  g.add(mesh(new THREE.TorusGeometry(r, 0.03, 6, 28), M.steel, 0, h, 0, { rx: Math.PI / 2 }));
  g.add(mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.06, 24), M.steel, 0, h + 0.02, 0));
  g.add(mesh(new THREE.CylinderGeometry(r, r, 0.06, 28), M.steel, 0, 0.03, 0));
  return g;
}

export function bulb(L, x, y, top, o = {}) {
  const b = L.b;
  const g = b.group(x, y, o.z ?? -0.6, true);
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, top - y, 6), mat('cord', () => std({ color: '#2a2420', roughness: 0.8 })), 0, (top - y) / 2 + 0.3, 0, { cast: false }));
  g.add(mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.35, 12), mat('socket', () => std({ color: '#3a332e', roughness: 0.5 })), 0, 0.3, 0));
  g.add(mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color: o.color || '#fff1cf' }), 0, 0, 0, { cast: false, sy: 1.2 }));
  const halo = mesh(new THREE.PlaneGeometry(o.halo || 5, o.halo || 5), new THREE.MeshBasicMaterial({ map: L.m.shadowBlob.map, color: o.glow || '#ffc77a', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }), 0, 0, 0.5, { cast: false, receive: false });
  g.add(halo);
  const l = new THREE.PointLight(o.light || '#ffcf8f', o.intensity ?? 16, o.dist ?? 12, 1.5);
  l.position.set(0, -0.3, 1.6);
  g.add(l);
  return { g, light: l, halo };
}

export function pipe(L, x, y0, y1, z = -2.6, horizontal = false) {
  const b = L.b, M = L.m;
  const len = Math.abs(y1 - y0);
  const p = mesh(new THREE.CylinderGeometry(0.16, 0.16, len, 12), M.copper, horizontal ? (y0 + y1) / 2 : x, horizontal ? x : (y0 + y1) / 2, z, { rz: horizontal ? Math.PI / 2 : 0 });
  b.add(p);
  return p;
}

export function bucket(L, x, y, w, h) {
  const b = L.b, M = L.m;
  const g = b.group(x + w / 2, y, 0, false);
  g.add(mesh(new THREE.CylinderGeometry(w / 2, w / 2 * 0.85, h, 28, 1, true), mat('zinc', () => std({ color: '#a9b0b4', metalness: 0.8, roughness: 0.45, side: THREE.DoubleSide })), 0, h / 2, 0));
  g.add(mesh(new THREE.TorusGeometry(w / 2, 0.06, 6, 28), M.steel, 0, h, 0, { rx: Math.PI / 2 }));
  g.add(mesh(new THREE.CylinderGeometry(w / 2 - 0.05, w / 2 - 0.05, 0.06, 28), M.water, 0, h - 0.4, 0, { cast: false }));
  L.b.col(x - 0.05, y, 0.12, h, 'metal');
  L.b.col(x + w - 0.07, y, 0.12, h, 'metal');
  return { waterY: y + h - 0.4 };
}

export function strainer(L, x, y, w, gap = 0.22) {
  const b = L.b, M = L.m;
  const n = Math.round(w / gap);
  const wire = new THREE.CylinderGeometry(0.025, 0.025, 2.0, 5);
  const inst = new THREE.InstancedMesh(wire, M.steel, n + 1);
  const o = new THREE.Object3D();
  for (let i = 0; i <= n; i++) { o.position.set(x + i * w / n, y - 0.05, -0.4); o.rotation.set(Math.PI / 2, 0, 0); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); }
  inst.castShadow = true;
  b.add(inst, true);
  b.add(mesh(new THREE.TorusGeometry(1.1, 0.07, 8, 40), M.steel, x + w / 2, y - 0.05, -0.4, { rx: Math.PI / 2, sx: w / 2.2 }), true);
  b.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), M.woodDark, x + w + 0.7, y - 0.05, -0.4, { rz: Math.PI / 2 }), true);
  b.col(x, y - 0.2, w, 0.2, 'grate', { grate: true, gap: w / n, gx0: x });
}

export function jarRow(L, x, y, n, z = -1.6, seed = 1) {
  const b = L.b, M = L.m;
  const fills = [M.jam, M.honey, M.pickle, M.toast, M.orange, M.lidRed];
  const lids = [M.lidRed, M.lidGold, M.lidGreen, M.iron];
  for (let i = 0; i < n; i++) {
    const r = 0.38 + ((i * 7 + seed) % 3) * 0.08, h = 1.0 + ((i * 5 + seed) % 4) * 0.3;
    const cx = x + i * 1.05;
    b.add(mesh(new THREE.CylinderGeometry(r, r, h, 18), M.glass, cx, y + h / 2, z, { cast: false }));
    b.add(mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, h * 0.75, 16), fills[(i + seed) % fills.length], cx, y + h * 0.38, z));
    b.add(mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.18, 16), lids[(i + seed) % lids.length], cx, y + h + 0.06, z));
  }
}

export function canRow(L, x, y, n, z = -1.4) {
  const b = L.b;
  const cols = ['#c0473a', '#3f6e8c', '#d8a23a', '#5b7f4a'];
  const names = ['Peas', 'Beans', 'Corn', 'Soup'];
  for (let i = 0; i < n; i++) {
    const g = tinCan(L, 0.8, 1.1, cols[i % 4], names[i % 4]);
    g.position.set(x + i * 0.95, y, z);
    b.add(g);
  }
}

export function onions(L, x, y, z = -1.2) {
  const b = L.b;
  const g = b.group(x, y, z, false);
  g.add(mesh(new THREE.CylinderGeometry(1.2, 0.9, 0.9, 20, 1, true), mat('wicker', () => std({ color: '#a8804f', roughness: 1, side: THREE.DoubleSide })), 0, 0.45, 0));
  const on = mat('onion', () => std({ color: '#b9773d', roughness: 0.6 }));
  for (let i = 0; i < 6; i++) g.add(mesh(new THREE.SphereGeometry(0.4, 12, 10), on, Math.cos(i * 1.1) * 0.55, 0.85 + (i % 2) * 0.2, Math.sin(i * 1.1) * 0.4, { sy: 0.9 }));
}

export function garlic(L, x, y, len = 3, z = -2.6) {
  const b = L.b;
  const g = b.group(x, y, z, false);
  const bulbM = mat('garlic', () => std({ color: '#efe6d6', roughness: 0.7 }));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 6), mat('twine', () => std({ color: '#a7865a', roughness: 1 })), 0, -len / 2, 0));
  for (let i = 0; i < 6; i++) g.add(mesh(new THREE.SphereGeometry(0.32, 10, 8), bulbM, (i % 2 ? 0.25 : -0.25), -0.4 - i * (len / 6.5), 0.1, { sy: 0.85 }));
}

export function broom(L, x, y, z = -2.2) {
  const b = L.b, M = L.m;
  const g = b.group(x, y, z, false);
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 11, 8), M.woodBoard, 0, 6.5, 0, { rz: 0.12 }));
  g.add(mesh(new THREE.ConeGeometry(0.9, 1.8, 14), mat('straw', () => std({ color: '#d7b46a', roughness: 1 })), -0.1, 0.9, 0));
}

export function radiator(L, x, y, w, h) {
  const b = L.b, M = L.m;
  const paintM = mat('radpaint', () => std({ color: '#f1ece2', roughness: 0.35, metalness: 0.2 }));
  const n = Math.round(w / 0.42);
  const fin = new THREE.BoxGeometry(0.3, h, 1.4);
  const inst = new THREE.InstancedMesh(fin, paintM, n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) { o.position.set(x + 0.2 + i * (w - 0.4) / (n - 1), y + h / 2, -0.4); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); }
  inst.castShadow = true;
  b.add(inst, true);
  b.add(mesh(bx(w, 0.18, 1.0), paintM, x + w / 2, y + h - 0.2, -0.4), true);
  b.add(mesh(bx(w, 0.18, 1.0), paintM, x + w / 2, y + 0.2, -0.4), true);
  for (const lx of [x + 0.3, x + w - 0.3]) b.add(mesh(bx(0.2, y, 0.3), paintM, lx, y / 2, -0.4), true);
  b.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 12), M.brass, x - 0.2, y + 0.6, -0.4, { rz: Math.PI / 2 }), true);
}

export function pianoBody(L, x, w, keysY, topY) {
  const b = L.b, M = L.m;
  const lacquer = mat('lacquer', () => std({ color: '#241812', roughness: 0.18, metalness: 0.1, envMapIntensity: 1.6 }));
  b.add(mesh(rbox(w, topY - keysY - 1.0, 2.0, 0.15), lacquer, x + w / 2, keysY + 1.0 + (topY - keysY - 1.0) / 2, -2.4));
  b.add(mesh(rbox(w + 0.4, 0.3, 2.6, 0.08), lacquer, x + w / 2, topY + 0.15, -2.2));
  b.add(mesh(rbox(w - 1.6, keysY - 0.6, 1.2, 0.12), lacquer, x + w / 2, (keysY - 0.6) / 2 + 0.3, -1.6, { cast: false }));
  b.add(mesh(rbox(w, 0.35, 3.2, 0.06), lacquer, x + w / 2, keysY - 0.68, -0.4));
  b.add(mesh(rbox(w - 1.2, 0.9, 0.2, 0.05), lacquer, x + w / 2, keysY + 0.55, -1.3));
  b.add(mesh(rbox(3.2, 2.2, 0.08, 0.05), std({ map: T.sheet(), roughness: 0.9 }), x + w / 2, keysY + 2.4, -1.25, { rx: -0.25 }));
  for (const px of [x + w / 2 - 0.6, x + w / 2 + 0.6]) b.add(mesh(rbox(0.5, 0.12, 0.9, 0.04), M.brass, px, 0.25, 0.6));
}

export function bookshelf(L, x, y0, w, h, shelves, o = {}) {
  const b = L.b, M = L.m;
  const wood = o.mat ? M[o.mat] : M.woodDark;
  b.add(mesh(bx(w, h, 0.25), wood, x + w / 2, y0 + h / 2, -2.6, { cast: false }));
  b.add(mesh(bx(0.4, h, 3.0), wood, x + 0.2, y0 + h / 2, -1.2));
  b.add(mesh(bx(0.4, h, 3.0), wood, x + w - 0.2, y0 + h / 2, -1.2));
  b.add(mesh(rbox(w + 0.3, 0.35, 3.2, 0.05), wood, x + w / 2, y0 + h - 0.17, -1.1));
  if (o.sides !== false) { b.col(x, y0, 0.4, h, 'wood'); b.col(x + w - 0.4, y0, 0.4, h, 'wood'); }
  b.col(x, y0 + h - 0.35, w, 0.35, 'wood', { oneWay: !!o.topOneWay });
  const spineCols = ['#7a3b2e', '#2f4a5e', '#c9a25a', '#4e6a42', '#8a6a4a', '#5a3e5c', '#d7c7a2'];
  const book = new THREE.BoxGeometry(1, 1, 1);
  const count = shelves.length * Math.floor((w - 1) / 0.42);
  const inst = new THREE.InstancedMesh(book, std({ roughness: 0.75 }), Math.max(1, count));
  const ob = new THREE.Object3D(), col = new THREE.Color();
  let k = 0;
  for (const sy of shelves) {
    b.add(mesh(bx(w - 0.8, 0.22, 2.8), wood, x + w / 2, sy - 0.11, -1.2));
    if (o.shelfCols !== false) b.col(x + 0.4, sy - 0.22, w - 0.8, 0.22, 'wood', { oneWay: !!o.oneWay });
    let bx2 = x + 0.55;
    while (bx2 < x + w - 0.8 && k < count) {
      const bw = 0.28 + ((k * 13) % 5) * 0.04, bh = 1.3 + ((k * 7) % 4) * 0.22;
      ob.position.set(bx2 + bw / 2, sy + bh / 2, -1.9 + ((k * 3) % 2) * 0.2);
      ob.scale.set(bw, bh, 1.4);
      ob.rotation.set(0, 0, (k % 9 === 4) ? 0.25 : 0);
      ob.updateMatrix();
      inst.setMatrixAt(k, ob.matrix);
      inst.setColorAt(k, col.set(spineCols[k % spineCols.length]));
      bx2 += bw + 0.03;
      k++;
    }
  }
  inst.count = k;
  inst.castShadow = true;
  b.add(inst, true);
}

export function bookStack(L, x, y, w, h, o = {}) {
  const b = L.b;
  const cols = ['#7a3b2e', '#2f4a5e', '#c9a25a', '#4e6a42', '#8a6a4a'];
  let yy = y, i = 0;
  while (yy < y + h - 0.05) {
    const t = Math.min(0.55 + (i % 3) * 0.15, y + h - yy);
    b.add(mesh(rbox(w - (i % 2) * 0.2, t, 2.2 - (i % 3) * 0.2, 0.03), mat('book' + i % 5, () => std({ color: cols[i % 5], roughness: 0.7 })), x + w / 2 + (i % 2 ? 0.1 : -0.05), yy + t / 2, o.z || 0));
    b.add(mesh(bx(w - (i % 2) * 0.2 - 0.1, t - 0.08, 0.04), mat('pages', () => std({ color: '#f1e9d6', roughness: 0.9 })), x + w / 2 + (i % 2 ? 0.1 : -0.05), yy + t / 2, (o.z || 0) + (2.2 - (i % 3) * 0.2) / 2, { cast: false }));
    yy += t; i++;
  }
  if (o.col !== false) b.col(x, y, w, h, 'wood');
}

export function bookGroup(L, w, h) {
  const g = new THREE.Group();
  const cover = std({ color: '#5a2e2a', roughness: 0.6 });
  g.add(mesh(rbox(w, h, 2.4, 0.06), cover, 0, h / 2, 0));
  g.add(mesh(bx(w - 0.15, h - 0.14, 2.3), std({ color: '#efe6d2', roughness: 0.9 }), 0.06, h / 2, 0));
  g.add(mesh(new THREE.PlaneGeometry(w * 0.7, h * 0.4), std({ map: T.label({ text: 'Dictionary', bg: '#5a2e2a', fg: '#e8c77a', size: 56 }), roughness: 0.6 }), 0, h / 2, 1.22, { cast: false }));
  return g;
}

export function sofa(L, x, w, o = {}) {
  const b = L.b;
  const fabric = mat('sofa', () => std({ color: o.color || '#6f7f8f', roughness: 0.95 }));
  const cushion = mat('cushion', () => std({ color: '#7d8d9c', roughness: 0.95 }));
  const seatY = o.seatY || 4.4, backY = o.backY || 9, armY = o.armY || 6.4;
  b.add(mesh(rbox(w, seatY - 1.2, 3.6, 0.3), fabric, x + w / 2, 0.8 + (seatY - 1.2) / 2, -0.8));
  b.add(mesh(rbox(w, backY - 0.8, 1.6, 0.5, 3), fabric, x + w / 2, 0.8 + (backY - 0.8) / 2, -2.6));
  for (const ax of [x + 0.9, x + w - 0.9]) b.add(mesh(rbox(1.8, armY - 0.8, 3.8, 0.6, 3), fabric, ax, 0.8 + (armY - 0.8) / 2, -0.7));
  for (const lx of [x + 0.6, x + w - 0.6]) b.add(mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.8, 8), L.m.woodDark, lx, 0.4, 0.8));
  const cushions = [];
  const nC = Math.max(1, Math.round((w - 3.6) / 3.2));
  const cw = (w - 3.6) / nC;
  for (let i = 0; i < nC; i++) {
    const cx = x + 1.8 + cw * (i + 0.5);
    const g = new THREE.Group();
    g.position.set(cx, seatY - 1.2, -0.2);
    g.add(mesh(rbox(cw - 0.1, 1.2, 3.0, 0.45, 3), cushion, 0, 0.6, 0));
    b.add(g, true);
    cushions.push(g);
    const W = L;
    b.col(cx - cw / 2, seatY - 0.6, cw, 0.6, 'cloth', { spring: true, springPower: o.power || [9, 13.6], onBounce: () => { g.userData.squash = 1; } });
  }
  b.col(x, 0, 1.8, armY, 'cloth');
  b.col(x + w - 1.8, 0, 1.8, armY, 'cloth');
  b.col(x + 1.8, 0, w - 3.6, seatY - 0.6, 'cloth');
  L.update((W, dt) => {
    for (const g of cushions) {
      const s = g.userData.squash || 0;
      g.scale.y = 1 - Math.sin(s * Math.PI) * 0.35;
      g.userData.squash = Math.max(0, s - dt * 3.5);
      if (s > 0.95) W.sfx('boing', g.position.x, g.position.y, 0.7);
    }
  });
}

export function rugFloor(L, x0, x1, y = 0) {
  const m = mat('rug', () => std({ map: T.rug(), roughness: 1 }));
  L.b.add(mesh(bx(x1 - x0, 0.06, 6), m, (x0 + x1) / 2, y + 0.03, -0.3, { cast: false }));
}

export function floorLamp(L, x, h, o = {}) {
  const b = L.b, M = L.m;
  const g = b.group(x, 0, o.z ?? -2.2, true);
  g.add(mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.2, 20), M.brass, 0, 0.1, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, h, 8), M.brass, 0, h / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.0, 1.6, 1.6, 24, 1, true), std({ color: '#f1e3c4', roughness: 0.9, side: THREE.DoubleSide, emissive: '#ffcf8a', emissiveIntensity: o.on === false ? 0 : 0.6 }), 0, h, 0));
  const l = new THREE.PointLight('#ffcf8f', o.on === false ? 0 : (o.intensity ?? 14), 14, 1.5);
  l.position.set(0, h - 0.4, 1.5);
  g.add(l);
  return { g, light: l };
}

export function bigPlant(L, x, y, z, s = 1.6) { return L.b.plant(x, y, z, s); }

export function frame(L, x, y, w, h, z = -3.55) { L.b.photo(x, y, z, w, h); }

export function chair(L, x, y0, o = {}) {
  const b = L.b, M = L.m;
  const wood = o.mat ? M[o.mat] : M.woodTable;
  const seatY = o.seatY || 4.6, backTop = o.backTop || 9.6, w = o.w || 3.0;
  b.add(mesh(rbox(w, 0.3, 3.0, 0.06), wood, x + w / 2, y0 + seatY - 0.15, -0.2));
  for (const lx of [x + 0.2, x + w - 0.2]) b.add(mesh(turnedLeg(seatY - 0.3, 0.14), wood, lx, y0, 0.9));
  const bx0 = o.backRight ? x + w - 0.35 : x;
  b.add(mesh(bx(0.35, backTop - seatY, 0.35), wood, bx0 + 0.175, y0 + seatY + (backTop - seatY) / 2, -1.4));
  for (let i = 0; i < 3; i++) b.add(mesh(bx(0.3, 0.3, 2.4), wood, bx0 + 0.175, y0 + seatY + 1.5 + i * 1.3, -0.4));
  b.col(x, y0 + seatY - 0.3, w, 0.3, 'wood');
  if (o.backFromFloor) { b.col(bx0, y0, 0.35, backTop, 'wood'); b.add(mesh(bx(0.35, seatY, 0.35), wood, bx0 + 0.175, y0 + seatY / 2, -1.4)); }
  else b.col(bx0, y0 + seatY, 0.35, backTop - seatY, 'wood');
  if (o.legsCol) for (const lx of [x + 0.1, x + w - 0.35]) b.col(lx, y0, 0.25, seatY - 0.3, 'wood');
}

export function diningTable(L, x, w, top, o = {}) {
  const b = L.b, M = L.m;
  b.add(mesh(rbox(w, 0.4, 6.5, 0.06), M.woodTable, x + w / 2, top - 0.2, -0.6));
  const clothM = M.cloth;
  b.add(mesh(bx(w + 0.2, 0.04, 6.7), clothM, x + w / 2, top + 0.02, -0.6, { cast: false }));
  b.add(mesh(new THREE.PlaneGeometry(w + 0.2, o.drop || 3.5), clothM, x + w / 2, top - (o.drop || 3.5) / 2, 2.76, { cast: false }));
  if (o.leftCloth) {
    const g = new THREE.Group();
    const drop = top - o.leftCloth;
    const geo = new THREE.PlaneGeometry(6.6, drop, 8, 10);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + Math.sin(p.getY(i) * 1.7) * 0.0);
    g.add(mesh(geo, clothM, -0.05, top - drop / 2, -0.6, { ry: Math.PI / 2 }));
    g.position.x = x;
    b.add(g);
    b.col(x - 0.12, o.leftCloth, 0.12, drop, 'soft');
  }
  for (const lx of [x + 0.8, x + w - 0.8]) b.add(mesh(turnedLeg(top - 0.4, 0.26), M.woodTable, lx, 0, 2.0));
  b.col(x, top - 0.42, w, 0.44, 'cloth');
}

export function sideboard(L, x, w, h) {
  const b = L.b, M = L.m;
  b.add(mesh(rbox(w, h - 0.8, 3.6, 0.08), M.woodDark, x + w / 2, 0.8 + (h - 0.8) / 2, -1.6));
  b.add(mesh(rbox(w + 0.3, 0.3, 3.9, 0.05), M.woodTable, x + w / 2, h - 0.15, -1.5));
  const n = Math.max(2, Math.round(w / 2.6));
  for (let i = 0; i < n; i++) {
    b.add(mesh(rbox(w / n - 0.2, h - 1.8, 0.12, 0.04), M.woodTable, x + (i + 0.5) * w / n, 0.8 + (h - 1.8) / 2 + 0.2, 0.25, { cast: false }));
    b.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), M.brass, x + (i + 0.5) * w / n + (i % 2 ? -1 : 1) * (w / n / 2 - 0.4), h * 0.6, 0.4));
  }
  b.col(x, 0, w, h, 'wood');
}

export function candles(L, x, y, z = -1.2) {
  const b = L.b, M = L.m;
  const wax = mat('wax', () => std({ color: '#f3ead6', roughness: 0.6 }));
  b.add(mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 20), M.brass, x, y + 0.15, z));
  b.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.6, 8), M.brass, x, y + 1.0, z));
  for (const dx of [-0.9, 0, 0.9]) {
    b.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.4, 12), wax, x + dx, y + 2.4, z));
    b.add(mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 12), M.brass, x + dx, y + 1.7, z));
  }
  b.add(mesh(bx(1.9, 0.08, 0.08), M.brass, x, y + 1.7, z));
}

export function vase(L, x, y, h, z = -1.6) {
  const b = L.b, M = L.m;
  const g = b.group(x, y, z, false);
  const pts = [[0, 0], [0.6, 0], [0.8, h * 0.3], [0.5, h * 0.8], [0.6, h], [0, h]].map((p) => new THREE.Vector2(p[0], p[1]));
  g.add(mesh(new THREE.LatheGeometry(pts, 24), M.ceramicBlue, 0, 0, 0));
  const petal = mat('petal', () => std({ color: '#e8b4b8', roughness: 0.7 }));
  for (let i = 0; i < 5; i++) {
    const a = i * 1.26;
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 5), M.leaf, Math.cos(a) * 0.3, h + 1.0, Math.sin(a) * 0.2, { rz: Math.cos(a) * 0.3 }));
    g.add(mesh(new THREE.SphereGeometry(0.45, 12, 10), petal, Math.cos(a) * 0.65, h + 2.2, Math.sin(a) * 0.3));
  }
}

export function plateRail(L, x, y, w, o = {}) {
  const b = L.b, M = L.m;
  b.add(mesh(rbox(w, 0.3, 2.4, 0.05), M.woodTable, x + w / 2, y - 0.15, -1.6));
  b.add(mesh(bx(w, 0.12, 0.12), M.woodDark, x + w / 2, y + 0.35, -2.6));
  for (let i = 0; i < Math.floor(w / 2.2); i++) b.add(mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 28), i % 2 ? M.ceramicBlue : M.ceramic, x + 1.2 + i * 2.2, y + 1.0, -2.75, { rx: Math.PI / 2 - 0.15 }));
  b.col(x, y - 0.3, w, 0.3, 'wood', { oneWay: !!o.oneWay });
}

export function curtainGroup(L, w, h) {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(w, h, 10, 12);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 4.2) * 0.18);
  geo.computeVertexNormals();
  g.add(mesh(geo, mat('curtain', () => std({ color: '#b8584a', roughness: 0.95, side: THREE.DoubleSide })), 0, -h / 2, 0));
  return g;
}

export function desk(L, x, w, top, o = {}) {
  const b = L.b, M = L.m;
  b.add(mesh(rbox(w, 0.45, 4.6, 0.06), M.woodTable, x + w / 2, top - 0.22, -1.0));
  const pw = o.pedestal || 5;
  b.add(mesh(bx(pw, top - 0.45, 4.2), M.woodTable, x + pw / 2, (top - 0.45) / 2, -1.0));
  for (let i = 0; i < 3; i++) {
    b.add(mesh(rbox(pw - 0.4, (top - 1.2) / 3 - 0.2, 0.15, 0.04), M.woodDark, x + pw / 2, 0.6 + (i + 0.5) * (top - 1.2) / 3, 1.15, { cast: false }));
    b.add(mesh(rbox(1.2, 0.16, 0.18, 0.06), M.brass, x + pw / 2, 0.6 + (i + 0.5) * (top - 1.2) / 3, 1.3));
  }
  b.add(mesh(bx(0.5, top - 0.45, 0.5), M.woodTable, x + w - 0.4, (top - 0.45) / 2, 1.2));
  b.add(mesh(bx(0.5, top - 0.45, 0.5), M.woodTable, x + w - 0.4, (top - 0.45) / 2, -2.8));
  b.col(x, 0, pw, top, 'wood');
  b.col(x, top - 0.45, w, 0.45, 'wood');
  b.col(x + w - 0.65, 0, 0.5, top - 0.45, 'wood');
}

export function basket(L, x, y, w, h) {
  const b = L.b;
  const wick = mat('wicker2', () => std({ color: '#b18a58', roughness: 1 }));
  b.add(mesh(new THREE.CylinderGeometry(w / 2, w / 2 * 0.82, h, 24, 1, true), mat('wickerOpen', () => std({ color: '#b18a58', roughness: 1, side: THREE.DoubleSide })), x + w / 2, y + h / 2, -0.2));
  for (let i = 0; i < 6; i++) b.add(mesh(new THREE.TorusGeometry(w / 2 * (0.84 + i * 0.03), 0.04, 5, 28), wick, x + w / 2, y + 0.3 + i * (h - 0.4) / 5, -0.2, { rx: Math.PI / 2, cast: false }));
  for (let i = 0; i < 3; i++) b.add(mesh(new THREE.SphereGeometry(0.4, 8, 6), mat('paperball', () => std({ color: '#f1ece2', roughness: 0.95, flatShading: true })), x + w / 2 + (i - 1) * 0.5, y + h - 0.1, -0.2));
  b.col(x, y, w, h, 'soft');
}

export function stapler(L, x, y, w = 2.2) {
  const b = L.b;
  const red = mat('stapler', () => std({ color: '#b3423a', roughness: 0.35 }));
  const g = new THREE.Group();
  g.position.set(x + w / 2, y, 0);
  g.add(mesh(rbox(w, 0.25, 0.9, 0.08), mat('staplerBase', () => std({ color: '#2b2a29', roughness: 0.5 })), 0, 0.12, 0));
  const top = mesh(rbox(w * 0.95, 0.35, 0.8, 0.14), red, 0, 0.45, 0);
  g.add(top);
  b.add(g, true);
  b.col(x, y, w, 0.62, 'metal', { spring: true, springPower: [10, 17], onBounce: () => { g.userData.squash = 1; } });
  L.update((W, dt) => {
    const s = g.userData.squash || 0;
    top.position.y = 0.45 - Math.sin(s * Math.PI) * 0.2;
    g.userData.squash = Math.max(0, s - dt * 4);
    if (s > 0.95) W.sfx('clink', x + w / 2, y, 0.8);
  });
}

export function deskLamp(L, x, y, z = -1.8) {
  const b = L.b, M = L.m;
  const g = b.group(x, y, z, true);
  const green = mat('lampgreen', () => std({ color: '#2f5a43', roughness: 0.3, metalness: 0.4 }));
  g.add(mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.25, 24), M.brass, 0, 0.12, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4, 8), M.brass, 0, 1.9, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.5, 1.5, 1.0, 24, 1, true), green, 0.6, 3.6, 0, { rz: -0.2 }));
  const l = new THREE.PointLight('#ffd49a', 10, 10, 1.6);
  l.position.set(0.8, 2.8, 1.4);
  g.add(l);
  return { g, light: l };
}

export function sinkBasin(L, x, w, top, depth, o = {}) {
  const b = L.b, M = L.m;
  b.add(mesh(bx(w, depth, 0.2), M.steel, x + w / 2, top - depth / 2, -2.6, { cast: false }));
  b.add(mesh(bx(w, 0.2, 4.4), M.steel, x + w / 2, top - depth, -0.4, { cast: false }));
  b.add(mesh(bx(0.15, depth, 4.4), M.steel, x + 0.07, top - depth / 2, -0.4));
  b.add(mesh(bx(0.15, depth, 4.4), M.steel, x + w - 0.07, top - depth / 2, -0.4));
  const wY = top - depth + (o.water ?? depth * 0.6);
  const water = mesh(bx(w - 0.3, 0.12, 4.2), M.water, x + w / 2, wY, -0.4, { cast: false });
  b.add(water, true);
  if (o.suds !== false) {
    const suds = mat('suds', () => std({ color: '#ffffff', roughness: 0.6, transparent: true, opacity: 0.85 }));
    for (let i = 0; i < Math.floor(w / 0.6); i++) b.add(mesh(new THREE.SphereGeometry(0.22 + (i % 3) * 0.1, 10, 8), suds, x + 0.4 + i * 0.6, wY + 0.05, -1.6 + (i % 4) * 0.5, { sy: 0.6, cast: false }), true);
  }
  b.col(x - 0.01, top - depth - 1, 0.16, depth + 1, 'metal');
  b.col(x + w - 0.15, top - depth - 1, 0.16, depth + 1, 'metal');
  b.col(x, top - depth - 1, w, 1, 'metal');
  L.water(x + 0.15, x + w - 0.15, wY);
  return { water, wY };
}

export function faucet(L, x, top, z = -2.8) {
  const b = L.b, M = L.m;
  const f = b.group(x, top, z, false);
  f.add(mesh(new THREE.CylinderGeometry(0.2, 0.26, 4.4, 14), M.chrome, 0, 2.2, 0));
  f.add(mesh(new THREE.TorusGeometry(1.0, 0.16, 10, 20, Math.PI), M.chrome, 1.0, 4.4, 0));
  f.add(mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.5, 12), M.chrome, 2.0, 4.15, 0));
}

export function soapBottle(L) {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  const pts = [[0, 0], [0.7, 0], [0.75, 0.2], [0.75, 4.0], [0.4, 4.6], [0.25, 4.8], [0, 4.8]].map((p) => new THREE.Vector2(p[0], p[1]));
  inner.add(mesh(new THREE.LatheGeometry(pts, 24), std({ color: '#7fc4b8', roughness: 0.15, transparent: true, opacity: 0.85 }), 0, 0, 0));
  inner.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 12), std({ color: '#f4f4f0', roughness: 0.4 }), 0, 5.2, 0));
  inner.add(mesh(new THREE.PlaneGeometry(1.2, 1.6), std({ map: T.label({ text: 'Suds', sub: 'lemon', bg: '#e9f5f1', fg: '#2b6f62', size: 80 }), roughness: 0.4 }), 0, 2.2, 0.77, { cast: false }));
  inner.position.set(-0.75, 0, 0);
  g.add(inner);
  return g;
}

export function teaTowel(L, x, y, w, h, z = 0.8) {
  const b = L.b, M = L.m;
  const g = b.group(x, y, z, false);
  const geo = new THREE.PlaneGeometry(w, h, 6, 10);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 2.2) * 0.1);
  geo.computeVertexNormals();
  g.add(mesh(geo, M.towel, 0, -h / 2, 0));
  return g;
}

export function oven(L, x, w, top, o = {}) {
  const b = L.b, M = L.m;
  b.add(mesh(bx(w, top - 0.4, 4.6), M.steel, x + w / 2, (top - 0.4) / 2 + 0.2, -0.9));
  const door = mesh(rbox(w - 0.6, top * 0.55, 0.25, 0.08), M.dark, x + w / 2, top * 0.38, 1.45);
  b.add(door);
  b.add(mesh(rbox(w - 1.2, 0.18, 0.25, 0.08), M.chrome, x + w / 2, top * 0.7, 1.6));
  const glow = mesh(new THREE.PlaneGeometry(w - 1.4, top * 0.4), new THREE.MeshBasicMaterial({ color: o.glow || '#ff9a4a', transparent: true, opacity: o.on ? 0.5 : 0.0, depthWrite: false, blending: THREE.AdditiveBlending }), x + w / 2, top * 0.38, 1.6, { cast: false, receive: false });
  b.add(glow, true);
  const clock = mesh(new THREE.PlaneGeometry(1.2, 0.4), new THREE.MeshBasicMaterial({ map: T.label({ text: '22:41', bg: '#06100b', fg: '#7dffb2', size: 140, font: 'ui-monospace, Menlo, monospace', weight: 500, w: 256, h: 96, ty: 0.55 }), toneMapped: false }), x + w / 2, top - 0.9, 1.5, { cast: false, receive: false });
  b.add(clock, true);
  b.col(x, 0, w, top, 'metal');
  return { glow };
}

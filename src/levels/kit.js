// Level kit: shared kitchen set dressing and small prop builders used by every chapter.
import * as THREE from 'three';
import { mesh, rbox, bx } from '../props.js';

export function shadowCaster(L, x, y, w, h, z = 2.6) {
  const mat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const m = mesh(new THREE.PlaneGeometry(w, h), mat, x + w / 2, y + h / 2, z, { receive: false });
  m.userData.keep = true;
  m.castShadow = true;
  L.b.add(m, true);
  return m;
}

export function backdrop(L, x0, x1, o = {}) {
  const b = L.b;
  b.backWall(x0, x1, o.tileBottom ?? 9, o.top ?? 26, -3.6, o.tileTop ?? 14.5);
  if (o.floor !== false) b.floor(x0 - 10, x1 + 10, 0);
  const trim = mesh(bx(x1 - x0, 0.3, 0.3), L.m.woodDark, (x0 + x1) / 2, o.top ?? 26, -3.3, { cast: false });
  b.add(trim);
}

export function eggCarton(L, x, y, w, h) {
  const b = L.b, M = L.m;
  const card = new THREE.MeshStandardMaterial({ color: '#c9bba3', roughness: 0.95 });
  const gr = b.group(x + w / 2, y, 0, false);
  gr.add(mesh(rbox(w, h * 0.7, 1.6, 0.06), card, 0, h * 0.35, 0));
  const egg = new THREE.SphereGeometry(0.26, 14, 10);
  const eggM = new THREE.MeshStandardMaterial({ color: '#f1e6d2', roughness: 0.55 });
  const n = Math.max(2, Math.floor(w / 0.55));
  for (let i = 0; i < n; i++) for (const z of [-0.4, 0.4]) gr.add(mesh(egg, eggM, -w / 2 + 0.3 + i * (w - 0.6) / (n - 1), h * 0.72, z, { sy: 1.25 }));
  b.col(x, y, w, h * 0.92, 'plastic');
  return gr;
}

export function icePack(L, x, y, w, h) {
  const b = L.b;
  const m = new THREE.MeshStandardMaterial({ color: '#6fb4e6', roughness: 0.25, transparent: true, opacity: 0.9 });
  b.add(mesh(rbox(w, h, 1.4, h * 0.45), m, x + w / 2, y + h / 2, 0));
  b.col(x, y, w, h, 'plastic');
}

export function bottle(L, x, y, z, h, color, capCol = '#c79c48') {
  const b = L.b;
  const gr = b.group(x, y, z, false);
  const glass = new THREE.MeshStandardMaterial({ color, roughness: 0.08, transparent: true, opacity: 0.55, depthWrite: false });
  const pts = [[0, 0], [0.42, 0], [0.45, 0.1], [0.45, h * 0.6], [0.2, h * 0.8], [0.16, h], [0, h]].map((p) => new THREE.Vector2(p[0], p[1]));
  gr.add(mesh(new THREE.LatheGeometry(pts, 18), glass, 0, 0, 0, { cast: false }));
  gr.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.22, 12), new THREE.MeshStandardMaterial({ color: capCol, roughness: 0.4 }), 0, h + 0.08, 0));
  return gr;
}

export function lettuce(L, x, y, z, s = 1) {
  const b = L.b;
  const gr = b.group(x, y, z, false);
  const m = new THREE.MeshStandardMaterial({ color: '#86b25a', roughness: 0.75 });
  for (let i = 0; i < 9; i++) gr.add(mesh(new THREE.SphereGeometry(0.6 * s, 12, 8), m, Math.cos(i * 2.3) * 0.35 * s, 0.55 * s + (i % 3) * 0.12 * s, Math.sin(i * 2.3) * 0.3 * s, { sy: 0.7, rz: i }));
  return gr;
}

export function carrot(L, x, y, z, rot = 0) {
  const b = L.b;
  const gr = b.group(x, y, z, false);
  const m = new THREE.MeshStandardMaterial({ color: '#e07a2b', roughness: 0.6 });
  gr.add(mesh(new THREE.ConeGeometry(0.2, 2.2, 12), m, 0, 0, 0, { rz: Math.PI / 2 + rot }));
  gr.add(mesh(new THREE.ConeGeometry(0.12, 0.6, 6), L.m.leaf, -1.2, 0.05, 0, { rz: -Math.PI / 2 }));
  return gr;
}

export function hutch(L, x, y, w, h) {
  const b = L.b, M = L.m;
  b.add(mesh(bx(w, h, 0.3), M.woodDark, x + w / 2, y + h / 2, -3.0, { cast: false }));
  for (const sx of [x + 0.2, x + w - 0.2]) b.add(mesh(rbox(0.4, h, 3.4, 0.05), M.woodDark, sx, y + h / 2, -1.3));
  b.add(mesh(rbox(w, 0.4, 3.4, 0.05), M.woodDark, x + w / 2, y + 0.2, -1.3));
  b.add(mesh(rbox(w + 0.3, 0.32, 3.6, 0.05), M.woodBoard, x + w / 2, y + h - 0.16, -1.2));
  const rows = Math.max(1, Math.floor(h / 2.1));
  for (let r = 0; r < rows; r++) {
    const ry = y + 0.4 + r * (h - 0.7) / rows;
    if (r > 0) b.add(mesh(bx(w - 0.6, 0.14, 3.0), M.woodBoard, x + w / 2, ry, -1.4));
    const n = Math.floor((w - 1.2) / 0.62);
    for (let i = 0; i < n; i++) {
      const pm = (i + r) % 4 === 0 ? M.ceramicBlue : (i + r) % 4 === 2 ? M.ceramicCream : M.ceramic;
      b.add(mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.07, 28), pm, x + 0.75 + i * 0.62, ry + 0.82, -2.55, { rx: Math.PI / 2 - 0.16 }));
    }
    if (r % 2 === 1) for (let i = 0; i < 3; i++) b.add(mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.85, 18), i === 1 ? M.ceramicSage : M.ceramicCream, x + 1.2 + i * 1.6, ry + 0.5, -1.2));
    else for (let i = 0; i < 2; i++) b.add(mesh(new THREE.CylinderGeometry(0.55, 0.5, 0.5, 20), M.ceramicBlue, x + w - 1.3 - i * 1.4, ry + 0.32, -1.0));
  }
  b.add(mesh(bx(w - 0.4, h - 0.7, 0.04), new THREE.MeshStandardMaterial({ color: '#e8f0ee', roughness: 0.04, transparent: true, opacity: 0.12, depthWrite: false, envMapIntensity: 2.5 }), x + w / 2, y + h / 2, 0.42, { cast: false }));
  b.add(mesh(bx(0.12, h - 0.6, 0.12), M.woodDark, x + w / 2, y + h / 2, 0.42));
  b.col(x, y, w, h, 'wood');
}

export function wallShelf(L, x, y, w, o = {}) {
  const b = L.b, M = L.m;
  b.add(mesh(rbox(w, 0.28, 2.2, 0.05), M.woodBoard, x + w / 2, y - 0.14, -0.6));
  for (const bx2 of [x + 0.6, x + w - 0.6]) b.add(mesh(rbox(0.18, 0.9, 0.2, 0.04), M.brass, bx2, y - 0.65, -1.6));
  b.col(x, y - 0.28, w, 0.28, 'wood', { oneWay: o.oneWay !== false });
}

export function wireRack(L, x, y, w) {
  const b = L.b, M = L.m;
  const n = Math.round(w / 0.26);
  const g = new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6);
  const inst = new THREE.InstancedMesh(g, M.chrome, n + 1);
  const o = new THREE.Object3D();
  for (let i = 0; i <= n; i++) { o.position.set(x + i * w / n, y - 0.06, -0.6); o.rotation.set(Math.PI / 2, 0, 0); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); }
  inst.castShadow = true;
  b.add(inst, true);
  b.add(mesh(bx(w, 0.05, 0.05), M.chrome, x + w / 2, y - 0.06, 0.5), true);
  b.add(mesh(bx(w, 0.05, 0.05), M.chrome, x + w / 2, y - 0.06, -1.7), true);
  b.add(mesh(bx(0.05, 0.05, 2.2), M.chrome, x, y - 0.06, -0.6), true);
  b.add(mesh(bx(0.05, 0.05, 2.2), M.chrome, x + w, y - 0.06, -0.6), true);
  const plate = mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 28), M.ceramic, x + w * 0.5, y + 0.7, -1.4, { rx: Math.PI / 2 - 0.2 });
  b.add(plate, true);
  b.col(x, y - 0.2, w, 0.2, 'grate', { grate: true, gap: w / n, gx0: x });
}

export function iceCubes(L, x0, x1, y) {
  const b = L.b;
  for (let i = 0; i < 9; i++) {
    const x = x0 + (i * 0.73 + (i % 3) * 0.21) % (x1 - x0);
    const z = (i % 2 ? 1 : -1) * (0.8 + (i % 3) * 0.35);
    const s = 0.45 + (i % 4) * 0.08;
    b.add(mesh(rbox(s, s, s, 0.1), L.m.ice, x, y + s / 2, z, { ry: i * 0.7, rz: (i % 3) * 0.1 }), true);
  }
  const tray = new THREE.MeshStandardMaterial({ color: '#cfe6f4', roughness: 0.3, transparent: true, opacity: 0.85 });
  b.add(mesh(rbox(2.6, 0.35, 1.2, 0.06), tray, x0 + 0.6, y + 0.5, -1.9, { rz: 0.35 }));
}

export function soapRack(L, x, y, w) {
  const b = L.b, M = L.m;
  b.add(mesh(rbox(w, 0.12, 1.4, 0.04), M.chrome, x + w / 2, y - 0.06, -0.4));
  b.add(mesh(rbox(w * 0.7, 0.32, 0.9, 0.12), new THREE.MeshStandardMaterial({ color: '#e9d7c0', roughness: 0.4 }), x + w / 2, y + 0.16, -0.4));
  b.col(x, y - 0.25, w, 0.25, 'metal');
}

export function slotTray(L, x, y, w) {
  const b = L.b, M = L.m;
  const tray = new THREE.MeshStandardMaterial({ color: '#b98d5d', roughness: 0.7 });
  b.add(mesh(rbox(w, 0.16, 3.6, 0.05), tray, x + w / 2, y + 0.08, -0.6));
  b.col(x, y, w, 0.16, 'wood');
  const dent = new THREE.MeshStandardMaterial({ color: '#6e4f31', roughness: 0.9 });
  const forkShape = new THREE.Shape();
  forkShape.moveTo(-0.16, 0); forkShape.lineTo(0.16, 0); forkShape.lineTo(0.12, 1.1); forkShape.lineTo(0.22, 1.5); forkShape.lineTo(0.22, 1.95); forkShape.lineTo(-0.22, 1.95); forkShape.lineTo(-0.22, 1.5); forkShape.lineTo(-0.12, 1.1); forkShape.closePath();
  const knifeShape = new THREE.Shape();
  knifeShape.moveTo(-0.13, 0); knifeShape.lineTo(0.13, 0); knifeShape.lineTo(0.16, 1.0); knifeShape.lineTo(0.16, 1.8); knifeShape.quadraticCurveTo(0.14, 2.15, -0.12, 2.2); knifeShape.lineTo(-0.13, 1.0); knifeShape.closePath();
  const f = mesh(new THREE.ShapeGeometry(forkShape), dent, x + w * 0.3, y + 0.17, 0.2, { rx: -Math.PI / 2, cast: false });
  f.rotation.z = Math.PI / 2;
  const k = mesh(new THREE.ShapeGeometry(knifeShape), dent, x + w * 0.7, y + 0.17, 0.2, { rx: -Math.PI / 2, cast: false });
  k.rotation.z = Math.PI / 2;
  f.position.x -= 1.0; k.position.x -= 1.1;
  b.add(f); b.add(k);
  for (let i = 0; i < 3; i++) {
    const sp = mesh(rbox(0.3, 0.06, 1.6, 0.03), M.metal, x + w * 0.5 + (i - 1) * 0.5, y + 0.2, -1.6);
    b.add(sp);
  }
}

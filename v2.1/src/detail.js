// Material detail: relief and roughness variation derived from each texture, plus smudges and micro relief on plain surfaces.
import * as THREE from 'three';

const derived = new Map();
let micro = null;

function dataTex(c, src) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = src ? src.wrapS : THREE.RepeatWrapping;
  t.wrapT = src ? src.wrapT : THREE.RepeatWrapping;
  if (src) { t.repeat.copy(src.repeat); t.offset.copy(src.offset); t.rotation = src.rotation; t.center.copy(src.center); }
  t.anisotropy = 4;
  return t;
}

function derive(map) {
  if (derived.has(map.uuid)) return derived.get(map.uuid);
  const img = map.image;
  const w = Math.min(1024, img.width || 0), h = Math.min(1024, img.height || 0);
  if (!w || !h) { derived.set(map.uuid, null); return null; }
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  const src = g.getImageData(0, 0, w, h).data;
  const n = w * h, lum = new Float32Array(n);
  let mean = 0;
  for (let i = 0; i < n; i++) { const l = src[i * 4] * 0.2126 + src[i * 4 + 1] * 0.7152 + src[i * 4 + 2] * 0.0722; lum[i] = l; mean += l; }
  mean /= n;
  let vr = 0;
  for (let i = 0; i < n; i++) vr += (lum[i] - mean) ** 2;
  const sd = Math.sqrt(vr / n) || 1;
  const hc = document.createElement('canvas'), rc = document.createElement('canvas');
  hc.width = rc.width = w; hc.height = rc.height = h;
  const hg = hc.getContext('2d'), rg = rc.getContext('2d');
  const hd = hg.createImageData(w, h), rd = rg.createImageData(w, h);
  for (let i = 0; i < n; i++) {
    const z = (lum[i] - mean) / sd;
    const hv = Math.max(0, Math.min(255, 128 + z * 34));
    const rv = Math.max(0, Math.min(255, 238 - z * 18));
    hd.data[i * 4] = hd.data[i * 4 + 1] = hd.data[i * 4 + 2] = hv; hd.data[i * 4 + 3] = 255;
    rd.data[i * 4] = rd.data[i * 4 + 1] = rd.data[i * 4 + 2] = rv; rd.data[i * 4 + 3] = 255;
  }
  hg.putImageData(hd, 0, 0);
  rg.putImageData(rd, 0, 0);
  const out = { bump: dataTex(hc, map), rough: dataTex(rc, map) };
  derived.set(map.uuid, out);
  return out;
}

function microTex() {
  if (micro) return micro;
  const S = 512;
  const hc = document.createElement('canvas'), rc = document.createElement('canvas');
  hc.width = rc.width = hc.height = rc.height = S;
  const hg = hc.getContext('2d'), rg = rc.getContext('2d');
  const hd = hg.createImageData(S, S), rd = rg.createImageData(S, S);
  let s = 12345;
  const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; };
  const grid = (N) => { const a = new Float32Array(N * N); for (let i = 0; i < a.length; i++) a[i] = rnd(); return a; };
  const g8 = grid(8), g32 = grid(32), g128 = grid(128);
  const samp = (a, N, x, y) => {
    const fx = x * N, fy = y * N, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const at = (i, j) => a[((j + N) % N) * N + ((i + N) % N)];
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    return (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S, i = (y * S + x) * 4;
    const smudge = samp(g8, 8, u, v) * 0.6 + samp(g32, 32, u, v) * 0.4;
    const fine = samp(g128, 128, u, v);
    const hv = 128 + (fine - 0.5) * 70 + (smudge - 0.5) * 30;
    const rv = 232 + (smudge - 0.5) * 60 + (fine - 0.5) * 14;
    hd.data[i] = hd.data[i + 1] = hd.data[i + 2] = Math.max(0, Math.min(255, hv)); hd.data[i + 3] = 255;
    rd.data[i] = rd.data[i + 1] = rd.data[i + 2] = Math.max(0, Math.min(255, rv)); rd.data[i + 3] = 255;
  }
  hg.putImageData(hd, 0, 0);
  rg.putImageData(rd, 0, 0);
  micro = { bump: dataTex(hc), rough: dataTex(rc) };
  return micro;
}

function apply(m, on) {
  if (!m || !m.isMeshStandardMaterial || m.transparent || m.userData.noDetail) return;
  const u = m.userData;
  if (on && !u.det) {
    u.det = { bumpMap: m.bumpMap, bumpScale: m.bumpScale, roughnessMap: m.roughnessMap };
    if (m.map && m.map.image && !m.bumpMap) {
      const d = derive(m.map);
      if (d) { m.bumpMap = d.bump; m.bumpScale = u.bumpK ?? 1.1; m.roughnessMap = d.rough; }
    } else if (m.map && m.bumpMap) {
      const d = derive(m.map);
      if (d) m.roughnessMap = d.rough;
    } else if (!m.map && !m.bumpMap) {
      const t = microTex();
      m.bumpMap = t.bump; m.bumpScale = m.metalness > 0.5 ? 0.12 : 0.3; m.roughnessMap = t.rough;
    }
    m.needsUpdate = true;
  } else if (!on && u.det) {
    m.bumpMap = u.det.bumpMap; m.bumpScale = u.det.bumpScale; m.roughnessMap = u.det.roughnessMap;
    delete u.det;
    m.needsUpdate = true;
  }
}

export function setDetail(root, on) {
  const seen = new Set();
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) { if (!seen.has(m)) { seen.add(m); apply(m, on); } }
  });
}

// Procedural canvas textures for the kitchen: tiles, wood, stone, bread, cheese, labels, cloth, sky.
import * as THREE from 'three';

const cache = new Map();

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}

function makeNoise(seed) {
  const r = rng(seed);
  const N = 256, p = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) p[i] = r();
  const sm = (t) => t * t * (3 - 2 * t);
  const v = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = p[((yi & 255) * N) + (xi & 255)], b = p[((yi & 255) * N) + ((xi + 1) & 255)];
    const c = p[(((yi + 1) & 255) * N) + (xi & 255)], d = p[(((yi + 1) & 255) * N) + ((xi + 1) & 255)];
    const u = sm(xf), w = sm(yf);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  return (x, y, oct = 4) => { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += v(x * f, y * f) * a; n += a; a *= 0.5; f *= 2; } return s / n; };
}

function tex(c, opts = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

function memo(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

export function tiles(base = '#f1ebe0', grout = '#c9bfae') {
  return memo('tiles' + base, () => {
    const W = 1024, H = 1024, cols = 4, rows = 8, tw = W / cols, th = H / rows;
    const [c, g] = canvas(W, H);
    const [b, bg] = canvas(W, H);
    const n = makeNoise(7);
    const r = rng(11);
    g.fillStyle = grout; g.fillRect(0, 0, W, H);
    bg.fillStyle = '#000'; bg.fillRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) {
      for (let x = -1; x < cols + 1; x++) {
        const ox = x * tw + (y % 2 ? tw / 2 : 0), oy = y * th, gap = 7;
        const k = 0.94 + r() * 0.08;
        const col = new THREE.Color(base).multiplyScalar(k);
        const grd = g.createLinearGradient(ox, oy, ox, oy + th);
        grd.addColorStop(0, '#' + col.clone().offsetHSL(0, 0, 0.035).getHexString());
        grd.addColorStop(0.5, '#' + col.getHexString());
        grd.addColorStop(1, '#' + col.clone().offsetHSL(0, 0, -0.04).getHexString());
        g.fillStyle = grd;
        roundRect(g, ox + gap / 2, oy + gap / 2, tw - gap, th - gap, 10); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(ox + 12, oy + gap / 2 + 3); g.lineTo(ox + tw - 14, oy + gap / 2 + 3); g.stroke();
        const bgd = bg.createRadialGradient(ox + tw / 2, oy + th / 2, 10, ox + tw / 2, oy + th / 2, tw * 0.55);
        bgd.addColorStop(0, '#fff'); bgd.addColorStop(0.85, '#e8e8e8'); bgd.addColorStop(1, '#777');
        bg.fillStyle = bgd; roundRect(bg, ox + gap / 2, oy + gap / 2, tw - gap, th - gap, 12); bg.fill();
      }
    }
    const id = g.getImageData(0, 0, W, H), d = id.data;
    for (let i = 0; i < W * H; i++) {
      const x = i % W, y = (i / W) | 0;
      const v = (n(x / 90, y / 90, 3) - 0.5) * 10;
      d[i * 4] += v; d[i * 4 + 1] += v; d[i * 4 + 2] += v;
    }
    g.putImageData(id, 0, 0);
    return { map: tex(c), bump: tex(b, { data: true }) };
  });
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}

export function wood(light = '#c58f5c', dark = '#8a5a34', seed = 3, planks = 0) {
  return memo('wood' + light + dark + seed + planks, () => {
    const W = 1024, H = 512;
    const [c, g] = canvas(W, H);
    const n = makeNoise(seed);
    const id = g.createImageData(W, H), d = id.data;
    const L = new THREE.Color(light), D = new THREE.Color(dark);
    const pw = planks ? H / planks : H;
    for (let y = 0; y < H; y++) {
      const pi = Math.floor(y / pw);
      const off = pi * 37.1;
      for (let x = 0; x < W; x++) {
        const w = n(x / 260 + off, y / 26 + off, 4);
        const ring = Math.sin((y / 11 + w * 16 + n(x / 40, y / 8 + off, 2) * 2.5) * 1.0) * 0.5 + 0.5;
        let t = Math.pow(ring, 3.2) * 0.38 + n(x / 3, y / 60 + off, 2) * 0.22 + 0.12;
        t += (n(x / 900 + off, y / 120, 2) - 0.5) * 0.35;
        if (planks && (y % pw) < 2) t = 1.4;
        t = Math.max(0, Math.min(1.2, t));
        const i = (y * W + x) * 4;
        d[i] = (L.r + (D.r - L.r) * t) * 255;
        d[i + 1] = (L.g + (D.g - L.g) * t) * 255;
        d[i + 2] = (L.b + (D.b - L.b) * t) * 255;
        d[i + 3] = 255;
      }
    }
    g.putImageData(id, 0, 0);
    const t = tex(c);
    return t;
  });
}

export function stone(base = '#e9e2d6', vein = '#b6aa98', seed = 5) {
  return memo('stone' + base + seed, () => {
    const W = 1024, H = 512;
    const [c, g] = canvas(W, H);
    const n = makeNoise(seed);
    const id = g.createImageData(W, H), d = id.data;
    const B = new THREE.Color(base), V = new THREE.Color(vein);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const w = n(x / 220, y / 220, 5);
      const v = Math.abs(Math.sin((x / 160 + y / 300 + w * 6) * Math.PI));
      let t = Math.pow(1 - v, 18) * 0.7 + (n(x / 18, y / 18, 3) - 0.5) * 0.12;
      t = Math.max(0, Math.min(1, t));
      const i = (y * W + x) * 4;
      d[i] = (B.r + (V.r - B.r) * t) * 255; d[i + 1] = (B.g + (V.g - B.g) * t) * 255; d[i + 2] = (B.b + (V.b - B.b) * t) * 255; d[i + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    return tex(c);
  });
}

export function crust() {
  return memo('crust', () => {
    const W = 512, H = 512;
    const [c, g] = canvas(W, H);
    const n = makeNoise(21);
    const id = g.createImageData(W, H), d = id.data;
    const A = new THREE.Color('#e3a75c'), B = new THREE.Color('#8e4f1f'), C = new THREE.Color('#f3d29a');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = n(x / 40, y / 40, 5);
      const f = n(x / 8, y / 8, 2);
      const i = (y * W + x) * 4;
      const k = Math.min(1, Math.max(0, t * 1.4 - 0.2));
      const col = A.clone().lerp(B, k).lerp(C, f > 0.72 ? (f - 0.72) * 2.5 : 0);
      d[i] = col.r * 255; d[i + 1] = col.g * 255; d[i + 2] = col.b * 255; d[i + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    return tex(c);
  });
}

export function crumb() {
  return memo('crumb', () => {
    const W = 512, H = 512;
    const [c, g] = canvas(W, H);
    const r = rng(31);
    g.fillStyle = '#f2dcb0'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1600; i++) {
      const x = r() * W, y = r() * H, s = 1 + r() * r() * 9;
      g.fillStyle = `rgba(${150 + r() * 40},${110 + r() * 30},${60 + r() * 20},${0.25 + r() * 0.35})`;
      g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.6), r() * 3, 0, 7); g.fill();
    }
    return tex(c);
  });
}

export function cheese() {
  return memo('cheese', () => {
    const W = 512, H = 512;
    const [c, g] = canvas(W, H);
    const r = rng(41);
    const grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#f7cf5a'); grd.addColorStop(1, '#efc048');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) {
      const x = r() * W, y = r() * H, s = 8 + r() * 28;
      const h = g.createRadialGradient(x - s * 0.2, y - s * 0.25, 1, x, y, s);
      h.addColorStop(0, '#b98a1e'); h.addColorStop(0.7, '#d9a832'); h.addColorStop(1, 'rgba(240,195,70,0)');
      g.fillStyle = h; g.beginPath(); g.ellipse(x, y, s, s * 0.85, 0, 0, 7); g.fill();
    }
    return tex(c);
  });
}

export function cloth(a = '#f4efe6', b = '#6f8fbf') {
  return memo('cloth' + a + b, () => {
    const W = 512, H = 512, s = 32;
    const [c, g] = canvas(W, H);
    g.fillStyle = a; g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.5; g.fillStyle = b;
    for (let x = 0; x < W; x += s * 2) g.fillRect(x, 0, s, H);
    for (let y = 0; y < H; y += s * 2) g.fillRect(0, y, W, s);
    g.globalAlpha = 0.08; g.fillStyle = '#000';
    for (let y = 0; y < H; y += 2) g.fillRect(0, y, W, 1);
    g.globalAlpha = 1;
    return tex(c);
  });
}

export function label(spec) {
  const key = 'label' + JSON.stringify(spec);
  return memo(key, () => {
    const W = spec.w || 512, H = spec.h || 256;
    const [c, g] = canvas(W, H);
    g.fillStyle = spec.bg || '#f3ead8'; g.fillRect(0, 0, W, H);
    if (spec.band) { g.fillStyle = spec.band; g.fillRect(0, H * 0.62, W, H * 0.38); }
    if (spec.stripe) { g.fillStyle = spec.stripe; g.fillRect(0, H * 0.08, W, H * 0.06); g.fillRect(0, H * 0.86, W, H * 0.06); }
    if (spec.dots) { g.fillStyle = spec.dots; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc((i * 97) % W, (i * 53) % H, 6, 0, 7); g.fill(); } }
    g.fillStyle = spec.fg || '#3b2a1f';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${spec.italic ? 'italic ' : ''}${spec.weight || 600} ${spec.size || 64}px ${spec.font || 'Fraunces, Georgia, serif'}`;
    g.fillText(spec.text || '', W / 2, H * (spec.ty || 0.42));
    if (spec.sub) {
      g.font = `500 ${Math.round((spec.size || 64) * 0.36)}px Instrument Sans, sans-serif`;
      g.fillStyle = spec.subfg || spec.fg || '#3b2a1f';
      g.fillText(spec.sub, W / 2, H * (spec.sy || 0.78));
    }
    return tex(c, { clamp: true });
  });
}

export function sky() {
  return memo('sky', () => {
    const W = 1024, H = 1024;
    const [c, g] = canvas(W, H);
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#9fc0e4'); grd.addColorStop(0.45, '#f6d7b0'); grd.addColorStop(0.62, '#ffc98d'); grd.addColorStop(1, '#e7b17c');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    const sun = g.createRadialGradient(W * 0.3, H * 0.6, 4, W * 0.3, H * 0.6, 420);
    sun.addColorStop(0, 'rgba(255,250,230,1)'); sun.addColorStop(0.1, 'rgba(255,236,190,0.9)'); sun.addColorStop(1, 'rgba(255,200,140,0)');
    g.fillStyle = sun; g.fillRect(0, 0, W, H);
    const r = rng(77);
    g.fillStyle = 'rgba(110,128,92,0.85)';
    for (let i = 0; i < 18; i++) {
      const x = r() * W, h = 200 + r() * 260, w = 70 + r() * 120;
      g.beginPath(); g.ellipse(x, H - h * 0.5, w, h * 0.6, 0, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(88,104,74,0.95)';
    for (let i = 0; i < 12; i++) {
      const x = r() * W, h = 150 + r() * 160, w = 90 + r() * 110;
      g.beginPath(); g.ellipse(x, H - h * 0.35, w, h * 0.5, 0, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(240,236,226,0.9)';
    for (let i = 0; i < 6; i++) { const x = 80 + r() * (W - 160); g.fillRect(x, H * 0.55, 7, H * 0.45); }
    return tex(c, { clamp: true });
  });
}

export function softDot() {
  return memo('dot', () => {
    const [c, g] = canvas(64, 64);
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.4, 'rgba(255,255,255,0.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return tex(c, { clamp: true });
  });
}

export function shaft() {
  return memo('shaft', () => {
    const [c, g] = canvas(128, 512);
    const a = g.createLinearGradient(0, 0, 128, 0);
    a.addColorStop(0, 'rgba(255,255,255,0)'); a.addColorStop(0.3, 'rgba(255,255,255,0.8)'); a.addColorStop(0.7, 'rgba(255,255,255,0.8)'); a.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = a; g.fillRect(0, 0, 128, 512);
    g.globalCompositeOperation = 'destination-in';
    const b = g.createLinearGradient(0, 0, 0, 512);
    b.addColorStop(0, 'rgba(0,0,0,1)'); b.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = b; g.fillRect(0, 0, 128, 512);
    return tex(c, { clamp: true });
  });
}

export function noiseMap(seed = 9, scale = 30, lo = 0.4, hi = 0.8) {
  return memo('noise' + seed + scale + lo + hi, () => {
    const W = 256, H = 256;
    const [c, g] = canvas(W, H);
    const n = makeNoise(seed);
    const id = g.createImageData(W, H), d = id.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = (lo + (hi - lo) * n(x / scale, y / scale, 4)) * 255;
      const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    return tex(c, { data: true });
  });
}

export function wallPaint(base = '#efe3cf') {
  return memo('paint' + base, () => {
    const W = 512, H = 512;
    const [c, g] = canvas(W, H);
    const n = makeNoise(13);
    const B = new THREE.Color(base);
    const id = g.createImageData(W, H), d = id.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = 0.95 + n(x / 60, y / 60, 4) * 0.08;
      const i = (y * W + x) * 4; d[i] = B.r * v * 255; d[i + 1] = B.g * v * 255; d[i + 2] = B.b * v * 255; d[i + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    return tex(c);
  });
}

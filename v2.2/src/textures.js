// Procedural canvas textures for the kitchen: tiles, wood, stone, bread, cheese, printed packaging, sheet music, cloth, sky.
import * as THREE from 'three';

const cache = new Map();
const painters = [];
const SERIF = 'Fraunces, Georgia, "Times New Roman", serif';
const SANS = '"Instrument Sans", Helvetica, Arial, sans-serif';

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

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}

function refreshAll() { for (const p of painters) { p.paint(); p.t.needsUpdate = true; } }

let fontP = null;
function fontsLoaded() {
  if (fontP) return fontP;
  const loads = document.fonts ? ['600 64px Fraunces', 'italic 600 64px Fraunces', '500 24px "Instrument Sans"'].map((f) => document.fonts.load(f).catch(() => null)) : [];
  fontP = Promise.all(loads).then(refreshAll);
  return fontP;
}

function printed(W, H, paint) {
  const [c, g] = canvas(W, H);
  const run = () => paint(g, W, H);
  run();
  const t = tex(c, { clamp: true });
  painters.push({ t, paint: run });
  fontsLoaded();
  return t;
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
    return tex(c);
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

function paperGrain(g, W, H, amt, seed) {
  const r = rng(seed);
  for (let i = 0; i < W * H / 180; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(40,25,10,${amt * r()})` : `rgba(255,255,255,${amt * r()})`;
    g.fillRect(r() * W, r() * H, 1 + r(), 1 + r());
  }
}

function wear(g, W, H, a) {
  const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
  v.addColorStop(0, 'rgba(60,40,20,0)'); v.addColorStop(1, `rgba(60,40,20,${a})`);
  g.fillStyle = v; g.fillRect(0, 0, W, H);
}

function fit(g, text, make, px, maxW) {
  let s = px;
  g.font = make(s);
  while (s > px * 0.45 && g.measureText(text).width > maxW) { s -= 1; g.font = make(s); }
  return s;
}

function spaced(g, text, x, y, gap) {
  const chars = [...text];
  const ws = chars.map((ch) => g.measureText(ch).width);
  let cx = x - (ws.reduce((a, b) => a + b, 0) + gap * (chars.length - 1)) / 2;
  g.textAlign = 'left';
  chars.forEach((ch, i) => { g.fillText(ch, cx, y); cx += ws[i] + gap; });
  g.textAlign = 'center';
}

function emblem(g, x, y, R, kind, col) {
  g.save();
  g.fillStyle = col; g.strokeStyle = col;
  if (kind === 'star') {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.45 : R; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    g.closePath(); g.fill();
  } else if (kind === 'sun') {
    g.beginPath(); g.arc(x, y, R * 0.55, 0, 7); g.fill();
    g.lineWidth = R * 0.14; g.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(x + Math.cos(a) * R * 0.75, y + Math.sin(a) * R * 0.75); g.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); g.stroke(); }
  } else if (kind === 'leaf') {
    g.beginPath(); g.ellipse(x, y, R * 0.45, R, 0.5, 0, 7); g.fill();
    g.lineWidth = R * 0.09; g.beginPath(); g.moveTo(x - R * 0.2, y + R * 0.7); g.lineTo(x + R * 0.25, y - R * 0.6); g.stroke();
  } else if (kind === 'drop') {
    g.beginPath(); g.moveTo(x, y - R); g.quadraticCurveTo(x + R * 0.9, y + R * 0.1, x, y + R * 0.8); g.quadraticCurveTo(x - R * 0.9, y + R * 0.1, x, y - R); g.fill();
  }
  g.restore();
}

function paintLabel(g, W, H, s) {
  const k = W / 512, ink = s.fg || '#3b2a1f', alt = s.ink || ink;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.fillStyle = s.bg || '#f3ead8'; g.fillRect(0, 0, W, H);
  if (s.band) { g.fillStyle = s.band; g.fillRect(0, H * (s.bandY ?? 0.64), W, H); }
  if (s.stripe) { g.fillStyle = s.stripe; g.fillRect(0, H * 0.05, W, H * 0.045); g.fillRect(0, H * 0.9, W, H * 0.045); }
  if (s.dots) { g.fillStyle = s.dots; const r = rng(5); for (let i = 0; i < 30; i++) { g.beginPath(); g.arc(r() * W, r() * H, 4.5 * k, 0, 7); g.fill(); } }
  paperGrain(g, W, H, 0.09, 9);
  if (s.frame !== false) {
    g.strokeStyle = alt; g.globalAlpha = 0.55; g.lineWidth = 2.2 * k; g.strokeRect(W * 0.04, H * 0.04, W * 0.92, H * 0.92);
    g.lineWidth = 0.9 * k; g.strokeRect(W * 0.058, H * 0.058, W * 0.884, H * 0.884);
    g.globalAlpha = 1;
  }
  g.fillStyle = alt; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (s.kicker) {
    g.font = `600 ${Math.round(20 * k)}px ${SANS}`; g.globalAlpha = 0.85;
    spaced(g, s.kicker, W / 2, H * (s.ky ?? 0.14), 3 * k);
    g.globalAlpha = 1;
  }
  if (s.emblem) emblem(g, W / 2, H * (s.ey ?? 0.25), H * (s.eR ?? 0.07), s.emblem, s.emblemCol || alt);
  if (s.text) {
    const make = (px) => `${s.italic ? 'italic ' : ''}${s.weight || 600} ${px}px ${s.font || SERIF}`;
    const px = fit(g, s.text, make, (s.size || 64) * k, W * 0.82);
    g.font = make(px); g.fillStyle = s.textCol || ink;
    g.fillText(s.text, W / 2, H * (s.ty ?? 0.44));
  }
  if (s.sub) {
    const make = (px) => `500 ${px}px ${SANS}`;
    const px = fit(g, s.sub, make, (s.subSize || (s.size || 64) * 0.34) * k, W * 0.66);
    g.font = make(px); g.fillStyle = s.subfg || alt;
    g.fillText(s.sub, W / 2, H * (s.sy ?? 0.66));
  }
  if (s.fine) {
    g.font = `500 ${Math.round(13 * k)}px ${SANS}`; g.globalAlpha = 0.7; g.fillStyle = s.subfg || alt;
    spaced(g, s.fine, W / 2, H * (s.fy ?? 0.84), 0.6 * k);
    g.globalAlpha = 1;
  }
  wear(g, W, H, 0.14);
}

export function label(spec) {
  const key = 'label' + JSON.stringify(spec);
  return memo(key, () => printed(spec.w || 512, spec.h || 256, (g, W, H) => paintLabel(g, W, H, spec)));
}

const NOTE_T = [[[4, 1], [5, 1], [6, 2]], [[7, 1.5], [6, 0.5], [5, 1], [4, 1]], [[3, 1], [4, 1], [5, 1], [6, 0.5], [7, 0.5]], [[6, 2], [5, 1], [4, 1]]];
const NOTE_B = [[[0, 2], [4, 2]], [[1, 2], [5, 2]], [[0, 2], [4, 2]], [[2, 2], [0, 2]]];

function noteHead(g, x, y, dur, stemDown, sp, col) {
  const rx = sp * 0.62, ry = sp * 0.46;
  g.fillStyle = col; g.strokeStyle = col;
  g.beginPath(); g.ellipse(x, y, rx, ry, -0.35, 0, 7);
  if (dur >= 2) { g.lineWidth = sp * 0.16; g.stroke(); } else g.fill();
  const sx = stemDown ? x - rx * 0.9 : x + rx * 0.9;
  const top = stemDown ? y + sp * 3.4 : y - sp * 3.4;
  g.lineWidth = sp * 0.13;
  g.beginPath(); g.moveTo(sx, y); g.lineTo(sx, top); g.stroke();
  if (dur === 0.5) {
    const dir = stemDown ? 1 : -1;
    g.lineWidth = sp * 0.16;
    g.beginPath(); g.moveTo(sx, top); g.quadraticCurveTo(sx + sp * 0.9, top - dir * sp * 0.8, sx + sp * 0.2, top - dir * sp * 1.9); g.stroke();
  }
}

function paintSheet(g, W, H) {
  const k = W / 768, ink = '#2a2118';
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#f1e8d0'; g.fillRect(0, 0, W, H);
  paperGrain(g, W, H, 0.07, 3);
  g.strokeStyle = ink; g.globalAlpha = 0.5; g.lineWidth = 3 * k; g.strokeRect(W * 0.03, H * 0.03, W * 0.94, H * 0.94); g.globalAlpha = 1;
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `600 ${Math.round(60 * k)}px ${SERIF}`; g.fillText('Nocturne', W / 2, H * 0.215);
  g.font = `italic 500 ${Math.round(26 * k)}px ${SERIF}`; g.fillText('Andante cantabile', W / 2, H * 0.29);
  g.textAlign = 'left'; g.font = `italic ${Math.round(22 * k)}px ${SERIF}`; g.fillText('dolce', W * 0.14, H * 0.33);
  g.textAlign = 'center';
  const sp = H * 0.034, T0 = H * 0.37, B0 = T0 + 8 * sp + H * 0.12;
  const x0 = W * 0.12, x1 = W * 0.95, xs = x0 + W * 0.1, mw = (x1 - xs) / 4;
  g.strokeStyle = ink; g.lineWidth = Math.max(1, 1.3 * k);
  for (const top of [T0, B0]) for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(x0, top + i * sp); g.lineTo(x1, top + i * sp); g.stroke(); }
  g.lineWidth = 4 * k; g.beginPath(); g.moveTo(x0, T0); g.lineTo(x0, B0 + 4 * sp); g.stroke();
  g.lineWidth = Math.max(1, 1.6 * k);
  for (let m = 0; m <= 4; m++) { const x = xs + m * mw; g.beginPath(); g.moveTo(x, T0); g.lineTo(x, T0 + 4 * sp); g.stroke(); g.beginPath(); g.moveTo(x, B0); g.lineTo(x, B0 + 4 * sp); g.stroke(); }
  g.lineWidth = 6 * k; g.beginPath(); g.moveTo(x1 - 4 * k, T0); g.lineTo(x1 - 4 * k, T0 + 4 * sp); g.moveTo(x1 - 4 * k, B0); g.lineTo(x1 - 4 * k, B0 + 4 * sp); g.stroke();
  const tG = T0 + 4 * sp - sp;
  g.lineWidth = 2.6 * sp * 0.3;
  g.beginPath(); g.moveTo(x0 + sp * 0.3, tG - sp * 2.6); g.bezierCurveTo(x0 - sp * 0.4, tG - sp * 1.6, x0 + sp * 0.2, tG + sp * 0.4, x0 + sp * 1.1, tG + sp * 0.2); g.stroke();
  g.beginPath(); g.ellipse(x0 + sp * 0.6, tG + sp * 1.5, sp * 0.9, sp * 0.45, 0, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(x0 + sp * 0.2, tG - sp * 2.8); g.lineTo(x0 + sp * 0.2, tG + sp * 2.4); g.stroke();
  const bF = B0 + 4 * sp - 3 * sp;
  g.fillStyle = ink;
  for (const dy of [-0.5, 0.5]) { g.beginPath(); g.arc(x0 + sp * 1.2, bF + dy * sp, sp * 0.22, 0, 7); g.fill(); }
  const pitchY = (base, p) => base - p * sp / 2;
  const bottomT = T0 + 4 * sp, bottomB = B0 + 4 * sp;
  for (let m = 0; m < 4; m++) {
    let bx = xs + m * mw + mw * 0.08, bb = bx;
    for (const [p, d] of NOTE_T[m]) {
      const nx = bx + (d / 4) * mw * 0.8 * 0.5, ny = pitchY(bottomT, p);
      noteHead(g, nx, ny, d, p >= 4, sp, ink);
      bx += (d / 4) * mw * 0.8;
    }
    bx = bb;
    for (const [p, d] of NOTE_B[m]) {
      const nx = bx + (d / 4) * mw * 0.8 * 0.5, ny = pitchY(bottomB, p);
      noteHead(g, nx, ny, d, p >= 6, sp, ink);
      bx += (d / 4) * mw * 0.8;
    }
  }
  g.font = `italic ${Math.round(18 * k)}px ${SERIF}`; g.textAlign = 'right';
  g.fillText('2', W * 0.92, H * 0.94);
  g.textAlign = 'left'; g.font = `italic ${Math.round(16 * k)}px ${SERIF}`;
  g.fillText('leggiero', W * 0.14, H * 0.94);
  wear(g, W, H, 0.16);
}

export function sheet() {
  return memo('sheet', () => printed(768, 528, paintSheet));
}

function paintClockFace(g, W, H) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#f6f1e4'; g.fillRect(0, 0, W, H);
  paperGrain(g, W, H, 0.05, 17);
  g.fillStyle = '#2b2620'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `600 30px ${SERIF}`;
  const romans = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6 - Math.PI / 2;
    g.fillText(romans[i], W / 2 + Math.cos(a) * W * 0.36, H / 2 + Math.sin(a) * H * 0.36);
  }
  g.lineWidth = 2;
  for (let i = 0; i < 60; i++) {
    const a = i * Math.PI / 30, r0 = W * (i % 5 ? 0.46 : 0.43);
    g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); g.lineTo(W / 2 + Math.cos(a) * W * 0.47, H / 2 + Math.sin(a) * W * 0.47); g.stroke();
  }
  wear(g, W, H, 0.1);
}

export function clockFace() {
  return memo('clockface', () => printed(256, 256, paintClockFace));
}

export function scenePhoto() {
  return memo('scenephoto', () => {
    const W = 256, H = 192;
    const [c, g] = canvas(W, H);
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#c9b48f'); grd.addColorStop(0.6, '#e6d3ab'); grd.addColorStop(1, '#a88f68');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    const r = rng(19);
    g.fillStyle = 'rgba(92,80,60,0.55)';
    for (let i = 0; i < 6; i++) { const x = r() * W, h = 40 + r() * 50; g.beginPath(); g.moveTo(x - 80, H * 0.7); g.quadraticCurveTo(x, H * 0.7 - h, x + 80, H * 0.7); g.fill(); }
    g.fillStyle = 'rgba(64,56,40,0.9)';
    for (let i = 0; i < 9; i++) {
      const x = r() * W, y = H * 0.72 + r() * 8, h = 28 + r() * 22;
      g.fillRect(x - 1.5, y - h * 0.3, 3, h * 0.35); g.beginPath(); g.ellipse(x, y - h * 0.5, 9 + r() * 6, h * 0.45, 0, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(60,50,35,0.9)'; g.fillRect(0, H * 0.74, W, H * 0.26);
    wear(g, W, H, 0.22);
    return tex(c, { clamp: true });
  });
}

export function brushed() {
  return memo('brushed', () => {
    const W = 256, H = 256;
    const [c, g] = canvas(W, H);
    const r = rng(53);
    const id = g.createImageData(W, H), d = id.data;
    const row = [];
    for (let y = 0; y < H; y++) row.push(r());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = 150 + row[y] * 70 + (r() - 0.5) * 36;
      const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    const t = tex(c, { data: true });
    t.repeat.set(2, 6);
    return t;
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

export function wallpaper(base = '#e9dcc4', stripe = '#d8c7a6', seed = 4) {
  return memo('wallpaper' + base + stripe, () => {
    const W = 512, H = 512;
    const [c, g] = canvas(W, H);
    const n = makeNoise(seed);
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    g.fillStyle = stripe;
    for (let x = 0; x < W; x += 64) { g.fillRect(x, 0, 22, H); g.fillRect(x + 30, 0, 4, H); }
    g.globalAlpha = 0.35; g.fillStyle = '#fff8ea';
    for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64) { g.beginPath(); g.ellipse(x + 47, y + 32, 5, 9, 0, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    const id = g.getImageData(0, 0, W, H), d = id.data;
    for (let i = 0; i < W * H; i++) { const v = (n((i % W) / 50, ((i / W) | 0) / 50, 3) - 0.5) * 14; d[i * 4] += v; d[i * 4 + 1] += v; d[i * 4 + 2] += v; }
    g.putImageData(id, 0, 0);
    return tex(c);
  });
}

export function cork() {
  return memo('cork', () => {
    const W = 256, H = 256;
    const [c, g] = canvas(W, H);
    const r = rng(91);
    g.fillStyle = '#b98a58'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { const x = r() * W, y = r() * H, s = 1 + r() * 3; g.fillStyle = `rgba(${90 + r() * 80},${60 + r() * 50},${30 + r() * 30},${0.4 + r() * 0.5})`; g.fillRect(x, y, s, s); }
    return tex(c);
  });
}

export function rug(a = '#9a4b3c', b = '#e9d8b6', c2 = '#3f5a6e') {
  return memo('rug' + a, () => {
    const W = 512, H = 256;
    const [c, g] = canvas(W, H);
    g.fillStyle = a; g.fillRect(0, 0, W, H);
    g.strokeStyle = b; g.lineWidth = 10; g.strokeRect(18, 18, W - 36, H - 36);
    g.strokeStyle = c2; g.lineWidth = 6; g.strokeRect(36, 36, W - 72, H - 72);
    g.fillStyle = b;
    for (let x = 70; x < W - 60; x += 56) { g.beginPath(); g.moveTo(x, H / 2); g.lineTo(x + 18, H / 2 - 30); g.lineTo(x + 36, H / 2); g.lineTo(x + 18, H / 2 + 30); g.closePath(); g.fill(); }
    return tex(c);
  });
}

export function nightSky() {
  return memo('nightsky', () => {
    const W = 1024, H = 1024;
    const [c, g] = canvas(W, H);
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#0b1426'); grd.addColorStop(0.6, '#1a2a48'); grd.addColorStop(1, '#2b3550');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    const r = rng(17);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; const s = r() < 0.1 ? 2 : 1; g.fillRect(r() * W, r() * H * 0.7, s, s); }
    const moon = g.createRadialGradient(W * 0.68, H * 0.28, 4, W * 0.68, H * 0.28, 160);
    moon.addColorStop(0, 'rgba(255,250,232,1)'); moon.addColorStop(0.22, 'rgba(255,248,226,1)'); moon.addColorStop(0.26, 'rgba(200,215,255,0.35)'); moon.addColorStop(1, 'rgba(120,140,200,0)');
    g.fillStyle = moon; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(14,20,30,0.95)';
    for (let i = 0; i < 14; i++) { const x = r() * W, h = 150 + r() * 220, w = 80 + r() * 120; g.beginPath(); g.ellipse(x, H - h * 0.4, w, h * 0.55, 0, 0, 7); g.fill(); }
    return tex(c, { clamp: true });
  });
}

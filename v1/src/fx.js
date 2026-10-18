// Particles: one pooled point cloud for crumbs, sparks, steam, frost, dust motes and poofs.
import * as THREE from 'three';
import { softDot } from './textures.js';

const MAX = 1400;

const VS = `
attribute float size; attribute vec4 tint;
varying vec4 vTint;
uniform float scale;
void main(){
  vTint = tint;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * scale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const FS = `
uniform sampler2D map;
varying vec4 vTint;
void main(){
  vec4 t = texture2D(map, gl_PointCoord);
  gl_FragColor = vec4(vTint.rgb, vTint.a * t.a);
  if (gl_FragColor.a < 0.01) discard;
}`;

const PRESETS = {
  dust: { n: 8, col: ['#d9c7aa'], life: [0.5, 0.9], size: [0.18, 0.32], v: [1.6, 1.2], g: -1, drag: 3, alpha: 0.5, up: 0.8 },
  butter: { n: 8, col: ['#f6d76b', '#fbe7a1'], life: [0.4, 0.8], size: [0.1, 0.18], v: [2.5, 2.5], g: 14, drag: 1, alpha: 0.9, up: 1.4 },
  bread: { n: 10, col: ['#e7b876', '#f3d9a8', '#b97a3d'], life: [0.5, 1.0], size: [0.06, 0.12], v: [2.8, 2.8], g: 16, drag: 0.6, alpha: 1, up: 1.6 },
  cheese: { n: 8, col: ['#f6cf5a', '#f9de86'], life: [0.5, 0.9], size: [0.06, 0.12], v: [2.4, 2.4], g: 16, drag: 0.6, alpha: 1, up: 1.4 },
  wood: { n: 9, col: ['#d9a46c', '#b67f4c'], life: [0.5, 0.9], size: [0.05, 0.1], v: [3.2, 2.8], g: 18, drag: 0.6, alpha: 1, up: 1.4 },
  spark: { n: 7, col: ['#fff6dc', '#ffe1a6'], life: [0.12, 0.28], size: [0.07, 0.12], v: [5, 5], g: 10, drag: 2, alpha: 1, up: 0.5, add: true },
  poof: { n: 18, col: ['#fff6e6', '#f3e5cc'], life: [0.5, 0.9], size: [0.3, 0.55], v: [2.6, 2.6], g: -1.5, drag: 4, alpha: 0.6, up: 0.3 },
  steam: { n: 1, col: ['#ffffff'], life: [1.6, 2.6], size: [0.6, 1.2], v: [0.4, 0.2], g: -1.6, drag: 0.4, alpha: 0.16, up: 0.6 },
  heat: { n: 1, col: ['#ffd9a0'], life: [1.0, 1.8], size: [0.12, 0.22], v: [0.25, 0.2], g: -1.4, drag: 0.6, alpha: 0.5, up: 0.4, add: true },
  frost: { n: 1, col: ['#dff1ff', '#ffffff'], life: [1.4, 2.4], size: [0.1, 0.2], v: [0.3, 0.1], g: 0.6, drag: 0.8, alpha: 0.75, up: 0, add: true },
  mote: { n: 1, col: ['#fff1d2'], life: [6, 10], size: [0.06, 0.12], v: [0.15, 0.1], g: 0, drag: 0, alpha: 0.6, up: 0.05, add: true },
  sizzle: { n: 3, col: ['#fff3c8'], life: [0.3, 0.6], size: [0.06, 0.1], v: [1.4, 1.6], g: -2, drag: 1, alpha: 0.8, up: 1.2, add: true },
  splash: { n: 14, col: ['#cfe3ea', '#ffffff'], life: [0.4, 0.8], size: [0.1, 0.18], v: [2.5, 3.5], g: 18, drag: 0.5, alpha: 0.85, up: 2.2 },
  confetti: { n: 1, col: ['#f6d76b', '#ffffff', '#9fb6e0', '#f3c4a6'], life: [3, 5], size: [0.12, 0.2], v: [0.6, 0.3], g: 0.8, drag: 0.4, alpha: 0.9, up: 0 },
};

export class FX {
  constructor(scene) {
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(MAX * 3);
    this.size = new Float32Array(MAX);
    this.tint = new Float32Array(MAX * 4);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('tint', new THREE.BufferAttribute(this.tint, 4).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, uniforms: { map: { value: softDot() }, scale: { value: 600 } } });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    scene.add(this.points);
    this.p = [];
    this.c = new THREE.Color();
  }

  emit(type, x, y, z = 0.3, n) {
    const P = PRESETS[type];
    if (!P) return;
    const count = n ?? P.n;
    for (let i = 0; i < count && this.p.length < MAX; i++) {
      const r = (a) => a[0] + Math.random() * (a[1] - a[0]);
      const col = P.col[(Math.random() * P.col.length) | 0];
      this.c.set(col);
      this.p.push({
        x: x + (Math.random() - 0.5) * 0.2, y: y + (Math.random() - 0.5) * 0.15, z: z + (Math.random() - 0.5) * 0.6,
        vx: (Math.random() - 0.5) * P.v[0] * 2, vy: (Math.random() - 0.3) * P.v[1] + P.up, vz: (Math.random() - 0.5) * P.v[0],
        life: r(P.life), age: 0, size: r(P.size), g: P.g, drag: P.drag, a: P.alpha, r: this.c.r, gg: this.c.g, b: this.c.b,
        fade: type === 'mote' || type === 'confetti',
      });
    }
  }

  emitBox(type, x, y, w, h, z0 = -1, z1 = 1.5, n = 1) {
    for (let i = 0; i < n; i++) this.emit(type, x + Math.random() * w, y + Math.random() * h, z0 + Math.random() * (z1 - z0), 1);
  }

  update(dt, camScale) {
    this.mat.uniforms.scale.value = camScale;
    const p = this.p;
    let j = 0;
    for (let i = 0; i < p.length; i++) {
      const q = p[i];
      q.age += dt;
      if (q.age >= q.life) continue;
      const dr = Math.exp(-q.drag * dt);
      q.vx *= dr; q.vy *= dr; q.vz *= dr;
      q.vy -= q.g * dt;
      if (q.fade) { q.vx += Math.sin(q.age * 1.3 + q.size * 50) * 0.02; q.vy += Math.cos(q.age * 0.9 + q.size * 30) * 0.015; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      const k = q.age / q.life;
      const al = q.fade ? Math.sin(k * Math.PI) : (1 - k) * (k < 0.1 ? k * 10 : 1);
      this.pos[j * 3] = q.x; this.pos[j * 3 + 1] = q.y; this.pos[j * 3 + 2] = q.z;
      this.size[j] = q.size * (q.g < 0 ? 1 + k * 1.2 : 1);
      this.tint[j * 4] = q.r; this.tint[j * 4 + 1] = q.gg; this.tint[j * 4 + 2] = q.b; this.tint[j * 4 + 3] = q.a * al;
      p[j++] = q;
    }
    p.length = j;
    this.geo.setDrawRange(0, j);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
    this.geo.attributes.tint.needsUpdate = true;
  }

  clear() { this.p.length = 0; }

  dispose(scene) { scene.remove(this.points); this.geo.dispose(); this.mat.dispose(); }
}

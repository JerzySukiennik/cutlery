// Renderer: warm lighting, environment reflections, ambient occlusion, bloom, light shafts, haze, depth of field and a film grade.
import * as THREE from 'three';
import { setDetail } from './detail.js';

function kitchenEnv() {
  const s = new THREE.Scene();
  const basic = (c, k = 1, side = THREE.FrontSide) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side });
  const room = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 24), [basic('#c9ad8d', 1.25, THREE.BackSide), basic('#bfa283', 1.15, THREE.BackSide), basic('#f6ead8', 1.7, THREE.BackSide), basic('#7a5a40', 0.85, THREE.BackSide), basic('#e6d3bb', 1.35, THREE.BackSide), basic('#d8c0a2', 1.2, THREE.BackSide)]);
  s.add(room);
  const panel = (w, h, c, k, x, y, z, ry = 0, rx = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(c, k, THREE.DoubleSide)); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m); };
  panel(9, 6, '#fff3df', 7, -5, 2, -11.8);
  panel(5, 4, '#dfe9ff', 3.5, 11.8, 1.5, 2, -Math.PI / 2);
  panel(10, 10, '#ffe7c4', 2.2, 0, 6.8, 0, 0, Math.PI / 2);
  panel(6, 3, '#ffd9a8', 2.4, -11.8, 0, 4, Math.PI / 2);
  panel(16, 2, '#f1e2cc', 1.6, 0, -2, 11.8, Math.PI);
  return s;
}

export const LOOKS = {
  plain: { ao: 0, bloom: 0, rays: 0, haze: 0, sat: 1, contrast: 1, split: 0, ca: 0, rim: 0, detail: false, sunK: 1, sunWarm: 0, hemiK: 1, envK: 1, gobo: 0, exposure: 0.92, raysPos: [0.18, 1.12] },
  light: { ao: 1, bloom: 0.75, rays: 0.65, haze: 0.25, sat: 1.08, contrast: 1.08, split: 1, ca: 0.5, rim: 1, detail: false, sunK: 1.4, sunWarm: 0.12, hemiK: 0.55, envK: 0.6, gobo: 1, exposure: 0.96, raysPos: [0.16, 1.1] },
  real: { ao: 1, bloom: 0.75, rays: 0.65, haze: 0.25, sat: 1.08, contrast: 1.08, split: 1, ca: 0.5, rim: 1, detail: true, sunK: 1.4, sunWarm: 0.12, hemiK: 0.55, envK: 0.6, gobo: 1, exposure: 0.96, raysPos: [0.16, 1.1] },
  golden: { ao: 1.1, bloom: 0.95, rays: 1.05, haze: 0.4, sat: 1.14, contrast: 1.12, split: 1.4, ca: 0.6, rim: 1.6, detail: true, sunK: 1.65, sunWarm: 0.55, hemiK: 0.45, envK: 0.5, gobo: 1, exposure: 0.96, raysPos: [0.08, 1.04] },
};

const LEVEL_LOOK = {
  t3: { sunWarm: 0, split: 0.5, sat: 1.0, rays: 0.45, haze: 0.3, bloom: 1.1 },
  b1: { sunWarm: 0.3, haze: 0.3 },
};

function leafTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  let s = 777;
  const r = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; };
  g.fillStyle = '#000';
  g.lineCap = 'round';
  for (let b = 0; b < 6; b++) {
    let x = r() * S, y = r() * S, a = r() * Math.PI * 2;
    g.lineWidth = 6 + r() * 8;
    g.strokeStyle = '#000';
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 14; k++) {
      a += (r() - 0.5) * 0.7;
      x += Math.cos(a) * 34; y += Math.sin(a) * 34;
      g.lineTo(x, y);
      for (let l = 0; l < 2; l++) {
        const la = a + (r() - 0.5) * 2.6, d = 10 + r() * 26;
        const lx = x + Math.cos(la) * d, ly = y + Math.sin(la) * d;
        for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
          g.save(); g.translate(lx + ox, ly + oy); g.rotate(la); g.beginPath(); g.ellipse(0, 0, 26 + r() * 22, 11 + r() * 8, 0, 0, Math.PI * 2); g.fill(); g.restore();
        }
      }
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3.6, 3.6);
  return t;
}

const QUAD_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const DEPTH_FN = `
uniform float near; uniform float far;
float viewZ(float d){ float z = d * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }`;

const AO_FS = `
precision highp float;
uniform sampler2D tDepth; uniform vec2 texel; uniform mat4 projInv; uniform vec2 projScale; uniform float radius; uniform float strength;
varying vec2 vUv;
vec3 viewPos(vec2 uv){ float d = texture2D(tDepth, uv).x; vec4 p = projInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
void main(){
  float d0 = texture2D(tDepth, vUv).x;
  if (d0 >= 0.9999) { gl_FragColor = vec4(1.0); return; }
  vec3 p = viewPos(vUv);
  vec3 px = viewPos(vUv + vec2(texel.x, 0.0)) - p, py = viewPos(vUv + vec2(0.0, texel.y)) - p;
  vec3 n = normalize(cross(px, py));
  float rs = radius * projScale.y / -p.z;
  float occ = 0.0;
  vec2 fc = mod(floor(gl_FragCoord.xy), 4.0);
  float rot = (fc.x * 4.0 + fc.y + fract(fc.x * 0.37 + fc.y * 0.61)) / 16.0 * 6.2831;
  for (int i = 0; i < 8; i++){
    float fi = float(i) + 0.5;
    float r = sqrt(fi / 8.0);
    float a = fi * 2.39996323 + rot;
    vec2 o = vec2(cos(a) * projScale.x / projScale.y, sin(a)) * r * rs;
    vec3 v = viewPos(vUv + o) - p;
    float vv = dot(v, v);
    float k = max(0.0, dot(v, n) - 0.035 * -p.z) / (vv + 0.03);
    occ += k * smoothstep(radius * 3.0, 0.0, sqrt(vv));
  }
  float ao = clamp(1.0 - strength * occ / 8.0 * radius, 0.0, 1.0);
  gl_FragColor = vec4(ao, ao, ao, 1.0);
}`;

const AO_BLUR_FS = `
precision highp float;
uniform sampler2D tAO; uniform sampler2D tDepth; uniform vec2 dir;
varying vec2 vUv;
${DEPTH_FN}
void main(){
  float z0 = viewZ(texture2D(tDepth, vUv).x);
  float s = 0.0, w = 0.0;
  for (int i = -3; i <= 3; i++){
    vec2 uv = vUv + dir * float(i);
    float z = viewZ(texture2D(tDepth, uv).x);
    float k = exp(-abs(z - z0) * 3.0) * (1.0 - abs(float(i)) / 4.5);
    s += texture2D(tAO, uv).r * k; w += k;
  }
  float a = s / max(w, 0.0001);
  gl_FragColor = vec4(a, a, a, 1.0);
}`;

const COC_FS = `
precision highp float;
uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tAO; uniform vec2 texel;
uniform float focus; uniform float aperture; uniform float bgBoost; uniform float band; uniform float aoOn;
varying vec2 vUv;
${DEPTH_FN}
void main(){
  vec3 c = texture2D(tColor, vUv + texel * vec2(-0.5,-0.5)).rgb + texture2D(tColor, vUv + texel * vec2(0.5,-0.5)).rgb
         + texture2D(tColor, vUv + texel * vec2(-0.5,0.5)).rgb + texture2D(tColor, vUv + texel * vec2(0.5,0.5)).rgb;
  c *= mix(1.0, texture2D(tAO, vUv).r, aoOn);
  float z = viewZ(texture2D(tDepth, vUv).x);
  float dz = z - focus; dz = sign(dz) * max(abs(dz) - band, 0.0);
  float s = dz / z;
  float coc = s > 0.0 ? s * aperture * bgBoost : s * aperture;
  gl_FragColor = vec4(min(c * 0.25, vec3(24.0)), clamp(coc, -1.0, 1.0));
}`;

const BLUR_FS = `
precision highp float;
uniform sampler2D tHalf; uniform vec2 texel; uniform float maxR;
varying vec2 vUv;
const int TAPS = __TAPS__;
void main(){
  vec4 cen = texture2D(tHalf, vUv);
  float cc = abs(cen.a);
  vec3 acc = cen.rgb; float wsum = 1.0;
  float ga = 2.39996323;
  float rot = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453) * 6.2831;
  for (int i = 0; i < TAPS; i++){
    float fi = float(i) + 0.5;
    float r = sqrt(fi / float(TAPS));
    float a = fi * ga + rot;
    vec2 o = vec2(cos(a), sin(a)) * r * maxR;
    vec4 s = texture2D(tHalf, vUv + o * texel);
    float sc = abs(s.a);
    float eff = s.a > cen.a ? min(sc, cc + 0.04) : sc;
    if (s.a < -0.02) eff = sc;
    float w = clamp((eff * maxR - r * maxR) * 0.9 + 1.0, 0.0, 1.0);
    float l = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
    w *= 1.0 + smoothstep(1.2, 4.0, l) * eff * 3.0;
    acc += s.rgb * w; wsum += w;
  }
  gl_FragColor = vec4(acc / wsum, cen.a);
}`;

const BRIGHT_FS = `
precision highp float;
uniform sampler2D tSrc; uniform vec2 texel; uniform float threshold;
varying vec2 vUv;
vec3 knee(vec3 c){ float l = max(c.r, max(c.g, c.b)); float k = max(l - threshold, 0.0); k = k * k / (k + 0.5); return c * (k / max(l, 0.0001)); }
void main(){
  vec3 a = texture2D(tSrc, vUv + texel * vec2(-1.0, -1.0)).rgb, b = texture2D(tSrc, vUv + texel * vec2(1.0, -1.0)).rgb;
  vec3 c = texture2D(tSrc, vUv + texel * vec2(-1.0, 1.0)).rgb, d = texture2D(tSrc, vUv + texel * vec2(1.0, 1.0)).rgb;
  gl_FragColor = vec4(min(knee((a + b + c + d) * 0.25), vec3(30.0)), 1.0);
}`;

const DOWN_FS = `
precision highp float;
uniform sampler2D tSrc; uniform vec2 texel;
varying vec2 vUv;
void main(){
  vec3 c = texture2D(tSrc, vUv).rgb * 4.0;
  c += texture2D(tSrc, vUv + texel * vec2(-1.0, -1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, -1.0)).rgb;
  c += texture2D(tSrc, vUv + texel * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, 1.0)).rgb;
  gl_FragColor = vec4(c / 8.0, 1.0);
}`;

const UP_FS = `
precision highp float;
uniform sampler2D tSrc; uniform sampler2D tLow; uniform vec2 texel;
varying vec2 vUv;
void main(){
  vec3 c = texture2D(tLow, vUv + texel * vec2(-1.0, 0.0)).rgb + texture2D(tLow, vUv + texel * vec2(1.0, 0.0)).rgb;
  c += texture2D(tLow, vUv + texel * vec2(0.0, -1.0)).rgb + texture2D(tLow, vUv + texel * vec2(0.0, 1.0)).rgb;
  c = c * 0.25 + texture2D(tLow, vUv).rgb * 0.5;
  gl_FragColor = vec4(texture2D(tSrc, vUv).rgb + c * 0.75, 1.0);
}`;

const RAYS_FS = `
precision highp float;
uniform sampler2D tSrc; uniform vec2 lightPos; uniform float aspect;
varying vec2 vUv;
void main(){
  vec2 d = (lightPos - vUv);
  vec2 stepv = d / 28.0 * 0.32;
  vec2 uv = vUv;
  vec3 acc = vec3(0.0); float decay = 1.0;
  float rot = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  uv += stepv * rot;
  for (int i = 0; i < 28; i++){
    uv += stepv;
    acc += texture2D(tSrc, clamp(uv, 0.001, 0.999)).rgb * decay;
    decay *= 0.92;
  }
  gl_FragColor = vec4(acc / 12.0, 1.0);
}`;

const FINAL_FS = `
precision highp float;
uniform sampler2D tColor; uniform sampler2D tBlur; uniform sampler2D tDepth; uniform sampler2D tAO; uniform sampler2D tBloom; uniform sampler2D tRays;
uniform float focus; uniform float aperture; uniform float bgBoost; uniform float band;
uniform float time; uniform float vignette; uniform float fade; uniform vec3 fadeColor; uniform float dofOn; uniform float warmth; uniform float lift;
uniform float aoOn; uniform float bloom; uniform float rays; uniform vec3 rayColor; uniform float haze; uniform vec3 hazeColor;
uniform float sat; uniform float contrast; uniform float split; uniform float ca;
varying vec2 vUv;
${DEPTH_FN}
void main(){
  vec2 q = vUv - 0.5;
  vec2 cad = q * dot(q, q) * ca * 0.012;
  vec3 sharp = vec3(texture2D(tColor, vUv + cad).r, texture2D(tColor, vUv).g, texture2D(tColor, vUv - cad).b);
  sharp *= mix(1.0, texture2D(tAO, vUv).r, aoOn);
  vec3 col = sharp;
  float z = viewZ(texture2D(tDepth, vUv).x);
  if (dofOn > 0.5) {
    float dz = z - focus; dz = sign(dz) * max(abs(dz) - band, 0.0);
    float s = dz / z;
    float coc = abs(s > 0.0 ? s * aperture * bgBoost : s * aperture);
    vec4 b = texture2D(tBlur, vUv);
    float m = smoothstep(0.035, 0.22, max(coc, abs(b.a) * step(b.a, -0.05)));
    col = mix(sharp, b.rgb, m);
  }
  float hz = (1.0 - exp(-max(z - focus * 0.92, 0.0) * 0.045)) * haze;
  col = mix(col, hazeColor, clamp(hz, 0.0, 0.85));
  col += texture2D(tBloom, vUv).rgb * bloom * 0.22;
  col += texture2D(tRays, vUv).rgb * rayColor * rays;
  col *= mix(vec3(1.0), vec3(1.06, 1.0, 0.9), warmth);
  col += lift * vec3(0.012, 0.008, 0.004);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  vec3 g = gl_FragColor.rgb;
  float l = dot(g, vec3(0.2126, 0.7152, 0.0722));
  g = mix(vec3(l), g, sat);
  g += split * (vec3(-0.012, 0.004, 0.022) * (1.0 - smoothstep(0.05, 0.5, l)) + vec3(0.03, 0.012, -0.022) * smoothstep(0.45, 1.0, l));
  g = (g - 0.5) * contrast + 0.5;
  float v = 1.0 - dot(q, q) * vignette;
  g *= v;
  float n = fract(sin(dot(vUv * (time + 1.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  g += n * 0.018;
  gl_FragColor.rgb = mix(clamp(g, 0.0, 1.0), fadeColor, fade);
}`;

const rt = (w, h, o = {}) => new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h), { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, ...o });

export class Renderer {
  constructor(canvas) {
    const coarse = matchMedia('(pointer: coarse)').matches;
    this.mobile = coarse || /iPhone|iPad|Android/i.test(navigator.userAgent);
    this.r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    this.r.toneMapping = THREE.ACESFilmicToneMapping;
    this.r.toneMappingExposure = 0.92;
    this.r.outputColorSpace = THREE.SRGBColorSpace;
    this.r.shadowMap.enabled = true;
    this.r.shadowMap.type = THREE.PCFShadowMap;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#2a1d14');
    this.camera = new THREE.PerspectiveCamera(30, 1, 1, 160);
    this.camera.position.set(0, 4, 26);
    const pm = new THREE.PMREMGenerator(this.r);
    this.envTex = pm.fromScene(kitchenEnv(), 0.03).texture;
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 0.26;
    pm.dispose();
    this.sun = new THREE.DirectionalLight('#ffd09a', 3.4);
    this.sun.castShadow = true;
    this.sunDir = new THREE.Vector3(-0.55, 0.62, 0.56).normalize();
    this.scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight('#bdd0ee', '#4a3424', 0.22);
    this.scene.add(this.hemi);
    this.fill = new THREE.DirectionalLight('#9fb6e0', 0.45);
    this.fill.position.set(8, 6, 14);
    this.scene.add(this.fill);
    this.rim = new THREE.DirectionalLight('#ffd8a8', 0);
    this.rim.position.set(6, 9, -14);
    this.scene.add(this.rim);
    const leaves = leafTexture();
    this.gobo = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), new THREE.MeshBasicMaterial({ map: leaves, alphaTest: 0.5, colorWrite: false, depthWrite: false, side: THREE.DoubleSide }));
    this.gobo.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leaves, alphaTest: 0.5, side: THREE.DoubleSide });
    this.gobo.castShadow = true;
    this.gobo.frustumCulled = false;
    this.scene.add(this.gobo);
    this.grade = { warmth: 0.6, vignette: 0.9, lift: 0, fade: 0, fadeColor: new THREE.Color('#0f0a07') };
    this.dof = { focus: 26, aperture: 1.9, bgBoost: 1.35, band: 1.6 };
    this.base = { sun: 3.4, sunColor: '#ffd09a', hemi: 0.22, fill: 0.45, env: 0.26, haze: '#d9c0a0', rays: '#ffd9a6', raysPos: null, gobo: true };
    this.lookName = new URLSearchParams(location.search).get('look') || 'golden';
    if (!LOOKS[this.lookName]) this.lookName = 'golden';
    this.look = { ...LOOKS[this.lookName] };
    this.time = 0;
    this.frameMs = [];
    this.setQuality(this.mobile ? 'low' : 'high');
    this.fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.quad = new THREE.Mesh(tri, null);
    this.quad.frustumCulled = false;
    this.fsScene = new THREE.Scene();
    this.fsScene.add(this.quad);
    addEventListener('resize', () => this.resize());
    this.resize();
    this.applyLook();
  }

  setLevel(def) {
    this.levelId = def.id;
    this.look = { ...LOOKS[this.lookName], ...(LEVEL_LOOK[def.id] || {}) };
    let h = 0;
    for (const ch of String(def.id)) h = (h * 31 + ch.charCodeAt(0)) % 997;
    this.goboOff = [h / 997, (h * 7 % 997) / 997];
    this.base = { sun: def.sun ?? 3.4, sunColor: def.sunColor || '#ffd09a', hemi: def.hemi ?? 0.22, fill: def.fill ?? 0.45, env: def.env ?? 0.26, haze: def.haze || '#d9c0a0', rays: def.rayColor || '#ffd9a6', raysPos: def.raysPos || null, rim: def.rim ?? 1, gobo: def.gobo !== false };
    this.applyLook();
  }

  setLook(name) {
    if (!LOOKS[name]) return;
    this.lookName = name;
    this.look = { ...LOOKS[name], ...(LEVEL_LOOK[this.levelId] || {}) };
    this.applyLook();
    setDetail(this.scene, this.look.detail);
  }

  applyDetail(obj) { setDetail(obj, this.look.detail); }

  applyLook() {
    const L = this.look, B = this.base;
    this.sun.intensity = B.sun * L.sunK;
    this.sun.color.set(B.sunColor).lerp(new THREE.Color('#ffa65a'), L.sunWarm * 0.6);
    this.hemi.intensity = B.hemi * L.hemiK;
    this.fill.intensity = B.fill * (0.5 + 0.5 * L.hemiK);
    this.scene.environmentIntensity = B.env * L.envK;
    this.r.toneMappingExposure = L.exposure;
    this.gobo.visible = L.gobo > 0 && B.gobo;
    this.rim.intensity = L.rim * 1.6 * (B.rim ?? 1);
    if (this.finalMat) {
      const f = this.finalMat.uniforms;
      f.hazeColor.value.set(B.haze).lerp(new THREE.Color('#ffb877'), L.sunWarm * 0.5);
      f.rayColor.value.set(B.rays).lerp(new THREE.Color('#ffb066'), L.sunWarm * 0.5);
    }
  }

  setQuality(q) {
    this.quality = q;
    const hi = q === 'high';
    this.dpr = Math.min(devicePixelRatio || 1, hi ? 1.4 : (this.mobile ? 1.6 : 1.2));
    this.samples = hi ? 4 : 0;
    this.taps = hi ? 36 : 18;
    this.dofOn = q !== 'off';
    this.heavy = hi;
    const sz = hi ? 2048 : 1024;
    this.sun.shadow.mapSize.set(sz, sz);
    if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    const c = this.sun.shadow.camera;
    c.left = -22; c.right = 22; c.top = 16; c.bottom = -16; c.near = 1; c.far = 90;
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.radius = hi ? 4 : 2;
    this.sun.shadow.camera.updateProjectionMatrix();
    this.buildTargets();
  }

  buildTargets() {
    for (const t of this.targets || []) t.dispose();
    const w = Math.max(2, Math.floor(innerWidth * this.dpr)), h = Math.max(2, Math.floor(innerHeight * this.dpr));
    this.w = w; this.h = h;
    const dt = new THREE.DepthTexture(w, h);
    dt.type = THREE.UnsignedIntType;
    this.rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: this.samples, depthTexture: dt, depthBuffer: true });
    const hw = Math.max(2, w >> 1), hh = Math.max(2, h >> 1);
    this.rtHalf = rt(hw, hh);
    this.rtBlur = rt(hw, hh);
    this.rtAO = rt(hw, hh, { type: THREE.UnsignedByteType });
    this.rtAO2 = rt(hw, hh, { type: THREE.UnsignedByteType });
    this.rtB = [2, 3, 4, 5].map((s) => rt(w >> s, h >> s));
    this.rtU = [2, 3, 4].map((s) => rt(w >> s, h >> s));
    this.rtRays = rt(w >> 2, h >> 2);
    this.targets = [this.rt, this.rtHalf, this.rtBlur, this.rtAO, this.rtAO2, ...this.rtB, ...this.rtU, this.rtRays];
    const common = () => ({ near: { value: 1 }, far: { value: 160 }, focus: { value: 26 }, aperture: { value: 2 }, bgBoost: { value: 1.3 }, band: { value: 1.5 } });
    const mk = (fs, uniforms) => new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: fs, depthTest: false, depthWrite: false, uniforms });
    this.aoMat = mk(AO_FS, { tDepth: { value: dt }, texel: { value: new THREE.Vector2(1 / w, 1 / h) }, projInv: { value: new THREE.Matrix4() }, projScale: { value: new THREE.Vector2(1, 1) }, radius: { value: 0.6 }, strength: { value: 1.6 } });
    this.aoBlurMat = mk(AO_BLUR_FS, { tAO: { value: null }, tDepth: { value: dt }, dir: { value: new THREE.Vector2() }, ...common() });
    this.cocMat = mk(COC_FS, { tColor: { value: this.rt.texture }, tDepth: { value: dt }, tAO: { value: this.rtAO.texture }, aoOn: { value: 0 }, texel: { value: new THREE.Vector2(1 / w, 1 / h) }, ...common() });
    this.blurMat = mk(BLUR_FS.replace('__TAPS__', String(this.taps)), { tHalf: { value: this.rtHalf.texture }, texel: { value: new THREE.Vector2(1 / hw, 1 / hh) }, maxR: { value: 9 } });
    this.brightMat = mk(BRIGHT_FS, { tSrc: { value: this.rtHalf.texture }, texel: { value: new THREE.Vector2(1 / hw, 1 / hh) }, threshold: { value: 0.85 } });
    this.downMat = mk(DOWN_FS, { tSrc: { value: null }, texel: { value: new THREE.Vector2() } });
    this.upMat = mk(UP_FS, { tSrc: { value: null }, tLow: { value: null }, texel: { value: new THREE.Vector2() } });
    this.raysMat = mk(RAYS_FS, { tSrc: { value: this.rtU[1].texture }, lightPos: { value: new THREE.Vector2(0.2, 1.1) }, aspect: { value: w / h } });
    this.finalMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: FINAL_FS, depthTest: false, depthWrite: false, toneMapped: true,
      uniforms: { tColor: { value: this.rt.texture }, tBlur: { value: this.rtBlur.texture }, tDepth: { value: dt }, tAO: { value: this.rtAO.texture }, tBloom: { value: this.rtU[0].texture }, tRays: { value: this.rtRays.texture },
        time: { value: 0 }, vignette: { value: 0.9 }, fade: { value: 0 }, fadeColor: { value: new THREE.Color() }, dofOn: { value: 1 }, warmth: { value: 0.6 }, lift: { value: 0 },
        aoOn: { value: 0 }, bloom: { value: 0 }, rays: { value: 0 }, rayColor: { value: new THREE.Color('#ffd9a6') }, haze: { value: 0 }, hazeColor: { value: new THREE.Color('#d9c0a0') },
        sat: { value: 1 }, contrast: { value: 1 }, split: { value: 0 }, ca: { value: 0 }, ...common() } });
    if (this.base) this.applyLook();
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.r.setPixelRatio(1);
    this.r.setSize(Math.floor(w * this.dpr), Math.floor(h * this.dpr), false);
    this.r.domElement.style.width = w + 'px';
    this.r.domElement.style.height = h + 'px';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.buildTargets();
  }

  followSun(x, y) {
    const t = this.sun.target.position;
    t.set(Math.round(x * 2) / 2, Math.round(y * 2) / 2, 0);
    const d = this._sd || (this._sd = new THREE.Vector3());
    d.copy(this.sunDir);
    d.y *= 1 - 0.4 * this.look.sunWarm;
    d.normalize();
    this.sun.position.copy(t).addScaledVector(d, 40);
    this.gobo.position.copy(t).addScaledVector(d, 12);
    this.gobo.lookAt(this.sun.position);
    const m = this.gobo.material.map, k = this.time;
    const o = this.goboOff || [0, 0];
    m.offset.set(o[0] + Math.sin(k * 0.37) * 0.006 + Math.sin(k * 0.91) * 0.002, o[1] + Math.cos(k * 0.29) * 0.004);
    this.rim.target.position.copy(t);
    this.rim.position.set(t.x + 6, t.y + 9, -14);
    this.rim.target.updateMatrixWorld();
  }

  pass(mat, target) {
    this.quad.material = mat;
    this.r.setRenderTarget(target);
    this.r.render(this.fsScene, this.fsCam);
  }

  render(dt) {
    this.time += dt;
    const t0 = performance.now();
    const cam = this.camera, L = this.look;
    const ao = this.heavy && L.ao > 0, bloom = L.bloom > 0, rays = this.heavy && L.rays > 0;
    const u = (m) => {
      m.uniforms.near.value = cam.near; m.uniforms.far.value = cam.far;
      if (m.uniforms.focus) { m.uniforms.focus.value = this.dof.focus; m.uniforms.aperture.value = this.dof.aperture; m.uniforms.bgBoost.value = this.dof.bgBoost; m.uniforms.band.value = this.dof.band; }
    };
    this.r.setRenderTarget(this.rt);
    this.r.render(this.scene, cam);
    if (ao) {
      const a = this.aoMat.uniforms;
      a.projInv.value.copy(cam.projectionMatrixInverse);
      a.projScale.value.set(cam.projectionMatrix.elements[0] * 0.5, cam.projectionMatrix.elements[5] * 0.5);
      a.strength.value = 1.5 * L.ao;
      this.pass(this.aoMat, this.rtAO);
      u(this.aoBlurMat);
      const hw = this.rtAO.width, hh = this.rtAO.height;
      this.aoBlurMat.uniforms.tAO.value = this.rtAO.texture; this.aoBlurMat.uniforms.dir.value.set(1.0 / hw, 0);
      this.pass(this.aoBlurMat, this.rtAO2);
      this.aoBlurMat.uniforms.tAO.value = this.rtAO2.texture; this.aoBlurMat.uniforms.dir.value.set(0, 1.0 / hh);
      this.pass(this.aoBlurMat, this.rtAO);
    }
    u(this.cocMat);
    this.cocMat.uniforms.aoOn.value = ao ? 1 : 0;
    this.pass(this.cocMat, this.rtHalf);
    if (this.dofOn) {
      this.blurMat.uniforms.maxR.value = 15 * (this.h / 1100);
      this.pass(this.blurMat, this.rtBlur);
    }
    if (bloom) {
      this.pass(this.brightMat, this.rtB[0]);
      for (let i = 1; i < this.rtB.length; i++) {
        const s = this.rtB[i - 1];
        this.downMat.uniforms.tSrc.value = s.texture;
        this.downMat.uniforms.texel.value.set(1 / s.width, 1 / s.height);
        this.pass(this.downMat, this.rtB[i]);
      }
      for (let i = this.rtU.length - 1; i >= 0; i--) {
        const low = i === this.rtU.length - 1 ? this.rtB[i + 1] : this.rtU[i + 1];
        this.upMat.uniforms.tSrc.value = this.rtB[i].texture;
        this.upMat.uniforms.tLow.value = low.texture;
        this.upMat.uniforms.texel.value.set(1 / low.width, 1 / low.height);
        this.pass(this.upMat, this.rtU[i]);
      }
      if (rays) {
        const p = this.base.raysPos || L.raysPos;
        this.raysMat.uniforms.lightPos.value.set(p[0], p[1]);
        this.pass(this.raysMat, this.rtRays);
      }
    }
    const f = this.finalMat.uniforms;
    u(this.finalMat);
    f.time.value = this.time % 100;
    f.dofOn.value = this.dofOn ? 1 : 0;
    f.vignette.value = this.grade.vignette;
    f.warmth.value = this.grade.warmth;
    f.lift.value = this.grade.lift;
    f.fade.value = this.grade.fade;
    f.fadeColor.value.copy(this.grade.fadeColor);
    f.aoOn.value = ao ? 1 : 0;
    f.bloom.value = bloom ? L.bloom : 0;
    f.rays.value = bloom && rays ? L.rays * 0.35 : 0;
    f.haze.value = L.haze;
    f.sat.value = L.sat;
    f.contrast.value = L.contrast;
    f.split.value = L.split;
    f.ca.value = L.ca;
    this.pass(this.finalMat, null);
    this.autoQuality(dt);
    return performance.now() - t0;
  }

  autoQuality(dt) {
    if (this.locked) return;
    this.frameMs.push(dt * 1000);
    if (this.frameMs.length < 150) return;
    this.frameMs.sort((a, b) => a - b);
    const med = this.frameMs[75];
    this.frameMs.length = 0;
    if (med > 24 && this.dpr > 0.85) {
      this.dpr = Math.max(0.85, this.dpr - 0.15);
      if (this.taps > 12) this.taps -= 4;
      this.resize();
    } else if (med > 24 && this.quality === 'high') {
      this.setQuality('low');
    }
  }
}

// Renderer: warm morning lighting, environment reflections and a depth-of-field grade pass.
import * as THREE from 'three';

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

const QUAD_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const COC_FS = `
precision highp float;
uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 texel;
uniform float near; uniform float far; uniform float focus; uniform float aperture; uniform float bgBoost; uniform float band;
varying vec2 vUv;
float viewZ(float d){ float z = d * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }
void main(){
  vec3 c = texture2D(tColor, vUv + texel * vec2(-0.5,-0.5)).rgb + texture2D(tColor, vUv + texel * vec2(0.5,-0.5)).rgb
         + texture2D(tColor, vUv + texel * vec2(-0.5,0.5)).rgb + texture2D(tColor, vUv + texel * vec2(0.5,0.5)).rgb;
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
    acc += s.rgb * w; wsum += w;
  }
  gl_FragColor = vec4(acc / wsum, cen.a);
}`;

const FINAL_FS = `
precision highp float;
uniform sampler2D tColor; uniform sampler2D tBlur; uniform sampler2D tDepth;
uniform float near; uniform float far; uniform float focus; uniform float aperture; uniform float bgBoost; uniform float band;
uniform float time; uniform float vignette; uniform float fade; uniform vec3 fadeColor; uniform float dofOn; uniform float warmth; uniform float lift;
varying vec2 vUv;
float viewZ(float d){ float z = d * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }
void main(){
  vec3 sharp = texture2D(tColor, vUv).rgb;
  vec3 col = sharp;
  if (dofOn > 0.5) {
    float z = viewZ(texture2D(tDepth, vUv).x);
    float dz = z - focus; dz = sign(dz) * max(abs(dz) - band, 0.0);
    float s = dz / z;
    float coc = abs(s > 0.0 ? s * aperture * bgBoost : s * aperture);
    vec4 b = texture2D(tBlur, vUv);
    float m = smoothstep(0.035, 0.22, max(coc, abs(b.a) * step(b.a, -0.05)));
    col = mix(sharp, b.rgb, m);
  }
  col *= mix(vec3(1.0), vec3(1.06, 1.0, 0.9), warmth);
  col += lift * vec3(0.012, 0.008, 0.004);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  vec2 q = vUv - 0.5;
  float v = 1.0 - dot(q, q) * vignette;
  gl_FragColor.rgb *= v;
  float g = fract(sin(dot(vUv * (time + 1.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  gl_FragColor.rgb += g * 0.018;
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fadeColor, fade);
}`;

export class Renderer {
  constructor(canvas) {
    const coarse = matchMedia('(pointer: coarse)').matches;
    this.mobile = coarse || /iPhone|iPad|Android/i.test(navigator.userAgent);
    this.r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    this.r.toneMapping = THREE.ACESFilmicToneMapping;
    this.r.toneMappingExposure = 0.92;
    this.r.outputColorSpace = THREE.SRGBColorSpace;
    this.r.shadowMap.enabled = true;
    this.r.shadowMap.type = THREE.PCFSoftShadowMap;
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
    this.grade = { warmth: 0.6, vignette: 0.9, lift: 0, fade: 0, fadeColor: new THREE.Color('#0f0a07') };
    this.dof = { focus: 26, aperture: 1.9, bgBoost: 1.35, band: 1.6 };
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
  }

  setQuality(q) {
    this.quality = q;
    const hi = q === 'high';
    this.dpr = Math.min(devicePixelRatio || 1, hi ? 1.4 : (this.mobile ? 1.6 : 1.2));
    this.samples = hi ? 4 : 0;
    this.taps = hi ? 36 : 18;
    this.dofOn = q !== 'off';
    const sz = hi ? 2048 : 1024;
    this.sun.shadow.mapSize.set(sz, sz);
    if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    const c = this.sun.shadow.camera;
    c.left = -22; c.right = 22; c.top = 16; c.bottom = -16; c.near = 1; c.far = 90;
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.radius = 3;
    this.sun.shadow.camera.updateProjectionMatrix();
    this.buildTargets();
  }

  buildTargets() {
    if (this.rt) { this.rt.dispose(); this.rtHalf.dispose(); this.rtBlur.dispose(); }
    const w = Math.max(2, Math.floor(innerWidth * this.dpr)), h = Math.max(2, Math.floor(innerHeight * this.dpr));
    this.w = w; this.h = h;
    const dt = new THREE.DepthTexture(w, h);
    dt.type = THREE.UnsignedIntType;
    this.rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: this.samples, depthTexture: dt, depthBuffer: true });
    const hw = Math.max(2, w >> 1), hh = Math.max(2, h >> 1);
    this.rtHalf = new THREE.WebGLRenderTarget(hw, hh, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.rtBlur = new THREE.WebGLRenderTarget(hw, hh, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    const common = { near: { value: 1 }, far: { value: 160 }, focus: { value: 26 }, aperture: { value: 2 }, bgBoost: { value: 1.3 }, band: { value: 1.5 } };
    this.cocMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: COC_FS, depthTest: false, depthWrite: false,
      uniforms: { tColor: { value: this.rt.texture }, tDepth: { value: dt }, texel: { value: new THREE.Vector2(1 / w, 1 / h) }, ...THREE.UniformsUtils.clone(common) } });
    this.blurMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: BLUR_FS.replace('__TAPS__', String(this.taps)), depthTest: false, depthWrite: false,
      uniforms: { tHalf: { value: this.rtHalf.texture }, texel: { value: new THREE.Vector2(1 / hw, 1 / hh) }, maxR: { value: 9 } } });
    this.finalMat = new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: FINAL_FS, depthTest: false, depthWrite: false, toneMapped: true,
      uniforms: { tColor: { value: this.rt.texture }, tBlur: { value: this.rtBlur.texture }, tDepth: { value: dt }, time: { value: 0 }, vignette: { value: 0.9 }, fade: { value: 0 }, fadeColor: { value: new THREE.Color() }, dofOn: { value: 1 }, warmth: { value: 0.6 }, lift: { value: 0 }, ...THREE.UniformsUtils.clone(common) } });
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
    this.sun.position.copy(t).addScaledVector(this.sunDir, 40);
  }

  render(dt) {
    this.time += dt;
    const t0 = performance.now();
    const cam = this.camera;
    const u = (m) => {
      m.uniforms.near.value = cam.near; m.uniforms.far.value = cam.far;
      m.uniforms.focus.value = this.dof.focus; m.uniforms.aperture.value = this.dof.aperture; m.uniforms.bgBoost.value = this.dof.bgBoost; m.uniforms.band.value = this.dof.band;
    };
    this.r.setRenderTarget(this.rt);
    this.r.render(this.scene, cam);
    if (this.dofOn) {
      u(this.cocMat);
      this.quad.material = this.cocMat;
      this.r.setRenderTarget(this.rtHalf);
      this.r.render(this.fsScene, this.fsCam);
      this.blurMat.uniforms.maxR.value = 15 * (this.h / 1100);
      this.quad.material = this.blurMat;
      this.r.setRenderTarget(this.rtBlur);
      this.r.render(this.fsScene, this.fsCam);
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
    this.quad.material = this.finalMat;
    this.r.setRenderTarget(null);
    this.r.render(this.fsScene, this.fsCam);
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

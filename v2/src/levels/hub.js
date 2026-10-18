// The house: a dollhouse cut open, one floor per story path, one room per chapter, each with its portal.
import * as THREE from 'three';
import { mesh, rbox, bx } from '../props.js';
import * as T from '../textures.js';
import { buildPortal, floorSign } from '../hub.js';
import { shelfBoard, jarRow, canRow, sack, onions, garlic, broom, pianoBody, bookshelf, chair, diningTable, candles, plateRail, desk, bookStack, faucet, soapBottle, vase } from './house.js';
import { slotTray } from './kit.js';

const FH = 6.5;
const FLOORS = [0, 6.5, 13];
const ROOF = 19.5;
const RW = 14;
const SHAFT = 49.6;
const DECK = 4.2;
const S = 0.24;
const std = (o) => new THREE.MeshStandardMaterial(o);
const cache = {};
const mat = (k, fn) => cache[k] || (cache[k] = fn());
const paper = (a, b2, seed = 4) => mat('p' + a + b2, () => { const m = std({ map: T.wallpaper(a, b2, seed), roughness: 0.88 }); m.userData.worldUV = 4; return m; });
const plaster = (c) => mat('pl' + c, () => { const m = std({ map: T.wallPaint(c), roughness: 0.95 }); m.userData.worldUV = 5; return m; });

function pendant(L, x, ceil, col = '#fff1d6') {
  const b = L.b, M = L.m;
  b.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 6), M.dark, x, ceil - 0.45, -1.2, { cast: false }));
  b.add(mesh(new THREE.ConeGeometry(0.42, 0.36, 18, 1, true), M.brass, x, ceil - 1.02, -1.2, { cast: false }));
  b.add(mesh(new THREE.SphereGeometry(0.13, 12, 8), new THREE.MeshBasicMaterial({ color: col }), x, ceil - 1.16, -1.2, { cast: false }));
}

function backWall(L, x0, x1, y0, y1, m, z = -3.2) {
  const b = L.b, M = L.m;
  b.add(mesh(bx(x1 - x0, y1 - y0, 0.2), m, (x0 + x1) / 2, (y0 + y1) / 2, z - 0.1, { cast: false }));
  b.add(mesh(bx(x1 - x0, 0.28, 0.16), M.woodDark, (x0 + x1) / 2, y0 + 0.14, z + 0.06, { cast: false }));
}

function keys(b, x, y, w) {
  const white = std({ color: '#f4f0e6', roughness: 0.35 }), black = std({ color: '#151110', roughness: 0.3 });
  const n = Math.floor(w / 0.9);
  for (let i = 0; i < n; i++) {
    b.add(mesh(rbox(0.84, 0.3, 2.2, 0.04), white, x + 0.45 + i * 0.9, y, -0.6));
    if (i % 7 !== 2 && i % 7 !== 6 && i < n - 1) b.add(mesh(rbox(0.5, 0.3, 1.3, 0.04), black, x + 0.9 + i * 0.9, y + 0.22, -1.0));
  }
}

function buildLift(L, W) {
  const b = L.b, M = L.m;
  const cx = SHAFT + DECK / 2, top = FLOORS[2];
  for (const x of [SHAFT + 0.12, SHAFT + DECK - 0.12]) for (const z of [-1.3, 1.3]) b.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, ROOF, 8), M.brass, x, ROOF / 2, z));
  b.add(mesh(bx(DECK, ROOF, 0.1), mat('shaftBack', () => std({ color: '#3b2c22', roughness: 0.8 })), cx, ROOF / 2, -3.05, { cast: false }));
  b.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 20), M.iron, cx, ROOF - 0.5, -0.6, { rx: Math.PI / 2 }));
  const cabin = new THREE.Group();
  cabin.position.set(cx, 0, 0);
  cabin.add(mesh(rbox(DECK, 0.3, 2.8, 0.05), M.woodDark, 0, -0.15, -0.1));
  cabin.add(mesh(rbox(DECK + 0.1, 0.16, 2.9, 0.05), M.brass, 0, 3.55, -0.1));
  for (const x of [-DECK / 2 + 0.08, DECK / 2 - 0.08]) for (const z of [-1.35, 1.15]) cabin.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.5, 8), M.brass, x, 1.75, z));
  for (let i = 0; i < 9; i++) cabin.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.5, 6), M.brass, -DECK / 2 + 0.3 + i * (DECK - 0.6) / 8, 1.75, -1.38, { cast: false }));
  for (const y of [1.1, 2.4]) cabin.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, DECK, 8), M.brass, 0, y, -1.38, { rz: Math.PI / 2, cast: false }));
  const panel = mesh(rbox(0.5, 0.8, 0.1, 0.03), M.dark, DECK / 2 - 0.45, 1.5, -1.3);
  cabin.add(panel);
  const btnMat = new THREE.MeshBasicMaterial({ color: '#f2cf63' });
  for (const y of [1.68, 1.32]) cabin.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), btnMat, DECK / 2 - 0.45, y, -1.24, { cast: false }));
  cabin.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff1d6' }), 0, 3.38, -0.3, { cast: false }));
  const cabinLight = new THREE.PointLight('#ffe2b0', 5, 6, 1.6);
  cabinLight.position.set(0, 3.0, 0.8);
  cabin.add(cabinLight);
  const mech = L.mech({ id: 'lift', x: SHAFT, y: -0.3, w: DECK, h: 0.3, dx: 0, dy: top, ease: false, oneWay: true, carry: true, mat: 'wood', group: cabin });
  const cable = mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6), M.iron, cx, 0, -0.6, { cast: false });
  b.add(cable, true);
  const gates = [], dials = [];
  for (const fy of FLOORS) {
    const col = W.addStatic({ x: SHAFT - 0.22, y: fy, w: 0.22, h: 3.4, mat: 'metal', id: 'gate' });
    const g = new THREE.Group();
    g.position.set(SHAFT - 0.11, fy + 3.4, 0);
    for (let i = 0; i < 7; i++) { const bar = mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 6), M.brass, 0, -1.7, -1.3 + i * 0.43); g.add(bar); }
    for (const y of [-0.4, -1.7, -3.0]) g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.7, 6), M.brass, 0, y, 0, { rx: Math.PI / 2 }));
    b.add(g, true);
    b.add(mesh(rbox(0.3, 0.3, 3.0, 0.05), M.woodDark, SHAFT - 0.11, fy + 3.55, 0));
    gates.push({ col, g, k: 0 });
    const dial = new THREE.Group();
    dial.position.set(SHAFT - 0.11, fy + 3.78, 1.52);
    const face = new THREE.Shape(); face.absarc(0, 0, 0.6, 0, Math.PI, false); face.lineTo(0.6, 0);
    dial.add(mesh(new THREE.ShapeGeometry(face, 20), mat('dialFace', () => std({ color: '#efe1c4', roughness: 0.5 })), 0, 0, 0, { cast: false }));
    dial.add(mesh(new THREE.TorusGeometry(0.62, 0.05, 6, 24, Math.PI), M.brass, 0, 0, 0.02, { cast: false }));
    for (let i = 0; i < 3; i++) { const a = Math.PI * (0.8 - i * 0.3); dial.add(mesh(new THREE.CircleGeometry(0.06, 10), new THREE.MeshBasicMaterial({ color: ['#f2cf63', '#a9c8ea', '#f3a46b'][i] }), Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.02, { cast: false })); }
    const needle = new THREE.Group();
    needle.add(mesh(bx(0.04, 0.48, 0.02), M.dark, 0, 0.24, 0.04, { cast: false }));
    dial.add(needle);
    b.add(dial, true);
    dials.push(needle);
  }
  return { mech, gates, dials, cable, light: cabinLight, x0: SHAFT, x1: SHAFT + DECK, floors: FLOORS, top, roof: ROOF };
}

const ROOMS = {
  b1(L, x0, y) {
    const b = L.b;
    backWall(L, x0, x0 + RW, y, y + FH - 0.5, b.m.tiles);
    b.mini(x0 + 0.5, y, -1.15, S, (b) => {
      b.fridge(0, 0.6, 10, 11, [{ y: 4.6 }, { y: 8.2 }]);
      b.jar(1, 4.6, 1.3, 1.8, 'pickle', 'lidGreen');
      b.carton(3.2, 4.6, 1.2, 2.6);
      b.yogurt(5.4, 4.6, 0.9, 1.0, '#b9d3a7');
      b.yogurt(6.6, 4.6, 0.9, 1.0);
      b.butterDish(6.8, 8.2, 2.4, true);
      b.jar(1.4, 8.2, 1.1, 1.4, 'honey', 'lidGold');
      b.jar(3.4, 8.2, 1.1, 1.2, 'jam', 'lidRed');
    });
    b.mini(x0 + 11.5, y, -1.2, S, (b) => {
      b.counter(0, 9, 9);
      b.toaster(0.8, 9, 3.2, 2.4);
      b.mug(6.4, 9, 0.7, 1.4, 'ceramicBlue', -1.0, false);
    });
    pendant(L, x0 + 3.6, y + FH - 0.5, '#e6f0ff');
  },
  b2(L, x0, y) {
    const b = L.b;
    backWall(L, x0, x0 + RW, y, y + FH - 0.5, plaster('#e6d8bf'));
    b.mini(x0 + 0.4, y, -1.2, S, () => {
      shelfBoard(L, 0, 6.6, 21, { d: 3.6 });
      jarRow(L, 0.6, 6.6, 7, -1.6, 2);
      shelfBoard(L, 0, 12.6, 21, { d: 3.6 });
      canRow(L, 1.2, 12.6, 6, -1.5);
      for (let i = 0; i < 3; i++) sack(L, 0.8 + i * 3.2, 0, 3, 3, { col: false, label: i === 0 ? 'Flour' : i === 2 ? 'Sugar' : '', z: (i % 2) * -0.4 });
    });
    b.mini(x0 + 11.6, y, -1.4, S, () => {
      broom(L, 2, 0, -1.6);
      onions(L, 4.8, 0, -1.2);
      garlic(L, 6, 24.5, 5, -2.2);
    });
    pendant(L, x0 + 3.6, y + FH - 0.5, '#fff0c8');
  },
  b3(L, x0, y) {
    const b = L.b;
    backWall(L, x0, x0 + RW, y, y + FH - 0.5, paper('#e8d9c0', '#d6c19e', 3));
    b.add(mesh(bx(6.4, 0.04, 2.6), mat('rug', () => std({ map: T.rug(), roughness: 1 })), x0 + 3.6, y + 0.02, -0.4, { cast: false }));
    b.mini(x0 + 0.5, y, -1.2, S, (b) => {
      pianoBody(L, 0, 12.6, 6.5, 12.5);
      keys(b, 0.6, 6.4, 11.4);
    });
    b.mini(x0 + 11.6, y, -1.6, S, () => bookshelf(L, 0, 0, 8.6, 16, [4, 8, 12], { shelfCols: false }));
    pendant(L, x0 + 3.6, y + FH - 0.5);
  },
  d1(L, x0, y) {
    const b = L.b;
    backWall(L, x0, x0 + RW, y, y + FH - 0.5, b.m.tiles);
    b.mini(x0 + 0.5, y, -1.15, S, (b) => {
      b.counter(0, 9, 21, { drawerRow: false });
      b.drawer(8.6, 5.8, 8, 2.6);
      slotTray(L, 9, 6.1, 7.2);
      b.utensilCrock(2.2, 9, -2.6);
      b.canister(5.2, 9, 0.8, 2.4, 'Sugar', -2.4);
      b.plant(18.6, 9, -2.4, 0.7);
      b.window(3, 12.5, 12, 8, -3.4);
    });
    pendant(L, x0 + 3.6, y + FH - 0.5);
  },
  d2(L, x0, y) {
    const b = L.b;
    backWall(L, x0, x0 + RW, y, y + FH - 0.5, paper('#d9e1d6', '#c3cfc0', 5));
    b.mini(x0 + 0.4, y, -1.0, S, (b) => {
      chair(L, 0, 0, { seatY: 4.6, backTop: 9.6, w: 3 });
      diningTable(L, 3.4, 15, 7.5, {});
      candles(L, 7.6, 7.5, -1.6);
      b.plate(11.6, 7.5, 1.5, -0.6, false);
      chair(L, 18.8, 0, { seatY: 4.6, backTop: 9.6, w: 3, backRight: true });
      plateRail(L, 0.5, 16, 21, {});
    });
    b.mini(x0 + 12, y, -2.0, S, () => vase(L, 3, 0, 5, 0));
    pendant(L, x0 + 3.6, y + FH - 0.5, '#ffe4b0');
  },
  d3(L, x0, y) {
    const b = L.b;
    backWall(L, x0, x0 + RW, y, y + FH - 0.5, paper('#d8dce4', '#c4c9d4', 6));
    const corkM = mat('cork', () => std({ map: T.cork(), roughness: 1 }));
    b.add(mesh(rbox(2.6, 1.6, 0.08, 0.03), b.m.woodDark, x0 + 2.6, y + 4.0, -3.05, { cast: false }));
    b.add(mesh(bx(2.4, 1.4, 0.04), corkM, x0 + 2.6, y + 4.0, -3.0, { cast: false }));
    for (let i = 0; i < 4; i++) b.add(mesh(bx(0.42, 0.36, 0.02), std({ color: ['#f6e7a0', '#f3c4a6', '#bfe0d0', '#c9d6f2'][i], roughness: 0.9 }), x0 + 1.85 + i * 0.5, y + 4.0 + (i % 2 ? 0.3 : -0.2), -2.97, { rz: (i - 1.5) * 0.1, cast: false }));
    b.mini(x0 + 0.5, y, -1.0, S, (b) => {
      desk(L, 0, 19, 7.6, { pedestal: 5 });
      bookStack(L, 13, 7.6, 3, 2.4);
      b.mug(10.2, 7.6, 0.7, 1.4, 'ceramicSage', -1.4, false);
      b.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.6, 8), b.m.brass, 3, 9.4, -1.6, { rz: 0.3 }));
      b.add(mesh(new THREE.ConeGeometry(0.9, 1.1, 16, 1, true), b.m.brass, 2.2, 11.2, -1.6, { rz: 0.9 }));
    });
    b.mini(x0 + 11.7, y, -1.6, S, () => bookshelf(L, 0, 0, 8.2, 16, [4, 8, 12], { shelfCols: false }));
    pendant(L, x0 + 3.6, y + FH - 0.5);
  },
  t1(L, x0, y) {
    const b = L.b;
    backWall(L, x0, x0 + RW, y, y + FH - 0.5, plaster('#f1dfb8'));
    b.mini(x0 + 1.2, y + 2.2, -2.4, S, (b) => b.window(0, 0, 14, 10, 0));
    b.mini(x0 + 0.4, y, -1.0, S, (b) => {
      b.table(0, 7.5, 21, { legH: 7.05 });
      b.plate(4, 7.55, 1.6, -0.6, false);
      const t = b.toast(1.6, 1.6, 0.26); t.position.set(4, 7.95, -0.6); t.rotation.y = 0.3; b.add(t);
      b.butterDish(8.6, 7.5, 2.4, true);
      b.coffeeMug(14.2, 7.5, 0.7, 1.3, -0.8, false);
      b.mug(17.4, 7.5, 0.7, 1.4, 'ceramicBlue', -1.2, false);
    });
    pendant(L, x0 + 3.6, y + FH - 0.5, '#fff1d0');
  },
  t2(L, x0, y) {
    const b = L.b;
    backWall(L, x0, x0 + RW, y, y + FH - 0.5, b.m.tiles);
    b.mini(x0 + 0.4, y, -1.15, S, (b) => {
      b.counter(0, 9, 22, { drawerRow: false });
      b.sink(7, 9, 9, 3.2);
      faucet(L, 11, 9, -2.8);
      const g = soapBottle(L); g.position.set(3.2, 9, -1.2); b.add(g);
      b.dishRack(17, 9, 4.6, 1.4);
      b.plate(18.6, 9.4, 1.4, -1.8, false);
    });
    pendant(L, x0 + 3.6, y + FH - 0.5);
  },
  t3(L, x0, y) {
    const b = L.b;
    backWall(L, x0, x0 + RW, y, y + FH - 0.5, paper('#4a5068', '#3e4459', 7));
    b.mini(x0 + 1.4, y + 2.4, -2.4, S, (b) => b.window(0, 0, 13, 10, 0, { night: true }));
    b.mini(x0 + 0.4, y, -1.15, S, (b) => {
      b.counter(0, 9, 21, { drawerRow: false });
      const g = b.stove(2, 9, 6, 2);
      g[0].material = new THREE.MeshBasicMaterial({ color: '#ff7a2c' });
      b.kettle(6.6, 9.4, 1.0, -1.9);
      b.butterDish(14.4, 9, 2.6, true);
    });
    pendant(L, x0 + 3.6, y + FH - 0.5, '#9db6ff');
  },
};

export default {
  id: 'hub',
  chars: [],
  abilities: [],
  ambient: 0.45,
  killY: -20,
  camDist: 16,
  aperture: 2.6,
  soloCam: true,
  camX: [6.6, 47.4],
  music: 'menu',
  ambience: 'quiet',
  sun: 1.5,
  hemi: 0.32,
  env: 0.3,
  fill: 0.5,
  vignette: 1.05,
  bg: '#1d140f',
  cam: { x: 20, y: 11, dist: 60 },
  wide: { x: 24, y: 10.8, dist: 70, yOff: 0 },
  build(L, W) {
    const b = L.b, M = L.m;
    const outside = plaster('#efe2cc');
    b.add(mesh(bx(220, 0.4, 60), M.woodTable, 27, -1.2, -6, { cast: false }));
    b.add(mesh(bx(220, 90, 0.4), paper('#b9a383', '#a58f70', 9), 27, 30, -22, { cast: false, receive: false }));
    b.add(mesh(rbox(56.6, 0.8, 7.0, 0.1), M.woodDark, 27, -0.6, -0.4));
    b.col(-40, -4, SHAFT + 40, 4, 'wood');
    b.col(SHAFT, -4.6, DECK, 4, 'wood');
    b.col(SHAFT + DECK, -4, 60, 4, 'wood');

    for (const x of [-0.25, 54.25]) {
      b.add(mesh(rbox(0.5, ROOF + 0.5, 6.2, 0.06), outside, x, ROOF / 2, -0.4));
      b.col(x - 0.25, 0, 0.5, ROOF + 2, 'plaster');
    }
    for (const y of FLOORS.slice(1)) {
      b.add(mesh(bx(SHAFT + 0.5, 0.5, 5.6), M.woodTable, (SHAFT - 0.5) / 2, y - 0.25, -0.45, { cast: false }));
      b.add(mesh(rbox(SHAFT + 0.7, 0.22, 0.24, 0.05), M.woodDark, (SHAFT - 0.5) / 2, y - 0.3, 2.35, { cast: false }));
      b.col(-0.5, y - 0.5, SHAFT + 0.5, 0.5, 'wood');
    }
    b.add(mesh(bx(SHAFT, 0.4, 5.6), M.woodTable, SHAFT / 2, -0.2, -0.45, { cast: false }));
    b.add(mesh(bx(DECK, 0.3, 5.6), M.dark, SHAFT + DECK / 2, -0.75, -0.45, { cast: false }));
    b.add(mesh(bx(54 - SHAFT - DECK, 0.4, 5.6), M.woodTable, (SHAFT + DECK + 54) / 2, -0.2, -0.45, { cast: false }));
    b.add(mesh(bx(55, 0.6, 6.0), outside, 27, ROOF + 0.3, -0.45, { cast: false }));
    b.col(-0.5, ROOF, 55, 0.6, 'wood');

    const roofM = std({ color: '#7d4636', roughness: 0.85 });
    const pitch = Math.atan2(6.2, 28.5), rl = Math.hypot(6.2, 28.5) + 1.4;
    for (const s of [-1, 1]) {
      const r = mesh(rbox(rl, 0.6, 6.8, 0.1), roofM, 27 + s * 13.95, ROOF + 0.6 + 3.1, -0.45);
      r.rotation.z = -s * pitch;
      b.add(r);
    }
    const gable = new THREE.Shape();
    gable.moveTo(-27, 0); gable.lineTo(27, 0); gable.lineTo(0, 6.0); gable.closePath();
    b.add(mesh(new THREE.ShapeGeometry(gable), paper('#6b5a4a', '#5e4f40', 2), 27, ROOF + 0.6, -3.3, { cast: false }));
    b.add(mesh(new THREE.TorusGeometry(0.9, 0.12, 8, 24), M.woodDark, 27, ROOF + 2.7, -3.1));
    b.add(mesh(new THREE.CircleGeometry(0.85, 24), M.sky, 27, ROOF + 2.7, -3.2, { cast: false }));
    b.add(mesh(rbox(2, 5, 2, 0.06), mat('brick', () => std({ color: '#8a4a3a', roughness: 0.9 })), 44, ROOF + 4.5, -2));

    const order = { b: 0, d: 1, t: 2 };
    for (const id of Object.keys(ROOMS)) {
      const fl = FLOORS[order[id[0]]], i = +id[1] - 1, x0 = i * RW;
      ROOMS[id](L, x0, fl);
      const light = id === 'b1' ? '#dceaff' : id === 't3' ? '#a9bfff' : id === 't1' ? '#ffe2b0' : '#ffd9a8';
      buildPortal(L, { id, x: x0 + 8.8, y: fl, roomX: x0 + 7, light, lightMax: id === 't3' ? 6 : 9 });
    }
    const DOOR = 3.6;
    for (const fl of FLOORS) {
      for (const px of [14, 28, 42]) {
        const hh = FH - 0.5 - DOOR;
        b.add(mesh(rbox(0.4, hh, 5.6, 0.04), plaster('#e9dcc6'), px, fl + DOOR + hh / 2, -0.45, { cast: false }));
        b.add(mesh(rbox(0.56, hh + 0.1, 0.14, 0.04), M.woodDark, px, fl + DOOR + hh / 2, 2.32, { cast: false }));
        b.col(px - 0.2, fl + DOOR, 0.4, hh, 'plaster');
      }
    }

    backWall(L, 42.2, 54, 0, ROOF, paper('#e3d3b4', '#d2bf9a', 8));
    b.add(mesh(rbox(2.4, 3.8, 0.24, 0.05), M.woodDark, 44.2, 1.9, -3.05));
    b.add(mesh(rbox(1.9, 1.4, 0.06, 0.03), M.glass, 44.2, 2.7, -2.9, { cast: false }));
    b.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), M.brass, 43.4, 1.8, -2.85));
    b.add(mesh(rbox(2.6, 0.06, 1.4, 0.02), std({ color: '#8f5a3c', roughness: 1 }), 44.2, 0.03, -1.6, { cast: false }));
    pendant(L, 46, ROOF, '#fff1d6');
    const hall = new THREE.PointLight('#ffd9a8', 10, 22, 1.4); hall.position.set(48, 10, 3); L.light(hall);
    W.lift = buildLift(L, W);

    floorSign(L, 46.6, 4.5, 'b');
    floorSign(L, 45.9, FLOORS[1] + 4.5, 'd');
    floorSign(L, 45.9, FLOORS[2] + 4.5, 't');

    for (const k of ['fork', 'knife', 'butter']) L.spawn(k, 46.4, 0, -1);
    L.emitter({ type: 'mote', x: 0, y: 0.5, w: 54, h: 19, rate: 6, z0: -2.6, z1: 2 });
    for (const fl of FLOORS) L.cam({ x0: -6, x1: 43, y0: fl - 0.6, y1: fl + FH - 0.6, y: fl + 3.1, lockY: 0.88, dist: 15.5 });
    L.cam({ x0: 42.6, x1: 60, dist: 17.5 });
    L.hint({ x: 42.4, y: 0, w: 7, h: 3, text: 'Walk up to the lift and it comes. Inside, E goes up and S goes down. Each floor is one story.', dur: 7 });
  },
};

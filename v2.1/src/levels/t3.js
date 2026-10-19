// All three III, Goodnight: a cold night kitchen, a heavy stockpot, a warm stove, an oven mitt and the drawer at last.
import * as THREE from 'three';
import { mesh, rbox, bx } from '../props.js';
import { backdrop, slotTray } from './kit.js';
import { shelfBoard } from './house.js';

function stockpot(L) {
  const g = new THREE.Group();
  const M = L.m;
  g.add(mesh(new THREE.CylinderGeometry(1.1, 1.05, 1.7, 28), M.steel, 0, 0.85, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.14, 1.14, 0.12, 28), M.chrome, 0, 1.72, 0));
  g.add(mesh(new THREE.SphereGeometry(0.18, 10, 8), M.dark, 0, 1.85, 0));
  for (const s of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(0.25, 0.06, 6, 12, Math.PI), M.dark, s * 1.15, 1.3, 0, { rz: -s * Math.PI / 2 }));
  return g;
}

function mitt(L) {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  const fab = new THREE.MeshStandardMaterial({ color: '#b5503c', roughness: 1 });
  inner.add(mesh(rbox(0.8, 3.4, 1.6, 0.35, 3), fab, 0, -1.7, 0));
  inner.add(mesh(rbox(0.5, 1.0, 1.2, 0.22, 3), fab, 0.45, -2.6, 0, { rz: 0.4 }));
  inner.add(mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 12), new THREE.MeshStandardMaterial({ color: '#e9d8b6', roughness: 1 }), 0, 0.1, 0));
  g.add(inner);
  return g;
}

export default {
  id: 't3',
  chars: ['fork', 'knife', 'butter'],
  lead: 'butter',
  music: 'night',
  ambience: 'night',
  abilities: ['stab', 'carry', 'carryButter', 'plant', 'cut', 'squish', 'melt', 'cling', 'smear', 'spread', 'bridge'],
  ambient: 0.12,
  killY: 2,
  camDist: 19,
  aperture: 2.0,
  sun: 0.9,
  sunColor: '#9db6ff',
  hemi: 0.1,
  env: 0.12,
  warmth: 0.05,
  fill: 0.25,
  vignette: 1.3,
  bg: '#0c0f18',
  build(L, W) {
    const b = L.b, M = L.m;
    backdrop(L, -12, 72);
    b.counter(-8, 9, 22);
    shelfBoard(L, -2, 12, 9, { d: 3.2, mat: 'woodBoard' });
    b.decor(() => b.dishRack(-1, 12, 6, 1.4));
    b.window(-4, 14, 10, 7, -3.5, { night: true });
    const moon = new THREE.PointLight('#a9c2ff', 6, 30, 1.2); moon.position.set(1, 18, 6); L.light(moon);

    b.col(14, 6.9, 2.4, 0.3, 'wood');
    b.add(mesh(bx(2.4, 0.3, 4.4), M.woodDark, 15.2, 7.05, -0.8, { cast: false }));
    L.box({ id: 'pot', x: 9.2, y: 9, w: 2.2, h: 1.8, weight: 5, mat: 'metal', group: stockpot(L) });
    b.counter(16.4, 9, 13.6);
    const stove = b.stove(19.4, 9, 5, 2);
    stove[0].material = new THREE.MeshBasicMaterial({ color: '#ff7a2c', toneMapped: false });
    const warm = new THREE.PointLight('#ff9a4a', 9, 9, 1.4); warm.position.set(20.6, 10.2, 2); L.light(warm);
    L.heat({ x: 19.4, y: 9, w: 3, h: 2.6, rate: 0.26, fx: 'heat', z0: -0.6, z1: 0.8 });
    L.emitter({ type: 'steam', x: 22.6, y: 11.6, w: 0.4, h: 0.3, rate: 1.2, z0: -1.8, z1: -1.4 });
    b.decor(() => b.kettle(21.8, 9.4, 1.0, -1.9));

    L.heat({ x: 25.6, y: 9, w: 4.4, h: 1.3, rate: 0.22, fx: 'heat', z0: 0.6, z1: 1.6 });
    const vent = new THREE.Group();
    vent.add(mesh(rbox(3.9, 0.62, 0.14, 0.05), M.dark, 0, 0, 0, { cast: false }));
    vent.add(mesh(new THREE.PlaneGeometry(3.6, 0.4), new THREE.MeshBasicMaterial({ color: '#ff8a3c', toneMapped: false }), 0, 0, 0.075, { cast: false, receive: false }));
    for (let i = 0; i < 10; i++) vent.add(mesh(bx(0.09, 0.5, 0.08), M.brass, -1.62 + i * 0.36, 0, 0.1, { cast: false }));
    vent.position.set(27.8, 8.45, 1.72);
    b.add(vent, true);
    b.add(mesh(new THREE.PlaneGeometry(5, 1.8), new THREE.MeshBasicMaterial({ map: L.m.shadowBlob.map, color: '#ff7a2c', transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }), 27.8, 9.5, 0.4, { cast: false, receive: false }), true);
    const tall = { x: 30, y: 9, w: 14, h: 4.6 };
    b.add(mesh(bx(tall.w, tall.h, 4.4), M.tiles, tall.x + tall.w / 2, tall.y + tall.h / 2, -1.0));
    b.add(mesh(rbox(tall.w + 0.4, 0.4, 4.8, 0.06), M.stone, tall.x + tall.w / 2, tall.y + tall.h - 0.2, -0.9));
    b.col(tall.x, tall.y, tall.w, tall.h, 'tile');
    b.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), M.brass, 31.4, 17.4, -0.4, { rz: Math.PI / 2 }));
    const mittG = mitt(L);
    L.rope({ id: 'loop', x: 31.4, y0: 17.4, y1: 16.3, cutFrac: 0.5, attach: () => ({ x: 31.4, y: 16.3 }) });
    L.faller({ id: 'mitt', group: mittG, from: { x: 31.4, y: 16.4, r: 0 }, to: { x: 28.0, y: 12.6, r: 0 }, dur: 0.7, arc: true, when: (W) => !!W.flags.rope_loop, sound: 'cloth', colBefore: null, col: { x: 27.6, y: 9, w: 0.8, h: 3.4, mat: 'soft' } });
    b.window(31, 15, 9, 6, -3.5, { night: true });

    b.counter(44, 9, 12);
    b.drawer(56, 5.8, 6, 2.6);
    slotTray(L, 56.4, 6.1, 5.2);
    b.add(mesh(bx(10, 0.4, 7), M.woodTable, 61, 5.6, -0.5, { cast: false }));
    b.butterDish(51.4, 9, 2.6, true);
    const fridgeLight = new THREE.PointLight('#e8f1ff', 0, 14, 1.3); fridgeLight.position.set(58, 12, 4); L.light(fridgeLight);

    L.spawn('fork', 0.6, 12, 1);
    L.spawn('knife', 1.8, 12, 1);
    L.spawn('butter', 3.2, 12, 1, 0.12);
    L.checkpoint({ x: -20, spawns: { fork: { x: 0.6, y: 12, face: 1 }, knife: { x: 1.8, y: 12, face: 1 }, butter: { x: 3.2, y: 12, face: 1, temp: 0.12 } } });
    L.checkpoint({ x: 16.8, minY: 8.9, maxY: 12, spawns: { fork: { x: 17.2, y: 9, face: 1 }, knife: { x: 17.8, y: 9, face: 1 }, butter: { x: 18.6, y: 9, face: 1, temp: 0.5 } } });
    L.checkpoint({ x: 30.2, minY: 13.4, spawns: { fork: { x: 33, y: 13.6, face: 1 }, knife: { x: 34, y: 13.6, face: 1 }, butter: { x: 35, y: 13.6, face: 1, temp: 0.4 } } });
    L.checkpoint({ x: 44.2, maxY: 12, spawns: { fork: { x: 46, y: 9, face: 1 }, knife: { x: 47, y: 9, face: 1 }, butter: { x: 48, y: 9, face: 1, temp: 0.2 } } });
    L.end({ x: 51.2, y: 5.8, w: 10.6, h: 4.6 });

    L.cam({ x0: -6, x1: 18, dist: 19, y: 11, lockY: 0.4 });
    L.cam({ x0: 18, x1: 32, dist: 20, y: 12, lockY: 0.4 });
    L.cam({ x0: 32, x1: 46, dist: 20, y: 13, lockY: 0.4 });
    L.cam({ x0: 46, x1: 64, dist: 17, y: 9, lockY: 0.45 });

    L.hint({ x: 4, y: 8.8, w: 5, h: 3, text: 'At night Butter freezes solid, and frozen Butter is strong. The pot needs all three of you.', dur: 6 });
    L.hint({ x: 17, y: 8.8, w: 3, h: 3, text: 'The stove is still warm. A soft Butter can smear itself on the tiles.', who: 'butter', dur: 6 });
    L.hint({ x: 24, y: 8.8, w: 5, h: 3, text: 'Smear high on the tiles, stab into the butter, and make a step for Knife.', dur: 6 });
    L.hint({ x: 30.2, y: 13.4, w: 3, h: 3, text: 'An oven mitt hangs by a loop.', who: 'knife', dur: 5 });
    L.hint({ x: 24, y: 8.8, w: 5, h: 3, text: 'Fork climbs the mitt. Soft Butter can climb between the mitt and the tiles.', when: (W) => !!W.flags.rope_loop, dur: 6 });
    L.hint({ x: 46, y: 8.8, w: 4, h: 3, text: 'Home. Fork and Knife in the drawer, Butter on its dish.', dur: 6 });

    L.update((W, dt) => {
      const on = W.flags.end ? 1 : 0;
      fridgeLight.intensity += ((on ? 8 : 0) - fridgeLight.intensity) * Math.min(1, dt * 2);
      warm.intensity = 8 + Math.sin(W.time * 6) * 0.6;
    });
  },

  async intro(S) {
    S.cut(1.8, 13.4, 9, 0);
    S.hold('fork', 1); S.hold('knife', 1); S.hold('butter', 1);
    for (const k of ['fork', 'knife', 'butter']) { const c = S.ch(k); c.anim.blink = 1.2; }
    await S.wait(1.4);
    S.hop('butter');
    S.cam(8, 12, 19, 0.2);
    await S.wait(1.0);
    S.title('Goodnight', 'All three · Chapter III', 4);
    await S.wait(2.0);
    S.release('fork'); S.release('knife'); S.release('butter');
    S.free();
  },

  async outro(S) {
    const W = S.w;
    S.hold('fork'); S.hold('knife'); S.hold('butter');
    S.cam(56.6, 8.8, 11, 0.2);
    await S.wait(0.8);
    for (const k of ['fork', 'knife', 'butter']) S.ch(k).anim.blink = 0.4;
    await S.wait(0.6);
    S.hop('butter');
    await S.wait(0.8);
    for (const k of ['fork', 'knife', 'butter']) { const c = S.ch(k); c.anim.blink = 99; }
    W.fx.emitBox('mote', 50, 7, 12, 6, -2, 3, 20);
    S.cam(55, 10.5, 20, 0.6);
    await S.wait(1.8);
    S.title('Cutlery', 'the end · thank you for playing', 4.5);
    await S.wait(3.0);
  },
};

// Chapter II, The Drawer: Fork and Knife climb out of the drawer and cross the kitchen to the fridge.
import * as THREE from 'three';
import { mesh, rbox, bx } from '../props.js';
import { backdrop, shadowCaster, wallShelf, slotTray, lettuce } from './kit.js';

function rollingPin(L) {
  const M = L.m;
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.42, 0.42, 4.6, 24), M.woodBoard, 0, 0, 0);
  const h1 = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.55, 12), M.woodDark, 0, 2.55, 0);
  const h2 = mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.55, 12), M.woodDark, 0, -2.55, 0);
  const inner = new THREE.Group();
  inner.add(body, h1, h2);
  inner.position.set(-0.45, 2.85, 0);
  g.add(inner);
  return g;
}

function breadBox(L, x, y, w, h) {
  const b = L.b, M = L.m;
  b.add(mesh(rbox(w, h, 3.4, 0.2, 3), M.woodBoard, x + w / 2, y + h / 2, -1.2));
  b.add(mesh(rbox(w - 0.6, h * 0.55, 0.1, 0.05), M.woodDark, x + w / 2, y + h * 0.55, 0.52, { cast: false }));
  for (let i = 0; i < 6; i++) b.add(mesh(bx(w - 0.7, 0.03, 0.04), M.woodBoard, x + w / 2, y + h * 0.32 + i * h * 0.09, 0.58, { cast: false }));
  b.add(mesh(rbox(1.4, 0.2, 0.2, 0.08), M.brass, x + w / 2, y + h * 0.3, 0.62));
  b.col(x, y, w, h, 'wood');
}

function flourBag(L) {
  const g = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ color: '#efe6d4', roughness: 0.95 });
  const band = new THREE.MeshStandardMaterial({ color: '#b5503c', roughness: 0.9 });
  g.add(mesh(rbox(1.6, 1.2, 1.4, 0.18, 3), paper, 0, 0.6, 0));
  g.add(mesh(rbox(1.62, 0.26, 1.42, 0.06), band, 0, 0.62, 0));
  g.add(mesh(rbox(1.3, 0.25, 1.1, 0.1), paper, 0, 1.25, 0, { rz: 0.1 }));
  return g;
}

export default {
  id: 'd1',
  chars: ['fork', 'knife'],
  lead: 'fork',
  music: 'ch2',
  ambience: 'kitchen',
  abilities: ['stab', 'carry', 'plant', 'cut'],
  ambient: 0.45,
  killY: -6,
  camDist: 18.5,
  aperture: 2.0,
  build(L, W) {
    const b = L.b, M = L.m;
    backdrop(L, -12, 72);

    b.drawer(0, 5.8, 7, 2.9);
    slotTray(L, 0.4, 6.1, 6.2);
    b.add(mesh(bx(9, 0.4, 7), M.woodTable, 3.5, 5.6, -0.5, { cast: false }));
    b.add(mesh(bx(9, 9, 6), M.cabinetDark, -1.5, 1.3, -0.6, { cast: false }));
    L.hint({ x: 0, y: 5.8, w: 7, h: 3, text: 'Fork and Knife are two players, or one player switching with Tab.', who: 'fork', dur: 5 });
    L.hint({ x: 3.4, y: 5.8, w: 3.4, h: 3, text: 'Knife sticks into wood. Face the drawer wall and press E.', who: 'knife', dur: 5.5 });
    L.hint({ x: 3.4, y: 5.8, w: 3.4, h: 3, text: 'A planted Knife is springy. Land on it holding jump to fly.', who: 'fork', when: (W) => W.charByKind('knife').state === 'planted', dur: 5 });

    b.counter(7, 9, 13);
    b.counter(25, 9, 20);
    b.counter(45, 9, 13);
    b.window(8.5, 11, 7.5, 6.2);
    L.emitter({ type: 'mote', x: 8, y: 9.5, w: 11, h: 8, rate: 3 });
    b.decor(() => {
      b.plant(10.6, 10.6, -2.9, 0.8);
      b.utensilCrock(16.8, 9, -2.6);
      b.saltPepper(8.2, 9, -1.9);
    });
    b.bread(11, 9, 3, 2.6);
    L.hint({ x: 8.6, y: 9, w: 2.4, h: 2, text: 'Fork sticks into soft things like bread. Press E facing it, then jump to climb.', who: 'fork' });
    L.hint({ x: 8.6, y: 9, w: 2.4, h: 2, text: 'A Fork stuck in the bread makes a step for Knife.', who: 'knife', when: (W) => W.charByKind('fork').state === 'planted' });

    L.item({ id: 'g1', kind: 'grape', x: 15.6, y: 9 });
    L.item({ id: 'g2', kind: 'grape', x: 16.1, y: 9 });
    L.hint({ x: 15, y: 9, w: 2, h: 2, text: 'Fork can pick things up on its tines. E again to throw.', who: 'fork' });

    const sink = b.sink(20, 9, 5);
    L.water(20.15, 24.85, sink.waterY - 0.05);
    b.upperCabinets(17, 9, 17.6, 24);
    L.rope({ id: 'r1', x: 19.3, y0: 17.6, y1: 14.85, cutFrac: 0.85 });
    b.add(mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 12), M.brass, 19.3, 17.45, -0.2), true);
    const pin = rollingPin(L);
    L.faller({ id: 'pin', group: pin, from: { x: 19.75, y: 9, r: 0 }, to: { x: 19.75, y: 9, r: -Math.PI / 2 }, dur: 0.9, colBefore: { x: 18.85, y: 9, w: 0.9, h: 5.7, mat: 'wood' }, col: { x: 19.75, y: 9, w: 5.65, h: 0.84, mat: 'wood' }, when: (W) => !!W.flags.rope_r1, sound: 'woodHeavy', bounce: true });
    L.hint({ x: 16.5, y: 9, w: 2.3, h: 2, text: 'A string holds the rolling pin up. Knife can stick into the pin, jump off it, and cut the string in the air.', who: 'knife', dur: 6 });
    L.hint({ x: 16.5, y: 9, w: 2.3, h: 2, text: 'Knife can stand on your head to reach higher.', who: 'fork', dur: 5 });

    b.decor(() => { b.bottle(26.4, 9, -2.2, 3.2, 'pickle'); b.canister(28.6, 9, 0.7, 2.0, 'Rice', -2.4); }, 0);
    wallShelf(L, 27.6, 13.9, 6.4, { oneWay: false });
    b.decor(() => { b.jar(28.2, 13.9, 1.0, 1.3, 'honey', 'lidGold'); b.jar(31.6, 13.9, 1.0, 1.1, 'jam', 'lidRed'); });
    const cheeseG = b.make(() => b.cheese(29.6, 9, 2.4, 4.6, { noCol: true, d: 2.4 }));
    const topG = new THREE.Group();
    const top = mesh(rbox(2.4, 3.0, 2.4, 0.08), M.cheese, 0, 1.5, 0);
    topG.add(top);
    topG.position.set(30.8, 10.6, 0);
    topG.visible = false;
    b.add(topG, true);
    L.cuttable({
      id: 'cheese', x: 29.6, y: 9, w: 2.4, h: 4.6, food: 'cheese', hold: true, group: cheeseG,
      holdHint: 'The cheese wobbles away. Fork has to stick into it and hold it still.',
      after: { x: 29.6, y: 9, w: 2.4, h: 1.6 },
      onCut: (W, c) => {
        cheeseG.scale.y = 1.6 / 4.6;
        cheeseG.position.y = 9 + 0.8;
        topG.visible = true;
        W.fallers.push({ group: topG, from: { x: 30.8, y: 10.6, r: 0 }, to: { x: 31.4, y: 4.0, r: -1.3 }, dur: 0.75, started: true, t0: W.time, done: false, sound: 'soft', onLand: () => { topG.visible = false; } });
        topG.userData.zOut = true;
      },
    });
    L.update((W, dt) => { if (topG.visible && topG.userData.zOut) topG.position.z = Math.min(4, topG.position.z + dt * 7); });
    L.hint({ x: 26.8, y: 9, w: 2.6, h: 2, text: 'Too tall to climb, nothing to climb over. Hold it with Fork, cut it with Knife.', dur: 6 });

    L.box({ id: 'flour', x: 38.2, y: 9, w: 1.6, h: 1.2, weight: 3, mat: 'cloth', group: flourBag(L) });
    L.hint({ x: 36.2, y: 9, w: 2.2, h: 2, text: 'The flour is too heavy for one. Push it together.', dur: 5 });
    breadBox(L, 45, 9, 13, 2.85);
    b.decor(() => { b.fruitBowl(48, 11.85, -1.6); b.kettle(53.4, 11.85, 0.9, -1.4); });
    L.item({ id: 'g3', kind: 'grape', x: 49.2, y: 11.85 });
    b.upperCabinets(44, 14, 17.6, 24);

    b.fridge(58.6, 5, 11, 12, [], { noLeft: true });
    b.shelf(58.6, 8.6, 11);
    b.shelf(58.6, 12.3, 11);
    b.add(mesh(bx(0.6, 7.9, 5.6), M.plastic, 58.3, 8.35, -0.6));
    b.add(mesh(bx(0.6, 2.2, 5.6), M.plastic, 58.3, 16.4, -0.6));
    b.col(58, 4.4, 0.6, 7.9, 'plastic');
    b.col(58, 15.3, 0.6, 2.2, 'plastic');
    b.add(mesh(rbox(0.7, 0.1, 5.6, 0.04), M.rubber, 58.3, 12.35, -0.6, { cast: false }));
    b.add(mesh(rbox(0.7, 0.1, 5.6, 0.04), M.rubber, 58.3, 15.25, -0.6, { cast: false }));
    b.col(69.6, 4.4, 0.5, 13.1, 'plastic');
    shadowCaster(L, 58.6, 4.6, 11.4, 13.2, 2.5);
    const cold = new THREE.PointLight('#9fc0ff', 7, 14, 1.1); cold.position.set(63, 14, 3.5); L.light(cold);
    const bulbG = b.fridgeBulb(68.4, 16.4);
    b.butterDish(63.4, 12.3, 2.4, true);
    const dent = mesh(rbox(0.9, 0.04, 0.66, 0.02), new THREE.MeshStandardMaterial({ color: '#f1d97a', roughness: 0.2 }), 64.6, 12.52, 0, { cast: false });
    b.add(dent);
    const drips = new THREE.MeshStandardMaterial({ color: '#f3d36a', roughness: 0.15 });
    for (let i = 0; i < 5; i++) b.add(mesh(new THREE.SphereGeometry(0.12 + (i % 2) * 0.04, 10, 6), drips, 66.2 + i * 0.6, 12.33, 0.3 - (i % 3) * 0.2, { sy: 0.3, cast: false }));
    b.decor(() => {
      b.carton(60.0, 12.3, 1.2, 2.6);
      b.yogurt(61.6, 12.3, 0.9, 1.0, '#b9d3a7');
      b.jar(60.4, 8.6, 1.2, 1.7, 'pickle', 'lidGreen');
      lettuce(L, 63, 5, -1.2, 1.1);
    }, -2.0);
    L.ambient({ x0: 58.6, x1: 80, temp: 0.06 });
    L.emitter({ type: 'frost', x: 58.8, y: 5.2, w: 10.6, h: 11.6, rate: 4, z0: -2.6, z1: 1.6 });

    b.decor(() => b.fgJar(24, 6.0, 5.4, 1.5));
    b.decor(() => b.coffeeMug(41, 6.2, 0.9, 1.5, 5.0, false));

    L.spawn('fork', 2.4, 6.26, 1);
    L.spawn('knife', 4.4, 6.26, 1);
    L.checkpoint({ x: -10, spawns: { fork: { x: 2.4, y: 6.26, face: 1 }, knife: { x: 4.4, y: 6.26, face: 1 } } });
    L.checkpoint({ x: 7.2, minY: 8.5, spawns: { fork: { x: 8.4, y: 9, face: 1 }, knife: { x: 9.4, y: 9, face: 1 } } });
    L.checkpoint({ x: 14.2, spawns: { fork: { x: 15.2, y: 9, face: 1 }, knife: { x: 16.2, y: 9, face: 1 } } });
    L.checkpoint({ x: 25.2, spawns: { fork: { x: 26.2, y: 9, face: 1 }, knife: { x: 27.2, y: 9, face: 1 } } });
    L.checkpoint({ x: 32.2, spawns: { fork: { x: 33.4, y: 9, face: 1 }, knife: { x: 34.4, y: 9, face: 1 } } });
    L.checkpoint({ x: 45.2, minY: 11.5, spawns: { fork: { x: 47, y: 11.85, face: 1 }, knife: { x: 48, y: 11.85, face: 1 } } });
    L.end({ x: 60.2, y: 12.2, w: 6.5, h: 2.8 });

    L.cam({ x0: -6, x1: 7.4, dist: 15.5, y: 8.4, lockY: 0.55, x: 3.8, lockX: 0.5 });
    L.cam({ x0: 18, x1: 26, dist: 20.5, y: 12, lockY: 0.35 });
    L.cam({ x0: 26, x1: 34, dist: 19.5, y: 11.2, lockY: 0.3 });
    L.cam({ x0: 56, x1: 72, dist: 18, y: 12.8, lockY: 0.45 });

    L.update((W, dt) => {
      bulbG.visible = true;
    });
  },

  async intro(S) {
    const W = S.w;
    S.cut(3.4, 7.2, 7.5, 0);
    for (const k of ['fork', 'knife']) { const c = S.ch(k); S.hold(k, k === 'fork' ? 1 : -1); c.anim.blink = 2.6; c.anim.nextBlink = 6; }
    S.sfx('creak', 0.5);
    await S.wait(1.8);
    S.sfx('door', 0.4);
    W.cam.shake = 0.2;
    await S.wait(0.9);
    S.ch('fork').anim.blink = 0;
    S.hop('fork');
    await S.wait(0.6);
    S.ch('knife').anim.blink = 0;
    S.ch('knife').anim.twang = 0.8;
    await S.wait(0.8);
    S.face('fork', 1); S.face('knife', -1);
    await S.wait(1.0);
    S.cam(5, 8.6, 12, 0.4);
    S.face('knife', 1);
    S.hop('knife');
    await S.wait(1.2);
    S.title('The Drawer', 'Fork & Knife · Chapter I', 4.2);
    await S.wait(2.6);
    S.release('fork'); S.release('knife');
    S.free();
  },

  async outro(S) {
    S.hold('fork'); S.hold('knife');
    S.cam(64.5, 13.3, 10.5, 0.2);
    await Promise.all([S.walk('fork', 62.8, 0.45, 1), S.walk('knife', 61.8, 0.45, 1)]);
    await S.wait(0.6);
    S.hop('fork');
    await S.wait(0.6);
    S.cam(66.2, 13.0, 9.5, 0.2);
    await S.wait(1.1);
    S.face('fork', -1);
    S.ch('knife').anim.twang = 0.5;
    await S.wait(1.0);
  },
};

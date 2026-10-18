// Chapter III, Breakfast: all three together, from the sink to the breakfast table.
import * as THREE from 'three';
import { mesh, rbox, bx } from '../props.js';
import { backdrop } from './kit.js';

function baguette(L) {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  const crust = new THREE.MeshStandardMaterial({ map: L.m.crust.map, color: '#f2c27e', roughness: 0.8 });
  const body = mesh(new THREE.CapsuleGeometry(0.5, 5.6, 6, 18), crust, 0, 0, 0, { sz: 0.85 });
  inner.add(body);
  const score = new THREE.MeshStandardMaterial({ color: '#f6dcae', roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const cut = mesh(new THREE.CapsuleGeometry(0.07, 0.62, 3, 8), score, 0.05, -2.2 + i * 1.1, 0.4, { rz: 1.0 });
    inner.add(cut);
  }
  inner.position.set(-0.5, 3.3, 0);
  g.add(inner);
  return g;
}

function crock(L) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#6d7f5c', roughness: 0.45 });
  const pts = [[0, 0], [0.92, 0], [1.0, 0.2], [1.02, 1.3], [0.86, 1.52], [0.86, 1.6], [0, 1.6]].map((p) => new THREE.Vector2(p[0], p[1]));
  g.add(mesh(new THREE.LatheGeometry(pts, 28), m, 0, 0, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.14, 28), L.m.woodBoard, 0, 1.62, 0));
  g.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), L.m.woodDark, 0, 1.75, 0));
  return g;
}

function board(L, len) {
  const g = new THREE.Group();
  const inner = mesh(rbox(len, 0.26, 2.2, 0.08), L.m.woodBoard, -len / 2, 0.13, 0);
  const hole = mesh(new THREE.TorusGeometry(0.18, 0.05, 6, 14), L.m.woodDark, -len + 0.4, 0.27, 0, { rx: Math.PI / 2 });
  g.add(inner, hole);
  return g;
}

export default {
  id: 't1',
  chars: ['fork', 'knife', 'butter'],
  lead: 'butter',
  music: 'ch3',
  ambience: 'kitchen',
  abilities: ['stab', 'carry', 'carryButter', 'plant', 'cut', 'squish', 'melt', 'cling', 'smear', 'spread', 'bridge'],
  ambient: 0.45,
  killY: 3,
  camDist: 19,
  aperture: 2.0,
  build(L, W) {
    const b = L.b, M = L.m;
    backdrop(L, -10, 54);
    b.add(mesh(bx(40, 26, 0.3), M.paint, 74, 13, -3.75, { cast: false }));
    b.add(mesh(bx(40, 0.8, 0.4), M.woodDark, 74, 0.4, -3.5, { cast: false }));
    b.add(mesh(bx(40, 0.25, 0.3), M.woodBoard, 74, 13.2, -3.5, { cast: false }));
    b.window(62.5, 13.6, 12, 9);
    b.photo(78.5, 16.5, -3.55, 2.6, 1.9);
    b.photo(57.6, 15.2, -3.55, 1.8, 2.4);
    L.emitter({ type: 'mote', x: 58, y: 9.8, w: 18, h: 10, rate: 5 });

    b.counter(-6, 9, 24);
    b.window(-3, 11, 8, 7);
    b.decor(() => { b.plant(-1.6, 10.6, -2.9, 0.8); b.utensilCrock(5.2, 9, -2.6); b.fruitBowl(1.2, 9, -2.0); b.saltPepper(9.4, 9, -1.9); });
    L.emitter({ type: 'mote', x: -3, y: 9.5, w: 10, h: 8, rate: 3 });

    const tall = { x: 18, y: 9, w: 13, h: 4.6 };
    b.add(mesh(bx(tall.w, tall.h, 4.4), M.tiles, tall.x + tall.w / 2, tall.y + tall.h / 2, -1.0));
    b.add(mesh(rbox(tall.w + 0.4, 0.4, 4.8, 0.06), M.stone, tall.x + tall.w / 2, tall.y + tall.h - 0.2, -0.9));
    b.col(tall.x, tall.y, tall.w, tall.h, 'tile');
    b.window(19.5, 14.6, 10, 6.4);
    L.heat({ x: 18, y: 13.6, w: 13, h: 4, rate: 0.05 });
    L.emitter({ type: 'mote', x: 18, y: 13.6, w: 12, h: 6, rate: 2.5 });
    b.decor(() => { b.plant(26.6, 13.6, -2.4, 0.8); b.bottle(29.6, 13.6, -2.2, 2.6, 'honey'); }, 0);
    b.upperCabinets(6, 11, 17.6, 25);

    const rampLen = 6.6, rampA = Math.PI / 4;
    const rampG = board(L, rampLen);
    const rcx = 18.0 - Math.cos(rampA) * rampLen / 2, rcy = 13.6 - Math.sin(rampA) * rampLen / 2;
    L.rope({ id: 'r3', x: 19.1, y0: 18.4, y1: 16.6, cutFrac: 0.5, attach: () => ({ x: 19.2, y: 16.6 }) });
    L.faller({
      id: 'ramp', group: rampG, from: { x: 19.35, y: 13.6, r: -Math.PI / 2 }, to: { x: 18.0, y: 13.6, r: rampA },
      dur: 0.9, arc: true, when: (W) => !!W.flags.rope_r3, sound: 'woodHeavy',
      colBefore: { x: 19.22, y: 13.6, w: 0.26, h: 6.6, mat: 'wood' },
      col: { x: rcx - rampLen / 2, y: rcy - 0.13, w: rampLen, h: 0.26, rot: rampA, mat: 'wood', slope: true },
    });
    b.add(mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 12), M.brass, 19.1, 18.5, -0.4), true);
    L.hint({ x: 12, y: 9, w: 5.8, h: 3, text: 'Butter: jump and press E against the tiles to smear yourself high on the wall.', who: 'butter', dur: 6 });
    L.hint({ x: 12, y: 9, w: 5.8, h: 3, text: 'Tiles are too hard for Fork, but buttered tiles are not. Jump and stab into Butter.', who: 'fork', when: (W) => W.charByKind('butter').state === 'smear', dur: 6 });
    L.hint({ x: 12, y: 9, w: 5.8, h: 3, text: 'Up on the window ledge something is tied with string.', who: 'knife', when: (W) => W.charByKind('fork').state === 'planted', dur: 5 });

    b.counter(31, 9, 7);
    b.counter(40.3, 9, 11.7);
    b.add(mesh(bx(2.3, 0.3, 4.4), M.woodDark, 39.15, 7.25, -0.8, { cast: false }));
    b.col(38, 7.1, 2.3, 0.3, 'wood');
    b.add(mesh(bx(2.3, 1.7, 0.2), M.cabinetDark, 39.15, 8.15, -2.9, { cast: false }));
    L.box({ id: 'crock', x: 33.4, y: 9, w: 2.0, h: 1.6, weight: 4, mat: 'ceramic', group: crock(L) });
    L.hint({ x: 31.2, y: 9, w: 2.2, h: 2, text: 'Even together, the crock will not budge on dry stone. Something slippery would help.', dur: 6 });
    L.hint({ x: 31.2, y: 9, w: 2.2, h: 2, text: 'Smear on the floor, then let Knife spread you thin.', who: 'butter', dur: 5 });
    L.hint({ x: 31.2, y: 9, w: 3.2, h: 2, text: 'Knife: face the smear and press E to spread it into a slide.', who: 'knife', when: (W) => W.charByKind('butter').state === 'smear', dur: 5 });
    b.decor(() => { b.canister(32.0, 9, 0.7, 2.2, 'Salt', -2.4); b.bottle(36.4, 9, -2.2, 3.0, 'pickle'); });

    const glows = b.stove(42, 9, 6, 2);
    b.decor(() => b.kettle(45.6, 9.5, 1.0, -1.9));
    L.heat({ x: 42.2, y: 9, w: 3, h: 1.8, rate: 0.12, fx: 'heat' });
    L.emitter({ type: 'steam', x: 46.2, y: 12.3, w: 0.6, h: 0.3, rate: 2.5, z0: -1.9, z1: -1.4 });
    glows[0].material = new THREE.MeshBasicMaterial({ color: '#ff8a3c', toneMapped: false });
    const burnGlow = mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: L.m.shadowBlob.map, color: '#ff7a2c', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }), 43.5, 9.45, 0.4, { cast: false, receive: false });
    b.add(burnGlow, true);
    b.upperCabinets(41, 11, 17.6, 25);

    const bag = baguette(L);
    b.add(bag, true);
    bag.position.set(51.4, 9, 0);
    L.cuttable({
      id: 'baguette', x: 50.4, y: 9, w: 1.0, h: 6.6, food: 'bread', hold: true, group: bag,
      holdHint: 'The baguette rocks away from the blade. Fork has to hold it.',
      onCut: (W) => {
        W.fallers.push({ group: bag, from: { x: 51.4, y: 9, r: 0 }, to: { x: 51.4, y: 9, r: -Math.PI / 2 }, dur: 1.0, started: true, t0: W.time, done: false, sound: 'woodHeavy', col: { x: 51.4, y: 9, w: 6.6, h: 1.0, mat: 'soft' }, id: 'baguette_l' });
        W.sfx('creak', 51, 12, 0.8);
      },
    });
    L.hint({ x: 47.8, y: 9, w: 2.6, h: 2.5, text: 'Cut the baguette at the base and it will fall like a tree. Fork holds, Knife cuts.', dur: 6 });

    b.table(57, 9.6, 22, { legH: 9.2 });
    L.kill(52.1, 56.9, 6);
    b.decor(() => {
      b.plate(60, 9.6, 1.6, -1.2);
      b.coffeeMug(64.4, 9.6, 0.75, 1.3, -1.6);
      b.plate(70, 9.6, 1.6, -1.4);
      b.fruitBowl(76, 9.6, -2.0);
    });
    b.plate(66.2, 9.6, 1.8, 0);
    const toast = b.toast(1.9, 1.9, 0.32);
    toast.position.set(68.0, 9.98, 0);
    b.add(toast);
    b.col(67.05, 9.6, 1.9, 0.54, 'soft');
    b.decor(() => b.plant(74, 9.6, -2.6, 0.9));
    b.decor(() => b.fgJar(37, 6.0, 5.2, 1.5));
    b.decor(() => b.coffeeMug(62, 7.2, 1.0, 1.6, 5.2, false));

    L.spawn('fork', 2.2, 9, 1);
    L.spawn('knife', 3.2, 9, 1);
    L.spawn('butter', 12.4, 9, -1, 0.5);
    L.checkpoint({ x: -20, spawns: { fork: { x: 7, y: 9, face: 1 }, knife: { x: 8, y: 9, face: 1 }, butter: { x: 9.2, y: 9, face: 1, temp: 0.5 } } });
    L.checkpoint({ x: 18.2, minY: 13.4, spawns: { fork: { x: 21, y: 13.6, face: 1 }, knife: { x: 22, y: 13.6, face: 1 }, butter: { x: 23.2, y: 13.6, face: 1, temp: 0.6 } } });
    L.checkpoint({ x: 31.2, maxY: 12, spawns: { fork: { x: 31.6, y: 9, face: 1 }, knife: { x: 32.4, y: 9, face: 1 }, butter: { x: 32.6, y: 9, face: 1, temp: 0.55 } } });
    L.checkpoint({ x: 40.5, spawns: { fork: { x: 41, y: 9, face: 1 }, knife: { x: 41.6, y: 9, face: 1 }, butter: { x: 40.6, y: 9, face: 1, temp: 0.5 } } });
    L.checkpoint({ x: 57.2, minY: 9, spawns: { fork: { x: 58.4, y: 9.6, face: 1 }, knife: { x: 59.2, y: 9.6, face: 1 }, butter: { x: 59.8, y: 9.6, face: 1, temp: 0.5 } } });
    L.end({ x: 64.2, y: 9.4, w: 6.4, h: 3 });

    L.cam({ x0: 10, x1: 20, dist: 21, y: 12.3, lockY: 0.4 });
    L.cam({ x0: 20, x1: 31, dist: 20, y: 14.4, lockY: 0.35 });
    L.cam({ x0: 46, x1: 58, dist: 22, y: 11.5, lockY: 0.3 });
    L.cam({ x0: 60, x1: 80, dist: 17, y: 10.6, lockY: 0.4 });

    L.update((W) => {
      const on = 0.75 + Math.sin(W.time * 7) * 0.05 + Math.sin(W.time * 13) * 0.04;
      glows[0].material.color.setRGB(1.0 * on, 0.45 * on, 0.15 * on);
      burnGlow.material.opacity = 0.45 + (on - 0.75) * 1.5;
    });
  },

  async intro(S) {
    const W = S.w;
    S.cut(7.5, 10.5, 9, 0);
    S.hold('fork', 1); S.hold('knife', 1); S.hold('butter', -1);
    await S.wait(0.6);
    await Promise.all([S.walk('fork', 5.6, 0.55, 1), S.walk('knife', 6.4, 0.55, 1), S.walk('butter', 8.4, 0.5, -1)]);
    await S.wait(0.5);
    S.hop('butter');
    await S.wait(0.35);
    S.hop('butter');
    S.ch('knife').anim.twang = 1;
    S.sfx('twang', 0.4);
    await S.wait(0.6);
    S.face('fork', -1); await S.wait(0.25); S.face('fork', 1); S.hop('fork');
    await S.wait(0.9);
    S.cam(14, 12.2, 19, 0.3);
    S.face('butter', 1);
    await S.wait(0.6);
    S.title('Breakfast', 'All three · Chapter I', 4.2);
    await S.wait(2.6);
    S.release('fork'); S.release('knife'); S.release('butter');
    S.free();
  },

  async outro(S) {
    const W = S.w;
    S.hold('fork'); S.hold('knife'); S.hold('butter');
    S.cam(68, 11.0, 11, 0.2);
    await Promise.all([S.walk('fork', 65.8, 0.45, 1), S.walk('knife', 70.4, 0.45, -1), S.walk('butter', 66.9, 0.5, 1)]);
    S.jump('butter');
    await S.walk('butter', 68.0, 0.45, 1);
    await S.wait(0.4);
    S.hop('butter');
    S.ch('knife').anim.twang = 0.6;
    W.fx.emitBox('confetti', 63, 12, 10, 3, -2, 3, 30);
    W.solve(68, 11.2);
    S.cam(68, 11.6, 14, 0.3);
    await S.wait(2.2);
  },
};

// Butter III, The Living Room: books, a piano that plays, a bouncy sofa, a radiator vent and a cold hallway.
import * as THREE from 'three';
import { mesh, rbox, bx } from '../props.js';
import { makeFigure } from '../characters.js';
import { room, partition, door, bookStack, pianoBody, bookshelf, sofa, rugFloor, floorLamp, radiator, frame } from './house.js';

export default {
  id: 'b3',
  chars: ['butter'],
  lead: 'butter',
  music: 'living',
  ambience: 'kitchen',
  abilities: ['squish', 'melt', 'cling'],
  ambient: 0.45,
  killY: -4,
  camDist: 20,
  aperture: 2.0,
  build(L, W) {
    const b = L.b, M = L.m;
    room(L, -8, 102, { wall: 'paper', paper: ['#e4d6bd', '#d3c1a0'], top: 24 });
    partition(L, -3, 0, 24, 1);
    door(L, -1.6, 0, 13, { gap: 0.42, w: 0.6, noCol: true });
    rugFloor(L, 3, 42);

    bookStack(L, 6.8, 0, 2.4, 1.6);
    bookStack(L, 9.2, 0, 2.4, 3.2);
    const bench = new THREE.MeshStandardMaterial({ color: '#2a1d16', roughness: 0.3 });
    b.add(mesh(rbox(6, 0.6, 2.4, 0.08), bench, 14.6, 4.5, 0.2));
    for (const lx of [12, 17.2]) b.add(mesh(bx(0.3, 4.2, 0.3), bench, lx, 2.1, 1.1));
    b.add(mesh(rbox(5.4, 0.25, 2.1, 0.12), new THREE.MeshStandardMaterial({ color: '#6e2f2a', roughness: 0.95 }), 14.6, 4.9, 0.2));
    b.col(11.6, 0, 6, 4.8, 'wood');

    pianoBody(L, 17.6, 15.6, 6.5, 12.5);
    b.col(17.6, 0, 0.9, 6.5, 'wood');
    b.col(18.5, 0, 12.6, 6.0, 'wood');
    L.piano({ id: 'pn', x: 18.5, y: 6.5, keys: 14, kw: 0.9, notes: [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 84] });
    b.col(31.1, 0, 2.1, 6.5, 'wood');
    b.col(31.5, 8.0, 0.5, 4.5, 'wood');
    b.col(17.4, 12.2, 14.6, 0.3, 'wood');
    b.window(21.5, 14.4, 9, 6.2);
    L.heat({ x: 25, y: 6.5, w: 8.2, h: 2.6, rate: 0.12 });
    L.emitter({ type: 'mote', x: 20, y: 6.6, w: 12, h: 12, rate: 3 });

    bookshelf(L, 33.2, 0, 9.8, 14, [3.4, 7.0, 10.5], { shelfCols: false });
    frame(L, 47, 16, 3.2, 2.4);
    frame(L, 52.4, 15.4, 2.2, 3);
    sofa(L, 43, 15, { seatY: 4.4, backY: 9, armY: 6.4, power: [9, 13.8] });

    floorLamp(L, 59.2, 11, { z: -2.4, intensity: 10 });
    radiator(L, 60.2, 0.75, 5.2, 4.2);
    b.col(60.2, 0.75, 5.2, 4.2, 'metal');
    L.heat({ x: 58.4, y: 0, w: 8, h: 5.5, rate: 0.2, fx: 'heat', z0: -0.6, z1: 0.8 });
    b.window(59.5, 8.5, 6, 8);
    const vent = new THREE.MeshStandardMaterial({ color: '#d9d3c7', metalness: 0.6, roughness: 0.4 });
    for (let i = 0; i < 5; i++) b.add(mesh(bx(0.9, 0.08, 1.2), vent, 66.4, 0.1 + i * 0.18, 0, { cast: false }));
    b.col(66, 0, 0.8, 0.92, 'grate', { grate: true, gap: 0.18 });
    b.add(mesh(bx(0.8, 23, 8), M.paintDark, 66.4, 12.4, -0.2, { cast: false }));
    b.col(66, 0.92, 0.8, 24, 'plaster');

    b.add(mesh(bx(36, 24, 0.3), new THREE.MeshStandardMaterial({ color: '#cfd6dc', roughness: 0.9 }), 84, 12, -3.7, { cast: false }));
    L.ambient({ x0: 66.8, x1: 80, temp: 0.2 });
    L.heat({ x: 66.8, y: 0, w: 5.5, h: 3, rate: -0.16, fx: 'frost', z0: -1, z1: 1.2 });
    const bootM = new THREE.MeshStandardMaterial({ color: '#2f4f3c', roughness: 0.5 });
    const boot = new THREE.Group();
    boot.add(mesh(rbox(1.6, 0.6, 1.2, 0.2), bootM, 0, 0.3, 0));
    boot.add(mesh(rbox(0.9, 1.3, 1.0, 0.25), bootM, -0.35, 0.65, 0));
    L.box({ id: 'boot', x: 72.4, y: 0, w: 1.6, h: 1.3, weight: 2, mat: 'soft', group: boot });
    b.add(mesh(bx(22, 2.2, 6), M.stone, 90, 1.1, -0.6));
    b.col(79, 0, 23, 2.2, 'stone');
    b.add(mesh(bx(0.5, 16, 1.2), M.woodDark, 79.2, 10.2, -0.4));
    b.decor(() => b.counter(86, 11.2, 14, { floor: 2.2, front: -1.0, back: -5.0 }));
    for (const [k, x] of [['fork', 91.2], ['knife', 92.4]]) { const f = makeFigure(k, 1); f.position.set(x, 11.2, -3.2); f.rotation.y = -0.3; b.add(f, true); }
    L.hint({ x: 70, y: 0, w: 2.4, h: 2, text: 'The hallway is cold. Frozen Butter can shove the boot to the step.', when: (W) => W.charByKind('butter').hard, dur: 5 });

    L.spawn('butter', 1.6, 0, 1, 0.55);
    L.checkpoint({ x: -20, spawns: { butter: { x: 1.6, y: 0, face: 1, temp: 0.55 } } });
    L.checkpoint({ x: 18.6, minY: 6, spawns: { butter: { x: 19.2, y: 6.5, face: 1, temp: 0.55 } } });
    L.checkpoint({ x: 33.4, minY: 13.8, spawns: { butter: { x: 36, y: 14, face: 1, temp: 0.6 } } });
    L.checkpoint({ x: 58.2, maxY: 3, spawns: { butter: { x: 58.8, y: 0, face: 1, temp: 0.55 } } });
    L.checkpoint({ x: 67, maxY: 3, spawns: { butter: { x: 68.2, y: 0, face: 1, temp: 0.15 } } });
    L.end({ x: 80, y: 2.0, w: 6, h: 3.2 });

    L.cam({ x0: -6, x1: 18, dist: 17, y: 4, lockY: 0.4 });
    L.cam({ x0: 18, x1: 34, dist: 20, y: 9.5, lockY: 0.4 });
    L.cam({ x0: 34, x1: 44, dist: 21, y: 10, lockY: 0.3 });
    L.cam({ x0: 44, x1: 60, dist: 19, y: 6, lockY: 0.3 });
    L.cam({ x0: 60, x1: 80, dist: 17, y: 4, lockY: 0.5 });
    L.cam({ x0: 80, x1: 100, dist: 18, y: 6.5, lockY: 0.4 });

    L.hint({ x: 3, y: 0, w: 3, h: 2, text: 'Hop up the books to the piano bench.', dur: 4 });
    L.hint({ x: 18.6, y: 6.4, w: 3, h: 2, text: 'The keys play as you walk. The sun at the far end softens you.', dur: 5 });
    L.hint({ x: 27, y: 6.4, w: 4, h: 2, text: 'Soft butter clings. Climb between the piano and the bookshelf.', when: (W) => W.charByKind('butter').soft, dur: 6 });
    L.hint({ x: 44, y: 3, w: 6, h: 5, text: 'Hold jump when you land on a cushion to bounce high.', dur: 5 });
    L.hint({ x: 58.4, y: 0, w: 2, h: 2, text: 'The radiator melts you. Melted butter pours through the vent.', dur: 6 });
  },

  async intro(S) {
    S.cut(2.4, 2.4, 8, 0);
    S.hold('butter', 1);
    await S.wait(0.6);
    S.hop('butter');
    await S.wait(0.5);
    S.cam(14, 6.5, 21, 0.4);
    await S.wait(1.4);
    S.title('The Living Room', 'Butter · Chapter III', 4);
    await S.wait(1.6);
    S.release('butter');
    S.free();
  },

  async outro(S) {
    S.hold('butter');
    S.cam(86, 7.4, 15, 0.2);
    await S.walk('butter', 83.4, 0.45, 1);
    await S.wait(0.5);
    S.hop('butter');
    await S.wait(0.4);
    S.hop('butter');
    S.cam(89, 9.4, 13, 0.2);
    await S.wait(2.0);
  },
};

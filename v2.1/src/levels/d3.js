// Fork & Knife III, The Study: a waste basket and a springy knife, a heavy dictionary, a stapler and a falling ruler.
import * as THREE from 'three';
import { mesh, rbox, bx } from '../props.js';
import { makeFigure } from '../characters.js';
import { cork } from '../textures.js';
import { room, partition, desk, basket, bookGroup, stapler, deskLamp, frame, bigPlant } from './house.js';

export default {
  id: 'd3',
  chars: ['fork', 'knife'],
  lead: 'fork',
  music: 'study',
  ambience: 'kitchen',
  abilities: ['stab', 'carry', 'plant', 'cut'],
  ambient: 0.45,
  killY: -4,
  camDist: 20,
  aperture: 2.0,
  build(L, W) {
    const b = L.b, M = L.m;
    room(L, -8, 78, { wall: 'paper', paper: ['#d8dce4', '#c4c9d4'], top: 26, hole: { x0: 58.4, x1: 66.4, y0: 12.6, y1: 19.6 } });
    partition(L, -3, 0, 26, 1);
    bigPlant(L, 2, 0, -2.4, 1.6);
    frame(L, 6, 16, 3, 2.2);

    basket(L, 6.5, 0, 2.6, 3.2);
    desk(L, 11, 25, 7.6, { pedestal: 5 });
    const lamp = deskLamp(L, 18.5, 7.6, -1.6);
    b.decor(() => {
      b.mug(22.4, 7.6, 0.7, 1.4, 'ceramicSage', -1.6, false);
      for (let i = 0; i < 6; i++) b.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), i % 2 ? M.woodBoard : M.lidRed, 23.1 + (i % 3) * 0.12 - 0.12, 9.4, -1.6 + (i % 2) * 0.1, { rz: (i - 2.5) * 0.08 }));
      b.add(mesh(rbox(3.2, 0.08, 2.4, 0.02), new THREE.MeshStandardMaterial({ color: '#f6f3ec', roughness: 0.95 }), 25.5, 7.64, -0.9, { ry: 0.1 }));
      b.add(mesh(rbox(3.0, 0.08, 2.2, 0.02), new THREE.MeshStandardMaterial({ color: '#efe9dc', roughness: 0.95 }), 25.7, 7.72, -0.8, { ry: -0.12 }));
    });
    const corkM = new THREE.MeshStandardMaterial({ map: cork(), roughness: 1 });
    b.add(mesh(rbox(9, 5.5, 0.3, 0.06), M.woodDark, 26, 15.5, -3.4, { cast: false }));
    b.add(mesh(bx(8.5, 5.0, 0.12), corkM, 26, 15.5, -3.22, { cast: false }));
    for (let i = 0; i < 5; i++) b.add(mesh(rbox(1.6, 1.4, 0.03, 0.01), new THREE.MeshStandardMaterial({ color: ['#f6e7a0', '#f3c4a6', '#bfe0d0', '#f6f3ec', '#c9d6f2'][i], roughness: 0.9 }), 23 + i * 1.5, 15 + (i % 2) * 1.6, -3.1, { rz: (i - 2) * 0.08, cast: false }));

    L.box({ id: 'dict', x: 27, y: 7.6, w: 2.2, h: 1.4, weight: 3, mat: 'wood', group: bookGroup(L, 2.2, 1.4) });
    b.col(36, 5.9, 2.5, 0.3, 'wood');
    b.add(mesh(bx(2.5, 0.3, 3.6), M.woodDark, 37.25, 6.05, -0.8, { cast: false }));

    b.add(mesh(bx(10, 7.6, 3.6), M.woodTable, 43.5, 3.8, -1.0));
    for (let i = 0; i < 2; i++) b.add(mesh(rbox(4.6, 6.2, 0.14, 0.05), M.woodDark, 41 + i * 5, 3.9, 0.85, { cast: false }));
    b.col(38.5, 0, 10, 7.6, 'wood');
    stapler(L, 41, 7.6, 2.2);
    b.add(mesh(rbox(10, 0.3, 3.0, 0.05), M.woodTable, 43.5, 12.05, -1.2));
    for (const bx2 of [39.4, 47.6]) b.add(mesh(rbox(0.25, 1.2, 1.4, 0.04), M.brass, bx2, 11.3, -1.9));
    b.col(38.5, 11.9, 10, 0.3, 'wood', { oneWay: true });
    const books = new THREE.MeshStandardMaterial({ color: '#2f4a5e', roughness: 0.7 });
    for (let i = 0; i < 7; i++) b.add(mesh(rbox(0.4, 1.5 + (i % 3) * 0.2, 1.6, 0.03), i % 2 ? books : M.lidRed, 39.6 + i * 0.5, 12.2 + 0.8, -1.8));

    const ruler = new THREE.Group();
    const rulerM = new THREE.MeshStandardMaterial({ color: '#e9d7a8', roughness: 0.5 });
    const rIn = new THREE.Group();
    rIn.add(mesh(rbox(0.4, 6.6, 1.0, 0.04), rulerM, 0, 0, 0));
    for (let i = 0; i < 12; i++) rIn.add(mesh(bx(0.22, 0.04, 1.02), M.dark, 0.08, -3 + i * 0.55, 0, { cast: false }));
    rIn.position.set(-0.2, 3.3, 0);
    ruler.add(rIn);
    ruler.position.set(48.0, 12.2, 0);
    L.toppler({ id: 'ruler', x: 47.6, y: 12.2, w: 0.4, h: 6.6, need: 3, dir: 1, group: ruler, lie: { x: 48.0, y: 12.2, w: 6.6, h: 0.25 }, hint: 'The ruler leans but will not fall. Push together.' });

    b.add(mesh(rbox(16, 0.45, 3.2, 0.06), M.stone, 62.2, 11.98, -0.8));
    b.col(54.4, 0, 16, 12.2, 'plaster');
    L.kill(48.6, 54.3, 6);
    b.add(mesh(bx(16, 11.8, 3), M.paintDark, 62.4, 5.9, -1.0, { cast: false }));
    for (const fx2 of [58.2, 66.6]) b.add(mesh(bx(0.4, 7.4, 0.6), M.woodDark, fx2, 16, -3.5));
    b.add(mesh(bx(8.8, 0.4, 0.6), M.woodDark, 62.4, 19.8, -3.5));
    const kitchenBack = new THREE.MeshStandardMaterial({ color: '#efe5d3', roughness: 0.9 });
    b.add(mesh(bx(12, 12, 0.2), kitchenBack, 62.4, 16, -9.5, { cast: false }));
    b.add(mesh(rbox(10, 0.4, 3, 0.05), M.stone, 62.4, 12.4, -7.2));
    const bu = makeFigure('butter', 1);
    bu.position.set(61.2, 12.6, -7.2);
    bu.rotation.y = 0.2;
    b.add(bu, true);
    const kl = new THREE.PointLight('#ffe2b0', 6, 10, 1.4); kl.position.set(62.4, 16, -6); L.light(kl);

    L.spawn('fork', 2.6, 0, 1);
    L.spawn('knife', 4.0, 0, 1);
    L.checkpoint({ x: -20, spawns: { fork: { x: 2.6, y: 0, face: 1 }, knife: { x: 4.0, y: 0, face: 1 } } });
    L.checkpoint({ x: 11.2, minY: 7.4, spawns: { fork: { x: 13, y: 7.6, face: 1 }, knife: { x: 14, y: 7.6, face: 1 } } });
    L.checkpoint({ x: 38.6, minY: 7.4, maxY: 10.5, spawns: { fork: { x: 39.4, y: 7.6, face: 1 }, knife: { x: 40.2, y: 7.6, face: 1 } } });
    L.checkpoint({ x: 38.6, minY: 12, spawns: { fork: { x: 44, y: 12.2, face: 1 }, knife: { x: 45, y: 12.2, face: 1 } } });
    L.checkpoint({ x: 54.6, minY: 12, spawns: { fork: { x: 56, y: 12.2, face: 1 }, knife: { x: 57, y: 12.2, face: 1 } } });
    L.end({ x: 59.6, y: 12, w: 6, h: 3.2 });

    L.cam({ x0: -6, x1: 12, dist: 18, y: 5, lockY: 0.45 });
    L.cam({ x0: 12, x1: 38, dist: 20, y: 10, lockY: 0.35 });
    L.cam({ x0: 38, x1: 56, dist: 20, y: 12, lockY: 0.4 });
    L.cam({ x0: 56, x1: 72, dist: 17, y: 14.5, lockY: 0.4 });

    L.hint({ x: 3, y: 0, w: 4, h: 3, text: 'Fork can climb the wicker basket. Knife can stick into the desk and become a springboard.', dur: 6 });
    L.hint({ x: 24, y: 7.4, w: 3, h: 3, text: 'The dictionary would fill the gap by the shelf. It is heavy.', dur: 5 });
    L.hint({ x: 38.6, y: 7.4, w: 2.4, h: 3, text: 'Jump on the stapler.', dur: 4 });
  },

  async intro(S) {
    S.cut(4, 3.6, 9, 0);
    S.hold('fork', 1); S.hold('knife', 1);
    await S.wait(0.5);
    S.cam(14, 8.4, 20, 0.5);
    await S.wait(1.2);
    S.ch('knife').anim.twang = 0.6;
    S.title('The Study', 'Fork & Knife · Chapter III', 4);
    await S.wait(2.0);
    S.release('fork'); S.release('knife');
    S.free();
  },

  async outro(S) {
    S.hold('fork'); S.hold('knife');
    S.cam(62.4, 14.4, 11, 0.2);
    await Promise.all([S.walk('fork', 61.4, 0.45, 1), S.walk('knife', 63.2, 0.45, -1)]);
    await S.wait(0.6);
    S.face('fork', 1); S.face('knife', 1);
    S.hop('fork');
    S.ch('knife').anim.twang = 0.7;
    S.cam(62.2, 13.4, 9, 0.2);
    await S.wait(1.8);
  },
};

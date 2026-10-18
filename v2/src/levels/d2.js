// Fork & Knife II, The Dining Room: a chair and a tablecloth, a serving-spoon seesaw, a curtain and a heavy door handle.
import * as THREE from 'three';
import { mesh, rbox, bx } from '../props.js';
import { room, partition, chair, diningTable, sideboard, candles, vase, plateRail, curtainGroup, frame, bigPlant } from './house.js';

export default {
  id: 'd2',
  chars: ['fork', 'knife'],
  lead: 'fork',
  music: 'dining',
  ambience: 'kitchen',
  abilities: ['stab', 'carry', 'plant', 'cut'],
  ambient: 0.45,
  killY: -4,
  camDist: 20,
  aperture: 2.0,
  build(L, W) {
    const b = L.b, M = L.m;
    room(L, -8, 84, { wall: 'paper', paper: ['#d9e1d6', '#c3cfc0'], top: 26 });
    partition(L, -3, 0, 26, 1);
    b.decor(() => { sideboard(L, -1, 9, 7); candles(L, 3, 7, -2.2); }, -2.4);

    chair(L, 10, 0, { seatY: 4.6, backTop: 9.6, w: 3, backRight: true, backFromFloor: true });
    diningTable(L, 15.5, 27, 7.5, { leftCloth: 1.6, drop: 3.6 });
    chair(L, 43.2, 0, { seatY: 4.6, backTop: 9.6, w: 3, backRight: true });

    L.seesaw({ id: 'spoon', x: 24, y: 8.15, len: 5.2, tilt: 0.26, side: -1, power: 23, push: 1.2, pushDir: 1, minV: 5 });
    b.add(mesh(new THREE.TorusGeometry(0.45, 0.2, 10, 20), M.brass, 24, 7.75, 0));
    for (let i = 0; i < 6; i++) b.add(mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.33, 28), i % 2 ? M.ceramicBlue : M.ceramic, 28.4, 7.5 + 0.18 + i * 0.36, 0));
    b.col(27.25, 7.5, 2.3, 2.2, 'ceramic');
    b.decor(() => { vase(L, 36, 7.5, 2.6, -1.6); candles(L, 19.2, 7.5, -1.8); b.fruitBowl(39.5, 7.5, -1.8); }, 0);
    b.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 6, 6), M.brass, 28, 22.5, -1.2));
    const chandelier = b.group(28, 19.4, -1.2, true);
    chandelier.add(mesh(new THREE.TorusGeometry(1.6, 0.08, 8, 30), M.brass, 0, 0, 0, { rx: Math.PI / 2 }));
    for (let i = 0; i < 5; i++) { const a = i * 1.257; chandelier.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.7, 10), new THREE.MeshStandardMaterial({ color: '#f3ead6', emissive: '#ffcf8a', emissiveIntensity: 0.6 }), Math.cos(a) * 1.6, 0.4, Math.sin(a) * 1.6)); }
    const glow = new THREE.PointLight('#ffd49a', 10, 16, 1.4); glow.position.set(28, 18.5, 2); L.light(glow);

    plateRail(L, 22, 13.5, 34.4, { oneWay: true });
    b.window(31.2, 15.2, 6.2, 6.0);
    frame(L, 46, 17.5, 3.0, 2.2);
    frame(L, 51.5, 17.2, 2.2, 2.8);
    const curtain = curtainGroup(L, 2.4, 5.8);
    curtain.position.set(34.2, 13.4, 0.4);
    curtain.scale.y = 0.14;
    b.add(curtain, true);
    const rodM = M.brass;
    b.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.4, 8), rodM, 34.2, 13.55, 0.5, { rz: Math.PI / 2 }), true);
    L.rope({ id: 'tie', x: 34.2, y0: 15.2, y1: 13.9, cutFrac: 0.5, attach: () => ({ x: 34.2, y: 13.9 }) });
    let curtainCol = null;
    L.update((W, dt) => {
      if (!W.flags.rope_tie) return;
      if (curtain.scale.y < 1) {
        curtain.scale.y = Math.min(1, curtain.scale.y + dt * 1.8);
        if (curtain.scale.y >= 1 && !curtainCol) {
          curtainCol = W.addStatic({ x: 33.1, y: 7.6, w: 0.25, h: 5.6, mat: 'soft', id: 'curtain' });
          W.sfx('cloth', 34, 10, 1);
          W.solve(33.2, 10.5);
        }
      }
    });

    b.add(mesh(rbox(0.6, 18, 7.4, 0.04), M.woodDark, 58.9, 9, -0.2, { cast: false }));
    const doorG = new THREE.Group();
    doorG.position.set(58.6, 0, 0);
    const slab = mesh(rbox(0.6, 17.6, 7, 0.05), M.ceramicCream, 0.3, 8.8, -0.2);
    doorG.add(slab);
    b.add(doorG, true);
    const doorCol = W.addStatic({ x: 58.6, y: 0, w: 0.6, h: 30, mat: 'wood', id: 'door' });
    L.plate({ id: 'handle', x: 56.4, y: 11, w: 2.2, need: 3, look: 'handle' });
    L.kill(42.6, 58.3, 3.5);
    let opened = false;
    L.update((W, dt) => {
      if (W.flags.pl_handle && !W.flags.door) W.setFlag('door', 1);
      if (W.flags.door && !opened) { opened = true; W.phys.remove(doorCol); doorCol.meta.off = true; W.sfx('door', 59, 6, 1); W.solve(57.6, 9); }
      if (opened && doorG.rotation.y > -1.4) doorG.rotation.y -= dt * 1.6;
    });
    b.add(mesh(bx(30, 26, 0.3), new THREE.MeshStandardMaterial({ color: '#d8dce4', roughness: 0.9 }), 74, 13, -3.6, { cast: false }));
    bigPlant(L, 6.5, 0, -2.4, 1.8);

    L.spawn('fork', 14.6, 0, 1);
    L.spawn('knife', 13.5, 0, -1);
    L.checkpoint({ x: -20, spawns: { fork: { x: 14.6, y: 0, face: 1 }, knife: { x: 13.5, y: 0, face: -1 } } });
    L.checkpoint({ x: 15.6, minY: 7.3, spawns: { fork: { x: 17, y: 7.5, face: 1 }, knife: { x: 18, y: 7.5, face: 1 } } });
    L.checkpoint({ x: 22.2, minY: 13.3, spawns: { fork: { x: 26, y: 13.5, face: 1 }, knife: { x: 27, y: 13.5, face: 1 } } });
    L.checkpoint({ x: 59.4, maxY: 4, spawns: { fork: { x: 61, y: 0, face: 1 }, knife: { x: 62, y: 0, face: 1 } } });
    L.end({ x: 61, y: -0.2, w: 7, h: 3.2 });

    L.cam({ x0: -6, x1: 16, dist: 19, y: 6, lockY: 0.4 });
    L.cam({ x0: 16, x1: 31, dist: 21, y: 10.5, lockY: 0.45 });
    L.cam({ x0: 31, x1: 60, dist: 20, y: 12, lockY: 0.4 });
    L.cam({ x0: 60, x1: 80, dist: 18, y: 5, lockY: 0.5 });

    L.hint({ x: 12, y: 0, w: 4, h: 3, text: 'The table is high. Fork climbs the tablecloth, Knife climbs the wooden chair.', dur: 6 });
    L.hint({ x: 19, y: 7.4, w: 3, h: 3, text: 'A serving spoon on a napkin ring. One stands on the low end, the other jumps on the high end.', dur: 6 });
    L.hint({ x: 22.2, y: 13.3, w: 10, h: 3, text: 'The curtain is tied up. Knife can cut the ribbon.', who: 'knife', dur: 5 });
    L.hint({ x: 26, y: 7.4, w: 7, h: 3, text: 'The curtain is cloth. Fork can climb it.', who: 'fork', when: (W) => !!W.flags.rope_tie, dur: 5 });
    L.hint({ x: 50, y: 13.3, w: 6, h: 3, text: 'The handle is stiff. It needs both of you.', dur: 5 });
  },

  async intro(S) {
    S.cut(14, 4, 9, 0);
    S.hold('fork', 1); S.hold('knife', 1);
    await S.wait(0.5);
    S.cam(14, 8, 19, 0.5);
    await S.wait(1.2);
    S.hop('fork');
    S.ch('knife').anim.twang = 0.6;
    S.title('The Dining Room', 'Fork & Knife · Chapter II', 4);
    await S.wait(2.0);
    S.release('fork'); S.release('knife');
    S.free();
  },

  async outro(S) {
    S.hold('fork'); S.hold('knife');
    S.cam(64, 4, 13, 0.2);
    await Promise.all([S.walk('fork', 64, 0.5, 1), S.walk('knife', 65.4, 0.5, 1)]);
    await S.wait(0.5);
    S.face('fork', -1);
    await S.wait(0.6);
    S.face('fork', 1);
    S.hop('knife');
    await S.wait(1.2);
  },
};

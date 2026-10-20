// All three II, Washing Up: Butter floats and ferries the others, a soap bottle bridge, and a throw up to the drying shelf.
import * as THREE from 'three';
import { mesh, rbox, bx } from '../props.js';
import { backdrop } from './kit.js';
import { sinkBasin, faucet, soapBottle, teaTowel, shelfBoard } from './house.js';

function towelStack() {
  const g = new THREE.Group();
  const cols = ['#e7d8bd', '#9fb6e0', '#e9b8a4', '#f1ece2'];
  for (let i = 0; i < 4; i++) g.add(mesh(rbox(1.4, 0.38, 1.8, 0.12, 3), new THREE.MeshStandardMaterial({ color: cols[i], roughness: 1 }), (i % 2 ? 0.04 : -0.04), 0.2 + i * 0.4, 0));
  return g;
}

export default {
  id: 't2',
  chars: ['fork', 'knife', 'butter'],
  lead: 'butter',
  music: 'washing',
  ambience: 'kitchen',
  abilities: ['stab', 'carry', 'carryButter', 'plant', 'cut', 'squish', 'melt', 'cling', 'smear', 'spread', 'bridge', 'float'],
  ambient: 0.45,
  killY: 2,
  camDist: 19,
  aperture: 2.0,
  build(L, W) {
    const b = L.b, M = L.m;
    backdrop(L, -12, 72);
    b.counter(-8, 9, 22);
    b.window(-4, 11.2, 9, 7.2);
    b.decor(() => {
      for (let i = 0; i < 5; i++) b.plate(1.0 + (i % 2) * 0.1, 9 + i * 0.26, 1.6, -1.6, false);
      b.mug(5.2, 9, 0.7, 1.3, 'ceramicBlue', -1.8, false);
      b.coffeeMug(7.4, 9, 0.7, 1.3, -2.0, false);
    });
    const s1 = sinkBasin(L, 14, 10, 9, 3.6, { water: 2.4 });
    faucet(L, 19, 9, -2.8);
    b.decor(() => { b.plate(16.5, 6.2, 1.5, -1.6, false); b.mug(20, 6.0, 0.6, 1.2, 'ceramicSage', -1.4, false); });
    b.counter(24, 9, 3.5);
    const s2 = sinkBasin(L, 27.5, 5.5, 9, 3.6, { water: 2.4 });
    faucet(L, 30, 9, -2.8);
    L.toppler({ id: 'soap', x: 25.9, y: 9, w: 1.5, h: 6.2, need: 4, dir: 1, group: (() => { const g = soapBottle(L); g.position.set(27.4, 9, 0); return g; })(), lie: { x: 27.4, y: 9, w: 6.2, h: 1.4 }, mat: 'plastic', sound: 'plateHeavy', hint: 'The soap bottle is heavy. It will take all three of you.' });

    b.counter(33, 9, 27);
    shelfBoard(L, 38, 12, 22, { oneWay: true, d: 3.2, mat: 'woodBoard' });
    for (const bx2 of [39, 46, 53, 59]) b.add(mesh(rbox(0.25, 1.4, 1.4, 0.04), M.brass, bx2, 11.2, -2.2));
    L.box({ id: 'towels', x: 38.1, y: 12, w: 1.4, h: 1.6, weight: 1, mat: 'cloth', settle: true, group: towelStack() });
    b.window(44, 13.6, 10, 6.4);
    b.decor(() => b.dishRack(52.5, 12, 5, 1.4));
    teaTowel(L, 50.2, 11.8, 2.2, 3.0, 1.9);
    b.decor(() => { b.plant(47.4, 12, -2.4, 0.8); b.saltPepper(35.4, 9, -1.8); b.kettle(34.0, 9, 1.0, -2.0); });
    L.emitter({ type: 'mote', x: 44, y: 12, w: 10, h: 7, rate: 3 });
    L.emitter({ type: 'sparkle', x: 15, y: s1.wY, w: 8, h: 0.4, rate: 1.2, z0: -1, z1: 1 });

    L.spawn('fork', 8.2, 9, 1);
    L.spawn('knife', 9.4, 9, 1);
    L.spawn('butter', 11.4, 9, 1, 0.45);
    L.checkpoint({ x: -20, spawns: { fork: { x: 8.2, y: 9, face: 1 }, knife: { x: 9.4, y: 9, face: 1 }, butter: { x: 11.4, y: 9, face: 1, temp: 0.45 } } });
    L.checkpoint({ x: 24.1, minY: 8.9, maxY: 12, spawns: { fork: { x: 24.6, y: 9, face: 1 }, knife: { x: 24.9, y: 9, face: 1 }, butter: { x: 25.2, y: 9, face: 1, temp: 0.45 } } });
    L.checkpoint({ x: 33.4, minY: 8.9, maxY: 11.5, spawns: { fork: { x: 35.5, y: 9, face: 1 }, knife: { x: 36.5, y: 9, face: 1 }, butter: { x: 37.4, y: 9, face: 1, temp: 0.45 } } });
    L.checkpoint({ x: 38.2, minY: 11.8, spawns: { fork: { x: 42, y: 12, face: 1 }, knife: { x: 43, y: 12, face: 1 }, butter: { x: 44, y: 12, face: 1, temp: 0.5 } } });
    L.end({ x: 51, y: 11.8, w: 8, h: 3 });

    L.update((W) => {
      const bu = W.charByKind('butter');
      if (W.flags.top_soap && bu && !bu.puppet && bu.afloat && bu.pos.x > 27.5 && bu.pos.x < 33 && bu.state === 'walk') bu.die();
    });
    L.cam({ x0: -6, x1: 34, dist: 20, y: 10.3, lockY: 0.4 });
    L.cam({ x0: 34, x1: 62, dist: 20, y: 12, lockY: 0.4 });

    L.hint({ x: 10, y: 9, w: 4, h: 2, text: 'Butter floats. Jump in, and the others can ride across on top. A raft, of sorts.', who: 'butter', dur: 6 });
    L.hint({ x: 10, y: 9, w: 4, h: 2, text: 'Fork and Knife sink like, well, cutlery. Ride across on Butter.', who: 'fork', dur: 5 });
    L.hint({ x: 24.1, y: 8.9, w: 3.4, h: 3, text: 'That soap bottle could reach across the second sink, if all three of you push it over.', dur: 6 });
    L.hint({ x: 34, y: 8.9, w: 4, h: 3, text: 'The shelf is too high. Fork can carry Butter. Stab it gently, then throw it up.', who: 'fork', dur: 6 });
    L.hint({ x: 38.2, y: 11.8, w: 3, h: 2, text: 'Push the folded towels off the shelf. They make a perfectly good step.', who: 'butter', dur: 5 });
  },

  async intro(S) {
    S.cut(10, 10.2, 9, 0);
    S.hold('fork', 1); S.hold('knife', 1); S.hold('butter', 1);
    await S.wait(0.6);
    S.cam(19, 10.6, 18, 0.2);
    await S.wait(1.0);
    S.hop('butter');
    S.title('Washing Up', 'All three · Chapter II', 4);
    await S.wait(2.0);
    S.release('fork'); S.release('knife'); S.release('butter');
    S.free();
  },

  async outro(S) {
    const W = S.w;
    S.hold('fork'); S.hold('knife'); S.hold('butter');
    S.cam(55.2, 13.6, 11, 0.2);
    await Promise.all([S.walk('fork', 53.8, 0.45, 1), S.walk('knife', 56.6, 0.45, -1), S.walk('butter', 55.2, 0.45, 1)]);
    await S.wait(0.4);
    for (const k of ['fork', 'knife', 'butter']) S.hop(k);
    W.solve(55.2, 13.4);
    await S.wait(1.8);
  },
};

// Butter II, The Pantry: a cool pantry of jars and sacks, a mousetrap, a strainer and the door to the living room.
import * as THREE from 'three';
import { mesh, rbox, bx } from '../props.js';
import { room, partition, door, shelfBoard, crate, sack, tinCan, bulb, pipe, bucket, strainer, jarRow, canRow, onions, garlic, broom } from './house.js';

export default {
  id: 'b2',
  chars: ['butter'],
  lead: 'butter',
  music: 'pantry',
  ambience: 'quiet',
  abilities: ['squish', 'melt', 'cling'],
  ambient: 0.3,
  killY: -4,
  camDist: 19,
  aperture: 2.0,
  hemi: 0.16,
  env: 0.22,
  sun: 2.4,
  build(L, W) {
    const b = L.b, M = L.m;
    room(L, -8, 90, { wall: 'plaster', top: 24, floor: 2 });
    partition(L, -4, 2, 24, 1);

    b.add(mesh(bx(12, 5, 3.6), M.woodDark, 4, 4.5, -1.0));
    for (let i = 0; i < 3; i++) b.add(mesh(rbox(3.6, 4.0, 0.14, 0.04), M.woodBoard, -0.2 + i * 4, 4.4, 0.85, { cast: false }));
    b.col(-3, 2, 13, 5, 'wood');
    shelfBoard(L, -3, 7.0, 13, { d: 3.6 });
    jarRow(L, -1.5, 7.0, 5, -1.9, 2);
    pipe(L, 6.6, 2, 24, -2.9);
    pipe(L, 8.2, -3, 6.6, -2.9, true);
    L.heat({ x: 2.4, y: 7, w: 7.8, h: 2.8, rate: 0.12, fx: 'heat', z0: -1, z1: 1 });

    const rampA = Math.atan2(-2.6, 7);
    const rampLen = Math.hypot(7, 2.6);
    const ramp = new THREE.Group();
    ramp.add(mesh(rbox(rampLen, 0.25, 2.4, 0.06), M.woodBoard, 0, -0.125, 0));
    ramp.add(mesh(rbox(rampLen, 0.4, 0.12, 0.04), M.woodDark, 0, 0.05, 1.2));
    ramp.position.set(13.5, 5.7, 0);
    ramp.rotation.z = rampA;
    b.add(ramp, true);
    b.col(13.5 - rampLen / 2, 5.7 - 0.25 / Math.cos(rampA) / 2 - 0.125, rampLen, 0.25, 'wood', { rot: rampA });
    crate(L, 10, 2, 7, 2.2);
    const bk = bucket(L, 17, 2, 3.4, 2.4);
    L.water(17.15, 20.25, bk.waterY);

    for (let i = 0; i < 4; i++) sack(L, 20.4 + i * 2.6, 2, 2.6, 2.6, { col: false, label: i === 1 ? 'Flour' : i === 3 ? 'Sugar' : '', z: (i % 2) * -0.3 });
    b.col(20.4, 2, 11, 2.4, 'cloth');
    L.launcher({ id: 'trap', x: 26.8, y: 4.4, w: 2.2, power: 23.5, push: 1.4 });
    b.add(mesh(bx(0.5, 8.2, 3.4), M.woodDark, 31.25, 6.1, -1.0));
    shelfBoard(L, 25.5, 10.2, 5.6, { oneWay: true, d: 3.0 });
    canRow(L, 21.5, 4.4, 4, -1.7);

    b.add(mesh(bx(7.6, 8.2, 3.6), M.woodDark, 34.8, 6.1, -1.0));
    for (let i = 0; i < 2; i++) b.add(mesh(rbox(3.4, 3.4, 0.14, 0.04), M.woodBoard, 33 + i * 3.7, 4.4, 0.85, { cast: false }));
    b.col(31, 2, 7.6, 8.2, 'wood');
    shelfBoard(L, 31, 10.2, 7.6, { d: 3.6 });
    jarRow(L, 31.6, 10.2, 6, -1.9, 4);
    strainer(L, 38.6, 10.2, 2.4, 0.22);
    shelfBoard(L, 41, 10.2, 5.8, { d: 3.0 });
    b.add(mesh(bx(1.6, 13, 2.6), M.glass, 41.8, 16.7, -0.6, { cast: false }));
    for (let i = 0; i < 7; i++) {
      const g = tinCan(L, 1.4, 1.75, ['#c0473a', '#3f6e8c', '#d8a23a', '#5b7f4a'][i % 4], ['Peas', 'Beans', 'Corn', 'Soup'][i % 4]);
      g.position.set(41.8, 10.2 + i * 1.82, -0.2);
      b.add(g);
    }
    b.col(41, 10.2, 1.6, 14, 'metal');
    const lamp = bulb(L, 37.5, 13.4, 24, { intensity: 18, dist: 13 });
    L.heat({ x: 34, y: 10.2, w: 7.4, h: 2.8, rate: 0.17, fx: 'heat', z0: -0.6, z1: 1.0 });

    b.add(mesh(bx(17.4, 4, 3.6), M.woodDark, 47.3, 4, -1.0));
    b.col(38.6, 2, 17.4, 4, 'wood');
    shelfBoard(L, 38.6, 6.0, 13.4, { d: 3.6 });
    const peas = new THREE.MeshStandardMaterial({ color: '#7fb04a', roughness: 0.7 });
    const bag = new THREE.MeshStandardMaterial({ color: '#d7e9f4', roughness: 0.25, transparent: true, opacity: 0.75 });
    b.add(mesh(rbox(2.4, 0.7, 1.8, 0.3, 3), bag, 43.2, 6.35, -1.4));
    for (let i = 0; i < 10; i++) b.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), peas, 42.3 + (i % 5) * 0.4, 6.35 + Math.floor(i / 5) * 0.2, -1.4 + (i % 3) * 0.3));
    L.heat({ x: 39, y: 6, w: 9.6, h: 2.6, rate: -0.34, fx: 'frost', z0: -1.4, z1: 1.2 });
    L.box({ id: 'can', x: 46.6, y: 6, w: 1.1, h: 1.25, weight: 2, mat: 'metal', group: tinCan(L, 1.1, 1.25, '#3f6e8c', 'Beans') });
    L.hint({ x: 44.2, y: 6, w: 2.4, h: 2, text: 'Frozen Butter is heavy. Shove the can over to make a step.', when: (W) => W.charByKind('butter').hard });
    L.hint({ x: 44.2, y: 6, w: 2.4, h: 2, text: 'Too soft to shift a full can. The frozen peas would help.', when: (W) => !W.charByKind('butter').hard });
    crate(L, 52, 6, 6, 2);
    onions(L, 49, 6, -1.6);

    b.add(mesh(bx(12, 6, 3.6), M.woodDark, 64, 5, -1.0));
    b.col(58, 2, 12, 6, 'wood');
    shelfBoard(L, 52, 8, 18, { d: 3.6 });
    const basketM = new THREE.MeshStandardMaterial({ color: '#b18a58', roughness: 1 });
    b.add(mesh(rbox(1.2, 3.8, 2.0, 0.3, 3), basketM, 60.2, 11.5, -0.2));
    b.add(mesh(new THREE.TorusGeometry(0.7, 0.05, 6, 16, Math.PI), M.woodDark, 60.2, 13.4, -0.2));
    b.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), M.dark, 60.2, 14.6, -0.2));
    b.col(59.6, 9.6, 1.2, 3.8, 'cloth');
    const cereal = new THREE.MeshStandardMaterial({ color: '#d8a23a', roughness: 0.6 });
    b.add(mesh(bx(1.2, 5.4, 1.4), cereal, 62.6, 10.7, -0.2));
    b.col(62, 8, 1.2, 5.4, 'plastic');
    shelfBoard(L, 62, 13.4, 12, { d: 3.4 });
    jarRow(L, 64, 13.4, 8, -1.8, 7);
    b.window(55.5, 15.2, 7.0, 5.4);
    L.heat({ x: 54.5, y: 8, w: 7.5, h: 2.6, rate: 0.12 });
    L.emitter({ type: 'mote', x: 54, y: 8.5, w: 9, h: 10, rate: 3 });
    garlic(L, 66, 22, 4.5);
    broom(L, 72, 2);

    door(L, 79.5, 2, 13, { gap: 0.42, glow: true, w: 0.6 });
    L.heat({ x: 75, y: 2, w: 4.6, h: 1.6, rate: 0.14 });
    b.add(mesh(bx(8, 22, 0.3), new THREE.MeshBasicMaterial({ color: '#fff0d6' }), 85, 13, -3.6, { cast: false, receive: false }));
    L.emitter({ type: 'mote', x: 80.2, y: 2.2, w: 4, h: 3, rate: 2 });

    L.spawn('butter', 1.4, 7, 1, 0.35);
    L.checkpoint({ x: -20, spawns: { butter: { x: 1.4, y: 7, face: 1, temp: 0.35 } } });
    L.checkpoint({ x: 20.6, maxY: 6.5, spawns: { butter: { x: 22, y: 4.4, face: 1, temp: 0.55 } } });
    L.checkpoint({ x: 25.6, minY: 10, spawns: { butter: { x: 29.8, y: 10.2, face: 1, temp: 0.55 } } });
    L.checkpoint({ x: 38.7, maxY: 8.5, spawns: { butter: { x: 40.2, y: 6, face: 1, temp: 0.12 } } });
    L.checkpoint({ x: 52.2, minY: 7.8, maxY: 12, spawns: { butter: { x: 54, y: 8, face: 1, temp: 0.3 } } });
    L.checkpoint({ x: 62, minY: 13, spawns: { butter: { x: 64, y: 13.4, face: 1, temp: 0.6 } } });
    L.checkpoint({ x: 74.5, maxY: 4.5, spawns: { butter: { x: 76, y: 2, face: 1, temp: 0.6 } } });
    L.end({ x: 80.3, y: 1.8, w: 5, h: 3 });

    L.cam({ x0: -6, x1: 20, dist: 18, y: 7.6, lockY: 0.4 });
    L.cam({ x0: 20, x1: 32, dist: 20, y: 8.5, lockY: 0.55 });
    L.cam({ x0: 32, x1: 52, dist: 19, y: 9, lockY: 0.4 });
    L.cam({ x0: 52, x1: 76, dist: 19, y: 11, lockY: 0.35 });
    L.cam({ x0: 76, x1: 90, dist: 16, y: 5, lockY: 0.5 });

    L.hint({ x: 1, y: 7, w: 4, h: 2, text: 'The pipe is warm. Soft butter slides fast downhill, fast enough to fly.', dur: 6 });
    L.hint({ x: 22, y: 4.4, w: 3, h: 2, text: 'Step on the mousetrap. Hold jump to fly higher.', dur: 5 });
    L.hint({ x: 31.5, y: 10.2, w: 4, h: 2, text: 'Under the bulb Butter melts. Melted butter pours through a strainer.', dur: 6 });
    L.hint({ x: 55, y: 8, w: 4, h: 2, text: 'Soft butter clings between the basket and the box. Jump from wall to wall.', when: (W) => W.charByKind('butter').soft, dur: 6 });
    L.hint({ x: 75, y: 2, w: 3, h: 2, text: 'Hold S to squish under the door.', dur: 5 });

    L.update((W) => { lamp.light.intensity = 17 + Math.sin(W.time * 23) * 0.4; });
  },

  async intro(S) {
    const bu = S.ch('butter');
    S.cut(1.6, 8.2, 8, 0);
    S.hold('butter', 1);
    bu.anim.blink = 1.2;
    await S.wait(1.4);
    S.hop('butter');
    await S.wait(0.6);
    S.cam(6, 8.6, 14, 0.2);
    await S.walk('butter', 3.2, 0.45, 1);
    S.title('The Pantry', 'Butter · Chapter II', 4);
    await S.wait(2.2);
    S.release('butter');
    S.free();
  },

  async outro(S) {
    S.hold('butter');
    S.cam(82, 4.2, 10, 0.2);
    await S.walk('butter', 83, 0.45, 1);
    await S.wait(0.6);
    S.hop('butter');
    await S.wait(1.4);
  },
};

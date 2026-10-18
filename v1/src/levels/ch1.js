// Chapter I, Cold Start: Butter alone, from the fridge to the empty cutlery drawer.
import * as THREE from 'three';
import { mesh, rbox, bx } from '../props.js';
import { backdrop, shadowCaster, eggCarton, bottle, lettuce, carrot, hutch, wallShelf, wireRack, iceCubes, soapRack, slotTray } from './kit.js';

export default {
  id: 1,
  chars: ['butter'],
  lead: 'butter',
  music: 'ch1',
  ambience: 'fridge',
  abilities: ['squish', 'melt', 'cling'],
  ambient: 0.45,
  killY: -6,
  camDist: 19,
  aperture: 2.0,
  hemi: 0.16,
  env: 0.22,
  build(L, W) {
    const b = L.b, M = L.m;
    backdrop(L, 11.6, 64);
    b.add(mesh(bx(30, 30, 0.3), M.paintDark, -4, 12, -4.2, { cast: false }));

    b.fridge(0, 5, 11, 12, [], { noRight: true });
    b.shelf(0, 9, 11);
    b.shelf(3, 13, 8);
    const plastic = M.plastic;
    b.add(mesh(bx(0.6, 7.0, 5.6), plastic, 11.3, 7.9, -0.6));
    b.add(mesh(bx(0.6, 5.7, 5.6), plastic, 11.3, 14.67, -0.6));
    b.add(mesh(bx(0.66, 0.08, 5.6), M.rubber, 11.3, 11.42, -0.6, { cast: false }));
    b.add(mesh(bx(0.66, 0.08, 5.6), M.rubber, 11.3, 11.8, -0.6, { cast: false }));
    const slitGlow = mesh(new THREE.PlaneGeometry(0.62, 0.34), new THREE.MeshBasicMaterial({ color: '#ffe3b0', toneMapped: false }), 11.3, 11.61, 1.1, { cast: false, receive: false });
    b.add(slitGlow, true);
    b.col(11, 4.4, 0.6, 7.0, 'plastic');
    b.col(11, 11.82, 0.6, 5.68, 'plastic');
    b.add(mesh(rbox(1.0, 0.22, 2.0, 0.05), M.plasticDim, 10.5, 11.29, 0.4));
    b.add(mesh(new THREE.BoxGeometry(1.0, 0.5, 0.06), M.glass, 10.5, 11.6, 1.45, { cast: false }));
    b.col(10, 11.18, 1.0, 0.22, 'plastic', { oneWay: true });
    bottle(L, 10.6, 11.4, -1.6, 1.6, '#cfe0d0');
    const bulb = b.fridgeBulb(10.25, 12.5);
    const bulbLight = b.lights[b.lights.length - 1];
    bulbLight.intensity = 0;
    shadowCaster(L, 0, 4.6, 11.6, 13.2, 2.5);
    const cold1 = new THREE.PointLight('#9fc0ff', 0, 14, 1.1); cold1.position.set(3, 11, 3.5); L.light(cold1);
    const cold2 = new THREE.PointLight('#9fc0ff', 0, 14, 1.1); cold2.position.set(7.5, 15.5, 3.5); L.light(cold2);
    L.ambient({ x0: -5, x1: 11.05, temp: 0.06 });
    L.heat({ x: 9.5, y: 11.25, w: 1.6, h: 1.55, rate: 0.15, fx: 'heat', when: (W) => !!W.flags.bulb, z0: -0.5, z1: 0.8 });
    L.emitter({ type: 'frost', x: 0.2, y: 5.2, w: 10.6, h: 11.6, rate: 5, z0: -2.6, z1: 1.6 });

    b.butterDish(8.2, 13, 2.4, true);
    const ham = new THREE.MeshStandardMaterial({ color: '#e7a7a2', roughness: 0.35 });
    b.add(mesh(rbox(1.0, 0.42, 1.6, 0.1), ham, 6.7, 13.21, 0));
    b.add(mesh(rbox(1.04, 0.1, 1.64, 0.04), M.plastic, 6.7, 13.4, 0, { cast: false }));
    b.col(6.2, 13, 1.0, 0.42, 'plastic');
    eggCarton(L, 4.0, 13, 1.8, 0.85);
    b.decor(() => {
      b.carton(5.0, 13, 1.2, 2.6, { text: 'Milk', sub: 'whole · 1 L', bg: '#fbfaf5', fg: '#3c6aa1', band: '#a9c6e6' });
      b.jar(7.6, 13, 1.1, 1.4, 'honey', 'lidGold');
      b.yogurt(3.4, 13, 0.9, 1.0, '#e9b8c4');
    }, -2.0);
    b.decor(() => {
      b.yogurt(0.6, 9, 0.9, 1.0, '#b9d3a7');
      b.yogurt(1.6, 9, 0.9, 1.0, '#e9b8c4');
      b.jar(6.6, 9, 1.2, 1.7, 'pickle', 'lidGreen');
      b.carton(8.6, 9, 1.0, 2.2, { text: 'Juice', sub: 'orange', bg: '#f6c35a', fg: '#7a3f12', band: '#ef8d34' });
    }, -2.1);
    b.decor(() => { lettuce(L, 2.6, 5, -1.2, 1.1); carrot(L, 6.2, 5.6, -0.6, 0.2); carrot(L, 7.4, 5.4, -1.4, -0.3); }, 0);
    b.add(mesh(bx(10.8, 3.8, 0.1), new THREE.MeshStandardMaterial({ color: '#e3f0f2', transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false }), 5.5, 6.9, 1.6, { cast: false }));
    const jar = L.box({ id: 'jar', x: 4.2, y: 9, w: 1.3, h: 1.15, weight: 2, mat: 'glass', group: b.make(() => b.jar(4.2, 9, 1.3, 1.15, 'jam', 'lidRed')) });

    b.counter(11.6, 9, 28.4);
    b.counter(44.5, 9, 7.5);
    const sink = b.sink(40, 9, 4.5);
    L.water(40.15, 44.35, sink.waterY - 0.05);
    soapRack(L, 42.9, 8.35, 1.45);

    b.cereal(12.8, 9, 1.2, 4.6);
    b.window(13.5, 10.8, 9, 7.8);
    L.heat({ x: 11.6, y: 9, w: 2.9, h: 6.5, rate: 0.055 });
    L.heat({ x: 14.4, y: 9, w: 8.4, h: 6, rate: 0.03 });
    b.decor(() => {
      b.plant(15.0, 10.6, -2.9, 0.8);
      b.plant(21.2, 10.6, -2.9, 0.9);
      b.utensilCrock(17.8, 9, -2.6);
      b.fruitBowl(15.6, 9, -2.0);
    });
    b.mug(20.6, 9, 0.7, 1.2, 'ceramicSage');
    L.toaster({ id: 't1', x: 22.0, y: 9, power: 20.5, delay: 1.6, push: 2.2 });
    hutch(L, 26.5, 9, 6.9, 6.35);
    wallShelf(L, 24.0, 15.6, 9.4);
    b.decor(() => {
      b.canister(25.4, 15.6, 0.55, 1.4, 'Tea', -1.0);
      b.bottle(29.0, 15.6, -1.0, 2.6, 'honey');
      b.canister(31.3, 15.6, 0.6, 1.6, 'Oats', -1.0);
    });
    b.window(25.6, 17.2, 7.2, 4.2);
    L.heat({ x: 23.6, y: 15.4, w: 12.4, h: 3.2, rate: 0.13, fx: 'heat', z0: -0.5, z1: 1 });
    wireRack(L, 33.4, 15.6, 2.6);
    b.upperCabinets(36, 3.6, 15.6, 23);
    b.col(36, 15.6, 3.6, 8, 'wood');
    b.upperCabinets(45, 9, 15.6, 23);
    L.emitter({ type: 'mote', x: 12, y: 9.5, w: 11, h: 9, rate: 3 });
    L.emitter({ type: 'mote', x: 25, y: 15.6, w: 9, h: 5, rate: 2 });

    iceCubes(L, 34.0, 38.0, 9);
    L.heat({ x: 33.4, y: 9, w: 6.4, h: 2.2, rate: -0.3, fx: 'frost', z0: -1.2, z1: 1.2 });
    L.box({ id: 'sponge', x: 38.2, y: 9, w: 1.4, h: 0.8, weight: 2, mat: 'soft', floats: true, group: b.make(() => b.sponge(38.2, 9, 1.4, 0.8)) });
    L.hint({ x: 36.4, y: 9, w: 2.0, h: 2, text: 'The sponge is soaked and heavy. Only frozen-solid Butter could shove it.', when: (W) => !W.charByKind('butter').hard });

    b.towel(47.5, 8.6, 1.9, 1.8, 2.6);
    b.decor(() => { b.saltPepper(46.2, 9, -1.8); b.kettle(48.6, 9, 1.0, -1.6); b.plant(50.6, 9, -2.6, 0.7); });
    const clk = b.clock(48.5, 18.6, -3.3);
    b.photo(41.8, 17.5, -3.35, 2.4, 1.7);
    b.drawer(52, 5.8, 6, 2.6);
    slotTray(L, 52.4, 6.1, 5.2);
    b.add(mesh(bx(10, 0.4, 7), M.woodTable, 57, 5.6, -0.5, { cast: false }));
    b.decor(() => b.fgJar(19, 6.2, 5.2, 1.5));
    b.decor(() => b.coffeeMug(30.5, 6.6, 0.9, 1.5, 5.0, false));
    b.decor(() => b.plant(49.5, 4.8, 5.4, 1.2));

    L.spawn('butter', 9.4, 13.2, -1, 0.08);
    L.checkpoint({ x: -10, spawns: { butter: { x: 9.4, y: 13.2, face: -1, temp: 0.08 } } });
    L.checkpoint({ x: -10, maxY: 12, spawns: { butter: { x: 1.6, y: 9, face: 1, temp: 0.08 } } });
    L.checkpoint({ x: 11.65, spawns: { butter: { x: 12.2, y: 9, face: 1, temp: 0.55 } } });
    L.checkpoint({ x: 14.2, maxY: 12, spawns: { butter: { x: 16.4, y: 9, face: 1, temp: 0.6 } } });
    L.checkpoint({ x: 33.4, maxY: 12, spawns: { butter: { x: 35.2, y: 9, face: 1, temp: 0.08 } } });
    L.checkpoint({ x: 44.6, spawns: { butter: { x: 46, y: 9, face: 1, temp: 0.3 } } });
    L.end({ x: 52.3, y: 5.9, w: 5.4, h: 2.6 });

    L.cam({ x0: -6, x1: 11.2, dist: 17.5, x: 5.5, lockX: 0.55, y: 11.4, lockY: 0.45 });
    L.cam({ x0: 11.2, x1: 15.5, dist: 19, y: 11.6, lockY: 0.3 });
    L.cam({ x0: 18, x1: 36, dist: 22, y: 13, lockY: 0.45 });
    L.cam({ x0: 36, x1: 46, dist: 19.5 });
    L.cam({ x0: 50, x1: 60, dist: 18.5, y: 8.6, lockY: 0.4 });

    L.hint({ x: 6, y: 12.8, w: 3, h: 2, text: 'A and D to walk. W or Space to jump.' });
    L.hint({ x: 2.6, y: 9, w: 3.5, h: 2, text: 'Frozen Butter is heavy enough to push the jar. Walk into it.' });
    L.hint({ x: 9.5, y: 11.3, w: 1.6, h: 1.4, text: 'The light is warm. Wait until you soften, then hold S to squish through the gap.', when: (W) => W.charByKind('butter').temp < 0.42 });
    L.hint({ x: 11.6, y: 9, w: 1.3, h: 1.5, text: 'Soft in the sun, Butter sticks to walls. Jump into a wall and hold toward it, then jump again.', dur: 6, when: (W) => W.time > 2 });
    L.hint({ x: 19.5, y: 9, w: 1.5, h: 1.5, text: 'Hop into the toaster slot.' });
    L.hint({ x: 31, y: 15.6, w: 2.4, h: 1.5, text: 'Melted butter seeps through grates.', when: (W) => !W.charByKind('butter').melted });

    L.update((W, dt) => {
      const on = W.flags.bulb ? 1 : 0;
      const k = 1 - Math.exp(-dt * 6);
      bulbLight.intensity += ((on ? 14 + Math.sin(W.time * 31) * 0.3 : 0) - bulbLight.intensity) * k;
      cold1.intensity += ((on ? 9 : 4) - cold1.intensity) * k;
      cold2.intensity += ((on ? 8 : 3.5) - cold2.intensity) * k;
      bulb.visible = true;
      slitGlow.visible = on > 0;
      clk.minute.rotation.z = -W.time * 0.02 - 0.4;
      const bu = W.charByKind('butter');
      if (bu) W.game.audio.ambienceMix(bu.pos.x < 11.3 ? 'fridge' : 'kitchen');
    });
  },

  introSkipped(S) { S.w.setFlag('bulb', 1); },

  async intro(S) {
    const W = S.w, bu = S.ch('butter');
    S.cut(9.4, 13.7, 7.5, 0);
    S.hold('butter', -1);
    bu.anim.blink = 3.2;
    bu.anim.nextBlink = 6;
    await S.wait(2.2);
    S.sfx('door', 0.5);
    await S.wait(0.5);
    W.setFlag('bulb', 1);
    S.cam(9.0, 13.6, 9.5, 0);
    await S.wait(1.2);
    bu.anim.blink = 0;
    S.hop('butter');
    await S.wait(0.9);
    S.face('butter', 1);
    await S.wait(0.7);
    S.face('butter', -1);
    await S.wait(0.6);
    S.cam(6.0, 13.2, 15, 0.2);
    await S.walk('butter', 7.7, 0.45);
    S.title('Cold Start', 'Chapter I', 4.2);
    await S.wait(2.4);
    S.release('butter');
    S.free();
  },

  async outro(S) {
    const W = S.w, bu = S.ch('butter');
    S.hold('butter');
    S.intensity(0.3);
    S.cam(55, 7.6, 11.5, 0.2);
    await S.wait(1.2);
    await S.walk('butter', 53.9, 0.35, 1);
    await S.wait(1.1);
    S.hop('butter');
    await S.walk('butter', 55.6, 0.35, 1);
    await S.wait(1.3);
    S.face('butter', -1);
    await S.wait(0.8);
    S.face('butter', 1);
    bu.anim.blink = 0.6;
    await S.wait(1.0);
    S.cam(50, 10.5, 24, 1.2);
    await S.wait(3.0);
    await S.fade(true, 1600);
  },
};

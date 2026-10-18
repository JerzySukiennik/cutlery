// Menu scene: the three of them on a sunny counter, idling while the camera breathes.
import { backdrop } from './kit.js';

export default {
  id: 'menu',
  chars: ['fork', 'butter', 'knife'],
  abilities: [],
  ambient: 0.45,
  camDist: 15,
  aperture: 2.6,
  cam: { x: 3.2, y: 11.2, dist: 14.5, yOff: 0 },
  build(L, W) {
    const b = L.b;
    backdrop(L, -20, 40);
    b.counter(-20, 9, 60);
    b.window(-2, 11, 8, 8);
    b.upperCabinets(14, 14, 16, 23);
    b.decor(() => {
      b.plant(0.5, 10.6, -2.9, 0.8);
      b.plant(4.6, 10.6, -2.9, 0.7);
      b.utensilCrock(9.6, 9, -2.6);
      b.canister(11.2, 9, 0.8, 2.4, 'Sugar', -2.4);
      b.canister(13.1, 9, 0.75, 1.9, 'Coffee', -2.4);
      b.fruitBowl(-3.5, 9, -2.2);
      b.saltPepper(7.6, 9, -1.9);
      b.coffeeMug(-0.6, 9, 0.62, 1.15, -0.6, false);
      b.cereal(-6.6, 9, 1.3, 4.4, -1.6, false);
      b.fgJar(9.0, 7.6, 5.5, 1.5);
    });
    b.board(7.8, 9, 4.4, 0.32, 0, -1.6);
    const toastG = b.toast(1.6, 1.6, 0.26);
    toastG.position.set(9.8, 9.5, -1.6);
    toastG.rotation.y = 0.3;
    b.add(toastG);
    b.decor(() => b.plate(8.4, 9.32, 1.4, -1.6, false));
    L.spawn('fork', 4.6, 9, 1);
    L.spawn('butter', 6.1, 9, -1, 0.45);
    L.spawn('knife', 7.5, 9, -1);
    L.emitter({ type: 'mote', x: -4, y: 9.5, w: 14, h: 9, rate: 4, z0: -2, z1: 4 });
    L.update((W, dt) => {
      const t = W.time;
      W.cam.story = { x: 3.2 + Math.sin(t * 0.07) * 0.5, y: 11.2 + Math.sin(t * 0.11) * 0.2, dist: 14.5 + Math.sin(t * 0.05) * 0.5, yOff: 0 };
      const f = W.charByKind('fork'), k = W.charByKind('knife'), bu = W.charByKind('butter');
      if (Math.floor(t / 7) !== W._beat) {
        W._beat = Math.floor(t / 7);
        const r = W._beat % 4;
        if (r === 1 && bu) bu.anim.squashV -= 9;
        if (r === 2 && f) f.face = -f.face;
        if (r === 3 && k) k.anim.twang = 0.5;
      }
    });
  },
};

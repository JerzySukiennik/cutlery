// Test harness: deterministic stepping of the game world with scripted inputs, plus manual renders.
const base = () => ({ x: 0, up: false, down: false, jump: false, jumpPressed: false, action: false, actionPressed: false, swapPressed: false, pausePressed: false, skip: false });

window.st = () => {
  const w = game.world;
  return {
    b: w.chars.map((c) => [c.kind, +c.pos.x.toFixed(2), +c.pos.y.toFixed(2), c.state, c.kind === 'butter' ? +c.temp.toFixed(2) : c.grounded]),
    flags: { ...w.flags },
    t: +w.time.toFixed(1),
    movers: w.movers.map((m) => [m.id, +m.pos.x.toFixed(2), +m.pos.y.toFixed(2)]),
  };
};

window.sim2 = (sec, f) => {
  const w = game.world;
  const n = Math.round(sec * 60);
  for (let i = 0; i < n; i++) {
    const t = i / 60;
    const r = f ? f(t, i) : {};
    const inputs = {};
    for (const k in r) inputs[k] = Object.assign(base(), r[k]);
    w.tick(1 / 60, inputs);
    if (game.net) game.net.publish(w);
  }
  return st();
};

window.prep = () => {
  const s = document.createElement('style');
  s.textContent = '*{transition:none!important;animation:none!important}';
  document.head.appendChild(s);
  document.getElementById('loading').style.display = 'none';
  document.getElementById('fade').classList.remove('on');
};

window.shot = (x, y, dist, n = 40) => {
  const g = game, w = g.world;
  for (let i = 0; i < n; i++) {
    w.frame(1 / 60, 1);
    if (x !== undefined) w.cam.story = { x, y, dist, yOff: 0 };
    w.updateCamera(1 / 60, g.active || w.chars[0], i === 0);
    g.renderer.render(1 / 60);
  }
  return 'ok';
};

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

window.snap = async (name) => {
  game.renderer.render(1 / 60);
  const url = game.renderer.r.domElement.toDataURL('image/jpeg', 0.9);
  await fetch('/snap?name=' + name, { method: 'POST', body: url });
  return name;
};

window.climb = (kind, dir, targetY, maxT = 8, over = 0) => {
  const c = game.world.charByKind(kind);
  let last = -1, phase = 0;
  const n = Math.round(maxT * 60);
  for (let i = 0; i < n; i++) {
    const t = i / 60;
    const inp = { x: dir };
    if (c.pos.y - c.hh > targetY) { inp.x = over || dir; inp.jump = true; }
    else if (c.state === 'planted') { if (t - last > 0.12) { inp.jumpPressed = true; inp.jump = true; last = t; } }
    else if (c.grounded) { if (t - last > 0.15) { inp.jumpPressed = true; inp.jump = true; last = t; c.face = dir; } }
    else { inp.jump = true; if (c.vel.y < 2.0 && c.cool <= 0 && t - last > 0.1) { inp.actionPressed = true; last = t; } }
    sim2(1 / 60, () => ({ [kind]: inp }));
    if (c.pos.y - c.hh > targetY + 0.3 && c.grounded) break;
  }
  return [kind, +c.pos.x.toFixed(2), +c.pos.y.toFixed(2), c.state];
};

window.hsim = (sec, f) => {
  const n = Math.round(sec * 60);
  for (let i = 0; i < n; i++) {
    const r = f ? f(i / 60, i) : {};
    game.fixed(1 / 60, Object.assign(base(), r));
  }
  const me = game.active;
  return me ? [me.kind, +me.pos.x.toFixed(2), +me.pos.y.toFixed(2), me.state] : null;
};

window.hshot = (n = 40) => {
  const g = game, w = g.world;
  for (let i = 0; i < n; i++) {
    w.frame(1 / 60, 1);
    if (g.hub) g.hub.frame(1 / 60);
    w.updateCamera(1 / 60, g.active, i === 0 && !g.active);
    g.renderer.render(1 / 60);
  }
  return 'ok';
};

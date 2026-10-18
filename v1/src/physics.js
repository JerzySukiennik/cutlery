// Physics: Rapier 2D world of parentless colliders, kinematic movers and spatial queries.
import RAPIER from 'rapier2d';

export let R = null;

export async function initPhysics() {
  await RAPIER.init();
  R = RAPIER;
}

export class Physics {
  constructor() {
    this.world = new R.World({ x: 0, y: 0 });
    this.meta = new Map();
    this.cc = this.world.createCharacterController(0.012);
    this.cc.setUp({ x: 0, y: 1 });
    this.cc.setMaxSlopeClimbAngle(52 * Math.PI / 180);
    this.cc.setMinSlopeSlideAngle(40 * Math.PI / 180);
    this.cc.enableAutostep(0.3, 0.12, false);
    this.cc.enableSnapToGround(0.18);
    this.cc.setSlideEnabled(true);
    this.cc.setApplyImpulsesToDynamicBodies(false);
    this.ray = new R.Ray({ x: 0, y: 0 }, { x: 1, y: 0 });
  }

  addBox(cx, cy, hw, hh, rot, meta, round = 0) {
    const d = round > 0 ? R.ColliderDesc.roundCuboid(Math.max(0.01, hw - round), Math.max(0.01, hh - round), round) : R.ColliderDesc.cuboid(hw, hh);
    d.setTranslation(cx, cy).setRotation(rot || 0).setFriction(0);
    if (meta.sensor) d.setSensor(true);
    const c = this.world.createCollider(d);
    meta.hw = hw; meta.hh = hh; meta.rot = rot || 0;
    this.meta.set(c.handle, meta);
    c.meta = meta;
    meta.collider = c;
    return c;
  }

  setBox(c, cx, cy, hw, hh, rot = 0, round = 0) {
    const m = c.meta;
    if (m.hw !== hw || m.hh !== hh || (m.round || 0) !== round) {
      c.setShape(round > 0 ? new R.RoundCuboid(Math.max(0.01, hw - round), Math.max(0.01, hh - round), round) : new R.Cuboid(hw, hh));
      m.hw = hw; m.hh = hh; m.round = round;
    }
    c.setTranslation({ x: cx, y: cy });
    if (m.rot !== rot) { c.setRotation(rot); m.rot = rot; }
  }

  place(c, x, y) { c.setTranslation({ x, y }); }

  remove(c) {
    if (!c) return;
    this.meta.delete(c.handle);
    this.world.removeCollider(c, false);
  }

  metaOf(c) { return c ? this.meta.get(c.handle) : null; }

  move(c, dx, dy, pred) {
    this.cc.computeColliderMovement(c, { x: dx, y: dy }, R.QueryFilterFlags.EXCLUDE_SENSORS, undefined, (o) => {
      if (o.handle === c.handle) return false;
      const m = this.meta.get(o.handle);
      if (!m || m.off) return false;
      return pred ? pred(m, o) : true;
    });
    const mv = this.cc.computedMovement();
    const out = { dx: mv.x, dy: mv.y, grounded: this.cc.computedGrounded(), hits: [] };
    const n = this.cc.numComputedCollisions();
    for (let i = 0; i < n; i++) {
      const h = this.cc.computedCollision(i);
      if (!h || !h.collider) continue;
      const m = this.meta.get(h.collider.handle);
      if (m) out.hits.push({ m, nx: h.normal1.x, ny: h.normal1.y });
    }
    return out;
  }

  cast(x, y, dx, dy, max, pred, exclude) {
    this.ray.origin.x = x; this.ray.origin.y = y;
    this.ray.dir.x = dx; this.ray.dir.y = dy;
    const hit = this.world.castRayAndGetNormal(this.ray, max, true, R.QueryFilterFlags.EXCLUDE_SENSORS, undefined, exclude || undefined, undefined, (o) => {
      const m = this.meta.get(o.handle);
      if (!m || m.off) return false;
      return pred ? pred(m, o) : true;
    });
    if (!hit) return null;
    return { m: this.meta.get(hit.collider.handle), t: hit.timeOfImpact, x: x + dx * hit.timeOfImpact, y: y + dy * hit.timeOfImpact, nx: hit.normal.x, ny: hit.normal.y };
  }

  overlap(cx, cy, hw, hh, pred) {
    const out = [];
    const shape = new R.Cuboid(hw, hh);
    this.world.intersectionsWithShape({ x: cx, y: cy }, 0, shape, (o) => {
      const m = this.meta.get(o.handle);
      if (m && !m.off && (!pred || pred(m))) out.push(m);
      return true;
    });
    return out;
  }

  step() { this.world.step(); }

  dispose() { this.world.free(); this.meta.clear(); }
}

export function aabbOverlap(ax, ay, ahw, ahh, bx, by, bhw, bhh) {
  return Math.abs(ax - bx) < ahw + bhw && Math.abs(ay - by) < ahh + bhh;
}

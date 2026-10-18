// Network: Firebase RTDB or same-browser BroadcastChannel; the public house presence, chapter rooms, entity sync with interpolation, flags and requests.
const FIREBASE = {
  apiKey: 'AIzaSyAaTuELH_mToxH3hRJ4WPIVTECSH7Z8-FY',
  authDomain: 'gzowos-games.firebaseapp.com',
  databaseURL: 'https://gzowos-games-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'gzowos-games',
  storageBucket: 'gzowos-games.firebasestorage.app',
  messagingSenderId: '658227201482',
  appId: '1:658227201482:web:627b44e3c4c2988bc4bb33',
};
const SDK = '10.12.2';
const ROOT = 'cutlery/rooms';
const HUB = 'cutlery/hub';
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

const timeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(what + ' timed out')), ms))]);

class FirebaseTransport {
  async init() {
    const [app, auth, db] = await timeout(Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-database.js`),
    ]), 15000, 'Firebase download');
    const a = app.getApps().length ? app.getApp() : app.initializeApp(FIREBASE);
    let au;
    try { au = auth.initializeAuth(a, { persistence: auth.browserSessionPersistence }); } catch (e) { au = auth.getAuth(a); }
    if (au.authStateReady) await timeout(au.authStateReady(), 8000, 'Sign-in');
    const cred = au.currentUser ? { user: au.currentUser } : await timeout(auth.signInAnonymously(au), 12000, 'Sign-in');
    this.D = db;
    this.db = db.getDatabase(a);
    this.uid = cred.user.uid;
    db.onValue(db.ref(this.db, '.info/serverTimeOffset'), (s) => { this.offset = s.val() || 0; });
    return this.uid;
  }
  r(p) { return this.D.ref(this.db, p); }
  now() { return Date.now() + (this.offset || 0); }
  set(p, v) { return this.D.set(this.r(p), v).catch((e) => console.warn('set', p, e.message)); }
  update(p, v) { return this.D.update(this.r(p), v).catch((e) => console.warn('update', p, e.message)); }
  remove(p) { return this.D.remove(this.r(p)).catch(() => {}); }
  push(p, v) { return this.D.push(this.r(p), v).catch(() => {}); }
  async get(p) { const s = await this.D.get(this.r(p)); return s.val(); }
  onValue(p, cb) { return this.D.onValue(this.r(p), (s) => cb(s.val())); }
  onChild(p, cb) {
    const R = this.r(p), D = this.D;
    const u = [
      D.onChildAdded(R, (s) => cb('add', s.key, s.val())),
      D.onChildChanged(R, (s) => cb('change', s.key, s.val())),
      D.onChildRemoved(R, (s) => cb('remove', s.key, null)),
    ];
    return () => u.forEach((f) => f());
  }
  onDisconnectRemove(p) { this.D.onDisconnect(this.r(p)).remove(); }
  cancelDisconnect(p) { this.D.onDisconnect(this.r(p)).cancel(); }
}

class LocalTransport {
  async init() {
    this.uid = 'L' + Math.random().toString(36).slice(2, 9);
    this.tree = {};
    this.subs = [];
    this.disc = [];
    this.bc = new BroadcastChannel('cutlery-local');
    this.bc.onmessage = (e) => this.recv(e.data);
    this.bc.postMessage({ hello: this.uid });
    addEventListener('pagehide', () => { for (const p of this.disc) this.remove(p); });
    await new Promise((r) => setTimeout(r, 200));
    return this.uid;
  }
  now() { return Date.now(); }
  parts(p) { return p.split('/').filter(Boolean); }
  getAt(p) { let n = this.tree; for (const k of this.parts(p)) { if (n == null || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : (typeof n === 'object' ? JSON.parse(JSON.stringify(n)) : n); }
  setAt(p, v) {
    const ks = this.parts(p);
    let n = this.tree;
    for (let i = 0; i < ks.length - 1; i++) { if (typeof n[ks[i]] !== 'object' || n[ks[i]] === null) n[ks[i]] = {}; n = n[ks[i]]; }
    const last = ks[ks.length - 1];
    if (v === null || v === undefined) delete n[last]; else n[last] = JSON.parse(JSON.stringify(v));
  }
  apply(op) {
    const before = this.snapshotFor(op.p);
    if (op.t === 'set') this.setAt(op.p, op.v);
    else if (op.t === 'update') for (const [k, v] of Object.entries(op.v)) this.setAt(op.p + '/' + k, v);
    this.notify(op.p, before);
  }
  snapshotFor(p) {
    const out = new Map();
    for (const s of this.subs) if (s.kind === 'child' && (p.startsWith(s.p + '/') || p === s.p || s.p.startsWith(p))) out.set(s, JSON.stringify(this.getAt(s.p) || {}));
    return out;
  }
  notify(p, before) {
    for (const s of [...this.subs]) {
      const rel = p === s.p || p.startsWith(s.p + '/') || s.p.startsWith(p + '/') || s.p === p;
      if (!rel) continue;
      if (s.kind === 'value') s.cb(this.getAt(s.p));
      else {
        const old = JSON.parse(before.get(s) || '{}');
        const cur = this.getAt(s.p) || {};
        for (const k of Object.keys(cur)) {
          if (!(k in old)) s.cb('add', k, cur[k]);
          else if (JSON.stringify(old[k]) !== JSON.stringify(cur[k])) s.cb('change', k, cur[k]);
        }
        for (const k of Object.keys(old)) if (!(k in cur)) s.cb('remove', k, null);
      }
    }
  }
  send(op) { this.apply(op); this.bc.postMessage({ op }); }
  recv(d) {
    if (d.hello && d.hello !== this.uid) this.bc.postMessage({ tree: this.tree, to: d.hello });
    if (d.tree && d.to === this.uid) {
      const merged = JSON.parse(JSON.stringify(d.tree));
      const before = new Map(this.subs.filter((s) => s.kind === 'child').map((s) => [s, JSON.stringify(this.getAt(s.p) || {})]));
      this.tree = Object.assign(merged, this.tree);
      this.notify('', before);
    }
    if (d.op) this.apply(d.op);
  }
  set(p, v) { this.send({ t: 'set', p, v }); return Promise.resolve(); }
  update(p, v) { this.send({ t: 'update', p, v }); return Promise.resolve(); }
  remove(p) { this.send({ t: 'set', p, v: null }); return Promise.resolve(); }
  push(p, v) { const k = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); return this.set(p + '/' + k, v); }
  async get(p) { return this.getAt(p); }
  onValue(p, cb) { const s = { kind: 'value', p, cb }; this.subs.push(s); cb(this.getAt(p)); return () => { this.subs = this.subs.filter((x) => x !== s); }; }
  onChild(p, cb) {
    const s = { kind: 'child', p, cb };
    this.subs.push(s);
    const cur = this.getAt(p) || {};
    for (const k of Object.keys(cur)) cb('add', k, cur[k]);
    return () => { this.subs = this.subs.filter((x) => x !== s); };
  }
  onDisconnectRemove(p) { this.disc.push(p); }
  cancelDisconnect(p) { this.disc = this.disc.filter((x) => x !== p); }
}

const transports = {};
function connectTransport(mode) {
  if (!transports[mode]) {
    const t = mode === 'local' ? new LocalTransport() : new FirebaseTransport();
    transports[mode] = t.init().then(() => t).catch((e) => { delete transports[mode]; throw e; });
  }
  return transports[mode];
}

class Interp {
  constructor() { this.buffers = new Map(); }
  clear() { this.buffers.clear(); }
  delete(key) { this.buffers.delete(key); }

  push(key, s) {
    const now = performance.now();
    let b = this.buffers.get(key);
    if (!b) { b = { list: [], off: null }; this.buffers.set(key, b); }
    const off = now - (s.ts || now);
    b.off = b.off === null ? off : Math.min(off, b.off + 2);
    if (b.off > off) b.off = off;
    b.list.push({ t: (s.ts || now) + b.off, s });
    if (b.list.length > 30) b.list.shift();
  }

  sample(key, delay = 120) {
    const b = this.buffers.get(key);
    if (!b || !b.list.length) return null;
    const target = performance.now() - delay;
    const L = b.list;
    let i = L.length - 1;
    while (i > 0 && L[i - 1].t > target) i--;
    const a = L[Math.max(0, i - 1)], c = L[i];
    if (target >= L[L.length - 1].t) {
      const last = L[L.length - 1].s;
      const ex = Math.min(0.1, (target - L[L.length - 1].t) / 1000);
      return { ...last, x: last.x + (last.vx || 0) * ex, y: last.y + (last.vy || 0) * ex * (last.s === 0 ? 1 : 0) };
    }
    if (a === c || c.t === a.t) return c.s;
    const k = Math.max(0, Math.min(1, (target - a.t) / (c.t - a.t)));
    const big = Math.abs(c.s.x - a.s.x) > 3 || Math.abs(c.s.y - a.s.y) > 3 || a.s.s !== c.s.s;
    if (big) return k > 0.5 ? c.s : a.s;
    return { ...c.s, x: a.s.x + (c.s.x - a.s.x) * k, y: a.s.y + (c.s.y - a.s.y) * k };
  }
}

export class HubLink {
  constructor(mode) {
    this.mode = mode;
    this.interp = new Interp();
    this.players = {};
    this.unsubs = [];
    this.lastPub = 0;
    this.lastSent = '';
    this.live = false;
    this.handlers = { join() {}, change() {}, leave() {}, invite() {} };
  }

  on(ev, fn) { this.handlers[ev] = fn; }

  async connect() {
    this.tr = await timeout(connectTransport(this.mode), 20000, 'Connecting');
    this.uid = this.tr.uid;
    this.unsubs.push(this.tr.onChild(HUB + '/p', (type, key, val) => {
      if (key === this.uid) return;
      const stale = val && this.tr.now() - (val.ts || 0) > 45000;
      if (type === 'remove' || !val || stale) {
        if (this.players[key]) { delete this.players[key]; this.interp.delete(key); this.handlers.leave(key); }
        return;
      }
      const fresh = !this.players[key];
      this.players[key] = val;
      this.interp.push(key, val);
      if (fresh) this.handlers.join(key, val); else this.handlers.change(key, val);
    }));
    this.unsubs.push(this.tr.onValue(HUB + '/inv/' + this.uid, (v) => {
      if (!v) return;
      this.tr.remove(HUB + '/inv/' + this.uid);
      this.handlers.invite(v);
    }));
    return this.uid;
  }

  now() { return this.tr ? this.tr.now() : Date.now(); }

  publish(state) {
    if (!this.tr) return;
    const now = performance.now();
    const key = JSON.stringify(state);
    if (now - this.lastPub < 1000 / 12 || (key === this.lastSent && now - this.lastPub < 4000)) return;
    this.lastPub = now;
    this.lastSent = key;
    const p = HUB + '/p/' + this.uid;
    this.tr.set(p, { ...state, ts: this.tr.now() });
    if (!this.live) { this.live = true; this.tr.onDisconnectRemove(p); }
  }

  sample(uid) { return this.interp.sample(uid); }

  hide() {
    if (!this.tr || !this.live) return Promise.resolve();
    const p = HUB + '/p/' + this.uid;
    this.live = false;
    this.lastSent = '';
    this.tr.cancelDisconnect(p);
    return this.tr.remove(p);
  }

  invite(uid, v) { if (this.tr) this.tr.set(HUB + '/inv/' + uid, v); }

  async leave() {
    for (const u of this.unsubs) u();
    this.unsubs = [];
    await this.hide();
    this.players = {};
    this.interp.clear();
  }
}

export class Net {
  constructor(mode) {
    this.mode = mode;
    this.tr = null;
    this.code = null;
    this.uid = null;
    this.players = {};
    this.meta = {};
    this.interp = new Interp();
    this.unsubs = [];
    this.world = null;
    this.owned = new Set();
    this.objOwners = {};
    this.lastPub = 0;
    this.listeners = { lobby: [], start: [], left: [] };
  }

  async connect() {
    this.tr = await timeout(connectTransport(this.mode), 20000, 'Connecting');
    this.uid = this.tr.uid;
    return this.uid;
  }

  on(ev, fn) { this.listeners[ev].push(fn); }
  emit(ev, ...a) { for (const f of this.listeners[ev]) f(...a); }

  path(p = '') { return `${ROOT}/${this.code}${p ? '/' + p : ''}`; }

  async createRoom(chapter, nick) {
    let code;
    for (let i = 0; i < 8; i++) {
      code = Array.from({ length: 4 }, () => LETTERS[(Math.random() * LETTERS.length) | 0]).join('');
      const ex = await this.tr.get(`${ROOT}/${code}/meta`);
      if (!ex || (Date.now() - (ex.beat || 0)) > 6 * 3600e3) break;
    }
    this.code = code;
    await this.tr.set(this.path(), null);
    await this.tr.set(this.path('meta'), { host: this.uid, ch: chapter, state: 'lobby', created: this.tr.now(), beat: this.tr.now() });
    await this.joinPresence(nick);
    this.watchLobby();
    return code;
  }

  async joinRoom(code, nick) {
    code = String(code || '').toUpperCase().replace(/[^A-Z]/g, '');
    const meta = await this.tr.get(`${ROOT}/${code}/meta`);
    if (!meta) throw new Error('No room with that code.');
    const players = (await this.tr.get(`${ROOT}/${code}/players`)) || {};
    if (Object.keys(players).length >= 3 && !players[this.uid]) throw new Error('That room is full.');
    if (meta.state !== 'lobby' && !players[this.uid]) throw new Error('That game has already started.');
    this.code = code;
    await this.joinPresence(nick);
    this.watchLobby();
    return meta;
  }

  async joinPresence(nick) {
    const p = this.path('players/' + this.uid);
    await this.tr.set(p, { nick: String(nick || 'Guest').slice(0, 20), char: '', joined: this.tr.now() });
    this.tr.onDisconnectRemove(p);
  }

  watchLobby() {
    this.unsubs.push(this.tr.onValue(this.path('players'), (v) => { this.players = v || {}; this.hostCheck(); this.emit('lobby'); }));
    this.unsubs.push(this.tr.onValue(this.path('meta'), (v) => {
      const was = this.meta.state, round = this.meta.round;
      this.meta = v || {};
      if (!v) { this.emit('left', 'The room was closed.'); return; }
      this.emit('lobby');
      if (v.state === 'play' && (was !== 'play' || v.round !== round)) this.emit('start', v);
    }));
    this.beatTimer = setInterval(() => { if (this.isHost) this.tr.update(this.path('meta'), { beat: this.tr.now() }); }, 20000);
  }

  get isHost() { return this.meta.host === this.uid; }

  hostCheck() {
    if (!this.meta.host || this.players[this.meta.host]) return;
    const ids = Object.keys(this.players).sort();
    if (ids[0] === this.uid) {
      const owners = { ...(this.meta.owners || {}) };
      for (const k of Object.keys(owners)) if (!this.players[owners[k]]) owners[k] = this.uid;
      this.tr.update(this.path('meta'), { host: this.uid, owners });
    }
  }

  pickChar(kind) {
    const taken = Object.entries(this.players).some(([u, p]) => u !== this.uid && p.char === kind);
    if (taken) return false;
    this.tr.update(this.path('players/' + this.uid), { char: kind });
    return true;
  }

  startGame(chars, ch) {
    const owners = {};
    for (const k of chars) {
      const who = Object.entries(this.players).find(([, p]) => p.char === k);
      owners[k] = who ? who[0] : this.uid;
    }
    owners.host = this.uid;
    this.tr.set(this.path('s'), null);
    this.tr.set(this.path('f'), null);
    this.tr.set(this.path('r'), null);
    this.tr.set(this.path('own'), null);
    this.tr.update(this.path('meta'), { state: 'play', owners, startAt: this.tr.now() + 600, round: (this.meta.round || 0) + 1, ...(ch ? { ch } : {}) });
  }

  attach(world) {
    this.world = world;
    this.interp.clear();
    const owners = this.meta.owners || {};
    this.owned = new Set(Object.keys(owners).filter((k) => k !== 'host' && owners[k] === this.uid));
    this.gameUnsubs = [];
    this.gameUnsubs.push(this.tr.onChild(this.path('s'), (type, key, val) => {
      if (type === 'remove' || !val) return;
      if (this.isMine(key)) return;
      this.pushSample(key, val);
    }));
    this.gameUnsubs.push(this.tr.onChild(this.path('f'), (type, key, val) => {
      if (!this.world) return;
      this.world.netFlag(key, type === 'remove' ? undefined : val);
    }));
    for (const k of this.owned) {
      this.gameUnsubs.push(this.tr.onChild(this.path('r/' + k), (type, key, val) => {
        if (type !== 'add' || !val || !this.world) return;
        const ch = this.world.charByKind(k);
        if (ch && !ch.puppet) {
          if (val.t === 'release') ch.held = null;
          else ch.applyRequest(val);
        }
        this.tr.remove(this.path('r/' + k + '/' + key));
      }));
    }
    this.gameUnsubs.push(this.tr.onChild(this.path('own'), (type, key, val) => {
      if (!this.world) return;
      this.objOwners[key] = val;
      const m = this.world.movers.find((x) => x.id === key);
      if (m) { m.owner = val; m.puppet = val !== this.uid; if (m.puppet) m.carrier = m.carrier && m.carrier.puppet ? m.carrier : null; }
    }));
    this.gameUnsubs.push(this.tr.onValue(this.path('meta/owners'), (o) => {
      if (!o || !this.world) return;
      for (const ch of this.world.chars) {
        const own = o[ch.kind];
        const mine = own === this.uid;
        if (mine && ch.puppet) { ch.puppet = false; ch.override = 0; this.owned.add(ch.kind); }
        if (!mine && !ch.puppet) { ch.puppet = true; this.owned.delete(ch.kind); }
      }
      this.meta.owners = o;
      this.world.isHost = o.host === this.uid || this.meta.host === this.uid;
      this.world.game.onOwnersChanged();
    }));
  }

  detach() {
    for (const u of this.gameUnsubs || []) u();
    this.gameUnsubs = [];
    this.world = null;
  }

  isMine(key) {
    const [t, id] = [key.slice(0, 1), key.slice(2)];
    if (t === 'c') return this.owned.has(id);
    if (t === 'o') return this.world && this.world.movers.some((m) => m.id === id && !m.puppet);
    return false;
  }

  pushSample(key, s) {
    this.interp.push(key, s);
    if (key.startsWith('o_') && this.world) { const m = this.world.movers.find((x) => x.id === key.slice(2)); if (m) m.netMoveT = this.world.time; }
  }

  sample(type, id) { return this.interp.sample(type + '_' + id); }

  publish(world, force) {
    const now = performance.now();
    if (!force && now - this.lastPub < 1000 / 15) return;
    this.lastPub = now;
    const up = {};
    for (const c of world.chars) if (!c.puppet) up['c_' + c.kind] = { ...c.netState(), ts: now };
    for (const m of world.movers) {
      if (m.puppet) continue;
      const moving = world.time - m.lastMove < 0.6 || m.carrier || !m.sentOnce;
      if (!moving && !force) continue;
      m.sentOnce = true;
      up['o_' + m.id] = { ...m.netState(), ts: now };
    }
    if (Object.keys(up).length) this.tr.update(this.path('s'), up);
  }

  setFlag(k, v) { this.tr.set(this.path('f/' + k), v === undefined ? null : v); }
  request(kind, req) { this.tr.push(this.path('r/' + kind), req); }
  claim(id) { this.tr.set(this.path('own/' + id), this.uid); }

  async leave() {
    clearInterval(this.beatTimer);
    this.detach();
    for (const u of this.unsubs) u();
    this.unsubs = [];
    if (this.code) {
      const p = this.path('players/' + this.uid);
      this.tr.cancelDisconnect(p);
      await this.tr.remove(p);
      const left = Object.keys(this.players).filter((u) => u !== this.uid);
      if (!left.length) await this.tr.remove(this.path());
    }
    this.code = null;
    this.players = {};
    this.meta = {};
  }
}

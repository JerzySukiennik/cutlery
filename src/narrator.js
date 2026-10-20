// Narrator: plays the storyteller's recorded lines one at a time, with subtitles, ducking the music while it speaks.
import { EVENTS } from './narration.js';

const ASSETS = new URL('../assets/voice/', import.meta.url).href;

export class Narrator {
  constructor(game) {
    this.g = game;
    this.map = {};
    this.bufs = new Map();
    this.queue = [];
    this.cur = null;
    this.cool = {};
    this.lastEvent = 0;
    this.ready = fetch(ASSETS + 'lines.json').then((r) => (r.ok ? r.json() : {})).then((m) => { this.map = m || {}; }).catch(() => {});
  }

  has(text) { return !!this.map[text]; }

  async buffer(text) {
    const a = this.g.audio, file = this.map[text];
    if (!file || !a.ctx) return null;
    if (!this.bufs.has(file)) {
      this.bufs.set(file, fetch(ASSETS + file).then((r) => r.arrayBuffer()).then((ab) => new Promise((res, rej) => a.ctx.decodeAudioData(ab, res, rej))).catch(() => null));
    }
    return this.bufs.get(file);
  }

  say(text, o = {}) {
    if (!text) return false;
    if (!this.has(text)) { if (o.sub !== false) this.g.ui.subtitle(text, o.keys, o.dur || 4.5); return false; }
    if (o.drop && (this.cur || this.queue.length)) return false;
    if (this.queue.some((q) => q.text === text) || (this.cur && this.cur.text === text)) return true;
    const item = { text, keys: o.keys || '', sub: o.sub !== false };
    if (o.first) this.queue.unshift(item); else this.queue.push(item);
    if (this.queue.length > 3) this.queue.splice(1, this.queue.length - 3);
    this.buffer(text);
    if (!this.cur) this.next();
    return true;
  }

  async next() {
    const item = this.queue.shift();
    if (!item) { this.cur = null; this.g.audio.duck(false); return; }
    this.cur = item;
    const buf = await this.buffer(item.text);
    if (this.cur !== item) return;
    const a = this.g.audio;
    if (!buf || !a.ctx || a.ctx.state !== 'running') {
      if (item.sub) this.g.ui.subtitle(item.text, item.keys, 4.5);
      this.cur = null;
      this.next();
      return;
    }
    a.duck(true);
    if (item.sub) this.g.ui.subtitle(item.text, item.keys, buf.duration + 0.9);
    const node = a.voice(buf);
    item.node = node;
    node.onended = () => { if (this.cur !== item) return; setTimeout(() => { if (this.cur === item) { this.cur = null; this.next(); } }, 350); };
  }

  stop() {
    this.queue.length = 0;
    const c = this.cur;
    this.cur = null;
    if (c && c.node) { try { c.node.stop(); } catch (e) {} }
    this.g.audio.duck(false);
  }

  event(kind, chance = 0.4, gap = 40) {
    const t = performance.now() / 1000;
    if (this.cur || this.queue.length || t - this.lastEvent < gap || Math.random() > chance) return;
    const pool = (EVENTS[kind] || []).filter((s) => this.has(s));
    if (!pool.length) return;
    const last = this.cool[kind];
    let i = (Math.random() * pool.length) | 0;
    if (pool.length > 1 && i === last) i = (i + 1) % pool.length;
    if (this.say(pool[i], { drop: true })) { this.cool[kind] = i; this.lastEvent = t; }
  }
}

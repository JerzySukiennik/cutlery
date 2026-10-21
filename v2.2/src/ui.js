// UI: house entry and character pick, pause, HUD, narrated hints and subtitles, title cards, end cards, fades and touch controls.
import { OUTRO } from './narration.js';
export const TRACKS = [
  { id: 'b', name: 'Butter', players: 1, chars: ['butter'], note: 'one player' },
  { id: 'd', name: 'Fork & Knife', players: 2, chars: ['fork', 'knife'], note: 'two players' },
  { id: 't', name: 'All three', players: 3, chars: ['fork', 'knife', 'butter'], note: 'three players' },
];

export const CHAPTERS = [
  { id: 'b1', track: 'b', num: 'I', title: 'Cold Start', sub: 'Butter wakes up alone in the fridge.', end: 'And the cutlery drawer? Empty. Fork and Knife had already gone looking.' },
  { id: 'b2', track: 'b', num: 'II', title: 'The Pantry', sub: 'Jars, sacks and a mousetrap.', end: 'And out through the gap under the pantry door. Butter does love a gap.' },
  { id: 'b3', track: 'b', num: 'III', title: 'The Living Room', sub: 'Over the piano, toward the kitchen.', end: 'And there they were, at last. On the kitchen counter.' },
  { id: 'd1', track: 'd', num: 'I', title: 'The Drawer', sub: 'Fork and Knife climb out to find Butter.', end: 'The butter dish was empty. Butter, it seems, had gone looking for them.' },
  { id: 'd2', track: 'd', num: 'II', title: 'The Dining Room', sub: 'Chairs, a tablecloth and a serving spoon.', end: 'No Butter in the dining room either. Onwards.' },
  { id: 'd3', track: 'd', num: 'III', title: 'The Study', sub: 'Books, tape and a cork board.', end: 'Back to the kitchen, then. And who is that, small and yellow, by the door?' },
  { id: 't1', track: 't', num: 'I', title: 'Breakfast', sub: 'Together again, before the house wakes.', end: 'Breakfast. Together. Which, after all that, is rather the point.' },
  { id: 't2', track: 't', num: 'II', title: 'Washing Up', sub: 'A sink full of water, and Butter floats.', end: 'Everything clean. Everyone dry. Well, nearly everyone.' },
  { id: 't3', track: 't', num: 'III', title: 'Goodnight', sub: 'Home through the dark kitchen.', end: 'Goodnight, Fork. Goodnight, Knife. Goodnight, Butter.' },
];

export const trackOf = (id) => TRACKS.find((t) => t.id === String(id)[0]);
export const chapterOf = (id) => CHAPTERS.find((c) => c.id === id);
export const nextChapter = (id) => { const i = CHAPTERS.findIndex((c) => c.id === id); const n = CHAPTERS[i + 1]; return n && n.track === CHAPTERS[i].track ? n : null; };
export function unlockedIn(done, id, all = false) {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  if (i < 0) return false;
  const c = CHAPTERS[i], prev = CHAPTERS[i - 1];
  return !prev || prev.track !== c.track || done.has(prev.id) || all;
}

export const GLYPH = {
  fork: `<svg viewBox="0 0 24 48" aria-hidden="true"><path d="M12 47c3 0 4-2 4-4l-1-14c0-4-1-7-1-9 0-2 4-3 4-6V3h-2v10h-1.6V3h-1.8v10h-1.2V3H9.6v10H8V3H6v11c0 3 4 4 4 6 0 2-1 5-1 9L8 43c0 2 1 4 4 4z" fill="currentColor"/></svg>`,
  knife: `<svg viewBox="0 0 24 48" aria-hidden="true"><path d="M12 47c2.6 0 3.4-2 3.4-3.6L14.6 30h.8V28h-1V11C14.4 5 11 1 9.6 1H9v27H8v2h1L8.6 43.4C8.6 45 9.4 47 12 47z" fill="currentColor"/></svg>`,
  butter: `<svg viewBox="0 0 48 34" aria-hidden="true"><rect x="3" y="5" width="42" height="26" rx="6" fill="currentColor"/><circle cx="18" cy="17" r="3" fill="#1a120c"/><circle cx="30" cy="17" r="3" fill="#1a120c"/></svg>`,
};

const NAMES = { fork: 'Fork', knife: 'Knife', butter: 'Butter' };
const ABOUT = { fork: 'Stabs, climbs and carries.', knife: 'Cuts, and sticks into wood.', butter: 'Hardens, melts and floats.' };
const COUNT = { 1: 'Just me', 2: 'Two of us', 3: 'Three of us' };
const STORY = { 1: 'Butter alone, from the fridge', 2: 'Fork and Knife, from the drawer', 3: 'All three, together again' };
const FLOOR = { 1: 'Ground floor', 2: 'First floor', 3: 'Top floor' };
const WHO = { 1: 'Alone, you are Butter.', 2: 'Your friend takes the other one on their own device.', 3: 'Each of you takes a different one, each on your own device.' };
const ALL = new URLSearchParams(location.search).has('all');

const $ = (s, r = document) => r.querySelector(s);

export class UI {
  constructor(game) {
    this.g = game;
    this.menu = $('#menu');
    this.pause = $('#pause');
    this.hud = $('#hud');
    this.hintEl = $('#hint');
    this.card = $('#card');
    this.letter = $('#letterbox');
    this.fadeEl = $('#fade');
    this.toastEl = $('#toast');
    this.loading = $('#loading');
    this.done = new Set();
    const legacy = { 1: 'b1', 2: 'd1', 3: 't1' };
    try { for (const x of JSON.parse(localStorage.getItem('cutlery.done') || '[]')) this.done.add(legacy[x] || x); } catch (e) {}
    this.nick = '';
    this.kind = '';
    this.players = 0;
    try { this.nick = localStorage.getItem('cutlery.nick') || ''; this.kind = localStorage.getItem('cutlery.kind') || ''; this.players = +localStorage.getItem('cutlery.players') || 0; } catch (e) {}
    if (!NAMES[this.kind]) this.kind = '';
    if (!COUNT[this.players]) this.players = 0;
    this.hintT = 0;
    addEventListener('keydown', (e) => {
      const free = !document.activeElement || document.activeElement === document.body;
      if (this.entryKey && free && this.g.state === 'entry' && this.menu.classList.contains('show')) this.entryKey(e);
    });
  }

  progress(p, note) {
    const bar = $('.load-bar i', this.loading);
    if (bar) bar.style.transform = `scaleX(${Math.max(0.02, p)})`;
    if (note) $('.load-note', this.loading).textContent = note;
  }

  hideLoading() { this.loading.classList.remove('show'); }

  show(el) { for (const s of [this.menu, this.pause]) s.classList.toggle('show', s === el); }
  hideAll() { this.show(null); }

  unlocked(id) { return unlockedIn(this.done, id, ALL); }

  markDone(id) {
    this.done.add(id);
    try { localStorage.setItem('cutlery.done', JSON.stringify([...this.done])); } catch (e) {}
  }

  showEntry() {
    const g = this.g;
    this.menu.innerHTML = `
      <div class="menu-wrap">
        <header class="brand">
          <h1>Cutlery</h1>
          <p>One house, one day, three of them</p>
        </header>
        <section class="entry" id="entry"></section>
        <div class="menu-side" id="side"></div>
        <footer class="menu-foot">
          <button class="link" data-act="settings">Settings</button>
          <button class="link" data-act="controls">Controls</button>
          <button class="link" data-act="credits">Credits</button>
        </footer>
      </div>`;
    this.show(this.menu);
    $('[data-act=settings]', this.menu).onclick = () => { g.audio.ui('ui_open'); this.side('settings'); };
    $('[data-act=controls]', this.menu).onclick = () => { g.audio.ui('ui_open'); this.side('controls'); };
    $('[data-act=credits]', this.menu).onclick = () => { g.audio.ui('ui_open'); this.side('credits'); };
    this.entryCount();
  }

  entryCount() {
    const g = this.g, host = $('#entry', this.menu);
    host.innerHTML = `
      <div class="step">
        <p class="eyebrow">How many of you are playing?</p>
        <div class="counts">${TRACKS.map((t) => `<button class="count ${t.players === this.players ? 'mine' : ''}" data-n="${t.players}">
          <em>${t.players}</em>
          <span class="count-txt"><b>${COUNT[t.players]}</b><span>${STORY[t.players]}</span></span>
          <span class="count-gl">${t.chars.map((k) => `<i class="gl gl-${k}">${GLYPH[k]}</i>`).join('')}</span>
        </button>`).join('')}</div>
        <p class="muted small entry-note">Each of you plays on your own device. Everyone in the house sees each other.</p>
        <p class="house-count" id="houseCount"></p>
      </div>`;
    this.houseCount(g.hub ? g.hub.count() : 0);
    const go = (n) => { g.audio.ui('ui_toggle'); this.setPlayers(n); this.entryWho(n); };
    host.querySelectorAll('.count').forEach((b) => {
      b.onclick = () => go(+b.dataset.n);
      b.addEventListener('pointerenter', () => g.audio.ui('ui_click'));
    });
    this.entryKey = (e) => { if (COUNT[e.key]) go(+e.key); };
  }

  entryWho(n) {
    const g = this.g, host = $('#entry', this.menu);
    const t = TRACKS.find((x) => x.players === n);
    let pick = t.chars.includes(this.kind) ? this.kind : t.chars[0];
    host.innerHTML = `
      <div class="step">
        <button class="step-back" data-act="back"><span aria-hidden="true">‹</span> ${COUNT[n]} <i>${FLOOR[n]}</i></button>
        <p class="eyebrow">${n === 1 ? 'You are' : 'Who are you?'}</p>
        <div class="picks n${t.chars.length}">${t.chars.map((k) => `<button class="pick ${k === pick ? 'mine' : ''}" data-k="${k}"><i class="gl gl-${k}">${GLYPH[k]}</i><b>${NAMES[k]}</b><span>${ABOUT[k]}</span></button>`).join('')}</div>
        <p class="muted small entry-note">${WHO[n]}</p>
        <label class="field"><span>Your name</span><input id="nick" maxlength="20" placeholder="Name" value="${escapeHtml(this.nick)}" autocomplete="off" spellcheck="false"></label>
        <button class="btn primary" data-act="enter">Enter the house</button>
        <p class="house-count" id="houseCount"></p>
      </div>`;
    this.houseCount(g.hub ? g.hub.count() : 0);
    const nick = $('#nick', host);
    host.querySelectorAll('.pick').forEach((b) => {
      b.onclick = () => { pick = b.dataset.k; g.audio.ui('ui_toggle'); host.querySelectorAll('.pick').forEach((x) => x.classList.toggle('mine', x === b)); };
      b.addEventListener('pointerenter', () => g.audio.ui('ui_click'));
    });
    const enter = () => { this.entryKey = null; this.setNick(nick.value); this.setKind(pick); g.audio.ui('ui_select'); g.enterHub(pick); };
    nick.addEventListener('keydown', (e) => { if (e.key === 'Enter') enter(); e.stopPropagation(); });
    $('[data-act=enter]', host).onclick = enter;
    $('[data-act=back]', host).onclick = () => { g.audio.ui('ui_back'); this.entryCount(); };
    this.entryKey = (e) => { if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); g.audio.ui('ui_back'); this.entryCount(); } else if (e.key === 'Enter') enter(); };
  }

  setPlayers(n) {
    this.players = n;
    try { localStorage.setItem('cutlery.players', String(n)); } catch (e) {}
  }

  houseCount(n) {
    const g = this.g;
    const others = g.hub ? g.hub.kinds() : [];
    const txt = n <= 0 || (n === 1 && g.hub && g.hub.me) ? (g.hub && g.hub.online ? 'Nobody else is in the house right now.' : '') : `${n} in the house right now${others.length ? ': ' + others.map((k) => NAMES[k]).join(', ') : ''}.`;
    const el = $('#houseCount', this.menu);
    if (el) el.textContent = txt;
    const hc = $('.hud-room', this.hud);
    if (hc && g.chapter === 'hub') hc.textContent = n > 1 ? `${n} in the house` : '';
  }

  setKind(k) {
    this.kind = k;
    try { localStorage.setItem('cutlery.kind', k); } catch (e) {}
  }

  side(kind, data, target) {
    const el = target || $('#side', this.menu);
    if (!el) return;
    if (kind === 'settings') {
      const a = this.g.audio.vol, q = this.g.renderer.quality;
      el.innerHTML = `<div class="panel"><h2>Settings</h2>
        ${['master', 'music', 'sfx', 'voice'].map((k) => `<label class="field range"><span>${k === 'sfx' ? 'Sounds' : k === 'voice' ? 'Narrator' : k[0].toUpperCase() + k.slice(1)}</span><input type="range" min="0" max="1" step="0.05" value="${a[k]}" data-vol="${k}"></label>`).join('')}
        <div class="field"><span>Picture</span><div class="seg">${['high', 'low'].map((x) => `<button class="${q === x ? 'on' : ''}" data-q="${x}">${x === 'high' ? 'Sharp' : 'Light'}</button>`).join('')}</div></div>
        <p class="muted small">Light lowers resolution and blur for older laptops and phones.</p></div>`;
      el.querySelectorAll('[data-vol]').forEach((r) => r.oninput = () => this.g.audio.setVol(r.dataset.vol, +r.value));
      el.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => { this.g.renderer.locked = true; this.g.renderer.setQuality(b.dataset.q); this.g.renderer.resize(); this.side('settings'); });
    } else if (kind === 'controls') {
      el.innerHTML = `<div class="panel"><h2>Controls</h2>${this.controlsHTML()}</div>`;
    } else if (kind === 'credits') {
      el.innerHTML = `<div class="panel credits"><h2>Credits</h2>
        <p class="muted">Piano: Erik Satie, Gymnopédie No. 1, played by Robin Alciatore. Robert Schumann, Kinderszenen, recorded by Musopen. Both public domain.</p>
        <p class="muted">Cattails, Somewhere Sunny, Clear Air, Morning and Almost Bliss by Kevin MacLeod (incompetech.com), licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>.</p>
        <p class="muted">Sounds: recordings from freesound.org, all CC0. The full list is in <a href="https://github.com/JerzySukiennik/cutlery/blob/main/assets/audio/CREDITS.md" target="_blank" rel="noopener">the repository</a>.</p>
      </div>`;
    } else el.innerHTML = '';
  }

  controlsHTML() {
    return `<dl class="keys">
      <dt><kbd>A</kbd><kbd>D</kbd></dt><dd>Walk</dd>
      <dt><kbd>W</kbd> <kbd>Space</kbd></dt><dd>Jump, hold for higher</dd>
      <dt><kbd>E</kbd> <kbd>Shift</kbd></dt><dd>Use your tool: stab, cut, smear</dd>
      <dt><kbd>S</kbd></dt><dd>Squish (Butter), drop down, let go</dd>
      <dt><kbd>Tab</kbd></dt><dd>Switch character when you control more than one</dd>
      <dt><kbd>Esc</kbd></dt><dd>Pause</dd>
    </dl><p class="muted small">Gamepad: stick to walk, A jump, X action, Y switch. On a phone, the on-screen stick and buttons appear in game.</p>
    <dl class="keys tools">
      <dt class="gl gl-fork">${GLYPH.fork}</dt><dd>Fork sticks into soft things (bread, cheese, sponge, Butter), climbs them, and carries small things on its tines.</dd>
      <dt class="gl gl-knife">${GLYPH.knife}</dt><dd>Knife cuts strings and food, sticks into wood, and makes a springy ledge.</dd>
      <dt class="gl gl-butter">${GLYPH.butter}</dt><dd>Butter hardens in the cold and softens in warmth. Soft, it squishes and clings. Melted, it pours through grates. In water it floats.</dd>
    </dl>`;
  }

  setNick(v) {
    this.nick = String(v || '').trim().slice(0, 20);
    try { localStorage.setItem('cutlery.nick', this.nick); } catch (e) {}
  }

  showPause() {
    const g = this.g;
    const inHub = g.chapter === 'hub';
    this.pause.classList.remove('end-screen');
    this.pause.innerHTML = `<div class="pause-wrap">
      <h2>Paused</h2>
      <nav class="stack">
        <button class="btn primary" data-act="resume">Resume</button>
        ${inHub ? '<button class="btn" data-act="change">Change character</button>' : '<button class="btn" data-act="respawn">Back to checkpoint</button>'}
        ${inHub || g.net ? '' : '<button class="btn" data-act="restart">Restart chapter</button>'}
        <button class="btn" data-act="settings">Settings</button>
        <button class="btn" data-act="controls">Controls</button>
        ${inHub ? '' : '<button class="btn quiet" data-act="quit">Back to the house</button>'}
      </nav>
      ${g.net ? '<p class="muted small">The game keeps running for the others while you are here.</p>' : ''}
      <div id="pauseSide"></div></div>`;
    this.show(this.pause);
    const act = (a) => this.pause.querySelector(`[data-act=${a}]`);
    const side = $('#pauseSide', this.pause);
    act('resume').onclick = () => g.resume();
    if (act('respawn')) act('respawn').onclick = () => { g.resume(); g.respawnActive(); };
    if (act('change')) act('change').onclick = () => { g.resume(); g.changeCharacter(); };
    if (act('restart')) act('restart').onclick = () => { g.resume(); g.restartChapter(); };
    act('settings').onclick = () => this.side('settings', null, side);
    act('controls').onclick = () => { side.innerHTML = `<div class="panel">${this.controlsHTML()}</div>`; };
    if (act('quit')) act('quit').onclick = () => g.backToHouse();
  }

  setHUD(g) {
    const w = g.world;
    if (!w || g.state !== 'play') { this.hud.innerHTML = ''; this.thermo = null; return; }
    if (g.chapter === 'hub') {
      const me = g.active;
      this.hud.innerHTML = me ? `<div class="hud-who"><span class="who on" data-k="${me.kind}"><i class="gl gl-${me.kind}">${GLYPH[me.kind]}</i><em>${escapeHtml(this.nick || NAMES[me.kind])}</em></span></div><div class="hud-room"></div>` : '';
      this.thermo = null;
      this.houseCount(g.hub ? g.hub.count() : 1);
      return;
    }
    const locals = w.localChars();
    const showSwap = locals.length > 1;
    const butter = w.charByKind('butter');
    const heads = w.chars.map((c) => `<span class="who ${c === g.active ? 'on' : ''} ${c.puppet ? 'remote' : ''}" data-k="${c.kind}"><i class="gl gl-${c.kind}">${GLYPH[c.kind]}</i>${c.puppet && g.net ? `<em>${escapeHtml(g.nickOf(c.kind))}</em>` : ''}</span>`).join('');
    this.hud.innerHTML = `<div class="hud-who">${heads}${showSwap ? `<span class="swap-k"><kbd>Tab</kbd> switch</span>` : ''}</div>
      ${butter ? '<div class="thermo" id="thermo"><i></i><span></span></div>' : ''}`;
    this.thermo = $('#thermo', this.hud);
  }

  updateThermo(t, shown) {
    if (!this.thermo) return;
    this.thermo.classList.toggle('show', shown);
    const fill = this.thermo.querySelector('i');
    fill.style.transform = `scaleX(${Math.max(0.03, t)})`;
    const lab = this.thermo.querySelector('span');
    const word = t < 0.2 ? 'frozen' : t < 0.62 ? 'firm' : t < 0.93 ? 'soft' : 'melted';
    if (lab.textContent !== word) lab.textContent = word;
    this.thermo.dataset.s = word;
  }

  hint(text, dur = 4) {
    const [say, keys] = String(text).split('|');
    if (this.g.narrator) this.g.narrator.say(say, { keys, dur });
    else this.subtitle(say, keys, dur);
  }

  subtitle(text, keys, dur = 4) {
    let k = keys || '';
    if (this.g.input.lastDevice === 'pad') k = k.replace(/\bE\b/g, 'X').replace(/\bTab\b/g, 'Y');
    this.hintEl.innerHTML = `<span>${escapeHtml(text)}${k ? `<small>${escapeHtml(k)}</small>` : ''}</span>`;
    this.hintEl.classList.add('show');
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => this.hintEl.classList.remove('show'), dur * 1000);
  }

  clearHint() { this.hintEl.classList.remove('show'); }

  title(main, sub, dur = 4) {
    this.card.innerHTML = `<div class="card-in"><p class="card-sub">${escapeHtml(sub || '')}</p><h2>${escapeHtml(main)}</h2></div>`;
    this.card.classList.remove('show');
    void this.card.offsetWidth;
    this.card.classList.add('show');
    clearTimeout(this.cardTimer);
    this.cardTimer = setTimeout(() => this.card.classList.remove('show'), dur * 1000);
  }

  letterbox(on) { this.letter.classList.toggle('on', on); if (!on) this.skipProgress(0); }

  skipProgress(p) {
    const v = Math.max(0, Math.min(1, p));
    if (this._skip === v) return;
    this._skip = v;
    this.letter.style.setProperty('--skip', v.toFixed(3));
    this.letter.classList.toggle('skipping', v > 0.02);
  }

  fade(on, ms = 700) {
    this.fadeEl.style.transitionDuration = ms + 'ms';
    this.fadeEl.classList.toggle('on', on);
    return new Promise((r) => setTimeout(r, ms));
  }

  flash() {
    this.fadeEl.style.transitionDuration = '260ms';
    this.fadeEl.classList.add('on', 'soft');
    setTimeout(() => { this.fadeEl.style.transitionDuration = '700ms'; this.fadeEl.classList.remove('on'); setTimeout(() => this.fadeEl.classList.remove('soft'), 700); }, 700);
  }

  toast(text, err = false) {
    this.toastEl.textContent = text;
    this.toastEl.classList.toggle('err', err);
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 3200);
  }

  showEnd(ch, next) {
    const g = this.g;
    const c = chapterOf(ch), t = trackOf(ch);
    const n = next ? chapterOf(next) : null;
    const lead = !g.net || g.net.isHost;
    const host = g.net && g.net.players[g.net.meta.host];
    this.pause.classList.add('end-screen');
    document.body.classList.add('ended');
    this.pause.innerHTML = `<div class="pause-wrap end">
      <p class="eyebrow">${t.name} · Chapter ${c.num} complete</p><h2>${c.title}</h2>
      <p class="end-line">${c.end}</p>
      <nav class="stack">
        ${n && lead ? `<button class="btn primary" data-act="next">Continue: ${n.title}</button>` : ''}
        ${n && !lead ? `<p class="muted small">Waiting for ${escapeHtml(host ? host.nick : 'the host')} to continue to ${n.title}.</p>` : ''}
        <button class="btn ${n && lead ? '' : 'primary'}" data-act="house">Back to the house</button>
      </nav></div>`;
    this.show(this.pause);
    if (g.narrator) { g.narrator.say(c.end, { sub: false }); if (ch === 't3') g.narrator.say(OUTRO, { sub: false }); }
    const leave = () => { this.pause.classList.remove('end-screen'); document.body.classList.remove('ended'); };
    const nb = this.pause.querySelector('[data-act=next]');
    if (nb) nb.onclick = () => { g.audio.ui('ui_select'); leave(); g.afterEnd(next); };
    this.pause.querySelector('[data-act=house]').onclick = () => { g.audio.ui('ui_back'); leave(); g.backToHouse(); };
  }

}

function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

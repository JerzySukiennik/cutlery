// UI: menu, chapter picker, online lobby, pause, HUD, hints, title cards, fades and touch controls.
export const TRACKS = [
  { id: 'b', name: 'Butter', players: 1, chars: ['butter'], note: 'one player' },
  { id: 'd', name: 'Fork & Knife', players: 2, chars: ['fork', 'knife'], note: 'two players' },
  { id: 't', name: 'All three', players: 3, chars: ['fork', 'knife', 'butter'], note: 'three players' },
];

export const CHAPTERS = [
  { id: 'b1', track: 'b', num: 'I', title: 'Cold Start', sub: 'Butter wakes up alone in the fridge.', end: 'The cutlery drawer was empty. Fork and Knife had already gone looking.' },
  { id: 'b2', track: 'b', num: 'II', title: 'The Pantry', sub: 'Jars, sacks and a mousetrap.', end: 'Out through the gap under the pantry door.' },
  { id: 'b3', track: 'b', num: 'III', title: 'The Living Room', sub: 'Over the piano, toward the kitchen.', end: 'There they were, on the kitchen counter.' },
  { id: 'd1', track: 'd', num: 'I', title: 'The Drawer', sub: 'Fork and Knife climb out to find Butter.', end: 'The butter dish was empty. Butter had gone looking for them.' },
  { id: 'd2', track: 'd', num: 'II', title: 'The Dining Room', sub: 'Chairs, a tablecloth and a serving spoon.', end: 'No Butter in the dining room either.' },
  { id: 'd3', track: 'd', num: 'III', title: 'The Study', sub: 'Books, tape and a cork board.', end: 'Back to the kitchen, and someone yellow by the door.' },
  { id: 't1', track: 't', num: 'I', title: 'Breakfast', sub: 'Together again, before the house wakes.', end: 'Breakfast, together.' },
  { id: 't2', track: 't', num: 'II', title: 'Washing Up', sub: 'A sink full of water, and Butter floats.', end: 'Everything clean, everyone dry.' },
  { id: 't3', track: 't', num: 'III', title: 'Goodnight', sub: 'Home through the dark kitchen.', end: 'Goodnight, Fork. Goodnight, Knife. Goodnight, Butter.' },
];

export const trackOf = (id) => TRACKS.find((t) => t.id === String(id)[0]);
export const chapterOf = (id) => CHAPTERS.find((c) => c.id === id);
export const nextChapter = (id) => { const i = CHAPTERS.findIndex((c) => c.id === id); const n = CHAPTERS[i + 1]; return n && n.track === CHAPTERS[i].track ? n : null; };

export const GLYPH = {
  fork: `<svg viewBox="0 0 24 48" aria-hidden="true"><path d="M12 47c3 0 4-2 4-4l-1-14c0-4-1-7-1-9 0-2 4-3 4-6V3h-2v10h-1.6V3h-1.8v10h-1.2V3H9.6v10H8V3H6v11c0 3 4 4 4 6 0 2-1 5-1 9L8 43c0 2 1 4 4 4z" fill="currentColor"/></svg>`,
  knife: `<svg viewBox="0 0 24 48" aria-hidden="true"><path d="M12 47c2.6 0 3.4-2 3.4-3.6L14.6 30h.8V28h-1V11C14.4 5 11 1 9.6 1H9v27H8v2h1L8.6 43.4C8.6 45 9.4 47 12 47z" fill="currentColor"/></svg>`,
  butter: `<svg viewBox="0 0 48 34" aria-hidden="true"><rect x="3" y="5" width="42" height="26" rx="6" fill="currentColor"/><circle cx="18" cy="17" r="3" fill="#1a120c"/><circle cx="30" cy="17" r="3" fill="#1a120c"/></svg>`,
};

const NAMES = { fork: 'Fork', knife: 'Knife', butter: 'Butter' };

const $ = (s, r = document) => r.querySelector(s);

export class UI {
  constructor(game) {
    this.g = game;
    this.menu = $('#menu');
    this.lobby = $('#lobby');
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
    try { this.nick = localStorage.getItem('cutlery.nick') || ''; } catch (e) {}
    this.hintT = 0;
  }

  progress(p, note) {
    const bar = $('.load-bar i', this.loading);
    if (bar) bar.style.transform = `scaleX(${Math.max(0.02, p)})`;
    if (note) $('.load-note', this.loading).textContent = note;
  }

  hideLoading() { this.loading.classList.remove('show'); }

  show(el) { for (const s of [this.menu, this.lobby, this.pause]) s.classList.toggle('show', s === el); }
  hideAll() { this.show(null); }

  unlocked(id) {
    const i = CHAPTERS.findIndex((c) => c.id === id);
    if (i < 0) return false;
    const c = CHAPTERS[i], prev = CHAPTERS[i - 1];
    return !prev || prev.track !== c.track || this.done.has(prev.id) || new URLSearchParams(location.search).has('all');
  }

  markDone(id) {
    this.done.add(id);
    try { localStorage.setItem('cutlery.done', JSON.stringify([...this.done])); } catch (e) {}
  }

  showMenu(focus = null) {
    const g = this.g;
    const chapters = TRACKS.map((t) => `
      <section class="track">
        <h3 class="track-head"><span class="track-glyphs">${t.chars.map((k) => `<i class="gl gl-${k}" title="${NAMES[k]}">${GLYPH[k]}</i>`).join('')}</span>${t.name}<em>${t.note}</em></h3>
        ${CHAPTERS.filter((c) => c.track === t.id).map((c) => {
          const open = this.unlocked(c.id);
          const prev = CHAPTERS[CHAPTERS.indexOf(c) - 1];
          return `<button class="chap ${this.done.has(c.id) ? 'done' : ''} ${open ? '' : 'locked'}" data-ch="${c.id}" ${open ? '' : 'aria-disabled="true"'}>
            <span class="chap-num">${c.num}</span>
            <span class="chap-body"><span class="chap-title">${c.title}</span><span class="chap-sub">${open ? c.sub : `Finish ${prev ? prev.title : 'the chapter before'} to open.`}</span></span>
          </button>`;
        }).join('')}
      </section>`).join('');
    this.menu.innerHTML = `
      <div class="menu-wrap">
        <header class="brand">
          <h1>Cutlery</h1>
          <p>One house, one day, three of them</p>
        </header>
        <nav class="chapters">${chapters}</nav>
        <div class="menu-side" id="side"></div>
        <footer class="menu-foot">
          <button class="link" data-act="settings">Settings</button>
          <button class="link" data-act="controls">Controls</button>
          <button class="link" data-act="join">Join a room</button>
        </footer>
      </div>`;
    this.show(this.menu);
    this.menu.querySelectorAll('.chap').forEach((b) => {
      b.addEventListener('click', () => {
        if (b.classList.contains('locked')) { g.audio.ui('ui_back'); b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge'); return; }
        g.audio.ui('ui_select'); this.pickChapter(b.dataset.ch);
      });
      b.addEventListener('pointerenter', () => g.audio.ui('ui_click'));
    });
    this.menu.querySelector('[data-act=settings]').onclick = () => { g.audio.ui('ui_open'); this.side('settings'); };
    this.menu.querySelector('[data-act=controls]').onclick = () => { g.audio.ui('ui_open'); this.side('controls'); };
    this.menu.querySelector('[data-act=join]').onclick = () => { g.audio.ui('ui_open'); this.side('join'); };
    if (focus) this.pickChapter(focus);
  }

  side(kind, data) {
    const el = $('#side', this.menu);
    if (!el) return;
    this.menu.querySelectorAll('.chap').forEach((b) => b.classList.toggle('on', kind === 'chapter' && b.dataset.ch === data));
    if (kind === 'chapter') {
      const c = { ...chapterOf(data), ...trackOf(data), id: data };
      if (c.players === 1) {
        el.innerHTML = `<div class="panel"><h2>${c.title}</h2><p class="muted">${c.sub}</p><button class="btn primary" data-go="solo">Begin</button></div>`;
      } else {
        el.innerHTML = `<div class="panel"><h2>${c.title}</h2><p class="muted">${c.sub} Made for ${c.players} players online, each on their own device.</p>
          <label class="field"><span>Your name</span><input id="nick" maxlength="20" placeholder="Name" value="${escapeHtml(this.nick)}"></label>
          <button class="btn primary" data-go="host">Host a room</button>
          <button class="btn" data-go="joinpanel">Join with a code</button>
          <button class="btn quiet" data-go="solo">Play alone, switching with Tab</button></div>`;
      }
      el.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => {
        const n = $('#nick', el);
        if (n) this.setNick(n.value);
        this.g.audio.ui('ui_select');
        const go = b.dataset.go;
        if (go === 'solo') this.g.startSolo(data);
        else if (go === 'host') this.g.hostRoom(data);
        else this.side('join');
      });
    } else if (kind === 'join') {
      el.innerHTML = `<div class="panel"><h2>Join a room</h2><p class="muted">Ask the host for the four-letter code.</p>
        <label class="field"><span>Your name</span><input id="nick" maxlength="20" placeholder="Name" value="${escapeHtml(this.nick)}"></label>
        <label class="field"><span>Room code</span><input id="code" class="code-in" maxlength="4" placeholder="ABCD" autocapitalize="characters" autocomplete="off" spellcheck="false"></label>
        <button class="btn primary" data-go="join">Join</button><p class="err" id="joinErr"></p></div>`;
      const code = $('#code', el);
      code.focus();
      code.addEventListener('input', () => { code.value = code.value.toUpperCase().replace(/[^A-Z]/g, ''); });
      const go = () => { this.setNick($('#nick', el).value); this.g.audio.ui('ui_select'); this.g.joinRoom(code.value); };
      code.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      $('[data-go=join]', el).onclick = go;
    } else if (kind === 'settings') {
      const a = this.g.audio.vol, q = this.g.renderer.quality;
      el.innerHTML = `<div class="panel"><h2>Settings</h2>
        ${['master', 'music', 'sfx'].map((k) => `<label class="field range"><span>${k === 'sfx' ? 'Sounds' : k[0].toUpperCase() + k.slice(1)}</span><input type="range" min="0" max="1" step="0.05" value="${a[k]}" data-vol="${k}"></label>`).join('')}
        <div class="field"><span>Picture</span><div class="seg">${['high', 'low'].map((x) => `<button class="${q === x ? 'on' : ''}" data-q="${x}">${x === 'high' ? 'Sharp' : 'Light'}</button>`).join('')}</div></div>
        <p class="muted small">Light lowers resolution and blur for older laptops and phones.</p></div>`;
      el.querySelectorAll('[data-vol]').forEach((r) => r.oninput = () => this.g.audio.setVol(r.dataset.vol, +r.value));
      el.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => { this.g.renderer.locked = true; this.g.renderer.setQuality(b.dataset.q); this.g.renderer.resize(); this.side('settings'); });
    } else if (kind === 'controls') {
      el.innerHTML = `<div class="panel"><h2>Controls</h2>${this.controlsHTML()}</div>`;
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

  pickChapter(id) { this.side('chapter', id); }

  setNick(v) {
    this.nick = String(v || '').trim().slice(0, 20);
    try { localStorage.setItem('cutlery.nick', this.nick); } catch (e) {}
  }

  showLobby(net, chapter) {
    const c = { ...chapterOf(chapter), ...trackOf(chapter) };
    const players = net.players || {};
    const me = net.uid;
    const owners = {};
    for (const [u, p] of Object.entries(players)) if (p.char) owners[p.char] = u;
    const cards = c.chars.map((k) => {
      const u = owners[k];
      const p = u ? players[u] : null;
      const mine = u === me;
      return `<button class="pick ${mine ? 'mine' : ''} ${u && !mine ? 'taken' : ''}" data-k="${k}">
        <i class="gl gl-${k}">${GLYPH[k]}</i><b>${NAMES[k]}</b><span>${p ? escapeHtml(p.nick) + (mine ? ' (you)' : '') : 'open'}</span></button>`;
    }).join('');
    const list = Object.entries(players).map(([u, p]) => `<li>${escapeHtml(p.nick)}${u === net.meta.host ? ' <em>host</em>' : ''}${u === me ? ' <em>you</em>' : ''}</li>`).join('');
    const host = net.isHost;
    this.lobby.innerHTML = `
      <div class="lobby-wrap">
        <p class="eyebrow">${c.name} · Chapter ${c.num} · ${c.title}</p>
        <h2>Room <span class="code">${net.code}</span></h2>
        <p class="muted">Share the code. Everyone opens the game, picks Join a room and types it in.</p>
        <div class="picks">${cards}</div>
        <ul class="plist">${list}</ul>
        <p class="muted small">${host ? 'Characters nobody picks stay with you, switch to them with Tab.' : 'The host starts when everyone is ready.'}</p>
        <div class="row">
          ${host ? '<button class="btn primary" data-act="start">Start</button>' : ''}
          <button class="btn quiet" data-act="leave">Leave</button>
          <button class="btn quiet" data-act="copy">Copy code</button>
        </div>
      </div>`;
    this.show(this.lobby);
    this.lobby.querySelectorAll('.pick').forEach((b) => b.onclick = () => {
      const k = b.dataset.k;
      if (owners[k] === me) net.pickChar('');
      else if (!net.pickChar(k)) this.toast('Someone already picked ' + NAMES[k] + '.');
      this.g.audio.ui('ui_toggle');
    });
    const st = this.lobby.querySelector('[data-act=start]');
    if (st) st.onclick = () => { this.g.audio.ui('ui_select'); net.startGame(c.chars); };
    this.lobby.querySelector('[data-act=leave]').onclick = () => { this.g.audio.ui('ui_back'); this.g.leaveRoom(); };
    this.lobby.querySelector('[data-act=copy]').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(net.code); this.toast('Code copied.'); };
  }

  showPause() {
    const g = this.g;
    this.pause.classList.remove('end-screen');
    this.pause.innerHTML = `<div class="pause-wrap">
      <h2>Paused</h2>
      <nav class="stack">
        <button class="btn primary" data-act="resume">Resume</button>
        <button class="btn" data-act="respawn">Back to checkpoint</button>
        ${g.net ? '' : '<button class="btn" data-act="restart">Restart chapter</button>'}
        <button class="btn" data-act="controls">Controls</button>
        <button class="btn quiet" data-act="quit">${g.net ? 'Leave room' : 'Quit to menu'}</button>
      </nav>
      ${g.net ? `<p class="muted small">Room ${g.net.code}. The game keeps running for the others while you are here.</p>` : ''}
      <div id="pauseSide"></div></div>`;
    this.show(this.pause);
    const act = (a) => this.pause.querySelector(`[data-act=${a}]`);
    act('resume').onclick = () => g.resume();
    act('respawn').onclick = () => { g.resume(); g.respawnActive(); };
    if (act('restart')) act('restart').onclick = () => { g.resume(); g.restartChapter(); };
    act('controls').onclick = () => { $('#pauseSide', this.pause).innerHTML = `<div class="panel">${this.controlsHTML()}</div>`; };
    act('quit').onclick = () => g.quitToMenu();
  }

  setHUD(g) {
    const w = g.world;
    if (!w || g.state !== 'play') { this.hud.innerHTML = ''; return; }
    const locals = w.localChars();
    const showSwap = locals.length > 1;
    const butter = w.charByKind('butter');
    const heads = w.chars.map((c) => `<span class="who ${c === g.active ? 'on' : ''} ${c.puppet ? 'remote' : ''}" data-k="${c.kind}"><i class="gl gl-${c.kind}">${GLYPH[c.kind]}</i>${c.puppet && g.net ? `<em>${escapeHtml(g.nickOf(c.kind))}</em>` : ''}</span>`).join('');
    this.hud.innerHTML = `<div class="hud-who">${heads}${showSwap ? `<span class="swap-k"><kbd>Tab</kbd> switch</span>` : ''}</div>
      ${butter ? '<div class="thermo" id="thermo"><i></i><span></span></div>' : ''}
      ${g.net ? `<div class="hud-room">${g.net.code}</div>` : ''}`;
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
    const k = this.g.input.lastDevice;
    let t = text;
    if (k === 'pad') t = t.replace(/\bE\b/g, 'X').replace(/\bTab\b/g, 'Y');
    this.hintEl.innerHTML = `<span>${escapeHtml(t)}</span>`;
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
    const c = chapterOf(ch), t = trackOf(ch);
    const n = next ? chapterOf(next) : null;
    this.pause.classList.add('end-screen');
    document.body.classList.add('ended');
    this.pause.innerHTML = `<div class="pause-wrap end">
      <p class="eyebrow">${t.name} · Chapter ${c.num} complete</p><h2>${c.title}</h2>
      <p class="end-line">${c.end}</p>
      <nav class="stack">
        ${n ? `<button class="btn primary" data-act="next">Continue: ${n.title}</button>` : ''}
        <button class="btn ${n ? '' : 'primary'}" data-act="menu">${this.g.net ? 'Back to the room' : 'Back to the menu'}</button>
      </nav></div>`;
    this.show(this.pause);
    const nb = this.pause.querySelector('[data-act=next]');
    const leave = () => { this.pause.classList.remove('end-screen'); document.body.classList.remove('ended'); };
    if (nb) nb.onclick = () => { this.g.audio.ui('ui_select'); leave(); this.g.afterEnd(next); };
    this.pause.querySelector('[data-act=menu]').onclick = () => { this.g.audio.ui('ui_back'); leave(); this.g.afterEnd(null); };
  }

}

function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

'use strict';
// ---------- константи и помощни функции ----------
const W = 960, H = 540, GROUND = 478, LEFT = 46, RIGHT = 914;
const D2R = Math.PI / 180;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - (1 - clamp(t, 0, 1)) ** 3;
const easeIn = t => clamp(t, 0, 1) ** 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const chance = p => Math.random() < p;
function seeded(s) { return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const FONT_D = '"Russo One", Impact, "Arial Black", sans-serif';
const FONT_B = '"Rubik", "Segoe UI", Arial, sans-serif';
const MOBILE = typeof navigator !== 'undefined' && ((navigator.maxTouchPoints || 0) > 0 ||
  (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) ||
  (typeof location !== 'undefined' && new URLSearchParams(location.search).has('mobile')));

const store = {
  get(k, d) { try { const v = localStorage.getItem('fightnow_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('fightnow_' + k, JSON.stringify(v)); } catch (e) { } }
};

function shade(hex, amt) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
}

// ---------- синтезирани ефекти и записана бойна музика ----------
const Snd = {
  ctx: null, master: null, sfx: null, mus: null,
  on: store.get('sound', true), musicOn: store.get('music', true),
  init() {
    if (typeof BattleMusic !== 'undefined') BattleMusic.apply(true);
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = this.on ? 0.7 : 0; this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
      this.mus = this.ctx.createGain(); this.mus.gain.value = this.musicOn ? 0.32 : 0; this.mus.connect(this.master);
      const len = this.ctx.sampleRate;
      this.nb = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.nb.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  toggle() { this.on = !this.on; store.set('sound', this.on); if (this.master) this.master.gain.value = this.on ? 0.7 : 0; BattleMusic.apply(); },
  toggleMusic() { this.musicOn = !this.musicOn; store.set('music', this.musicOn); if (this.mus) this.mus.gain.value = this.musicOn ? 0.32 : 0; BattleMusic.apply(); },
  noise(dur, f, vol, type = 'lowpass', f2, out, when) {
    if (!this.ctx) return; const c = this.ctx, t = when || c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.nb;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(out || this.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  tone(f, dur, type, vol, f2, out, when) {
    if (!this.ctx) return; const c = this.ctx, t = when || c.currentTime;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(out || this.sfx); o.start(t); o.stop(t + dur + 0.02);
  },
  hit(p) { this.noise(0.12 + p * 0.1, 1800, 0.5 + p * 0.3, 'lowpass', 300); this.tone(120 + Math.random() * 30, 0.14 + p * 0.1, 'sine', 0.7, 45); },
  block() { this.tone(1300, 0.05, 'square', 0.12, 700); this.noise(0.06, 3000, 0.3, 'highpass'); },
  whoosh(p = 1) { this.noise(0.14, 600, 0.18 * p, 'bandpass', 2600); },
  thud() { this.tone(90, 0.3, 'sine', 0.9, 35); this.noise(0.25, 500, 0.5, 'lowpass', 120); },
  zap() { this.tone(520, 0.25, 'sawtooth', 0.15, 1400); },
  ui() { this.tone(660, 0.05, 'square', 0.08, 880); },
  ok() { this.tone(520, 0.08, 'square', 0.1, 1040); this.tone(780, 0.12, 'square', 0.08, 1560); },
  horn() { this.tone(330, 0.35, 'square', 0.15); this.tone(415, 0.35, 'square', 0.12); },
  spray() { this.noise(0.5, 4000, 0.25, 'highpass'); },
  engine(d = 1.5) { this.tone(55, d, 'sawtooth', 0.12, 80); },
  say(text) {
    try {
      if (!this.on || !window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = 0.92; u.pitch = 0.55; u.volume = 0.9;
      const v = speechSynthesis.getVoices().find(v => /^de/i.test(v.lang)); if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { }
  },
  startMusic(arena = 0, round = 1, boss = false) { BattleMusic.start(arena, round, boss); },
  stopMusic() { BattleMusic.stop(); }

};

// ---------- вход: клавиатура, тъч, геймпад ----------
const Keys = { down: new Set(), pressed: new Set() };
const BLOCKED_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Slash', 'Tab']);
addEventListener('keydown', e => {
  if (!e.repeat) Keys.pressed.add(e.code);
  Keys.down.add(e.code);
  if (BLOCKED_KEYS.has(e.code)) e.preventDefault();
  Snd.init();
});
addEventListener('keyup', e => Keys.down.delete(e.code));
addEventListener('blur', () => { Keys.down.clear(); Keys.pressed.clear(); });

const MAPS = {
  solo: { l: ['KeyA', 'ArrowLeft'], r: ['KeyD', 'ArrowRight'], u: ['KeyW', 'ArrowUp'], d: ['KeyS', 'ArrowDown'], lp: ['KeyJ'], hp: ['KeyI'], lk: ['KeyK'], hk: ['KeyO'], bl: ['KeyL', 'ShiftLeft'], sp: ['KeyU', 'Space'] },
  p1: { l: ['KeyA'], r: ['KeyD'], u: ['KeyW'], d: ['KeyS'], lp: ['KeyF'], hp: ['KeyG'], lk: ['KeyV'], hk: ['KeyB'], bl: ['KeyH'], sp: ['KeyT'] },
  p2: { l: ['ArrowLeft'], r: ['ArrowRight'], u: ['ArrowUp'], d: ['ArrowDown'], lp: ['KeyK', 'Numpad4'], hp: ['KeyL', 'Numpad5'], lk: ['Comma', 'Numpad1'], hk: ['Period', 'Numpad2'], bl: ['Slash', 'Numpad3'], sp: ['KeyO', 'Numpad6'] }
};
const BTN = ['lp', 'hp', 'lk', 'hk', 'bl', 'sp'];
const Touch = { l: 0, r: 0, u: 0, d: 0, lp: 0, hp: 0, lk: 0, hk: 0, bl: 0, sp: 0, fin: 0, pressed: new Set(), active: MOBILE };
const Pads = { prev: [{}, {}] };

function padState(i) {
  const gps = navigator.getGamepads ? navigator.getGamepads() : [];
  const g = gps && gps[i]; if (!g) return null;
  const b = k => !!(g.buttons[k] && g.buttons[k].pressed);
  const ax = g.axes[0] || 0, ay = g.axes[1] || 0;
  return { l: b(14) || ax < -0.5, r: b(15) || ax > 0.5, u: b(12) || ay < -0.6, d: b(13) || ay > 0.6, lp: b(2), hp: b(3), lk: b(0), hk: b(1), bl: b(5) || b(7), sp: b(4) || b(6), start: b(9) };
}

function readInput(mapName, useTouch, padIdx) {
  const m = MAPS[mapName], o = { P: {} };
  for (const k in m) o[k] = m[k].some(c => Keys.down.has(c));
  for (const k in m) if (BTN.includes(k)) o.P[k] = m[k].some(c => Keys.pressed.has(c));
  if (useTouch) {
    for (const k of ['l', 'r', 'u', 'd', ...BTN]) o[k] = o[k] || !!Touch[k];
    for (const k of BTN) o.P[k] = o.P[k] || Touch.pressed.has(k);
    o.fin = Touch.pressed.has('fin');
  }
  if (padIdx != null) {
    const p = padState(padIdx), prev = Pads.prev[padIdx] || {};
    if (p) {
      for (const k of ['l', 'r', 'u', 'd', ...BTN]) o[k] = o[k] || p[k];
      for (const k of BTN) o.P[k] = o.P[k] || (p[k] && !prev[k]);
    }
  }
  return o;
}
function endInputFrame() {
  Keys.pressed.clear(); Touch.pressed.clear();
  for (let i = 0; i < 2; i++) { const p = padState(i); Pads.prev[i] = p || {}; }
}

// меню: общ вход
const MenuIn = { clicks: [] };
function menuInput() {
  const k = Keys.pressed, o = {
    up: k.has('ArrowUp') || k.has('KeyW'), down: k.has('ArrowDown') || k.has('KeyS'),
    left: k.has('ArrowLeft') || k.has('KeyA'), right: k.has('ArrowRight') || k.has('KeyD'),
    ok: k.has('Enter') || k.has('Space') || k.has('KeyJ') || k.has('KeyF') || k.has('NumpadEnter'),
    back: k.has('Escape') || k.has('Backspace') || k.has('KeyK') && false,
    // втори играч в избора на герой
    up2: k.has('ArrowUp'), down2: k.has('ArrowDown'), left2: k.has('ArrowLeft'), right2: k.has('ArrowRight'), ok2: k.has('KeyK') || k.has('Enter') || k.has('NumpadEnter'),
    up1: k.has('KeyW'), down1: k.has('KeyS'), left1: k.has('KeyA'), right1: k.has('KeyD'), ok1: k.has('KeyF') || k.has('Space'),
    click: MenuIn.clicks.shift() || null
  };
  for (let i = 0; i < 2; i++) {
    const p = padState(i), prev = Pads.prev[i] || {};
    if (!p) continue;
    const e = x => p[x] && !prev[x];
    if (e('u')) { o.up = true; o['up' + (i + 1)] = true; }
    if (e('d')) { o.down = true; o['down' + (i + 1)] = true; }
    if (e('l')) { o.left = true; o['left' + (i + 1)] = true; }
    if (e('r')) { o.right = true; o['right' + (i + 1)] = true; }
    if (e('lk') || e('start')) { o.ok = true; o['ok' + (i + 1)] = true; }
    if (e('hk')) o.back = true;
  }
  return o;
}

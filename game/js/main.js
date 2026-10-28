'use strict';
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const G = { screen: 'title', T: 0, sel: 0, mode: 'versus', diff: store.get('diff', 'normal'), regions: [], prevRegions: [], mouse: null, match: null, arcade: null, pick: [0, 7], ready: [false, false], arena: -1 };

// ---------- мащабиране ----------
function fit() {
  const wr = innerWidth / innerHeight, s = wr > W / H ? innerHeight / H : innerWidth / W;
  cv.style.width = Math.floor(W * s) + 'px'; cv.style.height = Math.floor(H * s) + 'px';
  document.body.classList.toggle('portrait', innerHeight > innerWidth && Touch.active);
}
addEventListener('resize', fit); fit();

function toCanvas(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
cv.addEventListener('pointerdown', e => { Snd.init(); const p = toCanvas(e); MenuIn.clicks.push(p); G.mouse = p; });
cv.addEventListener('pointermove', e => { G.mouse = toCanvas(e); G.mouseMoved = true; });

// ---------- тъч контроли ----------
const touchEl = document.getElementById('touch'), stick = document.getElementById('stick'), knob = document.getElementById('knob'), finBtn = document.getElementById('finBtn');
addEventListener('touchstart', () => { if (!Touch.active) { Touch.active = true; fit(); } }, { passive: true });
let stickId = null, stickO = [0, 0];
stick.addEventListener('pointerdown', e => { stickId = e.pointerId; stick.setPointerCapture(e.pointerId); const r = stick.getBoundingClientRect(); stickO = [r.left + r.width / 2, r.top + r.height / 2]; moveStick(e); Snd.init(); });
stick.addEventListener('pointermove', e => { if (e.pointerId === stickId) moveStick(e); });
const endStick = e => { if (e.pointerId !== stickId) return; stickId = null; Touch.l = Touch.r = Touch.u = Touch.d = 0; knob.style.transform = ''; };
stick.addEventListener('pointerup', endStick); stick.addEventListener('pointercancel', endStick);
function moveStick(e) {
  let dx = e.clientX - stickO[0], dy = e.clientY - stickO[1]; const r = stick.offsetWidth / 2, len = Math.hypot(dx, dy);
  if (len > r) { dx *= r / len; dy *= r / len; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  const dz = r * 0.3;
  Touch.l = dx < -dz; Touch.r = dx > dz; Touch.u = dy < -dz * 1.4; Touch.d = dy > dz * 1.2;
}
document.querySelectorAll('#btns button, #finBtn').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); Touch[k] = 1; Touch.pressed.add(k); b.classList.add('on'); Snd.init(); });
  const up = () => { Touch[k] = 0; b.classList.remove('on'); };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
});
document.getElementById('pauseBtn').addEventListener('pointerdown', e => { e.preventDefault(); togglePause(); });
document.addEventListener('contextmenu', e => e.preventDefault());

// ---------- помощни за менюта ----------
function region(x, y, w, h, fn, hover) { G.regions.push({ x, y, w, h, fn, hover }); }
function handleClicks(inp) {
  if (G.mouseMoved && G.mouse) { for (const r of G.prevRegions) if (r.hover && G.mouse[0] >= r.x && G.mouse[0] <= r.x + r.w && G.mouse[1] >= r.y && G.mouse[1] <= r.y + r.h) r.hover(); G.mouseMoved = false; }
  if (!inp.click) return false;
  for (const r of G.prevRegions) if (inp.click[0] >= r.x && inp.click[0] <= r.x + r.w && inp.click[1] >= r.y && inp.click[1] <= r.y + r.h) { r.fn(); return true; }
  return false;
}
function bg(i) { drawArenaBack(ctx, i, G.T); ctx.fillStyle = 'rgba(8,6,12,0.72)'; ctx.fillRect(0, 0, W, H); }
function txt(t, x, y, size, col = '#fff', align = 'center', font = FONT_D) { ctx.font = size + 'px ' + font; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(t, x, y); }
function wrapText(t, x, y, maxW, lh, size, col) {
  ctx.font = size + 'px ' + FONT_B; ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  let line = '', yy = y; for (const w of t.split(' ')) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = test; }
  if (line) ctx.fillText(line, x, yy); return yy + lh;
}
function menuList(items, x, y, gap, inp, size = 28) {
  if (inp.up) { G.sel = (G.sel + items.length - 1) % items.length; Snd.ui(); }
  if (inp.down) { G.sel = (G.sel + 1) % items.length; Snd.ui(); }
  items.forEach((it, i) => {
    const yy = y + i * gap, on = i === G.sel;
    ctx.font = size + 'px ' + FONT_D; const w = ctx.measureText(it.t).width + 40;
    if (on) { ctx.fillStyle = '#ffd23d'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 14, yy - size * 0.7); ctx.lineTo(x + w / 2 + 6, yy - size * 0.7); ctx.lineTo(x + w / 2 + 14, yy + size * 0.7); ctx.lineTo(x - w / 2 - 6, yy + size * 0.7); ctx.fill(); }
    txt(it.t, x, yy + 1, size, on ? '#0b0b0f' : '#f2efe8');
    if (it.sub && on) txt(it.sub, x, yy + size * 1.05, 13, '#d6d0c4', 'center', FONT_B);
    region(x - w / 2 - 14, yy - size * 0.75, w + 28, size * 1.5, () => { G.sel = i; Snd.ok(); it.fn(); }, () => { G.sel = i; });
  });
  if (inp.ok) { Snd.ok(); items[G.sel].fn(); }
}
function go(screen) { G.screen = screen; G.sel = 0; G.T0 = G.T; if (!['fight', 'result'].includes(screen)) Snd.stopMusic(); }
const DIFF_NAMES = { easy: 'ЛЕСНО', normal: 'НОРМАЛНО', hard: 'ТРУДНО' };

// ---------- екрани ----------
function titleScreen(inp) {
  bg((G.T / 600 | 0) % ARENAS.length);
  // лого
  ctx.save(); ctx.translate(W / 2, 112); ctx.rotate(-0.03);
  outlineText(ctx, 'FIGHT NOW', 0, 0, 92, '#ffd23d', 'center', 12);
  ctx.restore();
  outlineText(ctx, 'STRASSEN VON DEUTSCHLAND', W / 2, 172, 22, '#ff4f7b', 'center', 5);
  // въртящи се бойци
  const a = CHARS[(G.T / 180 | 0) % 15], b = CHARS[((G.T / 180 | 0) + 7) % 15];
  drawPortrait(ctx, a, 30, 200, 240, 300, 2.4, 1); drawPortrait(ctx, b, W - 270, 200, 240, 300, 2.4, -1);
  menuList([
    { t: 'АРКАДА', sub: '7 боя из кварталите на Германия', fn: () => { G.mode = 'arcade'; startSelect(); } },
    { t: 'СРЕЩУ КОМПЮТЪРА', sub: 'Избери себе си, противник и квартал', fn: () => { G.mode = 'versus'; startSelect(); } },
    { t: '2 ИГРАЧА', sub: 'Двама на една клавиатура (или геймпади)', fn: () => { G.mode = 'pvp'; startSelect(); } },
    { t: 'ТРЕНИРОВКА', sub: 'Безкраен живот — пробвай ударите', fn: () => { G.mode = 'training'; startSelect(); } },
    { t: 'КОНТРОЛИ', fn: () => go('controls') },
    { t: 'ТРУДНОСТ: ' + DIFF_NAMES[G.diff], fn: () => { G.diff = { easy: 'normal', normal: 'hard', hard: 'easy' }[G.diff]; store.set('diff', G.diff); } },
    { t: 'ЗВУК: ' + (Snd.on ? 'ДА' : 'НЕ') + '   МУЗИКА: ' + (Snd.musicOn ? 'ДА' : 'НЕ'), fn: () => { if (!Snd.on) Snd.toggle(); else if (Snd.musicOn) Snd.toggleMusic(); else { Snd.toggle(); Snd.toggleMusic(); } } }
  ], W / 2, 236, 40, inp, 24);
  txt('Без кръв. Само улица.', W / 2, H - 18, 13, '#a8a29e', 'center', FONT_B);
}

function controlsScreen(inp) {
  bg(9);
  outlineText(ctx, 'КОНТРОЛИ', W / 2, 46, 40, '#ffd23d');
  const rows = [
    ['', 'САМ (срещу CPU)', 'ИГРАЧ 1 (2 играчи)', 'ИГРАЧ 2'],
    ['Движение', 'W A S D  или стрелки', 'W A S D', 'Стрелки'],
    ['Удар', 'J', 'F', 'K  /  Num4'],
    ['Силен удар', 'I', 'G', 'L  /  Num5'],
    ['Ритник', 'K', 'V', ',  /  Num1'],
    ['Силен ритник', 'O', 'B', '.  /  Num2'],
    ['Блок', 'L  или  Shift', 'H', '/  /  Num3'],
    ['Специален', 'U  или  Space', 'T', 'O  /  Num6'],
    ['Пауза', 'Esc  или  P', '', '']
  ];
  rows.forEach((r, i) => r.forEach((c, j) => txt(c, [150, 370, 600, 810][j], 100 + i * 32, i === 0 ? 15 : 16, i === 0 ? '#ffd23d' : j === 0 ? '#d6d0c4' : '#fff', 'center', i === 0 || j === 0 ? FONT_D : FONT_B)));
  const tips = ['→ + Силен удар отблизо = хвърляне.  → + Силен удар отдалеч = специален удар на стила.', 'Спец = първи специален.  ← или → + Спец = втори.  ↓ + Спец с пълна енергия = СУПЕР.', 'Удари се свързват в комбо, ако първият попадне.  ↓ + Силен удар = ъперкът (вдига във въздуха).', 'Телефон: джойстик вляво, бутони вдясно. Геймпад: стандартна подредба.', 'След втората победа: „ERLEDIGE IHN!“ — въведи кода за ФИНАЛ (виж списъка с удари).'];
  tips.forEach((t, i) => txt(t, W / 2, 404 + i * 24, 14, '#e7e2d8', 'center', FONT_B));
  menuList([{ t: 'НАЗАД', fn: () => go('title') }], W / 2, H - 22, 40, inp, 20);
  if (inp.back) go('title');
}

function startSelect() { go('select'); G.ready = [false, false]; G.selStep = 0; G.pick = [store.get('lastPick', 0), (store.get('lastPick', 0) + 7) % 15]; }

function selectScreen(inp) {
  bg(4);
  const pvp = G.mode === 'pvp', step2 = !pvp && G.selStep === 1 && G.mode !== 'arcade';
  outlineText(ctx, pvp ? 'ИЗБЕРЕТЕ БОЙЦИ' : step2 ? 'ИЗБЕРИ ПРОТИВНИК' : 'ИЗБЕРИ БОЕЦ', W / 2, 36, 32, '#ffd23d');
  const gx = 232, gy = 70, cw = 98, ch = 104, cols = 5;
  const moveCur = (i, dx, dy) => { let c = G.pick[i] % cols + dx, r = (G.pick[i] / cols | 0) + dy; c = (c + cols) % cols; r = (r + 3) % 3; G.pick[i] = r * cols + c; Snd.ui(); };
  const active = step2 ? 1 : 0;
  if (pvp) {
    if (!G.ready[0]) { if (inp.left1) moveCur(0, -1, 0); if (inp.right1) moveCur(0, 1, 0); if (inp.up1) moveCur(0, 0, -1); if (inp.down1) moveCur(0, 0, 1); if (inp.ok1) { G.ready[0] = true; Snd.ok(); } }
    if (!G.ready[1]) { if (inp.left2) moveCur(1, -1, 0); if (inp.right2) moveCur(1, 1, 0); if (inp.up2) moveCur(1, 0, -1); if (inp.down2) moveCur(1, 0, 1); if (inp.ok2) { G.ready[1] = true; Snd.ok(); } }
  } else {
    if (inp.left) moveCur(active, -1, 0); if (inp.right) moveCur(active, 1, 0); if (inp.up) moveCur(active, 0, -1); if (inp.down) moveCur(active, 0, 1);
    if (inp.ok) confirmPick();
  }
  for (let i = 0; i < 15; i++) {
    const x = gx + (i % cols) * cw, y = gy + (i / cols | 0) * ch, c = CHARS[i];
    ctx.fillStyle = '#16131d'; ctx.fillRect(x, y, cw - 6, ch - 6);
    drawPortrait(ctx, c, x, y, cw - 6, ch - 6, 1.9);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y + ch - 26, cw - 6, 20); txt(c.name.toUpperCase(), x + (cw - 6) / 2, y + ch - 16, 12, '#fff');
    const p1 = G.pick[0] === i, p2 = (pvp || step2 || G.selStep === 1) && G.pick[1] === i;
    if (p1) { ctx.lineWidth = 4; ctx.strokeStyle = '#3b82f6'; ctx.strokeRect(x - 1, y - 1, cw - 4, ch - 4); txt('1P', x + 14, y + 10, 12, '#3b82f6'); }
    if (p2) { ctx.lineWidth = 4; ctx.strokeStyle = '#ef4444'; ctx.strokeRect(x + 2, y + 2, cw - 10, ch - 10); txt(pvp ? '2P' : 'CPU', x + cw - 24, y + 10, 12, '#ef4444'); }
    region(x, y, cw - 6, ch - 6, () => { if (pvp) { const k = G.ready[0] ? 1 : 0; G.pick[k] = i; G.ready[k] = true; Snd.ok(); } else { if (G.pick[active] === i) confirmPick(); else { G.pick[active] = i; Snd.ui(); } } });
  }
  // информационни панели
  const panel = (i, x, col, label) => {
    const c = CHARS[G.pick[i]];
    ctx.fillStyle = 'rgba(12,10,18,0.85)'; ctx.fillRect(x, 66, 214, 452); ctx.fillStyle = col; ctx.fillRect(x, 66, 214, 4);
    drawPortrait(ctx, c, x, 74, 214, 200, 2.6, x < W / 2 ? 1 : -1);
    txt(label, x + 10, 86, 12, col, 'left');
    outlineText(ctx, c.name.toUpperCase(), x + 107, 270, 24, '#fff');
    txt('„' + c.nick + '“  ·  ' + ARENAS[c.home].city, x + 107, 292, 11, '#d6d0c4', 'center', FONT_B);
    txt(STYLE_NAMES[c.style], x + 107, 310, 12, col, 'center', FONT_D);
    [['СИЛА', c.str], ['СКОРОСТ', c.spd], ['ТЕХНИКА', c.tec], ['ИЗДРЪЖЛИВОСТ', c.end]].forEach(([n, v], k) => {
      const y = 330 + k * 18; txt(n, x + 12, y, 11, '#cbd5e1', 'left', FONT_B); ctx.fillStyle = '#2a2633'; ctx.fillRect(x + 104, y - 5, 100, 10); ctx.fillStyle = col; ctx.fillRect(x + 104, y - 5, v * 10, 10);
    });
    wrapText(c.bio, x + 12, 404, 190, 15, 11.5, '#e7e2d8');
    txt('СПЕЦ: ' + c.sp1.name, x + 12, 470, 11, '#ffd23d', 'left', FONT_B);
    txt('←/→ + СПЕЦ: ' + c.sp2.name, x + 12, 486, 11, '#ffd23d', 'left', FONT_B);
    txt('ФИНАЛ: ' + c.finName, x + 12, 502, 11, '#ff6b6b', 'left', FONT_B);
  };
  panel(0, 10, '#3b82f6', pvp ? 'ИГРАЧ 1' : 'ТИ');
  if (pvp || G.selStep === 1) panel(1, W - 224, '#ef4444', pvp ? 'ИГРАЧ 2' : 'ПРОТИВНИК');
  else { ctx.fillStyle = 'rgba(12,10,18,0.85)'; ctx.fillRect(W - 224, 66, 214, 452); txt(G.mode === 'arcade' ? '7 противника' : 'Следва: противник', W - 117, 260, 15, '#d6d0c4', 'center', FONT_B); txt(G.mode === 'arcade' ? 'чакат по кварталите' : '', W - 117, 282, 15, '#d6d0c4', 'center', FONT_B); }
  const helpY = 404;
  ctx.fillStyle = 'rgba(12,10,18,0.85)'; ctx.fillRect(232, helpY - 14, 484, 114);
  const c = CHARS[G.pick[active]], h = ARENAS[c.home];
  txt('Квартал: ' + h.name + ' (' + h.city + ')', 474, helpY + 4, 14, '#fff', 'center', FONT_B);
  txt(pvp ? 'Играч 1: WASD + F   ·   Играч 2: стрелки + K' : 'Стрелки/WASD за избор, Enter или клик за потвърждение', 474, helpY + 28, 12, '#a8a29e', 'center', FONT_B);
  // бутони
  const btn = (t, x, y, w, fn, col = '#ffd23d') => { ctx.fillStyle = col; ctx.fillRect(x, y, w, 34); txt(t, x + w / 2, y + 18, 15, '#0b0b0f'); region(x, y, w, 34, fn); };
  btn('НАЗАД', 250, helpY + 48, 130, () => { if (G.selStep === 1) G.selStep = 0; else go('title'); }, '#a8a29e');
  btn('СПИСЪК С УДАРИ', 392, helpY + 48, 170, () => { G.moveFor = CHARS[G.pick[active]]; G.moveBack = 'select'; go('moves'); }, '#e7e2d8');
  btn(pvp ? 'НАПРЕД' : 'ИЗБЕРИ', 574, helpY + 48, 130, () => { if (pvp) { G.ready = [true, true]; } else confirmPick(); });
  if (inp.back) { if (G.selStep === 1) G.selStep = 0; else go('title'); }
  if (pvp && G.ready[0] && G.ready[1]) { G.ready = [false, false]; go('stage'); }
  function confirmPick() {
    Snd.ok(); store.set('lastPick', G.pick[0]);
    if (G.mode === 'arcade') return startArcade();
    if (G.selStep === 0) { G.selStep = 1; if (G.pick[1] === G.pick[0]) G.pick[1] = (G.pick[0] + 7) % 15; return; }
    go('stage');
  }
}

function stageScreen(inp) {
  bg(G.arena >= 0 ? G.arena : 0);
  outlineText(ctx, 'ИЗБЕРИ КВАРТАЛ', W / 2, 36, 32, '#ffd23d');
  const cols = 5, cw = 180, ch = 120, gx = (W - cols * cw) / 2 + 4, gy = 66;
  const n = ARENAS.length;
  if (G.stageCur == null) G.stageCur = CHARS[G.pick[1]].home;
  if (inp.left) { G.stageCur = (G.stageCur + n - 1) % n; Snd.ui(); } if (inp.right) { G.stageCur = (G.stageCur + 1) % n; Snd.ui(); }
  if (inp.up) { G.stageCur = (G.stageCur + n - cols) % n; Snd.ui(); } if (inp.down) { G.stageCur = (G.stageCur + cols) % n; Snd.ui(); }
  for (let i = 0; i < n; i++) {
    const x = gx + (i % cols) * cw, y = gy + (i / cols | 0) * ch, a = ARENAS[i];
    ctx.drawImage(arenaCanvas(i), x, y, cw - 10, ch - 30);
    ctx.fillStyle = '#16131d'; ctx.fillRect(x, y + ch - 30, cw - 10, 24);
    txt(a.name, x + (cw - 10) / 2, y + ch - 22, 12, '#fff'); txt(a.city, x + (cw - 10) / 2, y + ch - 10, 9, '#a8a29e', 'center', FONT_B);
    if (G.stageCur === i) { ctx.lineWidth = 4; ctx.strokeStyle = '#ffd23d'; ctx.strokeRect(x - 2, y - 2, cw - 6, ch - 4); }
    region(x, y, cw - 10, ch - 6, () => { if (G.stageCur === i) startFight(i); else { G.stageCur = i; Snd.ui(); } });
  }
  const a = ARENAS[G.stageCur], owner = CHARS.find(c => c.home === G.stageCur);
  txt(a.name + ' — ' + a.city + '   ·   квартал на ' + owner.full, W / 2, 448, 15, '#fff', 'center', FONT_B);
  const btn = (t, x, w, fn, col = '#ffd23d') => { ctx.fillStyle = col; ctx.fillRect(x, 474, w, 36); txt(t, x + w / 2, 493, 16, '#0b0b0f'); region(x, 474, w, 36, fn); };
  btn('НАЗАД', W / 2 - 290, 160, () => { G.stageCur = null; startSelect(); }, '#a8a29e');
  btn('СЛУЧАЕН', W / 2 - 110, 200, () => startFight(Math.random() * n | 0), '#e7e2d8');
  btn('БИЙ СЕ!', W / 2 + 110, 180, () => startFight(G.stageCur));
  if (inp.ok) startFight(G.stageCur);
  if (inp.back) { G.stageCur = null; startSelect(); }
}

function startArcade() {
  const others = CHARS.map((c, i) => i).filter(i => i !== G.pick[0]).sort(() => Math.random() - 0.5).slice(0, 7);
  G.arcade = { list: others, i: 0, cont: 3 };
  nextArcade();
}
function nextArcade() {
  const A = G.arcade, opp = A.list[A.i];
  G.pick[1] = opp;
  const lvl = A.i < 2 ? (G.diff === 'hard' ? 'normal' : 'easy') : A.i < 5 ? G.diff : 'hard';
  startFight(CHARS[opp].home, lvl);
}
function startFight(arena, lvl) {
  G.stageCur = null;
  const c1 = CHARS[G.pick[0]], c2 = CHARS[G.pick[1]];
  const human1 = { type: 'human', map: G.mode === 'pvp' ? 'p1' : 'solo', touch: true, pad: 0 };
  const ctrl2 = G.mode === 'pvp' ? { type: 'human', map: 'p2', touch: false, pad: 1 } : G.mode === 'training' ? { type: 'dummy' } : { type: 'cpu', level: lvl || G.diff };
  G.matchOpts = { mode: G.mode, arena, c1, c2, ctrl1: human1, ctrl2 };
  G.vsT = 0; go('vs'); Snd.say(c1.name + ' gegen ' + c2.name);
}

function vsScreen(inp) {
  const o = G.matchOpts, t = G.T - G.T0;
  drawArenaBack(ctx, o.arena, G.T); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
  const k = easeOut(t / 30);
  ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W / 2 * k + 40, 0); ctx.lineTo(W / 2 * k - 40, H); ctx.lineTo(0, H); ctx.fill();
  ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W - W / 2 * k + 40, 0); ctx.lineTo(W - W / 2 * k - 40, H); ctx.lineTo(W, H); ctx.fill();
  drawPortrait(ctx, o.c1, 40 - (1 - k) * 300, 60, 360, 380, 3.4, 1);
  drawPortrait(ctx, o.c2, W - 400 + (1 - k) * 300, 60, 360, 380, 3.4, -1);
  outlineText(ctx, o.c1.full.toUpperCase(), 220, 470, 22, '#fff'); outlineText(ctx, o.c2.full.toUpperCase(), W - 220, 470, 22, '#fff');
  const s = 1 + Math.max(0, 1 - (t - 20) / 12) * 2; ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s); outlineText(ctx, 'VS', 0, 0, 90, '#ffd23d', 'center', 10); ctx.restore();
  txt(ARENAS[o.arena].name.toUpperCase() + ' · ' + ARENAS[o.arena].city, W / 2, H - 30, 16, '#fff', 'center', FONT_B);
  if (G.mode === 'arcade') txt('БОЙ ' + (G.arcade.i + 1) + ' / 7', W / 2, 40, 22, '#ffd23d');
  if (t > 150 || (t > 30 && (inp.ok || inp.click))) { G.match = new Match(o); go('fight'); Snd.startMusic(o.arena); }
}

function togglePause() {
  if (G.screen !== 'fight' || !G.match) return;
  G.match.paused = !G.match.paused; G.sel = 0; Snd.ui();
  BattleMusic.paused = G.match.paused; BattleMusic.apply();
}
function fightScreen(inp) {
  const m = G.match;
  BattleMusic.syncMatch(m, G.mode === 'arcade' && G.arcade && G.arcade.i === G.arcade.list.length - 1);
  if (Keys.pressed.has('Escape') || Keys.pressed.has('KeyP')) togglePause();
  const pad = padState(0); if (pad && pad.start && !(Pads.prev[0] || {}).start) togglePause();
  m.update();
  m.draw(ctx);
  // FINALE бутон на телефон
  const showFin = Touch.active && m.phase === 'finishPrompt' && m.winner.ctrl.type === 'human' && m.winner.side === 0;
  finBtn.hidden = !showFin;
  if (m.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
    outlineText(ctx, 'ПАУЗА', W / 2, 110, 54, '#ffd23d');
    txt(BattleMusic.title, W / 2, 154, 16, '#a8a29e', 'center', FONT_B);
    menuList([
      { t: 'ПРОДЪЛЖИ', fn: () => togglePause() },
      { t: 'СПИСЪК С УДАРИ', fn: () => { G.moveFor = m.p[0].c; G.moveBack = 'fight'; G.screen = 'moves'; } },
      { t: 'РЕСТАРТ', fn: () => { G.match = new Match(G.matchOpts); } },
      { t: 'МУЗИКА: ' + (Snd.musicOn ? 'ДА' : 'НЕ'), fn: () => Snd.toggleMusic() },
      { t: 'ДРУГ БОЕЦ', fn: () => { Snd.stopMusic(); startSelect(); } },
      { t: 'ГЛАВНО МЕНЮ', fn: () => { Snd.stopMusic(); go('title'); } }
    ], W / 2, 200, 52, inp, 26);
    return;
  }
  if (m.phase === 'matchOver') { G.resultT = G.T; go('result'); }
}

function resultScreen(inp) {
  const m = G.match, r = m.result, t = G.T - G.T0;
  m.T++; m.draw(ctx);
  ctx.fillStyle = 'rgba(0,0,0,' + Math.min(0.7, t / 40) + ')'; ctx.fillRect(0, 0, W, H);
  const won = r.winner.side === 0 || G.mode === 'pvp';
  outlineText(ctx, (r.winner.c.name + ' ПЕЧЕЛИ').toUpperCase(), W / 2, 90, 52, '#ffd23d');
  if (r.finisher) outlineText(ctx, 'FINALE: „' + r.winner.c.finName + '“', W / 2, 146, 26, '#ff4f4f');
  else if (r.flawless) outlineText(ctx, 'MAKELLOS', W / 2, 146, 26, '#9dff6a');
  drawPortrait(ctx, r.winner.c, W / 2 - 110, 170, 220, 180, 2.8);
  const items = [];
  if (G.mode === 'arcade') {
    if (r.winner.side === 0) {
      if (G.arcade.i < 6) items.push({ t: 'СЛЕДВАЩ БОЙ', fn: () => { G.arcade.i++; nextArcade(); } });
      else { outlineText(ctx, 'ТИ СИ ЦАР НА УЛИЦАТА!', W / 2, 372, 30, '#9dff6a'); items.push({ t: 'ОТНАЧАЛО', fn: () => startSelect() }); }
    } else if (G.arcade.cont > 0) items.push({ t: 'ПРОДЪЛЖИ (' + G.arcade.cont + ')', fn: () => { G.arcade.cont--; nextArcade(); } });
  } else items.push({ t: 'РЕВАНШ', fn: () => { G.vsT = 0; go('vs'); } });
  items.push({ t: 'ДРУГ БОЕЦ', fn: () => { Snd.stopMusic(); startSelect(); } }, { t: 'ГЛАВНО МЕНЮ', fn: () => { Snd.stopMusic(); go('title'); } });
  if (t > 40) menuList(items, W / 2, 404, 44, inp, 24);
}

function movesScreen(inp) {
  const c = G.moveFor;
  bg(c.home);
  outlineText(ctx, c.full.toUpperCase(), W / 2, 36, 28, '#ffd23d');
  txt(STYLE_NAMES[c.style] + '  ·  ' + ARENAS[c.home].name + ', ' + ARENAS[c.home].city, W / 2, 64, 14, '#d6d0c4', 'center', FONT_B);
  drawPortrait(ctx, c, 20, 90, 230, 380, 3, 1);
  const M = c.moves, A = { D: '↓', F: '→', B: '←' }, BN = { lp: 'Удар', hp: 'Силен удар', lk: 'Ритник', hk: 'Силен ритник' };
  const rows = [
    ['ОСНОВНИ', ''],
    ['Удар', M.LP.name], ['Силен удар', M.HP.name], ['→ + Силен удар', M.fHP.name], ['Ритник', M.LK.name], ['Силен ритник', M.HK.name],
    ['↓ + Удар / Ритник', M.cLP.name + ' / ' + M.cLK.name], ['↓ + Силен удар', 'Ъперкът (вдига)'], ['↓ + Силен ритник', 'Подсичане (събаря)'], ['→ + Силен удар (близо)', 'Хвърляне'],
    ['СПЕЦИАЛНИ', ''],
    ['Спец', c.sp1.name + ' — ' + c.sp1.desc], ['← или → + Спец', c.sp2.name + ' — ' + c.sp2.desc], ['↓ + Спец (пълна енергия)', 'СУПЕР: ' + c.sup.name],
    ['ФИНАЛ', ''],
    [c.code.slice(0, 3).map(d => A[d]).join(' ') + ' + ' + BN[c.code[3]], '„' + c.finName + '“ (близо, след „ERLEDIGE…“)']
  ];
  rows.forEach(([a, b], i) => {
    const y = 104 + i * 25;
    if (!b) { txt(a, 280, y, 15, '#ff6b6b', 'left'); return; }
    txt(a, 280, y, 14, '#ffd23d', 'left', FONT_D); txt(b, 520, y, 14, '#f2efe8', 'left', FONT_B);
  });
  menuList([{ t: 'НАЗАД', fn: () => { G.screen = G.moveBack; } }], W / 2, H - 26, 40, inp, 20);
  if (inp.back) G.screen = G.moveBack;
}

// ---------- главен цикъл ----------
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  let steps = 0;
  while (acc >= 1000 / 60 && steps < 4) {
    acc -= 1000 / 60; steps++;
    G.T++;
    G.prevRegions = G.regions; G.regions = [];
    const inp = menuInput();
    if (G.screen !== 'fight' || (G.match && G.match.paused)) { if (handleClicks(inp)) inp.ok = false; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    switch (G.screen) {
      case 'title': titleScreen(inp); break;
      case 'controls': controlsScreen(inp); break;
      case 'select': selectScreen(inp); break;
      case 'stage': stageScreen(inp); break;
      case 'vs': vsScreen(inp); break;
      case 'fight': fightScreen(inp); break;
      case 'result': resultScreen(inp); break;
      case 'moves': movesScreen(inp); break;
    }
    touchEl.hidden = !(Touch.active && G.screen === 'fight' && G.match && !G.match.paused && G.match.phase !== 'matchOver');
    endInputFrame();
  }
  requestAnimationFrame(frame);
}
function boot() {
  const ld = document.getElementById('loading'); if (ld) ld.remove();
  invalidateArenas();
  requestAnimationFrame(frame);
}
const fontsReady = document.fonts && document.fonts.load
  ? Promise.race([Promise.all([document.fonts.load('40px "Russo One"'), document.fonts.load('14px "Rubik"')]), new Promise(r => setTimeout(r, 1500))])
  : Promise.resolve();
Promise.all([fontsReady.catch(() => {}), CharacterArt.ready, ArenaArt.ready]).then(boot, boot);

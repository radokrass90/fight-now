'use strict';
// ---------- 15 квартала ----------
function fillPoly(ctx, pts, col) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }

function skyline(ctx, rnd, col, base, minH, maxH, winCol, density = 0.25) {
  let x = -10;
  while (x < W + 10) {
    const w = 30 + rnd() * 70, h = minH + rnd() * (maxH - minH);
    ctx.fillStyle = col; ctx.fillRect(x, base - h, w, h);
    if (winCol) {
      ctx.fillStyle = winCol;
      for (let yy = base - h + 8; yy < base - 8; yy += 11) for (let xx = x + 5; xx < x + w - 6; xx += 9) if (rnd() < density) ctx.fillRect(xx, yy, 4, 5);
    }
    x += w + rnd() * 6;
  }
}
function facade(ctx, rnd, x, y, w, h, col, win, lit = 0.4, opt = {}) {
  ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = shade(col, -0.25); ctx.fillRect(x, y, w, 6);
  const cols = Math.max(2, Math.floor(w / (opt.ww || 38))), rows = Math.max(1, Math.floor((h - (opt.shop || 0)) / (opt.wh || 44)));
  const cw = w / cols, rh = (h - (opt.shop || 0)) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const wx = x + c * cw + cw * 0.22, wy = y + 14 + r * rh, ww = cw * 0.56, wh = rh * 0.55;
    ctx.fillStyle = rnd() < lit ? win : shade(col, -0.45); ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = shade(col, -0.3); ctx.fillRect(wx - 2, wy + wh, ww + 4, 3);
  }
}
function shop(ctx, x, y, w, h, col, glass = '#1b2a3a', lit = '#ffd27a') {
  ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
  const g = ctx.createLinearGradient(0, y + 22, 0, y + h); g.addColorStop(0, lit); g.addColorStop(1, glass);
  ctx.fillStyle = g; ctx.fillRect(x + 8, y + 24, w - 16, h - 30);
  ctx.strokeStyle = shade(col, -0.4); ctx.lineWidth = 3; ctx.strokeRect(x + 8, y + 24, w - 16, h - 30);
  ctx.beginPath(); ctx.moveTo(x + w / 2, y + 24); ctx.lineTo(x + w / 2, y + h - 6); ctx.stroke();
}
function sign(ctx, text, x, y, size, col, bg) {
  ctx.font = size + 'px ' + FONT_D; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (bg) { const w = ctx.measureText(text).width + 16; ctx.fillStyle = bg; ctx.fillRect(x - w / 2, y - size * 0.75, w, size * 1.5); }
  ctx.fillStyle = col; ctx.fillText(text, x, y);
}
function neon(ctx, text, x, y, size, col, on = 1) {
  ctx.save(); ctx.font = size + 'px ' + FONT_D; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (on) { ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.shadowBlur = 6; ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.6; ctx.fillText(text, x, y); }
  else { ctx.fillStyle = shade(col, -0.6); ctx.fillText(text, x, y); }
  ctx.restore();
}
function lamp(ctx, x, top, col = '#ffb347') {
  ctx.fillStyle = '#1c1c22'; ctx.fillRect(x - 3, top, 6, GROUND - 26 - top); ctx.fillRect(x - 3, top, 30, 5);
  ctx.fillStyle = col; ctx.fillRect(x + 18, top + 4, 16, 5);
  const g = ctx.createRadialGradient(x + 26, top + 10, 4, x + 26, top + 10, 140); g.addColorStop(0, col + 'aa'); g.addColorStop(1, col + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + 18, top + 8); ctx.lineTo(x - 70, GROUND - 24); ctx.lineTo(x + 130, GROUND - 24); ctx.lineTo(x + 34, top + 8); ctx.fill();
}
function bin(ctx, x, col = '#2f5d3a') { rr(ctx, x, GROUND - 74, 46, 52, 4, col); rr(ctx, x - 3, GROUND - 80, 52, 8, 2, shade(col, -0.2)); }
function car(ctx, x, col, flip = 1) {
  ctx.save(); ctx.translate(x, GROUND - 24); ctx.scale(flip, 1);
  rr(ctx, -70, -32, 140, 26, 9, col); rr(ctx, -42, -54, 80, 26, 10, col);
  ctx.fillStyle = '#1e293b'; ctx.fillRect(-36, -50, 32, 18); ctx.fillRect(2, -50, 30, 18);
  wheel(ctx, -42, -4, 13, 0); wheel(ctx, 44, -4, 13, 0); ctx.restore();
}
function moon(ctx, x, y, r, col = '#f5f0dc') { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 30; dot(ctx, [x, y], r, col, false); ctx.restore(); }
function stars(ctx, rnd, n, maxY) { ctx.fillStyle = '#ffffff'; for (let i = 0; i < n; i++) { ctx.globalAlpha = 0.3 + rnd() * 0.6; ctx.fillRect(rnd() * W, rnd() * maxY, 1.5, 1.5); } ctx.globalAlpha = 1; }
function skyGrad(ctx, cols) { const g = ctx.createLinearGradient(0, 0, 0, GROUND - 30); cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function ground(ctx, col, kind) {
  const y = GROUND - 26;
  ctx.fillStyle = shade(col, 0.15); ctx.fillRect(0, y - 8, W, 10);
  ctx.fillStyle = col; ctx.fillRect(0, y, W, H - y);
  const r = seeded(7);
  if (kind === 'cobble') { ctx.fillStyle = shade(col, -0.25); for (let yy = y + 6; yy < H; yy += 12) for (let xx = (yy / 12 % 2) * 12; xx < W; xx += 24) ctx.fillRect(xx, yy, 20, 8); }
  else if (kind === 'dock') { ctx.fillStyle = '#e8c547'; for (let xx = 0; xx < W; xx += 120) ctx.fillRect(xx, GROUND + 22, 60, 6); }
  else { ctx.fillStyle = shade(col, -0.2); for (let i = 0; i < 260; i++) ctx.fillRect(r() * W, y + r() * (H - y), 2 + r() * 3, 1.5); ctx.fillStyle = shade(col, 0.2); ctx.fillRect(0, GROUND + 24, W, 2); }
  const g = ctx.createLinearGradient(0, y, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = g; ctx.fillRect(0, y, W, H - y);
}
function puddles(ctx, col) { ctx.fillStyle = col; ctx.globalAlpha = 0.18; [[180, 500, 90], [620, 515, 120], [860, 495, 60]].forEach(([x, y, w]) => { ctx.beginPath(); ctx.ellipse(x, y, w, 7, 0, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1; }

// забележителности
const LM = {
  tvtower(ctx, x, b, s, col) { ctx.fillStyle = col; ctx.fillRect(x - 4 * s, b - 230 * s, 8 * s, 230 * s); dot(ctx, [x, b - 200 * s], 16 * s, col, false); ctx.fillRect(x - 1.5 * s, b - 290 * s, 3 * s, 70 * s); ctx.fillStyle = '#ff3b3b'; ctx.fillRect(x - 1.5 * s, b - 292 * s, 3 * s, 4 * s); },
  dom(ctx, x, b, s, col) { ctx.fillStyle = col; [-22, 22].forEach(o => { ctx.fillRect(x + o * s - 12 * s, b - 180 * s, 24 * s, 180 * s); fillPoly(ctx, [[x + o * s - 12 * s, b - 180 * s], [x + o * s, b - 250 * s], [x + o * s + 12 * s, b - 180 * s]], col); }); ctx.fillRect(x - 60 * s, b - 90 * s, 120 * s, 90 * s); },
  crane(ctx, x, b, s, col) { ctx.strokeStyle = col; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(x, b); ctx.lineTo(x, b - 170 * s); ctx.lineTo(x + 140 * s, b - 170 * s); ctx.moveTo(x - 50 * s, b - 170 * s); ctx.lineTo(x, b - 170 * s); ctx.moveTo(x, b - 200 * s); ctx.lineTo(x + 140 * s, b - 170 * s); ctx.moveTo(x, b - 200 * s); ctx.lineTo(x - 50 * s, b - 170 * s); ctx.moveTo(x, b - 200 * s); ctx.lineTo(x, b - 170 * s); ctx.stroke(); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 110 * s, b - 170 * s); ctx.lineTo(x + 110 * s, b - 100 * s); ctx.stroke(); },
  towers(ctx, rnd, b, col, win) { [[620, 60, 300], [690, 50, 250], [760, 70, 340], [850, 55, 280], [540, 45, 210]].forEach(([x, w, h]) => { ctx.fillStyle = col; ctx.fillRect(x, b - h, w, h); ctx.fillStyle = win; for (let yy = b - h + 8; yy < b; yy += 9) for (let xx = x + 4; xx < x + w - 4; xx += 7) if (rnd() < 0.35) ctx.fillRect(xx, yy, 3, 4); }); fillPoly(ctx, [[760, b - 340], [795, b - 380], [830, b - 340]], col); },
  stadium(ctx, x, b, col) { ctx.fillStyle = col; ctx.fillRect(x - 200, b - 70, 400, 70); [-190, -60, 60, 190].forEach(o => { ctx.fillStyle = '#f5c400'; ctx.fillRect(x + o - 4, b - 140, 8, 140); ctx.fillStyle = '#fff7c2'; ctx.fillRect(x + o - 16, b - 150, 32, 10); }); const g = ctx.createRadialGradient(x, b - 150, 10, x, b - 150, 260); g.addColorStop(0, 'rgba(255,240,180,0.35)'); g.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = g; ctx.fillRect(x - 300, b - 400, 600, 400); },
  monument(ctx, x, b, col) { fillPoly(ctx, [[x - 90, b], [x - 60, b - 90], [x - 30, b - 150], [x + 30, b - 150], [x + 60, b - 90], [x + 90, b]], col); ctx.fillRect(x - 20, b - 170, 40, 22); },
  stacks(ctx, b, col) { [[620, 220], [680, 260], [740, 200], [860, 240]].forEach(([x, h]) => { ctx.fillStyle = col; ctx.fillRect(x, b - h, 22, h); ctx.fillStyle = '#ef4444'; ctx.fillRect(x, b - h + 10, 22, 6); }); ctx.fillStyle = col; ctx.fillRect(540, b - 120, 300, 120); },
  rathaus(ctx, x, b, col) { ctx.fillStyle = col; ctx.fillRect(x - 120, b - 80, 240, 80); ctx.fillRect(x - 30, b - 130, 60, 50); ctx.beginPath(); ctx.ellipse(x, b - 130, 34, 46, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 4, b - 196, 8, 24); },
  frauenkirche(ctx, x, b, col) { ctx.fillStyle = col; ctx.fillRect(x - 90, b - 110, 180, 110); [-50, 50].forEach(o => { ctx.fillRect(x + o - 20, b - 230, 40, 230); ctx.beginPath(); ctx.ellipse(x + o, b - 236, 22, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + o - 3, b - 276, 6, 20); }); },
  burg(ctx, x, b, col) { fillPoly(ctx, [[x - 260, b], [x - 120, b - 60], [x + 160, b - 70], [x + 300, b]], shade(col, -0.2)); ctx.fillStyle = col; ctx.fillRect(x - 90, b - 120, 200, 60); ctx.fillRect(x + 40, b - 175, 36, 60); ctx.beginPath(); ctx.arc(x + 58, b - 175, 18, Math.PI, 0); ctx.fill(); ctx.fillRect(x - 80, b - 150, 30, 40); fillPoly(ctx, [[x - 84, b - 150], [x - 65, b - 185], [x - 46, b - 150]], col); },
  headframe(ctx, x, b, col) { ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 50, b); ctx.lineTo(x - 30, b - 160); ctx.lineTo(x + 30, b - 160); ctx.lineTo(x + 50, b); ctx.moveTo(x - 30, b - 160); ctx.lineTo(x + 50, b); ctx.moveTo(x + 30, b - 160); ctx.lineTo(x - 50, b); ctx.moveTo(x - 30, b - 110); ctx.lineTo(x + 38, b - 110); ctx.stroke(); dot(ctx, [x - 14, b - 170], 12, col, false); dot(ctx, [x + 14, b - 170], 12, col, false); ctx.fillStyle = col; ctx.fillRect(x - 120, b - 60, 70, 60); },
  platte(ctx, rnd, x, b, w, h, col, win) { facade(ctx, rnd, x, b - h, w, h, col, win, 0.3, { ww: 22, wh: 22 }); }
};

const ARENAS = [
  { name: 'Hermannplatz', city: 'Берлин-Нойкьолн', ground: '#2b2b33', fx: 'rain',
    build(ctx, r) { skyGrad(ctx, ['#0d0a1f', '#2d1b4e', '#5b2a5e']); stars(ctx, r, 60, 200); skyline(ctx, r, '#1a1530', 330, 60, 150, '#ffcc6633'); LM.tvtower(ctx, 720, 330, 1, '#1a1530');
      facade(ctx, r, 0, 170, 300, 300, '#5a4a42', '#ffd88a', 0.45, { shop: 90 }); facade(ctx, r, 300, 150, 260, 320, '#6b5b4f', '#ffd88a', 0.35, { shop: 90 }); facade(ctx, r, 560, 190, 400, 280, '#4a4a55', '#9fd3ff', 0.3, { shop: 90 });
      shop(ctx, 20, 380, 260, 92, '#3a2f2a'); shop(ctx, 600, 380, 320, 92, '#2a2a33', '#1a2a2a', '#c4f0ff');
      ctx.fillStyle = '#1d4ed8'; ctx.fillRect(380, 370, 44, 44); sign(ctx, 'U', 402, 392, 34, '#fff'); lamp(ctx, 470, 230); bin(ctx, 860); ground(ctx, '#2b2b33'); puddles(ctx, '#ff4fd8'); },
    neon: [{ t: 'SPÄTI 24/7', x: 150, y: 398, s: 26, c: '#ff4fd8' }, { t: 'HANDY • SHISHA', x: 760, y: 398, s: 20, c: '#4ff0ff' }] },
  { name: 'Reeperbahn', city: 'Хамбург-Санкт Паули', ground: '#25222c', fx: 'rain',
    build(ctx, r) { skyGrad(ctx, ['#050816', '#14193a', '#3a1640']); stars(ctx, r, 40, 160); LM.crane(ctx, 80, 330, 1, '#141832'); LM.crane(ctx, 820, 320, 0.8, '#141832'); skyline(ctx, r, '#14112a', 330, 40, 110);
      facade(ctx, r, 0, 160, 330, 310, '#2a1f33', '#ff8ad8', 0.3, { shop: 110 }); facade(ctx, r, 330, 200, 300, 270, '#331c2a', '#ffcf6b', 0.35, { shop: 110 }); facade(ctx, r, 630, 150, 330, 320, '#1f2433', '#7cf6ff', 0.3, { shop: 110 });
      shop(ctx, 30, 370, 270, 100, '#140f1a', '#1a0f1a', '#ff7bd8'); shop(ctx, 360, 370, 240, 100, '#1a1014', '#1a0f0f', '#ffb36b'); shop(ctx, 660, 370, 270, 100, '#0f1420', '#0f1420', '#7cf6ff'); ground(ctx, '#25222c'); puddles(ctx, '#ff3d7f'); },
    neon: [{ t: 'KIEZ BAR', x: 165, y: 330, s: 30, c: '#ff3d7f' }, { t: 'HAFEN-CLUB', x: 480, y: 340, s: 26, c: '#ffb020' }, { t: 'HOTEL', x: 795, y: 320, s: 30, c: '#4ff0ff' }, { t: 'LIVE MUSIK', x: 795, y: 360, s: 16, c: '#a3ff4f', blink: 1 }] },
  { name: 'Kaiserstraße', city: 'Франкфурт-Банхофсфиртел', ground: '#302a2a',
    build(ctx, r) { skyGrad(ctx, ['#1e1b3a', '#7a3b5e', '#f08a4b']); LM.towers(ctx, r, 330, '#2a2440', '#ffe2a8'); skyline(ctx, r, '#3a2d40', 330, 40, 90);
      facade(ctx, r, 0, 180, 280, 290, '#7a6a5a', '#ffe1a0', 0.35, { shop: 90 }); facade(ctx, r, 280, 160, 360, 310, '#8a7766', '#ffe1a0', 0.3, { shop: 90 }); facade(ctx, r, 640, 190, 320, 280, '#6a5d55', '#ffe1a0', 0.4, { shop: 90 });
      shop(ctx, 20, 380, 240, 90, '#3a3230'); shop(ctx, 320, 380, 280, 90, '#2f2a2a', '#1a1414', '#ffd36b'); shop(ctx, 680, 380, 250, 90, '#3a3230'); lamp(ctx, 290, 240); ground(ctx, '#302a2a'); },
    neon: [{ t: 'WECHSELSTUBE', x: 140, y: 398, s: 20, c: '#4fffa0' }, { t: 'PFANDHAUS', x: 460, y: 398, s: 26, c: '#ffcf33' }, { t: 'GOLD ANKAUF', x: 805, y: 398, s: 20, c: '#ff5a5a', blink: 1 }] },
  { name: 'Nordstadt', city: 'Дортмунд', ground: '#2a2c2a',
    build(ctx, r) { skyGrad(ctx, ['#070b14', '#16223a', '#2c3550']); stars(ctx, r, 50, 150); LM.stadium(ctx, 520, 330, '#151b2a'); skyline(ctx, r, '#121826', 340, 30, 80, '#ffd96633');
      facade(ctx, r, 0, 200, 300, 270, '#5d5248', '#ffd88a', 0.35, { shop: 90 }); facade(ctx, r, 660, 180, 300, 290, '#4f4a45', '#ffd88a', 0.35, { shop: 90 });
      shop(ctx, 30, 380, 240, 90, '#2c2620'); ctx.fillStyle = '#1b1f2a'; ctx.fillRect(300, 300, 360, 170);
      ctx.save(); ctx.font = '42px ' + FONT_D; ctx.fillStyle = '#f5c400'; ctx.rotate(-0.04); ctx.fillText('NORDKURVE', 330, 390); ctx.restore(); ctx.fillStyle = '#111'; for (let i = 0; i < 6; i++) ctx.fillRect(310 + i * 60, 420, 30, 10);
      [[700, '#f5c400'], [760, '#111'], [820, '#f5c400']].forEach(([x, c]) => { ctx.fillStyle = '#222'; ctx.fillRect(x, 300, 3, 80); ctx.fillStyle = c; ctx.fillRect(x + 3, 300, 40, 26); }); lamp(ctx, 600, 250, '#fff2c4'); ground(ctx, '#2a2c2a'); },
    neon: [{ t: 'BUDE', x: 150, y: 398, s: 30, c: '#f5c400' }] },
  { name: 'Kalk', city: 'Кьолн', ground: '#2e2b29',
    build(ctx, r) { skyGrad(ctx, ['#241a33', '#6b3a5a', '#e0794b']); LM.dom(ctx, 300, 330, 1, '#2d2238'); skyline(ctx, r, '#3a2a3e', 335, 30, 90);
      facade(ctx, r, 0, 210, 200, 260, '#6e5f52', '#ffd88a', 0.3); ctx.fillStyle = '#3d3f45'; ctx.fillRect(200, 230, 520, 240); ctx.fillStyle = '#25272c'; ctx.fillRect(230, 300, 200, 170); ctx.fillRect(470, 300, 200, 170);
      ctx.strokeStyle = '#4a4d55'; ctx.lineWidth = 3; for (let y = 306; y < 470; y += 10) { ctx.beginPath(); ctx.moveTo(470, y); ctx.lineTo(670, y); ctx.stroke(); }
      ctx.fillStyle = '#ffd36b'; ctx.globalAlpha = 0.5; ctx.fillRect(240, 310, 180, 150); ctx.globalAlpha = 1; car(ctx, 330, '#b91c1c');
      sign(ctx, 'KFZ-WERKSTATT', 460, 262, 26, '#111', '#facc15'); facade(ctx, r, 720, 190, 240, 280, '#5e544c', '#ffd88a', 0.3);
      for (let i = 0; i < 4; i++) dot(ctx, [760, GROUND - 40 - i * 18], 20, '#111'); ground(ctx, '#2e2b29'); },
    neon: [{ t: 'OFFEN', x: 860, y: 400, s: 22, c: '#ff4f4f', blink: 1 }] },
  { name: 'Connewitz', city: 'Лайпциг', ground: '#2a2a2e', fx: 'fire',
    build(ctx, r) { skyGrad(ctx, ['#08060f', '#1a1430', '#2c1e40']); stars(ctx, r, 70, 200); LM.monument(ctx, 760, 320, '#171228'); skyline(ctx, r, '#17122a', 330, 30, 90, '#ffb35c33');
      ctx.fillStyle = '#4a4550'; ctx.fillRect(0, 210, W, 260);
      const cols = ['#ff2bd6', '#22d3ee', '#facc15', '#a3e635', '#f97316', '#818cf8'];
      for (let i = 0; i < 40; i++) { ctx.fillStyle = cols[i % 6]; ctx.globalAlpha = 0.65; ctx.beginPath(); ctx.ellipse(r() * W, 250 + r() * 200, 20 + r() * 60, 10 + r() * 30, r(), 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.save(); ctx.font = '64px ' + FONT_D; ctx.lineWidth = 6; ctx.strokeStyle = '#0b0b0f'; ctx.fillStyle = '#22d3ee'; ctx.rotate(-0.06); ctx.strokeText('CONNI', 120, 360); ctx.fillText('CONNI', 120, 360); ctx.fillStyle = '#ff2bd6'; ctx.strokeText('BLEIBT', 480, 390); ctx.fillText('BLEIBT', 480, 390); ctx.restore();
      rr(ctx, 840, GROUND - 90, 48, 66, 4, '#5b4636'); ground(ctx, '#2a2a2e'); } },
  { name: 'Marxloh', city: 'Дуисбург', ground: '#2f2b28', fx: 'smoke',
    build(ctx, r) { skyGrad(ctx, ['#2a1a1a', '#7a3a1e', '#e8873a']); LM.stacks(ctx, 330, '#2a1d1d'); skyline(ctx, r, '#3a2622', 335, 30, 80);
      facade(ctx, r, 0, 170, 960, 300, '#6a5446', '#ffd88a', 0.3, { ww: 48 });
      [[30, '#c0392b', 'OBST & GEMÜSE'], [340, '#2563eb', 'METZGEREI'], [650, '#16a34a', 'BÄCKEREI']].forEach(([x, c, t]) => {
        ctx.fillStyle = '#3a2e28'; ctx.fillRect(x, 360, 280, 110);
        for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? '#f5f5f5' : c; fillPoly(ctx, [[x + i * 40, 340], [x + i * 40 + 40, 340], [x + i * 40 + 40, 370], [x + i * 40, 370]], i % 2 ? '#f5f5f5' : c); }
        sign(ctx, t, x + 140, 324, 18, '#fff', '#0b0b0f'); ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x + 10, 430, 260, 10);
        for (let i = 0; i < 9; i++) dot(ctx, [x + 26 + i * 28, 424], 9, ['#f97316', '#ef4444', '#a3e635'][i % 3]);
      }); ground(ctx, '#2f2b28'); } },
  { name: 'Limmerstraße', city: 'Хановер-Линден', ground: '#232127', fx: 'rain',
    build(ctx, r) { skyGrad(ctx, ['#05060f', '#141a33', '#262040']); stars(ctx, r, 50, 160); LM.rathaus(ctx, 760, 330, '#151a30'); skyline(ctx, r, '#141a2c', 335, 30, 80);
      facade(ctx, r, 0, 180, 320, 290, '#3d3a45', '#c9b8ff', 0.3); ctx.fillStyle = '#121016'; ctx.fillRect(320, 170, 330, 300);
      rr(ctx, 420, 300, 130, 170, 4, '#050507', '#3a3a44', 6); ctx.fillStyle = '#7c3aed'; ctx.fillRect(400, 285, 170, 10);
      ['#d4af37', '#d4af37'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(360 + i * 230, 420, 6, 50); dot(ctx, [363 + i * 230, 418], 6, c, false); });
      ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(363, 428); ctx.quadraticCurveTo(475, 460, 593, 428); ctx.stroke();
      facade(ctx, r, 650, 200, 310, 270, '#3a3540', '#ffd88a', 0.3); lamp(ctx, 250, 240, '#ffd1a1'); ground(ctx, '#232127'); puddles(ctx, '#a78bfa'); },
    neon: [{ t: 'CLUB 7', x: 485, y: 240, s: 40, c: '#a78bfa' }, { t: 'NUR MIT LISTE', x: 485, y: 275, s: 14, c: '#ff4fd8', blink: 1 }] },
  { name: 'Hasenbergl', city: 'Мюнхен', ground: '#3a3d45', fx: 'snow',
    build(ctx, r) { skyGrad(ctx, ['#0a1020', '#1d2a48', '#3a4a6a']); stars(ctx, r, 40, 140); LM.frauenkirche(ctx, 240, 330, '#162038'); skyline(ctx, r, '#18223a', 340, 30, 70);
      LM.platte(ctx, r, 0, 470, 330, 280, '#7d8696', '#ffe7a8'); LM.platte(ctx, r, 560, 470, 400, 300, '#8a8f9c', '#ffe7a8');
      ctx.fillStyle = '#e5e7eb'; ctx.fillRect(330, 440, 230, 8);
      ctx.fillStyle = '#222'; ctx.fillRect(440, 330, 6, 140); rr(ctx, 410, 300, 66, 36, 4, '#facc15'); sign(ctx, 'TAXI', 443, 318, 20, '#0b0b0f');
      ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.85; ctx.fillRect(0, GROUND - 30, W, 6); ctx.globalAlpha = 1; ground(ctx, '#3a3d45'); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, GROUND - 26, W, 4); } },
  { name: 'Gröpelingen Hafen', city: 'Бремен', ground: '#3a3a3e', fx: 'fog',
    build(ctx, r) { skyGrad(ctx, ['#060912', '#0f1a2e', '#1e2c44']); stars(ctx, r, 40, 150); LM.crane(ctx, 120, 300, 1.4, '#0f1830'); LM.crane(ctx, 600, 300, 1.2, '#0f1830');
      ctx.fillStyle = '#0c1a2a'; ctx.fillRect(0, 300, W, 60); ctx.strokeStyle = '#335577'; ctx.lineWidth = 1; for (let i = 0; i < 30; i++) { const y = 305 + r() * 50, x = r() * W; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30, y); ctx.stroke(); }
      const cc = ['#b91c1c', '#1d4ed8', '#15803d', '#ca8a04', '#7c2d12', '#0e7490'];
      for (let c = 0; c < 8; c++) for (let s = 0; s < 3 - (c % 2); s++) { const col = cc[(c * 3 + s) % 6]; rr(ctx, c * 122 - 10, 450 - (s + 1) * 52, 118, 50, 2, col); ctx.strokeStyle = shade(col, -0.3); ctx.lineWidth = 2; for (let k = 8; k < 112; k += 8) { ctx.beginPath(); ctx.moveTo(c * 122 - 10 + k, 450 - (s + 1) * 52 + 5); ctx.lineTo(c * 122 - 10 + k, 450 - s * 52 - 5); ctx.stroke(); } }
      ground(ctx, '#3a3a3e', 'dock'); } },
  { name: 'Tiefgarage', city: 'Щутгарт-Бад Канщат', ground: '#4a4a50', fx: 'tubes',
    build(ctx, r) { ctx.fillStyle = '#1c1d22'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#2a2b31'; ctx.fillRect(0, 0, W, 90); ctx.fillStyle = '#3a3b42'; ctx.fillRect(0, 160, W, 300);
      for (let i = 0; i < 5; i++) { const x = 40 + i * 220; ctx.fillStyle = '#5a5b63'; ctx.fillRect(x, 90, 50, 380); ctx.fillStyle = '#facc15'; for (let k = 0; k < 6; k++) ctx.fillRect(x, 400 + (k % 2) * 0, 50, 0); ctx.fillStyle = '#facc15'; ctx.fillRect(x, 420, 50, 12); ctx.fillStyle = '#0b0b0f'; for (let k = 0; k < 5; k++) fillPoly(ctx, [[x + k * 12, 420], [x + k * 12 + 6, 420], [x + k * 12, 432]], '#0b0b0f'); sign(ctx, 'P2', x + 25, 200, 26, '#fff', '#1d4ed8'); }
      car(ctx, 170, '#64748b'); car(ctx, 610, '#1e293b', -1); car(ctx, 830, '#9f1239');
      ground(ctx, '#4a4a50'); ctx.fillStyle = '#e5e7eb'; for (let x = 20; x < W; x += 110) ctx.fillRect(x, GROUND + 10, 70, 4); } },
  { name: 'Wedding', city: 'Берлин', ground: '#2c2a2e',
    build(ctx, r) { skyGrad(ctx, ['#161032', '#4a2a5a', '#c0605a']); LM.tvtower(ctx, 860, 320, 0.9, '#2a1d40'); skyline(ctx, r, '#2a1d40', 330, 40, 110);
      facade(ctx, r, 0, 170, 960, 300, '#7a5f50', '#ffd88a', 0.4, { shop: 110 });
      shop(ctx, 260, 360, 420, 110, '#5a1f1a', '#3a1a12', '#ffb36b');
      ctx.fillStyle = '#c9a36b'; ctx.fillRect(330, 395, 40, 60); ctx.fillStyle = '#8b5a2b'; ctx.fillRect(348, 385, 4, 80);
      ctx.fillStyle = '#d1d5db'; ctx.fillRect(400, 430, 240, 30); for (let i = 0; i < 6; i++) dot(ctx, [420 + i * 38, 425], 9, ['#16a34a', '#ef4444', '#fef3c7'][i % 3]);
      shop(ctx, 20, 370, 220, 100, '#2f2a2a'); shop(ctx, 700, 370, 240, 100, '#2a2f2a', '#122012', '#bff7c6'); bin(ctx, 680, '#ea580c'); ground(ctx, '#2c2a2e'); },
    neon: [{ t: 'DÖNER KEBAP', x: 470, y: 340, s: 34, c: '#ff7a1a' }, { t: 'GRILL', x: 130, y: 350, s: 24, c: '#ff3b3b', blink: 1 }, { t: 'FRISEUR', x: 820, y: 350, s: 22, c: '#4fffa0' }] },
  { name: 'Gostenhof', city: 'Нюрнберг', ground: '#4a443e', fx: 'rain',
    build(ctx, r) { skyGrad(ctx, ['#070a14', '#18203a', '#2a2f4a']); moon(ctx, 150, 90, 26); stars(ctx, r, 60, 180); LM.burg(ctx, 600, 300, '#1a1f33');
      [[0, '#d9c7a8'], [190, '#c7b08a'], [380, '#e0d3b8'], [570, '#cbb592'], [760, '#d6c3a0']].forEach(([x, c], i) => {
        const top = 210 + (i % 2) * 20; ctx.fillStyle = c; ctx.fillRect(x, top, 200, 470 - top); fillPoly(ctx, [[x - 6, top], [x + 100, top - 70], [x + 206, top]], '#6b2d1f');
        ctx.strokeStyle = '#4a2a1a'; ctx.lineWidth = 6; ctx.strokeRect(x + 3, top + 3, 194, 470 - top - 6); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + k * 66, top); ctx.lineTo(x + k * 66 + 66, top + 90); ctx.moveTo(x + k * 66 + 66, top); ctx.lineTo(x + k * 66, top + 90); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(x, top + 90); ctx.lineTo(x + 200, top + 90); ctx.stroke();
        for (let k = 0; k < 3; k++) { ctx.fillStyle = r() < 0.5 ? '#ffd88a' : '#2a2a35'; ctx.fillRect(x + 22 + k * 60, top + 110, 34, 40); }
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 80, 400, 40, 70);
      }); lamp(ctx, 470, 250, '#ffcc88'); ground(ctx, '#4a443e', 'cobble'); puddles(ctx, '#ffcc88'); } },
  { name: 'Schrottplatz', city: 'Есен-Алтендорф', ground: '#4a4038', fx: 'dust',
    build(ctx, r) { skyGrad(ctx, ['#5a6575', '#8a94a3', '#b9b4a8']); LM.headframe(ctx, 820, 330, '#5a3a2a'); skyline(ctx, r, '#6a7080', 340, 20, 60);
      const cc = ['#b91c1c', '#1d4ed8', '#525252', '#ca8a04', '#15803d', '#78716c'];
      for (let s = 0; s < 4; s++) for (let i = 0; i < 6 - s; i++) { const x = 20 + i * 70 + s * 34, y = 440 - s * 34; rr(ctx, x, y, 66, 32, 6, cc[(i + s * 2) % 6]); ctx.fillStyle = '#1e293b'; ctx.fillRect(x + 14, y + 4, 34, 10); }
      ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 2; for (let x = 500; x < 960; x += 18) { ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x + 18, 450); ctx.moveTo(x + 18, 330); ctx.lineTo(x, 450); ctx.stroke(); } ctx.fillStyle = '#2a2a2a'; ctx.fillRect(500, 326, 460, 5);
      ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(640, 470); ctx.lineTo(700, 200); ctx.lineTo(560, 160); ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(560, 160); ctx.lineTo(560, 250); ctx.stroke(); dot(ctx, [560, 262], 20, '#3f3f46');
      sign(ctx, 'ANKAUF – SCHROTT – METALL', 270, 300, 18, '#111', '#facc15'); ground(ctx, '#4a4038'); } },
  { name: 'Neue Neustadt', city: 'Магдебург', ground: '#33343a', fx: 'fog',
    build(ctx, r) { skyGrad(ctx, ['#0b0f17', '#1c2433', '#353d4d']); LM.dom(ctx, 480, 320, 0.8, '#1a2130');
      LM.platte(ctx, r, -20, 470, 320, 330, '#6b7280', '#ffe7a8'); LM.platte(ctx, r, 640, 470, 340, 310, '#737a87', '#ffe7a8');
      ctx.fillStyle = '#4b5563'; ctx.fillRect(300, 300, 340, 170); for (let i = 0; i < 5; i++) { ctx.fillStyle = r() < 0.5 ? '#fde68a' : '#1f2937'; ctx.fillRect(320 + i * 64, 320, 40, 30); }
      ctx.fillStyle = '#1f2937'; ctx.fillRect(440, 380, 60, 90); lamp(ctx, 250, 260, '#ffd9a0'); lamp(ctx, 700, 260, '#ffd9a0'); bin(ctx, 560, '#334155'); ground(ctx, '#33343a'); } }
];

// кешира статичния фон
const ArenaCache = {};
function arenaCanvas(i) {
  if (ArenaCache[i]) return ArenaCache[i];
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const art = typeof ArenaArt !== 'undefined' && ArenaArt.imageFor(i);
  if (art) ctx.drawImage(art, 0, 0, W, H);
  else ARENAS[i].build(ctx, seeded(1000 + i * 77));
  ArenaCache[i] = cv; return cv;
}
function invalidateArenas() { for (const k in ArenaCache) delete ArenaCache[k]; }

// анимирани слоеве (неон, дъжд, сняг, мъгла, дим)
const Weather = { parts: [] };
function drawArenaBack(ctx, i, T) {
  ctx.drawImage(arenaCanvas(i), 0, 0);
  // Generated scenes contain their own lights and props. Avoid painting the
  // old geometric signs/fixtures over them; weather still renders in front.
  if (typeof ArenaArt !== 'undefined' && ArenaArt.imageFor(i)) return;
  const a = ARENAS[i];
  for (const n of a.neon || []) neon(ctx, n.t, n.x, n.y, n.s, n.c, n.blink ? (Math.sin(T * 0.08 + n.x) > -0.6 || (T % 90) > 6) && !((T + n.x | 0) % 211 < 5) : !((T + n.x | 0) % 347 < 4));
  if (a.fx === 'fire') { for (let k = 0; k < 6; k++) { const fx = 864 + Math.sin(T * 0.3 + k) * 10, fy = GROUND - 96 - ((T * 2 + k * 13) % 40); ctx.fillStyle = ['#fde047', '#f97316', '#ef4444'][k % 3]; ctx.globalAlpha = 0.8 - ((T * 2 + k * 13) % 40) / 50; dot(ctx, [fx, fy], 8 - k % 3 * 2, ctx.fillStyle, false); } ctx.globalAlpha = 1; const g = ctx.createRadialGradient(864, GROUND - 100, 10, 864, GROUND - 100, 160); g.addColorStop(0, 'rgba(255,140,40,0.25)'); g.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = g; ctx.fillRect(700, 260, 260, 260); }
  if (a.fx === 'smoke') { ctx.fillStyle = '#6b5a52'; for (let k = 0; k < 12; k++) { const t = (T * 0.4 + k * 40) % 400; ctx.globalAlpha = 0.25 * (1 - t / 400); dot(ctx, [[631, 691, 751, 871][k % 4] + t * 0.3, 110 + [0, -40, 20, -20][k % 4] - t * 0.4], 14 + t * 0.12, '#6b5a52', false); } ctx.globalAlpha = 1; }
  if (a.fx === 'tubes') { for (let i2 = 0; i2 < 6; i2++) { const on = !(i2 === 3 && (T % 120 < 8 || T % 53 < 3)); ctx.fillStyle = on ? '#eef6ff' : '#555'; ctx.fillRect(40 + i2 * 160, 96, 100, 8); if (on) { const g = ctx.createRadialGradient(90 + i2 * 160, 100, 4, 90 + i2 * 160, 100, 180); g.addColorStop(0, 'rgba(220,240,255,0.18)'); g.addColorStop(1, 'rgba(220,240,255,0)'); ctx.fillStyle = g; ctx.fillRect(i2 * 160 - 90, 96, 360, 300); } } }
  if (i === 11) { ctx.save(); ctx.translate(350, 425); ctx.fillStyle = '#a0682f'; for (let k = 0; k < 5; k++) { const ph = (T * 0.05 + k * 1.2) % (Math.PI * 2); ctx.globalAlpha = 0.5 + Math.cos(ph) * 0.4; ctx.fillRect(Math.sin(ph) * 14 - 3, -28 + k * 11, 6, 8); } ctx.restore(); ctx.globalAlpha = 1; }
}
function drawArenaFront(ctx, i, T) {
  const a = ARENAS[i];
  if (a.fx === 'rain') { ctx.strokeStyle = 'rgba(180,200,255,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 90; k++) { const x = (k * 97 + T * 3) % (W + 60) - 30, y = (k * 53 + T * 14) % H; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14); } ctx.stroke(); }
  if (a.fx === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < 80; k++) { const x = (k * 113 + Math.sin(T * 0.02 + k) * 30 + T * 0.4) % W, y = (k * 71 + T * 1.2) % H; ctx.fillRect(x, y, 2.5, 2.5); } }
  if (a.fx === 'fog') { for (let k = 0; k < 3; k++) { const x = ((T * (0.3 + k * 0.15)) % (W + 600)) - 600 + k * 200; const g = ctx.createLinearGradient(0, GROUND - 120, 0, GROUND + 40); g.addColorStop(0, 'rgba(200,210,230,0)'); g.addColorStop(0.6, 'rgba(200,210,230,0.16)'); g.addColorStop(1, 'rgba(200,210,230,0)'); ctx.fillStyle = g; ctx.fillRect(x, GROUND - 120, 700, 160); } }
  if (a.fx === 'dust') { ctx.fillStyle = 'rgba(160,140,110,0.35)'; for (let k = 0; k < 30; k++) { const x = (k * 131 + T * 0.8) % W, y = GROUND - 20 + Math.sin(T * 0.03 + k) * 30; ctx.fillRect(x, y, 2, 2); } }
}

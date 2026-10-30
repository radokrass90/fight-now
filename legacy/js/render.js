'use strict';
// ---------- скелет ----------
function v2(a, l) { return [Math.sin(a * D2R) * l, Math.cos(a * D2R) * l]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }

function skeleton(c, p) {
  const s = c.h, w = c.w;
  const L = { T: 50 * s, UA: 27 * s, FA: 26 * s, TH: 35 * s, SH: 36 * s, HR: 12.5 * s };
  const lean = p.lean * D2R;
  const neck = [Math.sin(lean) * L.T, -Math.cos(lean) * L.T];
  const sh = [neck[0] * 0.9, neck[1] * 0.9];
  const fsh = [sh[0] + 2 * w, sh[1] + 2], bsh = [sh[0] - 3 * w, sh[1] + 1];
  const fe = add(fsh, v2(p.fu, L.UA)), fh = add(fe, v2(p.ff, L.FA));
  const be = add(bsh, v2(p.bu, L.UA)), bh = add(be, v2(p.bf, L.FA));
  const fhip = [3 * w, 0], bhip = [-3 * w, 0];
  const fk = add(fhip, v2(p.ft, L.TH)), ffo = add(fk, v2(p.fs, L.SH));
  const bk = add(bhip, v2(p.bt, L.TH)), bfo = add(bk, v2(p.bs, L.SH));
  const hl = lean + (p.head || 0) * D2R;
  const head = [neck[0] + Math.sin(hl) * L.HR * 1.15, neck[1] - Math.cos(hl) * L.HR * 1.15];
  return { neck, sh, fsh, bsh, fe, fh, be, bh, fhip, bhip, fk, ffo, bk, bfo, head, L, hl, lean };
}
// височината на таза над земята, така че най-ниското стъпало да е на земята
function hipLift(sk) { return Math.max(sk.ffo[1], sk.bfo[1]) + 5 * 1; }

function fighterHip(f, sk) {
  if (f.lying) return [f.x, GROUND - f.y - 13 * f.c.w];
  return [f.x, GROUND - f.y - hipLift(sk) + (f.pose.hy || 0)];
}
function toWorld(f, hip, pt) { return [hip[0] + pt[0] * f.facing * (f.sc || 1), hip[1] + pt[1] * (f.sc || 1)]; }

// ---------- рисуване ----------
function seg(ctx, a, b, w, col) {
  ctx.lineWidth = w + 5; ctx.strokeStyle = '#0b0b0f'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.lineWidth = w; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
}
function dot(ctx, p, r, col, outline = true) {
  ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
  ctx.fillStyle = col; ctx.fill();
  if (outline) { ctx.lineWidth = 2.5; ctx.strokeStyle = '#0b0b0f'; ctx.stroke(); }
}

const PAINT = ['#ff2bd6', '#22d3ee', '#facc15', '#a3e635', '#fb7185', '#818cf8'];

function drawFighter(ctx, f, opt = {}) {
  if (f.vis === false) return;
  if (typeof CharacterArt !== 'undefined') {
    const rendered = CharacterArt.draw(ctx, f, opt);
    if (rendered) return rendered;
  }
  const c = f.c, lk = c.look, p = f.pose;
  const sk = skeleton(c, p), w = c.w, s = c.h;
  const hip = fighterHip(f, sk);
  let look = lk;
  if (f.strip) look = Object.assign({}, lk, { top: '#f3f3f3', sleeves: 0, crop: 0, pants: '#bcd4ff', shorts: 1, shoes: '#ffffff', barefoot: 0, extra: [], overalls: 0, stripe: null });
  if (f.paint) { const P = PAINT; look = Object.assign({}, lk, { skin: P[0], top: P[1], pants: P[2], shoes: P[3], hairC: P[4], hands: P[0], apron: P[5], stripe: null }); }
  ctx.save();
  ctx.globalAlpha = (f.alpha == null ? 1 : f.alpha) * (opt.alpha == null ? 1 : opt.alpha);
  ctx.translate(hip[0], hip[1]);
  ctx.scale(f.facing * (f.sc || 1), (f.sc || 1) * (f.squash || 1));
  if (f.rot) ctx.rotate(f.rot * D2R);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (f.flash > 0) ctx.filter = 'brightness(2.2)';

  const skin = look.skin, top = look.top, pants = look.pants;
  const dark = col => shade(col, -0.22);
  const armCol = (part, back) => {
    const col = (part === 'u' ? look.sleeves >= 1 : look.sleeves >= 2) ? top : skin;
    return back ? dark(col) : col;
  };
  const legCol = (part, back) => {
    const col = part === 's' && look.shorts ? skin : pants;
    return back ? dark(col) : col;
  };
  const uaW = 11 * w, faW = 9.5 * w, thW = 14 * w, shW = 12 * w;

  // реквизит в задната ръка (зад тялото, когато е отзад)
  const propBack = c.prop && !f.noProp;
  // задна ръка
  const drawBackArm = () => {
    seg(ctx, sk.bsh, sk.be, uaW, armCol('u', 1));
    seg(ctx, sk.be, sk.bh, faW, armCol('f', 1));
    if (propBack) drawProp(ctx, c.prop, sk.bh, p.bf);
    dot(ctx, sk.bh, 6.2 * w, dark(look.hands));
  };
  const foot = (k, a, sa, back) => {
    const col = back ? dark(look.shoes) : look.shoes;
    const tip = add(a, v2(sa + 90, 11 * s));
    seg(ctx, a, tip, 8 * w, col);
  };
  const drawLeg = (hipP, kn, an, ta, sa, back) => {
    seg(ctx, hipP, kn, thW, legCol('t', back));
    seg(ctx, kn, an, shW, legCol('s', back));
    if (look.stripe && !look.shorts) { ctx.lineWidth = 2; ctx.strokeStyle = look.stripe; ctx.beginPath(); ctx.moveTo(hipP[0], hipP[1]); ctx.lineTo(kn[0], kn[1]); ctx.lineTo(an[0], an[1]); ctx.stroke(); }
    foot(kn, an, sa, back);
  };

  // глава отзад (качулка / коса отзад)
  drawBackArm();
  drawLeg(sk.bhip, sk.bk, sk.bfo, p.bt, p.bs, 1);

  // торс
  const ax = sk.neck, len = Math.hypot(ax[0], ax[1]) || 1, u = [ax[0] / len, ax[1] / len], n = [-u[1], u[0]];
  const hw = 11 * w, sw = 15 * w;
  const tp = [[n[0] * hw, n[1] * hw + 4], [-n[0] * hw, -n[1] * hw + 4], [sk.sh[0] - n[0] * sw, sk.sh[1] - n[1] * sw], [sk.sh[0] + n[0] * sw, sk.sh[1] + n[1] * sw]];
  const poly = (pts, col) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0b0b0f'; ctx.stroke(); };
  poly(tp, look.overalls ? top : (look.crop ? skin : top));
  if (look.crop) { // къс топ
    const m = 0.5;
    const mid = [[lerp(tp[1][0], tp[2][0], m), lerp(tp[1][1], tp[2][1], m)], [lerp(tp[0][0], tp[3][0], m), lerp(tp[0][1], tp[3][1], m)]];
    poly([mid[1], mid[0], tp[2], tp[3]], top);
  }
  // колан / панталон до кръста
  ctx.lineWidth = 7 * w; ctx.strokeStyle = (look.extra || []).includes('belt') ? '#5b3a1e' : pants;
  ctx.beginPath(); ctx.moveTo(tp[0][0], tp[0][1] - 2); ctx.lineTo(tp[1][0], tp[1][1] - 2); ctx.stroke();
  const ex = look.extra || [];
  if (ex.includes('vest')) { ctx.strokeStyle = '#e8ff3a'; ctx.lineWidth = 3; ctx.beginPath(); const a = lerp(0, 1, 0.45); ctx.moveTo(lerp(tp[1][0], tp[2][0], a), lerp(tp[1][1], tp[2][1], a)); ctx.lineTo(lerp(tp[0][0], tp[3][0], a), lerp(tp[0][1], tp[3][1], a)); ctx.stroke(); }
  if (ex.includes('vestDark')) { const a = 0.15, b = 0.95; poly([[lerp(tp[0][0], tp[3][0], a), lerp(tp[0][1], tp[3][1], a)], [lerp(tp[0][0], tp[3][0], b) - n[0] * 4, lerp(tp[0][1], tp[3][1], b)], [sk.sh[0] + n[0] * 5, sk.sh[1] + n[1] * 5]], '#1f2328'); }
  if (look.overalls) { ctx.strokeStyle = shade(top, -0.3); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sk.sh[0] + n[0] * 8, sk.sh[1] + n[1] * 8); ctx.lineTo(n[0] * 6, 0); ctx.stroke(); }
  if (look.stripe && look.sleeves === 2) { ctx.strokeStyle = look.stripe; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tp[3][0], tp[3][1]); ctx.lineTo(tp[0][0], tp[0][1]); ctx.stroke(); }
  if (ex.includes('paint')) { ['#22d3ee', '#ff2bd6', '#facc15'].forEach((col, i) => { dot(ctx, [sk.sh[0] * (0.3 + i * 0.2) + n[0] * (i - 1) * 6, sk.sh[1] * (0.3 + i * 0.2)], 3, col, false); }); }
  if (ex.includes('beltChain')) { ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(tp[0][0], tp[0][1] - 2); ctx.quadraticCurveTo(0, 10, tp[1][0], tp[1][1] - 2); ctx.stroke(); ctx.setLineDash([]); }

  // предна ръка и крак
  drawLeg(sk.fhip, sk.fk, sk.ffo, p.ft, p.fs, 0);
  if (ex.includes('apron')) {
    const k = sk.fk, top2 = [sk.sh[0] * 0.55 + n[0] * 4, sk.sh[1] * 0.55];
    poly([[top2[0] + n[0] * 9, top2[1] + n[1] * 9], [top2[0] - n[0] * 9, top2[1] - n[1] * 9], [k[0] - 6, k[1] + 4], [k[0] + 12, k[1] + 2]], look.apron || '#fff');
    ctx.strokeStyle = '#7aa7c7'; ctx.lineWidth = 1.5; for (let i = 1; i < 4; i++) { const t = i / 4; ctx.beginPath(); ctx.moveTo(lerp(top2[0] - 8, k[0] - 4, t), lerp(top2[1], k[1], t)); ctx.lineTo(lerp(top2[0] + 8, k[0] + 10, t), lerp(top2[1], k[1], t)); ctx.stroke(); }
  }

  // глава
  drawHead(ctx, c, look, sk, p, f);

  if (ex.includes('scarf')) {
    const [c1, c2] = look.scarf;
    ctx.lineWidth = 7; ctx.strokeStyle = '#0b0b0f'; ctx.beginPath(); ctx.moveTo(sk.neck[0] - 7, sk.neck[1] + 3); ctx.lineTo(sk.neck[0] + 7, sk.neck[1] + 3); ctx.stroke();
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = i % 2 ? c2 : c1; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sk.neck[0] - 7 + i * 3.5, sk.neck[1] + 3); ctx.lineTo(sk.neck[0] - 3.5 + i * 3.5, sk.neck[1] + 3); ctx.stroke(); }
    const tail = [sk.neck[0] - 10 - f.vx * 0.5, sk.neck[1] + 22];
    seg(ctx, [sk.neck[0] - 4, sk.neck[1] + 4], tail, 5, c1);
  }
  if (ex.includes('chain')) { ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sk.neck[0] + 2, sk.neck[1] + 6, 8, 0.2, Math.PI - 0.2); ctx.stroke(); }

  // предна ръка
  seg(ctx, sk.fsh, sk.fe, uaW, armCol('u', 0));
  seg(ctx, sk.fe, sk.fh, faW, armCol('f', 0));
  dot(ctx, sk.fh, 6.6 * w, look.hands);
  if (ex.includes('cig') && f.state !== 'hit') { ctx.strokeStyle = '#eee'; ctx.lineWidth = 2; const m = add(sk.head, [9 * s, 5 * s]); ctx.beginPath(); ctx.moveTo(m[0], m[1]); ctx.lineTo(m[0] + 7, m[1] + 1); ctx.stroke(); dot(ctx, [m[0] + 7, m[1] + 1], 1.4, '#ff6a00', false); }

  ctx.restore();
  return { sk, hip };
}

function drawHead(ctx, c, look, sk, p, f) {
  const s = c.h, r = sk.L.HR, h = sk.head, hl = sk.hl;
  const ex = look.extra || [];
  const hc = look.hairC;
  // коса отзад
  if (look.hair === 'braids') { for (let i = 0; i < 3; i++) seg(ctx, [h[0] - r * 0.5, h[1] - r * 0.2 + i * 3], [h[0] - r * 1.4 - i * 2, h[1] + r * 1.6 + i * 2], 3.5, hc); }
  if (look.hair === 'pony') { seg(ctx, [h[0] - r * 0.7, h[1] - r * 0.5], [h[0] - r * 1.6, h[1] + r * 0.9], 6, hc); }
  if (look.hair === 'hood') { ctx.beginPath(); ctx.arc(h[0] - 2, h[1] - 1, r * 1.42, 0, Math.PI * 2); ctx.fillStyle = hc; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0b0b0f'; ctx.stroke(); }
  // врат
  seg(ctx, sk.neck, add(sk.neck, [Math.sin(hl) * r * 0.5, -Math.cos(hl) * r * 0.5]), 9 * c.w, look.skin);
  dot(ctx, h, r, look.skin);
  ctx.save(); ctx.beginPath(); ctx.arc(h[0], h[1], r, 0, Math.PI * 2); ctx.clip();
  const up = [Math.sin(hl), -Math.cos(hl)], fw = [Math.cos(hl), Math.sin(hl)];
  const P = (a, b) => [h[0] + fw[0] * a * r + up[0] * b * r, h[1] + fw[1] * a * r + up[1] * b * r];
  const fill = (col) => { ctx.fillStyle = col; ctx.fill(); };
  ctx.lineWidth = 0;
  switch (look.hair) {
    case 'buzz': { ctx.save(); ctx.translate(...P(-0.15, 0.3)); ctx.rotate(hl); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.08, r * 0.8, 0, Math.PI, Math.PI * 2); ctx.restore(); ctx.globalAlpha *= 0.8; fill(hc); ctx.globalAlpha /= 0.8; break; }
    case 'short': case 'curly': case 'slick': case 'undercut': {
      ctx.save(); ctx.translate(...P(-0.2, 0.35)); ctx.rotate(hl); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.1, r * (look.hair === 'curly' ? 1.0 : 0.85), 0, Math.PI, Math.PI * 2); ctx.restore(); fill(hc);
      if (look.hair !== 'undercut') { ctx.beginPath(); const b = P(-0.9, -0.2); ctx.arc(b[0], b[1], r * 0.55, 0, Math.PI * 2); fill(hc); }
      break;
    }
    case 'braids': case 'pony': case 'bun': { ctx.save(); ctx.translate(...P(-0.15, 0.4)); ctx.rotate(hl); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.1, r * 0.8, 0, Math.PI, Math.PI * 2); ctx.restore(); fill(hc); const b = P(-0.95, 0); ctx.beginPath(); ctx.arc(b[0], b[1], r * 0.6, 0, Math.PI * 2); fill(hc); break; }
    case 'beanie': { ctx.save(); ctx.translate(...P(-0.05, 0.25)); ctx.rotate(hl); ctx.beginPath(); ctx.rect(-r * 1.2, -r * 1.3, r * 2.4, r * 1.3); ctx.restore(); fill(hc); break; }
    case 'cap': { ctx.save(); ctx.translate(...P(-0.05, 0.3)); ctx.rotate(hl); ctx.beginPath(); ctx.rect(-r * 1.2, -r * 1.3, r * 2.4, r * 1.3); ctx.restore(); fill(hc); break; }
    case 'hood': { ctx.save(); ctx.translate(...P(-0.35, 0.1)); ctx.rotate(hl); ctx.beginPath(); ctx.rect(-r * 1.2, -r * 1.4, r * 0.9, r * 3); ctx.restore(); fill(hc); break; }
  }
  if (look.beard === 'full' || look.beard === 'stubble') { ctx.save(); ctx.translate(...P(0.15, -0.35)); ctx.rotate(hl); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.0, r * 0.7, 0, 0, Math.PI); ctx.restore(); ctx.globalAlpha *= look.beard === 'stubble' ? 0.45 : 1; fill(look.beardC || hc); ctx.globalAlpha /= look.beard === 'stubble' ? 0.45 : 1; }
  ctx.restore();
  // контур отново
  ctx.beginPath(); ctx.arc(h[0], h[1], r, 0, Math.PI * 2); ctx.lineWidth = 2.5; ctx.strokeStyle = '#0b0b0f'; ctx.stroke();
  if (look.hair === 'cap') { seg(ctx, P(-0.6, 0.65), P(-1.6, 0.55), 3, hc); }
  if (look.hair === 'bun') dot(ctx, P(-0.75, 0.95), r * 0.45, hc);
  if (look.hair === 'beanie') { seg(ctx, P(-1, 0.45), P(0.95, 0.45), 4, shade(hc, 0.2)); }
  // лице
  const st = f && f.state;
  const hurt = st === 'hit' || st === 'air' || st === 'dizzy' || st === 'down' || st === 'thrown' || st === 'ko';
  const eye = P(0.5, 0.15);
  if (ex.includes('glasses')) { ctx.fillStyle = '#0b0b0f'; ctx.fillRect(eye[0] - 4, eye[1] - 2.5, 10, 5); }
  else if (hurt) { ctx.strokeStyle = '#0b0b0f'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(eye[0] - 2.5, eye[1] - 2.5); ctx.lineTo(eye[0] + 2.5, eye[1] + 2.5); ctx.moveTo(eye[0] + 2.5, eye[1] - 2.5); ctx.lineTo(eye[0] - 2.5, eye[1] + 2.5); ctx.stroke(); }
  else { dot(ctx, eye, 1.8, '#0b0b0f', false); seg2(ctx, P(0.25, 0.42), P(0.75, 0.32), 1.8, '#0b0b0f'); }
  if (look.beard === 'mustache') seg2(ctx, P(0.55, -0.32), P(0.98, -0.3), 3, look.beardC || hc);
  if (ex.includes('mask')) { ctx.fillStyle = '#9ca3af'; ctx.save(); ctx.translate(...P(0.6, -0.4)); ctx.rotate(hl); ctx.fillRect(-5, -4, 10, 8); ctx.restore(); dot(ctx, P(0.95, -0.45), 3, '#4b5563'); }
  else seg2(ctx, P(0.62, -0.45), P(0.88, -0.42), 1.6, '#3a1d14');
  if (ex.includes('earpiece')) dot(ctx, P(-0.1, 0), 2, '#111', false);
}
function seg2(ctx, a, b, w, col) { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }

const PROP_LEN = { cane: 52, wrench: 34, tray: 22 };
function drawProp(ctx, kind, hand, ang) {
  const d = v2(ang, 1);
  if (kind === 'cane') {
    const tip = add(hand, [d[0] * 48, d[1] * 48]), back = add(hand, [-d[0] * 6, -d[1] * 6]);
    seg(ctx, back, tip, 4, '#3b2314');
    dot(ctx, back, 4, '#d4af37');
  } else if (kind === 'wrench') {
    const tip = add(hand, [d[0] * 32, d[1] * 32]);
    seg(ctx, add(hand, [-d[0] * 4, -d[1] * 4]), tip, 5, '#9ca3af');
    dot(ctx, tip, 6, '#9ca3af'); ctx.fillStyle = '#0b0b0f'; ctx.beginPath(); ctx.arc(tip[0] + d[0] * 3, tip[1] + d[1] * 3, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'tray') {
    const c = add(hand, [d[0] * 14, d[1] * 14]);
    ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(Math.atan2(d[1], d[0]));
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2); ctx.fillStyle = '#d1d5db'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#0b0b0f'; ctx.stroke();
    ctx.restore();
  }
}

// крайна точка на удара в локални координати
function limbPoint(c, sk, pose, limb) {
  switch (limb) {
    case 'fh': return sk.fh; case 'bh': return sk.bh; case 'ff': return sk.ffo; case 'bf': return sk.bfo;
    case 'fk': return sk.fk; case 'fe': return sk.fe; case 'head': return [sk.head[0] + 6, sk.head[1]];
    case 'fsh': return [sk.fsh[0] + 10, sk.fsh[1] + 8];
    case 'prop': { const d = v2(pose.bf, 1), l = PROP_LEN[c.prop] || 20; return add(sk.bh, [d[0] * l, d[1] * l]); }
  }
  return sk.fh;
}

function drawShadow(ctx, f) {
  if (f.vis === false) return;
  const k = clamp(1 - f.y / 260, 0.3, 1);
  const width=38*f.c.w*k*(f.lying?1.8:1)*(f.sc||1);
  ctx.save();ctx.translate(f.x,GROUND+3);ctx.scale(1,.19);
  const shadow=ctx.createRadialGradient(0,0,0,0,0,width);
  shadow.addColorStop(0,`rgba(0,0,0,${.58*k})`);shadow.addColorStop(.4,`rgba(0,0,0,${.30*k})`);shadow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=shadow;ctx.fillRect(-width,-width,width*2,width*2);ctx.restore();
}

// ---------- портрет за избора на герой ----------
function drawPortrait(ctx, c, x, y, w, h, scale = 2.2, facing = 1, pose) {
  if (typeof CharacterArt !== 'undefined' && CharacterArt.portrait(ctx, c, x, y, w, h, facing)) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const f = { c, x: 0, y: 0, facing, pose: pose || Object.assign({}, c.stance), vx: 0, state: 'idle' };
  const sk = skeleton(c, f.pose);
  ctx.translate(x + w / 2 - (sk.head[0] * scale * facing) * 0.5, y + h * 0.42);
  ctx.scale(scale, scale);
  ctx.translate(0, -(GROUND - hipLift(sk)) - sk.head[1] - 6);
  drawFighter(ctx, f);
  ctx.restore();
}

// ---------- превозни средства и реквизит за финалите ----------
function wheel(ctx, x, y, r, rot) {
  dot(ctx, [x, y], r, '#111'); dot(ctx, [x, y], r * 0.5, '#9ca3af');
  ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(rot) * r * 0.5, y + Math.sin(rot) * r * 0.5); ctx.lineTo(x - Math.cos(rot) * r * 0.5, y - Math.sin(rot) * r * 0.5); ctx.stroke();
}
function rr(ctx, x, y, w, h, r, fill, stroke = '#0b0b0f', lw = 3) {
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
// dir: 1 = гледа надясно. x = център
function drawVehicle(ctx, kind, x, dir, t, opt = {}) {
  ctx.save(); ctx.translate(x, GROUND); ctx.scale(dir, 1);
  const wr = t * 0.2;
  if (kind === 'mixer') {
    rr(ctx, -150, -60, 300, 28, 4, '#e5e7eb');
    rr(ctx, 70, -120, 80, 68, 8, '#f59e0b'); rr(ctx, 100, -112, 40, 28, 4, '#93c5fd');
    ctx.save(); ctx.translate(-40, -100); ctx.rotate(-0.12);
    ctx.beginPath(); ctx.ellipse(0, 0, 100, 48, 0, 0, Math.PI * 2); ctx.fillStyle = '#9ca3af'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0b0b0f'; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 100, 48, 0, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 10; const sp = (opt.spin || 0);
    for (let i = -4; i < 6; i++) { const ox = ((i * 40 + sp) % 400) - 160; ctx.beginPath(); ctx.moveTo(ox, -60); ctx.lineTo(ox + 50, 60); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(-98, -6, 14, 26, 0, 0, Math.PI * 2); ctx.fillStyle = '#374151'; ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.font = '14px ' + FONT_D; ctx.fillStyle = '#0b0b0f'; ctx.save(); ctx.scale(dir, 1); ctx.textAlign = 'center'; ctx.fillText('BETON', -40 * dir, -42); ctx.restore();
    [-110, -40, 110].forEach(wx => wheel(ctx, wx, -16, 18, wr));
  } else if (kind === 'limo') {
    rr(ctx, -180, -62, 360, 42, 10, '#0f0f12'); rr(ctx, -120, -96, 220, 40, 14, '#0f0f12');
    ctx.fillStyle = '#334155'; [-110, -40, 30].forEach(wx => ctx.fillRect(wx, -90, 60, 26));
    if (opt.door) { ctx.fillStyle = '#000'; ctx.fillRect(-40, -90, 60, 70); ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.strokeRect(-40, -90, 60, 70); }
    ctx.fillStyle = '#fef3c7'; ctx.fillRect(170, -54, 10, 10);
    [-130, 130].forEach(wx => wheel(ctx, wx, -18, 18, wr));
  } else if (kind === 'tow') {
    rr(ctx, -150, -56, 260, 26, 4, '#ef4444'); rr(ctx, 90, -116, 70, 80, 8, '#ef4444'); rr(ctx, 115, -108, 36, 28, 4, '#93c5fd');
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(40, -56); ctx.lineTo(-130, -150); ctx.stroke();
    ctx.fillStyle = '#facc15'; ctx.fillRect(100, -126, 40, 8);
    [-110, 110].forEach(wx => wheel(ctx, wx, -16, 18, wr));
  } else if (kind === 'taxi') {
    rr(ctx, -110, -58, 220, 36, 12, '#efe7c8'); rr(ctx, -60, -92, 120, 38, 14, '#efe7c8');
    ctx.fillStyle = '#334155'; ctx.fillRect(-52, -86, 48, 26); ctx.fillRect(4, -86, 48, 26);
    rr(ctx, -18, -106, 36, 14, 3, '#facc15'); ctx.fillStyle = '#0b0b0f'; ctx.font = '10px ' + FONT_D; ctx.save(); ctx.scale(dir, 1); ctx.textAlign = 'center'; ctx.fillText('TAXI', 0, -95); ctx.restore();
    if (opt.trunk) { ctx.fillStyle = '#111'; ctx.fillRect(-110, -64, 50, 12); ctx.save(); ctx.translate(-110, -64); ctx.rotate(-opt.trunk); rr(ctx, 0, -6, 50, 8, 2, '#efe7c8'); ctx.restore(); }
    ctx.fillStyle = '#fef3c7'; ctx.fillRect(100, -48, 10, 8); ctx.fillStyle = '#ef4444'; ctx.fillRect(-110, -48, 6, 10);
    [-70, 70].forEach(wx => wheel(ctx, wx, -16, 16, wr));
  }
  ctx.restore();
}

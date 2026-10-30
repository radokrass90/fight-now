'use strict';
// ---------- 15 финала (без кръв — улични, абсурдни, с хумор) ----------
const tw = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
function bp(f, p, k = 0.25) {
  const tgt = typeof p === 'object' && p && p.lean != null && p.fu != null ? p : fullPose(f.c.stance, p);
  const o = {}; for (const key of PARAMS) o[key] = lerp(f.pose[key] || 0, tgt[key] || 0, k); f.pose = o;
}
const dirOf = (W, L) => (L.x >= W.x ? 1 : -1);
function walkPose(f, ph) { const s = Math.sin(ph), st = f.c.stance, t = Object.assign({}, st); t.ft += s * 26; t.bt -= s * 26; t.fs += Math.min(0, s) * 30 + 4; t.bs += Math.min(0, -s) * 30; return t; }
function hipOf(f) { return fighterHip(f, skeleton(f.c, f.pose)); }
function handOf(f, which = 'fh') { const sk = skeleton(f.c, f.pose); return toWorld(f, fighterHip(f, sk), sk[which]); }
function lyingBox(L) { const len = 150 * L.c.h; return { x1: Math.min(L.x - L.facing * len * 0.55, L.x + L.facing * len * 0.45), x2: Math.max(L.x - L.facing * len * 0.55, L.x + L.facing * len * 0.45) }; }
function shoes(ctx, x, col) { rr(ctx, x - 22, GROUND - 12, 20, 10, 4, col); rr(ctx, x + 2, GROUND - 12, 20, 10, 4, col); }
function poster(ctx, x, y, L, k) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.05); ctx.globalAlpha = k;
  rr(ctx, -60, -80, 120, 160, 2, '#f4f1e8'); outlineText(ctx, localize("MISSING"), 0, -62, 20, '#b91c1c', 'center', 3);
  ctx.fillStyle = '#d6d3c8'; ctx.fillRect(-40, -46, 80, 80); drawPortrait(ctx, L.c, -40, -46, 80, 80, 1.6);
  ctx.fillStyle = '#222'; ctx.font = '10px ' + FONT_B; ctx.textAlign = 'center'; ctx.fillText(L.c.name + ' „' + L.c.nick + '“', 0, 48); ctx.fillText(localize("Last seen: here"), 0, 64);
  ctx.restore();
}

const FINISHERS = {
  mixer: {
    dur: 340,
    run(t, S, W, L, m) {
      const d = dirOf(W, L);
      if (t === 1) { S.tx = d > 0 ? 960 + 300 : -300; S.target = clamp(L.x + d * 200, 150, 810); S.spin = 0; S.d = d; Snd.engine(2); }
      if (t < 70) S.tx = lerp(S.tx, S.target, 0.07);
      S.spin += t > 100 && t < 210 ? 22 : 3;
      if (t < 40) bp(W, 'grab'); else if (t < 70) { bp(W, 'lift', 0.3); L.y = lerp(0, 90, tw(t, 40, 70)); L.x = lerp(L.x, W.x + W.facing * 8, 0.2); L.rot = lerp(0, -150, tw(t, 40, 70)); bp(L, 'air_hit'); }
      else if (t <= 100) {
        if (t === 70) { S.sx = L.x; S.sy = L.y; Snd.whoosh(); }
        const k = tw(t, 70, 100), ox = S.target - 138 * S.d, oy = 120;
        L.x = lerp(S.sx, ox, k); L.y = lerp(S.sy, oy, k) + Math.sin(k * Math.PI) * 80; L.rot -= 18; L.sc = lerp(1, 0.35, k); bp(W, 'throwx', 0.3);
        if (t === 100) { L.vis = false; Snd.thud(); m.shake = 8; m.popText(ox, GROUND - 190, localize("Clocking off."), '#fff', 26, 90); }
      } else if (t < 210) { bp(W, 'point', 0.2); m.shake = 2; }
      else { S.tx += S.d * Math.min(9, (t - 210) * 0.25); if (t % 6 === 0) m.smoke(S.tx + 150 * S.d, GROUND - 20, 1, '#6b7280', 6); bp(W, 'flex', 0.2); }
    },
    back(ctx, t, S) { if (S.tx != null) drawVehicle(ctx, 'mixer', S.tx, S.d, t, { spin: S.spin }); }
  },
  launch: {
    dur: 280,
    run(t, S, W, L, m) {
      const d = dirOf(W, L);
      if (t < 20) bp(W, 'rh_c', 0.3); else if (t < 60) bp(W, 'hk', 0.5); else bp(W, 'cheer', 0.15);
      if (t === 24) { m.spark(L.x, GROUND - 120, true); Snd.hit(1); m.shake = 14; m.hitstop = 8; S.vx = d * 7; }
      if (t > 24 && t <= 140) { const k = tw(t, 24, 140); L.x += S.vx * (1 - k * 0.5); L.y = Math.pow(k, 0.8) * 380; L.rot -= 22; L.sc = lerp(1, 0.04, k); bp(L, 'air_hit'); S.ex = L.x; S.ey = GROUND - L.y - 30; }
      if (t === 141) { L.vis = false; Snd.ok(); }
      if (t === 150) m.popText(S.ex, S.ey + 40, localize("Takeoff!"), '#fff', 24, 90);
    },
    front(ctx, t, S) { if (t > 140 && S.ex != null) { const k = Math.sin((t - 140) * 0.3) * 0.5 + 0.8; star(ctx, S.ex, S.ey, 14 * k, '#fff6c2', 4); ctx.globalAlpha = 0.5; star(ctx, S.ex, S.ey, 26 * k, '#fff6c2', 4); ctx.globalAlpha = 1; } }
  },
  limo: {
    dur: 320,
    run(t, S, W, L, m) {
      const d = dirOf(W, L);
      if (t === 1) { S.d = d; S.dir = -d; S.target = clamp(L.x + d * 50, 190, 770); S.tx = d > 0 ? 960 + 260 : -260; S.door = false; }
      if (t < 30) bp(W, { ...W.c.stance, fu: 150, ff: 170 }, 0.25);
      else bp(W, 'cane' === W.c.style ? W.c.stance : 'taunt', 0.15);
      if (t === 20) Snd.tone(1800, 0.05, 'square', 0.2);
      if (t > 30 && t < 90) S.tx = lerp(S.tx, S.target, 0.08); if (t === 32) Snd.engine(1.4);
      if (t === 92) { S.door = true; Snd.block(); }
      if (t > 100 && t <= 140) { const k = tw(t, 100, 140); const door = S.tx - 10 * S.dir; L.x = lerp(L.x, door, 0.12); L.alpha = 1 - k; L.sc = lerp(1, 0.85, k); bp(L, 'hit_hi'); }
      if (t === 140) L.vis = false;
      if (t === 150) { S.door = false; Snd.thud(); }
      if (t > 160) S.tx += S.d * Math.min(12, (t - 160) * 0.3);
      if (t === 170) S.py = -40;
      if (S.py != null && S.py < GROUND - 20) S.py += 1.3;
    },
    back(ctx, t, S) { if (S.tx != null) drawVehicle(ctx, 'limo', S.tx, S.dir, t, { door: S.door }); },
    front(ctx, t, S, W) { if (S.py != null) { ctx.save(); ctx.translate(W.x + Math.sin(t * 0.07) * 40 + 60, S.py); ctx.rotate(Math.sin(t * 0.09) * 0.4); rr(ctx, -30, -20, 60, 40, 2, '#fffdf5'); ctx.fillStyle = '#b91c1c'; ctx.font = '11px ' + FONT_D; ctx.textAlign = 'center'; ctx.fillText(localize("FINAL NOTICE"), 0, -6); ctx.fillStyle = '#333'; ctx.fillRect(-20, 4, 40, 2); ctx.fillRect(-20, 10, 30, 2); ctx.restore(); } }
  },
  pyro: {
    dur: 320,
    run(t, S, W, L, m) {
      bp(W, t < 140 ? { ...W.c.stance, fu: 170, ff: 178 } : 'cheer', 0.2);
      if (t > 8 && t < 220 && t % 3 === 0) { const h = handOf(W); m.fx.push({ k: 'puff', x: h[0] + rand(-6, 6), y: h[1] - 10, vx: rand(-1.5, 1.5), vy: rand(-1.6, -0.4), r: rand(10, 20), life: 90, max: 90, col: pick(['#ef4444', '#dc2626', '#f87171']) }); }
      if (t === 10) Snd.noise(2.5, 2500, 0.15, 'bandpass');
      S.wrap = tw(t, 50, 110);
      bp(L, { ...L.c.stance, fu: 4, ff: 4, bu: 2, bf: 2, ft: 4, fs: 2, bt: -4, bs: -2, lean: 0, head: 0 }, 0.2);
      if (t > 120 && t <= 145) { L.rot = lerp(0, -90, easeIn(tw(t, 120, 145))); }
      if (t === 145) { L.lying = true; m.shake = 8; Snd.thud(); m.dust(L.x, 8); }
      if (t > 150 && t < 280 && t % 34 === 0) m.popText(W.x + rand(-60, 60), GROUND - 210 - rand(0, 40), pick(['OLÉ OLÉ!', localize("AWAY WIN!"), 'OLÉ!']), '#f5c400', 24, 60);
    },
    front(ctx, t, S, W, L) {
      const h = handOf(W); ctx.save(); ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 30; dot(ctx, [h[0], h[1] - 8], 7 + Math.random() * 3, '#fff1c2', false); ctx.restore();
      if (S.wrap > 0) {
        const hip = hipOf(L); ctx.save(); ctx.translate(hip[0], hip[1]); ctx.scale(L.facing, 1); ctx.rotate(L.rot * D2R);
        const top = 70 * L.c.h, bot = 70 * L.c.h, n = Math.floor(S.wrap * 14);
        for (let i = 0; i < n; i++) { const y = bot - i * ((top + bot) / 14); rr(ctx, -20 * L.c.w, y - 10, 40 * L.c.w, 10, 3, i % 2 ? '#111' : '#f5c400', '#0b0b0f', 2); }
        ctx.restore();
      }
    }
  },
  tow: {
    dur: 330,
    run(t, S, W, L, m) {
      const d = dirOf(W, L);
      if (t === 1) { S.d = d; S.target = clamp(L.x + d * 170, 170, 790); S.tx = d > 0 ? 960 + 280 : -280; }
      if (t < 60) { S.tx = lerp(S.tx, S.target, 0.07); if (t % 14 === 0) Snd.tone(1100, 0.12, 'square', 0.12); }
      const tipX = () => S.tx - 130 * S.d, tipY = GROUND - 150;
      S.hy = t < 60 ? tipY : t < 90 ? lerp(tipY, GROUND - 70, tw(t, 60, 90)) : t < 120 ? lerp(GROUND - 70, GROUND - 210, tw(t, 90, 120)) : GROUND - 210;
      bp(W, t < 140 ? 'point' : 'cheer', 0.15);
      if (t >= 90) {
        if (t === 90) Snd.block();
        L.x = lerp(L.x, tipX(), 0.2); L.rot = lerp(L.rot, 180, 0.12); L.y = Math.max(0, GROUND - S.hy - 70 * L.c.h); bp(L, 'air_hit'); L.rot += Math.sin(t * 0.15) * 2;
      }
      if (t > 140) { S.tx += S.d * Math.min(10, (t - 140) * 0.18); if (t % 5 === 0) m.smoke(S.tx + 150 * S.d, GROUND - 20, 1, '#555', 5); }
      if (t === 150) m.popText(W.x, GROUND - 210, localize("Tow-away zone!"), '#fff', 24, 90);
    },
    back(ctx, t, S) { if (S.tx != null) drawVehicle(ctx, 'tow', S.tx, S.d, t); },
    front(ctx, t, S) { if (S.tx != null) { const x = S.tx - 130 * S.d; seg2(ctx, [x, GROUND - 150], [x, S.hy], 2, '#111'); ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, S.hy + 6, 6, 0, Math.PI); ctx.stroke(); } }
  },
  graffiti: {
    dur: 330,
    run(t, S, W, L, m) {
      const d = dirOf(W, L);
      if (t === 1) S.d = d;
      bp(W, t < 130 ? 'spray' : t < 230 ? { ...W.c.stance, fu: 130, ff: 140, lean: 0 } : 'cheer', 0.25);
      if (t === 10 || t === 60 || t === 150) Snd.spray();
      if (t > 10 && t < 110 && t % 2 === 0) { const h = handOf(W); m.fx.push({ k: 'puff', x: lerp(h[0], L.x, Math.random()), y: h[1] + rand(-40, 40), vx: d * rand(1, 3), vy: rand(-0.5, 0.5), r: rand(8, 16), life: 50, max: 50, col: pick(PAINT) }); }
      if (t > 40 && t <= 110) { const k = tw(t, 40, 110); L.y = lerp(0, 60, k); L.sc = lerp(1, 0.78, k); L.x = lerp(L.x, L.x + d * 0.6, 1); bp(L, { ...L.c.stance, fu: 150, ff: 160, bu: 120, bf: 130, ft: 30, fs: 20, bt: -30, bs: -20, lean: 0, head: 0 }, 0.2); }
      if (t === 75) { L.paint = true; m.shake = 4; }
      if (t > 110) L.alpha = lerp(L.alpha, 0.85, 0.05);
      S.tag = tw(t, 140, 220);
    },
    front(ctx, t, S, W, L) {
      if (S.tag > 0) {
        const x = clamp(L.x + S.d * 90, 120, 840), y = GROUND - 230; ctx.save(); ctx.beginPath(); ctx.rect(x - 90, y - 50, 180 * S.tag, 100); ctx.clip(); ctx.translate(x, y); ctx.rotate(-0.12);
        outlineText(ctx, 'TOMI', 0, 0, 52, '#22d3ee', 'center', 7); ctx.restore();
        ctx.fillStyle = '#22d3ee'; for (let i = 0; i < 5; i++) { const dx = x - 70 + i * 34; if (dx < x - 90 + 180 * S.tag) ctx.fillRect(dx, y + 18, 3, Math.min(30, (t - 150) * 0.4 + i * 3)); }
      }
    }
  },
  wrap: {
    dur: 330,
    run(t, S, W, L, m) {
      if (t < 30) { bp(W, 'grab'); } else if (t < 50) { bp(W, 'slam', 0.35); L.rot = lerp(L.rot, -90, 0.3); L.y = lerp(L.y, 0, 0.3); bp(L, 'lie'); }
      if (t === 50) { L.lying = true; L.rot = -90; m.shake = 12; Snd.thud(); m.dust(L.x, 10); }
      if (t > 55 && t < 200) bp(W, 'kneel', 0.2); else if (t >= 200) bp(W, 'flex', 0.15);
      S.paper = tw(t, 60, 130); S.string = tw(t, 140, 175); S.tag = t > 190;
      if (t === 60 || t === 100) Snd.noise(0.6, 1500, 0.2, 'highpass');
      if (t === 191) { Snd.block(); m.popText(L.x, GROUND - 120, localize("Freshly wrapped!"), '#fff', 24, 100); }
    },
    front(ctx, t, S, W, L) {
      if (!S.paper) return;
      const b = lyingBox(L), w = (b.x2 - b.x1) * S.paper;
      const x0 = L.facing > 0 ? b.x2 - w : b.x1;
      rr(ctx, x0, GROUND - 44, w, 42, 10, '#c9a77a');
      ctx.strokeStyle = '#a9875a'; ctx.lineWidth = 2; for (let x = x0 + 14; x < x0 + w - 6; x += 22) { ctx.beginPath(); ctx.moveTo(x, GROUND - 40); ctx.lineTo(x + 6, GROUND - 6); ctx.stroke(); }
      if (S.string) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; [0.3, 0.7].forEach(p => { const x = lerp(b.x1, b.x2, p); ctx.beginPath(); ctx.moveTo(x, GROUND - 44); ctx.lineTo(x, GROUND - 44 + 44 * S.string); ctx.stroke(); }); }
      if (S.tag) { const x = (b.x1 + b.x2) / 2; ctx.save(); ctx.translate(x, GROUND - 30); ctx.rotate(-0.1); rr(ctx, -40, -14, 80, 28, 3, '#facc15'); ctx.fillStyle = '#111'; ctx.font = '14px ' + FONT_D; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1,99 €/kg', 0, 1); ctx.restore(); }
    }
  },
  door: {
    dur: 310,
    run(t, S, W, L, m) {
      const d = dirOf(W, L);
      if (t === 1) { S.d = d; S.dx = clamp(L.x + d * 150, 90, 870); S.open = 0; S.a = 0; }
      S.a = tw(t, 0, 20); S.open = t < 20 ? tw(t, 0, 20) : t < 95 ? 1 : Math.max(0, 1 - (t - 95) / 5);
      if (t < 40) bp(W, 'grab'); else if (t < 70) bp(W, 'palm', 0.4);
      else bp(W, { ...W.c.stance, fu: 40, ff: 120, bu: 30, bf: 120, lean: -2 }, 0.15);
      if (t === 45) { Snd.hit(0.6); m.spark(L.x, GROUND - 110, false); }
      if (t > 45 && t <= 90) { const k = tw(t, 45, 90); L.x = lerp(L.x, S.dx, 0.12); bp(L, 'hit_hi', 0.4); L.rot = -12; L.sc = lerp(1, 0.85, k); L.alpha = 1 - tw(t, 70, 90); }
      if (t === 90) L.vis = false;
      if (t === 98) { Snd.thud(); m.shake = 14; }
      S.stamp = tw(t, 120, 130);
    },
    back(ctx, t, S) {
      if (!S.a) return; ctx.save(); ctx.globalAlpha = S.a; const x = S.dx;
      rr(ctx, x - 55, GROUND - 200, 110, 176, 4, '#18181b', '#52525b', 6);
      const ow = 96 * S.open; const g = ctx.createLinearGradient(0, GROUND - 190, 0, GROUND - 30); g.addColorStop(0, '#c084fc'); g.addColorStop(1, '#4c1d95');
      ctx.fillStyle = g; ctx.fillRect(x - 48, GROUND - 192, ow, 166);
      rr(ctx, x - 48 + ow, GROUND - 192, 96 - ow, 166, 2, '#27272a'); neon(ctx, 'CLUB', x, GROUND - 214, 20, '#a78bfa');
      ctx.restore();
    },
    front(ctx, t, S) { if (S.stamp) { ctx.save(); ctx.translate(S.dx, GROUND - 120); ctx.rotate(-0.25); const s = 2 - S.stamp; ctx.scale(s, s); ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 5; ctx.strokeRect(-90, -24, 180, 48); outlineText(ctx, localize("BANNED FOR LIFE"), 0, 0, 28, '#ef4444', 'center', 3); ctx.restore(); } }
  },
  taxi: {
    dur: 330,
    run(t, S, W, L, m) {
      const d = dirOf(W, L);
      if (t === 1) { S.d = d; S.target = clamp(L.x + d * 200, 160, 800); S.tx = d > 0 ? 960 + 220 : -220; S.trunk = 0; }
      if (t < 55) S.tx = lerp(S.tx, S.target, 0.08);
      if (t === 30) Snd.horn();
      S.trunk = t < 55 ? 0 : t < 65 ? tw(t, 55, 65) * 1.2 : t < 125 ? 1.2 : Math.max(0, 1.2 - (t - 125) * 0.3);
      const tr = [S.tx - 85 * S.d, 70];
      if (t < 60) bp(W, 'grab'); else if (t < 90) { bp(W, 'lift', 0.3); L.y = lerp(0, 100, tw(t, 60, 90)); L.x = lerp(L.x, W.x, 0.15); L.rot = lerp(0, -160, tw(t, 60, 90)); bp(L, 'air_hit'); }
      else if (t <= 120) { if (t === 90) { S.sx = L.x; S.sy = L.y; } const k = tw(t, 90, 120); L.x = lerp(S.sx, tr[0], k); L.y = lerp(S.sy, tr[1], k) + Math.sin(k * Math.PI) * 60; L.rot -= 15; L.sc = lerp(1, 0.4, k); bp(W, 'throwx', 0.3); }
      if (t === 120) L.vis = false;
      if (t === 127) { Snd.thud(); m.shake = 6; }
      if (t > 140) { bp(W, 'point', 0.15); S.tx += S.d * Math.min(11, (t - 140) * 0.25); if (t % 5 === 0) m.smoke(S.tx + 110 * S.d, GROUND - 16, 1, '#666', 4); }
      if (t === 145) m.popText(W.x, GROUND - 210, localize("Taxi fare: €99.90"), '#facc15', 24, 110);
    },
    back(ctx, t, S) { if (S.tx != null) drawVehicle(ctx, 'taxi', S.tx, S.d, t, { trunk: S.trunk }); }
  },
  container: {
    dur: 300,
    run(t, S, W, L, m) {
      if (t === 1) { S.cx = L.x; S.cy = -140; Snd.engine(1.5); }
      bp(W, t < 90 ? { ...W.c.stance, fu: 170, ff: 176, lean: -6 } : 'flex', 0.15);
      bp(L, 'dizzy', 0.2); L.pose.lean += Math.sin(t * 0.12) * 8;
      if (t < 70) S.cy = lerp(-140, GROUND - 260, easeOut(tw(t, 0, 70)));
      else if (t < 84) S.cy = GROUND - 260 + Math.sin(t) * 2;
      else if (t <= 94) S.cy = lerp(GROUND - 260, GROUND - 112, easeIn(tw(t, 84, 94)));
      if (t === 94) { L.vis = false; m.shake = 22; Snd.thud(); Snd.hit(1); m.dust(S.cx - 80, 10); m.dust(S.cx + 80, 10); }
      if (t === 120) m.popText(S.cx, GROUND - 160, localize("Duty free."), '#fff', 26, 100);
    },
    front(ctx, t, S, W, L) {
      if (S.cy == null) return;
      const x = S.cx;
      if (t < 94) seg2(ctx, [x, 0], [x, S.cy], 3, '#111');
      if (t >= 94) shoes(ctx, x, L.c.look.shoes);
      rr(ctx, x - 120, S.cy, 240, 112, 2, '#b91c1c');
      ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 3; for (let k = 10; k < 236; k += 12) { ctx.beginPath(); ctx.moveTo(x - 120 + k, S.cy + 6); ctx.lineTo(x - 120 + k, S.cy + 106); ctx.stroke(); }
      ctx.fillStyle = '#fef3c7'; ctx.font = '16px ' + FONT_D; ctx.textAlign = 'center'; ctx.fillText(localize("BREMEN PORT"), x, S.cy + 60);
    }
  },
  tapout: {
    dur: 330,
    run(t, S, W, L, m) {
      const d = dirOf(W, L);
      if (t < 20) { bp(W, 'shoulder', 0.4); W.x += d * 2; }
      if (t === 22) { Snd.thud(); m.shake = 10; L.lying = true; L.rot = -90; m.dust(L.x, 8); L.facing = -d; }
      if (t > 22) { bp(L, 'lie', 0.3); }
      if (t > 25 && t < 210) { W.x = lerp(W.x, L.x + d * 70 * L.c.h, 0.15); W.facing = -d; bp(W, { ...fullPose(W.c.stance, 'kneel'), fu: 110, ff: 210, bu: 100, bf: 200 }, 0.2); }
      if (t >= 210) bp(W, 'cheer', 0.15);
      if (t > 60 && t < 140) { const tap = Math.floor((t - 60) / 22); const ph = (t - 60) % 22; L.pose.fu = ph < 8 ? 120 : 165; L.pose.ff = ph < 8 ? 120 : 170; if (ph === 0 && tap < 3) { m.popText(L.x - L.facing * 20, GROUND - 60, 'TAP', '#fff', 22, 30); Snd.tone(300, 0.06, 'square', 0.2); } }
      if (t > 150 && t % 30 === 0) m.popText(L.x - L.facing * 60, GROUND - 60, 'Z z z', '#a5b4fc', 22, 70);
      if (t === 160) m.popText(W.x, GROUND - 200, localize("Tapped out."), '#22c55e', 26, 100);
    }
  },
  durum: {
    dur: 340,
    run(t, S, W, L, m) {
      if (t < 18) bp(W, 'swing_c', 0.4); else if (t < 40) bp(W, 'swing', 0.5); else if (t < 200) bp(W, 'taunt', 0.15); else bp(W, 'cheer', 0.15);
      if (t === 22) { Snd.hit(1); m.spark(L.x, GROUND - 120, true); m.shake = 10; }
      if (t > 22 && t < 40) { L.rot = lerp(L.rot, -90, 0.3); bp(L, 'lie', 0.3); }
      if (t === 40) { L.lying = true; L.rot = -90; Snd.thud(); m.dust(L.x, 6); }
      S.bread = tw(t, 45, 70); S.top = tw(t, 75, 115); S.sauce = tw(t, 115, 135); S.roll = tw(t, 140, 185);
      if (t === 175) L.vis = false;
      if (t === 205) { m.popText(L.x, GROUND - 130, localize("With everything?"), '#fff', 28, 110); Snd.ok(); }
    },
    front(ctx, t, S, W, L) {
      if (!S.bread) return;
      const b = lyingBox(L), cx = (b.x1 + b.x2) / 2, w = b.x2 - b.x1 + 30;
      const y = lerp(-60, GROUND - 30, easeIn(S.bread));
      if (S.roll < 1) {
        const hh = lerp(14, 50, S.roll), ww = w * (1 - S.roll * 0.15);
        ctx.save(); ctx.globalAlpha = 1;
        rr(ctx, cx - ww / 2, y - hh / 2 - (S.roll * 10), ww, hh, hh / 2, '#e8c486');
        const r = seeded(5);
        if (S.top) for (let i = 0; i < 26 * S.top; i++) dot(ctx, [cx - ww / 2 + 14 + r() * (ww - 28), y - 10 - r() * 8 - S.roll * 10], 4 + r() * 3, ['#16a34a', '#ef4444', '#f5f5f4', '#a16207'][i % 4], false);
        if (S.sauce) { ctx.strokeStyle = '#fafafa'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = 0; x < (ww - 30) * S.sauce; x += 4) ctx.lineTo(cx - ww / 2 + 15 + x, y - 16 + Math.sin(x * 0.2) * 5); ctx.stroke(); ctx.strokeStyle = '#dc2626'; ctx.beginPath(); for (let x = 0; x < (ww - 30) * S.sauce; x += 4) ctx.lineTo(cx - ww / 2 + 15 + x, y - 12 + Math.cos(x * 0.25) * 5); ctx.stroke(); }
        ctx.restore();
      } else {
        rr(ctx, cx - w * 0.42, GROUND - 60, w * 0.84, 56, 26, '#e8c486');
        ctx.strokeStyle = '#c99a55'; ctx.lineWidth = 3; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(cx - w * 0.42 + i * w * 0.17, GROUND - 58); ctx.quadraticCurveTo(cx - w * 0.42 + i * w * 0.17 + 14, GROUND - 32, cx - w * 0.42 + i * w * 0.17, GROUND - 6); ctx.stroke(); }
        rr(ctx, cx - w * 0.42, GROUND - 40, w * 0.4, 36, 8, '#f5f5f4');
        dot(ctx, [cx + w * 0.42 - 6, GROUND - 40], 6, '#16a34a', false); dot(ctx, [cx + w * 0.42 - 2, GROUND - 26], 5, '#ef4444', false);
      }
    }
  },
  strip: {
    dur: 330,
    run(t, S, W, L, m) {
      const d0 = S.d0 || (S.d0 = dirOf(W, L));
      [12, 38, 64].forEach((pt, i) => {
        if (t === pt) { S.from = W.x; S.to = L.x + (i % 2 === 0 ? d0 : -d0) * 80; Snd.whoosh(1.2); }
        if (t >= pt && t < pt + 8) { W.x = lerp(S.from, S.to, (t - pt) / 7); W.facing = Math.sign(S.to - S.from) || 1; L.flash = 3; L.rot = Math.sin(t) * 6; bp(W, 'shoulder', 0.5); }
        if (t === pt + 8) { W.facing = L.x > W.x ? 1 : -1; m.spark(L.x, GROUND - 100, false, '#e5e7eb'); }
      });
      if (t === 74) { L.strip = true; L.rot = 0; m.popText(L.x, GROUND - 200, localize("All gone!"), '#fff', 26, 100); }
      if (t > 74 && t < 150) { bp(L, { ...L.c.stance, fu: 20, ff: 150, bu: 15, bf: 140, lean: 22, head: 18, ft: 30, fs: 10, bt: -10, bs: -30 }, 0.2); bp(W, { ...W.c.stance, fu: 120, ff: 150, bu: 80, bf: 100 }, 0.2); }
      if (t >= 150) { const away = L.x > W.x ? 1 : -1; L.facing = away; L.x += away * 6; S.ph = (S.ph || 0) + 0.45; L.pose = walkPose(L, S.ph); L.pose.lean = 20; bp(W, 'cheer', 0.12); }
      if (t === 155) Snd.tone(900, 0.4, 'sine', 0.15, 300);
    },
    front(ctx, t, S, W, L) {
      if (t > 8 && t < 74) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const y = GROUND - 40 - i * 22; ctx.beginPath(); ctx.moveTo(W.x - 120, y); ctx.lineTo(W.x + 120, y); ctx.stroke(); } }
      if (t >= 74) { const h = handOf(W, 'bh'), lk = L.c.look; rr(ctx, h[0] - 22, h[1] - 30, 44, 18, 4, lk.top); rr(ctx, h[0] - 18, h[1] - 14, 36, 14, 4, lk.pants); rr(ctx, h[0] - 14, h[1] - 44, 26, 14, 4, lk.shoes); const h2 = handOf(W); rr(ctx, h2[0] - 8, h2[1] - 14, 16, 12, 2, '#7c4a1e'); }
    }
  },
  dumpster: {
    dur: 320,
    run(t, S, W, L, m) {
      const d = dirOf(W, L);
      if (t === 1) { S.d = d; S.dx = clamp(L.x + d * 140, 110, 850); S.x = d > 0 ? 960 + 120 : -120; S.lid = 1.1; }
      if (t < 40) S.x = lerp(S.x, S.dx, 0.12);
      if (t === 20) Snd.noise(0.6, 600, 0.3, 'lowpass');
      if (t < 60) bp(W, 'grab'); else if (t < 95) { bp(W, 'lift', 0.25); L.y = lerp(0, 110, tw(t, 60, 95)); L.x = lerp(L.x, W.x, 0.15); L.rot = lerp(0, -90, tw(t, 60, 95)); bp(L, 'air_hit'); }
      else if (t <= 125) { if (t === 95) { S.sx = L.x; S.sy = L.y; Snd.whoosh(); } const k = tw(t, 95, 125); L.x = lerp(S.sx, S.x, k); L.y = lerp(S.sy, 20, k) + Math.sin(k * Math.PI) * 70; L.rot -= 10; bp(W, 'throwx', 0.3); }
      if (t === 125) { L.vis = false; Snd.thud(); }
      if (t > 128) S.lid = Math.max(0, S.lid - 0.25); if (t === 132) { Snd.thud(); m.shake = 10; }
      if (t > 140) bp(W, 'flex', 0.12);
      S.sticker = t > 150;
    },
    front(ctx, t, S) {
      if (S.x == null) return; const x = S.x;
      rr(ctx, x - 80, GROUND - 100, 160, 96, 4, '#166534'); ctx.fillStyle = '#14532d'; for (let i = 0; i < 5; i++) ctx.fillRect(x - 70 + i * 30, GROUND - 92, 6, 80);
      ctx.save(); ctx.translate(x - 84, GROUND - 100); ctx.rotate(-S.lid); rr(ctx, 0, -8, 168, 10, 2, '#15803d'); ctx.restore();
      wheel(ctx, x - 60, GROUND - 4, 6, 0); wheel(ctx, x + 60, GROUND - 4, 6, 0);
      if (S.sticker) { ctx.save(); ctx.translate(x, GROUND - 56); ctx.rotate(-0.08); rr(ctx, -64, -14, 128, 28, 3, '#f97316'); ctx.fillStyle = '#111'; ctx.font = '16px ' + FONT_D; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(localize("BULKY WASTE"), 0, 1); ctx.restore(); }
    }
  },
  vanish: {
    dur: 330,
    run(t, S, W, L, m) {
      if (t < 12) bp(W, 'throwp', 0.4); else if (t < 24) bp(W, 'throwx', 0.4);
      if (t === 20) { Snd.noise(1.2, 900, 0.5, 'lowpass', 200); m.shake = 6; }
      if (t > 20 && t < 80 && t % 2 === 0) m.smoke((W.x + L.x) / 2 + rand(-60, 60), GROUND - rand(20, 150), 2, pick(['#a1a1aa', '#d4d4d8', '#71717a']), 30);
      if (t === 60) { L.vis = false; S.sx = L.x; W.x = clamp(W.x - W.facing * 60, 80, 880); }
      if (t > 90) bp(W, { ...W.c.stance, fu: 30, ff: 150, bu: 10, bf: 20, lean: -6, head: -8, ft: 40, fs: -30, bt: -10, bs: -6 }, 0.1);
      S.poster = tw(t, 150, 185);
      if (t === 200) m.popText(W.x, GROUND - 200, localize("Never seen them."), '#c4b5fd', 24, 100);
    },
    back(ctx, t, S, W, L) { if (S.poster) poster(ctx, clamp(S.sx || W.x, 120, 840) + 0, 180 + (1 - S.poster) * -200, L, S.poster); },
    front(ctx, t, S, W, L) { if (t > 60 && S.sx != null) shoes(ctx, S.sx, L.c.look.shoes); }
  }
};
for (const k in FINISHERS) FINISHERS[k].name = k;

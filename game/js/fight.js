'use strict';
const GRAV = 0.75;
const FREE = new Set(['idle', 'walk', 'crouch', 'block', 'cblock', 'land']);
const POSE_LIMB = { jab: 'fh', cross: 'bh', hook: 'fh', hay: 'bh', palm: 'fh', lowkick: 'bf', knee: 'fk', shoulder: 'fsh', hb: 'head', swing: 'prop', superman: 'bh', ovh: 'bh', elbow: 'fe', teep: 'ff', rh: 'bf', hk: 'bf', upper: 'bh', lariat: 'fe' };

function compileMove(m) {
  if (m._c) return m._c;
  let t = 0, id = 0; const segs = [];
  for (const k of m.k) {
    segs.push({ p: k.p, s: t, e: t + k.d });
    t += k.d;
    if (k.hold) { segs.push({ p: k.p, s: t, e: t + k.hold, hit: k.hit, hid: id++, ev: k.ev, hold: 1 }); t += k.hold; }
    else if (k.ev) segs[segs.length - 1].ev = k.ev;
  }
  m._c = { segs, len: t };
  return m._c;
}

// ---------- специални удари → движения ----------
function buildSpecial(c, sp) {
  const L = sp.l || 'm';
  const mk = (o) => Object.assign({ special: sp, name: sp.name }, o);
  switch (sp.type) {
    case 'rush': {
      const k = []; const pairs = sp.poses.length / 2;
      for (let i = 0; i < sp.hits; i++) {
        const j = (i % pairs) * 2, last = i === sp.hits - 1;
        const limb = sp.limb || POSE_LIMB[sp.poses[j + 1]] || 'fh';
        const hit = HT(sp.d, L, sp.st, last ? (sp.finalKb || sp.kb || 4) : 1.5, limb, { r: 20, kd: last && (sp.kd || sp.finalKd), launch: last ? (sp.finalLaunch || (sp.kd || sp.finalKd ? 6 : 0)) : 0, steal: sp.steal, special: 1 });
        k.push({ p: sp.poses[j], d: i === 0 ? 8 : Math.max(2, sp.every - 4) });
        k.push({ p: sp.poses[j + 1], d: 2, hold: 2, hit });
      }
      k.push({ p: null, d: 18 });
      const m = mk({ k }); const len = compileMove(m).len;
      m.vx = sp.vx; m.vxUntil = len - 18; if (sp.armor) m.armor = [2, len - 18]; if (sp.hop) m.hop = sp.hop;
      return m;
    }
    case 'proj': {
      const pose = ['beam', 'wave', 'cloud', 'sauce'].includes(sp.sprite) ? 'spray' : 'throwx';
      return mk({ k: [{ p: pose === 'spray' ? { fu: 70, ff: 120 } : 'throwp', d: 9 }, { p: pose, d: 3, hold: 3, ev: 'spawn' }, { p: null, d: 20 }], proj: 1 });
    }
    case 'cgrab':
      return mk({ k: [{ p: sp.dash ? 'shoulder' : 'grab', d: sp.dash ? 12 : 6 }, { p: sp.dash ? 'shoulder' : 'grab', d: 1, hold: 5, ev: 'grab' }, { p: null, d: 26 }], vx: sp.dash ? 7 : 1.5, vxUntil: sp.dash ? 18 : 10 });
    case 'aa':
      return mk({ k: [{ p: 'knee_c', d: 4 }, { p: sp.pose, d: 3, hold: 16, hit: HT(sp.d, 'm', 0, 4, sp.limb, { r: 22, launch: 10, kd: 1, special: 1 }) }, { p: 'jump', d: 30 }], jumpAt: 3, vy: sp.vy, jvx: sp.vx, air: 1 });
    case 'flip':
      return mk({ k: [{ p: 'jump', d: 12 }, { p: 'jhk', d: 3, hold: 16, hit: HT(sp.d, 'o', 22, 5, 'ff', { r: 22, kd: 1, launch: 5, special: 1 }) }, { p: 'jump', d: 30 }], jumpAt: 2, vy: sp.vy, jvx: sp.vx, air: 1 });
    case 'counter':
      return mk({ k: [{ p: 'block', d: 2, hold: sp.window, ev: 'counter' }, { p: null, d: 20 }] });
    case 'tele':
      return mk({ k: [{ p: 'crouch', d: 14 }, { p: 'elbow_c', d: 4 }, { p: 'elbow', d: 2, hold: 4, hit: HT(sp.d, 'm', 22, 6, 'fe', { r: 20, special: 1 }) }, { p: null, d: 18 }], events: { 6: 'vanish', 13: 'appear' } });
    case 'quake':
      return mk({ k: [{ p: 'lift', d: 14 }, { p: 'slam', d: 4, hold: 2, ev: 'quake' }, { p: null, d: 24 }] });
  }
}
const SUPER_SEQ = [['jab_c', 'jab', 'fh'], ['cross_c', 'cross', 'bh'], ['knee_c', 'knee', 'fk'], ['hook_c', 'hook', 'fh'], ['rh_c', 'hk', 'bf'], ['upper_c', 'upper', 'bh']];
function buildSuper(c) {
  return { name: c.sup.name, isSuper: 1, k: [{ p: 'shoulder', d: 8 }, { p: 'jab', d: 2, hold: 12, hit: HT(30, 'm', 30, 2, 'fh', { r: 26, superStart: 1, special: 1 }) }, { p: null, d: 26 }], vx: 9, vxUntil: 22 };
}
for (const c of CHARS) { c.sp1m = buildSpecial(c, c.sp1); c.sp2m = buildSpecial(c, c.sp2); c.supm = buildSuper(c); }

// ---------- боец ----------
class Fighter {
  constructor(c, side, ctrl) {
    this.c = c; this.side = side; this.ctrl = ctrl; this.meter = 0; this.wins = 0;
    this.ai = ctrl.type === 'cpu' ? new AI(ctrl.level) : null;
    this.reset(side ? 640 : 320, side ? -1 : 1);
  }
  reset(x, facing) {
    Object.assign(this, { x, y: 0, vx: 0, vy: 0, facing, hp: 1000, state: 'idle', st: 0, move: null, mt: 0, hitstun: 0, juggle: 0, comboHits: 0, comboDmg: 0, myCombo: 0,
      invul: 0, connected: false, chain: 0, hitIds: new Set(), airUsed: false, lying: false, rot: 0, sc: 1, vis: true, alpha: 1, flash: 0, strip: false, paint: false, squash: 1, noProp: false,
      stunUsed: false, dirHist: [], lastDir: '', thr: null, sup: null, armorHits: 0, walkPh: 0, fp: null, script: false, lastHitBy: null, pushed: 0,
      attackBuffer: null, sampledInput: null, moveSerial: 0, moveRank: 0, guardStart: -999, blockHeld: false });
    this.pose = Object.assign({}, this.c.stance);
    this.input = { P: {} };
    if (this.ai) this.ai.reset();
  }
  get free() { return FREE.has(this.state); }
  get crouching() { return this.state === 'crouch' || this.state === 'cblock' || (this.state === 'move' && this.move && this.move.crouch); }
  basePose() {
    if (this.state === 'move' && this.move) { if (this.move.crouch) return fullPose(this.c.stance, 'crouch'); if (this.move.air && this.y > 0) return fullPose(this.c.stance, 'jump'); }
    return this.c.stance;
  }
  resolve(p) { if (p == null) return Object.assign({}, this.basePose()); return fullPose(this.basePose(), p); }
}

// ---------- мач ----------
class Match {
  constructor(opts) {
    this.opts = opts; this.mode = opts.mode; this.arena = opts.arena;
    this.p = [new Fighter(opts.c1, 0, opts.ctrl1), new Fighter(opts.c2, 1, opts.ctrl2)];
    this.round = 1; this.T = 0; this.fx = []; this.proj = []; this.texts = []; this.shake = 0; this.hitstop = 0; this.dim = 0; this.slow = 0;
    this.result = null; this.paused = false; this.simFrame = 0;
    this.trainingStats = { lastCombo: { hits: 0, damage: 0 }, bestCombo: { hits: 0, damage: 0 }, totalDamage: 0, perfectGuards: 0 };
    if(typeof Economy!=='undefined')Economy.apply(this);
    this.startRound();
  }
  startRound() {
    const [a, b] = this.p;
    a.reset(300, 1); b.reset(660, -1);
    this.impactFocus=null; this.cameraZoom=1.08; this.shake=0;
    if (this.round === 1) { a.meter = 0; b.meter = 0; }
    a.x = 180; b.x = 780; a.state = b.state = 'intro';
    this.timer = 99; this.tick = 0; this.phase = 'intro'; this.pt = 0; this.proj = []; this.fx = []; this.finisher = null; this.winner = null; this.loser = null; this.dim = 0;
    this.announce(localize("ROUND ") + this.round, 70, '#fff', 64); Snd.say(localize("Round ") + [localize("one"), localize("two"), localize("three"), localize("four"), localize("five")][Math.min(this.round - 1, 4)]);
  }
  announce(t, life = 60, col = '#fff', size = 60, sub) { this.banner = { t, life, max: life, col, size, sub }; }
  popText(x, y, t, col = '#fff', size = 22, life = 50) { this.texts.push({ x, y, t, col, size, life, max: life }); }
  spark(x, y, big, col, opt = {}) {
    for (let i = 0; i < (big ? 14 : 8); i++) { const a = Math.random() * Math.PI * 2, s = rand(2, big ? 9 : 6); this.fx.push({ k: 'spk', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 16, max: 16, col: col || (i % 2 ? '#fff6c2' : '#ffd23d') }); }
    this.fx.push({ k: 'star', x, y, life: 10, max: 10, r: big ? 34 : 22, col: col || '#fff6c2' });
    CombatFX.emit(this,x,y,{power:opt.power||(big?2:1),blocked:col==='#8fd3ff',color:col,facing:opt.facing});
  }
  dust(x, n = 6, col = '#9b8f80') { for (let i = 0; i < n; i++) this.fx.push({ k: 'puff', x: x + rand(-20, 20), y: GROUND - rand(0, 10), vx: rand(-1.5, 1.5), vy: rand(-1.2, -0.2), r: rand(6, 12), life: 34, max: 34, col }); }
  smoke(x, y, n = 14, col = '#8f8f9a', spread = 40) { for (let i = 0; i < n; i++) this.fx.push({ k: 'puff', x: x + rand(-spread, spread), y: y + rand(-spread, spread * 0.6), vx: rand(-1, 1), vy: rand(-1.4, -0.2), r: rand(14, 26), life: 60, max: 60, col }); }

  opp(f) { return this.p[1 - f.side]; }

  // ---------- главен цикъл ----------
  update() {
    if (this.paused) return;
    this.T++;
    // Sample human edges even during hitstop. The buffer expires in simulation
    // frames, so a cinematic pause never eats a deliberate follow-up input.
    for (const f of this.p) if (f.ctrl.type === 'human') {
      f.sampledInput = this.readInput(f); this.bufferAttack(f, f.sampledInput);
    }
    if(this.impactFocus)this.impactFocus.age++;
    if (this.banner) { this.banner.life--; if (this.banner.life <= 0) this.banner = null; }
    for (const t of this.texts) { t.life--; t.y -= 0.6; } this.texts = this.texts.filter(t => t.life > 0);
    for (const f of this.fx) { f.life--; if (f.vx != null) { f.x += f.vx; f.y += f.vy; if (f.k === 'spk') { f.vx *= 0.9; f.vy *= 0.9; } } if (f.k === 'puff') f.r += 0.4; }
    this.fx = this.fx.filter(f => f.life > 0);
    if (this.shake > 0) this.shake *= 0.85;
    if (this.slow > 0) { this.slow--; if (this.slow % 3 !== 0) return; }
    if (this.hitstop > 0) { this.hitstop--; for (const f of this.p) if (f.flash > 0) f.flash--; return; }

    this.pt++; this.simFrame++;
    const [a, b] = this.p;
    for (const f of this.p) {
      f.input = f.ctrl.type === 'human' ? f.sampledInput : this.readInput(f);
      if (f.ctrl.type !== 'human') this.bufferAttack(f, f.input);
    }

    switch (this.phase) {
      case 'intro':
        for (const f of this.p) { const tx = f.side ? 620 : 340; f.x += (tx - f.x) * 0.06; f.state = 'walk'; this.animate(f); }
        if (this.pt === 75) { this.announce(localize("FIGHT!"), 45, '#ffd23d', 80); Snd.say(localize("Fight!")); }
        if (this.pt >= 95) { this.phase = 'play'; for (const f of this.p) f.state = 'idle'; }
        return;
      case 'play':
        if (this.mode !== 'training') { this.tick++; if (this.tick % 60 === 0 && this.timer > 0) { this.timer--; if (this.timer === 0) return this.timeOver(); } }
        break;
      case 'ko':
        if (this.pt > 70 && this.loser.state === 'down' || this.pt > 160) this.afterKO();
        break;
      case 'finishPrompt':
        this.finishPromptUpdate(); break;
      case 'finisher':
        this.finisher.t++; this.finisher.def.run(this.finisher.t, this.finisher.S, this.winner, this.loser, this);
        if (this.finisher.t >= this.finisher.def.dur) this.endMatch();
        return;
      case 'roundOver':
        if (this.pt > 150) { if (this.matchDone()) this.endMatch(); else { this.round++; this.startRound(); } }
        break;
      case 'matchOver': return;
    }

    for (const f of this.p) this.stepFighter(f);
    this.physics();
    for (const f of this.p) this.checkHits(f);
    this.updateProj();
    for (const f of this.p) this.animate(f);

    if (this.mode === 'training') for (const f of this.p) { if (f.free && f.comboHits === 0 && f.hp < 1000) f.hp = Math.min(1000, f.hp + 12); if (f.side === 0) f.meter = Math.min(1000, f.meter + 2); }
  }

  readInput(f) {
    const c = f.ctrl;
    if (this.phase !== 'play' && this.phase !== 'finishPrompt') return { P: {} };
    if (c.type === 'human') return readInput(c.map, c.touch, c.pad);
    if (c.type === 'cpu') return f.ai.think(f, this.opp(f), this);
    return { P: {} };
  }

  bufferAttack(f, input) {
    const key = ['sp', 'lp', 'hp', 'lk', 'hk'].find(k => input.P?.[k]);
    if (key) f.attackBuffer = { key, expires: this.simFrame + 8, d: !!input.d, l: !!input.l, r: !!input.r };
  }
  attackInput(f) {
    const buffered = f.attackBuffer;
    if (buffered && buffered.expires >= this.simFrame) return { ...f.input, d: buffered.d, l: buffered.l, r: buffered.r, P: { [buffered.key]: true } };
    f.attackBuffer = null;
    return f.input;
  }
  recordCombo(B) {
    if (this.mode !== 'training' || B.side !== 1 || !B.comboHits) return;
    const combo = { hits: B.comboHits, damage: B.comboDmg };
    this.trainingStats.lastCombo = combo;
    const best = this.trainingStats.bestCombo;
    if (combo.damage > best.damage || (combo.damage === best.damage && combo.hits > best.hits)) this.trainingStats.bestCombo = { ...combo };
  }

  // ---------- логика на боеца ----------
  stepFighter(f) {
    const o = this.opp(f), inp = f.input;
    const fwd = f.facing === 1 ? inp.r : inp.l, back = f.facing === 1 ? inp.l : inp.r;
    f.fwd = fwd; f.back = back;
    if (inp.bl && !f.blockHeld) f.guardStart = this.simFrame;
    f.blockHeld = !!inp.bl;
    // история на посоките (за финала)
    const ds = inp.d && !fwd && !back ? 'D' : fwd && !inp.d ? 'F' : back && !inp.d ? 'B' : inp.u ? 'U' : '';
    if (ds !== f.lastDir) { if (ds) { f.dirHist.push({ d: ds, t: this.T }); if (f.dirHist.length > 8) f.dirHist.shift(); } f.lastDir = ds; }
    if (f.invul > 0) f.invul--;
    if (f.flash > 0) f.flash--;
    f.st++;
    if (f.script) return;

    if (f.free) {
      if (f.comboHits) { this.recordCombo(f); f.comboHits = 0; f.comboDmg = 0; f.juggle = 0; f.stunUsed = false; }
      if (Math.abs(o.x - f.x) > 6 && o.state !== 'thrown') f.facing = o.x > f.x ? 1 : -1;
      if (this.tryAttack(f, o)) return;
      if (inp.bl) { this.setState(f, inp.d ? 'cblock' : 'block'); f.vx = 0; return; }
      if (inp.u && f.state !== 'land') { this.setState(f, 'prejump'); f.jdir = fwd ? 1 : back ? -1 : 0; f.vx = 0; return; }
      if (inp.d) { this.setState(f, 'crouch'); f.vx = 0; return; }
      if (fwd) { this.setState(f, 'walk'); f.vx = f.c.walk * f.facing; return; }
      if (back) { this.setState(f, 'walk'); f.vx = -f.c.walk * 0.82 * f.facing; return; }
      if (f.state === 'land' && f.st < 4) return;
      this.setState(f, 'idle'); f.vx = 0;
      return;
    }
    switch (f.state) {
      case 'prejump':
        if (f.st >= 3) { this.setState(f, 'jump'); f.vy = 13.2 * (f.c.jump || 1); f.vx = f.jdir * (3.4 + f.c.spd * 0.08) * f.facing; f.airUsed = false; Snd.whoosh(0.5); }
        break;
      case 'jump':
        if (!f.airUsed) { const b = ['lp', 'hp', 'lk', 'hk'].find(k => inp.P[k]); if (b) { f.airUsed = true; this.startMove(f, f.c.moves['j' + b.toUpperCase()]); } }
        break;
      case 'move': this.updateMove(f, o); break;
      case 'hit': f.hitstun--; f.vx *= 0.82; if (f.hitstun <= 0) this.setState(f, 'idle'); break;
      case 'blockstun': f.hitstun--; f.vx *= 0.8; if (f.hitstun <= 0) this.setState(f, f.wasCrouch ? 'cblock' : 'block'); break;
      case 'dizzy': if (this.phase === 'play') { f.hitstun--; if (f.hitstun <= 0) this.setState(f, 'idle'); } break;
      case 'down':
        f.vx *= 0.8;
        if (this.phase === 'play' && f.st > 46) { this.setState(f, 'getup'); f.invul = 20; }
        break;
      case 'getup': if (f.st > 18) { f.lying = false; f.rot = 0; this.setState(f, 'idle'); } break;
      case 'throwing': this.updateThrow(f); break;
      case 'super': this.updateSuper(f); break;
    }
  }
  setState(f, s) { if (f.state !== s) { f.state = s; f.st = 0; } }

  tryAttack(f, o) {
    const inp = this.attackInput(f), P = inp.P;
    const fwd = f.facing === 1 ? inp.r : inp.l, back = f.facing === 1 ? inp.l : inp.r;
    if (P.sp) {
      if (inp.d && f.meter >= 1000) { f.meter = 0; this.startMove(f, f.c.supm); this.dim = 40; this.announce(f.c.sup.name.toUpperCase(), 50, f.c.sup.color, 52); Snd.zap(); return true; }
      const m = (fwd || back) ? f.c.sp2m : f.c.sp1m;
      if (m.proj && this.proj.some(p => p.owner === f && !p.dead)) return false;
      this.startMove(f, m); this.popText(f.x, GROUND - 170, m.name, '#fff', 18, 40); return true;
    }
    const b = ['lp', 'hp', 'lk', 'hk'].find(k => P[k]);
    if (!b) return false;
    // финал
    if (this.phase === 'finishPrompt' && f === this.winner && this.checkFinisherCode(f, b)) return true;
    // хвърляне: напред + силен удар отблизо
    if (b === 'hp' && fwd && Math.abs(o.x - f.x) < 78 + 10 * f.c.w && o.y === 0 && !o.invul && (o.free || o.state === 'move')) {
      this.startThrow(f, o, THROWS[f.c.throw], 110); return true;
    }
    const key = b.toUpperCase();
    if (inp.d) { this.startMove(f, f.c.moves['c' + key]); return true; }
    if (b === 'hp' && fwd && f.c.moves.fHP) { this.startMove(f, f.c.moves.fHP); return true; }
    this.startMove(f, f.c.moves[key]); return true;
  }

  startMove(f, m) {
    const c = compileMove(m);
    f.prevState = f.state;
    f.attackBuffer = null; f.moveSerial++;
    f.moveRank = m.special || m.isSuper ? 3 : ['HP', 'HK', 'cHP', 'cHK', 'fHP'].some(k => f.c.moves[k] === m) ? 2 : 1;
    f.state = 'move'; f.st = 0; f.move = m; f.mt = 0; f.mc = c; f.hitIds = new Set(); f.connected = false; f.armorHits = 0;
    f.startPose = Object.assign({}, f.pose); f.jumped = false;
    if (!m.air) f.vx = 0;
    if (m.hop) { f.vy = m.hop; f.y = 0.1; }
    Snd.whoosh(m.special ? 1 : 0.6);
  }
  endMove(f) {
    const air = f.y > 0;
    f.move = null; f.mc = null;
    if (air) { f.state = 'jump'; f.airUsed = true; } else this.setState(f, f.input.d ? 'crouch' : 'idle');
    f.chain = 0;
  }
  updateMove(f, o) {
    const m = f.move, c = f.mc;
    f.mt++;
    // хоризонтално движение
    if (m.vx && f.mt <= (m.vxUntil || c.len)) f.vx = m.vx * f.facing; else if (!m.air && f.y === 0) f.vx *= 0.7;
    if (m.jumpAt && f.mt === m.jumpAt) { f.vy = m.vy; f.vx = (m.jvx || 0) * f.facing; f.y = 0.1; f.jumped = true; }
    if (m.events && m.events[f.mt]) this.moveEvent(f, o, m.events[f.mt]);
    const seg = c.segs.find(s => f.mt > s.s && f.mt <= s.e);
    if (seg && seg.ev && f.mt === seg.s + 1) this.moveEvent(f, o, seg.ev);
    // приземяване на въздушен удар
    if ((m.air || m.hop) && f.y <= 0 && f.mt > 2 && (f.jumped || !m.jumpAt) && (m.hop ? f.mt > 6 : true) && f.vy <= 0 && f.prevY > 0) { f.y = 0; f.vy = 0; f.move = null; this.setState(f, 'land'); this.dust(f.x, 3); return; }
    // верижни комбинации
    if (f.connected && seg && !seg.hold && seg.p == null && f.chain < 2 && !m.special && !m.air) {
      const P = this.attackInput(f).P, b = ['lp', 'hp', 'lk', 'hk'].find(k => P[k]);
      const rank = P.sp ? 3 : b === 'hp' || b === 'hk' ? 2 : b ? 1 : 0;
      // A clean hit opens light → heavy → special routes. Heavy → light
      // loops and canceling blocked normals cannot create infinite pressure.
      if (rank && rank >= f.moveRank && (rank > f.moveRank || rank === 1)) {
        const chain = f.chain + 1;
        if (this.tryAttack(f, o)) { f.chain = chain; return; }
      }
    }
    if (f.mt >= c.len) this.endMove(f);
  }
  moveEvent(f, o, ev) {
    const sp = f.move.special;
    if (ev === 'spawn') this.spawnProj(f, sp);
    else if (ev === 'grab') {
      const dx = Math.abs(o.x - f.x);
      if (dx < (sp.range || 80) + 10 * f.c.w && o.y < 30 && !o.invul && o.state !== 'down' && o.state !== 'thrown') { this.startThrow(f, o, THROWS[sp.throw], sp.d, sp.name); }
    } else if (ev === 'quake') {
      this.shake = 10; Snd.thud(); this.dust(f.x + f.facing * 40, 10);
      this.proj.push({ owner: f, x: f.x + f.facing * 50, y: 8, vx: 8 * f.facing, life: 50, sprite: 'shock', r: 22, t: 0, hit: HT(sp.d, 'l', 0, 4, '', { kd: 1, launch: 6, special: 1 }) });
    } else if (ev === 'vanish') { this.smoke(f.x, GROUND - 60, 12, f.c.id === 'marco' ? '#2a2a33' : '#9a9aa8'); f.vis = false; f.invul = 12; }
    else if (ev === 'appear') {
      const side = o.x > f.x ? 1 : -1;
      f.x = clamp(o.x + side * 66, LEFT, RIGHT); if (f.x === o.x) f.x += 10;
      f.facing = o.x > f.x ? 1 : -1; f.vis = true; this.smoke(f.x, GROUND - 60, 8, f.c.id === 'marco' ? '#2a2a33' : '#9a9aa8');
    }
  }
  movePose(f) {
    const c = f.mc, t = f.mt;
    let i = c.segs.findIndex(s => t <= s.e); if (i < 0) i = c.segs.length - 1;
    const s = c.segs[i];
    const from = i === 0 ? f.startPose : f.resolve(c.segs[i - 1].p == null && i - 1 === c.segs.length - 1 ? null : c.segs[i - 1].p);
    const to = f.resolve(s.p);
    if (s.hold) return to;
    const k = ease((t - s.s) / Math.max(1, s.e - s.s));
    const o = {}; for (const key of PARAMS) o[key] = lerp(from[key] || 0, to[key] || 0, k);
    return o;
  }

  // ---------- хвърляния ----------
  startThrow(A, B, sc, dmg, name) {
    A.attackBuffer = null; B.attackBuffer = null;
    if(B.free&&B.comboHits){this.recordCombo(B);B.comboHits=0;B.comboDmg=0;B.juggle=0;}
    A.state = 'throwing'; A.st = 0; A.move = null; A.vx = 0; A.thr = { s: sc, t: 0, dmg, n: [sc.impact, sc.impact2, sc.impact3].filter(Boolean).length };
    B.state = 'thrown'; B.st = 0; B.move = null; B.vx = B.vy = 0; B.y = 0; B.lying = false; B.vis = true; B.comboHits++;
    B.facing = -A.facing;
    Snd.whoosh(1); if (name) this.popText(A.x, GROUND - 170, name, '#fff', 18, 40);
  }
  updateThrow(A) {
    const th = A.thr, s = th.s, B = this.opp(A); th.t++;
    const kf = (arr, t) => { let i = 0; while (i < arr.length - 2 && t >= arr[i + 1][0]) i++; const a = arr[i], b = arr[i + 1] || a; const k = b[0] === a[0] ? 1 : ease((t - a[0]) / (b[0] - a[0])); return [a, b, k]; };
    const [a1, a2, ka] = kf(s.A, th.t);
    const pa = A.resolve(a1[1]), pb = A.resolve(a2[1]); const o = {}; for (const key of PARAMS) o[key] = lerp(pa[key] || 0, pb[key] || 0, ka); A.pose = o;
    const [b1, b2, kb] = kf(s.B, th.t);
    const dx = lerp(b1[1], b2[1], kb), dy = lerp(b1[2], b2[2], kb), rot = lerp(b1[3], b2[3], kb);
    B.x = A.x + dx * A.facing; B.y = Math.max(0, dy); B.rot = rot; B.pose = fullPose(B.c.stance, rot < -30 ? 'air_hit' : 'hit_hi');
    if (th.t === s.impact || th.t === s.impact2 || th.t === s.impact3) {
      const d = th.dmg / th.n; this.damage(A, B, d); this.recordCombo(B); this.shake = 12; this.hitstop = 6; Snd.thud(); Snd.hit(1); this.dust(B.x, 8);
      this.spark(B.x, GROUND - B.y - 40, true,undefined,{power:3,facing:A.facing});
    }
    if (th.t >= s.end) {
      A.thr = null; this.setState(A, 'idle'); A.pose = Object.assign({}, A.c.stance);
      B.x = clamp(B.x, LEFT, RIGHT); B.y = 0;
      if (B.hp <= 0) { this.knockDown(B); this.onKO(A, B); return; }
      if (s.land === 'push') { B.rot = 0; B.state = 'hit'; B.st = 0; B.hitstun = 16; B.vx = 7 * A.facing; }
      else this.knockDown(B);
    }
  }
  knockDown(B) { B.state = 'down'; B.st = 0; B.lying = true; B.rot = -90; B.y = 0; B.vy = 0; B.invul = 50; this.dust(B.x, 8); }

  // ---------- супер удар ----------
  startSuper(A, B) {
    A.state = 'super'; A.st = 0; A.move = null; A.vx = 0; A.sup = { t: 0, i: 0 };
    B.state = 'locked'; B.st = 0; B.vx = 0; B.y = 0; B.rot = 0;
    this.dim = 200; this.shake = 8;
  }
  updateSuper(A) {
    const B = this.opp(A), su = A.sup; su.t++;
    const i = Math.floor((su.t - 1) / 11), k = ((su.t - 1) % 11) / 10;
    if (i >= SUPER_SEQ.length) { this.setState(A, 'idle'); A.sup = null; this.dim = 0; return; }
    const [ch, ex, limb] = SUPER_SEQ[i];
    const pc = A.resolve(ch), pe = A.resolve(ex), o = {};
    for (const key of PARAMS) o[key] = k < 0.55 ? lerp(A.c.stance[key] || 0, pc[key] || 0, k / 0.55) : lerp(pc[key] || 0, pe[key] || 0, (k - 0.55) / 0.45);
    A.pose = o;
    B.x = A.x + A.facing * (66 + i * 2); B.pose = fullPose(B.c.stance, i % 2 ? 'hit_hi' : 'hit_lo');
    if ((su.t - 1) % 11 === 8) {
      const last = i === SUPER_SEQ.length - 1;
      this.damage(A, B, last ? 90 : 36, true); B.comboHits++; this.recordCombo(B); this.hitstop = last ? 14 : 5; this.shake = last ? 18 : 7; Snd.hit(last ? 1 : 0.5);
      const sk = skeleton(A.c, A.pose), hp = fighterHip(A, sk), pt = toWorld(A, hp, limbPoint(A.c, sk, A.pose, limb));
      this.spark(pt[0], pt[1], true, A.c.sup.color,{power:last?4:3,facing:A.facing}); B.flash = 3;
      if (last) {
        A.sup = null; this.dim = 0;
        B.state = 'air'; B.st = 0; B.vy = 13; B.vx = 7 * A.facing; B.y = 1; B.juggle = 9;
        if (B.hp <= 0) this.onKO(A, B);
        this.setState(A, 'idle');
      }
    }
  }

  damage(A, B, d, raw) {
    const mul = raw ? 1 : A.c.power * B.c.def;
    const dmg = Math.round(d * mul * (A.equipment?.power||1) * (B.equipment?.guard||1));
    B.hp = Math.max(0, B.hp - dmg); B.comboDmg += dmg;
    if (this.mode === 'training' && A.side === 0) this.trainingStats.totalDamage += dmg;
    A.meter = Math.min(1000, A.meter + dmg * 0.7 * (A.equipment?.focus||1)); B.meter = Math.min(1000, B.meter + dmg * 0.4 * (B.equipment?.focus||1));
    if (this.mode === 'training' && B.hp < 1) B.hp = 1;
    return dmg;
  }

  // ---------- физика ----------
  physics() {
    const [a, b] = this.p;
    for (const f of this.p) {
      f.prevY = f.y;
      if (f.state === 'thrown' || f.state === 'locked' || f.script) continue;
      const airborne = f.y > 0 || f.vy > 0;
      if (airborne) {
        f.vy -= GRAV; f.y += f.vy;
        if (f.state === 'air') { f.rot = lerp(f.rot, -70, 0.08); }
        if (f.y <= 0) {
          f.y = 0; f.vy = 0;
          if (f.state === 'air') { if (f.hp <= 0 || f.juggle > 0 || true) { this.knockDown(f); Snd.thud(); CombatFX.ground(this,f.x); } }
          else if (f.state === 'jump') { this.setState(f, 'land'); f.vx = 0; this.dust(f.x, 3); }
        }
      }
      f.x += f.vx;
      if (f.y === 0 && (f.state === 'idle' || f.state === 'crouch' || f.state === 'block' || f.state === 'cblock')) f.vx = 0;
      if (f.state === 'air' || f.state === 'down') f.vx *= f.y > 0 ? 0.99 : 0.85;
      f.x = clamp(f.x, LEFT, RIGHT);
    }
    // разделяне
    if (a.state !== 'thrown' && b.state !== 'thrown' && a.vis && b.vis && !a.script && !b.script) {
      const min = 30 * a.c.w + 30 * b.c.w - 8, dx = b.x - a.x;
      if (Math.abs(dx) < min && Math.abs(a.y - b.y) < 90 && !(a.lying || b.lying)) {
        const push = (min - Math.abs(dx)) / 2, s = dx === 0 ? (a.facing) : Math.sign(dx);
        a.x -= push * s; b.x += push * s;
        if (a.x < LEFT) { b.x += LEFT - a.x; a.x = LEFT; } if (a.x > RIGHT) { b.x -= a.x - RIGHT; a.x = RIGHT; }
        if (b.x < LEFT) { a.x += LEFT - b.x; b.x = LEFT; } if (b.x > RIGHT) { a.x -= b.x - RIGHT; b.x = RIGHT; }
      }
    }
  }

  hurtRect(f) {
    if (f.lying || f.state === 'down' || f.state === 'getup') return null;
    if (f.state === 'air' || f.state === 'thrown') return { x1: f.x - 30, x2: f.x + 30, y1: GROUND - f.y - 100, y2: GROUND - f.y };
    const sk = skeleton(f.c, f.pose), hip = fighterHip(f, sk);
    const pts = [sk.head, sk.neck, [0, 0], sk.fk, sk.bk].map(p => toWorld(f, hip, p));
    let x1 = Math.min(...pts.map(p => p[0])) - 14 * f.c.w, x2 = Math.max(...pts.map(p => p[0])) + 14 * f.c.w;
    return { x1, x2, y1: Math.min(...pts.map(p => p[1])) - sk.L.HR, y2: GROUND - f.y };
  }

  checkHits(A) {
    if (A.state !== 'move' || !A.mc) return;
    const B = this.opp(A);
    const seg = A.mc.segs.find(s => A.mt > s.s && A.mt <= s.e);
    if (!seg || !seg.hit || A.hitIds.has(seg.hid)) return;
    if (B.invul > 0 || B.state === 'thrown' || B.state === 'locked' || B.script) return;
    const h = seg.hit;
    const sk = skeleton(A.c, A.pose), hip = fighterHip(A, sk), pt = toWorld(A, hip, limbPoint(A.c, sk, A.pose, h.limb));
    const r = this.hurtRect(B); if (!r) return;
    const cx = clamp(pt[0], r.x1, r.x2), cy = clamp(pt[1], r.y1, r.y2);
    const reach=h.r+(['fh','bh','fe','prop'].includes(h.limb)?(A.equipment?.reach||0):0);
    if ((pt[0] - cx) ** 2 + (pt[1] - cy) ** 2 > reach * reach) return;
    if (h.l === 'h' && B.crouching && B.y === 0) return; // високите удари минават над клекнал
    A.hitIds.add(seg.hid);
    this.resolveHit(A, B, h, pt[0], pt[1], false);
  }

  resolveHit(A, B, h, px, py, isProj) {
    if (this.phase === 'finishPrompt') { this.knockDown(B); B.invul = 999; Snd.hit(1); this.spark(px, py, true); this.phase = 'roundOver'; this.pt = 60; A.state = A.state === 'move' ? A.state : 'win'; A.winPose = 'cheer'; this.announce((A.c.name + localize(" WINS")).toUpperCase(), 100, '#ffd23d', 50, this.flawless ? localize("FLAWLESS") : null); return; }
    // контра (Nadine)
    if (B.state === 'move' && B.move && B.move.special && B.move.special.type === 'counter' && !isProj) {
      const seg = B.mc.segs.find(s => B.mt > s.s && B.mt <= s.e);
      if (seg && seg.ev === 'counter') { this.popText(B.x, GROUND - 180, localize("COUNTER!"), '#60a5fa', 26); Snd.ok(); B.facing = A.x > B.x ? 1 : -1; this.startThrow(B, A, THROWS[B.move.special.throw], B.move.special.d); return; }
    }
    const blocking = (B.state === 'block' || B.state === 'cblock' || B.state === 'blockstun') && B.y === 0;
    const crouchB = B.state === 'cblock' || (B.state === 'blockstun' && B.wasCrouch);
    const canBlock = blocking && (h.l === 'm' || h.l === 'h' || (h.l === 'l' && crouchB) || (h.l === 'o' && !crouchB));
    if (canBlock) {
      A.connected = false;
      const perfect = B.state !== 'blockstun' && this.simFrame - B.guardStart <= 4;
      const chip = !perfect && h.special ? Math.round(h.d * 0.15) : 0; if (chip) B.hp = Math.max(1, B.hp - chip);
      B.wasCrouch = crouchB; B.state = 'blockstun'; B.st = 0; B.hitstun = perfect ? 3 : Math.max(6, Math.round((h.st || 18) * 0.6)); B.vx = perfect ? 0 : A.facing * (h.kb * 0.8 + 2.5);
      if (B.x <= LEFT + 2 || B.x >= RIGHT - 2) A.vx = -A.facing * 3;
      this.hitstop = 4; Snd.block(); this.spark(px, py, false, '#8fd3ff'); B.meter = Math.min(1000, B.meter + 12);
      if (perfect) {
        B.meter = Math.min(1000, B.meter + 48); this.popText(B.x, GROUND - 190, localize("PERFECT GUARD"), '#93eeff', 22, 50);
        if (this.mode === 'training' && B.side === 0) this.trainingStats.perfectGuards++;
      }
      if (h.superStart) { /* блокиран супер */ }
      return;
    }
    A.connected = true;
    // броня
    if (B.state === 'move' && B.move && B.move.armor && B.mt >= B.move.armor[0] && B.mt <= B.move.armor[1] && B.armorHits < 1) {
      B.armorHits++; this.damage(A, B, h.d * 0.5); B.flash = 6; this.hitstop = 6; Snd.block(); this.spark(px, py, false, '#ffffff'); this.popText(B.x, GROUND - 180, localize("ARMOR"), '#fff', 18); return;
    }
    if (h.superStart) { this.damage(A, B, h.d); B.comboHits++; this.recordCombo(B); this.startSuper(A, B); Snd.hit(1); this.spark(px, py, true, A.c.sup.color); return; }
    const counterHit = B.state === 'move' && B.mt < 10 && B.move && !B.move.air;
    const scale = Math.max(0.35, 1 - B.comboHits * 0.1);
    const dmg = this.damage(A, B, h.d * scale * (counterHit ? 1.2 : 1));
    if (counterHit) this.popText(B.x, GROUND - 190, localize("COUNTER"), '#ff5a5a', 20);
    B.comboHits++; B.move = null; B.lying = false;
    this.recordCombo(B);
    if (B.comboHits >= 2) this.popText(A.side ? 820 : 140, 170, B.comboHits + localize(" HITS"), '#ffd23d', 30 + Math.min(20, B.comboHits * 2), 50);
    if (h.steal) { const s = Math.min(B.meter, 70); B.meter -= s; A.meter = Math.min(1000, A.meter + s); }
    const big = h.d >= 60;
    this.hitstop = h.special ? 11 : big ? 10 : 4; B.flash = big ? 3 : 2;
    Snd.hit(big ? 1 : 0.3); this.spark(px, py, big,undefined,{power:B.hp<=0?4:h.special?3:big?2:1,facing:A.facing});
    if (B.hp <= 0) { B.state = 'air'; B.st = 0; B.vy = 10; B.vx = 6 * A.facing; B.y = Math.max(B.y, 1); this.onKO(A, B); return; }
    if (h.pull) { B.x = clamp(A.x + A.facing * 72, LEFT, RIGHT); B.state = 'hit'; B.st = 0; B.hitstun = h.st; B.vx = 0; B.rot = 0; return; }
    if (h.stun && !B.stunUsed && B.y === 0) { B.stunUsed = true; B.state = 'dizzy'; B.st = 0; B.hitstun = h.stun; B.vx = 0; this.popText(B.x, GROUND - 190, localize("STUNNED"), '#facc15', 20); return; }
    if (h.launch || h.kd || B.y > 0 || B.state === 'air') {
      B.state = 'air'; B.st = 0; B.juggle++;
      B.vy = B.juggle >= 4 ? -3 : (h.launch || (B.y > 0 ? 6 : 7)); B.vx = A.facing * (h.kb * 0.5 + 1.5); B.y = Math.max(B.y, 1);
      if (B.juggle >= 4) { B.invul = 60; this.popText(B.x, GROUND - B.y - 140, localize("AIR RECOVERY"), '#b9d9ff', 17, 36); }
    } else {
      B.state = 'hit'; B.st = 0; B.hitstun = h.st || 16; B.vx = A.facing * h.kb; B.hitLow = h.l === 'l' || h.l === 'm' && Math.random() < 0.4; B.rot = 0;
      if (B.x <= LEFT + 2 || B.x >= RIGHT - 2) A.vx = -A.facing * h.kb * 0.8;
    }
  }

  // ---------- снаряди ----------
  spawnProj(f, sp) {
    const sk = skeleton(f.c, f.pose), hip = fighterHip(f, sk), hand = toWorld(f, hip, sk.bh);
    Snd[sp.sprite === 'wave' ? 'horn' : sp.sprite === 'cloud' ? 'spray' : 'whoosh']();
    this.proj.push({ owner: f, x: hand[0], y: GROUND - hand[1], vx: sp.spd * f.facing, life: sp.life || 140, sprite: sp.sprite, r: sp.sprite === 'cloud' ? 26 : 18, t: 0,
      hit: HT(sp.d, 'm', sp.st, 4, '', { stun: sp.stun, pull: sp.pull, kd: sp.kd, launch: sp.kd ? 6 : 0, special: 1 }), sx: hand[0], sy: hand[1] });
  }
  updateProj() {
    for (const p of this.proj) {
      if (p.dead) continue;
      p.t++; p.x += p.vx; p.life--;
      if (p.sprite === 'cloud') p.vx *= 0.97;
      if (p.life <= 0 || p.x < -40 || p.x > W + 40) { p.dead = true; continue; }
      const B = this.opp(p.owner);
      for (const q of this.proj) if (q !== p && !q.dead && q.owner !== p.owner && Math.abs(q.x - p.x) < 30 && Math.abs(q.y - p.y) < 40) { p.dead = q.dead = true; this.spark(p.x, GROUND - p.y, true, '#fff'); Snd.block(); }
      if (p.dead) continue;
      if (B.invul > 0 || B.state === 'thrown' || B.state === 'locked' || B.script) continue;
      const r = this.hurtRect(B); if (!r) continue;
      const py = GROUND - p.y, cx = clamp(p.x, r.x1, r.x2), cy = clamp(py, r.y1, r.y2);
      if ((p.x - cx) ** 2 + (py - cy) ** 2 < p.r * p.r) {
        p.dead = true; p.owner.connected = true;
        if (p.hit.pull) { p.owner.state = 'idle'; p.owner.move = null; }
        this.resolveHit(p.owner, B, p.hit, p.x, py, true);
      }
    }
    this.proj = this.proj.filter(p => !p.dead);
  }

  // ---------- анимация (поза според състояние) ----------
  animate(f) {
    let target, k = 0.35;
    const st = f.c.stance, T = this.T;
    if (f.script) return;
    switch (f.state) {
      case 'idle': case 'land': target = Object.assign({}, st); target.hy = Math.sin(T * 0.09 + f.side) * 2.2; target.fu += Math.sin(T * 0.09) * 3; target.bu += Math.sin(T * 0.09 + 1) * 3; if (f.c.style === 'ginga') { target.lean += Math.sin(T * 0.06) * 8; target.ft += Math.sin(T * 0.06) * 14; target.bt += Math.sin(T * 0.06) * 14; } break;
      case 'walk': case 'intro': { f.walkPh += 0.16 * (f.c.walk / 2.5); const s = Math.sin(f.walkPh); target = Object.assign({}, st); target.ft += s * 20; target.bt -= s * 20; target.fs += Math.min(0, s) * 26 + 4; target.bs += Math.min(0, -s) * 26; target.hy = -Math.abs(Math.cos(f.walkPh)) * 3; break; }
      case 'crouch': target = fullPose(st, 'crouch'); break;
      case 'block': case 'blockstun': target = fullPose(st, f.state === 'blockstun' && f.wasCrouch ? 'cblock' : 'block'); break;
      case 'cblock': target = fullPose(st, 'cblock'); break;
      case 'prejump': target = fullPose(st, 'crouch'); k = 0.6; break;
      case 'jump': target = fullPose(st, 'jump'); if (f.vy < -2) { target.ft = 30; target.fs = 10; target.bt = -10; target.bs = -20; } break;
      case 'move': f.pose = this.movePose(f); return;
      case 'hit': target = fullPose(st, f.hitLow ? 'hit_lo' : 'hit_hi'); k = 0.6; break;
      case 'air': target = fullPose(st, 'air_hit'); k = 0.4; break;
      case 'down': target = fullPose(st, 'lie'); k = 0.3; break;
      case 'getup': target = fullPose(st, 'crouch'); f.rot = lerp(f.rot, 0, 0.25); f.lying = f.st < 6; break;
      case 'dizzy': target = fullPose(st, 'dizzy'); target.lean += Math.sin(T * 0.12) * 10; target.head += Math.sin(T * 0.12) * 10; break;
      case 'win': target = fullPose(st, f.winPose || 'cheer'); target.hy = Math.sin(T * 0.15) * 2; break;
      case 'locked': return;
      case 'throwing': case 'thrown': case 'super': return;
      default: target = Object.assign({}, st);
    }
    const o = {}; for (const key of PARAMS) o[key] = lerp(f.pose[key] || 0, target[key] || 0, k);
    f.pose = o;
  }

  // ---------- край на рунд / финал ----------
  onKO(A, B) {
    if (this.phase !== 'play') return;
    this.phase = 'ko'; this.pt = 0; this.winner = A; this.loser = B; this.slow = 60; this.proj = [];
    this.announce('K.O.', 80, '#ff3b3b', 110); Snd.say('K O'); Snd.thud();
    if (A.state === 'move' && A.move && A.move.air) {} // приземява се нормално
  }
  timeOver() {
    const [a, b] = this.p;
    this.announce(localize("TIME UP"), 70, '#fff', 54);
    if (a.hp === b.hp) { this.phase = 'roundOver'; this.pt = 0; a.state = b.state = 'idle'; return; }
    const A = a.hp > b.hp ? a : b, B = A === a ? b : a;
    this.winner = A; this.loser = B; this.phase = 'ko'; this.pt = 0; B.state = 'air'; B.vy = 4; B.y = 1; B.vx = 0;
  }
  afterKO() {
    const A = this.winner, B = this.loser;
    A.wins++;
    this.flawless = A.hp >= 1000;
    if (A.wins >= 2) {
      // финал: загубилият се изправя замаян
      this.phase = 'finishPrompt'; this.pt = 0;
      B.state = 'dizzy'; B.lying = false; B.rot = 0; B.y = 0; B.vx = 0; B.invul = 0; B.hp = Math.max(B.hp, 0);
      if (A.state !== 'move') A.state = 'idle';
      this.announce(B.c.sex === 'f' ? localize("FINISH HER!") : localize("FINISH HIM!"), 110, '#ff3b3b', 64);
      Snd.say(B.c.sex === 'f' ? localize("Finish her!") : localize("Finish him!"));
      this.finHintShown = true;
    } else {
      this.phase = 'roundOver'; this.pt = 0; A.state = 'win'; A.winPose = pick(['cheer', 'flex', 'point']);
      this.announce((A.c.name + localize(" WINS")).toUpperCase(), 100, '#ffd23d', 50, this.flawless ? localize("FLAWLESS") : null);
    }
  }
  finishPromptUpdate() {
    const A = this.winner, B = this.loser;
    if (B.state !== 'down') B.state = 'dizzy';
    // CPU извършва финала сам
    if (A.ctrl.type !== 'human') { if (this.pt > 70 && Math.abs(A.x - B.x) < 200 && this.cpuFinish !== false) { if (this.cpuFinish == null) this.cpuFinish = Math.random() < 0.8; if (this.cpuFinish) return this.startFinisher(); } }
    if (A.input.fin) { if (Math.abs(A.x - B.x) < 220) return this.startFinisher(); this.popText(A.x, GROUND - 190, localize("GET CLOSER!"), '#fff', 20, 30); }
    // всеки удар събаря
    if (B.state === 'air' || B.hp <= -1) { }
    if (this.pt > 330) { this.knockDown(B); this.phase = 'roundOver'; this.pt = 60; A.state = 'win'; A.winPose = 'cheer'; this.announce((A.c.name + localize(" WINS")).toUpperCase(), 100, '#ffd23d', 50, this.flawless ? localize("FLAWLESS") : null); }
  }
  checkFinisherCode(f, btn) {
    const code = f.c.code, h = f.dirHist.filter(e => this.T - e.t < 70).map(e => e.d);
    const need = code.slice(0, 3).join('');
    const ok = btn === code[3] && h.slice(-3).join('') === need;
    if (!ok) return false;
    if (Math.abs(f.x - this.loser.x) > 220) { this.popText(f.x, GROUND - 190, localize("GET CLOSER!"), '#fff', 20, 30); return true; }
    this.startFinisher(); return true;
  }
  startFinisher() {
    const A = this.winner, B = this.loser, def = FINISHERS[A.c.fin];
    this.phase = 'finisher'; this.pt = 0; this.proj = [];
    for (const f of this.p) { f.script = true; f.move = null; f.vx = f.vy = 0; f.y = 0; f.rot = 0; f.lying = false; f.vis = true; }
    A.facing = B.x > A.x ? 1 : -1; B.facing = -A.facing;
    // разстояние
    const mid = clamp((A.x + B.x) / 2, 260, 700);
    A.x = mid - A.facing * 55; B.x = mid + A.facing * 55;
    A.pose = Object.assign({}, A.c.stance); B.pose = fullPose(B.c.stance, 'dizzy');
    this.finisher = { def, t: 0, S: {} };
    this.dim = 1;
    this.banner = null;
    Snd.zap();
  }
  matchDone() { return this.p.some(f => f.wins >= 2); }
  endMatch() {
    this.phase = 'matchOver';
    const w = this.winner || this.p.find(f => f.wins >= 2) || this.p[0];
    this.result = { winner: w, loser: this.opp(w), finisher: this.finisher ? this.finisher.def.name || w.c.finName : null, flawless: this.flawless };
  }

  // ---------- рисуване ----------
  draw(ctx) {
    ctx.save();
    const camera=CombatFX.camera(this);
    if(!this.paused)this.cameraZoom = lerp(this.cameraZoom || 1.08, camera.zoom, .2);
    if(!this.cameraZoom)this.cameraZoom=1.08;
    ctx.translate(W / 2, H * .7);ctx.rotate(camera.roll);ctx.scale(this.cameraZoom,this.cameraZoom);ctx.translate(-W / 2,-H * .7);
    ctx.translate(camera.dx,camera.dy);
    drawArenaBack(ctx, this.arena, this.T);
    const finisher = this.phase === 'finisher' ? this.finisher : null;
    if (this.dim > 0 || finisher) {
      ctx.fillStyle = finisher ? 'rgba(10,0,0,0.55)' : 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
      if (!finisher && this.dim > 0) this.dim--;
    }
    if (finisher && finisher.def.back) finisher.def.back(ctx, finisher.t, finisher.S, this.winner, this.loser, this);
    for (const f of this.p) drawShadow(ctx, f);
    // загубилият отзад при финал; иначе атакуващият отпред
    const order = finisher ? [this.loser, this.winner] : [...this.p].sort((x, y) => (x.state === 'move' || x.state === 'throwing' || x.state === 'super' ? 1 : 0) - (y.state === 'move' || y.state === 'throwing' || y.state === 'super' ? 1 : 0));
    for (const f of order) drawFighter(ctx, f);
    this.drawMotionTrails(ctx);
    if (finisher && finisher.def.front) finisher.def.front(ctx, finisher.t, finisher.S, this.winner, this.loser, this);
    for (const f of this.p) if (f.state === 'dizzy') this.drawStars(ctx, f);
    this.drawProj(ctx);
    this.drawFx(ctx);
    drawArenaFront(ctx, this.arena, this.T);
    ctx.restore();
    CombatFX.overlay(ctx,this);
    this.drawHUD(ctx);
  }
  drawStars(ctx, f) {
    const sk = skeleton(f.c, f.pose), hip = fighterHip(f, sk), h = toWorld(f, hip, sk.head);
    for (let i = 0; i < 3; i++) { const a = this.T * 0.12 + i * 2.1; star(ctx, h[0] + Math.cos(a) * 20, h[1] - 22 + Math.sin(a) * 6, 6, '#facc15'); }
  }
  drawMotionTrails(ctx) {
    for (const f of this.p) {
      const sk = skeleton(f.c, f.pose), hip = fighterHip(f, sk);
      const points = [sk.fh, sk.bh, sk.ffo, sk.bfo].map(p => toWorld(f, hip, p));
      if (f.motionTrail && !this.paused && f.state === 'move') {
        points.forEach((p, i) => {
          const previous = f.motionTrail[i];
          if (Math.hypot(p[0] - previous[0], p[1] - previous[1]) < 5) return;
          const gradient = ctx.createLinearGradient(previous[0], previous[1], p[0], p[1]);
          gradient.addColorStop(0, 'rgba(100,190,255,0)');
          gradient.addColorStop(1, f.side ? 'rgba(255,160,70,.55)' : 'rgba(90,210,255,.55)');
          ctx.save(); ctx.strokeStyle = gradient; ctx.lineWidth = i < 2 ? 7 : 10; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(...previous); ctx.lineTo(...p); ctx.stroke(); ctx.restore();
        });
      }
      const active=f.state==='move'&&f.mc?.segs.find(s=>f.mt>s.s&&f.mt<=s.e&&s.hit);
      if(active&&active.hit.d>=60&&CombatFX.full&&!CombatFX.reduced){
        const tip=toWorld(f,hip,limbPoint(f.c,sk,f.pose,active.hit.limb)),dir=f.facing;
        ctx.save();ctx.globalCompositeOperation='screen';ctx.strokeStyle=f.side?'rgba(255,192,110,.8)':'rgba(140,235,255,.8)';ctx.lineWidth=4;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(tip[0]-dir*62,tip[1]+18);ctx.quadraticCurveTo(tip[0]-dir*28,tip[1]-36,tip[0]+dir*8,tip[1]);ctx.stroke();ctx.restore();
      }
      f.motionTrail = points;
    }
  }
  drawProj(ctx) {
    for (const p of this.proj) {
      const y = GROUND - p.y, d = Math.sign(p.vx) || 1;
      ctx.save(); ctx.translate(p.x, y);
      switch (p.sprite) {
        case 'cash': ctx.rotate(p.t * 0.3); rr(ctx, -14, -8, 28, 16, 2, '#4ade80'); ctx.fillStyle = '#f5f5f4'; ctx.fillRect(-3, -8, 6, 16); break;
        case 'flare': ctx.rotate(p.t * 0.25); seg(ctx, [-10, 0], [10, 0], 5, '#dc2626'); ctx.restore(); ctx.save(); for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.5; dot(ctx, [p.x - d * i * 10 + rand(-3, 3), y + rand(-4, 4)], 6 + i * 2, i ? '#fca5a5' : '#fde047', false); } break;
        case 'hubcap': ctx.scale(1, 0.55); ctx.rotate(p.t * 0.5); dot(ctx, [0, 0], 16, '#d1d5db'); dot(ctx, [0, 0], 6, '#6b7280'); for (let i = 0; i < 5; i++) { const a = i * 1.256; seg2(ctx, [Math.cos(a) * 6, Math.sin(a) * 6], [Math.cos(a) * 14, Math.sin(a) * 14], 2, '#6b7280'); } break;
        case 'beam': { ctx.restore(); ctx.save(); const g = ctx.createLinearGradient(p.sx, 0, p.x, 0); g.addColorStop(0, 'rgba(255,250,200,0.9)'); g.addColorStop(1, 'rgba(255,250,200,0.1)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(p.x, p.sy - 34); ctx.lineTo(p.x, p.sy + 34); ctx.fill(); break; }
        case 'cloud': for (let i = 0; i < 6; i++) { ctx.globalAlpha = 0.55; dot(ctx, [Math.cos(i * 1.1 + p.t * 0.1) * (8 + p.t * 0.3), Math.sin(i * 1.7) * (6 + p.t * 0.2)], 10 + p.t * 0.25, PAINT[i % 6], false); } break;
        case 'sausage': { ctx.restore(); ctx.save(); const n = Math.max(2, Math.floor(Math.abs(p.x - p.sx) / 14)); for (let i = 0; i <= n; i++) { const t = i / n; dot(ctx, [lerp(p.sx, p.x, t), lerp(p.sy, y, t) + Math.sin(t * 9 + p.t) * 3], 6, '#c2715a'); } break; }
        case 'wave': ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { ctx.globalAlpha = 1 - i * 0.3; ctx.beginPath(); ctx.arc(-d * i * 12, 0, 16 + i * 6, -0.9, 0.9); if (d < 0) { ctx.beginPath(); ctx.arc(-d * i * 12, 0, 16 + i * 6, Math.PI - 0.9, Math.PI + 0.9); } ctx.stroke(); } break;
        case 'sauce': dot(ctx, [0, 0], 10, '#dc2626'); dot(ctx, [-d * 10, 3], 6, '#ef4444'); dot(ctx, [-d * 18, 5], 4, '#f87171'); break;
        case 'shock': for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.7 - i * 0.15; dot(ctx, [-d * i * 14, -4 - i * 2], 16 - i * 3, '#a8a29e', false); } ctx.globalAlpha = 1; seg2(ctx, [-20, 6], [20, 6], 3, '#57534e'); break;
      }
      ctx.restore();
    }
  }
  drawFx(ctx) {
    for (const f of this.fx) {
      const a = f.life / f.max;
      if(CombatFX.drawParticle(ctx,f))continue;
      if (f.k === 'spk') { ctx.globalAlpha = a; seg2(ctx, [f.x, f.y], [f.x - f.vx * 2, f.y - f.vy * 2], 3, f.col); }
      else if (f.k === 'star') { ctx.globalAlpha = a; star(ctx, f.x, f.y, f.r * (1.3 - a * 0.3), f.col, 8); }
      else if (f.k === 'puff') { ctx.globalAlpha = a * 0.6; dot(ctx, [f.x, f.y], f.r, f.col, false); }
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) { ctx.globalAlpha = Math.min(1, t.life / 15); outlineText(ctx, t.t, t.x, t.y, t.size, t.col); }
    ctx.globalAlpha = 1;
  }
  drawHUD(ctx) {
    const [a, b] = this.p;
    const bar = (f, x, flip) => {
      const w = 380, h = 20, y = 28;
      ctx.fillStyle = 'rgba(8,13,24,.94)'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
      ctx.fillStyle = '#512735'; ctx.fillRect(x, y, w, h);
      f.hpShow = f.hpShow == null ? f.hp : this.paused ? f.hpShow : lerp(f.hpShow, f.hp, 0.075);
      const ww = w * f.hpShow / 1000, wv = w * f.hp / 1000;
      ctx.fillStyle = '#ec6773'; ctx.fillRect(flip ? x + w - ww : x, y, ww, h);
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, flip ? '#ffd69c' : '#adf4ff'); g.addColorStop(1, flip ? '#d88346' : '#42a5c9');
      ctx.fillStyle = f.hp < 250 ? '#f26765' : g; ctx.fillRect(flip ? x + w - wv : x, y, wv, h);
      ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(flip?x+w-wv:x,y,wv,2);
      ctx.font = '18px ' + FONT_D; ctx.textBaseline = 'middle'; ctx.textAlign = flip ? 'right' : 'left';
      outlineText(ctx, f.c.full.toUpperCase(), flip ? x + w : x, y + h + 16, 14, '#f4f5fa', flip ? 'right' : 'left', 3, w);
      // победи
      for (let i = 0; i < 2; i++) {
        ctx.fillStyle=i<f.wins?'#ffd285':'#354052';ctx.beginPath();
        const rx=flip?x+w-5-i*17:x+5+i*17,ry=y+h+34;
        ctx.moveTo(rx,ry-5);ctx.lineTo(rx+5,ry);ctx.lineTo(rx,ry+5);ctx.lineTo(rx-5,ry);ctx.closePath();ctx.fill();
      }
      // енергия
      const my = H - 30, mw = 200, mx = flip ? W - 24 - mw : 24;
      ctx.fillStyle = 'rgba(8,13,24,.94)'; ctx.fillRect(mx - 2, my - 2, mw + 4, 14);
      ctx.fillStyle = f.meter >= 1000 ? '#83ecfa' : '#5489d4'; ctx.fillRect(flip ? mx + mw - mw * f.meter / 1000 : mx, my, mw * f.meter / 1000, 10);
      for(let i=1;i<4;i++){ctx.fillStyle='#101b2c';ctx.fillRect(mx+i*mw/4-1,my,2,10);}
      outlineText(ctx, f.meter >= 1000 ? localize("SUPER READY  ↓ + SPECIAL") : localize("ENERGY"), flip ? mx + mw : mx, my - 12, 12, f.meter >= 1000 ? '#83ecfa' : '#cbd5e1', flip ? 'right' : 'left', 3, mw+30);
    };
    bar(a, 24, false); bar(b, W - 24 - 380, true);
    // таймер
    ctx.fillStyle = '#0b0b0f'; ctx.fillRect(W / 2 - 34, 18, 68, 46);
    outlineText(ctx, this.mode === 'training' ? '∞' : String(this.timer), W / 2, 42, 34, this.timer <= 10 ? '#ff5a3d' : '#fff');
    if(this.mode==='training'){
      const current=b.comboHits?{hits:b.comboHits,damage:b.comboDmg}:this.trainingStats.lastCombo,best=this.trainingStats.bestCombo;
      ctx.fillStyle='rgba(8,13,24,.8)';ctx.fillRect(W/2-200,87,400,28);
      outlineText(ctx,localize("COMBO")+' '+current.hits+'  ·  '+current.damage+' '+localize("DAMAGE")+'     '+localize("BEST")+' '+best.hits+' / '+best.damage,W/2,101,12,'#d6e9f4','center',2,382);
    }
    // банер
    if (this.banner) {
      const bn = this.banner, k = 1 - bn.life / bn.max, sc = k < 0.15 ? 1.6 - k * 4 : 1;
      ctx.save(); ctx.translate(W / 2, 220); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, bn.life / 12);
      outlineText(ctx, bn.t, 0, 0, bn.size, bn.col, 'center', 8);
      if (bn.sub) outlineText(ctx, bn.sub, 0, bn.size * 0.85, 30, '#fff', 'center', 6);
      ctx.restore();
    }
    if (this.phase === 'finishPrompt' && this.winner.ctrl.type === 'human') {
      const c = this.winner.c, arrows = { D: '↓', F: '→', B: '←', U: '↑' }, btn = { lp: localize("PUNCH"), hp: localize("HEAVY PUNCH"), lk: localize("KICK"), hk: localize("HEAVY KICK") };
      const txt = localize("FINISHER “") + c.finName + '“:  ' + c.code.slice(0, 3).map(d => arrows[d]).join(' ') + ' + ' + btn[c.code[3]];
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(W / 2 - 300, 300, 600, 34);
      outlineText(ctx, txt, W / 2, 317, 18, '#ffd23d');
      const tleft = Math.max(0, Math.ceil((330 - this.pt) / 60));
      outlineText(ctx, String(tleft), W / 2, 356, 22, '#fff');
    }
    if (this.phase === 'finisher' && this.finisher.t > this.finisher.def.dur - 110) {
      const k = clamp((this.finisher.t - (this.finisher.def.dur - 110)) / 20, 0, 1);
      ctx.save(); ctx.globalAlpha = k; outlineText(ctx, localize("FINISHER"), W / 2, 140, 70, '#ff3b3b', 'center', 8); outlineText(ctx, '„' + this.winner.c.finName + '“', W / 2, 196, 34, '#fff', 'center', 6); ctx.restore();
    }
  }
}

function outlineText(ctx, t, x, y, size, col, align = 'center', lw = 5, maxWidth) {
  ctx.font = size + 'px ' + FONT_D; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = '#0b0b0f';
  if(maxWidth){ctx.strokeText(t,x,y,maxWidth);ctx.fillStyle=col;ctx.fillText(t,x,y,maxWidth);}
  else {ctx.strokeText(t, x, y);ctx.fillStyle = col; ctx.fillText(t, x, y);}
}
function star(ctx, x, y, r, col, n = 5) {
  ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n - Math.PI / 2, rr2 = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#0b0b0f'; ctx.stroke();
}

// ---------- изкуствен интелект ----------
class AI {
  constructor(level) {
    const L = { easy: { react: 22, block: 0.25, agg: 0.35, aa: 0.15, sp: 0.4 }, normal: { react: 12, block: 0.5, agg: 0.6, aa: 0.4, sp: 0.7 }, hard: { react: 6, block: 0.78, agg: 0.85, aa: 0.7, sp: 1 } };
    this.L = L[level] || L.normal; this.reset();
  }
  reset(){this.plan=[];this.cool=30;this.seenMove=null;this.seenSerial=-1;this.seenProjectile=null;this.pendingThreat=null;this.blockFor=0;this.blockLow=false;}
  think(me, op, m) {
    const I = { P: {} }, L = this.L, dx = op.x - me.x, dist = Math.abs(dx);
    const press = (b) => { I.P[b] = true; I[b] = true; };
    const hold = (dir) => { if (dir === 'f') I[me.facing === 1 ? 'r' : 'l'] = true; if (dir === 'b') I[me.facing === 1 ? 'l' : 'r'] = true; if (dir === 'd') I.d = true; if (dir === 'u') I.u = true; };
    if (m.phase === 'finishPrompt') { if (me === m.winner && dist > 150) hold('f'); return I; }
    // блок
    if (this.blockFor > 0) { this.blockFor--; I.bl = true; if (this.blockLow) I.d = true; return I; }
    const projectile = m.proj.find(p => !p.dead && p.owner === op && Math.abs(p.x - me.x) < 200 && Math.sign(me.x - p.x) === Math.sign(p.vx));
    const moveThreat = op.state === 'move' && op.move && dist < 190;
    const newMove = moveThreat && (op.move !== this.seenMove || op.moveSerial !== this.seenSerial);
    if (newMove || (projectile && this.seenProjectile !== projectile)) {
      this.seenMove = op.move; this.seenSerial = op.moveSerial; this.seenProjectile = projectile;
      // Snapshot the observed attack, then wait real simulation frames before
      // defending. Difficulty changes reaction speed, never reads player input.
      if (!this.pendingThreat) this.pendingThreat = {
        at: m.simFrame + L.react,
        move: moveThreat ? op.move : null, serial: op.moveSerial, projectile,
        low: !!(moveThreat && op.move.k?.some(k => k.hit?.l === 'l')),
        defend: Math.random() < L.block
      };
    }
    const notice = this.pendingThreat;
    if (notice && m.simFrame >= notice.at) {
      this.pendingThreat = null;
      const stillThreat = (notice.move && op.state === 'move' && op.move === notice.move && op.moveSerial === notice.serial && dist < 190) || (notice.projectile && !notice.projectile.dead);
      if (stillThreat && me.free && notice.defend) {
        this.blockFor = 12 + (Math.random() * 8 | 0); this.blockLow = notice.low;
        I.bl = true; if (this.blockLow) I.d = true; return I;
      }
    }
    if (this.plan.length) {
      const s = this.plan[0];
      (s.dirs || []).forEach(hold); if (s.btn && !s.done) { press(s.btn); s.done = true; }
      if (--s.n <= 0) this.plan.shift();
      return I;
    }
    if (!me.free && !(me.state === 'move' && me.connected)) return I;
    if (me.state === 'move' && me.connected && Math.random() < L.agg * 0.6) { press(pick(['lp', 'hp', 'hk'])); return I; }
    if (this.cool > 0) { this.cool--; }
    // противоракетна защита
    if (op.y > 30 && op.vx * Math.sign(dx) < 0 && dist < 150 && Math.random() < L.aa * 0.25) { this.plan = [{ dirs: ['d'], btn: 'hp', n: 2 }]; return I; }
    if (op.state === 'down' || op.state === 'getup') { if (dist > 140) hold('f'); return I; }
    const c = me.c, hasProj = s => s.type === 'proj';
    if (dist > 300) {
      if (this.cool <= 0 && Math.random() < 0.03 * L.sp && (hasProj(c.sp1) || hasProj(c.sp2))) { this.plan = [{ dirs: hasProj(c.sp2) && !hasProj(c.sp1) ? ['f'] : [], btn: 'sp', n: 2 }]; this.cool = 50; return I; }
      if (Math.random() < 0.006) { this.plan = [{ dirs: ['u', 'f'], n: 4 }, { n: 14 }, { btn: pick(['hk', 'hp']), n: 2 }]; return I; }
      hold('f'); return I;
    }
    if (dist > 125) {
      if (this.cool <= 0 && Math.random() < 0.02 * L.sp) {
        const opts = [];
        if (['rush', 'tele', 'flip', 'aa'].includes(c.sp1.type) || (c.sp1.type === 'cgrab' && c.sp1.dash)) opts.push({ btn: 'sp', dirs: [] });
        if (['rush', 'tele', 'flip', 'quake'].includes(c.sp2.type) || hasProj(c.sp2)) opts.push({ btn: 'sp', dirs: ['f'] });
        if (hasProj(c.sp1)) opts.push({ btn: 'sp', dirs: [] });
        if (opts.length) { const o = pick(opts); this.plan = [{ dirs: o.dirs, btn: o.btn, n: 2 }]; this.cool = 60; return I; }
      }
      if (Math.random() < 0.01) { this.plan = [{ dirs: ['u', 'f'], n: 4 }, { n: 12 }, { btn: pick(['hk', 'lk', 'hp']), n: 2 }]; return I; }
      if (Math.random() < 0.04) { this.plan = [{ dirs: ['b'], n: 14 }]; return I; }
      hold('f'); return I;
    }
    // близо
    if (this.cool <= 0 && Math.random() < L.agg * 0.13) {
      const r = Math.random();
      if (me.meter >= 1000 && r < 0.3) { this.plan = [{ dirs: ['d'], btn: 'sp', n: 2 }]; this.cool = L.react + 12; return I; }
      const combos = [
        [{ btn: 'lp', n: 8 }, { btn: 'lp', n: 8 }, { btn: 'hp', n: 2 }],
        [{ btn: 'lp', n: 8 }, { btn: 'hk', n: 2 }],
        [{ dirs: ['d'], btn: 'lk', n: 10 }, { dirs: ['d'], btn: 'hk', n: 2 }],
        [{ btn: 'hk', n: 2 }],
        [{ dirs: ['f'], btn: 'hp', n: 2 }],
        [{ dirs: ['d'], btn: 'hp', n: 2 }],
        [{ btn: 'lk', n: 8 }, { btn: 'sp', n: 2 }],
        [{ btn: 'lp', n: 8 }, { dirs: ['f'], btn: 'sp', n: 2 }],
        [{ dirs: [], btn: 'sp', n: 2 }]
      ];
      this.plan = pick(combos).map(s => Object.assign({}, s)); this.cool = L.react + 10;
      return I;
    }
    if (Math.random() < 0.03) { this.plan = [{ dirs: ['b'], n: 10 + (Math.random() * 12 | 0) }]; return I; }
    if (Math.random() < 0.02) { this.plan = [{ dirs: ['d'], n: 16 }]; return I; }
    return I;
  }
}

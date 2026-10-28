'use strict';

// Generated character art uses the existing skeleton for all combat logic.
// Only the visual renderer changes; hit timing, damage and collisions stay shared.
const CharacterArt = (() => {
  const entries = new Map();
  const ready = Promise.all(CHARACTER_ART_DATA.characters.map(data => new Promise(resolve => {
    const image = new Image();
    const entry = { data, image, loaded: false };
    entries.set(data.id, entry);
    image.onload = () => { entry.loaded = true; resolve(); };
    image.onerror = () => { console.warn('Character art unavailable:', data.id); resolve(); };
    image.src = 'assets/characters-hd/' + data.id + '/spritesheet.webp';
  })));
  const poseFrames = {
    block: 1, cblock: 1, crouch: 2, kneel: 2, sit: 2,
    jump: 3, jab: 4, c_jab: 4, palm: 4, jpunch: 4,
    cross: 5, hook: 5, hay: 5, upper: 5, c_up: 5, elbow: 5,
    ovh: 5, hb: 5, shoulder: 5, lariat: 5, superman: 5,
    spray: 4, throwx: 4, grab: 1, lift: 9, slam: 5,
    lowkick: 6, stomp: 6, c_lk: 6, sweep: 6,
    teep: 6, knee: 6, rh: 7, hk: 7, jkick: 7, jhk: 7, swing: 7,
    hit_hi: 8, hit_lo: 8, air_hit: 8, dizzy: 8, lie: 8,
    cheer: 9, flex: 9, point: 9, taunt: 0
  };
  function nearestPose(f) {
    let best = 0, distance = Infinity;
    for (const [key, frame] of Object.entries(poseFrames)) {
      const target = fullPose(f.c.stance, key);
      let d = 0;
      for (const k of ['lean', 'fu', 'ff', 'bu', 'bf', 'ft', 'fs', 'bt', 'bs']) {
        const delta = (f.pose[k] || 0) - target[k]; d += delta * delta;
      }
      if (d < distance) { distance = d; best = frame; }
    }
    return best;
  }
  function frameFor(f) {
    if (f.script || ['throwing', 'super', 'locked'].includes(f.state)) return nearestPose(f);
    if (['hit', 'air', 'down', 'thrown', 'dizzy', 'ko'].includes(f.state)) return 8;
    if (f.state === 'win') return 9;
    if (['crouch', 'prejump', 'getup'].includes(f.state)) return 2;
    if (['block', 'cblock', 'blockstun'].includes(f.state)) return 1;
    if (f.state === 'jump') return 3;
    if (f.state === 'move' && f.mc) {
      const seg = f.mc.segs.find(s => f.mt >= s.s && f.mt < s.e);
      if (seg && typeof seg.p === 'string') {
        if (Object.hasOwn(poseFrames, seg.p)) return poseFrames[seg.p];
        if (seg.p.endsWith('_c')) return f.move.crouch ? 2 : 0;
      }
      return f.move.crouch ? 2 : f.y > 0 ? 3 : 0;
    }
    return 0;
  }
  function draw(ctx, f, opt) {
    const entry = entries.get(f.c.id);
    if (!entry || !entry.loaded) return false;
    const index = frameFor(f), sk = skeleton(f.c, f.pose), hip = fighterHip(f, sk);
    const size = 0.47 * f.c.h;
    let bob = 0;
    if (f.state === 'idle') bob = Math.sin((f.st || 0) * 0.09) * 1.1;
    if (f.state === 'walk' || f.state === 'intro') bob = -Math.abs(Math.sin(f.walkPh || 0)) * 2;
    ctx.save();
    ctx.globalAlpha = (f.alpha == null ? 1 : f.alpha) * (opt.alpha == null ? 1 : opt.alpha);
    ctx.translate(hip[0], hip[1]);
    ctx.scale(f.facing * (f.sc || 1), (f.sc || 1) * (f.squash || 1));
    if (f.rot) ctx.rotate(f.rot * D2R);
    if (f.flash > 0) ctx.filter = 'brightness(2.2)';
    else if (f.paint) ctx.filter = 'hue-rotate(110deg) saturate(2)';
    else if (f.strip) ctx.filter = 'brightness(1.3) saturate(0.2)';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(entry.image, index % 5 * 512, Math.floor(index / 5) * 512, 512, 512,
      -220 * size, hipLift(sk) - 464 * size + bob + (index === 3 ? 40 * size : 0), 512 * size, 512 * size);
    ctx.restore();
    return { sk, hip };
  }
  function portrait(ctx, c, x, y, w, h, facing) {
    const entry = entries.get(c.id);
    if (!entry || !entry.loaded) return false;
    const b = entry.data.frames[0].bounds;
    const cropH = b.h * 0.73, cropW = b.w;
    const scale = Math.max(w / cropW, h / cropH);
    ctx.save();ctx.beginPath();ctx.rect(x, y, w, h);ctx.clip();
    ctx.translate(x + w / 2, y + h / 2);ctx.scale(facing, 1);
    ctx.drawImage(entry.image, b.x, b.y, cropW, cropH, -cropW * scale / 2, -cropH * scale / 2, cropW * scale, cropH * scale);
    ctx.restore();return true;
  }
  return { ready, draw, portrait, frameFor, entries };
})();

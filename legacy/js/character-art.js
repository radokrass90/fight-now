'use strict';

// Sprite timing follows the same move segments used by collision/damage logic.
const CharacterArt = (() => {
  const entries = new Map();
  const mobile = typeof MOBILE !== 'undefined' && MOBILE;
  function loadImage(entry, key, src) {
    if (entry[key + 'Promise']) return entry[key + 'Promise'];
    return entry[key + 'Promise'] = new Promise(resolve => {
      const image = new Image(); entry[key] = image;
      const timer = setTimeout(() => resolve(false), 12000);
      image.onload = () => { clearTimeout(timer); entry[key + 'Loaded'] = true; resolve(true); };
      image.onerror = () => { clearTimeout(timer); console.warn('Character art unavailable:', src); resolve(false); };
      image.src = src;
    });
  }
  const extraData = typeof EXTRA_POSE_DATA === 'undefined' ? null : EXTRA_POSE_DATA;
  const ready = Promise.all(CHARACTER_ART_DATA.characters.map(data => {
    const entry = { data, extraData: extraData?.characters.find(c => c.id === data.id) };
    entries.set(data.id, entry);
    return loadImage(entry, 'portrait', 'assets/characters-hd/' + data.id + '/portrait.webp');
  })).then(() => { document.documentElement.dataset.renderer = 'painted-30'; });
  function release(entry) {
    for (const key of ['image', 'extra']) {
      if (entry[key]) { entry[key].onload = entry[key].onerror = null; entry[key].src = ''; }
      delete entry[key]; delete entry[key + 'Promise']; entry[key + 'Loaded'] = false;
    }
  }
  async function prepare(ids) {
    const active = new Set(ids);
    for (const [id, entry] of entries) if (!active.has(id)) release(entry);
    const suffix = mobile ? '-mobile' : '';
    await Promise.all([...active].flatMap(id => {
      const entry = entries.get(id); if (!entry) return [];
      const base = 'assets/characters-hd/' + id + '/';
      return [loadImage(entry, 'image', base + 'spritesheet' + suffix + '.webp'),
        ...(entry.extraData ? [loadImage(entry, 'extra', base + 'extra-20' + suffix + '.webp')] : [])];
    }));
    document.documentElement.dataset.residentFighters = String([...entries.values()].filter(e => e.imageLoaded).length);
  }

  // 0–9: the ten approved original sprites. 10–29: twenty new poses.
  const poseFrames = {
    block: 1, cblock: 25, crouch: 2, kneel: 29, sit: 2,
    jump: 3, jab: 4, c_jab: 4, palm: 4, jpunch: 4, jhp: 5,
    jab_c: 0, palm_c: 0, cross_c: 18, hook_c: 18, hay_c: 18,
    upper_c: 18, c_up_c: 18, elbow_c: 18, ovh_c: 18, hb_c: 18,
    cross: 5, hook: 20, hay: 5, upper: 21, c_up: 21, elbow: 20,
    ovh: 5, hb: 20, shoulder: 20, lariat: 20, superman: 5,
    spray: 4, throwp: 18, throwx: 4, grab: 1, lift: 9, slam: 5,
    lk_c: 22, rh_c: 22, teep_c: 22, knee_c: 22, stomp_c: 22, sweep_c: 25,
    lowkick: 6, stomp: 6, c_lk: 6, sweep: 6, teep: 6,
    knee: 24, rh: 7, hk: 7, jkick: 7, jhk: 7, swing_c: 18, swing: 7,
    hit_hi: 8, hit_lo: 26, air_hit: 27, dizzy: 8, lie: 28,
    cheer: 9, flex: 9, point: 9, taunt: 0
  };
  function nearestPose(f) {
    let best = 0, distance = Infinity;
    for (const [key, frame] of Object.entries(poseFrames)) {
      const target = fullPose(f.c.stance, key);
      let d = 0;
      for (const k of ['lean', 'fu', 'ff', 'bu', 'bf', 'ft', 'fs', 'bt', 'bs']) {
        const delta = (f.pose[k] || 0) - (target[k] || 0); d += delta * delta;
      }
      if (d < distance) { distance = d; best = frame; }
    }
    return best;
  }
  function recoveryFrame(pose) {
    if (['jab', 'palm', 'c_jab', 'jpunch', 'spray', 'throwx'].includes(pose)) return 17;
    if (['lowkick', 'stomp', 'c_lk', 'sweep', 'teep', 'knee', 'rh', 'hk', 'jkick', 'jhk'].includes(pose)) return 23;
    return 19;
  }
  function frameFor(f) {
    if (f.lying && f.state !== 'getup') return 28;
    if (f.script || ['throwing', 'super', 'locked'].includes(f.state)) return nearestPose(f);
    if (['down', 'ko'].includes(f.state)) return 28;
    if (['air', 'thrown'].includes(f.state)) return 27;
    if (f.state === 'hit') return f.hitLow ? 26 : 8;
    if (f.state === 'dizzy') return 8;
    if (f.state === 'win') return 9;
    if (f.state === 'getup') return f.st < 10 ? 29 : f.st < 15 ? 2 : 0;
    if (['crouch', 'prejump', 'land'].includes(f.state)) return 2;
    if (f.state === 'cblock' || (f.state === 'blockstun' && f.wasCrouch)) return 25;
    if (['block', 'blockstun'].includes(f.state)) return 1;
    if (f.state === 'jump') return f.vy < -2 ? 22 : 3;
    if (['walk', 'intro'].includes(f.state)) {
      const phase = (((f.walkPh || 0) / (Math.PI * 2)) % 1 + 1) % 1;
      let i = Math.floor(phase * 6);
      if ((f.vx || 0) * f.facing < 0) i = 5 - i;
      return 10 + i;
    }
    if (f.state === 'move' && f.mc) {
      // Match.movePose uses t <= e; use exactly that boundary here too.
      let i = f.mc.segs.findIndex(s => f.mt <= s.e);
      if (i < 0) i = f.mc.segs.length - 1;
      const seg = f.mc.segs[i];
      if (seg && typeof seg.p === 'string') {
        if (!seg.hold && ['jab', 'palm', 'c_jab', 'jpunch'].includes(seg.p)) return 16;
        if (Object.hasOwn(poseFrames, seg.p)) return poseFrames[seg.p];
        if (seg.p.endsWith('_c')) return f.move?.crouch ? 25 : 18;
      }
      if (seg?.p == null && i > 0) {
        const previous = f.mc.segs.slice(0, i).reverse().find(s => typeof s.p === 'string' && !s.p.endsWith('_c'));
        if (previous && (f.mt - seg.s) / Math.max(1, seg.e - seg.s) < .7) return recoveryFrame(previous.p);
      }
      return f.move?.crouch ? 2 : f.y > 0 ? 3 : 0;
    }
    return 0;
  }
  function draw(ctx, f, opt = {}) {
    const entry = entries.get(f.c.id);
    if (!entry?.imageLoaded) return false;
    let index = frameFor(f), image = entry.image;
    let frame = entry.data.frames[index];
    if (index >= 10 && entry.extraLoaded) { image = entry.extra; frame = entry.extraData.frames[index - 10]; }
    else if (index >= 10) {
      const fallback = { 16: 0, 17: 0, 18: 0, 19: 0, 20: 5, 21: 5, 22: 3, 23: 3, 24: 6, 25: 2, 26: 8, 27: 8, 28: 8, 29: 2 };
      index = fallback[index] ?? 0; frame = entry.data.frames[index];
    }
    const sk = skeleton(f.c, f.pose), hip = fighterHip(f, sk), size = .47 * f.c.h;
    const groundedArt = index === 28 || index === 29;
    ctx.save();
    ctx.globalAlpha = (f.alpha ?? 1) * (opt.alpha ?? 1);
    // All frames use the same foot pivot. Skeleton hip movement must not move
    // the sprite baseline or a crouch/kick would float above the floor.
    ctx.translate(f.x, GROUND - f.y);
    ctx.scale(f.facing * (f.sc || 1), (f.sc || 1) * (f.squash || 1));
    if (f.rot && !groundedArt) ctx.rotate(f.rot * D2R * (index === 27 ? .2 : 1));
    if (f.flash > 0) ctx.filter = 'brightness(2.2)';
    else if (f.paint) ctx.filter = 'hue-rotate(110deg) saturate(2)';
    else if (f.strip) ctx.filter = 'brightness(1.3) saturate(0.2)';
    if (f.state === 'idle') ctx.scale(1, 1 + Math.sin((f.st || 0) * .09) * .003);
    ctx.imageSmoothingEnabled = true;
    const ratio = (image.naturalWidth || 2560) / 2560;
    ctx.drawImage(image, frame.x * ratio, frame.y * ratio, 512 * ratio, 512 * ratio, -220 * size, -464 * size + (index === 3 ? 40 * size : 0), 512 * size, 512 * size);
    ctx.restore();
    return { sk, hip };
  }
  function portrait(ctx, c, x, y, w, h, facing) {
    const entry = entries.get(c.id);
    if (!entry?.portraitLoaded) return false;
    const b = entry.data.frames[0].bounds;
    const cropH = b.h * .73, cropW = b.w, scale = Math.max(w / cropW, h / cropH);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(facing, 1);
    ctx.drawImage(entry.portrait, b.x / 2, b.y / 2, cropW / 2, cropH / 2, -cropW * scale / 2, -cropH * scale / 2, cropW * scale, cropH * scale);
    ctx.restore(); return true;
  }
  return { ready, prepare, draw, portrait, frameFor, entries };
})();

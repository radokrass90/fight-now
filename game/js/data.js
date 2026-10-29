'use strict';
// Ъглите са в градуси: 0 = надолу, 90 = напред, 180 = нагоре (абсолютни, спрямо посоката на бойца).
// lean = наклон на торса напред, hy = допълнително сваляне на таза.
const PARAMS = ['lean', 'head', 'fu', 'ff', 'bu', 'bf', 'ft', 'fs', 'bt', 'bs', 'hy'];

const STANCES = {
  box:   { lean: 12, head: 6, fu: 44, ff: 156, bu: 24, bf: 166, ft: 24, fs: 6, bt: -18, bs: -6, hy: 0 },
  kick:  { lean: 3, head: 4, fu: 52, ff: 162, bu: 36, bf: 172, ft: 16, fs: 2, bt: -16, bs: -4, hy: 0 },
  brawl: { lean: 10, head: 4, fu: 30, ff: 115, bu: 12, bf: 125, ft: 20, fs: 6, bt: -20, bs: -10, hy: 0 },
  grap:  { lean: 24, head: 10, fu: 70, ff: 100, bu: 58, bf: 96, ft: 32, fs: 2, bt: -30, bs: -12, hy: 0 },
  ginga: { lean: 18, head: 6, fu: 62, ff: 82, bu: -18, bf: 12, ft: 30, fs: -4, bt: -34, bs: -20, hy: 0 },
  cane:  { lean: 4, head: 2, fu: 28, ff: 70, bu: 16, bf: 32, ft: 12, fs: 2, bt: -12, bs: -4, hy: 0 },
  tool:  { lean: 10, head: 4, fu: 46, ff: 150, bu: 30, bf: 120, ft: 22, fs: 4, bt: -18, bs: -8, hy: 0 },
  mma:   { lean: 16, head: 8, fu: 50, ff: 150, bu: 30, bf: 160, ft: 28, fs: 4, bt: -26, bs: -14, hy: 0 },
  krav:  { lean: 10, head: 4, fu: 62, ff: 130, bu: 40, bf: 150, ft: 20, fs: 4, bt: -20, bs: -8, hy: 0 }
};

const POSES = {
  crouch: { lean: 26, head: 4, ft: 82, fs: 2, bt: 14, bs: -86, fu: 55, ff: 150, bu: 35, bf: 160 },
  jump: { lean: 8, ft: 62, fs: -40, bt: 30, bs: -62, fu: 62, ff: 140, bu: 40, bf: 150 },
  jab_c: { fu: 70, ff: 112, lean: 12 }, jab: { fu: 90, ff: 90, lean: 18 },
  cross_c: { bu: 50, bf: 125, lean: 4 }, cross: { bu: 92, bf: 91, lean: 28, fu: 35, ff: 165, ft: 30, bt: -26, bs: -20 },
  hook_c: { fu: 64, ff: 170, lean: 0 }, hook: { fu: 96, ff: 140, lean: 26 },
  hay_c: { bu: -30, bf: 60, lean: -6 }, hay: { bu: 100, bf: 120, lean: 30, ft: 30, bt: -28 },
  upper_c: { bu: 6, bf: 70, lean: 30, ft: 52, fs: -4, bt: -4, bs: -52 }, upper: { bu: 160, bf: 176, lean: -8, ft: 14, fs: 4, bt: -16, bs: -8 },
  elbow_c: { fu: 58, ff: 200, lean: 4 }, elbow: { fu: 100, ff: 250, lean: 24 },
  palm_c: { fu: 60, ff: 140 }, palm: { fu: 88, ff: 96, lean: 20 },
  knee_c: { ft: 70, fs: -20, fu: 100, ff: 120, bu: 95, bf: 115, lean: 4 }, knee: { ft: 118, fs: 16, lean: -8, fu: 110, ff: 116, bu: 104, bf: 110 },
  teep_c: { ft: 104, fs: -10, lean: -6 }, teep: { ft: 88, fs: 92, lean: -18 },
  lk_c: { bt: 24, bs: -60, lean: -4 }, lowkick: { bt: 62, bs: 56, lean: -14 },
  rh_c: { bt: 42, bs: -40, lean: -10, fu: 30, ff: 140, bu: -20, bf: 20 }, rh: { bt: 96, bs: 100, lean: -28, fu: 20, ff: 130, bu: -30, bf: 10 },
  hk: { bt: 132, bs: 136, lean: -38, fu: 14, ff: 120, bu: -40, bf: 0 },
  stomp_c: { ft: 96, fs: 4, lean: 0 }, stomp: { ft: 58, fs: 46, lean: 12 },
  c_jab: { lean: 22, fu: 88, ff: 88 },
  c_up_c: { lean: 30, bu: 10, bf: 60 }, c_up: { lean: -6, bu: 166, bf: 178, ft: 30, fs: 8, bt: -14, bs: -10 },
  c_lk: { lean: 34, ft: 70, fs: 74 },
  sweep_c: { lean: 36, ft: 30, fs: -10, fu: 30, ff: 20, bu: 10, bf: 10 }, sweep: { lean: 42, ft: 62, fs: 62, fu: 22, ff: 12, bu: 8, bf: 4 },
  hb_c: { lean: -12, head: -20, fu: 60, ff: 100, bu: 60, bf: 100 }, hb: { lean: 40, head: 24, fu: 70, ff: 110, bu: 66, bf: 104 },
  ovh_c: { bu: 176, bf: 206, lean: -10 }, ovh: { bu: 82, bf: 58, lean: 28 },
  swing_c: { bu: -30, bf: -12, lean: -2 }, swing: { bu: 92, bf: 96, lean: 22 },
  lariat_c: { fu: 40, ff: 10, lean: -4 }, lariat: { fu: 92, ff: 92, bu: -20, bf: 0, lean: 16 },
  superman: { bu: 96, bf: 92, fu: 20, ff: 40, lean: 26, ft: 40, fs: 20, bt: -72, bs: -62 },
  shoulder: { lean: 44, head: 20, fu: 18, ff: 120, bu: 10, bf: 100, ft: 44, fs: -10, bt: -40, bs: -22 },
  jpunch: { fu: 64, ff: 56, lean: 22 }, jkick: { ft: 76, fs: 82, bt: 10, bs: -60, lean: -12 },
  jhk: { ft: 56, fs: 54, bt: -10, bs: -70, lean: -16, fu: 120, ff: 150 }, jhp: { bu: 60, bf: 40, fu: 140, ff: 170, lean: 26 },
  grab: { fu: 92, ff: 96, bu: 86, bf: 92, lean: 20 },
  lift: { fu: 165, ff: 172, bu: 158, bf: 172, lean: -18 },
  slam: { fu: 64, ff: 40, bu: 62, bf: 40, lean: 48, ft: 40, fs: 10, bt: -30, bs: -30 },
  block: { fu: 72, ff: 176, bu: 62, bf: 178, lean: 2, head: 10 },
  cblock: { lean: 26, ft: 82, fs: 2, bt: 14, bs: -86, fu: 74, ff: 176, bu: 64, bf: 178, head: 10 },
  hit_hi: { lean: -22, head: -24, fu: 20, ff: 60, bu: -12, bf: 30 },
  hit_lo: { lean: 42, head: 16, fu: 30, ff: 20, bu: 20, bf: 10 },
  air_hit: { lean: -30, head: -20, ft: 42, fs: 30, bt: -20, bs: -10, fu: -40, ff: -60, bu: -20, bf: -40 },
  lie: { lean: 0, head: 0, fu: 160, ff: 170, bu: 140, bf: 150, ft: 6, fs: 0, bt: -6, bs: 0 },
  dizzy: { lean: -8, head: -18, fu: 10, ff: 24, bu: -6, bf: 12 },
  cheer: { fu: 168, ff: 178, bu: 150, bf: 182, lean: -6, head: -10 },
  flex: { fu: 92, ff: 175, bu: 92, bf: 175, lean: 0, head: 4 },
  point: { fu: 90, ff: 92, bu: 10, bf: 20, lean: 2 },
  throwp: { bu: 150, bf: 120, lean: -10, fu: 50, ff: 80 }, throwx: { bu: 92, bf: 86, lean: 24, fu: 20, ff: 40 },
  spray: { fu: 92, ff: 96, bu: 30, bf: 90, lean: 10 },
  taunt: { fu: 80, ff: 150, bu: 20, bf: 30, lean: -4, head: -6 },
  sit: { lean: 10, ft: 92, fs: 4, bt: 92, bs: 8, fu: 40, ff: 60, bu: 30, bf: 50 },
  kneel: { lean: 16, ft: 88, fs: 0, bt: 0, bs: -88, fu: 60, ff: 90, bu: 40, bf: 80 }
};

// ---------- конструктори на удари ----------
// hit: d=щета, l=ниво (h/m/l/o), st=hitstun, kb=отблъскване, limb=коя част удря, r=радиус, kd=събаря, launch=изхвърля
function N(ch, ex, s, a, r, hit, o = {}) {
  const s1 = Math.max(1, Math.round(s * 0.6));
  return Object.assign({ k: [{ p: ch, d: s1 }, { p: ex, d: Math.max(1, s - s1), hold: a, hit }, { p: null, d: r }] }, o);
}
const HT = (d, l, st, kb, limb, x = {}) => Object.assign({ d, l, st, kb, limb, r: 14 }, x);

const STYLE_NORMALS = {
  box: () => ({
    LP: N('jab_c', 'jab', 5, 3, 8, HT(32, 'h', 14, 2.5, 'fh'), { name: localize("Jab") }),
    HP: N('cross_c', 'cross', 9, 3, 15, HT(70, 'h', 20, 5, 'bh'), { name: localize("Cross"), vx: 2.5 }),
    LK: N('teep_c', 'teep', 7, 3, 12, HT(40, 'm', 16, 5, 'ff'), { name: localize("Front kick") }),
    HK: N('rh_c', 'rh', 11, 4, 19, HT(78, 'm', 22, 6, 'bf'), { name: localize("Roundhouse") }),
    fHP: N('hook_c', 'hook', 10, 3, 16, HT(80, 'h', 22, 4, 'fh', { r: 18 }), { name: localize("Hook"), vx: 2 })
  }),
  kick: () => ({
    LP: N('jab_c', 'jab', 5, 3, 8, HT(28, 'h', 14, 2.5, 'fh'), { name: localize("Jab") }),
    HP: N('elbow_c', 'elbow', 8, 3, 14, HT(66, 'h', 20, 3, 'fe', { r: 16 }), { name: localize("Elbow"), vx: 2 }),
    LK: N('lk_c', 'lowkick', 7, 3, 12, HT(44, 'l', 16, 3, 'bf'), { name: localize("Low kick") }),
    HK: N('rh_c', 'hk', 11, 4, 20, HT(86, 'h', 24, 7, 'bf', { r: 16 }), { name: localize("High kick") }),
    fHP: N('knee_c', 'knee', 9, 4, 16, HT(76, 'm', 22, 4, 'fk', { r: 18 }), { name: localize("Knee"), vx: 3 })
  }),
  brawl: () => ({
    LP: N('jab_c', 'jab', 6, 3, 9, HT(32, 'h', 14, 2.5, 'fh'), { name: localize("Slap jab") }),
    HP: N('hay_c', 'hay', 11, 3, 17, HT(82, 'h', 22, 6, 'bh', { r: 18 }), { name: localize("Haymaker"), vx: 2 }),
    LK: N('stomp_c', 'stomp', 8, 3, 12, HT(40, 'l', 16, 3, 'ff'), { name: localize("Stomp") }),
    HK: N('teep_c', 'teep', 10, 4, 18, HT(76, 'm', 22, 9, 'ff', { r: 16 }), { name: localize("Body kick") }),
    fHP: N('hb_c', 'hb', 11, 3, 18, HT(84, 'h', 24, 5, 'head', { r: 16 }), { name: localize("Headbutt"), vx: 3 })
  }),
  grap: () => ({
    LP: N('palm_c', 'palm', 6, 3, 9, HT(34, 'h', 14, 3, 'fh'), { name: localize("Palm strike") }),
    HP: N('lariat_c', 'lariat', 11, 4, 18, HT(84, 'h', 22, 6, 'fe', { r: 22 }), { name: localize("Lariat"), vx: 3.5 }),
    LK: N('stomp_c', 'stomp', 8, 3, 13, HT(42, 'l', 16, 3, 'ff'), { name: localize("Stomp") }),
    HK: N('knee_c', 'knee', 10, 4, 18, HT(80, 'm', 22, 5, 'fk', { r: 20 }), { name: localize("Knee") }),
    fHP: N('hb_c', 'hb', 11, 3, 18, HT(88, 'h', 24, 5, 'head', { r: 18 }), { name: localize("Headbutt"), vx: 2 })
  }),
  ginga: () => ({
    LP: N('jab_c', 'jab', 5, 3, 8, HT(28, 'h', 13, 2.5, 'fh'), { name: localize("Jab") }),
    HP: N('elbow_c', 'elbow', 8, 3, 14, HT(62, 'h', 20, 3, 'fe', { r: 16 }), { name: localize("Elbow"), vx: 2 }),
    LK: N('lk_c', 'lowkick', 6, 3, 11, HT(38, 'l', 15, 3, 'bf'), { name: localize("Leg sweep") }),
    HK: N('rh_c', 'hk', 10, 5, 19, HT(80, 'h', 24, 7, 'bf', { r: 18 }), { name: localize("Meia lua") }),
    fHP: N('teep_c', 'teep', 8, 4, 14, HT(66, 'm', 20, 8, 'ff'), { name: localize("Chapa"), vx: 2 })
  }),
  cane: () => ({
    LP: N('jab_c', 'jab', 6, 3, 9, HT(30, 'h', 14, 2.5, 'fh'), { name: localize("Slap") }),
    HP: N('ovh_c', 'ovh', 11, 4, 18, HT(84, 'o', 22, 4, 'prop', { r: 18 }), { name: localize("Overhead cane") }),
    LK: N('lk_c', 'lowkick', 8, 3, 12, HT(38, 'l', 15, 3, 'bf'), { name: localize("Shin kick") }),
    HK: N('swing_c', 'swing', 12, 4, 20, HT(78, 'm', 22, 8, 'prop', { r: 20 }), { name: localize("Cane swing") }),
    fHP: N('swing_c', 'swing', 10, 4, 18, HT(72, 'm', 20, 6, 'prop', { r: 20 }), { name: localize("Thrust"), vx: 2.5 })
  }),
  tool: () => ({
    LP: N('jab_c', 'jab', 5, 3, 8, HT(30, 'h', 14, 2.5, 'fh'), { name: localize("Jab") }),
    HP: N('ovh_c', 'ovh', 10, 4, 17, HT(80, 'o', 22, 4, 'prop', { r: 18 }), { name: localize("Overhead wrench") }),
    LK: N('lk_c', 'lowkick', 7, 3, 12, HT(40, 'l', 15, 3, 'bf'), { name: localize("Low kick") }),
    HK: N('rh_c', 'rh', 10, 4, 18, HT(76, 'm', 22, 6, 'bf'), { name: localize("Roundhouse") }),
    fHP: N('swing_c', 'swing', 9, 4, 16, HT(74, 'm', 20, 6, 'prop', { r: 18 }), { name: localize("Wrench swing"), vx: 2 })
  }),
  mma: () => ({
    LP: N('jab_c', 'jab', 5, 3, 8, HT(30, 'h', 14, 2.5, 'fh'), { name: localize("Jab") }),
    HP: N('cross_c', 'cross', 8, 3, 14, HT(66, 'h', 20, 5, 'bh'), { name: localize("Cross"), vx: 2.5 }),
    LK: N('lk_c', 'lowkick', 7, 3, 12, HT(44, 'l', 16, 3, 'bf'), { name: localize("Low kick") }),
    HK: N('rh_c', 'hk', 11, 4, 19, HT(82, 'h', 24, 7, 'bf', { r: 16 }), { name: localize("High kick") }),
    fHP: N('knee_c', 'knee', 9, 4, 15, HT(74, 'm', 22, 4, 'fk', { r: 18 }), { name: localize("Knee"), vx: 3 })
  }),
  krav: () => ({
    LP: N('palm_c', 'palm', 5, 3, 8, HT(30, 'h', 14, 3, 'fh'), { name: localize("Palm to the nose") }),
    HP: N('elbow_c', 'elbow', 8, 3, 14, HT(68, 'h', 20, 3, 'fe', { r: 16 }), { name: localize("Elbow") }),
    LK: N('teep_c', 'teep', 6, 3, 11, HT(40, 'm', 16, 6, 'ff'), { name: localize("Stop kick") }),
    HK: N('knee_c', 'knee', 9, 4, 17, HT(78, 'm', 22, 5, 'fk', { r: 20 }), { name: localize("Knee"), vx: 3 }),
    fHP: N('hook_c', 'hook', 9, 3, 15, HT(74, 'h', 22, 4, 'fh', { r: 18 }), { name: localize("Hook"), vx: 2 })
  })
};

const SHARED_NORMALS = () => ({
  cLP: N({ lean: 22 }, 'c_jab', 5, 3, 8, HT(26, 'm', 13, 2, 'fh'), { name: localize("Low jab"), crouch: 1 }),
  cHP: N('c_up_c', 'c_up', 8, 4, 20, HT(90, 'm', 0, 2, 'bh', { r: 20, launch: 13, kd: 1 }), { name: localize("Uppercut"), crouch: 1, rise: 1 }),
  cLK: N({ lean: 30 }, 'c_lk', 6, 3, 10, HT(30, 'l', 14, 3, 'ff'), { name: localize("Low kick"), crouch: 1 }),
  cHK: N('sweep_c', 'sweep', 9, 4, 22, HT(66, 'l', 0, 3, 'ff', { r: 18, kd: 1, launch: 3 }), { name: localize("Sweep"), crouch: 1 }),
  jLP: N({}, 'jpunch', 4, 6, 6, HT(44, 'o', 16, 3, 'fh', { r: 16 }), { name: localize("Air punch"), air: 1 }),
  jHP: N({}, 'jhp', 6, 6, 8, HT(70, 'o', 20, 4, 'bh', { r: 18 }), { name: localize("Overhead punch"), air: 1 }),
  jLK: N({}, 'jkick', 4, 7, 6, HT(48, 'o', 16, 4, 'ff', { r: 16 }), { name: localize("Air kick"), air: 1 }),
  jHK: N({}, 'jhk', 6, 7, 8, HT(76, 'o', 20, 6, 'ff', { r: 18 }), { name: localize("Flying kick"), air: 1 })
});

// ---------- хвърляния (сценарий на жертвата спрямо атакуващия) ----------
// B: [кадър, dx (напред), dy (нагоре), завъртане°]; A: [кадър, поза]
const THROWS = {
  toss:  { A: [[0, 'grab'], [12, 'grab'], [24, 'lift'], [36, 'slam'], [50, null]], B: [[0, 48, 0, 0], [12, 44, 10, 0], [24, 0, 80, -110], [36, -78, 0, -180], [50, -78, 0, -180]], impact: 36, end: 50, d: 110, land: 'down' },
  slam:  { A: [[0, 'grab'], [10, 'grab'], [26, 'lift'], [38, 'slam'], [54, null]], B: [[0, 46, 0, 0], [10, 44, 6, 0], [26, 20, 96, -170], [38, 56, 0, -270], [54, 56, 0, -270]], impact: 38, end: 54, d: 125, land: 'down' },
  shove: { A: [[0, 'grab'], [8, 'knee'], [16, 'grab'], [24, 'palm'], [40, null]], B: [[0, 46, 0, 0], [8, 44, 4, 10], [16, 44, 0, 8], [24, 60, 0, -10], [40, 60, 0, 0]], impact: 8, impact2: 24, end: 40, d: 95, land: 'push' },
  spin:  { A: [[0, 'grab'], [10, 'lift'], [20, 'grab'], [30, 'lift'], [40, 'throwx'], [56, null]], B: [[0, 46, 0, 0], [10, -40, 50, -90], [20, -46, 30, -180], [30, 40, 60, -270], [40, 120, 40, -360], [56, 170, 0, -450]], impact: 44, end: 56, d: 150, land: 'down' },
  choke: { A: [[0, 'grab'], [12, { fu: 120, ff: 150, bu: 30, bf: 40 }], [30, { fu: 120, ff: 150, bu: 170, bf: 200 }], [40, { fu: 60, ff: 60, bu: 80, bf: 56, lean: 28 }], [56, null]], B: [[0, 44, 0, 0], [12, 40, 40, 0], [30, 40, 46, 0], [40, 54, 0, -90], [56, 60, 0, -90]], impact: 40, end: 56, d: 140, land: 'down' },
  takedown: { A: [[0, 'shoulder'], [10, 'shoulder'], [22, 'kneel'], [30, { lean: 40, ft: 88, fs: 0, bt: 0, bs: -88, bu: 100, bf: 70 }], [36, 'kneel'], [42, { lean: 40, ft: 88, fs: 0, bt: 0, bs: -88, fu: 100, ff: 70 }], [56, null]], B: [[0, 40, 0, 0], [10, 50, 10, -20], [22, 70, 0, -90], [56, 70, 0, -90]], impact: 22, impact2: 30, impact3: 42, end: 56, d: 145, land: 'down' }
};

// ---------- 15-те героя ----------
const CHARS = [
  { id: 'murat', name: 'Murat', nick: 'Beton', full: 'Murat „Beton“ Çelik', home: 0, sex: 'm', style: 'box', h: 1.02, w: 1.3,
    str: 9, spd: 4, tec: 6, end: 9,
    bio: localize("A construction worker from Neukölln and former amateur boxer. Hits like an excavator and refuses to go down."),
    look: { skin: '#c98d5f', hair: 'buzz', hairC: '#1d1a17', beard: 'stubble', top: '#c8692b', sleeves: 2, pants: '#3b3f46', shoes: '#5a3d22', hands: '#f2f0ea', extra: ['vest'] },
    sp1: { type: 'rush', name: localize("Concrete Mixer"), desc: localize("Three hooks in the clinch"), poses: ['hook_c', 'hook', 'cross_c', 'cross'], hits: 3, d: 42, vx: 5, every: 9, st: 18, l: 'h', finalKb: 7 },
    sp2: { type: 'rush', name: localize("Wrecking Ball"), desc: localize("Armored overhead strike through an attack"), poses: ['ovh_c', 'hay'], hits: 1, d: 120, vx: 6, every: 18, st: 26, l: 'o', armor: 1, kd: 1 },
    sup: { name: localize("Clocking Off"), color: '#ff9b3d' }, fin: 'mixer', finName: localize("Concrete Mixer"), code: ['D', 'F', 'D', 'hp'] },
  { id: 'yasmin', name: 'Yasmin', nick: 'Flex', full: 'Yasmin „Flex“ Dörfler', home: 1, sex: 'f', style: 'kick', h: 0.98, w: 0.9,
    str: 5, spd: 9, tec: 8, end: 5,
    bio: localize("A bartender in St. Pauli who kickboxes every evening. Her low kicks cut through legs like a saw."),
    look: { skin: '#b07850', hair: 'braids', hairC: '#2a1b14', top: '#e2335f', sleeves: 0, crop: 1, pants: '#1f1f24', stripe: '#ffffff', shoes: '#f2f2f2', hands: '#f2f0ea', extra: [] },
    sp1: { type: 'rush', name: localize("Chainsaw"), desc: localize("A flurry of low kicks"), poses: ['lk_c', 'lowkick'], hits: 4, d: 26, vx: 4, every: 7, st: 14, l: 'l', limb: 'bf', finalKd: 1 },
    sp2: { type: 'aa', name: localize("Flying Knee"), desc: localize("Flying knee that knocks enemies out of the air"), pose: 'knee', vy: 11, vx: 4, d: 95, limb: 'fk' },
    sup: { name: localize("Neighborhood Storm"), color: '#ff3d7f' }, fin: 'launch', finName: localize("Takeoff"), code: ['F', 'F', 'D', 'hk'] },
  { id: 'dragan', name: 'Dragan', nick: 'Der Pate', full: 'Dragan „Der Pate“ Vuković', home: 2, sex: 'm', style: 'cane', h: 1.0, w: 1.15,
    str: 8, spd: 3, tec: 7, end: 8, prop: 'cane',
    bio: localize("An old loan shark from the Bahnhofsviertel. Never in a hurry — his debtors come to him."),
    look: { skin: '#d9a68a', hair: 'slick', hairC: '#8a8580', beard: 'mustache', top: '#2b201b', sleeves: 2, pants: '#26262b', shoes: '#111111', hands: '#d9a68a', extra: ['chain'] },
    sp1: { type: 'proj', name: localize("Cash Rain"), desc: localize("Throws a wad of cash"), sprite: 'cash', spd: 7, d: 60, st: 18, y: 70 },
    sp2: { type: 'cgrab', name: localize("Debt Collector"), desc: localize("Collar grab followed by a cane strike"), throw: 'choke', d: 150, range: 80 },
    sup: { name: localize("Compound Interest"), color: '#d4af37' }, fin: 'limo', finName: localize("Final Notice"), code: ['B', 'F', 'B', 'hp'] },
  { id: 'kevin', name: 'Kevin', nick: 'Hooli', full: 'Kevin „Hooli“ Brandt', home: 3, sex: 'm', style: 'brawl', h: 1.0, w: 1.1,
    str: 7, spd: 6, tec: 4, end: 8,
    bio: localize("Banned from the stadium for life. Fights like an away fan: loud, dirty and wearing a scarf."),
    look: { skin: '#f0c4a0', hair: 'buzz', hairC: '#d8b56a', top: '#2f4a2e', sleeves: 2, pants: '#3d5a80', shoes: '#f4f4f4', hands: '#f0c4a0', extra: ['scarf'], scarf: ['#f5c400', '#111111'] },
    sp1: { type: 'proj', name: localize("Flare"), desc: localize("Throws a smoke flare"), sprite: 'flare', spd: 6, d: 70, st: 20, y: 60, kd: 1 },
    sp2: { type: 'rush', name: localize("Away End"), desc: localize("A charging shoulder that runs opponents over"), poses: ['shoulder', 'shoulder'], hits: 1, d: 100, vx: 9, every: 20, st: 24, l: 'm', kd: 1, limb: 'fsh' },
    sup: { name: localize("Pitch Invasion"), color: '#f5c400' }, fin: 'pyro', finName: localize("Pyro Show"), code: ['D', 'D', 'F', 'hk'] },
  { id: 'leyla', name: 'Leyla', nick: 'Scheinwerfer', full: 'Leyla „Scheinwerfer“ Arslan', home: 4, sex: 'f', style: 'tool', h: 0.97, w: 0.92,
    str: 5, spd: 8, tec: 9, end: 4, prop: 'wrench',
    bio: localize("Can open any car in forty seconds. A wrench is always waiting in her back pocket."),
    look: { skin: '#c58e66', hair: 'bun', hairC: '#1a1210', top: '#7a1f2b', sleeves: 2, pants: '#2d2d33', shoes: '#8a8a8a', hands: '#1b1b1b', extra: [] },
    sp1: { type: 'proj', name: localize("Hubcap"), desc: localize("Throws a hubcap like a frisbee"), sprite: 'hubcap', spd: 9, d: 55, st: 16, y: 56 },
    sp2: { type: 'proj', name: localize("Short Circuit"), desc: localize("A blinding flashlight that stuns"), sprite: 'beam', spd: 16, d: 20, st: 10, y: 92, stun: 70, life: 14 },
    sup: { name: localize("Full Throttle"), color: '#ffd23d' }, fin: 'tow', finName: localize("Towed Away"), code: ['F', 'B', 'F', 'lk'] },
  { id: 'tomasz', name: 'Tomasz', nick: 'Spray', full: 'Tomasz „Spray“ Lewandowski', home: 5, sex: 'm', style: 'ginga', h: 1.0, w: 0.9,
    str: 4, spd: 10, tec: 7, end: 5, jump: 1.15,
    bio: localize("A graffiti artist from Connewitz. Ten years running from security, and they still haven't caught him."),
    look: { skin: '#efc9a8', hair: 'hood', hairC: '#4b5563', top: '#4b5563', sleeves: 2, pants: '#1f2937', shoes: '#e11d48', hands: '#efc9a8', extra: ['mask', 'paint'] },
    sp1: { type: 'proj', name: 'Blackout', desc: localize("A spray cloud that stuns"), sprite: 'cloud', spd: 4, d: 30, st: 12, y: 86, stun: 80, life: 40 },
    sp2: { type: 'flip', name: localize("Wall Jump"), desc: localize("An overhead flipping kick"), vy: 12, vx: 6, d: 90 },
    sup: { name: 'Bombing', color: '#22d3ee' }, fin: 'graffiti', finName: localize("Masterpiece"), code: ['D', 'B', 'D', 'lp'] },
  { id: 'hakan', name: 'Hakan', nick: 'Der Metzger', full: 'Hakan „Der Metzger“ Kurt', home: 6, sex: 'm', style: 'grap', h: 1.05, w: 1.45,
    str: 10, spd: 3, tec: 5, end: 10,
    bio: localize("A market butcher from Marxloh. Carries an entire calf on his shoulder. His grip is a vise."),
    look: { skin: '#c9946b', hair: 'bald', hairC: '#151210', beard: 'full', top: '#f0ede6', sleeves: 1, pants: '#3a3a3a', shoes: '#222222', hands: '#c9946b', extra: ['apron'], apron: '#e9f1f7' },
    sp1: { type: 'cgrab', name: localize("Meat Hook"), desc: localize("Lifts the opponent and slams them into the asphalt"), throw: 'slam', d: 170, range: 84 },
    sp2: { type: 'proj', name: localize("Sausage Chain"), desc: localize("A chain of sausages that pulls opponents closer"), sprite: 'sausage', spd: 10, d: 30, st: 30, y: 80, pull: 1, life: 26 },
    sup: { name: localize("Slaughterfest"), color: '#ef4444' }, fin: 'wrap', finName: localize("Freshly Wrapped"), code: ['D', 'D', 'D', 'hp'] },
  { id: 'nadine', name: 'Nadine', nick: 'Pfeffer', full: 'Nadine „Pfeffer“ Weiss', home: 7, sex: 'f', style: 'krav', h: 1.0, w: 1.0,
    str: 6, spd: 7, tec: 8, end: 6,
    bio: localize("A former club bouncer in Linden, fired for excessive enthusiasm. Krav Maga and zero patience."),
    look: { skin: '#f1cfb4', hair: 'pony', hairC: '#e8d39a', top: '#121214', sleeves: 1, pants: '#1b1b1f', shoes: '#050505', hands: '#f1cfb4', extra: ['earpiece'] },
    sp1: { type: 'counter', name: localize("Door Policy"), desc: localize("A counter that catches a strike and throws"), throw: 'toss', d: 130, window: 26 },
    sp2: { type: 'rush', name: localize("Ejection"), desc: localize("A palm to the chest that sends opponents flying"), poses: ['palm_c', 'palm'], hits: 1, d: 90, vx: 7, every: 16, st: 24, l: 'm', kb: 14, kd: 1 },
    sup: { name: localize("Closing Time"), color: '#60a5fa' }, fin: 'door', finName: localize("Banned for Life"), code: ['B', 'B', 'F', 'hp'] },
  { id: 'emre', name: 'Emre', nick: 'Taxi', full: 'Emre „Taxi“ Yıldız', home: 8, sex: 'm', style: 'box', h: 0.96, w: 0.95,
    str: 5, spd: 9, tec: 7, end: 5,
    bio: localize("A night-shift taxi driver in Munich. Knows every side street and every shortcut to your chin."),
    look: { skin: '#c08b62', hair: 'short', hairC: '#14100d', top: '#efe7c8', sleeves: 1, pants: '#3a3530', shoes: '#5a3a22', hands: '#c08b62', extra: ['glasses', 'vestDark'] },
    sp1: { type: 'rush', name: localize("Night Fare"), desc: localize("Five jabs and a kick"), poses: ['jab_c', 'jab', 'cross_c', 'cross'], hits: 5, d: 20, vx: 3, every: 6, st: 14, l: 'h', finalKb: 8, finalLaunch: 6 },
    sp2: { type: 'proj', name: localize("Horn Blast"), desc: localize("A horn-powered sound wave"), sprite: 'wave', spd: 13, d: 45, st: 18, y: 84, life: 24 },
    sup: { name: localize("Night Shift"), color: '#facc15' }, fin: 'taxi', finName: localize("Last Ride"), code: ['F', 'F', 'F', 'lp'] },
  { id: 'boris', name: 'Boris', nick: 'Kran', full: 'Boris „Kran“ Petrov', home: 9, sex: 'm', style: 'grap', h: 1.1, w: 1.35,
    str: 9, spd: 4, tec: 6, end: 9,
    bio: localize("A dockworker from Bremen's port. Moves containers with a look. The chain around his waist is no decoration."),
    look: { skin: '#e6b896', hair: 'beanie', hairC: '#1e3a5f', beard: 'full', beardC: '#8b4a2b', top: '#ff7a1a', sleeves: 0, overalls: 1, pants: '#ff7a1a', shoes: '#3d2b1f', hands: '#e6b896', extra: ['beltChain'] },
    sp1: { type: 'cgrab', name: localize("Harbor Toss"), desc: localize("Spins and throws the opponent far away"), throw: 'spin', d: 160, range: 86 },
    sp2: { type: 'quake', name: localize("Anchor Drop"), desc: localize("Ground slam with a low shockwave"), d: 70 },
    sup: { name: localize("Unloading Day"), color: '#fb923c' }, fin: 'container', finName: localize("Duty Free"), code: ['D', 'B', 'F', 'hk'] },
  { id: 'jasmin', name: 'Jasmin', nick: 'Kobra', full: 'Jasmin „Kobra“ Hoffmann', home: 10, sex: 'f', style: 'mma', h: 0.98, w: 0.95,
    str: 6, spd: 8, tec: 10, end: 6,
    bio: localize("Trains MMA in a basement in Bad Cannstatt and fights for cash in garages. Once she gets you down, it's over."),
    look: { skin: '#8d5a3b', hair: 'braids', hairC: '#120c0a', top: '#16a34a', sleeves: 0, crop: 1, pants: '#0f172a', shorts: 1, shoes: '#8d5a3b', barefoot: 1, hands: '#f2f0ea', extra: [] },
    sp1: { type: 'cgrab', name: 'Takedown', desc: localize("Leg takedown followed by ground strikes"), throw: 'takedown', d: 150, range: 120, dash: 1 },
    sp2: { type: 'rush', name: 'Superman Punch', desc: localize("A jumping overhead punch"), poses: ['superman', 'superman'], hits: 1, d: 95, vx: 8, every: 16, st: 22, l: 'o', limb: 'bh', hop: 5 },
    sup: { name: 'Ground & Pound', color: '#22c55e' }, fin: 'tapout', finName: localize("Tapped Out"), code: ['D', 'F', 'B', 'lk'] },
  { id: 'adem', name: 'Adem', nick: 'Dönerkönig', full: 'Adem „Dönerkönig“ Şahin', home: 11, sex: 'm', style: 'brawl', h: 0.97, w: 1.15,
    str: 6, spd: 6, tec: 8, end: 7, prop: 'tray',
    bio: localize("Runs the corner kebab stand in Wedding. Sees everything, knows everyone and is always laughing."),
    look: { skin: '#c9956c', hair: 'curly', hairC: '#1a1410', beard: 'mustache', top: '#c0392b', sleeves: 1, pants: '#4a4a4a', shoes: '#dddddd', hands: '#c9956c', extra: ['apron'], apron: '#f7f7f2' },
    sp1: { type: 'proj', name: localize("Hot Sauce"), desc: localize("Hot sauce to the eyes that stuns"), sprite: 'sauce', spd: 8, d: 30, st: 12, y: 84, stun: 70 },
    sp2: { type: 'rush', name: localize("Tray Tornado"), desc: localize("A spinning tray attack"), poses: ['swing_c', 'swing'], hits: 3, d: 34, vx: 5, every: 9, st: 16, l: 'm', limb: 'prop', finalKd: 1 },
    sup: { name: localize("With Everything"), color: '#f97316' }, fin: 'durum', finName: localize("Wrap Deluxe"), code: ['B', 'D', 'F', 'hp'] },
  { id: 'marco', name: 'Marco', nick: 'Schatten', full: 'Marco „Schatten“ Reinhardt', home: 12, sex: 'm', style: 'krav', h: 1.0, w: 0.9,
    str: 4, spd: 10, tec: 9, end: 4,
    bio: localize("A pickpocket from Gostenhof. Nobody remembers his face. His quick hands steal your energy too."),
    look: { skin: '#e3bfa1', hair: 'short', hairC: '#5b4636', top: '#6b7280', sleeves: 2, pants: '#374151', shoes: '#1f2937', hands: '#e3bfa1', extra: ['collar'] },
    sp1: { type: 'rush', name: localize("Sleight of Hand"), desc: localize("Rapid strikes that steal energy"), poses: ['jab_c', 'jab', 'palm_c', 'palm'], hits: 4, d: 18, vx: 6, every: 5, st: 12, l: 'h', steal: 1 },
    sp2: { type: 'tele', name: localize("Shadow Step"), desc: localize("Vanishes and reappears behind you"), d: 70 },
    sup: { name: localize("Empty Pockets"), color: '#a3a3a3' }, fin: 'strip', finName: localize("All Gone"), code: ['F', 'D', 'B', 'lp'] },
  { id: 'fatima', name: 'Fatima', nick: 'Eisen', full: 'Fatima „Eisen“ Benali', home: 13, sex: 'f', style: 'grap', h: 1.04, w: 1.32,
    str: 10, spd: 4, tec: 6, end: 9,
    bio: localize("Lifting weights since fourteen, she works at the Altendorf scrapyard. Crushes cars — and people."),
    look: { skin: '#b9855e', hair: 'undercut', hairC: '#1c1310', top: '#0e7490', sleeves: 0, pants: '#4b5320', shoes: '#2b2118', hands: '#b9855e', extra: ['belt'] },
    sp1: { type: 'cgrab', name: localize("Scrap Press"), desc: localize("Bear hug into a slam"), throw: 'slam', d: 165, range: 84 },
    sp2: { type: 'rush', name: localize("Steel Shoulder"), desc: localize("An armored shoulder charge"), poses: ['shoulder', 'shoulder'], hits: 1, d: 105, vx: 8, every: 20, st: 24, l: 'm', armor: 1, kd: 1, limb: 'fsh' },
    sup: { name: localize("Hydraulics"), color: '#06b6d4' }, fin: 'dumpster', finName: localize("Bulky Waste"), code: ['F', 'D', 'F', 'hk'] },
  { id: 'danny', name: 'Danny', nick: 'Nebel', full: 'Danny „Nebel“ Kowalski', home: 14, sex: 'm', style: 'brawl', h: 0.99, w: 0.92,
    str: 6, spd: 8, tec: 8, end: 5,
    bio: localize("Trades anything he can find in Magdeburg. Always watching the exit, and always finds a way out."),
    look: { skin: '#efd2bd', hair: 'cap', hairC: '#7c3aed', top: '#4c1d95', sleeves: 2, stripe: '#ffffff', pants: '#1f1f1f', shoes: '#fafafa', hands: '#efd2bd', extra: ['cig'] },
    sp1: { type: 'tele', name: localize("Smoke Bomb"), desc: localize("Smoke, vanish, strike from behind"), d: 75 },
    sp2: { type: 'rush', name: localize("Headbutt Rush"), desc: localize("A leaping headbutt"), poses: ['hb_c', 'hb'], hits: 1, d: 90, vx: 7, every: 16, st: 26, l: 'h', limb: 'head', kd: 1 },
    sup: { name: localize("Fog Wall"), color: '#c4b5fd' }, fin: 'vanish', finName: localize("Missing"), code: ['B', 'D', 'B', 'hk'] }
];

const STYLE_NAMES = { box: localize("Boxing"), kick: localize("Kickboxing / Muay Thai"), brawl: localize("Street fighting"), grap: localize("Wrestling"), ginga: localize("Capoeira / parkour"), cane: localize("Cane fighting"), tool: localize("Tool fighting"), mma: localize("MMA"), krav: localize("Krav Maga") };
const THROW_OF = { box: 'shove', kick: 'shove', brawl: 'toss', grap: 'slam', ginga: 'toss', cane: 'toss', tool: 'toss', mma: 'slam', krav: 'toss' };

for (const c of CHARS) {
  c.moves = Object.assign(SHARED_NORMALS(), STYLE_NORMALS[c.style]());
  c.stance = STANCES[c.style];
  c.throw = THROW_OF[c.style];
  c.walk = 1.7 + c.spd * 0.22;
  c.power = 0.86 + c.str * 0.03;
  c.def = 1.12 - c.end * 0.025;
}

function fullPose(stance, p) {
  const o = Object.assign({}, stance);
  if (p) Object.assign(o, typeof p === 'string' ? POSES[p] : p);
  return o;
}

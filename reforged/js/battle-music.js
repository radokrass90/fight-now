'use strict';
const BATTLE_TRACKS = [
  { title: 'Beton Pressure', file: '01-beton-pressure.mp3' },
  { title: 'Neukolln Knuckles', file: '02-neukolln-knuckles.mp3' },
  { title: 'Hafennacht Engine', file: '03-hafennacht-engine.mp3' },
  { title: 'Steel Yard Riot', file: '04-steel-yard-riot.mp3' },
  { title: 'Final Round Overdrive', file: '05-final-round-overdrive.mp3' },
  { title: 'Sudden Death Protocol', file: '06-sudden-death-protocol.mp3' }
];

const BattleMusic = {
  arenaTracks: [0, 1, 0, 3, 2, 1, 0, 3, 1, 2, 2, 0, 1, 3, 1],
  cache: new Map(), current: null, track: -1, requested: false,
  paused: false, signature: '', volume: 0.30,
  trackFor(arena, round = 1, boss = false) {
    if (boss) return round >= 3 ? 5 : 4;
    if (round >= 3) return arena % 2 ? 5 : 4;
    return this.arenaTracks[arena] == null ? 0 : this.arenaTracks[arena];
  },
  start(arena = 0, round = 1, boss = false) {
    const index = this.trackFor(arena, round, boss);
    this.requested = true;
    if (index !== this.track) {
      if (this.current) { this.current.pause(); this.current.currentTime = 0; }
      this.track = index;
      if (!this.cache.has(index)) {
        // Reuse the user-activated media element on iOS and bound its cache.
        const reused = typeof MOBILE !== 'undefined' && MOBILE && this.cache.values().next().value;
        const audio = reused || new Audio();
        if (reused) this.cache.clear();
        audio.src = 'assets/audio/' + BATTLE_TRACKS[index].file;
        audio.loop = true; audio.preload = 'metadata'; this.cache.set(index, audio);
        audio.hidden = true; audio.dataset.battleTrack = String(index);
        document.body.appendChild(audio);
      }
      this.current = this.cache.get(index);
      this.current.currentTime = 0; this.signature = '';
    }
    this.apply();
  },
  syncMatch(match, boss = false) {
    this.paused = match.paused;
    this.start(match.arena, match.round, boss);
  },
  apply(force = false) {
    const enabled = this.requested && !this.paused && Snd.on && Snd.musicOn && !document.hidden;
    const signature = [this.track, enabled, this.volume].join('/');
    if (!force && signature === this.signature) return;
    this.signature = signature;
    if (!this.current) return;
    this.current.volume = this.volume;
    if (!enabled) { this.current.pause(); return; }
    const playing = this.current.play();
    // Retry from a real input gesture when browser autoplay policy requires it.
    if (playing && playing.catch) playing.catch(() => {});
  },
  stop() {
    this.requested = false; this.paused = false; this.signature = '';
    if (this.current) { this.current.pause(); this.current.currentTime = 0; }
    this.current = null; this.track = -1;
  },
  get title() { return this.track < 0 ? '' : BATTLE_TRACKS[this.track].title; }
};
document.addEventListener('visibilitychange', () => BattleMusic.apply(true));

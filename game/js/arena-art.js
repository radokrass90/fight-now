'use strict';

const ArenaArt = (() => {
  const entries = new Map();
  const ready = Promise.all(ARENA_ART_DATA.map(data => new Promise(resolve => {
    const image = new Image(), entry = { data, image, loaded: false };
    entries.set(data.index, entry);
    image.onload = () => { entry.loaded = true; resolve(); };
    image.onerror = () => { console.warn('Arena art unavailable:', data.id); resolve(); };
    image.src = 'assets/arenas-hd/' + data.id + '/background.webp';
  })));
  function imageFor(index) {
    const entry = entries.get(index);
    return entry && entry.loaded ? entry.image : null;
  }
  return { ready, entries, imageFor };
})();

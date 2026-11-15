'use strict';
// Only narrative checkpoints are stored here. Matches, currency and equipment
// retain their existing owners and online reward validation.
const Campaign = (() => {
  const key = 'campaign-v1';
  const stages = [
    {opponent:'yasmin', chapter:0},
    {opponent:'kevin', chapter:0},
    {opponent:'nadine', chapter:1},
    {opponent:'leyla', chapter:1},
    {opponent:'boris', chapter:1},
    {opponent:'marco', chapter:2},
    {opponent:'dragan', chapter:2}
  ];
  let state = null, saved = true;
  function valid(value) {
    return value?.version === 1 && typeof value.run === 'string' && value.run.length > 0 &&
      Number.isInteger(value.stage) && value.stage >= 0 && value.stage <= stages.length;
  }
  function current() {
    const disk = store.get(key, null);
    if (valid(disk)) state = disk;
    return state;
  }
  current();
  function write(next) {
    state = next;
    store.set(key, state);
    const disk = store.get(key, null);
    saved = valid(disk) && disk.run === state.run && disk.stage === state.stage;
  }
  function start() {
    if (!current()) write({version:1, run:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2), stage:0});
    return {...state};
  }
  function restart() {
    write({version:1, run:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2), stage:0});
  }
  function checkpoint() {
    const progress = start();
    return {run:progress.run, stage:progress.stage};
  }
  function complete(match) {
    const attempt = match.opts.campaign, progress = current();
    if (match.result?.winner.side !== 0 || !attempt || !progress ||
      attempt.run !== progress.run || attempt.stage !== progress.stage || progress.stage >= stages.length ||
      match.opts.c1.id !== 'murat' || match.opts.c2.id !== stages[progress.stage].opponent) return false;
    write({...progress, stage:progress.stage + 1});
    return true;
  }
  return {stages, start, restart, checkpoint, complete, refresh:current,
    get progress(){return state ? {...state} : null;},
    get saved(){return saved;}
  };
})();

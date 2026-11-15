'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../game/js/campaign.js'),'utf8');
const disk=new Map();
function session(storage=disk) {
  const box={store:{
    get(key,fallback){try{return storage.has(key)?JSON.parse(storage.get(key)):fallback;}catch{return fallback;}},
    set(key,value){try{storage.set(key,JSON.stringify(value));}catch{}}
  }};
  vm.createContext(box);
  vm.runInContext(source+';this.campaign=Campaign;',box);
  return box.campaign;
}
function win(campaign,checkpoint=campaign.checkpoint(),side=0,opponent){
  const stage=campaign.stages[checkpoint.stage];
  return campaign.complete({opts:{campaign:checkpoint,c1:{id:'murat'},c2:{id:opponent||stage?.opponent}},result:{winner:{side}}});
}
let game=session();
assert.equal(game.progress,null);
assert.equal(game.stages.length,7);
assert.equal(new Set(game.stages.map(s=>s.opponent)).size,7);
assert.equal(game.stages.at(-1).opponent,'dragan');
assert(!win(game,game.checkpoint(),1),'Loss cannot advance a checkpoint');
assert.equal(game.progress.stage,0);
assert(game.saved);
const first=game.checkpoint();
assert(!win(game,first,0,'dragan'),'A stale mismatched opponent cannot advance the story');
assert(win(game,first));
assert(!win(game,first),'A repeated result is idempotent');
assert.equal(game.progress.stage,1);
game=session();assert.equal(game.progress.stage,1,'A new page restores the next fight');
const external=session(),old=game.checkpoint();
external.restart();
assert(!win(game,old),'An older tab cannot overwrite a newly started story');
assert.equal(game.progress.stage,0);
const chapters=new Set();
for(let i=0;i<7;i++){
  chapters.add(game.stages[i].chapter);
  assert.equal(game.progress.stage,i);
  assert(win(game));
}
assert.equal(chapters.size,3);
assert.equal(session().progress.stage,7);
const finished=game.checkpoint();assert(!win(game,finished),'A finished run cannot advance past its ending');
const copy=game.progress;copy.stage=0;assert.equal(game.progress.stage,7,'Callers cannot mutate saved progress');
disk.set('campaign-v1','{"version":1,"run":"bad","stage":-1}');
const recovered=session();assert.equal(recovered.progress,null);assert.equal(recovered.start().stage,0);
const blocked={has(){return false;},set(){throw Error('Storage blocked');}};
const offline=session(blocked);assert.equal(offline.start().stage,0);assert(!offline.saved);assert(win(offline));assert.equal(offline.progress.stage,1);
console.log('PASS: seven fights, three chapters, victory-only checkpoints, reload, duplicate/stale results, ending, invalid saves and blocked storage.');

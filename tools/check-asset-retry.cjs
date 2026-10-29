const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../game');
(async()=>{
 for(const mobile of [false,true]){
  const attempts=new Map();let fail=true;
  class TestImage{set src(src){if(!src)return;attempts.set(src,(attempts.get(src)||0)+1);queueMicrotask(()=>{if(fail&&/spritesheet|background(?:-mobile)?\.webp/.test(src))this.onerror?.();else this.onload?.();});}}
  const sb={console:{warn(){}},Image:TestImage,MOBILE:mobile,setTimeout,clearTimeout,document:{documentElement:{dataset:{}}}};vm.createContext(sb);
  for(const file of ['reforged-fighter-data','character-art','arena-art-data','arena-art'])vm.runInContext(fs.readFileSync(root+'/js/'+file+'.js','utf8'),sb);
  await vm.runInContext('Promise.all([CharacterArt.ready,ArenaArt.ready])',sb);
  assert.equal(await vm.runInContext("CharacterArt.prepare(['murat','nadine'])",sb),false);
  assert.equal(await vm.runInContext('ArenaArt.prepare(4)',sb),false);
  fail=false;
  assert.equal(await vm.runInContext("CharacterArt.prepare(['murat','nadine'])",sb),true);
  assert.equal(await vm.runInContext('ArenaArt.prepare(4)',sb),true);
  assert.equal(attempts.get('assets/fighters-reforged/murat/spritesheet'+(mobile?'-mobile':'')+'.webp'),2);
  assert.equal(attempts.get('assets/arenas-hd/kalk/background'+(mobile?'-mobile':'')+'.webp'),2);
 }
 console.log('PASS: real fighter/arena loaders retry a failed request, retain two active fighters and select desktop/mobile resolution.');
})().catch(e=>{console.error(e);process.exitCode=1;});

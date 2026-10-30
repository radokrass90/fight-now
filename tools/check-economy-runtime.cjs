const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createCanvas,Image}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../game'),calls=[],storage=new Map();let failNetwork=false;
const profile={id:'qa',username:null,coins:250,owned:['bat-01'],loadouts:{murat:'bat-01'},upgrades:{murat:{power:1}},stats:{wins:0,losses:0}};
class GameImage extends Image{set src(v){if(v)super.src=fs.readFileSync(path.join(root,v));}get naturalWidth(){return this.width;}get naturalHeight(){return this.height;}}
const sb={console,Image:GameImage,setTimeout,clearTimeout,AbortController,URLSearchParams,Math,addEventListener(){},document:{documentElement:{dataset:{}}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Snd:new Proxy({},{get:()=>()=>{}}),fetch:async(url,opts)=>{if(failNetwork)throw Error('offline');calls.push({url,body:opts.body&&JSON.parse(opts.body)});return{ok:true,json:async()=>url.endsWith('/guest')?{token:'qa-token',profile}:url.endsWith('/matches/start')?{matchId:'qa-match',profile,loadout:{weaponId:'bat-01',upgrades:{power:1}}}:url.endsWith('/matches/finish')?{reward:160,profile:{...profile,coins:410}}:profile};}};
vm.createContext(sb);vm.runInContext(fs.readFileSync(root+'/js/core.js','utf8').split('// ---------- синтезирани')[0],sb);
for(const file of ['i18n','language','data','render','combat-fx','weapon-data','economy','weapon-art','reforged-fighter-data','character-art','fight','finishers'])vm.runInContext(fs.readFileSync(root+'/js/'+file+'.js','utf8'),sb);
const run=code=>vm.runInContext(code,sb);
(async()=>{
 await run('Economy.ready');assert.equal(run('Economy.profile.coins'),250);assert(storage.has('fightersgame_token'));
 const catalog=run('WEAPON_CATALOG.weapons');assert.equal(catalog.length,100);assert.equal(new Set(catalog.map(w=>w.id)).size,100);
 const hashes=catalog.map(w=>crypto.createHash('sha256').update(fs.readFileSync(root+'/'+w.icon)).digest('hex'));assert.equal(new Set(hashes).size,100);
 for(const w of catalog){assert(w.name.en&&w.name.de&&w.price>0&&w.reach>0);assert(!/[А-Яа-я]/.test(w.name.en+w.name.de));}
 await run('CharacterArt.ready');await run("CharacterArt.prepare(['murat','nadine'])");
 const c=createCanvas(960,540);sb.testCtx=c.getContext('2d');
 let rendered=0;
 for(const w of catalog){sb.weaponId=w.id;const image=run('WeaponArt.prepare(weaponId)');if(!image.complete)await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;});
  run(`{const m=new Match({mode:'training',arena:0,c1:CHARS[0],c2:CHARS[7],ctrl1:{type:'human'},ctrl2:{type:'dummy'},economy:{loadout:{weaponId,upgrades:{power:5,guard:5,focus:5}}}});const [a,b]=m.p;a.state='idle';a.x=450;a.y=0;const base=Math.round(100*a.c.power*b.c.def);b.hp=1000;const dealt=m.damage(a,b,100);if(dealt<=base||a.equipment.reach<=0||a.equipment.focus<=1)throw Error('Purchased weapon/upgrade not applied');testCtx.clearRect(0,0,960,540);const art=CharacterArt.draw(testCtx,a);const before=testCtx.getImageData(300,200,400,320).data;WeaponArt.draw(testCtx,a,art);const after=testCtx.getImageData(300,200,400,320).data;let changed=0;for(let px=0;px<before.length;px+=4)if(before[px]!==after[px]||before[px+1]!==after[px+1]||before[px+2]!==after[px+2])changed++;if(changed<20)throw Error('Weapon is not visibly drawn: '+weaponId+' '+changed);this.weaponStats=a.equipment;}`);
  assert(sb.weaponStats.weapon.id===w.id);rendered++;
 }
 // Snapshot survives rounds and never mutates shared character definitions.
 assert.equal(run('CHARS[0].equipment'),undefined);run(`for(const c of CHARS){const m=new Match({mode:'training',arena:0,c1:c,c2:CHARS[7],ctrl1:{type:'human'},ctrl2:{type:'dummy'},economy:{loadout:{weaponId:'bat-01',upgrades:{power:1}}}});m.startRound();if(m.p[0].equipment.weapon.id!=='bat-01'||m.p[0].equipment.power<=1)throw Error('Round reset lost equipment for '+c.id);}`);
 const begin=await run("Economy.begin({mode:'versus',c1:CHARS[0],c2:CHARS[7],ctrl2:{level:'normal'}})");assert.equal(begin.matchId,'qa-match');assert.equal(begin.loadout.weaponId,'bat-01');
 const starts=calls.filter(c=>c.url.endsWith('/matches/start')).length;await run("Economy.begin({mode:'training',c1:CHARS[0],c2:CHARS[7],ctrl2:{}})");assert.equal(calls.filter(c=>c.url.endsWith('/matches/start')).length,starts);
 sb.finished={mode:'versus',opts:{economy:{matchId:'qa-match'}},result:{winner:{side:0}}};run('Economy.finish(finished)');await new Promise(r=>setImmediate(r));assert.equal(sb.finished.reward.amount,160);run('Economy.finish(finished)');assert.equal(calls.filter(c=>c.url.endsWith('/matches/finish')).length,1);
 // Offline play cannot invent coins or buy locally; cached ownership remains accessible.
 failNetwork=true;await assert.rejects(run("Economy.buy('bat-02')"));assert.equal(run('Economy.profile.coins'),410);assert.equal(run('Economy.gear("murat").weaponId'),'bat-01');assert.equal(run('Economy.online'),false);
 console.log('PASS: 100 unique DE/EN weapon designs decode and draw in actual fighter renderer; damage/reach/focus apply, cloud snapshot survives rounds, training cannot earn, reward callback is idempotent, offline purchases cannot alter coins.');
 fs.mkdirSync(path.resolve(root,'../review/economy'),{recursive:true});fs.writeFileSync(path.resolve(root,'../review/economy/runtime.json'),JSON.stringify({weapons:100,uniqueDesigns:100,actualWeaponRenders:rendered,offlineBalanceUnchanged:true,trainingRewards:false},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});

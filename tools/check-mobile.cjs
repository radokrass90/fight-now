const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path'),root=path.resolve(__dirname,'../game');
class Control{
 constructor(key){this.dataset={k:key};this.style={};this.handlers={};this.on=false;this.classList={add:()=>{this.on=true;},remove:()=>{this.on=false;}};}
 addEventListener(k,f){(this.handlers[k]??=[]).push(f);}
 setPointerCapture(){}
 getBoundingClientRect(){return {left:0,top:0,width:100,height:100};}
 fire(k,id,x=50,y=50){for(const f of this.handlers[k]||[])f({pointerId:id,clientX:x,clientY:y,preventDefault(){}});}
}
const stick=new Control(),knob=new Control(),punch=new Control('lp'),block=new Control('bl');
const sb={console,stick,knob,buttons:[punch,block],Touch:{pressed:new Set()},Keys:{down:new Set(),pressed:new Set()}};
vm.createContext(sb);vm.runInContext(fs.readFileSync(root+'/js/touch-controls.js','utf8')+';this.binding=bindTouchControls(stick,knob,buttons,()=>{});',sb);
stick.fire('pointerdown',1,90,50);punch.fire('pointerdown',2);assert(sb.Touch.r);assert.equal(sb.Touch.lp,1);assert(sb.Touch.pressed.has('lp'));
punch.fire('pointerup',2);assert.equal(sb.Touch.lp,0);assert(sb.Touch.r,'Attack release must not release movement');
stick.fire('lostpointercapture',1);assert.equal(sb.Touch.r,0);
block.fire('pointerdown',3);block.fire('pointerdown',4);block.fire('pointerup',3);assert.equal(sb.Touch.bl,1,'Second finger still owns block');block.fire('pointercancel',4);assert.equal(sb.Touch.bl,0);
stick.fire('pointerdown',5,50,0);stick.fire('pointerdown',6,0,50);assert(sb.Touch.u);assert(!sb.Touch.l,'Second finger cannot steal stick');
sb.binding.reset();assert.equal(sb.Touch.u,0);assert.equal(sb.Touch.bl,0);assert.equal(sb.Touch.pressed.size,0);
// Only small portraits/thumbnails load at boot. Switching opponents releases
// previous full atlases, while all thirty poses remain available for the pair.
const urls=[];class FakeImage{set src(v){this.url=v;if(v){urls.push(v);queueMicrotask(()=>this.onload?.());}}}
const art={console,Image:FakeImage,setTimeout,clearTimeout,MOBILE:true,document:{documentElement:{dataset:{}}}};
vm.createContext(art);for(const f of ['character-art-data','extra-pose-data','character-art','arena-art-data','arena-art'])vm.runInContext(fs.readFileSync(root+'/js/'+f+'.js','utf8'),art);
(async()=>{
 await vm.runInContext('Promise.all([CharacterArt.ready,ArenaArt.ready])',art);
 assert.equal(urls.length,30);assert(urls.every(u=>/portrait|thumbnail/.test(u)));
 await vm.runInContext("CharacterArt.prepare(['murat','yasmin'])",art);
 assert.equal(urls.filter(u=>u.includes('-mobile.webp')).length,4);
 await vm.runInContext("CharacterArt.prepare(['dragan','nadine'])",art);
 const resident=vm.runInContext('[...CharacterArt.entries.values()].filter(e=>e.imageLoaded).map(e=>e.data.id)',art);
 assert.deepEqual(Array.from(resident),['dragan','nadine']);
 await vm.runInContext('ArenaArt.prepare(0)',art);await vm.runInContext('ArenaArt.prepare(7)',art);
 assert.equal(vm.runInContext('[...ArenaArt.entries.values()].filter(e=>e.imageLoaded).length',art),1);
 const sharp=require('sharp');let newBytes=0,oldBytes=0,network=0;
 for(const id of ['dragan','nadine'])for(const n of ['spritesheet','extra-20']){
  const before=await sharp(root+'/assets/characters-hd/'+id+'/'+n+'.webp').metadata();
  const after=await sharp(root+'/assets/characters-hd/'+id+'/'+n+'-mobile.webp').metadata();
  assert.equal(after.width,1280);oldBytes+=before.width*before.height*4;newBytes+=after.width*after.height*4;network+=fs.statSync(root+'/assets/characters-hd/'+id+'/'+n+'-mobile.webp').size;
 }
 assert(newBytes<=16*1024*1024);
 console.log('PASS: multi-touch movement + attacks, per-finger ownership, cancellation, lost capture, reset.');
 console.log('PASS: 30 small boot images; only two active fighters and one full arena retained.');
 console.log(JSON.stringify({fighterDecodedMB:newBytes/1024/1024,previousPairMB:oldBytes/1024/1024,pairDownloadMB:network/1024/1024}));
})().catch(e=>{console.error(e);process.exitCode=1;});
// Track changes retain the same media element that a real tap activated.
const media=[];class AudioStub{constructor(){this.dataset={};this.currentTime=0;media.push(this);}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
const music={Audio:AudioStub,MOBILE:true,Snd:{on:true,musicOn:true},document:{body:{appendChild(){}},addEventListener(){},hidden:false},console};vm.createContext(music);vm.runInContext(fs.readFileSync(root+'/js/battle-music.js','utf8'),music);
vm.runInContext('for(let i=0;i<15;i++)BattleMusic.start(i,1);BattleMusic.start(1,3);',music);assert.equal(media.length,1);assert.equal(vm.runInContext('BattleMusic.cache.size',music),1);
console.log('PASS: one reusable mobile music element across all arenas and final-round music.');

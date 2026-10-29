const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,Image}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../game'),loads=[];
class GameImage extends Image{
 set src(v){this.file=v;if(!v)return;loads.push(v);super.src=fs.readFileSync(path.join(root,v));}
 get src(){return this.file;}
 get naturalWidth(){return this.width;}
 get naturalHeight(){return this.height;}
}
async function run(mobile){
 const sb={console,Image:GameImage,setTimeout,clearTimeout,URLSearchParams,location:{search:'?lang=en'},localStorage:{getItem(){return null;},setItem(){}},document:{documentElement:{dataset:{}}},navigator:{maxTouchPoints:mobile?1:0},matchMedia:()=>({matches:false})};vm.createContext(sb);
 vm.runInContext(fs.readFileSync(root+'/js/core.js','utf8').split('// ---------- синтезирани')[0],sb);
 for(const name of ['i18n','language','data','render','reforged-fighter-data','character-art'])vm.runInContext(fs.readFileSync(root+'/js/'+name+'.js','utf8'),sb);
 await vm.runInContext('CharacterArt.ready',sb);
 assert.equal(sb.document.documentElement.dataset.renderer,'reforged-30');
 assert.equal(vm.runInContext('CharacterArt.entries.size',sb),15);
 const canvas=createCanvas(960,540),ctx=canvas.getContext('2d');sb.testCtx=ctx;
 const shapes=[['idle'],['block'],['crouch'],['jump',null,1],['move','jab',1],['move','cross',1],['move','lowkick',1],['move','hk',1],['hit'],['win'],...Array.from({length:6},(_,i)=>['walk',null,i]),['move','jab',0],['recover','jab'],['move','cross_c',1],['recover','cross'],['move','hook',1],['move','upper',1],['move','rh_c',1],['recover','hk'],['move','knee',1],['cblock'],['hitLow'],['air'],['down'],['getup']];
 sb.shapes=shapes;let rendered=0;
 for(let i=0;i<15;i++){
  await vm.runInContext(`CharacterArt.prepare([CHARS[${i}].id,CHARS[${(i+1)%15}].id])`,sb);
  assert.equal(vm.runInContext('[...CharacterArt.entries.values()].filter(e=>e.imageLoaded).length',sb),2);
  sb.charIndex=i;
  vm.runInContext(`{
   const c=CHARS[charIndex],seen=[];
   for(let index=0;index<shapes.length;index++){
    const [state,pose,hold]=shapes[index];
    const f={c,x:450,y:0,facing:1,sc:1,state,st:0,vx:2,vy:0,pose:fullPose(c.stance,pose||'block')};
    if(state==='walk')f.walkPh=(hold+.1)/6*Math.PI*2;
    if(state==='move'){f.move={};f.mt=1;f.mc={segs:[{p:pose,s:0,e:5,hold:hold?3:0}]};}
    if(state==='recover'){f.state='move';f.move={};f.mt=6;f.mc={segs:[{p:pose,s:0,e:5,hold:3},{p:null,s:5,e:20}]};}
    if(state==='hitLow'){f.state='hit';f.hitLow=true;}
    if(state==='down')f.lying=true;
    if(state==='getup')f.st=2;
    const frame=CharacterArt.frameFor(f);if(frame!==index)throw Error(c.id+' expected frame '+index+', got '+frame);
    testCtx.clearRect(0,0,960,540);CharacterArt.reflection(testCtx,f);if(!CharacterArt.draw(testCtx,f))throw Error('Failed render '+c.id+'/'+index);
    seen.push(frame);
   }
   this.drawn=seen;
  }`,sb);
  assert.equal(sb.drawn.length,30);rendered+=sb.drawn.length;
 }
 const suffix=mobile?'-mobile.webp':'.webp';
 const actual=vm.runInContext('[...CharacterArt.entries.values()].filter(e=>e.imageLoaded).flatMap(e=>[e.image,e.extra]).reduce((n,img)=>n+img.width*img.height*4,0)',sb);
 assert.equal(actual,mobile?15*1024*1024:60*1024*1024);
 assert(loads.filter(p=>/spritesheet|extra-20/.test(p)).some(p=>p.endsWith(suffix)));
 return {mobile,rendered,activeFighters:2,decodedAtlasMiB:actual/1024/1024};
}
(async()=>{
 const results=[await run(false),await run(true)];
 assert(loads.every(p=>p.startsWith('assets/fighters-reforged/')),'Old fighter art loaded');
 fs.mkdirSync(path.resolve(root,'../review'),{recursive:true});
 fs.writeFileSync(path.resolve(root,'../review/art-runtime.json'),JSON.stringify({results,oldFighterLoads:0},null,2)+'\n');
 console.log(JSON.stringify({results,oldFighterLoads:0,actualRenderer:'reforged-30'}));
})().catch(e=>{console.error(e);process.exitCode=1;});

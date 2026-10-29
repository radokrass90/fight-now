const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {createCanvas,Image}=require('@napi-rs/canvas');const root=path.resolve(__dirname,'../game');
class GameImage extends Image{set src(value){super.src=fs.readFileSync(path.join(root,value));}get src(){return super.src;}}
function setup(reduced=false){const sb={console,Image:GameImage,matchMedia:()=>({matches:reduced}),Snd:new Proxy({},{get:()=>()=>{}}),localStorage:{getItem(){return null;},setItem(){}},Math};vm.createContext(sb);
 const core=fs.readFileSync(root+'/js/core.js','utf8').split('// ---------- синтезирани')[0];vm.runInContext(core,sb);
 for(const file of ['data','render','combat-fx','fight'])vm.runInContext(fs.readFileSync(root+'/js/'+file+'.js','utf8'),sb);return sb;}
(async()=>{
 const sb=setup();await new Promise(r=>setTimeout(r,20));
 vm.runInContext(`
 const m=new Match({mode:'versus',arena:0,c1:CHARS[0],c2:CHARS[7],ctrl1:{type:'human'},ctrl2:{type:'dummy'}});
 m.phase='play';const [a,b]=m.p;a.x=400;b.x=465;a.state='idle';b.state='idle';
 const before=b.hp;m.resolveHit(a,b,{d:80,l:'m',st:20,kb:6,r:20,limb:'fh'},450,350,false);
 this.result={damage:before-b.hp,shake:m.shake,hitstop:m.hitstop,impact:m.fx.some(f=>f.k==='impact3d'),power:m.impactFocus.power};
 this.match=m;this.fx=CombatFX;
 `,sb);
 assert(sb.result.damage>0);assert.equal(sb.result.shake,13);assert.equal(sb.result.hitstop,10);assert.equal(sb.result.power,2);assert(sb.result.impact);
 const canvas=createCanvas(960,540),ctx=canvas.getContext('2d');ctx.fillStyle='#172033';ctx.fillRect(0,0,960,540);
 for(const f of sb.match.fx){f.life=f.max*.7;sb.fx.drawParticle(ctx,f);}sb.fx.overlay(ctx,sb.match);
 fs.writeFileSync(path.join(root,'assets/effects/impact-preview.png'),canvas.toBuffer('image/png'));
 const c1=sb.fx.camera(sb.match),c2=sb.fx.camera(sb.match);assert.deepEqual(c1,c2,'Paused camera must not sample randomness');
 for(let i=0;i<60;i++)sb.fx.emit(sb.match,450,350,{power:4});assert(sb.match.fx.length<=sb.fx.maxParticles);
 sb.fx.toggle();assert.equal(sb.fx.camera(sb.match).dx,0);assert.equal(sb.fx.camera(sb.match).roll,0);
 const reduced=setup(true);vm.runInContext('this.test=CombatFX.camera({T:10,shake:23,phase:"ko",impactFocus:{age:0,life:20,power:4}})',reduced);assert.equal(reduced.test.dx,0);assert.equal(reduced.test.zoom,1.08);
 vm.runInContext(`b.hp=1000;b.state='block';b.meter=0;m.fx=[];m.resolveHit(a,b,{d:80,l:'m',st:20,kb:6},450,350,false);this.blockResult={hp:b.hp,blocked:m.impactFocus.blocked};`,sb);
 assert.equal(sb.blockResult.hp,1000);assert(sb.blockResult.blocked);
 console.log(JSON.stringify({heavyHit:sb.result,block:sb.blockResult,particleLimit:true,reducedMotion:true,deterministicCamera:true,renderedPreview:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});

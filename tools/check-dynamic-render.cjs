const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,Image}=require('@napi-rs/canvas'),root=path.resolve(__dirname,'../game');
class GameImage extends Image{set src(v){if(v)super.src=fs.readFileSync(path.join(root,v));}get naturalWidth(){return this.width;}get naturalHeight(){return this.height;}}
const sb={console,Image:GameImage,setTimeout,clearTimeout,Math,URLSearchParams,localStorage:{getItem(){return null;},setItem(){}},document:{documentElement:{dataset:{}}},Snd:new Proxy({},{get:()=>()=>{}})};vm.createContext(sb);
vm.runInContext(fs.readFileSync(root+'/js/core.js','utf8').split('// ---------- синтезирани')[0],sb);
for(const name of ['i18n','language','data','render','combat-fx','combat-motion','weapon-data','weapon-art','reforged-fighter-data','character-art','fight','finishers'])vm.runInContext(fs.readFileSync(root+'/js/'+name+'.js','utf8'),sb);
const run=s=>vm.runInContext(s,sb);run('const Economy={weapons:new Map(WEAPON_CATALOG.weapons.map(w=>[w.id,w])),apply(){}};');
(async()=>{
 await run('CharacterArt.ready');const sheet=createCanvas(1440,1100),ctx=sheet.getContext('2d');ctx.fillStyle='#131d2b';ctx.fillRect(0,0,1440,1100);sb.ctx=ctx;
 const poses=[];let rendered=0;const began=Date.now();
 for(let row=0;row<5;row++){
  sb.charIndex=[0,1,6,7,13][row];sb.weaponId=['bat-01','sword-03','hammer-05','chain-04','spear-02'][row];
  await run('CharacterArt.prepare([CHARS[charIndex].id])');const img=run('WeaponArt.prepare(weaponId)');await img.decode();
  sb.row=row;
  const info=run(`{
   const m=new Match({mode:'training',arena:0,c1:CHARS[charIndex],c2:CHARS[7],ctrl1:{type:'human'},ctrl2:{type:'dummy'}}),a=m.p[0];a.x=0;a.state='idle';a.equipment={weapon:Economy.weapons.get(weaponId)};m.startMove(a,weaponNormal(a,'HP'));
   const wind=a.mc.segs.find(s=>s.hold)?.s||8;const times=[1,Math.max(2,Math.floor(wind*.5)),wind-1,wind+1,wind+3,wind+8],data=[];
   times.forEach((mt,i)=>{a.mt=mt;a.pose=m.movePose(a);a.motionTick=mt;ctx.save();ctx.translate(100+i*240,218+row*220-478);const art=drawFighter(ctx,a);ctx.restore();data.push({mt,frame:art.frameIndex,hand:art.hand,motion:art.motion});});data;
  }`);poses.push(info);
  ctx.font='13px sans-serif';ctx.fillStyle='#d7eaf1';ctx.fillText(run('CHARS[charIndex].name')+' / '+sb.weaponId,12,row*220+18);rendered+=6;
 }
 assert(poses.flat().every(p=>Object.values(p.motion).filter(v=>typeof v==='number').every(Number.isFinite)));
 assert(poses.flat().some(p=>Math.abs(p.motion.handDX)>.3),'No arm in-between deformation was exercised');
 const out=path.resolve(root,'../review/dynamic-combat');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/strike-timelines.png',sheet.toBuffer('image/png'));fs.writeFileSync(out+'/render.json',JSON.stringify({rendered,elapsedMs:Date.now()-began,poses},null,2));console.log('PASS: actual painted motion/weapon renders: '+rendered+' in '+(Date.now()-began)+'ms');
})().catch(e=>{console.error(e);process.exitCode=1;});

const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'../game');
const sandbox={console,window:{},document:{documentElement:{dataset:{}}},Image:class{set src(v){this.onload?.();}},D2R:Math.PI/180};
vm.createContext(sandbox);
for(const file of ['data','character-art-data','extra-pose-data','character-art','fight'])vm.runInContext(fs.readFileSync(root+'/js/'+file+'.js','utf8'),sandbox);
vm.runInContext(`
 const f={c:CHARS[0],state:'walk',facing:1,vx:2,pose:CHARS[0].stance};
 const forward=[],backward=[];
 for(let i=0;i<6;i++){f.walkPh=(i+.1)/6*Math.PI*2;forward.push(CharacterArt.frameFor(f));f.vx=-2;backward.push(CharacterArt.frameFor(f));f.vx=2;}
 window.testResult={forward,backward};
 f.state='move';f.move={};f.mc={segs:[{p:'jab_c',s:0,e:5},{p:'jab',s:5,e:8},{p:'jab',s:8,e:11,hold:1},{p:null,s:11,e:20}]};
 window.testResult.attack=[5,6,8,9,11,12,19,20].map(t=>{f.mt=t;return CharacterArt.frameFor(f);});
 f.state='cblock';window.testResult.lowBlock=CharacterArt.frameFor(f);
 f.state='down';f.lying=true;window.testResult.down=CharacterArt.frameFor(f);
 f.state='getup';f.st=2;window.testResult.rise=CharacterArt.frameFor(f);
 window.testResult.count=EXTRA_POSE_DATA.characters.length;
 window.testResult.frames=EXTRA_POSE_DATA.characters.reduce((n,c)=>n+c.frames.length,0);
 window.testResult.manifest=EXTRA_POSE_DATA;
`,sandbox);
const r=JSON.parse(JSON.stringify(sandbox.window.testResult));
assert.deepEqual(r.forward,[10,11,12,13,14,15]);assert.deepEqual(r.backward,[15,14,13,12,11,10]);
assert.deepEqual(r.attack,[0,16,16,4,4,17,0,0]);assert.equal(r.lowBlock,25);assert.equal(r.down,28);assert.equal(r.rise,29);
if(process.argv.includes('--complete')){assert.equal(r.count,15);assert.equal(r.frames,300);}
for(const c of r.manifest.characters){assert.equal(c.frames.length,20);assert.equal(new Set(c.frames.map(f=>f.name)).size,20);
 assert(fs.existsSync(root+'/assets/characters-hd/'+c.id+'/extra-20.webp'));
 for(const f of c.frames){assert(f.bounds.x>=0&&f.bounds.y>=0);assert(f.bounds.x+f.bounds.w<=512.1);assert(Math.abs(f.bounds.y+f.bounds.h-464)<.01);}
}
console.log(JSON.stringify({...r,manifest:undefined},null,2));

vm.runInContext(`
 let sampled=0;
 for(const c of CHARS)for(const move of Object.values(c.moves)){
  const f={c,state:'move',move,mc:compileMove(move),pose:c.stance,y:0};
  for(let t=0;t<=f.mc.len;t++){
   f.mt=t;const frame=CharacterArt.frameFor(f);
   if(!Number.isInteger(frame)||frame<0||frame>29)throw Error(c.id+' invalid frame '+frame);
   sampled++;
  }
 }
 window.sampled=sampled;
`,sandbox);
console.log('Normal attack timeline samples:',sandbox.window.sampled);
(async()=>{
 const sharp=require('sharp');let checked=0;
 for(const c of r.manifest.characters){
  const {data,info}=await sharp(root+'/assets/characters-hd/'+c.id+'/extra-20.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,2560);assert.equal(info.height,2048);
  for(let frame=0;frame<20;frame++){
   const ox=frame%5*512,oy=Math.floor(frame/5)*512;let count=0,bottom=-1;
   for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(data[((oy+y)*info.width+ox+x)*4+3]>32){count++;bottom=y;}
   assert(count>1000,c.id+' empty frame '+frame);
   assert(bottom>=459&&bottom<=465,c.id+' foot baseline '+frame+': '+bottom);
   checked++;
  }
 }
 console.log('Decoded nonempty transparent frames with aligned baselines:',checked);
})().catch(e=>{console.error(e);process.exitCode=1;});

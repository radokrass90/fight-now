/* Extract generated sprite strips without redrawing or replacing their alpha.
 * Each source strip has ONE scale; all strips share the 512 / (220,464) contract.
 * Run: node tools/build-reforged-fighters.cjs --only murat
 *      node tools/build-reforged-fighters.cjs --complete
 *      node tools/build-reforged-fighters.cjs --audit
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {PNG}=require('pngjs'),sharp=require('sharp'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.resolve(__dirname,'../game/assets/fighters-reforged'),SOURCES=path.join(ROOT,'sources');
const SIZE=512,PIVOT={x:220,y:464},PAD=8,HEIGHT=354;
const BASE=['idle','block','crouch','jump','light_punch','heavy_punch','light_kick','heavy_kick','hit','victory'];
const EXTRA=['walk_contact','walk_down','walk_pass','walk_up','walk_opposite','walk_return','jab_load','jab_return','cross_load','cross_return','hook','uppercut','kick_chamber','kick_return','knee','low_block','body_hit','fall','ground','rise'];
const NAMES=BASE.concat(EXTRA);
const rosterContext={};vm.createContext(rosterContext);
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../game/js/character-art-data.js'),'utf8')+';this.roster=CHARACTER_ART_DATA.characters;',rosterContext);
const ROSTER=rosterContext.roster.map(({id,name,height})=>({id,name,height}));
const args=process.argv.slice(2),onlyAt=args.indexOf('--only');
const ONLY=onlyAt<0?null:new Set((args[onlyAt+1]||'').split(',').filter(Boolean));
if(ONLY&&(!ONLY.size||[...ONLY].some(id=>!ROSTER.some(c=>c.id===id))))throw Error('--only must name roster IDs, e.g. --only murat,yasmin');
const AUDIT=args.includes('--audit'),COMPLETE=AUDIT||args.includes('--complete');
const configFile=path.join(ROOT,'source-layout.json');
const CONFIG=fs.existsSync(configFile)?JSON.parse(fs.readFileSync(configFile,'utf8')):{characters:{}};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const exists=file=>fs.existsSync(file);
const pending=c=>({...c,status:'pending',frameCount:0,base:null,extra:null,mobileBase:null,mobileExtra:null,portrait:null,frames:[],qc:{reviewed:false,issues:[]}});
const median=values=>{const a=[...values].sort((a,b)=>a-b);return a.length%2?a[Math.floor(a.length/2)]:(a[a.length/2-1]+a[a.length/2])/2;};
function componentBounds(png){
 const {width:w,height:h,data}=png,labels=new Int32Array(w*h),queue=new Int32Array(w*h),parts=[];let label=0,transparent=0;
 for(let i=0;i<w*h;i++)if(data[i*4+3]===0)transparent++;
 if(transparent<w*h*.08)throw Error('Source lacks a genuinely transparent canvas; do not chroma-key or redraw it silently.');
 for(let start=0;start<w*h;start++){
  if(labels[start]||data[start*4+3]<32)continue;
  label++;let head=0,tail=1,x0=w,y0=h,x1=0,y1=0;labels[start]=label;queue[0]=start;
  while(head<tail){
   const at=queue[head++],x=at%w,y=Math.floor(at/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=x+dx,yy=y+dy,n=yy*w+xx;
    if(xx<0||yy<0||xx>=w||yy>=h||labels[n]||data[n*4+3]<32)continue;
    labels[n]=label;queue[tail++]=n;
   }
  }
  parts.push({label,area:tail,x:x0,y:y0,w:x1-x0+1,h:y1-y0+1});
 }
 return {labels,parts,transparentFraction:transparent/(w*h)};
}
function groupRows(parts,rows,height,cols){
 // Start with equal row centers, then adapt to the detected figures. A lying
 // pose belongs to the final row by its visual center, not a blindly cut cell.
 let centers=Array.from({length:rows},(_,r)=>(r+.5)*height/rows),groups;
 for(let iteration=0;iteration<12;iteration++){
  groups=centers.map(()=>[]);
  for(const p of parts){const cy=p.y+p.h/2;let best=0;for(let r=1;r<rows;r++)if(Math.abs(cy-centers[r])<Math.abs(cy-centers[best]))best=r;groups[best].push(p);}
  centers=centers.map((center,r)=>groups[r].length?groups[r].reduce((sum,p)=>sum+p.y+p.h/2,0)/groups[r].length:center);
 }
 if(groups.some(g=>g.length!==cols))throw Error(`Expected ${cols} figures in each of ${rows} rows; got ${groups.map(g=>g.length).join('/')}. Connected figures or a missing pose need source correction.`);
 return groups.flatMap((g,row)=>g.sort((a,b)=>a.x+a.w/2-b.x-b.w/2).map((p,column)=>({...p,row,column})));
}
async function readStrip(file,rows,cols=5){
 const bytes=fs.readFileSync(file),png=PNG.sync.read(bytes),seg=componentBounds(png);
 const maxArea=Math.max(...seg.parts.map(p=>p.area));
 const main=seg.parts.filter(p=>p.area>=Math.max(800,maxArea*.18));
 if(main.length!==rows*cols)throw Error(`${path.basename(file)}: expected ${rows*cols} complete figures, found ${main.length}. Major bounds: ${JSON.stringify(main)}`);
 const ordered=groupRows(main,rows,png.height,cols);
 // Keep sizeable detached props when they clearly belong to one fighter.
 // Tiny detached generation debris is not treated as another animation pose.
 for(const p of ordered){
  p.labels=[p.label];p.fragments=[];
  for(const fragment of seg.parts){
   if(main.some(q=>q.label===fragment.label)||fragment.area<16)continue;
   const cx=fragment.x+fragment.w/2,cy=fragment.y+fragment.h/2;
   const nearest=ordered.reduce((best,q)=>{
    const distance=(cx-(q.x+q.w/2))**2+(cy-(q.y+q.h/2))**2;
    return !best||distance<best.distance?{part:q,distance}:best;
   },null);
   if(nearest.part.label===p.label&&cx>=p.x-12&&cx<=p.x+p.w+12&&cy>=p.y-12&&cy<=p.y+p.h+12){p.labels.push(fragment.label);p.fragments.push(fragment);}
  }
 }
 return {file,bytes,png,...seg,ordered,sha256:hash(bytes)};
}
function sourceAnchor(strip,part,index){
 const {png,labels}=strip,ids=new Set(part.labels);let method='hip-band';
 let x0=part.x,x1=part.x+part.w,y0=part.y+Math.floor(part.h*.50),y1=part.y+Math.floor(part.h*.65);
 if([3,27,28].includes(index))return {x:part.x+part.w/2,y:part.y+part.h,method:index===3?'air-center':'horizontal-center'};
 if([6,7,22,23,24].includes(index)){y0=part.y+Math.floor(part.h*.92);y1=part.y+part.h;method='support-foot';}
 const histogram=new Float64Array(part.w);let count=0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(ids.has(labels[y*png.width+x])){histogram[x-part.x]++;count++;}
 if(!count)return {x:part.x+part.w/2,y:part.y+part.h,method:'bounds-center-fallback'};
 let sum=0,middle=part.w/2;
 for(let x=0;x<histogram.length;x++){sum+=histogram[x];if(sum>=count/2){middle=x;break;}}
 return {x:part.x+middle,y:part.y+part.h,method};
}
function alphaBounds(png){
 let x0=png.width,y0=png.height,x1=-1,y1=-1,count=0;
 for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++)if(png.data[(y*png.width+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);count++;}
 if(x1<0)throw Error('Empty sprite after component extraction');
 return {x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,pixels:count};
}
function extract(strip,part){
 const {png,labels}=strip,pad=3,all=[part,...part.fragments],left=Math.min(...all.map(p=>p.x)),top=Math.min(...all.map(p=>p.y)),right=Math.max(...all.map(p=>p.x+p.w)),bottom=Math.max(...all.map(p=>p.y+p.h)),x0=Math.max(0,left-pad),y0=Math.max(0,top-pad),w=Math.min(png.width-x0,right-left+pad*2),h=Math.min(png.height-y0,bottom-top+pad*2);
 const cut=new PNG({width:w,height:h}),ids=new Set(part.labels);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const sx=x0+x,sy=y0+y,at=sy*png.width+sx,alpha=png.data[at*4+3];if(!alpha)continue;
  let belongs=ids.has(labels[at]);
  // Recover the original low-alpha edge pixels; their alpha is copied intact.
  if(!belongs&&alpha<32)for(let dy=-2;dy<=2&&!belongs;dy++)for(let dx=-2;dx<=2;dx++){
   const xx=sx+dx,yy=sy+dy;if(xx>=0&&yy>=0&&xx<png.width&&yy<png.height&&ids.has(labels[yy*png.width+xx])){belongs=true;break;}
  }
  if(belongs)png.data.copy(cut.data,(y*w+x)*4,at*4,at*4+4);
 }
 const b=alphaBounds(cut),tight=new PNG({width:b.w,height:b.h});
 for(let y=0;y<b.h;y++)cut.data.copy(tight.data,y*b.w*4,((b.y+y)*w+b.x)*4,((b.y+y)*w+b.x+b.w)*4);
 return {png:tight,bytes:PNG.sync.write(tight),sourceBounds:{x:x0+b.x,y:y0+b.y,w:b.w,h:b.h},mainBounds:part};
}
function stripScale(frames,referenceIndices){
 const reference=frames.filter(f=>referenceIndices.includes(f.index)).map(f=>f.part.h);
 const heights=reference.length?reference:frames.map(f=>f.part.h);
 const referenceHeight=median(heights);let scale=HEIGHT/referenceHeight;
 for(const f of frames){
  const anchor=f.anchor.x-f.cut.sourceBounds.x,w=f.cut.png.width,h=f.cut.png.height;
  if(anchor>0)scale=Math.min(scale,(PIVOT.x-PAD)/anchor);
  if(w-anchor>0)scale=Math.min(scale,(SIZE-PAD-PIVOT.x)/(w-anchor));
  scale=Math.min(scale,(PIVOT.y-16)/h);
 }
 return {scale,referenceHeight,targetHeight:HEIGHT};
}
async function normalize(frame,scale){
 const width=Math.max(1,Math.round(frame.cut.png.width*scale)),height=Math.max(1,Math.round(frame.cut.png.height*scale));
 const resized=await sharp(frame.cut.bytes).resize(width,height,{kernel:'lanczos3'}).png().toBuffer(),image=PNG.sync.read(resized),b=alphaBounds(image);
 const anchor=(frame.anchor.x-frame.cut.sourceBounds.x)*scale-b.x;
 const x=Math.round(PIVOT.x-anchor),y=PIVOT.y-b.h;
 if(x<PAD-1||x+b.w>SIZE-PAD+1||y<15)throw Error(`Normalization would clip ${NAMES[frame.index]}: ${JSON.stringify({x,y,w:b.w,h:b.h,scale})}`);
 const sprite=await sharp(resized).extract({left:b.x,top:b.y,width:b.w,height:b.h}).toBuffer();
 const png=await sharp({create:{width:SIZE,height:SIZE,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:sprite,left:x,top:y}]).png().toBuffer();
 return {png,bounds:{x,y,w:b.w,h:b.h}};
}
async function pack(frames,dir,kind){
 const rows=kind==='base'?2:4,name=kind==='base'?'spritesheet':'extra-20';
 const atlas=await sharp({create:{width:SIZE*5,height:SIZE*rows,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
  .composite(frames.map((f,i)=>({input:f.png,left:i%5*SIZE,top:Math.floor(i/5)*SIZE}))).png().toBuffer();
 await sharp(atlas).webp({quality:94,alphaQuality:100}).toFile(path.join(dir,name+'.webp'));
 await sharp(atlas).resize(SIZE*5/2,SIZE*rows/2).webp({quality:91,alphaQuality:100}).toFile(path.join(dir,name+'-mobile.webp'));
}
async function contactSheet(frames,dir,name){
 const w=800,h=32+Math.ceil(frames.length/5)*180,canvas=createCanvas(w,h),ctx=canvas.getContext('2d');
 ctx.fillStyle='#111a27';ctx.fillRect(0,0,w,h);ctx.font='bold 17px sans-serif';ctx.fillStyle='#e7f0fc';ctx.fillText(name+' / extracted source poses',12,23);
 for(let i=0;i<frames.length;i++){
  const f=frames[i],x=i%5*160,y=32+Math.floor(i/5)*180;
  ctx.strokeStyle='#294052';ctx.beginPath();ctx.moveTo(x+8,y+152*464/512);ctx.lineTo(x+152,y+152*464/512);ctx.stroke();
  ctx.drawImage(await loadImage(f.png),x+4,y,152,152);ctx.fillStyle='#c4d7e8';ctx.font='11px sans-serif';ctx.fillText(String(f.index).padStart(2,'0')+' '+NAMES[f.index],x+8,y+166);
 }
 fs.writeFileSync(path.join(dir,'contact-sheet.png'),canvas.toBuffer('image/png'));
}
function sourceMetadata(strip){return {file:'sources/'+path.basename(strip.file),sha256:strip.sha256,width:strip.png.width,height:strip.png.height,transparentFraction:strip.transparentFraction};}
async function build(character){
 const {id}=character,dir=path.join(ROOT,id),baseFile=path.join(SOURCES,id+'-base.png'),extraFile=path.join(SOURCES,id+'-extra.png'),correctionFile=path.join(SOURCES,id+'-corrections.png'),cfg=CONFIG.characters?.[id]||{};
 if(!exists(baseFile))return {...pending(character),missing:[id+'-base.png',...(!exists(extraFile)?[id+'-extra.png']:[])]};
 fs.mkdirSync(path.join(dir,'frames'),{recursive:true});
 const base=await readStrip(baseFile,2),extra=exists(extraFile)?await readStrip(extraFile,4):null;
 const batches=[{kind:'base',strip:base,offset:0,reference:[0,1,4,5,8]}];
 if(extra)batches.push({kind:'extra',strip:extra,offset:10,reference:[10,11,12,14,15,16,18]});
 const correctionRows=cfg.correctionRows||1,correctionColumns=(cfg.correctionFrames?.length||4)/correctionRows;
 if(!Number.isInteger(correctionColumns))throw Error('correctionRows must divide correctionFrames count');
 const corrections=exists(correctionFile)?await readStrip(correctionFile,correctionRows,correctionColumns):null;
 const replacementIndices=cfg.correctionFrames||[17,21,22,23],replacements=new Map();
 if(corrections)replacementIndices.forEach((index,i)=>replacements.set(index,{strip:corrections,part:corrections.ordered[i]}));
 const all=[],metadata=[],scales={},sourceData={base:sourceMetadata(base),...(extra?{extra:sourceMetadata(extra)}:{}),...(corrections?{corrections:sourceMetadata(corrections)}:{})};
 const prepared=[];
 for(const batch of batches){
  const frames=batch.strip.ordered.map((part,i)=>{const index=batch.offset+i,cut=extract(batch.strip,part);return {index,part,cut,anchor:sourceAnchor(batch.strip,part,index),strip:batch.strip,kind:batch.kind};});
  scales[batch.kind]=stripScale(frames,batch.reference);prepared.push(...frames);
 }
 if(corrections){
  const frames=[...replacements].map(([index,{strip,part}])=>({index,part,cut:extract(strip,part),anchor:sourceAnchor(strip,part,index),strip,kind:'corrections'}));
  scales.corrections=stripScale(frames,[replacementIndices[0]]);
  for(const f of frames){const at=prepared.findIndex(p=>p.index===f.index);if(at<0)throw Error('Correction targets a missing frame '+f.index);prepared[at]=f;}
 }
 for(const f of prepared){
  const factor=scales[f.kind].scale,n=await normalize(f,factor),index=f.index,local=index<10?index:index-10;
  fs.writeFileSync(path.join(dir,'frames',String(index).padStart(2,'0')+'-'+NAMES[index]+'.png'),n.png);
  all.push({...f,...n});
  metadata.push({index,name:NAMES[index],sheet:index<10?'base':'extra',file:index<10?'spritesheet.webp':'extra-20.webp',x:local%5*SIZE,y:Math.floor(local/5)*SIZE,w:SIZE,h:SIZE,pivot:PIVOT,baseline:PIVOT.y,bounds:n.bounds,
   scale:factor,source:sourceData[f.kind==='corrections'?'corrections':index<10?'base':'extra'].file,sourceBounds:f.cut.sourceBounds,componentBounds:{x:f.part.x,y:f.part.y,w:f.part.w,h:f.part.h,area:f.part.area,row:f.part.row,column:f.part.column},anchorSource:f.anchor});
 }
 await pack(all.slice(0,10),dir,'base');if(extra)await pack(all.slice(10),dir,'extra');
 const portraitCrop={left:112,top:Math.max(0,all[0].bounds.y-4),width:232,height:232};
 await sharp(all[0].png).extract(portraitCrop).resize(256,256).webp({quality:94,alphaQuality:100}).toFile(path.join(dir,'portrait.webp'));
 await contactSheet(all,dir,character.id.toUpperCase());
 const issues=(cfg.issues||[]).map(issue=>({...issue,resolved:replacements.has(issue.frame)}));
 const errors=issues.filter(issue=>issue.severity==='error'&&!issue.resolved);
 const prefix='assets/fighters-reforged/'+id+'/';
 const entry={...character,base:prefix+'spritesheet.webp',extra:extra?prefix+'extra-20.webp':null,mobileBase:prefix+'spritesheet-mobile.webp',mobileExtra:extra?prefix+'extra-20-mobile.webp':null,portrait:prefix+'portrait.webp',status:!extra?'partial':errors.length?'needs-review':'ready',frameCount:metadata.length,frames:metadata,scales,sources:sourceData,
  files:{base:id+'/spritesheet.webp',baseMobile:id+'/spritesheet-mobile.webp',extra:extra?id+'/extra-20.webp':null,extraMobile:extra?id+'/extra-20-mobile.webp':null,portrait:id+'/portrait.webp',preview:id+'/contact-sheet.png'},
  layoutHash:hash(JSON.stringify(cfg)),qc:{reviewed:!!cfg.reviewed,issues,sharedScalePerStrip:true,preservedSourceAlpha:true}};
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(entry,null,2)+'\n');
 console.log(`${id}: ${entry.frameCount}/30 frames, ${entry.status}; scales ${JSON.stringify(scales)}`);return entry;
}
async function audit(manifest){
 const errors=[];
 if(manifest.characters.length!==15)errors.push('Roster must have exactly 15 entries');
 for(const c of manifest.characters){
  if(!c.qc?.reviewed)errors.push(c.id+': visual review is required');
  if(c.status!=='ready'||c.frames.length!==30)errors.push(c.id+': '+c.status+' ('+c.frames.length+'/30 frames)');
  if(!c.frames.length)continue;
  if(new Set(c.frames.map(f=>f.index)).size!==c.frames.length)errors.push(c.id+': duplicate frame indices');
  if(c.qc?.issues.some(issue=>issue.severity==='error'&&!issue.resolved))errors.push(c.id+': unresolved visual QC errors');
  if(c.layoutHash!==hash(JSON.stringify(CONFIG.characters?.[c.id]||{})))errors.push(c.id+': layout/QC config changed; rebuild required');
  for(const s of Object.values(c.sources))if(!exists(path.join(ROOT,s.file))||hash(fs.readFileSync(path.join(ROOT,s.file)))!==s.sha256)errors.push(c.id+': stale source '+s.file);
  for(const [kind,file,width,height]of [['base',c.files.base,2560,1024],['extra',c.files.extra,2560,2048],['baseMobile',c.files.baseMobile,1280,512],['extraMobile',c.files.extraMobile,1280,1024]]){
   if(!file||!exists(path.join(ROOT,file))){errors.push(c.id+': missing '+kind);continue;}
   const info=await sharp(path.join(ROOT,file)).metadata();if(info.width!==width||info.height!==height||!info.hasAlpha)errors.push(c.id+': invalid '+kind+' atlas dimensions/alpha');
  }
  const frameHashes=new Set(),sourceScales=new Map();
  for(const f of c.frames){
   if(f.name!==NAMES[f.index]||f.pivot.x!==220||f.pivot.y!==464||f.bounds.y+f.bounds.h!==464||f.bounds.x<7||f.bounds.x+f.bounds.w>505)errors.push(c.id+': invalid frame contract '+f.index);
   const file=path.join(ROOT,c.id,'frames',String(f.index).padStart(2,'0')+'-'+f.name+'.png');
   if(!exists(file)){errors.push(c.id+': missing normalized frame '+f.index);continue;}
   const bytes=fs.readFileSync(file),p=PNG.sync.read(bytes),b=alphaBounds(p);
   const digest=hash(bytes);if(frameHashes.has(digest))errors.push(c.id+': duplicate normalized artwork '+f.index);frameHashes.add(digest);
   if(sourceScales.has(f.source)&&sourceScales.get(f.source)!==f.scale)errors.push(c.id+': per-frame scale drift in '+f.source);sourceScales.set(f.source,f.scale);
   if(p.width!==512||p.height!==512||b.y+b.h!==464||b.x<7||b.x+b.w>505)errors.push(c.id+': raster baseline/clipping '+f.index);
  }
 }
 if(errors.length)throw Error('Complete roster audit failed:\n'+errors.join('\n'));
 console.log('PASS: all 15 fighters / 450 frames, exact shared pivots and baselines, desktop/mobile atlas dimensions, source hashes and alpha.');
}
async function main(){
 fs.mkdirSync(ROOT,{recursive:true});const characters=[];
 for(const c of ROSTER){
  const saved=path.join(ROOT,c.id,'manifest.json');
  if(AUDIT||(ONLY&&!ONLY.has(c.id))){characters.push(exists(saved)?JSON.parse(fs.readFileSync(saved,'utf8')):pending(c));continue;}
  try{characters.push(await build(c));}catch(error){characters.push({...pending(c),status:'failed',error:error.message});console.error(c.id+': '+error.message);}
 }
 const manifest={version:1,generatedWith:'built-in image_gen; lossless-alpha extraction and shared-scale normalization',frameSize:SIZE,pivot:PIVOT,names:NAMES,baseNames:BASE,extraNames:EXTRA,characters};
 if(!AUDIT){fs.writeFileSync(path.join(ROOT,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.resolve(ROOT,'../../js/reforged-fighter-data.js'),'const REFORGED_FIGHTER_DATA = '+JSON.stringify(manifest)+';\n');}
 if(COMPLETE)await audit(manifest);
 if(characters.some(c=>c.status==='failed'&&(!ONLY||ONLY.has(c.id))))process.exitCode=1;
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});

// Pack the 20 newly generated transparent silhouettes without changing art.
// Node: pngjs, @napi-rs/canvas, sharp (bundled Codex runtime dependencies).
const fs=require('node:fs'),path=require('node:path');
const {PNG}=require('pngjs'),{createCanvas,loadImage}=require('@napi-rs/canvas'),sharp=require('sharp');
const root=path.resolve(__dirname,'../game/assets/characters-hd');
const base=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
const names=['walk_contact','walk_down','walk_pass','walk_up','walk_opposite','walk_return','jab_load','jab_return','cross_load','cross_return','hook','uppercut','kick_chamber','kick_return','knee','low_block','body_hit','fall','ground','rise'];
function separate(png,rows=4){
 const {width:w,height:h,data}=png,labels=new Int32Array(w*h),queue=new Int32Array(w*h),parts=[];let label=0;
 for(let start=0;start<w*h;start++){
  if(labels[start]||data[start*4+3]<32)continue;
  label++;let head=0,tail=1,x0=w,y0=h,x1=0,y1=0;queue[0]=start;labels[start]=label;
  while(head<tail){const at=queue[head++],x=at%w,y=Math.floor(at/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,n=yy*w+xx;if(xx<0||yy<0||xx>=w||yy>=h||labels[n]||data[n*4+3]<32)continue;labels[n]=label;queue[tail++]=n;}
  }
  if(tail>1000)parts.push({label,area:tail,x:x0,y:y0,w:x1-x0+1,h:y1-y0+1});
 }
 // Bucket by visual rows, then horizontal center; figures can cross cell lines.
 for(const p of parts)p.row=Math.min(rows-1,Math.floor((p.y+p.h*.5)/h*rows));
 parts.sort((a,b)=>a.row-b.row||(a.x+a.w*.5)-(b.x+b.w*.5));
 return {parts,labels};
}
async function main(){
 const manifest={version:2,generatedWith:'built-in image_gen',frameSize:512,pivot:{x:220,y:464},names,characters:[]};
 const only=process.argv.slice(2);
 for(const c of base.characters){
  if(only.length&&!only.includes(c.id))continue;
  const dir=path.join(root,c.id),source=path.join(dir,'extra-20-source.png');
  if(!fs.existsSync(source))continue;
  const png=PNG.sync.read(fs.readFileSync(source)),{parts,labels}=separate(png);
  // Reject small detached generation debris, never count it as a fighter.
  if(parts.length>20){const areas=parts.map(p=>p.area).sort((a,b)=>b-a),threshold=areas[19]*.65;for(let i=parts.length-1;i>=0;i--)if(parts[i].area<threshold)parts.splice(i,1);}
  if(parts.length!==20||[0,1,2,3].some(r=>parts.filter(p=>p.row===r).length!==5))throw Error(`${c.id}: expected 5x4 separate figures; got ${parts.length}: ${JSON.stringify(parts)}`);
  const standing=parts.slice(0,12).map(p=>p.h).sort((a,b)=>a-b);
  const factor=Math.min(350/standing[6],...parts.map(p=>472/(p.w+4)),...parts.map(p=>448/(p.h+4)));
  const baseSource={png,labels,factor},replacements=new Map();
  const correction=path.join(dir,'corrected-3-source.png');
  if(fs.existsSync(correction)){
   const cpng=PNG.sync.read(fs.readFileSync(correction)),seg=separate(cpng,1);
   if(seg.parts.length!==3)throw Error(c.id+': correction must have three isolated figures');
   const cf=Math.min(350/seg.parts[0].h,...seg.parts.map(p=>472/(p.w+4)),...seg.parts.map(p=>448/(p.h+4)));
   [8,11,13].forEach((index,j)=>{parts[index]=seg.parts[j];replacements.set(index,{png:cpng,labels:seg.labels,factor:cf});});
  }
  const atlas=createCanvas(2560,2048),ax=atlas.getContext('2d'),frames=[];
  for(const [i,p]of parts.entries()){
   const {png,labels,factor}=replacements.get(i)||baseSource;
   const cut=new PNG({width:p.w+4,height:p.h+4});
   for(let y=0;y<cut.height;y++)for(let x=0;x<cut.width;x++){
    const sx=p.x+x-2,sy=p.y+y-2;if(sx<0||sy<0||sx>=png.width||sy>=png.height)continue;
    const si=sy*png.width+sx,di=(y*cut.width+x)*4;let belongs=labels[si]===p.label;
    if(!belongs&&png.data[si*4+3]>0)for(let yy=Math.max(0,sy-2);yy<=Math.min(png.height-1,sy+2)&&!belongs;yy++)for(let xx=Math.max(0,sx-2);xx<=Math.min(png.width-1,sx+2);xx++)if(labels[yy*png.width+xx]===p.label){belongs=true;break;}
    if(belongs)png.data.copy(cut.data,di,si*4,si*4+4);
   }
   // Torso/pelvis pivot for all standing frames; support-foot pivot for kicks.
   let anchor=p.w*.5;
   if([6,7,8,9,10,11].includes(i))anchor=p.w*.43;
   if([12,13,14].includes(i)){
    let sum=0,n=0;for(let y=p.y+Math.floor(p.h*.92);y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)if(labels[y*png.width+x]===p.label){sum+=x-p.x;n++;}
    if(n)anchor=sum/n;
   }
   const dx=Math.max(12,Math.min(220-anchor*factor,500-(p.w+4)*factor)),dy=464-(p.h+4)*factor;
   const frame=createCanvas(512,512),fx=frame.getContext('2d'),img=await loadImage(PNG.sync.write(cut));
   fx.drawImage(img,dx,dy,(p.w+4)*factor,(p.h+4)*factor);
   const name=names[i],x=i%5*512,y=Math.floor(i/5)*512;
   ax.drawImage(frame,x,y);
   fs.writeFileSync(path.join(dir,name+'.png'),frame.toBuffer('image/png'));
   frames.push({name,x,y,w:512,h:512,bounds:{x:dx,y:dy,w:(p.w+4)*factor,h:(p.h+4)*factor},sourceBounds:p});
  }
  const pngBuffer=atlas.toBuffer('image/png');
  await sharp(pngBuffer).webp({quality:93,alphaQuality:100}).toFile(path.join(dir,'extra-20.webp'));
  fs.writeFileSync(path.join(dir,'extra-20-manifest.json'),JSON.stringify({id:c.id,frames},null,2));
  manifest.characters.push({id:c.id,frames});console.log(`${c.id}: 20 new frames, baseline 464, scale ${factor.toFixed(3)}`);
 }
 // Include previously packed characters when building a partial batch.
 for(const c of base.characters)if(!manifest.characters.some(x=>x.id===c.id)){
  const file=path.join(root,c.id,'extra-20-manifest.json');if(fs.existsSync(file))manifest.characters.push(JSON.parse(fs.readFileSync(file)));
 }
 fs.writeFileSync(path.join(root,'extra-20-manifest.json'),JSON.stringify(manifest,null,2));
 fs.writeFileSync(path.resolve(root,'../../js/extra-pose-data.js'),'const EXTRA_POSE_DATA = '+JSON.stringify(manifest)+';\n');
}
main().catch(e=>{console.error(e);process.exitCode=1;});

// Normalize generated bitmap weapons. Only crop/resample/pack; never repaint artwork.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'game/assets/weapons/illustrated'),catalogFile=path.join(root,'game/assets/weapons/catalog.json');
const args=process.argv.slice(2),partial=args.includes('--partial'),auditOnly=args.includes('--audit'),only=args.includes('--only')?args[args.indexOf('--only')+1].split(','):null;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
const baseline=path.join(root,'art-direction/weapon-economy-baseline.json');if(!fs.existsSync(baseline))fs.copyFileSync(catalogFile,baseline);
const catalog=read(catalogFile),prior=fs.existsSync(path.join(dir,'manifest.json'))?read(path.join(dir,'manifest.json')):{weapons:[]};
const layouts=fs.existsSync(path.join(dir,'layout.json'))?read(path.join(dir,'layout.json')):{};
function silhouette(data,w,h){
 const seen=new Uint8Array(w*h),queue=new Uint32Array(w*h),parts=[];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const n=y*w+x;if(seen[n]||data[n*4+3]<64)continue;
  let head=0,tail=0,area=0,x1=x,x2=x,y1=y,y2=y;queue[tail++]=n;seen[n]=1;
  while(head<tail){const q=queue[head++],qx=q%w,qy=(q/w)|0;area++;x1=Math.min(x1,qx);x2=Math.max(x2,qx);y1=Math.min(y1,qy);y2=Math.max(y2,qy);
   for(const next of [qx>0?q-1:-1,qx<w-1?q+1:-1,qy>0?q-w:-1,qy<h-1?q+w:-1])if(next>=0&&!seen[next]&&data[next*4+3]>=64){seen[next]=1;queue[tail++]=next;}
  }parts.push({area,x1,x2,y1,y2});
 }
 if(!parts.length)throw Error('Empty alpha silhouette');
 const largest=Math.max(...parts.map(p=>p.area)),kept=parts.filter(p=>p.area>=Math.max(20,largest*.001));
 const raw={left:Math.min(...kept.map(p=>p.x1)),top:Math.min(...kept.map(p=>p.y1)),right:Math.max(...kept.map(p=>p.x2)),bottom:Math.max(...kept.map(p=>p.y2))};
 if(raw.left<2||raw.top<2||raw.right>w-3||raw.bottom>h-3)throw Error('Object touches source edge');
 const x=Math.max(0,raw.left-4),y=Math.max(0,raw.top-4);return{x,y,w:Math.min(w-1,raw.right+4)-x+1,h:Math.min(h-1,raw.bottom+4)-y+1,majorComponents:kept.length};
}
function findGrip(data,w,b,family,override){
 const fx={bat:.15,staff:.24,hammer:.13,axe:.14,sword:.12,tonfa:.28,chain:.08,spear:.23,knuckles:.5,blade:.14}[family];
 let x=Math.round(b.x+b.w*(override?.[0]??fx)),y;
 if(override||['tonfa','knuckles'].includes(family))y=Math.round(b.y+b.h*(override?.[1]??(family==='tonfa'?.22:.84)));
 else{
  let sum=0,weight=0;for(let yy=b.y;yy<b.y+b.h;yy++)for(let xx=Math.max(b.x,x-4);xx<=Math.min(b.x+b.w-1,x+4);xx++){const a=data[(yy*w+xx)*4+3];if(a>=160){sum+=yy;weight++;}}
  if(!weight)throw Error('Grip column has no opaque pixels');y=Math.round(sum/weight);
 }
 return{x,y};
}
async function pack(src,b,g,spec,file){
 const [width,height,mw,mh,quality]=spec,scale=Math.min(mw/b.w,mh/b.h),rw=Math.round(b.w*scale),rh=Math.round(b.h*scale),left=Math.round((width-rw)/2),top=Math.round((height-rh)/2);
 await sharp(src).extract({left:b.x,top:b.y,width:b.w,height:b.h}).resize(rw,rh).extend({left,right:width-rw-left,top,bottom:height-rh-top,background:{r:0,g:0,b:0,alpha:0}}).webp({quality,alphaQuality:100,effort:4}).toFile(file);
 return{width,height,grip:{x:left+(g.x-b.x)*scale,y:top+(g.y-b.y)*scale},bounds:{x:left,y:top,w:rw,h:rh},sha256:sha(fs.readFileSync(file)),bytes:fs.statSync(file).size};
}
async function audit(manifest){
 const base=read(baseline);if(base.weapons.length!==100||manifest.weapons.length!==100)throw Error('All 100 illustrated weapons are required');
 const hashes=new Set();
 for(const w of catalog.weapons){
  const original=base.weapons.find(e=>e.id===w.id);for(const key of ['id','family','name','familyName','tier','price','damage','reach','meter','length'])if(JSON.stringify(w[key])!==JSON.stringify(original[key]))throw Error('Economy changed: '+w.id+'/'+key);
  const m=manifest.weapons.find(e=>e.id===w.id);if(!m||!m.qc.reviewed)throw Error('Visual review missing: '+w.id);
  const receipt=read(path.join(dir,'receipts',w.id+'.json'));if(!receipt.reviewed)throw Error('Source review missing: '+w.id);
  if(!w.art||w.art.version!==2||w.icon.endsWith('.svg'))throw Error('Legacy icon still active: '+w.id);
  const raw=fs.readFileSync(path.join(dir,'sources',w.id+'.png'));if(sha(raw)!==m.sourceSha256||receipt.sourceSha256!==m.sourceSha256)throw Error('Source hash mismatch: '+w.id);
  if(hashes.has(m.sourceSha256))throw Error('Duplicated source');hashes.add(m.sourceSha256);
  for(const kind of ['thumb','detail','combat']){const file=path.join(root,'game',w.art[kind]);const buf=fs.readFileSync(file),meta=await sharp(buf).metadata();if(meta.width!==m[kind].width||meta.height!==m[kind].height||!meta.hasAlpha||sha(buf)!==m[kind].sha256)throw Error('Asset verification failed: '+w.id+'/'+kind);}
  const g=m.combat.grip,b=m.combat.bounds;if(g.x<b.x||g.x>b.x+b.w||g.y<b.y||g.y>b.y+b.h)throw Error('Invalid grip '+w.id);
 }
 if(JSON.stringify(base.upgrades)!==JSON.stringify(catalog.upgrades))throw Error('Upgrade rules changed');
 console.log('PASS: 100 unique generated sources, 300 alpha WebP assets, valid grips, reviewed art, unchanged IDs/prices/stats/upgrades, no active SVG placeholders.');
}
(async()=>{
 if(auditOnly){await audit(prior);return;}
 for(const sub of ['thumb','detail','combat'])fs.mkdirSync(path.join(dir,sub),{recursive:true});
 const all=[];
 for(const w of catalog.weapons){
  const file=path.join(dir,'sources',w.id+'.png'),receiptFile=path.join(dir,'receipts',w.id+'.json');
  if(!fs.existsSync(file)||!fs.existsSync(receiptFile)){if(partial)continue;throw Error('Missing generated source '+w.id);}
  const receipt=read(receiptFile),src=fs.readFileSync(file),sourceSha256=sha(src),layoutHash=sha(JSON.stringify(layouts[w.id]||{}));
  let entry=prior.weapons.find(e=>e.id===w.id&&e.sourceSha256===sourceSha256&&e.layoutHash===layoutHash&&e.buildVersion===1);
  if(only&&!only.includes(w.id)&&entry){entry.qc.reviewed=!!receipt.reviewed;all.push(entry);continue;}
  if(entry&&['thumb','detail','combat'].every(k=>fs.existsSync(path.join(dir,k,w.id+'.webp')))){entry.qc.reviewed=!!receipt.reviewed;all.push(entry);continue;}
  const {data,info}=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true});let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)transparent++;if(transparent/(info.width*info.height)<.15)throw Error('Expected genuine transparent background: '+w.id);
  const b=silhouette(data,info.width,info.height),grip=findGrip(data,info.width,b,w.family,layouts[w.id]?.grip);
  entry={id:w.id,sourceSha256,layoutHash,buildVersion:1,sourceDimensions:{width:info.width,height:info.height},sourceBounds:b,sourceGrip:grip,qc:{reviewed:!!receipt.reviewed,genuineAlpha:true,edgeClear:true}};
  for(const [kind,spec]of Object.entries({thumb:[600,320,510,250,92],detail:[1200,640,1040,510,95],combat:[384,192,332,156,94]}))entry[kind]=await pack(src,b,grip,spec,path.join(dir,kind,w.id+'.webp'));
  all.push(entry);console.log(w.id+' packed');
 }
 const manifest={version:2,generator:'built-in image_gen',weapons:all};write(path.join(dir,'manifest.json'),manifest);
 for(const w of catalog.weapons){const m=all.find(e=>e.id===w.id);if(!m)continue;const prefix='assets/weapons/illustrated/';w.icon=prefix+'thumb/'+w.id+'.webp';w.art={version:2,thumb:w.icon,detail:prefix+'detail/'+w.id+'.webp',combat:prefix+'combat/'+w.id+'.webp',grip:m.combat.grip,bounds:m.combat.bounds,width:m.combat.width,height:m.combat.height};}
 write(catalogFile,catalog);fs.writeFileSync(path.join(root,'game/js/weapon-data.js'),"'use strict';\nconst WEAPON_CATALOG = "+JSON.stringify(catalog)+';\n');
 write(path.join(root,'art-direction/weapon-generation-ledger.json'),{generator:'built-in image_gen',entries:all.map(m=>read(path.join(dir,'receipts',m.id+'.json')))});
 if(!partial)await audit(manifest);console.log(all.length+' / 100 generated weapons packed.');
})().catch(e=>{console.error(e);process.exitCode=1;});

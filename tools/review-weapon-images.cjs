const fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'game/assets/weapons/illustrated'),catalog=JSON.parse(fs.readFileSync(path.join(root,'game/assets/weapons/catalog.json'))),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))),out=path.join(root,'review/weapon-art');fs.mkdirSync(out,{recursive:true});
(async()=>{for(const family of [...new Set(catalog.weapons.map(w=>w.family))]){
const items=catalog.weapons.filter(w=>w.family===family&&w.art?.version===2);if(!items.length)continue;
const c=createCanvas(1200,Math.ceil(items.length/2)*365),g=c.getContext('2d');g.fillStyle='#15232e';g.fillRect(0,0,c.width,c.height);
for(let n=0;n<items.length;n++){const w=items[n],m=manifest.weapons.find(e=>e.id===w.id),x=n%2*600,y=Math.floor(n/2)*365;g.fillStyle='#dfeaf0';g.font='17px sans-serif';g.fillText(w.id+' · '+w.name.en,x+20,y+28);const image=await loadImage(path.join(root,'game',w.art.thumb));g.drawImage(image,x+15,y+35,570,304);g.strokeStyle='#7cbec0';g.strokeRect(x+4,y+3,590,358);g.font='12px sans-serif';g.fillStyle='#829eaf';g.fillText('Grip '+m.sourceGrip.x+', '+m.sourceGrip.y+' | '+(m.thumb.bytes/1024).toFixed(1)+' KB',x+20,y+352);}
const file=path.join(out,'collection-'+family+'.png');fs.writeFileSync(file,c.toBuffer('image/png'));console.log(file);
}})().catch(e=>{console.error(e);process.exitCode=1});

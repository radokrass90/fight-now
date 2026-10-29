const sharp=require('sharp'),path=require('node:path');
const dir=path.resolve(__dirname,'../game/assets/reforged-3d');
(async()=>{
 await sharp(path.join(dir,'logo.png')).webp({quality:95,alphaQuality:100}).toFile(path.join(dir,'logo.webp'));
 const tiles=Array.from({length:12},(_,i)=>({input:path.join(dir,`vent-${String(i+1).padStart(2,'0')}.png`),left:i%4*384,top:Math.floor(i/4)*384}));
 const atlas=await sharp({create:{width:1536,height:1152,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(tiles).png().toBuffer();
 await sharp(atlas).webp({quality:91,alphaQuality:100}).toFile(path.join(dir,'vent-atlas.webp'));
 await sharp(atlas).resize(768,576).webp({quality:90,alphaQuality:100}).toFile(path.join(dir,'vent-atlas-mobile.webp'));
 console.log('Packed Blender metal title and 12-frame vent atlas.');
})().catch(e=>{console.error(e);process.exitCode=1;});

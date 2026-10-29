// Split the two newly generated, isolated menu portraits; preserve source alpha.
const sharp=require('sharp'),path=require('node:path');
const root=path.resolve(__dirname,'../game/assets/fighters-reforged');
(async()=>{const src=path.join(root,'sources/menu-heroes.png'),meta=await sharp(src).metadata();
 for(const [i,id]of ['murat','nadine'].entries()){
  const left=Math.round(i*meta.width/2),right=Math.round((i+1)*meta.width/2);
  const image=await sharp(src).extract({left,top:0,width:right-left,height:meta.height}).png().toBuffer();
  await sharp(image).webp({quality:94,alphaQuality:100}).toFile(path.join(root,id,'menu-hero.webp'));
  await sharp(image).resize({width:512}).webp({quality:92,alphaQuality:100}).toFile(path.join(root,id,'menu-hero-mobile.webp'));
 }
 console.log('Packed two matching high-resolution menu portraits.');
})().catch(e=>{console.error(e);process.exitCode=1;});

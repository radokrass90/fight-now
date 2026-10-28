const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'../game/assets');
(async()=>{
 for(const id of fs.readdirSync(root+'/characters-hd').filter(id=>fs.existsSync(root+'/characters-hd/'+id+'/spritesheet.webp'))){
  const dir=root+'/characters-hd/'+id;
  await sharp(dir+'/spritesheet.webp').extract({left:0,top:0,width:512,height:512}).resize(256,256).webp({quality:90,alphaQuality:100}).toFile(dir+'/portrait.webp');
  for(const name of ['spritesheet','extra-20'])await sharp(dir+'/'+name+'.webp').resize({width:1280}).webp({quality:90,alphaQuality:100}).toFile(dir+'/'+name+'-mobile.webp');
 }
 for(const id of fs.readdirSync(root+'/arenas-hd').filter(id=>fs.existsSync(root+'/arenas-hd/'+id+'/background.webp'))){
  const dir=root+'/arenas-hd/'+id;
  await sharp(dir+'/background.webp').resize(320,180).webp({quality:78}).toFile(dir+'/thumbnail.webp');
  await sharp(dir+'/background.webp').resize(960,540).webp({quality:86}).toFile(dir+'/background-mobile.webp');
 }
 console.log('15 portraits, 30 mobile atlases, 15 arena thumbnails, 15 mobile backgrounds');
})().catch(e=>{console.error(e);process.exitCode=1;});

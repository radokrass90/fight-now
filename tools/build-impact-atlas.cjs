const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '../game/assets/effects');
sharp({create:{width:1024,height:768,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
  .composite(Array.from({length:12},(_,i)=>({
    input:path.join(root,`impact-${String(i+1).padStart(2,'0')}.png`),
    left:i%4*256,top:Math.floor(i/4)*256
  })))
  .webp({quality:94,alphaQuality:100})
  .toFile(path.join(root,'impact-atlas.webp'))
  .then(info=>console.log(info))
  .catch(error=>{console.error(error);process.exitCode=1;});

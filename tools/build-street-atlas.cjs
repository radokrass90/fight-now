const sharp=require('sharp'),path=require('node:path');
const root=path.resolve(__dirname,'../game/assets/props-3d');
sharp({create:{width:1024,height:1024,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
 .composite(Array.from({length:4},(_,i)=>({input:path.join(root,`prop-${String(i+1).padStart(2,'0')}.png`),left:i%2*512,top:Math.floor(i/2)*512})))
 .webp({quality:92,alphaQuality:100}).toFile(path.join(root,'street-atlas.webp'))
 .then(console.log).catch(e=>{console.error(e);process.exitCode=1;});

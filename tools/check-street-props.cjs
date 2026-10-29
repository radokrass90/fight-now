const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,Image}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../game');
let activeImage;
class GameImage extends Image {
 constructor(){super();activeImage=this;}
 set src(v){super.src=fs.readFileSync(path.join(root,v));}
 get src(){return super.src;}
}
(async()=>{
 const sb={Image:GameImage,GROUND:478,W:960,H:540};vm.createContext(sb);
 vm.runInContext(fs.readFileSync(root+'/js/stage-props.js','utf8')+';this.props=StageProps;',sb);
 const canvas=createCanvas(960,540),ctx=canvas.getContext('2d');
 // Loading is optional; the fight must remain drawable before atlas readiness.
 sb.props.back(ctx,0,0);sb.props.front(ctx,0,0);
 if(!sb.props.ready)await new Promise((resolve,reject)=>{const onload=activeImage.onload;activeImage.onload=()=>{onload();resolve();};activeImage.onerror=reject;});
 assert(sb.props.ready,'Atlas did not finish loading');
 assert.equal(activeImage.width,1024);assert.equal(activeImage.height,1024);
 assert.equal(sb.props.themes.length,15);
 for(let i=0;i<15;i++){
  assert(sb.props.themes[i].every(k=>Number.isInteger(k)&&k>=0&&k<4));
  ctx.clearRect(0,0,960,540);sb.props.back(ctx,i,0);sb.props.front(ctx,i,0);
  const pixels=ctx.getImageData(0,0,960,540).data;
  let edge=0,middle=0;for(let y=250;y<540;y++)for(let x=0;x<960;x++){
   const alpha=pixels[(y*960+x)*4+3];if(alpha){if(x>180&&x<780)middle++;else edge++;}
  }
  assert(edge>500,'Empty stage props '+i);assert.equal(middle,0,'Prop obstructs combat center '+i);
 }
 console.log('PASS: all 15 stage layouts render, combat center stays clear, one shared 4 MiB atlas.');
})().catch(e=>{console.error(e);process.exitCode=1;});

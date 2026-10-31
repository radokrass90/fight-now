const fs=require('node:fs'),vm=require('node:vm'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const sb={};vm.createContext(sb);vm.runInContext(fs.readFileSync('game/js/reforged-fighter-data.js','utf8')+';this.data=REFORGED_FIGHTER_DATA;',sb);
(async()=>{const walking=process.argv.includes('--walk'),other=process.argv.includes('--other'),frames=other?[2,3,6,7,8,9,25,26]:walking?[10,11,12,13,14,15]:[4,16,17,18,19,20,21,22,23,24],chars=sb.data.characters;for(let group=0;group<3;group++){
 const canvas=createCanvas(frames.length*200,1000),g=canvas.getContext('2d');g.fillStyle='#1a2633';g.fillRect(0,0,frames.length*200,1000);
 for(let row=0;row<5;row++){
  const c=chars[group*5+row],base=await loadImage('game/'+c.base),extra=await loadImage('game/'+c.extra);
  for(let col=0;col<frames.length;col++){const f=c.frames[frames[col]],b=f.bounds,img=frames[col]<10?base:extra,x=col*200,y=row*200;g.drawImage(img,f.x+b.x,f.y+b.y,b.w,b.h,x+10,y+25,180,170);g.fillStyle='#e3f2fc';g.font='13px sans-serif';g.fillText(c.id+' / '+frames[col],x+6,y+17);}
 }
 fs.writeFileSync('review/dynamic-combat/hands-'+(other?'other-':walking?'walk-':'')+group+'.png',canvas.toBuffer('image/png'));
}})();

'use strict';
const WeaponArt=(()=>{
 const handAnchors={"murat":{"0":[0.76825,0.30532],"1":[0.70354,0.14111],"5":[0.95046,0.17592]},"yasmin":{"0":[0.74554,0.2629],"1":[0.73672,0.14886],"5":[0.95958,0.19359]},"dragan":{"0":[0.86492,0.28949],"1":[0.68053,0.14853],"5":[0.94117,0.16121]},"kevin":{"0":[0.86672,0.20539],"1":[0.77095,0.04909],"5":[0.96006,0.19407]},"leyla":{"0":[0.8181,0.25044],"1":[0.73787,0.11499],"5":[0.94762,0.18997]},"tomasz":{"0":[0.80001,0.27293],"1":[0.65235,0.06382],"5":[0.95824,0.19855]},"hakan":{"0":[0.81497,0.21938],"1":[0.7794,0.10336],"5":[0.9513,0.18602]},"nadine":{"0":[0.72684,0.22902],"1":[0.63687,0.05006],"5":[0.92838,0.21198]},"emre":{"0":[0.79183,0.21072],"1":[0.72805,0.05991],"5":[0.96008,0.16268]},"boris":{"0":[0.84708,0.29721],"1":[0.7188,0.13717],"5":[0.95461,0.22913]},"jasmin":{"0":[0.75656,0.22734],"1":[0.64328,0.07011],"5":[0.96461,0.21175]},"adem":{"0":[0.82663,0.22734],"1":[0.72077,0.0923],"5":[0.94815,0.21469]},"marco":{"0":[0.73836,0.23839],"1":[0.68467,0.06653],"5":[0.9331,0.19626]},"fatima":{"0":[0.76869,0.21063],"1":[0.71894,0.02879],"5":[0.95159,0.17456]},"danny":{"0":[0.79571,0.22171],"1":[0.71242,0.0884],"5":[0.93881,0.21569]}};
 const images=new Map(),anchors={0:[.78,.30,-32],1:[.72,.20,-58],2:[.91,.26,-30],3:[.74,.28,-18],4:[.96,.19,-5],5:[.96,.167,-10],6:[.48,.20,-35],7:[.22,.25,35],8:[.68,.38,55],9:[.82,.10,-85],16:[.65,.30,-45],17:[.78,.25,-28],18:[.88,.21,35],19:[.78,.28,-30],20:[.95,.20,-10],21:[.73,.04,-82],22:[.7,.22,-25],23:[.65,.23,-24],24:[.65,.22,-20],25:[.67,.2,-50],26:[.65,.43,45],29:[.7,.72,25]};
 function prepare(id){
  if(!id)return null;if(images.has(id)){const image=images.get(id);if(!image.weaponRetryAt||Date.now()<image.weaponRetryAt){images.delete(id);images.set(id,image);return image;}images.delete(id);}
  const w=typeof Economy!=='undefined'?Economy.weapons.get(id):null;if(!w)return null;
  const img=new Image();img.onerror=()=>{img.weaponRetryAt=Date.now()+3000;};img.src=w.art?.combat||w.icon;images.set(id,img);
  while(images.size>8){const key=images.keys().next().value;images.delete(key);}return img;
 }
 function draw(ctx,f,art){
  const w=f.equipment?.weapon;if(!w||!art?.frame||f.vis===false||f.lying||f.script||f.noProp||['air','thrown','locked','down','ko'].includes(f.state))return;
  const image=prepare(w.id);if(!image?.complete||!image.naturalWidth)return;
  const i=art.frameIndex;if([27,28,29].includes(i))return;const b=art.frame.bounds,[ax,ay,angle]=anchors[i]||[.82,.22,-30],hand=handAnchors[f.c.id]?.[i],cx=(b.x+b.w*(hand?.[0]??ax)-220)*art.size,cy=(b.y+b.h*(hand?.[1]??ay)-464-art.airOffset)*art.size;
  const design=w.art,grip=design?.grip||{x:48,y:48},width=design?.width||144,height=design?.height||96;
  const scale=design?w.length*f.c.h/design.bounds.w:w.length/85*f.c.h;
  ctx.save();ctx.globalAlpha=(f.alpha??1)*(art.alpha??1);ctx.translate(f.x,GROUND-f.y);ctx.scale(f.facing*(f.sc||1),(f.sc||1)*(f.squash||1));if(f.rot)ctx.rotate(f.rot*D2R);
  const breathing=f.state==='idle'?Math.sin((f.st||0)*.09)*.003:0;ctx.scale(1,1+breathing);
  ctx.save();ctx.translate(cx,cy);const hanging=w.family==='chain'&&![4,5,20,21].includes(i);const propAngle=hanging?68+Math.sin(f.walkPh||0)*6:angle;ctx.rotate(propAngle*D2R);
  if(design&&f.state==='move'&&typeof CombatFX!=='undefined'&&CombatFX.full&&!CombatFX.reduced&&[4,5,20,21].includes(i)){
   const len=w.length*f.c.h;ctx.save();ctx.globalAlpha*=.19;ctx.strokeStyle='#e8d39b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(len*.30,-15);ctx.quadraticCurveTo(len*.8,-11,len,0);ctx.stroke();ctx.restore();
  }
  ctx.drawImage(image,-grip.x*scale,-grip.y*scale,width*scale,height*scale);ctx.restore();
  // Restore the real painted fist above the grip, so the prop sits inside the hand.
  if(art.image&&[0,1,2,4,5,6,7,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25].includes(i)){
   ctx.save();ctx.beginPath();ctx.arc(cx,cy,Math.max(3.3,4.2*f.c.h),0,Math.PI*2);ctx.clip();
   const ratio=art.ratio||1;ctx.drawImage(art.image,art.frame.x*ratio,art.frame.y*ratio,512*ratio,512*ratio,-220*art.size,-464*art.size-art.airOffset*art.size,512*art.size,512*art.size);ctx.restore();
  }
  ctx.restore();
 }
 return{draw,prepare,get residentImages(){return images.size;}};
})();

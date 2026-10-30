'use strict';
const WeaponArt=(()=>{
 const images=new Map();
 // Proportional anchors follow the selected painted frame, its source scale and facing.
 const anchors={0:[.78,.28,35],1:[.72,.20,-55],2:[.78,.26,25],3:[.74,.28,15],4:[.96,.17,-8],5:[.96,.25,-10],6:[.38,.22,25],7:[.32,.25,30],8:[.68,.38,65],9:[.82,.10,-85],16:[.65,.30,35],17:[.78,.25,25],18:[.62,.32,65],19:[.78,.28,25],20:[.95,.20,-15],21:[.72,.07,-85],22:[.7,.22,30],23:[.65,.23,25],24:[.65,.22,20],25:[.67,.2,-30],26:[.65,.43,65],29:[.7,.72,30]};
 function prepare(id){if(!id)return null;if(images.has(id))return images.get(id);const w=typeof Economy!=='undefined'?Economy.weapons.get(id):null;if(!w)return null;const img=new Image();img.src=w.icon;images.set(id,img);return img;}
 function draw(ctx,f,art){
  const w=f.equipment?.weapon;if(!w||!art?.frame||f.vis===false||f.lying||['air','thrown','locked','down','ko'].includes(f.state))return;
  const image=prepare(w.id);if(!image?.complete||!image.naturalWidth)return;
  const i=art.frameIndex,b=art.frame.bounds,[ax,ay,angle]=anchors[i]||[.77,.28,35];
  ctx.save();ctx.globalAlpha=f.alpha??1;ctx.translate(f.x,GROUND-f.y);ctx.scale(f.facing*(f.sc||1),(f.sc||1)*(f.squash||1));if(f.rot)ctx.rotate(f.rot*D2R);
  ctx.translate((b.x+b.w*ax-220)*art.size,(b.y+b.h*ay-464-art.airOffset)*art.size);
  ctx.rotate(angle*D2R);const scale=w.length/85*f.c.h;
  ctx.drawImage(image,-48*scale,-48*scale,144*scale,96*scale);ctx.restore();
 }
 return{draw,prepare};
})();

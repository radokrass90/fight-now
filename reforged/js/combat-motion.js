'use strict';
// Sampling simulation time keeps effects frozen during hitstop and pause.
const CombatMotion=(()=>{
 const unit=n=>Math.max(0,Math.min(1,n)),out=t=>1-Math.pow(1-unit(t),3),smooth=t=>{t=unit(t);return t*t*(3-2*t);};
 const strike=new Set(['jab','cross','hook','hay','palm','upper','elbow','ovh','hb','shoulder','superman','c_jab','c_up','jpunch','jhp']);
 const loadFrames={jab:16,palm:16,c_jab:16,jpunch:16,cross:18,hook:18,hay:18,upper:18,c_up:18,elbow:18,ovh:21,hb:18,shoulder:18,superman:18,jhp:18};
 function segment(f){if(f.state!=='move'||!f.mc)return null;let i=f.mc.segs.findIndex(s=>f.mt<=s.e);if(i<0)i=f.mc.segs.length-1;const s=f.mc.segs[i];return{s,i,t:unit((f.mt-s.s)/Math.max(1,s.e-s.s))};}
 function sample(f){
  const t=f.motionTick||f.st||0,m={x:0,y:0,lean:0,sx:1,sy:1,handDX:0,handDY:0};
  if(f.script||f.lying||['super','locked','throwing','thrown','down','ko','air'].includes(f.state))return m;
  const seg=segment(f);m.segment=seg;
  if(['idle','block','cblock'].includes(f.state)){const b=Math.sin(t*.075+(f.side||0)*1.7);m.lean=b*.007;m.sy=1+b*.004;m.x=Math.sin(t*.043)*.65;}
  else if(['walk','intro'].includes(f.state)){const p=f.walkPh||0,v=Math.min(1.8,Math.abs(f.vx||2)/3);m.y=-Math.abs(Math.sin(p))*1.7*v;m.lean=Math.sign((f.vx||1)*f.facing)*(.018+v*.014)+Math.sin(p)*.007;m.sy=1-Math.abs(Math.cos(p))*.008;}
  else if(['land','prejump'].includes(f.state)){const p=1-unit((f.st||0)/6);m.sy=1-p*.055;m.sx=1+p*.025;}
  else if(['hit','blockstun'].includes(f.state)){const p=Math.exp(-(f.st||0)/7),g=f.state==='blockstun';m.lean=-p*(g?.025:.065);m.x=-p*(g?1.5:4);m.sy=1-p*.018;}
  else if(f.state==='jump'){m.sy=1+Math.min(.024,Math.abs(f.vy||0)*.002);m.lean=(f.vx||0)*.004;}
  if(seg){const {s,t:p}=seg,action=strike.has(s.p),load=typeof s.p==='string'&&s.p.endsWith('_c');
   if(load){m.lean=-.022*smooth(p);m.sy=1-.018*smooth(p);m.x=-1.5*smooth(p);}
   else if(action){const power=f.move?.comboEnd?1.3:1;m.lean=(s.hold?.04:.055*out(p))*power;m.x=(s.hold?2.5:3*out(p))*power;m.sy=1+(s.hold?.004:.01*out(p));}
   else if(s.p==null){m.lean=.025*(1-smooth(p));m.x=1.5*(1-smooth(p));}
   m.striking=action;m.loading=load;m.weaponLoading=load&&['jab_c','palm_c','cross_c','hook_c','hay_c','upper_c','c_up_c','elbow_c','ovh_c','hb_c','swing_c'].includes(s.p);m.recovering=s.p==null;m.weaponRecovery=m.recovering&&strike.has(f.mc.segs.slice(0,seg.i).reverse().find(k=>k.p!=null)?.p);m.loadFrame=action&&!s.hold?loadFrames[s.p]:null;m.handBlend=out(p);
  }
  return m;
 }
 function apply(ctx,m){ctx.transform(m.sx,0,-m.lean,m.sy,m.x,m.y);}
 function hand(f,art){
  if(typeof WeaponArt==='undefined')return null;
  const h=WeaponArt.handPoint(f,art.frame,art.frameIndex,art.size,art.airOffset),m=art.motion;
  if(m?.loadFrame!=null&&m.handBlend<.999){const source=CharacterArt.entries.get(f.c.id)?.data.frames[m.loadFrame];if(source){const from=WeaponArt.handPoint(f,source,m.loadFrame,art.size,0);m.handDX=Math.max(-32,Math.min(32,(from.x-h.x)*(1-m.handBlend)));m.handDY=Math.max(-25,Math.min(25,(from.y-h.y)*(1-m.handBlend)));}}
  if(m){const length=Math.hypot(m.handDX,m.handDY);if(length>32){m.handDX*=32/length;m.handDY*=32/length;}}
  return{...h,x:h.x+(m?.handDX||0),y:h.y+(m?.handDY||0),sourceX:h.x,sourceY:h.y};
 }
 function warpPoint(x,y,m,h){if(!h||Math.abs(m.handDX)+Math.abs(m.handDY)<.15)return[x,y];const w=Math.exp(-((x-h.sourceX)**2+(y-h.sourceY)**2)/(2*24*24));return[x+m.handDX*w,y+m.handDY*w];}
 function triangle(ctx,img,src,dst,frame,ratio,size,airOffset){
  const [a,b,c]=src,[p,q,r]=dst,ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-a[0],vy=c[1]-a[1],det=ux*vy-uy*vx;if(Math.abs(det)<.001)return;
  const A=((q[0]-p[0])*vy-(r[0]-p[0])*uy)/det,B=((q[1]-p[1])*vy-(r[1]-p[1])*uy)/det,C=((r[0]-p[0])*ux-(q[0]-p[0])*vx)/det,D=((r[1]-p[1])*ux-(q[1]-p[1])*vx)/det;
  const mid=[(p[0]+q[0]+r[0])/3,(p[1]+q[1]+r[1])/3],clip=[p,q,r].map(v=>{const dx=v[0]-mid[0],dy=v[1]-mid[1],len=Math.hypot(dx,dy)||1;return[v[0]+dx/len*.6,v[1]+dy/len*.6];});
  ctx.save();ctx.beginPath();ctx.moveTo(...clip[0]);ctx.lineTo(...clip[1]);ctx.lineTo(...clip[2]);ctx.closePath();ctx.clip();ctx.transform(A,B,C,D,p[0]-A*a[0]-C*a[1],p[1]-B*a[0]-D*a[1]);
  ctx.drawImage(img,frame.x*ratio,frame.y*ratio,512*ratio,512*ratio,-220*size,-464*size-airOffset*size,512*size,512*size);ctx.restore();
 }
 function paint(ctx,img,art){
  const {frame,ratio,size,airOffset,motion:m,hand:h}=art;
  if(!m||!h||Math.abs(m.handDX)+Math.abs(m.handDY)<.3){ctx.drawImage(img,frame.x*ratio,frame.y*ratio,512*ratio,512*ratio,-220*size,-464*size-airOffset*size,512*size,512*size);return;}
  // Deform a single silhouette in the brief transition, rather than crossfade
  // two transparent bodies. Steady poses still cost just one drawImage.
  const bounds=frame.bounds,cols=8,rows=10,x0=(bounds.x-221)*size,y0=(bounds.y-465-airOffset)*size,w=(bounds.w+2)*size,ht=(bounds.h+2)*size;
  const xs=[...Array.from({length:cols+1},(_,i)=>x0+i*w/cols),h.sourceX].sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>.01);
  const ys=[...Array.from({length:rows+1},(_,i)=>y0+i*ht/rows),h.sourceY].sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>.01);
  for(let y=0;y<ys.length-1;y++)for(let x=0;x<xs.length-1;x++){
   const a=[xs[x],ys[y]],b=[xs[x+1],ys[y]],c=[xs[x+1],ys[y+1]],d=[xs[x],ys[y+1]],points=[a,b,c,d],target=points.map(p=>warpPoint(...p,m,h));
   triangle(ctx,img,[a,b,c],target.slice(0,3),frame,ratio,size,airOffset);triangle(ctx,img,[a,c,d],[target[0],target[2],target[3]],frame,ratio,size,airOffset);
  }
 }
 const arcs={bat:[-122,28],staff:[-88,12],hammer:[-140,48],axe:[-136,42],sword:[-108,28],tonfa:[-95,18],chain:[-145,54],spear:[-22,-3],knuckles:[-24,-3],blade:[-78,14]};
 function weapon(f,art){
  const family=f.equipment?.weapon?.family||'bat',arc=arcs[family]||arcs.bat,seg=art.motion?.segment,rest=family==='chain'?68:-32;
  if(!seg)return{angle:rest+Math.sin(f.walkPh||((f.motionTick||0)*.05))*3,trail:0};
  const {s,t}=seg;let angle=rest,trail=0;
  if(art.motion.weaponLoading)angle=rest+(arc[0]-rest)*smooth(t);
  else if(art.motion.striking){angle=s.hold?arc[1]+Math.sin(t*Math.PI)*5:arc[0]+(arc[1]-arc[0])*out(t);trail=s.hold?Math.max(0,1-t):t>.12?1:0;}
  else if(art.motion.weaponRecovery)angle=arc[1]+(rest-arc[1])*smooth(t);
  return{angle,trail,from:arc[0],to:arc[1]};
 }
 return{sample,apply,hand,paint,weapon,segment,warpPoint};
})();

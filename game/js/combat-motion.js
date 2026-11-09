'use strict';
// Sampling simulation time keeps effects frozen during hitstop and pause.
const CombatMotion=(()=>{
 const unit=n=>Math.max(0,Math.min(1,n)),out=t=>1-Math.pow(1-unit(t),3),smooth=t=>{t=unit(t);return t*t*(3-2*t);};
 const stance = {
  murat:[.117,2.2,.018,.009], yasmin:[.135,2.9,-.013,.012], dragan:[.059,.7,.008,.004],
  kevin:[.094,2.5,.034,.011], leyla:[.083,1.5,-.006,.008], tomasz:[.105,3.2,.007,.016],
  hakan:[.059,1.5,.041,.006], nadine:[.105,1.5,.022,.008], emre:[.143,2.5,.006,.01],
  boris:[.049,.8,.032,.004], jasmin:[.121,2.2,.027,.007], adem:[.088,2.1,.014,.009],
  marco:[.075,1.6,-.017,.007], fatima:[.071,1.8,.036,.008], danny:[.1,2.8,-.006,.014]
 };
 const reactions = {head:[-.09,-5,.012],body:[.1,-3,-.06],low:[.045,-2,-.085],rise:[-.12,-3,.035],guard:[-.035,-2,-.026]};
 const strikes = new Set(['jab','cross','hook','hay','palm','upper','elbow','ovh','hb','shoulder','superman','c_jab','c_up','jpunch','jhp','lariat','swing','lowkick','stomp','c_lk','sweep','teep','knee','rh','hk','jkick','jhk']);
 const loadFrames={jab:16,palm:16,c_jab:16,jpunch:16,cross:18,hook:18,hay:18,upper:18,c_up:18,elbow:18,ovh:21,hb:18,shoulder:18,superman:18,jhp:18};
 const leg = new Set(['lowkick','stomp','c_lk','sweep','teep','knee','rh','hk','jkick','jhk']);
 function segment(f){if(f.state!=='move'||!f.mc)return null;let i=f.mc.segs.findIndex(s=>f.mt<=s.e);if(i<0)i=f.mc.segs.length-1;const s=f.mc.segs[i];return{s,i,t:unit((f.mt-s.s)/Math.max(1,s.e-s.s))};}
 function sample(f){
  const t=f.motionTick||f.st||0,m={x:0,y:0,lean:0,sx:1,sy:1,handDX:0,handDY:0};
  if(f.script||f.lying||['super','locked','throwing','thrown','down','ko','air'].includes(f.state))return m;
  const seg=segment(f);m.segment=seg;
  if (f.state === 'idle') {
   const [pace, bounce, lean, sway] = stance[f.c.id] || stance.murat;
   const phase = t * pace + (f.side || 0) * 1.7;
   m.lean = lean + Math.sin(phase) * sway;
   m.sy = 1 - bounce / 210 * (.5 + .5 * Math.cos(phase * 2));
   m.x = Math.sin(phase) * bounce;
  } else if (['block','cblock'].includes(f.state)) {
   m.sy = 1 + Math.sin(t * .1) * .004;
  }
  else if(['walk','intro'].includes(f.state)){const p=f.walkPh||0,v=Math.min(1.8,Math.abs(f.vx||2)/3);m.y=-Math.abs(Math.sin(p))*1.7*v;m.lean=Math.sign((f.vx||1)*f.facing)*(.018+v*.014)+Math.sin(p)*.007;m.sy=1-Math.abs(Math.cos(p))*.008;}
  else if(['land','prejump'].includes(f.state)){const p=1-unit((f.st||0)/6);m.sy=1-p*.055;m.sx=1+p*.025;}
  else if (['hit','blockstun'].includes(f.state)) {
   const [lean, x, height] = reactions[f.reaction] || reactions.head;
   const decay = Math.exp(-(f.st || 0) / 7);
   m.lean = lean * decay; m.x = x * decay; m.sy = 1 + height * decay;
   if (f.reaction === 'rise') m.y = -4 * decay;
  }
  else if(f.state==='jump'){m.sy=1+Math.min(.024,Math.abs(f.vy||0)*.002);m.lean=(f.vx||0)*.004;}
  if (seg) {
   const {s, i, t: p} = seg;
   const action = strikes.has(s.p), kick = leg.has(s.p), load = typeof s.p === 'string' && s.p.endsWith('_c');
   const previous = f.mc.segs[i - 1];
   const power = f.move?.comboEnd ? 1.3 : 1;
   if (load) {
    const amount = smooth(p);
    m.lean = -.035 * amount; m.sy = 1 - .026 * amount; m.x = -2.5 * amount;
   } else if (action) {
    const amount = s.hold ? 1 : out(p);
    m.lean = lerp(-.035, kick ? -.043 : .063, amount) * power;
    m.x = lerp(-2.5, kick ? 1.5 : 4, amount) * power;
    m.sy = lerp(.974, kick ? 1.018 : 1.008, amount);
   } else if (s.p == null && strikes.has(previous?.p)) {
    const settle = 1 - smooth(p);
    const wasKick = leg.has(previous.p);
    m.lean = (wasKick ? -.043 : .063) * power * settle;
    m.x = (wasKick ? 1.5 : 4) * power * settle;
    m.sy = 1 + (wasKick ? .018 : .008) * settle;
   }
   m.striking = action;
   m.loading = load;
   m.weaponLoading = !!f.move?.weaponStyle && load;
   m.weaponRecovery = !!f.move?.weaponStyle && s.p == null;
   m.loadFrame = load ? f.startArtFrame : action && !s.hold ? (loadFrames[s.p] ?? (kick ? 22 : 18)) : null;
   m.handBlend = load ? smooth(Math.min(1, p * 1.8)) : out(p);
  }
  return m;
 }
 function apply(ctx,m){ctx.transform(m.sx,0,-m.lean,m.sy,m.x,m.y);}
 function hand(f,art){
  if(typeof WeaponArt==='undefined')return null;
  const h=WeaponArt.handPoint(f,art.frame,art.frameIndex,art.size,art.airOffset),m=art.motion;
  if(m?.loadFrame!=null&&m.loadFrame!==art.frameIndex&&m.handBlend<.999){const source=CharacterArt.entries.get(f.c.id)?.data.frames[m.loadFrame];if(source){const from=WeaponArt.handPoint(f,source,m.loadFrame,art.size,0);m.handDX=Math.max(-32,Math.min(32,(from.x-h.x)*(1-m.handBlend)));m.handDY=Math.max(-25,Math.min(25,(from.y-h.y)*(1-m.handBlend)));}}
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
 const arcs = {bat:[-118,18],staff:[-69,3],hammer:[-137,17],axe:[-132,15],sword:[-108,9],tonfa:[-88,12],chain:[-143,14],spear:[-26,-2],knuckles:[-25,-3],blade:[-72,7]};
 function weapon(f, art) {
  const family = f.equipment?.weapon?.family || 'bat';
  const [wind, contact] = arcs[family] || arcs.bat;
  const motion = art.motion, seg = motion?.segment;
  const rest = family === 'chain' ? 63 : ['spear','staff'].includes(family) ? -18 : -34;
  const bob = Math.sin(f.state === 'walk' ? f.walkPh : (f.motionTick || 0) * .05);
  if (!seg || !f.move?.weaponStyle) return {angle:rest + bob * (f.state === 'walk' ? 7 : 3) + (motion?.lean || 0) * 30, trail:0};
  const {s,t} = seg;
  if (motion.weaponLoading) return {angle:lerp(f.startWeaponAngle ?? rest, wind, smooth(t)),trail:0};
  if (motion.weaponRecovery) return {angle:lerp(contact + 14, rest, smooth(t)),trail:0};
  if (motion.striking) {
   const angle = s.hold ? contact + 14 * smooth(t) : lerp(wind, contact, out(t));
   return {angle, trail:s.hold ? 1 - t : t, from:wind, to:angle};
  }
  return {angle:rest,trail:0};
 }
 return{sample,apply,hand,paint,weapon,segment,warpPoint};
})();

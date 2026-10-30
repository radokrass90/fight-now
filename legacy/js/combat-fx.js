'use strict';
// Blender art is optional: procedural rings still work before it loads.
const CombatFX = (()=>{
  const atlas=new Image();let loaded=false;
  atlas.onload=()=>{loaded=true;};atlas.src='assets/effects/impact-atlas.webp';
  const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  let full=store.get('impactEffects',true);
  const maxParticles=typeof MOBILE!=='undefined'&&MOBILE?90:160;
  const motion=()=>full&&!reduced;
  function toggle(){full=!full;store.set('impactEffects',full);}
  function emit(match,x,y,options={}){
    const power=Math.max(1,Math.min(4,options.power||1)),blocked=!!options.blocked;
    const strength=blocked?2:[0,5,13,18,23][power];
    match.shake=Math.max(match.shake||0,strength);
    match.impactFocus={x,y,age:0,life:blocked?10:22,power,blocked,facing:options.facing||1};
    const life=blocked?12:power>=3?22:17;
    match.fx.push({k:'impact3d',x,y,life,max:life,power,blocked,col:options.color||(blocked?'#83dfff':'#ffd978'),angle:(options.facing||1)>0?0:Math.PI});
    if(power>=2&&!blocked)match.fx.push({k:'shockring',x,y,life:22,max:22,power,col:options.color||'#ffbe63'});
    if(power>=3&&!blocked){
      match.fx.push({k:'groundring',x,y:GROUND,life:26,max:26,power,col:'#f8d99a'});
      match.fx.push({k:'speedlines',x,y,life:12,max:12,power,col:'#fff4d7'});
    }
    if(match.fx.length>maxParticles)match.fx.splice(0,match.fx.length-maxParticles);
  }
  function ground(match,x){
    match.fx.push({k:'groundring',x,y:GROUND,life:24,max:24,power:2,col:'#d8c8b4'});
    match.shake=Math.max(match.shake||0,10);
    if(match.fx.length>maxParticles)match.fx.splice(0,match.fx.length-maxParticles);
  }
  function camera(match){
    if(!motion())return {dx:0,dy:0,zoom:1.08,roll:0};
    const s=Math.min(23,match.shake||0),f=match.impactFocus;
    const pulse=f&&!f.blocked?Math.max(0,1-f.age/f.life):0;
    return {dx:Math.sin(match.T*2.37)*s*.75+(f?.facing||1)*pulse*3,
      dy:Math.cos(match.T*3.13)*s*.35,
      roll:Math.sin(match.T*1.8)*s*.00024,
      zoom:1.08+pulse*(f?.power >= 3 ? .065 : .025)+(match.phase === 'ko' ? .045 : 0)};
  }
  function drawParticle(ctx,f){
    if(!['impact3d','shockring','groundring','speedlines'].includes(f.k))return false;
    const t=1-f.life/f.max,a=Math.max(0,1-t);
    ctx.save();ctx.globalAlpha=a*(full?1:.65);ctx.translate(f.x,f.y);
    if(f.k==='impact3d'){
      const size=70+f.power*34;
      if(loaded&&!f.blocked){
        const frame=Math.min(11,Math.floor(t*12));ctx.globalCompositeOperation='screen';ctx.rotate(f.angle||0);
        ctx.drawImage(atlas,frame%4*256,Math.floor(frame/4)*256,256,256,-size/2,-size/2,size,size);
      }
      ctx.strokeStyle=f.col;ctx.lineWidth=f.blocked?3:2;ctx.beginPath();ctx.arc(0,0,5+t*size*.37,0,Math.PI*2);ctx.stroke();
      if(!f.blocked){ctx.globalAlpha=a*a*.6;const g=ctx.createRadialGradient(0,0,0,0,0,size*.38);g.addColorStop(0,'#fff2ae');g.addColorStop(1,'rgba(255,130,30,0)');ctx.fillStyle=g;ctx.fillRect(-size/2,-size/2,size,size);}
    }else if(f.k==='shockring'){
      ctx.rotate(-.3);ctx.scale(1,.65);ctx.strokeStyle=f.col;ctx.lineWidth=(1-t)*4;
      ctx.beginPath();ctx.arc(0,0,14+t*105,0,Math.PI*2);ctx.stroke();
    }else if(f.k==='groundring'){
      ctx.scale(1,.22);ctx.strokeStyle=f.col;ctx.lineWidth=4*(1-t);
      ctx.beginPath();ctx.arc(0,0,10+t*(100+f.power*25),0,Math.PI*2);ctx.stroke();
    }else if(full){
      ctx.strokeStyle=f.col;ctx.lineWidth=1.5;
      for(let i=0;i<12;i++){const angle=i*Math.PI/6,r=75+t*85;ctx.beginPath();ctx.moveTo(Math.cos(angle)*r,Math.sin(angle)*r*.65);ctx.lineTo(Math.cos(angle)*(r+25),Math.sin(angle)*(r+25)*.65);ctx.stroke();}
    }
    ctx.restore();return true;
  }
  function overlay(ctx,match){
    // Stable HUD: vignette/flash are drawn after world shake and before bars.
    const f=match.impactFocus;if(!f||f.blocked||!motion())return;
    const alpha=Math.max(0,1-f.age/5)*(f.power >= 3 ? .12 : .055);
    if(alpha){ctx.fillStyle=`rgba(255,220,155,${alpha})`;ctx.fillRect(0,0,W,H);}
    const pulse=Math.max(0,1-f.age/f.life);
    if(f.power>=2&&pulse){const g=ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,W*.6);g.addColorStop(0,'rgba(12,4,0,0)');g.addColorStop(1,`rgba(20,5,0,${pulse*.32})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
  }
  return {emit,ground,camera,drawParticle,overlay,toggle,maxParticles,get full(){return full;},get reduced(){return reduced;}};
})();

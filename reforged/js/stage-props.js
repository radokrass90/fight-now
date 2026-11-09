'use strict';
// Four Blender models, one shared 4 MiB decoded atlas for all fifteen arenas.
const StageProps = (()=>{
  const atlas=new Image();let ready=false;
  atlas.onload=()=>{ready=true;};atlas.src='assets/props-3d/street-atlas.webp';
  const vent=new Image();let ventReady=false;
  const cell=typeof MOBILE!=='undefined'&&MOBILE?192:384;
  vent.onload=()=>{ventReady=true;};vent.src='assets/reforged-3d/vent-atlas'+(cell===192?'-mobile':'')+'.webp';
  // Barrel drums, tires, timber crates, safety barrier.
  const themes=[[2,0],[0,3],[3,2],[3,1],[1,0],[0,2],[2,0],[0,3],[2,3],[0,2],[1,3],[0,2],[3,2],[1,0],[2,0]];
  function prop(ctx,type,x,y,size,flip=false){
    ctx.save();ctx.translate(x,y);ctx.scale(flip?-1:1,1);
    ctx.drawImage(atlas,type%2*512,Math.floor(type/2)*512,512,512,-size*.5,-size*.70,size,size);
    ctx.restore();
  }
  // One small moving detail per district. Coordinates keep the effects above the fight.
  const signatures = [
    ['train',132,304,'#ffc16b'], ['neon',766,234,'#ff4bb0'], ['sign',738,271,'#8de9fa'],
    ['lights',701,225,'#fff0ad'], ['steam',806,326,'#bbdded'], ['embers',814,326,'#ffae56'],
    ['steam',138,321,'#ffc67b'], ['neon',221,242,'#fa715a'], ['snow',722,232,'#d0eaff'],
    ['beacon',822,203,'#ffd585'], ['lights',760,224,'#c3ecff'], ['steam',801,312,'#ffb775'],
    ['windows',732,230,'#ffdb9b'], ['sparks',778,290,'#ffce78'], ['sign',191,233,'#92d9ff']
  ];
  function signature(ctx, index, time) {
    const [kind,x,y,color] = signatures[index];
    const still = typeof CombatFX !== 'undefined' && CombatFX.reduced;
    const t = still ? 27 : time;
    ctx.save();
    ctx.translate(x,y);
    ctx.beginPath(); ctx.rect(-115,-57,230,120); ctx.clip();
    ctx.fillStyle = color;
    if (kind === 'train') {
      const offset = (t * 2.1) % 730 - 245;
      ctx.globalAlpha = .62;
      for (let i = 0; i < 14; i++) ctx.fillRect(offset + i * 18,-3,12,3);
      ctx.globalAlpha = .24;
      ctx.fillRect(offset,-7,247,1);
    } else if (['steam','embers','snow','sparks'].includes(kind)) {
      const hot = kind === 'embers' || kind === 'sparks';
      const steam = kind === 'steam';
      const count = steam ? 7 : 12;
      for (let i = 0; i < count; i++) {
        const phase = ((t + i * 21) % 144) / 144;
        const drift = Math.sin(i * 8.2 + phase * 3);
        const dx = steam ? drift * (5 + phase * 22) : drift * (8 + phase * 72);
        const dy = kind === 'snow' ? phase * 97 - 47 : -phase * (steam ? 60 : 43) + (kind === 'sparks' ? phase * phase * 56 : 0);
        ctx.globalAlpha = (1 - phase) * (steam ? .09 : hot ? .7 : .42);
        if (steam) {
          ctx.beginPath(); ctx.arc(dx,dy,4 + phase * 20,0,Math.PI * 2); ctx.fill();
        } else ctx.fillRect(dx,dy,hot ? 2 : 1.6,kind === 'sparks' ? 4 : 2);
      }
    } else {
      const pulse = .5 + .5 * Math.sin(t * (kind === 'beacon' ? .057 : .035));
      const opacity = kind === 'lights' ? (t % 239 < 15 ? .08 : .51) : .24 + pulse * .28;
      const glow = ctx.createRadialGradient(0,0,1,0,0,kind === 'beacon' ? 58 : 38);
      glow.addColorStop(0,color); glow.addColorStop(1,'transparent');
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = opacity * .38;
      ctx.fillStyle = glow; ctx.fillRect(-65,-58,130,116);
      ctx.globalAlpha = opacity; ctx.fillStyle = color;
      if (kind === 'beacon') ctx.fillRect(-3,-1,6,2);
      else if (kind === 'windows') for (let i = 0; i < 4; i++) ctx.fillRect(-22 + i * 14,0,4,7);
      else ctx.fillRect(kind === 'lights' ? -16 : -9,-1,kind === 'lights' ? 32 : 18,2);
    }
    ctx.restore();
  }
  function back(ctx,index,T){
    const [left,right]=themes[index]||themes[0];
    // Keep tall dressing at the edges, behind fighters and outside the HUD.
    if(ready){prop(ctx,left,88,GROUND-10,172);prop(ctx,right,W-88,GROUND-16,170,true);}
    if(ventReady&&[4,6,9,10,13].includes(index)){
      const moving=typeof CombatFX==='undefined'||(CombatFX.full&&!CombatFX.reduced);
      const frame=moving?Math.floor(T/3)%12:0,x=index%2?W-102:102,y=GROUND-55;
      ctx.save();ctx.globalCompositeOperation='screen';
      const glow=ctx.createRadialGradient(x,y,7,x,y,78);glow.addColorStop(0,'rgba(40,182,255,.13)');glow.addColorStop(1,'rgba(40,182,255,0)');
      ctx.fillStyle=glow;ctx.fillRect(x-78,y-78,156,156);ctx.restore();
      ctx.drawImage(vent,frame%4*cell,Math.floor(frame/4)*cell,cell,cell,x-48,y-48,96,96);
    }
  }
  function front(ctx,index,T){
    if(!ready)return;
    ctx.save();ctx.globalAlpha=.82;
    // Cropped foreground silhouettes create depth without covering the fight.
    prop(ctx,(themes[index]||themes[0])[0],-16,H+64,180);
    ctx.restore();
  }
  return {back,front,signature,get ready(){return ready;},themes};
})();

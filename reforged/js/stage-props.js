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
  return {back,front,get ready(){return ready;},themes};
})();

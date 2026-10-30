'use strict';
// Four Blender models, one shared 4 MiB decoded atlas for all fifteen arenas.
const StageProps = (()=>{
  const atlas=new Image();let ready=false;
  atlas.onload=()=>{ready=true;};atlas.src='assets/props-3d/street-atlas.webp';
  // Barrel drums, tires, timber crates, safety barrier.
  const themes=[[2,0],[0,3],[3,2],[3,1],[1,0],[0,2],[2,0],[0,3],[2,3],[0,2],[1,3],[0,2],[3,2],[1,0],[2,0]];
  function prop(ctx,type,x,y,size,flip=false){
    ctx.save();ctx.translate(x,y);ctx.scale(flip?-1:1,1);
    ctx.drawImage(atlas,type%2*512,Math.floor(type/2)*512,512,512,-size*.5,-size*.70,size,size);
    ctx.restore();
  }
  function back(ctx,index,T){
    if(!ready)return;
    const [left,right]=themes[index]||themes[0];
    // Keep tall dressing at the edges, behind fighters and outside the HUD.
    prop(ctx,left,88,GROUND-10,172);
    prop(ctx,right,W-88,GROUND-16,170,true);
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

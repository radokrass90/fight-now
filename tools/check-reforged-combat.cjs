const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../game');
const sb={console,URLSearchParams,Math,Image:class{set src(value){this.onload?.();}},localStorage:{getItem(){return null;},setItem(){}},Snd:new Proxy({},{get:()=>()=>{}})};
vm.createContext(sb);
vm.runInContext(fs.readFileSync(root+'/js/core.js','utf8').split('// ---------- синтезирани')[0],sb);
for(const file of ['i18n','language','data','render','combat-fx','fight','finishers'])vm.runInContext(fs.readFileSync(root+'/js/'+file+'.js','utf8'),sb);
vm.runInContext(`
function testMatch(mode='training',index=0){
 const m=new Match({mode,arena:0,c1:CHARS[index],c2:CHARS[(index+7)%15],ctrl1:{type:'human'},ctrl2:{type:'dummy'}});
 m.phase='play';m.banner=null;const [a,b]=m.p;a.x=300;b.x=700;a.state=b.state='idle';m.inputs=[{P:{}},{P:{}}];m.readInput=f=>m.inputs[f.side];return m;
}
this.api={Match,AI,CHARS,compileMove,HT,testMatch,THROWS};
`,sb);
const {api}=sb;
function run(code){return vm.runInContext(code,sb);}

// A single edge during ten frozen hitstop frames must become exactly one
// heavy→special follow-up on the first recovery frame.
run(`{
 const m=testMatch(),[a,b]=m.p;m.startMove(a,a.c.moves.HP);a.connected=true;a.mt=a.mc.segs.at(-1).s;m.hitstop=10;
 m.inputs[0]={P:{sp:true}};m.update();m.inputs[0]={P:{}};
 for(let i=0;i<9;i++)m.update();
 if(m.simFrame!==0||a.attackBuffer?.key!=='sp')throw Error('Hitstop consumed buffered input');
 m.update();if(a.move!==a.c.sp1m||a.chain!==1||a.attackBuffer)throw Error('Buffered special did not cancel once');
 this.hitstopBuffer=true;
}`);

// Input expiry prevents an old button from attacking long after hitstun ends.
run(`{
 const m=testMatch(),a=m.p[0];a.state='hit';a.hitstun=20;m.inputs[0]={P:{hp:true}};m.update();m.inputs[0]={P:{}};
 for(let i=0;i<23;i++)m.update();if(a.move||a.state!=='idle')throw Error('Expired buffer replayed');
 const n=testMatch(),f=n.p[0];f.state='hit';f.hitstun=3;n.inputs[0]={P:{hp:true}};n.update();n.inputs[0]={P:{}};
 for(let i=0;i<3;i++)n.update();if(f.move!==f.c.moves.HP)throw Error('Short recovery buffer lost');
 this.bufferExpiry=true;
}`);

run(`{
 const m=testMatch(),[a,b]=m.p;m.startMove(a,a.c.moves.LP);a.mt=a.mc.segs.at(-1).s+1;b.state='block';
 m.resolveHit(a,b,HT(32,'h',14,2.5,'fh'),400,350,false);
 if(a.connected)throw Error('Blocked hit opened clean-hit cancel');
 m.bufferAttack(a,{P:{hp:true}});m.updateMove(a,b);if(a.move!==a.c.moves.LP)throw Error('Blocked normal canceled recovery');
 // Heavy cannot loop down into light even after a hit.
 m.startMove(a,a.c.moves.HP);a.mt=a.mc.segs.at(-1).s+1;a.connected=true;
 m.bufferAttack(a,{P:{lp:true}});m.updateMove(a,b);if(a.move!==a.c.moves.HP)throw Error('Heavy-to-light pressure loop');
 this.cleanHitRoutes=true;
}`);

run(`{
 const m=testMatch(),[a,b]=m.p;b.state='block';b.guardStart=m.simFrame;b.hp=1000;
 m.resolveHit(a,b,HT(80,'m',24,6,'fh',{special:1}),400,350,false);
 if(b.hp!==1000||b.hitstun!==3||b.meter!==60||!m.texts.some(t=>t.t===localize('PERFECT GUARD')))throw Error('Perfect guard reward/window incorrect');
 b.state='block';b.guardStart=m.simFrame-5;b.hp=1000;
 m.resolveHit(a,b,HT(80,'m',24,6,'fh',{special:1}),400,350,false);
 if(b.hp!==988||b.hitstun===3)throw Error('Held block received perfect timing');
 // High guard cannot perfectly block a low attack.
 b.state='block';b.guardStart=m.simFrame;b.hp=1000;m.resolveHit(a,b,HT(40,'l',18,4,'ff'),400,430,false);
 if(b.hp===1000)throw Error('Perfect guard bypassed high/low rules');
 this.perfectGuard=true;
}`);

run(`{
 const m=testMatch(),[a,b]=m.p;b.y=100;b.state='air';b.juggle=3;
 m.resolveHit(a,b,HT(40,'m',18,4,'fh',{launch:8}),400,350,false);
 if(b.juggle!==4||b.vy>=0||b.invul<50)throw Error('Juggle cap did not force protected fall');
 for(let i=0;i<30;i++)m.physics();if(b.state!=='down'||b.y!==0)throw Error('Air recovery did not reach ground');
 this.juggleLimit=true;
}`);

// Run the complete cinematic, including all six strikes, without shortcutting
// the final state. This catches a stuck locked fighter or missing final launch.
run(`{
 const m=testMatch(),[a,b]=m.p;b.x=365;m.startSuper(a,b);
 for(let i=0;i<80&&a.state==='super';i++)m.updateSuper(a);
 if(a.state!=='idle'||a.sup||b.state!=='air'||b.vy!==13)throw Error('Super did not unlock into final launch');
 if(m.trainingStats.lastCombo.hits!==6||m.trainingStats.bestCombo.damage!==270)throw Error('Super training telemetry incomplete');
 this.superRelease=true;
}`);

// CPU notices a visible move, but never blocks on that same frame. Repeated
// uses of the same move object are distinguished by their serial number.
run(`{
 const original=Math.random;Math.random=()=>0;
 try{
  for(const level of ['easy','normal','hard']){
   const m=testMatch(),[op,me]=m.p;me.x=op.x+100;me.state='idle';m.startMove(op,op.c.moves.HP);const ai=new AI(level);
   let blockedAt=-1;
   for(let frame=0;frame<=ai.L.react;frame++){m.simFrame=frame;if(ai.think(me,op,m).bl&&blockedAt<0)blockedAt=frame;}
   if(blockedAt!==ai.L.react)throw Error('CPU ignored reaction delay on '+level+': '+blockedAt);
   ai.reset();if(ai.pendingThreat||ai.blockFor||ai.plan.length)throw Error('CPU round reset retained an action');
  }
 }finally{Math.random=original;}
 this.fairReaction=true;
}`);

const realCombo=run(`{
 const m=testMatch(),[a,b]=m.p;a.x=400;b.x=478;
 const sent={lp:false,hp:false,sp:false};
 for(let frame=0;frame<300;frame++){
  let button=null;
  if(!sent.lp)button='lp';
  else if(a.move===a.c.moves.LP&&a.connected&&!sent.hp)button='hp';
  else if(a.move===a.c.moves.HP&&a.connected&&!sent.sp)button='sp';
  if(button)sent[button]=true;m.inputs[0]={P:button?{[button]:true}:{}};m.update();
 }
 ({sent,best:m.trainingStats.bestCombo,last:m.trainingStats.lastCombo,total:m.trainingStats.totalDamage});
}`);
assert(realCombo.sent.lp&&realCombo.sent.hp&&realCombo.sent.sp,'Real geometry did not confirm the route: '+JSON.stringify(realCombo));
assert(realCombo.best.hits>=3,'Real hit-confirm route dropped: '+JSON.stringify(realCombo));

const pressure=run(`{
 let maximum=0,escapeWindows=0;
 for(let index=0;index<15;index++){
  const m=testMatch('training',index),[a,b]=m.p;
  for(let frame=0;frame<900;frame++){
   // Hold spacing at the corner so pushback cannot hide an infinite loop.
   a.x=830;b.x=914;m.inputs[0]={P:{lp:true}};m.update();
   maximum=Math.max(maximum,b.comboHits);
   if(frame>60&&b.free)escapeWindows++;
  }
 }
 ({maximum,escapeWindows});
}`);
assert(pressure.maximum<=3,'Light chains bypassed the two-cancel limit: '+JSON.stringify(pressure));
assert(pressure.escapeWindows>15,'Relentless corner pressure left no defense windows');

const finishers=run(`{
 let completed=0;
 for(let index=0;index<15;index++)for(const facing of [1,-1]){
  const m=testMatch('versus',index),[a,b]=m.p;a.x=facing>0?400:600;b.x=a.x+facing*110;
  m.winner=a;m.loser=b;a.wins=2;b.hp=0;m.startFinisher();
  for(let frame=0;frame<1500&&m.phase!=='matchOver';frame++){
   m.update();
   for(const f of m.p)if(![f.x,f.y,f.rot,f.sc,f.alpha,...Object.values(f.pose)].every(Number.isFinite))throw Error('Finisher geometry became non-finite: '+a.c.fin+' frame '+frame+' direction '+facing);
  }
  if(m.phase!=='matchOver')throw Error('Finisher did not complete '+a.c.fin);
  completed++;
 }
 completed;
}`);
assert.equal(finishers,30);

// Exercise real state transitions and actual hit geometry for every character
// with a seeded opponent. A bounded test catches NaN states and stuck matches.
const report=run(`{
 const result=[];
 for(let index=0;index<15;index++){
  const m=new Match({mode:'versus',arena:index,c1:CHARS[index],c2:CHARS[(index+7)%15],ctrl1:{type:'cpu',level:'normal'},ctrl2:{type:'cpu',level:'normal'}});
  const rng=seeded(700+index),original=Math.random;Math.random=rng;
  try{
   for(let frame=0;frame<18000&&m.phase!=='matchOver';frame++){
    m.update();
    for(const f of m.p)if(!Number.isFinite(f.x+f.y+f.hp+f.meter))throw Error('Non-finite fighter state '+index+' frame '+frame+' '+JSON.stringify({id:f.c.id,state:f.state,x:f.x,y:f.y,hp:f.hp,meter:f.meter,vy:f.vy,vx:f.vx,phase:m.phase,thr:f.thr,sup:f.sup}));
   }
  }finally{Math.random=original;}
  if(m.phase!=='matchOver')throw Error('Seeded CPU match did not finish: '+index+' phase='+m.phase);
  result.push({fighter:CHARS[index].id,rounds:m.round,winner:m.result.winner.c.id});
 }
 result;
}`);
assert.equal(report.length,15);
for(const name of ['hitstopBuffer','bufferExpiry','cleanHitRoutes','perfectGuard','juggleLimit','superRelease','fairReaction'])assert.equal(sb[name],true,name);
console.log(JSON.stringify({hitstopBuffer:sb.hitstopBuffer,bufferExpiry:sb.bufferExpiry,cleanHitRoutes:sb.cleanHitRoutes,realHitConfirmCombo:realCombo,cornerPressure:pressure,perfectGuard:sb.perfectGuard,juggleLimit:sb.juggleLimit,superRelease:sb.superRelease,fairReaction:sb.fairReaction,completedFinishersBothDirections:finishers,completedSeededMatches:report},null,2));

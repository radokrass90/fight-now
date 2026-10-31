const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../game');
const sb={console,Math,URLSearchParams,localStorage:{getItem(){return null;},setItem(){}},Image:class{set src(v){this.onload?.();}},Snd:new Proxy({},{get:()=>()=>{}})};vm.createContext(sb);
vm.runInContext(fs.readFileSync(root+'/js/core.js','utf8').split('// ---------- синтезирани')[0],sb);
for(const name of ['i18n','language','data','render','combat-fx','combat-motion','fight','finishers'])vm.runInContext(fs.readFileSync(root+'/js/'+name+'.js','utf8'),sb);
const run=s=>vm.runInContext(s,sb);
run(`function scenario(index,facing=1){const m=new Match({mode:'training',arena:0,c1:CHARS[index],c2:CHARS[(index+7)%15],ctrl1:{type:'human'},ctrl2:{type:'dummy'}});m.phase='play';m.banner=null;const[a,b]=m.p;a.x=facing===1?400:560;b.x=a.x+facing*75;a.facing=facing;b.facing=-facing;a.state=b.state='idle';m.inputs=[{P:{}},{P:{}}];m.readInput=f=>m.inputs[f.side];return m;}`);
const report=run(`{
 const results=[];
 for(let index=0;index<15;index++)for(const facing of [1,-1])for(const routeIndex of [0,1]){
  const m=scenario(index,facing),[a,b]=m.p,route=a.c.combos[routeIndex];let sent=0,lastSerial=-1,hitAt=-1;
  for(let frame=0;frame<230;frame++){
   let button=null;if(sent===0)button=route.buttons[sent++];
   else if(a.connected&&a.moveSerial!==lastSerial&&sent<route.buttons.length){button=route.buttons[sent++];lastSerial=a.moveSerial;}
   m.inputs[0]={P:button?{[button]:true}:{}};m.update();
   if(b.comboHits===route.buttons.length&&hitAt<0)hitAt=frame;
   if(!Number.isFinite(a.x+b.x+a.vx+b.hp))throw Error('Nonfinite motion');
  }
  results.push({id:a.c.id,route:routeIndex,facing,sent,hits:m.trainingStats.bestCombo.hits,damage:m.trainingStats.bestCombo.damage,hitAt});
 }
 results;
}`);
const failed=report.filter(r=>r.sent<(r.route===0?4:3)||r.hits<(r.route===0?4:3));
console.log(JSON.stringify({routes:report.length,failed,examples:report.slice(0,4)},null,2));assert.equal(failed.length,0,'Authored routes must hit using actual geometry, without forced positions/stun.');
const weapons=run(`{
 const rows=[];
 for(let index=0;index<15;index++)for(const family of Object.keys(WEAPON_STRINGS))for(const facing of [1,-1]){
  const m=scenario(index,facing),[a,b]=m.p;a.equipment={weapon:{family}};let sent=0,serial=-1;
  const keys=['lp','hp','hp'];for(let t=0;t<200;t++){let key=null;if(!sent)key=keys[sent++];else if(a.connected&&a.moveSerial!==serial&&sent<3){key=keys[sent++];serial=a.moveSerial;}m.inputs[0]={P:key?{[key]:true}:{}};m.update();}
  rows.push({fighter:a.c.id,family,facing,hits:m.trainingStats.bestCombo.hits});
 }
 rows;
}`);
assert(weapons.every(w=>w.hits>=3),JSON.stringify(weapons));
run(`{
 const m=scenario(0),[a,b]=m.p;b.state='block';m.inputs[0]={P:{lp:true}};m.update();m.inputs[0]={bl:true,P:{}};m.inputs[1]={bl:true,P:{}};for(let i=0;i<40;i++){m.inputs[0]={P:i===12?{lp:true}:{}};m.update();}if(a.comboRoute)throw Error('Guard opened a string');
 const n=scenario(0),f=n.p[0];n.inputs[0]={r:true,P:{}};n.update();n.inputs[0]={P:{}};n.update();n.inputs[0]={r:true,P:{}};n.update();if(f.dashUntil<=n.simFrame||f.vx<f.c.walk)throw Error('Double tap dash failed');
 n.paused=true;const snap=JSON.stringify(CombatMotion.sample(f));for(let i=0;i<10;i++)n.update();if(snap!==JSON.stringify(CombatMotion.sample(f)))throw Error('Pause moved presentation');
}`);
run(`{
 const m=scenario(0),[a,b]=m.p,keys={0:'lp',4:'lp',5:'hp',7:'hk'};
 for(let t=0;t<180;t++){m.inputs[0]={P:keys[t]?{[keys[t]]:true}:{}};m.update();}
 if(m.trainingStats.bestCombo.hits!==4)throw Error('Rapid four-button input was overwritten: '+JSON.stringify(m.trainingStats));
}`);
fs.mkdirSync(path.resolve(root,'../review/dynamic-combat'),{recursive:true});fs.writeFileSync(path.resolve(root,'../review/dynamic-combat/logic.json'),JSON.stringify({routes:report,weapons},null,2));console.log('PASS: 60 real character strings + 300 weapon strings, both directions, guard, dash and frozen presentation.');

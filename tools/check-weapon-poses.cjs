const fs=require('node:fs'),path=require('node:path');
const setup=fs.readFileSync(path.join(__dirname,'check-economy-runtime.cjs'),'utf8').split('(async()=>{')[0];
const {run,sb,createCanvas,root}=new Function('require','__dirname',setup+';return {run,sb,createCanvas,root};')(require,__dirname);
(async()=>{
 await run('Economy.ready');const out=path.resolve(root,'../review/weapon-art');fs.mkdirSync(out,{recursive:true});
 const catalog=run('WEAPON_CATALOG.weapons'),chars=run('CHARS');const poses=[['idle',null],['block',null],['crouch',null],['walk',null],['move','jab'],['move','cross'],['move','hook'],['move','upper'],['move','lowkick'],['move','rh'],['move','jab_c'],['move','cross_c']];
 for(const family of process.argv.includes('--fighters')?[]:[...new Set(catalog.filter(w=>w.art?.version===2).map(w=>w.family))]){
 const w=catalog.find(w=>w.family===family&&w.art?.version===2);const canvas=createCanvas(1200,Math.ceil(poses.length/4)*300),g=canvas.getContext('2d');g.fillStyle='#182833';g.fillRect(0,0,canvas.width,canvas.height);
 await run("CharacterArt.prepare(['murat','nadine'])");const image=run(`WeaponArt.prepare('${w.id}')`);await image.decode();
 for(let n=0;n<poses.length;n++){
 const [state,pose]=poses[n],x=n%4*300,y=Math.floor(n/4)*300;sb.testCtx=g;sb.weaponId=w.id;sb.qaState=state;sb.qaPose=pose;sb.qaFacing=n%2?-1:1;
 g.save();g.translate(x+150,y+275);g.scale(1.35,1.35);g.translate(-450,-run('GROUND'));
 run(`{const m=new Match({mode:'training',arena:0,c1:CHARS[0],c2:CHARS[7],ctrl1:{type:'human'},ctrl2:{type:'dummy'},economy:{loadout:{weaponId,upgrades:{}}}});const f=m.p[0];f.x=450;f.y=0;f.state=qaState;f.facing=qaFacing;f.walkPh=Math.PI*.6;if(qaPose){f.mc={segs:[{s:0,e:10,p:qaPose,hold:true}]};f.mt=3;}const art=CharacterArt.draw(testCtx,f);WeaponArt.draw(testCtx,f,art);this.qaIndex=art.frameIndex;this.qaBounds=art.frame.bounds;this.qaSize=art.size;}`);g.restore();g.fillStyle='#d6e6ef';g.font='14px sans-serif';g.fillText(w.id+' · '+state+' '+(pose||'')+' · frame '+sb.qaIndex,x+15,y+23);
 }
 fs.writeFileSync(path.join(out,'poses-'+family+'.png'),canvas.toBuffer('image/png'));console.log(family+' pose sheet rendered');
 }
 const measurements=[];if(process.argv.includes('--fighters'))for(let batch=0;batch<3;batch++){
  const c=createCanvas(1200,1500),g=c.getContext('2d');g.fillStyle='#182833';g.fillRect(0,0,1200,1500);sb.testCtx=g;
  const image=run("WeaponArt.prepare('bat-01')");await image.decode();
  for(let row=0;row<5;row++){
   const index=batch*5+row;await run(`CharacterArt.prepare(['${chars[index].id}','${chars[index].id==='nadine'?'murat':'nadine'}'])`);
   for(let column=0;column<3;column++){
    const x=column*400,y=row*300;sb.qaIndex=index;sb.qaColumn=column;g.save();g.translate(x+190,y+275);g.scale(1.35,1.35);g.translate(-450,-run('GROUND'));
    run(`{const m=new Match({mode:'training',arena:0,c1:CHARS[qaIndex],c2:CHARS[7],ctrl1:{type:'human'},ctrl2:{type:'dummy'},economy:{loadout:{weaponId:'bat-01',upgrades:{}}}});const f=m.p[0];f.x=450;f.y=0;f.facing=qaColumn===1?-1:1;f.state=['idle','block','move'][qaColumn];if(qaColumn===2){f.mc={segs:[{s:0,e:10,p:'cross',hold:true}]};f.mt=3;}const art=CharacterArt.draw(testCtx,f);WeaponArt.draw(testCtx,f,art);this.qaBounds=art.frame.bounds;this.qaSize=art.size;}`);
    g.restore();measurements.push({id:chars[index].id,frame:[0,1,5][column],bounds:sb.qaBounds,size:sb.qaSize,facing:column===1?-1:1});g.fillStyle='#d6e6ef';g.font='14px sans-serif';g.fillText(chars[index].id+' · '+['idle','guard','cross'][column],x+15,y+24);
   }
  }
  fs.writeFileSync(path.join(out,'fighters-'+(batch+1)+'.png'),c.toBuffer('image/png'));console.log('Fighter group '+(batch+1)+' rendered');
 }

 if(measurements.length)fs.writeFileSync(path.join(out,'hand-measurements.json'),JSON.stringify(measurements,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});

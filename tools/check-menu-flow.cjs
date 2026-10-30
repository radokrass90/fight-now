const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../game');
// A minimal DOM checks actual menu callbacks and main.js routing without a browser dependency.
class Node {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};this.className='';this.style={setProperty(){}};this.textContent='';this.hidden=false;this.scrollTop=0;this.listeners={};}
 append(...nodes){this.children.push(...nodes);for(const n of nodes)n.parent=this;}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 setAttribute(k,v){this.attributes[k]=String(v);}
 getAttribute(k){return this.attributes[k]??null;}
 addEventListener(k,fn){this.listeners[k]=fn;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
 get classList(){return{contains:k=>this.className.split(' ').includes(k),add:k=>{if(!this.className.split(' ').includes(k))this.className+=' '+k;},toggle:(k,on)=>{const set=new Set(this.className.split(' ').filter(Boolean));if(on)set.add(k);else set.delete(k);this.className=[...set].join(' ');}};}
 querySelectorAll(selector){const matches=n=>selector.startsWith('.')?n.classList.contains(selector.slice(1)):n.tagName===selector.toUpperCase();return this.children.flatMap(n=>[...(matches(n)?[n]:[]),...n.querySelectorAll(selector)]);}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 focus(){document.activeElement=this;}
 click(){this.onclick?.();}
 get fullText(){return[this.textContent,...this.children.map(n=>n.fullText)].join(' ');}
}
const ids=new Map(['mobile-menu','mobile-toolbar','mobilePause','fullscreen','mobile-hint','c','wrap','touch','stick','knob','finBtn','pauseBtn','language-picker','loading'].map(id=>[id,new Node(id==='c'?'canvas':'div')]));
const document={body:new Node('body'),documentElement:new Node('html'),activeElement:null,getElementById:id=>ids.get(id),createElement:tag=>new Node(tag),querySelectorAll:()=>[],addEventListener(){},hidden:false};
ids.get('c').getContext=()=>({});
const prepared=[];
const sb={console,document,Image:class extends Node{constructor(){super('img');}},URL,URLSearchParams,location:{search:'?lang=en'},localStorage:{getItem(){return null;},setItem(){}},window:{},innerWidth:1200,innerHeight:800,getComputedStyle:()=>({paddingLeft:'0',paddingRight:'0',paddingTop:'0',paddingBottom:'0',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr'}),addEventListener(){},performance:{now:()=>0},requestAnimationFrame(){},setTimeout,clearTimeout,
 Snd:{on:true,musicOn:true,init(){},ok(){},ui(){},say(){},stopMusic(){},startMusic(){},toggle(){this.on=!this.on;},toggleMusic(){this.musicOn=!this.musicOn;}},BattleMusic:{title:'Test Track',apply(){}},CombatFX:{full:true,toggle(){this.full=!this.full;}},CharacterArt:{ready:Promise.resolve(),prepare(ids){prepared.push(ids);return Promise.resolve();}},ArenaArt:{ready:Promise.resolve(),prepare(){return Promise.resolve();}},bindTouchControls:()=>({reset(){}}),Touch:{active:false,pressed:new Set()},Keys:{pressed:new Set()},MenuIn:{clicks:[]},Match:class{constructor(opts){this.opts=opts;this.paused=false;}},invalidateArenas(){}};
vm.createContext(sb);
vm.runInContext(fs.readFileSync(root+'/js/core.js','utf8').split('// ---------- синтезирани')[0],sb);
for(const file of ['i18n','language','data','arena-art-data','arenas','main','mobile-ui'])vm.runInContext(fs.readFileSync(root+'/js/'+file+'.js','utf8'),sb,{filename:file+'.js'});
const run=code=>vm.runInContext(code,sb),panel=ids.get('mobile-menu');
const catalog=run('I18N_DE');
for(const file of ['main','mobile-ui'])for(const match of fs.readFileSync(root+'/js/'+file+'.js','utf8').matchAll(/localize\(((?:"(?:\\.|[^"\\])*")|(?:'(?:\\.|[^'\\])*'))\)/g)){const key=vm.runInNewContext(match[1]);assert(Object.hasOwn(catalog,key),'Missing UI German: '+key);}
function click(text){const target=panel.querySelectorAll('button').find(b=>b.fullText.trim()===text||b.textContent===text);assert(target,'Missing button: '+text);target.click();}
run('MobileUI.sync()');assert.equal(panel.querySelectorAll('.mode-action').length,4);assert(!panel.hidden,'Desktop menus must use native DOM');
const training=panel.querySelectorAll('.mode-action')[2];training.click();
assert.equal(run('G.mode'),'training');assert.equal(run('G.screen'),'select');assert.equal(panel.querySelectorAll('.fighter-card').length,15);
run('MobileUI.handleInput({right:true})');assert.equal(run('G.pick[0]'),1,'Arrow navigation selects next fighter');
click('CONFIRM FIGHTER');assert.equal(run('G.selStep'),1);click('CHOOSE ARENA');assert.equal(run('G.screen'),'stage');assert.equal(panel.querySelectorAll('.arena-card').length,15);
click('FIGHT!');assert.equal(run('G.screen'),'vs');assert.equal(run('G.matchOpts.ctrl2.type'),'dummy');assert.equal(prepared[0].length,2);
run("G.screen='fight';G.match={paused:true,p:[{c:CHARS[1]}]};MobileUI.sync()");click('Move list');assert.equal(run('G.screen'),'moves');assert(panel.fullText.includes('Chainsaw'));
click('← Back');assert.equal(run('G.screen'),'fight');assert(run('G.match.paused'));click('RESUME');assert.equal(run('G.match.paused'),false);
run('G.match.paused=true;MobileUI.sync()');click('Restart');assert.equal(run('G.screen'),'vs','Restart must prepare a fresh match and reward ticket');assert.equal(run('BattleMusic.paused'),false);
run("go('title');MobileUI.sync()");panel.querySelectorAll('.mode-action')[3].click();assert.equal(run('G.mode'),'pvp');click('CONFIRM FIGHTER');click('CHOOSE ARENA');click('FIGHT!');assert.equal(run('G.matchOpts.ctrl1.map'),'p1');assert.equal(run('G.matchOpts.ctrl2.map'),'p2');
run("go('title');MobileUI.sync()");panel.querySelectorAll('.mode-action')[1].click();assert.equal(run('G.mode'),'versus');click('CONFIRM FIGHTER');click('CHOOSE ARENA');click('FIGHT!');assert.equal(run('G.matchOpts.ctrl1.type'),'human');assert.equal(run('G.matchOpts.ctrl2.type'),'cpu');assert.equal(run('G.matchOpts.ctrl2.level'),run('G.diff'));
run("go('title');MobileUI.sync()");panel.querySelectorAll('.mode-action')[0].click();click('START ARCADE');assert.equal(run('G.arcade.list.length'),7);assert.equal(run('new Set(G.arcade.list).size'),7);assert.equal(run('G.mode'),'arcade');assert.equal(run('G.screen'),'vs');
console.log('PASS: native desktop and touch menu contract, 15 fighter/arena grids, keyboard selection, training flow, pause/moves/resume/restart, PvP mappings, versus CPU and 7-fight arcade.');

(async()=>{
 await new Promise(r=>setImmediate(r));
 sb.CharacterArt.prepare=()=>Promise.resolve(false);
 run('startFight(4)');await new Promise(r=>setImmediate(r));
 assert.equal(run('G.screen'),'stage');assert.equal(run('G.assetsReady'),false);assert.equal(run('G.stageCur'),4);run('MobileUI.sync()');assert(panel.fullText.includes('Artwork could not be loaded'));
 sb.CharacterArt.prepare=()=>Promise.resolve(true);sb.ArenaArt.prepare=()=>Promise.resolve(false);
 run('startFight(4)');await new Promise(r=>setImmediate(r));assert.equal(run('G.screen'),'stage');assert.equal(run('G.assetsReady'),false);
 sb.ArenaArt.prepare=()=>Promise.resolve(true);run('startFight(4)');await new Promise(r=>setImmediate(r));assert.equal(run('G.screen'),'vs');assert.equal(run('G.assetsReady'),true);assert.equal(run('G.artError'),null);
 // A late failure from an obsolete opponent request cannot replace the newer fight.
 let rejectOld;sb.CharacterArt.prepare=()=>new Promise(r=>{rejectOld=r;});run('startFight(0)');
 sb.CharacterArt.prepare=()=>Promise.resolve(true);run('startFight(4)');rejectOld(false);await new Promise(r=>setImmediate(r));
 assert.equal(run('G.screen'),'vs');assert.equal(run('G.assetsReady'),true);assert.equal(run('G.matchOpts.arena'),4);
 console.log('PASS: fighter/arena loading failure shows retry, successful retry starts the match, obsolete requests cannot replace a newer fight.');
})().catch(e=>{console.error(e);process.exitCode=1;});

'use strict';
// Prices, balances and ownership are authoritative on the server. Cache is read-only offline gear.
const Economy=(()=>{
 const base='https://fightersgame.159.195.207.175.sslip.io/api/v1';
 const read=(k,def)=>{try{return JSON.parse(localStorage.getItem('fightersgame_'+k))??def;}catch{return def;}};
 const save=(k,v)=>{try{localStorage.setItem('fightersgame_'+k,JSON.stringify(v));}catch{}};
 let token=read('token',null),profile=read('profile',null),version=0,online=false,busy=false,error=null;
 const pending=read('claims',[]),weapons=new Map(WEAPON_CATALOG.weapons.map(w=>[w.id,w]));
 function changed(){version++;}
 function setProfile(p){if(profile?.id===p.id&&(p.revision||0)<(profile.revision||0))return profile;profile=p;save('profile',p);online=true;error=null;changed();return p;}
 async function request(path,data,authenticated=true){
  const requestToken=token;const headers={'Content-Type':'application/json'};if(authenticated&&token)headers.Authorization='Bearer '+token;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
  try{
   const res=await fetch(base+path,{method:data===undefined?'GET':'POST',headers,body:data===undefined?undefined:JSON.stringify(data),signal:controller.signal});
   const result=await res.json();if(!res.ok){const e=new Error(typeof result.detail==='string'?result.detail:'request_failed');e.status=res.status;throw e;}
   if(authenticated&&requestToken!==token)throw new Error('session_changed');online=true;return result;
  }catch(e){if(!e.status)online=false;throw e;}finally{clearTimeout(timer);}
 }
 async function connect(){
  try{if(token)setProfile(await request('/profile'));else{const r=await request('/guest',{},false);token=r.token;save('token',token);setProfile(r.profile);}await flush();}
  catch(e){error=e.message;changed();}return profile;
 }
 const ready=connect();
 async function action(path,body){if(busy)return;busy=true;error=null;changed();try{const p=await request(path,body);return setProfile(p);}catch(e){error=e.message;changed();throw e;}finally{busy=false;changed();}}
 function gear(fighter,p=profile){return{weaponId:p?.loadouts?.[fighter]||null,upgrades:{...(p?.upgrades?.[fighter]||{})}};}
 function stats(loadout){const w=weapons.get(loadout?.weaponId),u=loadout?.upgrades||{};return{weapon:w||null,power:1+.025*Math.min(5,Math.max(0,u.power||0))+(w?.damage||0),guard:1-.02*Math.min(5,Math.max(0,u.guard||0)),focus:1+.04*Math.min(5,Math.max(0,u.focus||0))+(w?.meter||0),reach:w?.reach||0};}
 async function begin(opts){
  await ready;await flush();const fallback={matchId:null,loadout:gear(opts.c1.id),opponentLoadout:opts.mode==='pvp'?gear(opts.c2.id):null};
  if(!online||!token||!['versus','arcade'].includes(opts.mode))return fallback;
  try{const r=await request('/matches/start',{fighter:opts.c1.id,opponent:opts.c2.id,mode:opts.mode,difficulty:opts.ctrl2.level||'normal'});setProfile(r.profile);return{matchId:r.matchId,loadout:r.loadout};}
  catch(e){error=e.message;changed();return fallback;}
 }
 let flushing=null;
 function flush(){
  if(flushing)return flushing;if(!token||pending.length===0)return Promise.resolve();
  flushing=(async()=>{
   try{for(const claim of [...pending]){
    try{const r=await request('/matches/finish',claim.body);setProfile(r.profile);claim.match.reward={amount:r.reward,state:'paid'};pending.splice(pending.indexOf(claim),1);}
    catch(e){if([400,403,404,409].includes(e.status)&&e.message!=='match_too_short'){claim.match.reward={amount:0,state:'unavailable'};pending.splice(pending.indexOf(claim),1);}else{claim.match.reward={amount:0,state:'pending'};break;}}
   }}finally{flushing=null;save('claims',pending.map(x=>({body:x.body,match:{}})));changed();}
  })();return flushing;
 }
 function finish(match){
  if(match.reward)return;const id=match.opts?.economy?.matchId;
  if(!id){match.reward={amount:0,state:match.mode==='training'||match.mode==='pvp'?'practice':'offline'};changed();return;}
  match.reward={amount:0,state:'pending'};
  pending.push({body:{matchId:id,won:match.result.winner.side===0,flawless:!!match.result.flawless,finisher:!!match.result.finisher},match});save('claims',pending.map(x=>({body:x.body,match:{}})));flush();
 }
 async function credentials(mode,username,password){busy=true;error=null;changed();try{
  const r=await request('/'+mode,{username,password},mode==='register');
  if(r.token){token=r.token;save('token',token);pending.length=0;save('claims',[]);}return setProfile(r.profile||r);
 }catch(e){error=e.message;changed();throw e;}finally{busy=false;changed();}}
 async function logout(){if(busy)return;if(token)await request('/logout',{});token=null;profile=null;save('token',null);save('profile',null);pending.length=0;save('claims',[]);return connect();}
 function apply(match){const gearInfo=match.opts?.economy?.loadout;for(const f of match.p)f.equipment=stats(f.side===0?gearInfo:match.mode==='pvp'?match.opts?.economy?.opponentLoadout:null);}
 addEventListener('online',()=>connect());
 return{ready,connect,request,begin,finish,flush,gear,stats,apply,weapons,buy:id=>action('/buy',{weaponId:id}),equip:(fighter,weaponId)=>action('/equip',{fighter,weaponId}),upgrade:(fighter,kind)=>action('/upgrade',{fighter,kind}),credentials,logout,get profile(){return profile;},get online(){return online;},get busy(){return busy;},get error(){return error;},get version(){return version;}};
})();

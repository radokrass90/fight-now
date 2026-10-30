'use strict';
const ShopUI=(()=>{
 const state={tab:'weapons',fighter:null,family:'all',page:0},errors={not_enough_coins:'Not enough coins.',weapon_not_owned:'Buy this weapon first.',username_taken:'That player name is already used.',invalid_credentials:'Incorrect name or password.',already_registered:'This profile is already saved.',sign_in_required:'Please log in again.',session_expired:'Please log in again.',slow_down:'Please wait before trying again.',max_level:'Maximum level reached.'};
 let version=0;
 const name=w=>w.name[I18N.language]||w.name.en;
 function message(code){return localize(errors[code]||'Connection unavailable. Try again.');}
 function render(h){
  const{panel,el,button,title,actions,back,image,portrait}=h,p=Economy.profile;
  if(!state.fighter)state.fighter=CHARS[G.pick[0]].id;
  title(localize('STREET ARMORY'),localize('Win coins. Build your fighter. Keep every weapon.'));
  const wallet=el('div',null,'armory-wallet');wallet.append(el('strong','◈ '+(p?.coins??'—')),el('span',Economy.online?localize('Cloud saved'):localize('Offline')),button(localize('ACCOUNT'),()=>{state.tab='account';version++;},'quiet-action','account'));panel.append(wallet);
  if(!Economy.online){panel.append(el('p',localize('Offline. Owned gear remains usable. Purchases require connection.'),'mobile-copy'),button(localize('RECONNECT'),()=>{Economy.connect();},'quiet-action','reconnect'));}
  if(Economy.error){const e=el('p',message(Economy.error),'asset-error');e.setAttribute('role','alert');panel.append(e);}
  const tabs=el('nav',null,'armory-tabs');
  for(const[id,label]of [['weapons','100 WEAPONS'],['inventory','INVENTORY'],['upgrades','HERO UPGRADES']]){const b=button(localize(label),()=>{state.tab=id;state.page=0;state.family='all';version++;},state.tab===id?'selected':'','tab-'+id);b.setAttribute('aria-pressed',String(state.tab===id));tabs.append(b);}panel.append(tabs);
  if(state.tab==='account'){
   const section=el('section',null,'account-card');
   section.append(el('h2',p?.username||localize('Guest fighter')),el('p',localize('Create a name and password to use your purchases on another device.'),'mobile-copy'));
   if(p?.username)section.append(button(localize('SWITCH ACCOUNT'),()=>{Economy.logout().catch(()=>{});},'quiet-action','logout'));
   else{
    const form=el('form');const username=el('input'),password=el('input');username.name='username';username.autocomplete='username';username.minLength=3;username.maxLength=20;username.required=true;username.pattern='[a-zA-Z0-9_]+';password.name='password';password.type='password';password.autocomplete='new-password';password.minLength=8;password.maxLength=128;password.required=true;
    const label1=el('label',localize('Player name (3–20 letters or numbers)'));label1.append(username);const label2=el('label',localize('Password (at least 8 characters)'));label2.append(password);form.append(label1,label2);
    const submit=mode=>{if(!form.reportValidity())return;Economy.credentials(mode,username.value,password.value).catch(()=>{});};
    form.onsubmit=e=>{e.preventDefault();submit('register');};
    const save=button(localize('SAVE THIS PROFILE'),()=>submit('register'),'mobile-primary','register'),login=button(localize('LOG IN TO ANOTHER PROFILE'),()=>submit('login'),'quiet-action','login');save.disabled=login.disabled=Economy.busy;
    save.type='submit';save.onclick=null;form.append(save,login);section.append(form,el('p',localize('Logging in switches profiles. Save this guest first to keep its purchases.'),'mobile-copy'));
   }
   panel.append(section);back(actions(),()=>go(state.back||'title'));return;
  }
  const chooser=el('div',null,'armory-hero'),select=el('select');select.setAttribute('aria-label',localize('Choose your fighter'));
  for(const c of CHARS){const o=el('option',c.name);o.value=c.id;o.selected=c.id===state.fighter;select.append(o);}select.onchange=()=>{state.fighter=select.value;version++;};
  const fighter=CHARS.find(c=>c.id===state.fighter),load=Economy.gear(state.fighter),equipped=Economy.weapons.get(load.weaponId);chooser.append(image(portrait(fighter.id)),select,el('span',localize('Equipped: ')+(equipped?name(equipped):localize('Bare hands'))));
  const unarm=button(localize('BARE HANDS'),()=>{Economy.equip(state.fighter,null).catch(()=>{});},'quiet-action','bare-hands');unarm.disabled=!Economy.online||Economy.busy||!equipped;chooser.append(unarm);panel.append(chooser);
  if(state.tab==='upgrades'){
   const cards=el('div',null,'upgrade-grid');
   for(const u of WEAPON_CATALOG.upgrades){const level=load.upgrades[u.id]||0,cost=100*(level+1),card=el('article',null,'upgrade-card');card.append(el('h2',u.name[I18N.language]),el('strong',localize('LEVEL ')+level+' / 5'),el('p',localize({power:'+2.5% damage per level',guard:'2% less incoming damage per level',focus:'+4% energy gain per level'}[u.id]),'mobile-copy'));
    const b=button(level===5?localize('MAX LEVEL'):localize('UPGRADE')+' · ◈ '+cost,()=>{Economy.upgrade(state.fighter,u.id).catch(()=>{});},'mobile-primary','upgrade-'+u.id);b.disabled=level>=5||!p||p.coins<cost||!Economy.online||Economy.busy;card.append(b);cards.append(card);
   }panel.append(cards);
  }else{
   const filter=el('select');filter.setAttribute('aria-label',localize('Weapon category'));const families=[['all',localize('All categories')],...WEAPON_CATALOG.weapons.filter((_,i)=>i%10===0).map(w=>[w.family,w.familyName[I18N.language]])];
   for(const[id,label]of families){const o=el('option',label);o.value=id;o.selected=id===state.family;filter.append(o);}filter.onchange=()=>{state.family=filter.value;state.page=0;version++;};panel.append(filter);
   const list=WEAPON_CATALOG.weapons.filter(w=>(state.family==='all'||w.family===state.family)&&(state.tab!=='inventory'||p?.owned.includes(w.id))),pages=Math.max(1,Math.ceil(list.length/20));state.page=Math.min(state.page,pages-1);
   const heading=el('p',String(list.length)+' '+localize('weapons')+' · '+localize('Owned: ')+(p?.owned.length||0)+' / 100','mobile-copy');panel.append(heading);
   const cards=el('div',null,'weapon-grid');
   for(const w of list.slice(state.page*20,(state.page+1)*20)){
    const owned=p?.owned.includes(w.id),active=load.weaponId===w.id,card=el('article',null,'weapon-card tier-'+w.tier+(active?' equipped':'')),img=image(w.icon);img.loading='lazy';
    card.append(img,el('span',localize('TIER ')+w.tier,'weapon-tier'),el('h2',name(w)),el('p','+'+Math.round(w.damage*1000)/10+'% '+localize('damage')+' · +'+w.reach+' '+localize('reach'),'mobile-copy'));
    const b=button(active?localize('EQUIPPED'):owned?localize('EQUIP'):localize('BUY & EQUIP')+' · ◈ '+w.price,async()=>{try{if(!owned)await Economy.buy(w.id);await Economy.equip(state.fighter,w.id);}catch{}},active?'selected':'mobile-primary','weapon-'+w.id);
    b.disabled=active||Economy.busy||!Economy.online||!p||(!owned&&p.coins<w.price);card.append(b);cards.append(card);
   }panel.append(cards);
   if(!list.length)panel.append(el('p',localize(p?.owned.length?'No owned weapons in this category.':'Your inventory is empty. Buy a weapon in the armory.'),'mobile-copy'));
   if(pages>1){const a=el('div',null,'armory-pages'),prev=button(localize('Previous'),()=>{state.page--;version++;},'quiet-action','previous'),next=button(localize('Next'),()=>{state.page++;version++;},'quiet-action','next');prev.disabled=state.page===0;next.disabled=state.page>=pages-1;a.append(prev,el('span',(state.page+1)+' / '+pages),next);panel.append(a);}
  }
  panel.append(el('p',localize('Owned weapons never expire. Equipment and upgrades apply from the next match.'),'menu-footnote'));back(actions(),()=>go(state.back||'title'));
 }
 return{render,message,get version(){return version;},open(fighter){state.back=G.screen==='shop'?'title':G.screen;state.fighter=fighter||CHARS[G.pick[0]].id;version++;G.screen='shop';}};
})();

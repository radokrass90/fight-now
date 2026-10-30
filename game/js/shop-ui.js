'use strict';
const ShopUI=(()=>{
 const state={tab:'weapons',fighter:null,family:'all',page:0,previewId:null},errors={not_enough_coins:'Not enough coins.',weapon_not_owned:'Buy this weapon first.',username_taken:'That player name is already used.',invalid_credentials:'Incorrect name or password.',already_registered:'This profile is already saved.',sign_in_required:'Please log in again.',session_expired:'Please log in again.',slow_down:'Please wait before trying again.',max_level:'Maximum level reached.'};
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
   const list=WEAPON_CATALOG.weapons.filter(w=>(state.family==='all'||w.family===state.family)&&(state.tab!=='inventory'||p?.owned.includes(w.id))),pageSize=12,pages=Math.max(1,Math.ceil(list.length/pageSize));state.page=Math.min(state.page,pages-1);
   panel.append(el('p',String(list.length)+' '+localize(list.length===1?'weapon':'weapons')+' · '+localize('Owned: ')+(p?.owned.length||0)+' / 100','armory-count'));
   function purchase(w,key='weapon-'){
    const owned=p?.owned.includes(w.id),active=load.weaponId===w.id;
    const b=button(active?localize('EQUIPPED'):owned?localize('EQUIP'):localize('BUY & EQUIP')+' · ◈ '+w.price,async()=>{try{if(!owned)await Economy.buy(w.id);await Economy.equip(state.fighter,w.id);}catch{}},'weapon-purchase '+(active?'selected':'mobile-primary'),key+w.id);
    b.disabled=active||Economy.busy||!Economy.online||!p||(!owned&&p.coins<w.price);return b;
   }
   const selected=list.find(w=>w.id===state.previewId)||list.find(w=>w.id===load.weaponId)||list[0];
   if(selected){
    const feature=el('section',null,'armory-showcase tier-'+selected.tier);feature.dataset.family=selected.family;feature.setAttribute('aria-label',localize('Weapon details'));
    const stage=el('div',null,'showcase-stage'),large=image(selected.art?.detail||selected.icon,'showcase-weapon');large.alt=name(selected);stage.append(el('span',localize('PERMANENT COLLECTION'),'showcase-kicker'),large);
    const info=el('div',null,'showcase-info');info.append(el('p',selected.familyName[I18N.language]+' / '+localize('TIER ')+selected.tier,'weapon-eyebrow'),el('h2',name(selected)),el('p',localize('One purchase. Equip it whenever you fight.'),'mobile-copy'));
    const stats=el('dl',null,'weapon-specs');for(const [value,label]of [['+'+(Math.round(selected.damage*1000)/10)+'%',localize('damage')],['+'+selected.reach,localize('reach')],['+'+(Math.round(selected.meter*1000)/10)+'%',localize('ENERGY')]]){const item=el('div');item.append(el('dt',label),el('dd',value));stats.append(item);}info.append(stats,purchase(selected,'featured-'));
    if(p?.owned.includes(selected.id))info.append(el('span',localize('OWNED'),'ownership-note'));
    feature.append(stage,info);panel.append(feature);
   }
   const cards=el('div',null,'weapon-grid illustrated-grid');
   for(const w of list.slice(state.page*pageSize,(state.page+1)*pageSize)){
    const owned=p?.owned.includes(w.id),active=load.weaponId===w.id,card=el('article',null,'weapon-card illustrated-card tier-'+w.tier+(active?' equipped':''));card.dataset.family=w.family;
    const inspect=button('',()=>{state.previewId=w.id;version++;panel.scrollTop=0;},'weapon-inspect','inspect-'+w.id);inspect.setAttribute('aria-label',localize('Inspect: ')+name(w));const img=image(w.art?.thumb||w.icon,'weapon-illustration');img.alt=name(w);img.loading='lazy';inspect.append(img,el('span',localize('View details'),'inspect-label'));
    const meta=el('div',null,'weapon-card-meta');meta.append(el('span',localize('TIER ')+w.tier,'weapon-tier'),el('span',active?localize('EQUIPPED'):owned?localize('OWNED'):w.familyName[I18N.language],active||owned?'ownership-note':'weapon-family'));
    card.append(inspect,meta,el('h2',name(w)),el('p','+'+(Math.round(w.damage*1000)/10)+'% '+localize('damage')+' · +'+w.reach+' '+localize('reach'),'weapon-summary'),purchase(w));cards.append(card);
   }panel.append(cards);
   if(!list.length)panel.append(el('p',localize(p?.owned.length?'No owned weapons in this category.':'Your inventory is empty. Buy a weapon in the armory.'),'mobile-copy'));
   if(pages>1){const a=el('div',null,'armory-pages'),prev=button(localize('Previous'),()=>{state.page--;version++;},'quiet-action','previous'),next=button(localize('Next'),()=>{state.page++;version++;},'quiet-action','next');prev.disabled=state.page===0;next.disabled=state.page>=pages-1;a.append(prev,el('span',(state.page+1)+' / '+pages),next);panel.append(a);}

  }
  panel.append(el('p',localize('Owned weapons never expire. Equipment and upgrades apply from the next match.'),'menu-footnote'));back(actions(),()=>go(state.back||'title'));
 }
 return{render,message,get version(){return version;},open(fighter){state.back=G.screen==='shop'?'title':G.screen;state.fighter=fighter||CHARS[G.pick[0]].id;version++;G.screen='shop';}};
})();

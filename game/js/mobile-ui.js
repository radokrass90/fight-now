'use strict';
// Native, responsive menus share one flow across keyboard, gamepad and touch.
const MobileUI = (()=>{
  const panel=document.getElementById('mobile-menu'),toolbar=document.getElementById('mobile-toolbar');
  let stamp='',focusAfter=null;
  const screens=['title','select','stage','controls','moves','result','shop','combos','story','campaign'];
  const comboLabels = {lp:'PUNCH',hp:'HEAVY PUNCH',lk:'KICK',hk:'HEAVY KICK'};
  let comboInput;
  function openCombos() {
    G.comboBack = G.screen;
    comboInput = Touch.active ? 'touch' : G.screen === 'fight' ? G.match.p[0].ctrl?.map || 'solo' : 'solo';
    focusAfter='back';
    go('combos');
  }
  function openStory() {
    G.storyBack = G.screen;
    focusAfter = 'back';
    go('story');
  }
  function renderStory() {
    const copy = value => value[I18N.language];
    panel.classList.add('story-menu');
    const nav = el('div',null,'story-nav');
    back(nav,()=>{focusAfter='story';go(G.storyBack || 'title');});
    panel.append(nav);
    title(copy(STORY_DATA.title),localize('Story draft'));
    panel.append(el('p',localize('A proposed story for the world and its fighters.'),'mobile-copy'));
    const banner = image('assets/story/night-circuit.webp','story-banner');
    banner.loading='lazy';banner.width=1200;banner.height=600;
    panel.append(banner);
    panel.append(el('p',copy(STORY_DATA.intro),'story-intro'));
    const chapters = el('div',null,'story-chapters');
    for (const chapter of STORY_DATA.chapters) {
      const card = el('article',null,'story-chapter');
      card.append(el('h2',copy(chapter.title)),el('p',copy(chapter.text)));
      chapters.append(card);
    }
    panel.append(chapters);
    const cast=el('section',null,'story-cast');
    cast.append(el('h2',localize('What they fight for')));
    for (const c of CHARS) {
      const card=el('details',null,'story-fighter');
      const summary=el('summary',c.name+' / '+ARENAS[c.home].city);
      card.append(summary,el('p',copy(STORY_DATA.fighters[c.id])));
      cast.append(card);
    }
    const ending=el('details',null,'story-ending');
    ending.append(el('summary',localize('Read the ending proposal')),el('p',copy(STORY_DATA.closing)));
    panel.append(cast,ending);
  }
  function ownsMenu(){return screens.includes(G.screen)||(G.screen==='fight'&&G.match?.paused);}
  function el(tag,text,cls){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;}
  function button(text,action,cls='',key=''){
    const b=el('button',text,cls);b.type='button';if(key)b.dataset.focusKey=key;
    b.onclick=()=>{Snd.init();Snd.ok();focusAfter=b.dataset.focusKey||null;action();stamp='';sync();};return b;
  }
  function portrait(id){return typeof CharacterArt.portraitURL==='function'?CharacterArt.portraitURL(id):'assets/characters-hd/'+id+'/portrait.webp';}
  function image(src,cls=''){const img=new Image();img.src=src;img.alt='';img.className=cls;img.decoding='async';return img;}
  function title(text,sub){
    const h=el('header',null,'menu-heading');h.append(el('p','FIGHT NOW','menu-brand'),el('h1',text));if(sub)h.append(el('p',sub,'mobile-copy'));panel.append(h);return h;
  }
  function actions(){const n=el('div',null,'menu-actions');panel.append(n);return n;}
  function primary(parent,text,action,key='primary'){parent.append(button(text,action,'mobile-primary',key));}
  function back(parent=panel,action=()=>go('title')){parent.append(button(localize('← Back'),action,'mobile-back','back'));}
  function grid(cls=''){const g=el('div',null,'mobile-grid '+cls);panel.append(g);return g;}
  function openMode(mode){G.mode=mode;startSelect();}
  function settings(parent){
    const group=el('div',null,'menu-settings');
    group.append(button(localize('Difficulty: ')+DIFF_NAMES[G.diff],()=>{G.diff={easy:'normal',normal:'hard',hard:'easy'}[G.diff];store.set('diff',G.diff);},'','difficulty'),
      button(localize('Music: ')+(Snd.musicOn?localize('ON'):localize('OFF')),()=>Snd.toggleMusic(),'','music'),
      button(localize('Sound: ')+(Snd.on?localize('ON'):localize('OFF')),()=>Snd.toggle(),'','sound'));
    parent.append(group);
  }
  function detail(c,active){
    const n=el('aside',null,'fighter-detail');n.append(image(portrait(c.id),'detail-portrait'),el('span',(active?localize('OPPONENT'):localize('YOU'))+' / '+STYLE_NAMES[c.style],'detail-role'),el('h2',c.full),el('p',c.bio,'mobile-copy'));
    const stats=el('dl',null,'fighter-stats');
    for(const [label,v]of [[localize('POWER'),c.str],[localize('SPEED'),c.spd],[localize('TECHNIQUE'),c.tec],[localize('ENDURANCE'),c.end]]){
      const row=el('div');row.append(el('dt',label));const dd=el('dd');const bar=el('span');bar.style.setProperty('--stat',String(v/10));bar.setAttribute('aria-label',v+' / 10');dd.append(bar);row.append(dd);stats.append(row);
    }
    if(!active&&typeof ShopUI!=='undefined')n.append(button(localize('ARMORY'),()=>ShopUI.open(c.id),'quiet-action','armory'));
    n.append(stats,button(localize('Move list'),()=>{G.moveFor=c;G.moveBack='select';go('moves');},'quiet-action','moves'));return n;
  }
  function renderTitle(){
    panel.classList.add('title-menu');
    const guides=el('div',null,'title-guides');
    guides.append(button(localize('Combo list'),openCombos,'quiet-action combo-entry','combos'),
      button(localize('The story'),openStory,'quiet-action','story'));
    panel.append(guides);
    const hero=el('div',null,'title-hero');hero.append(image(CharacterArt.heroURL?.(CHARS[0].id)||portrait(CHARS[0].id),'hero-fighter hero-left'),image(CharacterArt.heroURL?.(CHARS[7].id)||portrait(CHARS[7].id),'hero-fighter hero-right'));
    const copy=el('div',null,'title-copy');copy.append(el('p',localize('STREETS OF GERMANY'),'title-kicker'),el('h1','FIGHT\nNOW','fight-logo'),el('p',localize('Own the night. Rule the streets.'),'title-tagline'));hero.append(copy);panel.append(hero);
    const modes=el('div',null,'mode-grid');
    const rows=[
      ['story',localize('STORY MODE'),localize('Three chapters. Seven rivals. Continue where you left off.'),'01'],
      ['arcade',localize('ARCADE'),localize("7 fights through Germany's neighborhoods"),'02'],
      ['versus',localize('VS COMPUTER'),localize('Pick your fighter, opponent and neighborhood'),'03'],
      ['training',localize('TRAINING'),localize('Unlimited health — try every move'),'04'],
      ['pvp',localize('2 PLAYERS'),localize('Two players, one keyboard (or gamepads)'),'05']
    ];
    for(const [mode,label,description,num]of rows){
      const b=button('',()=>mode==='story'?openCampaign():openMode(mode),'mode-action '+(mode==='story'?'mode-featured':''),'mode-'+mode);
      b.append(el('span',num,'mode-number'),el('strong',label),el('small',description),el('span','↗','mode-arrow'));modes.append(b);
    }
    panel.append(modes);
    const foot=el('footer',null,'title-footer');if(typeof Economy!=='undefined')foot.append(button(localize('ARMORY')+' · ◈ '+(Economy.profile?.coins??'—'),()=>ShopUI.open(),'quiet-action armory-entry','armory'));foot.append(button(localize('How to play'),()=>go('controls'),'quiet-action','controls'));settings(foot);panel.append(foot);
    panel.append(el('p',localize('15 fighters · 15 arenas · multi-touch controls'),'title-meta'));
  }
  function renderCampaign() {
    const progress = Campaign.progress;
    const index = progress?.stage || 0;
    const done = index >= Campaign.stages.length;
    const stage = Campaign.stages[index];
    const chapter = stage ? STORY_DATA.chapters[stage.chapter] : null;
    const copy = value=>value[I18N.language];
    title(localize('STORY MODE'),copy(STORY_DATA.title));
    panel.append(el('p',localize('Story draft'),'menu-footnote'));
    const rail = el('ol',null,'campaign-progress');
    for(const [i,item] of STORY_DATA.chapters.entries()){
      const complete = done || stage.chapter > i;
      const current = stage?.chapter === i;
      const step = el('li',copy(item.title),complete?'complete':current?'current':'');
      if (current) step.setAttribute('aria-current','step');
      rail.append(step);
    }
    panel.append(rail);
    if (done) {
      panel.append(el('h2',localize('Story complete')),el('p',copy(STORY_DATA.closing),'story-intro'));
    } else {
      const opponent = CHARS.find(c=>c.id===stage.opponent);
      panel.append(el('h2',copy(chapter.title)));
      // The chapter preview stays short. Full prose is available in The story.
      const briefing = [
        localize("Murat enters the night circuit to recover his crew's unpaid wages."),
        localize('Follow the invitations through the districts. Learn who is financing the fights.'),
        localize("Win your way to Dragan and refuse his terms.")
      ];
      panel.append(el('p',briefing[stage.chapter],'story-intro'));
      const rival = el('div',null,'campaign-rival');
      rival.append(image(portrait(opponent.id)),el('strong',opponent.full),el('span',ARENAS[opponent.home].city));
      panel.append(rival,el('p',localize('Fight')+' '+(index+1)+' / '+Campaign.stages.length+' · '+localize('First to two round wins. 60 seconds per round.'),'mobile-copy'));
      if (progress && Campaign.saved) panel.append(el('p',localize('Progress is saved on this device after every victory.'),'menu-footnote'));
    }
    if (!Campaign.saved) panel.append(el('p',localize('Saving is unavailable in this browser. Keep this tab open to continue your story.'),'asset-error'));
    if (G.artError) {const error=el('p',G.artError,'asset-error');error.setAttribute('role','alert');panel.append(error);}
    const a = actions();
    back(a);
    if (done) primary(a,localize('NEW STORY'),()=>{Campaign.restart();G.artError=null;});
    else primary(a,localize(progress?'CONTINUE STORY':'START STORY'),()=>startCampaignFight());
  }
  function renderSelect(){
    const active=G.selStep===1&&G.mode!=='arcade'?1:0,pvp=G.mode==='pvp';
    title(pvp?(active?localize('PLAYER 2'):localize('PLAYER 1')):active?localize('Choose your opponent'):localize('Choose your fighter'),localize('Every style has a different rhythm. Find yours.'));
    const layout=el('div',null,'select-layout'),cards=el('div',null,'mobile-grid fighter-grid');cards.setAttribute('aria-label',localize('SELECT FIGHTER'));
    CHARS.forEach((c,i)=>{const b=button('',()=>{G.pick[active]=i;Snd.ui();},'fighter-card'+(G.pick[active]===i?' selected':''),'fighter-'+i);b.append(image(portrait(c.id)),el('span',String(i+1).padStart(2,'0'),'fighter-number'),el('strong',c.name),el('small',STYLE_NAMES[c.style]));b.setAttribute('aria-pressed',String(G.pick[active]===i));cards.append(b);});
    layout.append(cards,detail(CHARS[G.pick[active]],active));panel.append(layout);
    const a=actions();back(a,()=>{if(G.selStep)G.selStep=0;else go('title');});
    primary(a,active?localize('CHOOSE ARENA'):G.mode==='arcade'?localize('START ARCADE'):localize('CONFIRM FIGHTER'),()=>confirmPick());
  }
  function renderStage(){
    if(G.stageCur==null)G.stageCur=CHARS[G.pick[1]].home;
    title(localize('Choose your arena'),CHARS[G.pick[0]].name+'  /  '+CHARS[G.pick[1]].name);
    if(G.artError){const error=el('p',G.artError,'asset-error');error.setAttribute('role','alert');panel.append(error);}
    const cards=grid('arena-grid');
    ARENA_ART_DATA.forEach(a=>{const b=button('',()=>{G.stageCur=a.index;Snd.ui();},'arena-card'+(G.stageCur===a.index?' selected':''),'arena-'+a.index);b.append(image('assets/arenas-hd/'+a.id+'/thumbnail.webp'),el('strong',ARENAS[a.index].name),el('small',ARENAS[a.index].city));b.setAttribute('aria-pressed',String(G.stageCur===a.index));cards.append(b);});
    const a=actions();back(a,()=>{G.stageCur=null;G.selStep=1;go('select');});a.append(button(localize('RANDOM'),()=>{G.stageCur=Math.random()*ARENAS.length|0;},'quiet-action','random'));primary(a,localize('FIGHT!'),()=>startFight(G.stageCur));
  }
  function renderPause(){
    title(localize('Pause'),BattleMusic.title);
    if (G.displayIssue) panel.append(el('p',localize('The playfield stopped drawing. Try resuming or restart the match.'),'asset-error'));
    const a=actions();primary(a,localize('RESUME'),()=>togglePause());
    a.append(button(localize('Move list'),()=>{G.moveFor=G.match.p[0].c;G.moveBack='fight';go('moves');},'','moves'),button(localize('Combo list'),openCombos,'','combos'),button(localize('The story'),openStory,'','story'),button(localize('Restart'),()=>{touchControls.reset();if(G.mode==='story')startCampaignFight();else startFight(G.matchOpts.arena,G.matchOpts.ctrl2.level);fit();},'','restart'));
    const settings=el('div',null,'menu-settings');settings.append(button(localize('Music: ')+(Snd.musicOn?localize('ON'):localize('OFF')),()=>Snd.toggleMusic(),'','music'),button(localize('Effects: ')+(CombatFX.full?localize('STRONG'):localize('LIGHT')),()=>CombatFX.toggle(),'','effects'));panel.append(settings);
    const links=actions();links.append(button(localize('Change fighter'),()=>startSelect(),'quiet-action','change'),button(localize('Main menu'),()=>go('title'),'quiet-action','home'));
    panel.append(el('p',localize('Pause any time. Your fight waits for you.'),'menu-footnote'));
  }
  function instruction(parent,titleText,text){const n=el('article',null,'instruction');n.append(el('h2',titleText),el('p',text,'mobile-copy'));parent.append(n);}
  function renderControls(){
    title(localize('How to play'),localize('Easy to start. Room to master.'));
    const basics=el('div',null,'instruction-grid');
    instruction(basics,localize('Movement'),Touch.active?localize('Left stick: left/right to walk, up to jump, down to crouch.'):localize('Walk with WASD or the arrow keys. Up jumps, down crouches.'));
    instruction(basics,localize('Attacks and blocking'),Touch.active?localize('The right buttons are punch, heavy punch, kick, heavy kick, special and block. Move and attack at the same time.'):localize('J / I: light / heavy punch. K / O: light / heavy kick. L or Shift: block. U or Space: special.'));
    instruction(basics,localize('Special moves'),localize('Left/right + SPECIAL for your second special. Down + SPECIAL at full energy for a SUPER.'));
    instruction(basics,localize('COMBOS'),localize('Chain light → heavy → special after a hit. Attacks are buffered briefly.'));
    instruction(basics,localize('PERFECT GUARD'),localize('Tap Block just before impact for a PERFECT GUARD and a faster counter.'));
    instruction(basics,localize('Pause'),localize('The top button pauses the fight. Switching apps or rotating also pauses; tap RESUME to continue.'));
    panel.append(basics);
    const shared=el('section',null,'keyboard-layout');shared.append(el('h2',localize('2 PLAYERS')));
    const table=el('table'),thead=el('thead'),header=el('tr');for(const text of ['',localize('PLAYER 1'),localize('PLAYER 2')])header.append(el('th',text));thead.append(header);table.append(thead);
    const tbody=el('tbody');
    for(const row of [[localize('Movement'),'W A S D',localize('Arrow keys')],[localize('Punch'),'F','K / Num4'],[localize('Heavy punch'),'G','L / Num5'],[localize('Kick'),'V',', / Num1'],[localize('Heavy kick'),'B','. / Num2'],[localize('Block'),'H','/ / Num3'],[localize('Special'),'T','O / Num6']]){const r=el('tr');row.forEach((text,i)=>r.append(el(i?'td':'th',text)));tbody.append(r);}
    table.append(tbody);shared.append(table);panel.append(shared);back();
  }
  function renderMoves(){
    const c=G.moveFor;title(c.full,STYLE_NAMES[c.style]+' / '+ARENAS[c.home].name);
    const rows=el('div',null,'move-list'),M=c.moves;
    for(const [input,name,description]of [[localize('Punch'),M.LP.name,'J'],[localize('Heavy punch'),M.HP.name,'I'],[localize('Kick'),M.LK.name,'K'],[localize('Heavy kick'),M.HK.name,'O'],['→ + '+localize('Heavy punch'),M.fHP.name,''],['↓ + '+localize('Heavy punch'),localize('Uppercut (launches)'), ''],['↓ + '+localize('Heavy kick'),localize('Sweep (knockdown)'), ''],[localize('Special'),c.sp1.name,c.sp1.desc],['← / → + '+localize('Special'),c.sp2.name,c.sp2.desc],['↓ + '+localize('Special'),c.sup.name,localize('Full energy')],[localize('Finisher: '),c.finName,c.code.slice(0,3).map(d=>({D:'↓',F:'→',B:'←',U:'↑'})[d]).join(' ')+' + '+({lp:localize('Punch'),hp:localize('Heavy punch'),lk:localize('Kick'),hk:localize('Heavy kick')})[c.code[3]]]]){
      const row=el('article',null,'move-row');row.append(el('span',input,'move-input'),el('strong',name),el('small',description));rows.append(row);
    }
    const strings=el('section',null,'combo-move-list');strings.append(el('h2',localize('SIGNATURE COMBOS')),el('p',localize('Tap the next attack on hit. Double-tap a direction to dash.'),'mobile-copy'));
    const labels={lp:localize('Punch'),hp:localize('Heavy punch'),lk:localize('Kick'),hk:localize('Heavy kick')};
    const routes=c.combos||[];
    for(const route of routes){const row=el('article',null,'move-row');row.append(el('strong',route.name),el('span',route.buttons.map(k=>labels[k]).join(' › '),'move-input'));strings.append(row);}
    const gear=typeof Economy!=='undefined'?Economy.gear(c.id):null;
    if(gear?.weaponId)strings.append(el('p',localize('WEAPON FLOW')+': '+[labels.lp,labels.hp,labels.hp].join(' › '),'mobile-copy'));
    panel.append(strings,rows);back(panel,()=>{G.screen=G.moveBack;fit();});
  }
  function comboKeys(route, mode, confirmed=0, active=false) {
    const keys = el('ol',null,'combo-keys');
    keys.setAttribute('role','list');
    for (const [i,key] of route.buttons.entries()) {
      const name = localize(comboLabels[key]);
      const code = mode === 'touch' ? name : MAPS[mode][key][0].replace('Key','').replace('Comma',',').replace('Period','.');
      const step = el('li',null,'combo-key combo-key-'+key);
      if (i < confirmed) step.classList.add('confirmed');
      if (active && i === confirmed) step.classList.add('next-key');
      if (mode !== 'touch') step.title = name;
      step.append(el('kbd',code));
      keys.append(step);
    }
    return keys;
  }
  function renderCombos() {
    const tools = el('div',null,'combo-tools');
    const leave = button(localize('← Back'),()=>{focusAfter='combos';go(G.comboBack);},'mobile-back','back');
    const label = el('label',localize('Show buttons for'));
    const input = el('select');input.id='combo-input';label.htmlFor=input.id;
    for (const [value,name] of [['touch','Touch controls'],['solo','Solo keyboard'],['p1','PLAYER 1'],['p2','PLAYER 2']]) {
      const option = el('option',localize(name));option.value=value;input.append(option);
    }
    input.value=comboInput;
    tools.append(leave,label,input);
    panel.append(tools);
    title(localize('Combo list'),localize('Land each hit, then tap the next button. Try the sequences in Training.'));
    const fighters = el('section',null,'combo-section'), weapons = el('section',null,'combo-section');
    function section(target, heading, intro) {
      const h = el('h2',localize(heading));h.tabIndex=-1;target.append(h);
      if(intro)target.append(el('p',localize(intro),'mobile-copy'));
      return h;
    }
    const fightersHeading = section(fighters,'Fighter combos');
    const weaponsHeading = section(weapons,'Weapon combos','Equip a weapon from the matching family in the Armory. Every weapon in that family uses the same sequence.');
    const jump = el('div',null,'combo-jump');
    for (const heading of [fightersHeading,weaponsHeading]) {
      const link = el('button',heading.textContent,'quiet-action');link.type='button';
      link.onclick=()=>{
        heading.style.scrollMarginTop = (tools.getBoundingClientRect().bottom + 12) + 'px';
        heading.focus({preventScroll:true});
        heading.scrollIntoView({block:'start'});
      };
      jump.append(link);
    }
    panel.append(jump,fighters,weapons);
    const fighterGrid = el('div',null,'combo-grid'), weaponGrid = el('div',null,'combo-grid');
    fighters.append(fighterGrid);weapons.append(weaponGrid);
    const familyNames = Object.fromEntries(WEAPON_CATALOG.weapons.map(w=>[w.family,w.familyName[I18N.language]]));
    const strikes = {jab:'Jab',cross:'Cross',hook:'Hook',ovh:'Overhead punch',elbow:'Elbow'};
    const rows = [];
    function addRoute(card, route, name=route.name) {
      const row = el('div',null,'combo-route');
      if(name)row.append(el('strong',name));
      rows.push([row,route]);card.append(row);
    }
    for (const c of CHARS) {
      const card = el('article',null,'combo-card');
      card.append(el('h3',c.name),el('p',STYLE_NAMES[c.style],'combo-style'));
      c.combos.forEach(route=>addRoute(card,route));
      fighterGrid.append(card);
    }
    for (const [family,route] of Object.entries(WEAPON_COMBOS)) {
      const card = el('article',null,'combo-card');
      const followups = WEAPON_STRINGS[family].map(move=>localize(strikes[move])).join(' → ');
      card.append(el('h3',familyNames[family]),el('p',followups,'combo-style'));
      addRoute(card,route,'');weaponGrid.append(card);
    }
    function showKeys() {
      for (const [row,route] of rows) {
        row.querySelector('.combo-keys')?.remove();
        row.append(comboKeys(route,comboInput));
      }
    }
    input.onchange=()=>{comboInput=input.value;showKeys();};
    showKeys();
  }
  function renderResult(){
    const m=G.match,r=m?.result;if(!r)return;
    title(r.winner.c.name+localize(' wins!'),r.finisher?localize('Finisher: ')+r.winner.c.finName:r.flawless?localize('FLAWLESS'):localize('Another street. Another story.'));
    const winner=el('div',null,'result-hero');winner.append(image(portrait(r.winner.c.id)),el('strong',r.winner.c.full));panel.append(winner);
    if(m.reward){const labels={paid:'Coins earned',pending:'Reward syncing…',practice:'Practice match — no coin reward',offline:'Offline match — no coin reward',unavailable:'Reward unavailable'};panel.append(el('div',(m.reward.state==='paid'?'◈ +'+m.reward.amount+' · ':'')+localize(labels[m.reward.state]||'Reward syncing…'),'reward-card'));if(m.reward.state==='pending')panel.append(button(localize('RETRY SYNC'),()=>Economy.flush(),'quiet-action','sync'));}
    const a=actions();if(typeof ShopUI!=='undefined')a.append(button(localize('ARMORY'),()=>ShopUI.open(),'quiet-action','armory'));
    if (G.mode==='story') {
      const won = r.winner.side === 0;
      primary(a,localize(won?'CONTINUE STORY':'RETRY FIGHT'),()=>won?openCampaign():startCampaignFight());
      a.append(button(localize('Story chapters'),openCampaign,'quiet-action','chapters'));
    } else if(G.mode==='arcade'){
      if(r.winner.side===0&&G.arcade.i<6)primary(a,localize('NEXT FIGHT'),()=>{G.arcade.i++;nextArcade();});
      else if(r.winner.side!==0&&G.arcade.cont>0)primary(a,localize('CONTINUE (')+G.arcade.cont+')',()=>{G.arcade.cont--;nextArcade();});
      else primary(a,localize('NEW ARCADE'),()=>startSelect());
    }else primary(a,localize('REMATCH'),()=>{startFight(G.matchOpts.arena,G.matchOpts.ctrl2.level);});
    a.append(button(localize('Change fighter'),()=>startSelect(),'','change'),button(localize('Main menu'),()=>go('title'),'quiet-action','home'));
  }
  function syncCoach(){
    let node=document.getElementById('training-coach');
    const match=G.match,show=Touch.active&&document.body.classList.contains('portrait')&&G.screen==='fight'&&match?.mode==='training'&&match.phase==='play'&&!match.paused;
    if(!show){if(node)node.hidden=true;return;}
    if(!node){node=el('aside',null,'training-coach');node.id='training-coach';gameView.append(node);}
    const [a,b]=match.p;
    const {routes,active,confirmed}=comboGuide(a);
    const feedback=match.comboFeedback?.life>0?match.comboFeedback.text:'';
    const hits=b.comboHits||match.trainingStats.lastCombo.hits;
    const next=[routes.map(r=>r.id).join(','),confirmed,hits,feedback].join('/');
    node.hidden=false;
    if(node.dataset.progress===next)return;
    node.dataset.progress=next;node.replaceChildren();
    // Keep the coach one row tall on phones. The full list is in Pause → Combo list.
    const route=routes[0];
    node.append(el('strong',route.name),comboKeys(route,'touch',confirmed,!!active),
      el('small',feedback?localize(feedback):hits+localize(' HITS')));
  }
  function sync(){
    syncCoach();
    const menu=ownsMenu();document.body.classList.toggle('mobile-menu-open',menu);document.body.classList.toggle('native-menu-open',menu);
    panel.hidden=!menu;document.getElementById('c').setAttribute('aria-hidden',String(menu));toolbar.hidden=!(['fight','vs'].includes(G.screen)&&!menu);
    document.getElementById('mobilePause').hidden=G.screen!=='fight';document.getElementById('fullscreen').hidden=!document.documentElement.requestFullscreen;
    document.getElementById('mobile-hint').textContent=Touch.active?(document.body.classList.contains('portrait')?localize('Rotate for a larger arena'):localize('Move and attack together')):localize('Esc / P to pause');
    if(typeof Economy!=='undefined'){let coins=document.getElementById('coin-hud');if(!coins){coins=el('span',null,'coin-hud');coins.id='coin-hud';toolbar.append(coins);}coins.textContent='◈ '+(Economy.profile?.coins??'—');coins.dataset.weapon=G.match?.p?.[0]?.equipment?.weapon?.id||'';coins.title=G.match?.p?.[0]?.equipment?.weapon?.name?.[I18N.language]||'';}
    const nextStamp=[menu,G.screen,G.mode,G.selStep,G.pick.join(','),G.stageCur,G.diff,Snd.on,Snd.musicOn,CombatFX.full,G.match?.paused,G.displayIssue,G.match?.result?.winner?.c.id,G.moveFor?.id,G.moveBack,G.arcade?.i,G.arcade?.cont,Campaign.progress?.run,Campaign.progress?.stage,Campaign.saved,!['combos','story'].includes(G.screen)&&typeof Economy!=='undefined'?Economy.version:0,G.screen==='shop'&&typeof ShopUI!=='undefined'?ShopUI.version:0].join('/');
    if(!menu||nextStamp===stamp)return;
    const oldScreen=panel.dataset.screen,oldStep=panel.dataset.step,focused=document.activeElement?.dataset?.focusKey;
    stamp=nextStamp;panel.replaceChildren();panel.className='game-menu';panel.dataset.screen=G.screen;panel.dataset.step=String(G.selStep);
    panel.style.setProperty('--menu-scene',"url('assets/arenas-hd/"+ARENA_ART_DATA[(G.screen==='stage'?G.stageCur:null)??(G.screen==='select'?CHARS[G.pick[G.selStep===1?1:0]].home:7)].id+"/thumbnail.webp')");
    const legal=el('nav',null,'legal-links');
    legal.setAttribute('aria-label',localize('Legal information'));
    const legalPage=I18N.language==='en'?'legal/en.html':'legal/';
    for(const [label,section] of [['Legal notice','impressum'],['Privacy notice','datenschutz'],['Game terms','spielbedingungen']]){
      const link=el('a',localize(label));
      link.href=legalPage+'#'+section;
      legal.append(link);
    }
    if(G.screen==='title'){
      legal.classList.add('legal-links-start');
      panel.append(legal);
    }
    ({shop:()=>ShopUI.render({panel,el,button,title,actions,back,image,portrait}),title:renderTitle,select:renderSelect,stage:renderStage,fight:renderPause,controls:renderControls,moves:renderMoves,combos:renderCombos,story:renderStory,campaign:renderCampaign,result:renderResult}[G.screen]||renderTitle)();
    if(G.screen!=='title')panel.append(legal);
    if(oldScreen!==G.screen||(G.screen==='select'&&oldStep!==String(G.selStep)))panel.scrollTop=0;
    const key=focusAfter||focused;focusAfter=null;
    if(key){const match=[...panel.querySelectorAll('button')].find(b=>b.dataset.focusKey===key);match?.focus({preventScroll:true});}
  }
  function handleInput(inp){
    if(!ownsMenu())return;
    if(inp.back){const backButton=panel.querySelector('.mobile-back');if(backButton)backButton.click();else if(G.screen==='fight')togglePause();return;}
    if (document.activeElement?.tagName==='SUMMARY' || (G.screen==='combos' && document.activeElement?.tagName==='SELECT')) return;
    if(G.screen==='fight'&&Keys.pressed.has('KeyP')){togglePause();return;}
    if(G.screen==='select'||G.screen==='stage'){
      const active=G.selStep===1&&G.mode!=='arcade'?1:0,container=panel.querySelector('.mobile-grid');
      if(container&&(inp.left||inp.right||inp.up||inp.down)){
        const cols=getComputedStyle(container).gridTemplateColumns.split(' ').length,n=G.screen==='select'?CHARS.length:ARENAS.length;
        const current=G.screen==='select'?G.pick[active]:G.stageCur,delta=inp.left?-1:inp.right?1:inp.up?-cols:cols,next=(current+delta+n)%n;
        if(G.screen==='select')G.pick[active]=next;else G.stageCur=next;
        focusAfter=(G.screen==='select'?'fighter-':'arena-')+next;stamp='';sync();return;
      }
      if(inp.ok){panel.querySelector('.mobile-primary')?.click();return;}
    }else{
      const buttons=[...panel.querySelectorAll('button')];if(!buttons.length)return;
      const index=buttons.indexOf(document.activeElement);
      if(inp.up||inp.down){buttons[(index+(inp.up?-1:1)+buttons.length)%buttons.length].focus();return;}
      if(inp.ok){(buttons[index]||panel.querySelector('.mobile-primary')||buttons[0]).click();}
    }
  }
  // Native controls own keyboard activation and Tab; game input must not double-fire.
  document.addEventListener('keydown',e=>{
    if(!ownsMenu())return;
    const focused=document.activeElement;
    if(e.code==='Enter'&&focused?.getAttribute('aria-pressed')==='true'&&(focused.classList.contains('fighter-card')||focused.classList.contains('arena-card'))){e.preventDefault();e.stopPropagation();panel.querySelector('.mobile-primary')?.click();return;}
    if(e.code==='Tab'||(['Enter','Space'].includes(e.code)&&['BUTTON','SELECT','SUMMARY'].includes(focused?.tagName))||(focused?.tagName==='SELECT'&&e.code!=='Escape'))e.stopPropagation();
  },true);
  return {sync,ownsMenu,handleInput,portrait};
})();

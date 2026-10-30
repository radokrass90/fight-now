'use strict';
const MobileUI = (()=>{
  const panel=document.getElementById('mobile-menu'),toolbar=document.getElementById('mobile-toolbar');
  let stamp='';
  function ownsMenu(){return ['title','select','stage','controls','moves','result'].includes(G.screen)||(G.screen==='fight'&&G.match?.paused);}
  function el(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
  function button(text,action,cls=''){const b=el('button',text,cls);b.type='button';b.onclick=()=>{Snd.init();action();stamp='';sync();};return b;}
  function title(text,sub){panel.append(el('p','FIGHT NOW','eyebrow'),el('h1',text));if(sub)panel.append(el('p',sub,'mobile-copy'));}
  function grid(){const g=el('div',null,'mobile-grid');panel.append(g);return g;}
  function next(text,action){panel.append(button(text,action,'mobile-primary'));}
  function back(action=()=>go('title')){panel.append(button(localize("← Back"),action,'mobile-back'));}
  function openMode(mode){G.mode=mode;startSelect();}
  function sync(){
    const active=Touch.active,menu=active&&ownsMenu();
    document.body.classList.toggle('mobile-menu-open',menu);
    panel.hidden=!menu;toolbar.hidden=!(active&&['fight','vs'].includes(G.screen)&&!menu);
    document.getElementById('mobilePause').hidden=G.screen!=='fight';
    document.getElementById('fullscreen').hidden=!document.documentElement.requestFullscreen;
    document.getElementById('mobile-hint').textContent=innerHeight>innerWidth?localize("Rotate for a larger arena"):localize("Move and attack together");
    const nextStamp=[menu,G.screen,G.mode,G.selStep,G.pick.join(','),G.stageCur,G.diff,Snd.on,Snd.musicOn,CombatFX.full,G.match?.paused,G.match?.result?.winner?.c.id,G.moveFor?.id,G.moveBack,G.arcade?.i,G.arcade?.cont].join('/');
    if(!menu||nextStamp===stamp)return;stamp=nextStamp;panel.replaceChildren();
    if(G.screen==='title'){
      title(localize("Ready to fight?"),localize("15 fighters · 15 arenas · multi-touch controls"));
      next(localize("ARCADE"),()=>openMode('arcade'));next(localize("VS COMPUTER"),()=>openMode('versus'));next(localize("TRAINING"),()=>openMode('training'));
      panel.append(button(localize("How to play"),()=>go('controls')),
        button(localize("Difficulty: ")+DIFF_NAMES[G.diff],()=>{G.diff={easy:'normal',normal:'hard',hard:'easy'}[G.diff];store.set('diff',G.diff);}),
        button(localize("Music: ")+(Snd.musicOn?localize("ON"):localize("OFF")),()=>Snd.toggleMusic()),
        button(localize("Sound: ")+(Snd.on?localize("ON"):localize("OFF")),()=>Snd.toggle()));
      panel.append(el('p',localize("Portrait works too. Turn your phone sideways for a better view of the arena."),'mobile-copy'));
    }else if(G.screen==='select'){
      const active=G.selStep===1&&G.mode!=='arcade'?1:0;
      title(active?localize("Choose your opponent"):localize("Choose your fighter"));const cards=grid();
      CHARS.forEach((c,i)=>{const b=button('',()=>{G.pick[active]=i;},'fighter-card'+(G.pick[active]===i?' selected':''));
        const img=new Image();img.src='assets/characters-hd/'+c.id+'/portrait.webp';img.alt='';b.append(img,el('strong',c.name));b.setAttribute('aria-pressed',String(G.pick[active]===i));cards.append(b);});
      const c=CHARS[G.pick[active]];panel.append(el('h2',c.full),el('p',STYLE_NAMES[c.style]+' · '+c.bio,'mobile-copy'));
      next(active?localize("CHOOSE ARENA"):G.mode==='arcade'?localize("START ARCADE"):localize("CONFIRM FIGHTER"),()=>confirmPick());
      back(()=>{if(G.selStep)G.selStep=0;else go('title');});
    }else if(G.screen==='stage'){
      if(G.stageCur==null)G.stageCur=CHARS[G.pick[1]].home;
      title(localize("Choose your arena"));const cards=grid();cards.classList.add('arena-grid');
      ARENA_ART_DATA.forEach(a=>{const b=button('',()=>{G.stageCur=a.index;},'arena-card'+(G.stageCur===a.index?' selected':''));
        const img=new Image();img.src='assets/arenas-hd/'+a.id+'/thumbnail.webp';img.alt='';b.append(img,el('strong',ARENAS[a.index].name));b.setAttribute('aria-pressed',String(G.stageCur===a.index));cards.append(b);});
      next(localize("FIGHT!"),()=>startFight(G.stageCur));back(()=>startSelect());
    }else if(G.screen==='fight'){
      title(localize("Pause"),BattleMusic.title);next(localize("RESUME"),()=>togglePause());
      panel.append(button(localize("Move list"),()=>{G.moveFor=G.match.p[0].c;G.moveBack='fight';go('moves');}),button(localize("Restart"),()=>{touchControls.reset();G.match=new Match(G.matchOpts);fit();}),button(localize("Music: ")+(Snd.musicOn?localize("ON"):localize("OFF")),()=>Snd.toggleMusic()),button(localize("Effects: ")+(CombatFX.full?localize("STRONG"):localize("LIGHT")),()=>CombatFX.toggle()),button(localize("Change fighter"),()=>startSelect()),button(localize("Main menu"),()=>go('title')));
    }else if(G.screen==='controls'){
      title(localize("How to play on your phone"));
      for(const [h,p]of [[localize("Movement"),localize("Left stick: left/right to walk, up to jump, down to crouch.")],[localize("Attacks and blocking"),localize("The right buttons are punch, heavy punch, kick, heavy kick, special and block. Move and attack at the same time.")],[localize("Special moves"),localize("Left/right + SPECIAL for your second special. Down + SPECIAL at full energy for a SUPER.")],[localize("Pause"),localize("The top button pauses the fight. Switching apps or rotating also pauses; tap RESUME to continue.")]]){panel.append(el('h2',h),el('p',p,'mobile-copy'));}back();
    }else if(G.screen==='moves'){
      const c=G.moveFor;title(c.full,localize("Special moves"));
      for(const text of [c.sp1.name+' — '+c.sp1.desc,localize("← / → + SPECIAL: ")+c.sp2.name+' — '+c.sp2.desc,localize("↓ + SPECIAL: ")+c.sup.name,localize("Finisher: ")+c.finName])panel.append(el('p',text,'mobile-copy'));
      back(()=>{G.screen=G.moveBack;fit();});
    }else if(G.screen==='result'){
      const r=G.match.result;if(!r)return;title(r.winner.c.name+localize(" wins!"),r.finisher?localize("Finisher: ")+r.winner.c.finName:'');
      if(G.mode==='arcade'){
        if(r.winner.side===0&&G.arcade.i<6)next(localize("NEXT FIGHT"),()=>{G.arcade.i++;nextArcade();});
        else if(r.winner.side!==0&&G.arcade.cont>0)next(localize("CONTINUE (")+G.arcade.cont+')',()=>{G.arcade.cont--;nextArcade();});
        else next(localize("NEW ARCADE"),()=>startSelect());
      }else next(localize("REMATCH"),()=>go('vs'));
      panel.append(button(localize("Effects: ")+(CombatFX.full?localize("STRONG"):localize("LIGHT")),()=>CombatFX.toggle()),button(localize("Change fighter"),()=>startSelect()),button(localize("Main menu"),()=>go('title')));
    }
  }
  return {sync,ownsMenu};
})();

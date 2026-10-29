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
  function back(action=()=>go('title')){panel.append(button('← Назад',action,'mobile-back'));}
  function openMode(mode){G.mode=mode;startSelect();}
  function sync(){
    const active=Touch.active,menu=active&&ownsMenu();
    document.body.classList.toggle('mobile-menu-open',menu);
    panel.hidden=!menu;toolbar.hidden=!(active&&['fight','vs'].includes(G.screen)&&!menu);
    document.getElementById('mobilePause').hidden=G.screen!=='fight';
    document.getElementById('fullscreen').hidden=!document.documentElement.requestFullscreen;
    document.getElementById('mobile-hint').textContent=innerHeight>innerWidth?'Завърти за по-голяма арена':'Движение + удар едновременно';
    const nextStamp=[menu,G.screen,G.mode,G.selStep,G.pick.join(','),G.stageCur,G.diff,Snd.on,Snd.musicOn,CombatFX.full,G.match?.paused,G.match?.result?.winner?.c.id,G.moveFor?.id,G.moveBack,G.arcade?.i,G.arcade?.cont].join('/');
    if(!menu||nextStamp===stamp)return;stamp=nextStamp;panel.replaceChildren();
    if(G.screen==='title'){
      title('Готов ли си за бой?','15 бойци · 15 арени · управление с два пръста');
      next('АРКАДА',()=>openMode('arcade'));next('СРЕЩУ КОМПЮТЪРА',()=>openMode('versus'));next('ТРЕНИРОВКА',()=>openMode('training'));
      panel.append(button('Как се играе',()=>go('controls')),
        button('Трудност: '+DIFF_NAMES[G.diff],()=>{G.diff={easy:'normal',normal:'hard',hard:'easy'}[G.diff];store.set('diff',G.diff);}),
        button('Музика: '+(Snd.musicOn?'ДА':'НЕ'),()=>Snd.toggleMusic()),
        button('Звук: '+(Snd.on?'ДА':'НЕ'),()=>Snd.toggle()));
      panel.append(el('p','Можеш да играеш и вертикално. Хоризонтално арената се вижда по-добре.','mobile-copy'));
    }else if(G.screen==='select'){
      const active=G.selStep===1&&G.mode!=='arcade'?1:0;
      title(active?'Избери противник':'Избери боец');const cards=grid();
      CHARS.forEach((c,i)=>{const b=button('',()=>{G.pick[active]=i;},'fighter-card'+(G.pick[active]===i?' selected':''));
        const img=new Image();img.src='assets/characters-hd/'+c.id+'/portrait.webp';img.alt='';b.append(img,el('strong',c.name));b.setAttribute('aria-pressed',String(G.pick[active]===i));cards.append(b);});
      const c=CHARS[G.pick[active]];panel.append(el('h2',c.full),el('p',STYLE_NAMES[c.style]+' · '+c.bio,'mobile-copy'));
      next(active?'КЪМ АРЕНИТЕ':G.mode==='arcade'?'ЗАПОЧНИ АРКАДАТА':'ПОТВЪРДИ БОЕЦА',()=>confirmPick());
      back(()=>{if(G.selStep)G.selStep=0;else go('title');});
    }else if(G.screen==='stage'){
      if(G.stageCur==null)G.stageCur=CHARS[G.pick[1]].home;
      title('Избери арена');const cards=grid();cards.classList.add('arena-grid');
      ARENA_ART_DATA.forEach(a=>{const b=button('',()=>{G.stageCur=a.index;},'arena-card'+(G.stageCur===a.index?' selected':''));
        const img=new Image();img.src='assets/arenas-hd/'+a.id+'/thumbnail.webp';img.alt='';b.append(img,el('strong',ARENAS[a.index].name));b.setAttribute('aria-pressed',String(G.stageCur===a.index));cards.append(b);});
      next('БИЙ СЕ!',()=>startFight(G.stageCur));back(()=>startSelect());
    }else if(G.screen==='fight'){
      title('Пауза',BattleMusic.title);next('ПРОДЪЛЖИ',()=>togglePause());
      panel.append(button('Списък с удари',()=>{G.moveFor=G.match.p[0].c;G.moveBack='fight';go('moves');}),button('Рестарт',()=>{touchControls.reset();G.match=new Match(G.matchOpts);fit();}),button('Музика: '+(Snd.musicOn?'ДА':'НЕ'),()=>Snd.toggleMusic()),button('Ефекти: '+(CombatFX.full?'СИЛНИ':'ЛЕКИ'),()=>CombatFX.toggle()),button('Друг боец',()=>startSelect()),button('Главно меню',()=>go('title')));
    }else if(G.screen==='controls'){
      title('Как се играе на телефон');
      for(const [h,p]of [['Движение','Левият джойстик: наляво/надясно за ходене, нагоре за скок, надолу за клек.'],['Атаки и блок','Бутоните вдясно са удар, силен удар, ритник, силен ритник, специален и блок. Движението и атаката работят едновременно.'],['Специални удари','Посока наляво/надясно + СПЕЦ за втори специален. Надолу + СПЕЦ с пълна енергия за СУПЕР.'],['Пауза','Бутонът горе спира боя. При смяна на приложение или завъртане играта се паузира; натисни ПРОДЪЛЖИ.']]){panel.append(el('h2',h),el('p',p,'mobile-copy'));}back();
    }else if(G.screen==='moves'){
      const c=G.moveFor;title(c.full,'Специални удари');
      for(const text of [c.sp1.name+' — '+c.sp1.desc,'← / → + СПЕЦ: '+c.sp2.name+' — '+c.sp2.desc,'↓ + СПЕЦ: '+c.sup.name,'Финал: '+c.finName])panel.append(el('p',text,'mobile-copy'));
      back(()=>{G.screen=G.moveBack;fit();});
    }else if(G.screen==='result'){
      const r=G.match.result;if(!r)return;title(r.winner.c.name+' печели!',r.finisher?'Финал: '+r.winner.c.finName:'');
      if(G.mode==='arcade'){
        if(r.winner.side===0&&G.arcade.i<6)next('СЛЕДВАЩ БОЙ',()=>{G.arcade.i++;nextArcade();});
        else if(r.winner.side!==0&&G.arcade.cont>0)next('ПРОДЪЛЖИ ('+G.arcade.cont+')',()=>{G.arcade.cont--;nextArcade();});
        else next('НОВА АРКАДА',()=>startSelect());
      }else next('РЕВАНШ',()=>go('vs'));
      panel.append(button('Ефекти: '+(CombatFX.full?'СИЛНИ':'ЛЕКИ'),()=>CombatFX.toggle()),button('Друг боец',()=>startSelect()),button('Главно меню',()=>go('title')));
    }
  }
  return {sync,ownsMenu};
})();

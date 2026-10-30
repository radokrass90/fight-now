'use strict';
const I18N = (()=>{
  let saved=null,requested=null;
  try{saved=JSON.parse(localStorage.getItem('fightnow_language'));}catch(e){}
  if(typeof location!=='undefined')requested=new URLSearchParams(location.search).get('lang');
  const language=['de','en'].includes(requested)?requested:['de','en'].includes(saved)?saved:'de';
  if(['de','en'].includes(requested))try{localStorage.setItem('fightnow_language',JSON.stringify(language));}catch(e){}
  function text(key){return language==='de'?(I18N_DE[key]??key):key;}
  function choose(code){
    if(!['de','en'].includes(code)||code===language)return;
    try{localStorage.setItem('fightnow_language',JSON.stringify(code));}catch(e){}
    const url=new URL(location.href);url.searchParams.set('lang',code);location.replace(url.href);
  }
  function mount(){
    document.documentElement.lang=language;
    document.querySelectorAll('[data-i18n]').forEach(n=>{n.textContent=text(n.dataset.i18n);});
    document.querySelectorAll('[data-i18n-aria]').forEach(n=>{n.setAttribute('aria-label',text(n.dataset.i18nAria));});
    const bar=document.getElementById('language-picker');if(!bar)return;
    bar.setAttribute('aria-label',text('Language'));
    bar.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.lang===language));b.onclick=()=>choose(b.dataset.lang);});
  }
  function sync(screen,paused){const bar=document.getElementById('language-picker');if(bar)bar.hidden=screen==='vs'||(screen==='fight'&&!paused);}
  return {language,text,choose,mount,sync};
})();
function localize(key){return I18N.text(key);}

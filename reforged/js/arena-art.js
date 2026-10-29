'use strict';
const ArenaArt = (() => {
  const entries = new Map();
  function load(entry,key,file) {
    if(entry[key+'Promise']&&!entry[key+'Failed'])return entry[key+'Promise'];
    entry[key+'Failed']=false;
    return entry[key+'Promise']=new Promise(resolve=>{
      const image=new Image();entry[key]=image;
      const timer=setTimeout(()=>{entry[key+'Failed']=true;resolve(false);},12000);
      image.onload=()=>{clearTimeout(timer);entry[key+'Loaded']=true;entry[key+'Failed']=false;resolve(true);};
      image.onerror=()=>{clearTimeout(timer);entry[key+'Failed']=true;resolve(false);};
      image.src='assets/arenas-hd/'+entry.data.id+'/'+file;
    });
  }
  const ready=Promise.all(ARENA_ART_DATA.map(data=>{
    const entry={data};entries.set(data.index,entry);
    return load(entry,'thumbnail','thumbnail.webp');
  }));
  async function prepare(index){
    for(const [i,entry] of entries)if(i!==index&&entry.image){entry.image.onload=entry.image.onerror=null;entry.image.src='';delete entry.image;delete entry.imagePromise;entry.imageLoaded=false;}
    const entry=entries.get(index);return entry?await load(entry,'image',typeof MOBILE!=='undefined'&&MOBILE?'background-mobile.webp':'background.webp'):false;
  }
  function thumbnailFor(index){const e=entries.get(index);return e?.thumbnailLoaded?e.thumbnail:null;}
  function imageFor(index){const e=entries.get(index);return e?.imageLoaded?e.image:thumbnailFor(index);}
  return {ready,prepare,entries,imageFor,thumbnailFor};
})();

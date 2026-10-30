'use strict';
(async()=>{
  const compact=matchMedia('(max-width:800px)').matches;
  const root='assets/fighters-reforged/',canvas=document.getElementById('art-preview'),ctx=canvas.getContext('2d');
  const roster=document.getElementById('review-roster'),poses=document.getElementById('review-poses'),slider=document.getElementById('frame-slider'),playButton=document.getElementById('play');
  const statusNames={pending:'Pending',partial:'Partial',ready:'Ready','needs-review':'Needs review',failed:'Failed'};
  const labels=['Stance','High guard','Crouch','Jump','Jab','Heavy punch','Low kick','High kick','Hit reaction','Victory','Step: contact','Step: weight shift','Step: close','Step: lift','Step: open','Step: return','Jab: prepare','Jab: recover','Cross: prepare','Cross: recover','Hook','Uppercut','Kick: prepare','Kick: recover','Knee','Low guard','Body hit','Fall','Grounded','Get up'];
  let manifest,selected=null,frames=new Map(),sheets={},current=0,playing=false,flipped=false,guides=false,token=0,last=0,at=0,sequence=[];
  function el(tag,text,cls){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;}
  function url(path){return path?.startsWith('assets/')?path:root+path;}
  function file(c,kind){return c.files?.[kind]||c[kind]||(kind==='portrait'?c.id+'/portrait.webp':null);}
  function frameFile(c,f){const kind=f.sheet==='base'||f.sheet==='spritesheet.webp'?'base':f.sheet==='extra'||f.sheet==='extra-20.webp'?'extra':f.sheet;return (compact&&file(c,kind+'Mobile'))||file(c,kind)||c.id+'/'+f.sheet;}
  function stateText(c){return localize(statusNames[c.status]||'Pending');}
  function setPlaying(value){playing=value;playButton.textContent=localize(playing?'Pause':'Play');}
  function calibration(f){
    const kind=f.source?.includes('corrections')?'corrections':f.sheet,c=selected.scales?.[kind];
    return c?354/(c.referenceHeight*c.scale):1;
  }
  function paint(){
    ctx.clearRect(0,0,512,512);
    const f=frames.get(current),image=f&&sheets[frameFile(selected,f)];
    document.getElementById('empty-preview').hidden=!!image;
    if(image){
      const ratio=image.width/2560,pivot=f.pivot||manifest.pivot;
      let fit=1;
      for(const pose of frames.values()){
        const b=pose.bounds,k=calibration(pose),up=pose.index===3?Math.max(0,b.y-frames.get(0).bounds.y):0;
        fit=Math.min(fit,196/Math.max(1,(pivot.x-b.x)*k),268/Math.max(1,(b.x+b.w-pivot.x)*k),440/Math.max(1,(pivot.y-b.y+up)*k));
      }
      const k=calibration(f)*fit,air=f.index===3?Math.max(0,f.bounds.y-frames.get(0).bounds.y):0;
      ctx.save();if(flipped){ctx.translate(512,0);ctx.scale(-1,1);}
      ctx.translate(pivot.x,pivot.y);ctx.scale(k,k);ctx.translate(-pivot.x,-pivot.y-air);
      ctx.drawImage(image,f.x*ratio,f.y*ratio,f.w*ratio,f.h*ratio,0,0,512,512);
      if(guides){const b=f.bounds,p=f.pivot||manifest.pivot;ctx.lineWidth=1;ctx.strokeStyle='#65e4ef';ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.beginPath();ctx.moveTo(p.x-7,p.y);ctx.lineTo(p.x+7,p.y);ctx.moveTo(p.x,p.y-7);ctx.lineTo(p.x,p.y+7);ctx.stroke();}ctx.restore();
    }
    if(guides){ctx.strokeStyle='#ffcf58';ctx.setLineDash([7,6]);ctx.beginPath();ctx.moveTo(0,manifest?.pivot?.y||464);ctx.lineTo(512,manifest?.pivot?.y||464);ctx.stroke();ctx.setLineDash([]);}
    slider.value=String(current);document.getElementById('frame-label').textContent=String(current+1).padStart(2,'0')+' / 30 — '+localize(labels[current]||f?.name||'');
    poses.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.frame)===current)));
  }
  function load(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(src));image.src=src;});}
  function play(indices){sequence=indices.filter(i=>frames.has(i));at=0;last=0;setPlaying(sequence.length>1);if(sequence.length)current=sequence[0];paint();}
  async function choose(id){
    const own=++token;selected=manifest.characters.find(c=>c.id===id);frames=new Map((selected.frames||[]).map(f=>[f.index,f]));
    for(const image of Object.values(sheets))image.src='';sheets={};setPlaying(false);current=frames.keys().next().value??0;
    document.getElementById('fighter-name').textContent=selected.name;const status=document.getElementById('fighter-status');status.textContent=stateText(selected);status.dataset.status=selected.status;
    document.getElementById('frame-count').textContent=frames.size+' / 30';slider.disabled=frames.size===0;playButton.disabled=frames.size===0;
    roster.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));
    poses.replaceChildren();for(let i=0;i<30;i++){const b=el('button',null,'review-pose');b.type='button';b.dataset.frame=String(i);b.dataset.issue=String((selected.qc?.issues||[]).some(issue=>!issue.resolved&&issue.frame===i));b.disabled=!frames.has(i);b.append(el('b',String(i+1).padStart(2,'0')),el('span',localize(labels[i])));b.onclick=()=>{setPlaying(false);current=i;paint();};poses.append(b);}
    const issues=(selected.qc?.issues||[]).filter(i=>!i.resolved),notes=document.getElementById('review-issues');notes.replaceChildren();document.getElementById('review-qc').hidden=issues.length===0;
    for(const issue of issues){const li=el('li'),b=el('button',(Number.isInteger(issue.frame)?String(issue.frame+1).padStart(2,'0')+' — ':'')+issue.note,'issue-link');b.type='button';b.onclick=()=>{if(frames.has(issue.frame)){setPlaying(false);current=issue.frame;paint();}};li.append(b);notes.append(li);}
    paint();const paths=[...new Set([...frames.values()].map(f=>frameFile(selected,f)))];
    const loaded=await Promise.allSettled(paths.map(async path=>[path,await load(url(path))]));if(own!==token)return;
    for(const result of loaded)if(result.status==='fulfilled')sheets[result.value[0]]=result.value[1];
    if(loaded.some(r=>r.status==='rejected')){status.textContent=localize('Artwork could not be loaded. Refresh to retry.');status.dataset.status='failed';}
    play([10,11,12,13,14,15]);
  }
  async function refresh(){
    const note=document.getElementById('manifest-status');note.textContent=localize('Loading…');
    try{
      const response=await fetch(root+'manifest.json',{cache:'no-store'});if(!response.ok)throw new Error(String(response.status));manifest=await response.json();
      if(!Array.isArray(manifest.characters)||manifest.frameSize!==512)throw new Error('Invalid manifest');
      const generated=manifest.characters.filter(c=>(c.frames||[]).length===30).length,ready=manifest.characters.filter(c=>c.status==='ready').length;
      note.textContent=generated+' / '+manifest.characters.length+' '+localize('complete pose sets')+' · '+ready+' '+localize('reviewed and ready');roster.replaceChildren();
      manifest.characters.forEach((c,i)=>{const b=el('button',null,'review-fighter');b.type='button';b.dataset.id=c.id;
        if((c.frames||[]).length){const image=new Image();image.src=url(file(c,'portrait'));image.alt='';b.append(image);}else b.append(el('span',String(i+1).padStart(2,'0'),'pending-art'));
        const text=el('span');text.append(el('strong',c.name),el('small',stateText(c)+' · '+(c.frames||[]).length+'/30'));b.append(text);b.onclick=()=>choose(c.id);roster.append(b);
      });
      await choose(manifest.characters.some(c=>c.id===selected?.id)?selected.id:manifest.characters.find(c=>(c.frames||[]).length)?.id||manifest.characters[0].id);
    }catch(error){note.textContent=localize('Roster is being prepared. Refresh to try again.');console.warn('Art review:',error.message);}
  }
  const sequences=[['Walk',[10,11,12,13,14,15]],['Punch',[0,16,4,4,17,0,18,5,5,19,0]],['Kick',[0,22,6,6,23,0,24,0,7,7,0]],['Guard',[0,1,25,2,0]],['Fall / get up',[0,8,27,28,28,29,2,0]]];
  for(const [label,indices]of sequences){const b=el('button',localize(label));b.type='button';b.onclick=()=>play(indices);document.getElementById('review-sequences').append(b);}
  playButton.onclick=()=>{if(!sequence.length)sequence=[...frames.keys()];setPlaying(!playing);};document.getElementById('flip').onclick=e=>{flipped=!flipped;e.currentTarget.setAttribute('aria-pressed',String(flipped));paint();};document.getElementById('guides').onchange=e=>{guides=e.target.checked;paint();};
  slider.oninput=()=>{setPlaying(false);const n=Number(slider.value);if(frames.has(n))current=n;paint();};document.getElementById('refresh').onclick=refresh;
  function tick(now){if(playing&&sequence.length&&now-last>120){last=now;current=sequence[at++%sequence.length];paint();}requestAnimationFrame(tick);}
  await refresh();requestAnimationFrame(tick);
})();

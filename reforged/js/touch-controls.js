'use strict';
// Each finger owns its control until release/cancel. Moving off a control or
// losing the tab must never leave a direction/block latched on.
function bindTouchControls(stick, knob, buttons, gesture) {
  let stickId=null, origin=[0,0];
  const owners=new Map();
  const clearStick=()=>{stickId=null;Touch.l=Touch.r=Touch.u=Touch.d=0;knob.style.transform='';};
  function move(e){
    let dx=e.clientX-origin[0],dy=e.clientY-origin[1];
    const radius=stick.getBoundingClientRect().width/2,len=Math.hypot(dx,dy);
    if(len>radius){dx*=radius/len;dy*=radius/len;}
    knob.style.transform=`translate(${dx}px,${dy}px)`;
    const dz=radius*.28;Touch.l=dx < -dz;Touch.r=dx > dz;Touch.u=dy < -dz*1.4;Touch.d=dy > dz*1.2;
  }
  stick.addEventListener('pointerdown',e=>{
    e.preventDefault();if(stickId!==null)return;
    gesture();stickId=e.pointerId;const r=stick.getBoundingClientRect();origin=[r.left+r.width/2,r.top+r.height/2];
    stick.setPointerCapture(e.pointerId);move(e);
  });
  stick.addEventListener('pointermove',e=>{if(e.pointerId===stickId){e.preventDefault();move(e);}});
  const end=e=>{if(e.pointerId===stickId)clearStick();};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,end);
  for(const b of buttons){
    const ids=new Set();owners.set(b,ids);const key=b.dataset.k;
    b.addEventListener('pointerdown',e=>{
      e.preventDefault();gesture();ids.add(e.pointerId);b.setPointerCapture(e.pointerId);
      if(!Touch[key])Touch.pressed.add(key);Touch[key]=1;b.classList.add('on');
    });
    const up=e=>{ids.delete(e.pointerId);if(!ids.size){Touch[key]=0;b.classList.remove('on');}};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,up);
  }
  function reset(){clearStick();for(const [b,ids]of owners){ids.clear();Touch[b.dataset.k]=0;b.classList.remove('on');}Touch.pressed.clear();Keys.down.clear();Keys.pressed.clear();}
  return {reset};
}

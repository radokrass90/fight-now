'use strict';
// Each finger owns its control until release/cancel. Moving off a control or
// losing the tab must never leave a direction/block latched on.
function bindTouchControls(stick, knob, buttons, gesture) {
  let stickId=null, origin=[0,0];
  const owners=new Map();
  function capture(control, pointerId) {
    try { control.setPointerCapture(pointerId); return true; }
    catch { return false; } // Safari may have cancelled the pointer while resolving a gesture.
  }
  const clearStick=()=>{stickId=null;Touch.l=Touch.r=Touch.u=Touch.d=0;knob.style.transform='';};
  function move(e){
    let dx=e.clientX-origin[0],dy=e.clientY-origin[1];
    const radius=stick.getBoundingClientRect().width/2,len=Math.hypot(dx,dy);
    if(len>radius){dx*=radius/len;dy*=radius/len;}
    knob.style.transform=`translate(${dx}px,${dy}px)`;
    const dz=radius*.28;Touch.l=dx < -dz;Touch.r=dx > dz;Touch.u=dy < -dz*1.4;Touch.d=dy > dz*1.2;
  }
  stick.addEventListener('pointerdown',e=>{
    e.preventDefault();if(stickId!==null||!capture(stick,e.pointerId))return;
    gesture();stickId=e.pointerId;const r=stick.getBoundingClientRect();origin=[r.left+r.width/2,r.top+r.height/2];
    move(e);
  });
  stick.addEventListener('pointermove',e=>{if(e.pointerId===stickId){e.preventDefault();move(e);}});
  const end=e=>{if(e.pointerId===stickId)clearStick();};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,end);
  for(const b of buttons){
    const ids=new Set();owners.set(b,ids);const key=b.dataset.k;
    b.addEventListener('pointerdown',e=>{
      e.preventDefault();if(!capture(b,e.pointerId))return;gesture();ids.add(e.pointerId);
      if(!Touch[key])Touch.pressed.add(key);Touch[key]=1;b.classList.add('on');
    });
    const up=e=>{ids.delete(e.pointerId);if(!ids.size){Touch[key]=0;b.classList.remove('on');}};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,up);
  }
  function reset(){clearStick();for(const [b,ids]of owners){ids.clear();Touch[b.dataset.k]=0;b.classList.remove('on');}Touch.pressed.clear();Keys.down.clear();Keys.pressed.clear();}
  return {reset};
}


// iOS Safari can apply page zoom even when viewport scale limits are set.
function bindFightGestures(view, surface, controls, isPlaying) {
  const cancel = e => { if (isPlaying() && e.cancelable) e.preventDefault(); };
  const multiTouch = e => { if (e.touches.length > 1) cancel(e); };
  const options = {passive:false};
  view.addEventListener('touchstart', multiTouch, options);
  view.addEventListener('touchmove', multiTouch, options);
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    view.addEventListener(type, cancel, options);
  }
  // Gameplay uses pointer events. Keep Safari's synthesized double-tap zoom
  // off the arena/controls without suppressing clicks on Pause or the menus.
  surface.addEventListener('touchend', cancel, options);
  controls.addEventListener('touchend', cancel, options);
}

function visibleGameRect(viewport, fallbackWidth, fallbackHeight) {
  const scale = viewport?.scale || 1;
  return {
    width: (viewport?.width || fallbackWidth / scale) * scale,
    height: (viewport?.height || fallbackHeight / scale) * scale,
    x: viewport?.offsetLeft || 0,
    y: viewport?.offsetTop || 0,
    inverseScale: 1 / scale
  };
}

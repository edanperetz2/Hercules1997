// A pointer owns its pressed action until it ends or is cancelled. More than
// one finger may hold the same button; releasing one must not release both.
export class TouchInput {
  constructor() { this.pointers = new Map(); }
  press(id, action) { this.pointers.set(id, action); }
  release(id) { this.pointers.delete(id); }
  has(action) { return [...this.pointers.values()].includes(action); }
  clear() { this.pointers.clear(); }
}
export function fitPlayfield(width, height, reserve = 0) {
  const available = Math.max(1, height - reserve), w = Math.max(1,Math.min(width,available*16/9));
  return {width:w,height:w*9/16};
}
export function bindTouchControls(buttons, input, {onGesture=()=>{},onChange=()=>{},allow=()=>true,pointerEvents=true} = {}) {
  const sync = () => { for(const b of buttons) b.classList.toggle('pressed',input.has(b.dataset.control));onChange(); };
  const press=(id,button)=>{if(!allow())return;input.press(id,button.dataset.control);onGesture();sync();};
  const release=id=>{input.release(id);sync();};
  for(const button of buttons) {
    button.addEventListener('contextmenu',event=>event.preventDefault());
    if(pointerEvents) {
      button.addEventListener('pointerdown',event=>{
        if(event.pointerType==='mouse' && event.button!==0)return;
        event.preventDefault();press(event.pointerId,button);
        try{button.setPointerCapture?.(event.pointerId);}catch{}
      });
      for(const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type,event=>{event.preventDefault();release(event.pointerId);});
    } else {
      button.addEventListener('touchstart',event=>{event.preventDefault();for(const touch of event.changedTouches)press(touch.identifier,button);},{passive:false});
      for(const type of ['touchend','touchcancel']) button.addEventListener(type,event=>{event.preventDefault();for(const touch of event.changedTouches)release(touch.identifier);},{passive:false});
    }
  }
  return () => {input.clear();sync();};
}

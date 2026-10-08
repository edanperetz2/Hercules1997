import test from 'node:test';
import assert from 'node:assert/strict';
import { TouchInput, fitPlayfield, bindTouchControls } from '../dist/mobile.js';
import { World } from '../dist/engine.js';

test('two thumbs can move and jump, cancellation only releases its own finger', () => {
  const input = new TouchInput(), world = new World(); world.start();
  input.press(1, 'right'); input.press(2, 'jump');
  const x = world.player.x, y = world.player.y;
  world.update(1/120, {right:input.has('right'),jumpPressed:input.has('jump')});
  for(let i=0;i<20;i++) world.update(1/120,{right:input.has('right')});
  assert.ok(world.player.x>x); assert.ok(world.player.y<y);
  input.release(2); assert.ok(input.has('right')); assert.ok(!input.has('jump'));
  input.press(3,'right'); input.release(1); assert.ok(input.has('right'));
  input.clear(); assert.ok(!input.has('right'));
});
test('phone viewports preserve scene ratio and leave room for portrait buttons', () => {
  for(const [w,h,reserve] of [[320,490,152],[430,760,152],[844,320,0],[915,360,0]]) {
    const fit=fitPlayfield(w,h,reserve);
    assert.ok(fit.width<=w); assert.ok(fit.height<=h-reserve);
    assert.ok(Math.abs(fit.width/fit.height-16/9)<1e-12);
  }
});
test('pointer capture and older Safari touch fallback clear cancelled buttons', () => {
  for(const pointerEvents of [true,false]) {
    const events={}, input=new TouchInput(); let unlocked=0;
    const button={dataset:{control:'attack'},classList:{toggle(){}},addEventListener(t,fn){events[t]=fn;},setPointerCapture(){}};
    bindTouchControls([button],input,{pointerEvents,onGesture:()=>unlocked++});
    const e={pointerId:7,preventDefault(){},changedTouches:[{identifier:7}]};
    events[pointerEvents?'pointerdown':'touchstart'](e);
    assert.ok(input.has('attack')); assert.equal(unlocked,1);
    events[pointerEvents?'pointercancel':'touchcancel'](e);
    assert.ok(!input.has('attack'));
  }
});

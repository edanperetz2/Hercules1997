import test from 'node:test';
import assert from 'node:assert/strict';
import { readPreferences, bindKey, validKeys, actionMap } from '../dist/controls.js';
import { heroFrame } from '../dist/animation.js';
import { World } from '../dist/engine.js';

test('control preferences restore safely and custom duplicate keys swap actions',()=>{
  const modern=readPreferences(null), classic=readPreferences({mode:'classic'});
  assert.equal(actionMap(modern.keys).KeyJ,'attack'); assert.equal(classic.keys.jump,'KeyZ');
  assert.equal(readPreferences(null,true).mode,'touch');
  const custom=bindKey(modern.keys,'jump','KeyJ');
  assert.equal(custom.jump,'KeyJ'); assert.equal(custom.attack,'Space'); assert.ok(validKeys(custom));
  assert.deepEqual(readPreferences({mode:'custom',keys:custom}).keys,custom);
  assert.equal(bindKey(custom,'jump','Escape'),null); assert.equal(bindKey(custom,'magic','KeyP'),null);
  assert.ok(validKeys(readPreferences({mode:'custom',keys:{jump:'BAD'}}).keys));
});
test('jump poses follow vertical velocity and landing expires without repeating',()=>{
  const world=new World(); world.start(); world.update(1/120,{jumpPressed:true});
  assert.equal(heroFrame(world.player),5);
  let apex=false,fall=false,land=false;
  for(let n=0;n<120;n++) {world.update(1/120);const f=heroFrame(world.player);apex ||= f===6;fall ||= f===7;land ||= f===8;}
  assert.ok(apex && fall && land); assert.equal(heroFrame(world.player),0);
});
test('running cycles legs and sword transitions wind-up, contact, recovery',()=>{
  const world=new World(); world.start(); const frames=new Set();
  for(let n=0;n<100;n++){world.update(1/120,{right:true});frames.add(heroFrame(world.player));}
  for(const f of [1,2,3,4]) assert.ok(frames.has(f));
  world.swing();assert.equal(heroFrame(world.player),9);
  for(let n=0;n<12;n++) world.update(1/120);
  assert.equal(heroFrame(world.player),10);
  for(let n=0;n<14;n++) world.update(1/120);
  assert.equal(heroFrame(world.player),11);
  world.cast();world.player.attack=0;assert.equal(heroFrame(world.player),13);
  world.player.invuln=0;world.hurt(1);assert.equal(heroFrame(world.player),14);
  assert.equal(heroFrame(world.player,'clear'),15);
});

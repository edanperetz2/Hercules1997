import test from 'node:test';
import assert from 'node:assert/strict';
import { World, CHAPTERS, DIFFICULTIES } from '../dist/engine.js';
const step = (world, frames = 1, input = {}) => { for (let n=0;n<frames;n++) world.update(1/120, n===0 ? input : {...input,jumpPressed:false,attackPressed:false,magicPressed:false,attackReleased:false}); };

test('campaign has ten distinct chapters and three rush chapters', () => {
  assert.equal(CHAPTERS.length,10); assert.equal(CHAPTERS.filter(c=>c.rush).length,3); assert.equal(new Set(CHAPTERS.map(c=>c.name)).size,10);
});
test('all chapters and difficulties start on solid ground with complete collectible sets', () => {
  for (const difficulty of Object.keys(DIFFICULTIES)) for (let chapter=0;chapter<CHAPTERS.length;chapter++) {
    const world=new World(); world.start(chapter,difficulty); step(world,100);
    assert.equal(world.state,'playing'); assert.equal(world.player.y,600);
    assert.equal(world.pickups.filter(i=>i.type==='letter').length,8); assert.equal(world.pickups.filter(i=>i.type==='vase').length,4);
    for (const cp of world.checkpoints) assert.ok(world.platforms.some(p=>p.ground&&cp.x>p.x&&cp.x<p.x+p.w));
    assert.equal(world.player.health,DIFFICULTIES[difficulty].health);
  }
});
test('jump, double jump, and landing reset jump allowance', () => {
  const world=new World(); world.start(); step(world,35,{jumpPressed:true}); const first=world.player.y;
  step(world,35,{jumpPressed:true}); assert.ok(world.player.y<first-50); assert.equal(world.player.jumps,2);
  step(world,200); assert.equal(world.player.y,600); assert.equal(world.player.jumps,0); assert.ok(world.player.grounded);
});
test('a sword swing hits a reachable enemy once, and a charged strike kills it', () => {
  const world=new World();world.start();world.player.x=world.enemies[0].x-105;world.player.y=600;
  const e=world.enemies[0]; e.type='satyr'; e.y=600;e.health=4;e.min=e.max=e.x;
  step(world,20,{attackPressed:true,attack:true}); assert.equal(e.health,3);
  step(world,55,{attack:true}); step(world,1,{attackReleased:true}); assert.equal(e.health,0);
});
test('boss armor blocks damage and recovery accepts sword and magic', () => {
  for (let n=0;n<CHAPTERS.length;n++) if (CHAPTERS[n].boss) {
    const world=new World();world.start(n);const boss=world.boss,health=boss.health;
    assert.equal(world.hitEnemy(boss,3),false);assert.equal(boss.health,health);
    boss.vulnerable=true;assert.equal(world.hitEnemy(boss,3,true),true);assert.equal(boss.health,health-3);
  }
});
test('each boss progresses through a telegraphed attack to a vulnerable opening', () => {
  for (let n=0;n<CHAPTERS.length;n++) if (CHAPTERS[n].boss) {
    const world=new World();world.start(n);world.player.x=world.boss.arenaStart+100;world.player.invuln=100;
    let opening=false,attacked=false;
    for(let f=0;f<650;f++){world.update(1/120);attacked ||= world.boss.phase==='attack';opening ||= world.boss.vulnerable;}
    assert.ok(attacked,CHAPTERS[n].name);assert.ok(opening,CHAPTERS[n].name);
  }
});
test('falling loses one life, and retry respawns safely at the checkpoint', () => {
  const world=new World();world.start();world.checkpoint={x:2000,y:600};world.player.y=950;step(world);
  assert.equal(world.state,'dead');assert.equal(world.lives,2);world.retry();step(world);
  assert.equal(world.state,'playing');assert.equal(world.player.x,2000);assert.equal(world.player.y,600);assert.ok(world.player.health>0);
});
test('game over restarts the current chapter with fresh lives', () => {
  const world=new World();world.start(3);world.lives=1;world.die();world.retry();assert.equal(world.chapter,3);assert.equal(world.lives,3);assert.equal(world.state,'playing');
});
test('pause freezes physics and resume permits movement', () => {
  const world=new World();world.start();world.pause();step(world,120,{right:true});assert.equal(world.player.x,130);world.resume();step(world,30,{right:true});assert.ok(world.player.x>180);
});
test('collecting all eight letters adds a life and vases cannot be counted twice', () => {
  const world=new World();world.start();world.pickups=[];
  for(let n=0;n<8;n++) world.addPickup('letter',130,550,{letter:n});
  for(let n=0;n<4;n++) world.addPickup('vase',130,550);
  step(world,10);assert.equal(world.letters.size,8);assert.equal(world.lives,4);assert.equal(world.vases,4);step(world,10);assert.equal(world.vases,4);
});
test('magic consumes energy, projectiles move, and empty magic cannot cast', () => {
  const world=new World();world.start();world.player.magic=20;world.cast();assert.equal(world.player.magic,0);assert.equal(world.projectiles.length,1);const x=world.projectiles[0].x;step(world,10);assert.ok(world.projectiles[0].x>x);world.player.magicCooldown=0;world.cast();assert.equal(world.projectiles.length,1);
});
test('a live boss prevents the exit; a defeated boss opens it', () => {
  const world=new World();world.start(4);world.player.x=world.exit.x;world.player.invuln=10;step(world);assert.equal(world.state,'playing');world.boss.health=0;step(world);assert.equal(world.state,'clear');
});
test('all three rush routes can be completed with well-timed double jumps', () => {
  for(let chapter=0;chapter<CHAPTERS.length;chapter++) if(CHAPTERS[chapter].rush){
    const world=new World();world.start(chapter,'beginner');let usedSecond=false;
    for(let frame=0;frame<6000&&world.state==='playing';frame++){
      const p=world.player;if(p.grounded)usedSecond=false;
      const gap=world.spec.gaps.find(([x,width])=>x+width>p.x);
      const hazard=world.hazards.find(h=>h.x+h.w>p.x&&h.x-p.x<85);
      let jump=!!(p.grounded&&((gap&&gap[0]-p.x<95)||hazard));
      if(!p.grounded&&!usedSecond&&p.vy>30&&gap&&p.x<gap[0]+gap[1]+30&&gap[0]-p.x<150){jump=true;usedSecond=true;}
      world.update(1/120,{jumpPressed:jump});
    }
    assert.equal(world.state,'clear',`${world.spec.name}: ${JSON.stringify(world.snapshot())}`);
  }
});

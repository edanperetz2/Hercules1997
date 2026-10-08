// Deterministic gameplay. Rendering, sound, and browser storage live in game.js.
export const VIEW = { w: 1280, h: 720, ground: 600 };
export const DIFFICULTIES = {
  beginner: { health: 140, damage: .65, lives: 5, speed: .86 },
  hero: { health: 100, damage: 1, lives: 3, speed: 1 },
  herculean: { health: 85, damage: 1.3, lives: 3, speed: 1.14 },
};
export const CHAPTERS = [
  { name: 'The Training Grounds', subtitle: 'Learn the makings of a hero', bg: 'grove', width: 4400, gift: 'lightning', enemy: 'satyr', intro: 'Move, double jump, and strike. Your first labor begins.', gaps: [[1280, 140], [2350, 160], [3350, 145]] },
  { name: 'The Hero’s Gauntlet', subtitle: 'A race through the ruins', bg: 'grove', width: 4800, rush: true, gift: 'sonic', intro: 'Keep running! Jump over the gaps and broken columns.', gaps: [[860, 150], [1600, 180], [2540, 160], [3400, 190], [4160, 160]] },
  { name: 'The Centaur’s Forest', subtitle: 'Face the guardian of the grove', bg: 'grove', width: 4200, boss: 'centaur', gift: 'fire', enemy: 'centaur', intro: 'The centaur charges in a straight line. Jump, then counterattack.', gaps: [[1280, 140], [2200, 160]] },
  { name: 'The Big Olive', subtitle: 'Battle through the streets of Thebes', bg: 'thebes', width: 4600, boss: 'minotaur', gift: 'sonic', enemy: 'satyr', intro: 'Thebes needs a hero. Break through to the palace.', gaps: [[1380, 150], [2550, 170]] },
  { name: 'The Hydra’s Lair', subtitle: 'Three heads. One very bad attitude.', bg: 'grove', width: 3500, boss: 'hydra', gift: 'lightning', enemy: 'harpy', intro: 'The Hydra lowers its heads after breathing fire. That is your opening.', gaps: [[1000, 130], [1810, 150]] },
  { name: 'Medusa’s Temple', subtitle: 'Outrun the gaze of stone', bg: 'thebes', width: 4100, boss: 'medusa', gift: 'fire', enemy: 'skeleton', intro: 'Medusa’s gaze is dangerous. Leap over the beam and strike after it fades.', gaps: [[1220, 150], [2130, 150]] },
  { name: 'The Cyclops Chase', subtitle: 'The streets are falling apart', bg: 'thebes', width: 5000, rush: true, gift: 'sonic', intro: 'Run! The city is collapsing behind you. Double jump the debris.', gaps: [[980, 160], [1820, 185], [2780, 170], [3670, 200], [4400, 170]] },
  { name: 'The Titan’s Ascent', subtitle: 'Reach the gates of Olympus', bg: 'grove', width: 4300, boss: 'titan', gift: 'lightning', enemy: 'satyr', intro: 'Jump the Titan’s shockwaves. Its armor opens between attacks.', gaps: [[1330, 160], [2290, 150]] },
  { name: 'The River of Souls', subtitle: 'Race into the underworld', bg: 'underworld', width: 4900, rush: true, gift: 'fire', intro: 'The river takes everything. Keep moving and stay above the abyss.', gaps: [[880, 170], [1770, 190], [2670, 180], [3540, 180], [4270, 165]] },
  { name: 'The Final Labor', subtitle: 'Bring down the lord of the underworld', bg: 'underworld', width: 3900, boss: 'hades', gift: 'lightning', enemy: 'skeleton', intro: 'Hades throws blue fire, then disappears. Strike when he returns.', gaps: [[1060, 130], [1910, 160]] },
];
export const BOSS_NAMES = { centaur: 'NESSUS · THE CENTAUR', minotaur: 'THE MINOTAUR', hydra: 'THE HYDRA', medusa: 'MEDUSA · THE STONE GAZE', titan: 'THE EARTH TITAN', hades: 'HADES · LORD OF THE UNDERWORLD' };
export const BOSS_HINTS = { centaur: 'Jump the charge. Strike while he recovers.', minotaur: 'Jump the shockwave. Counter after the slam.', hydra: 'Dodge the fire. Strike the lowered heads.', medusa: 'Leap over the gaze. Strike while it fades.', titan: 'Jump the shockwaves. Strike when the armor opens.', hades: 'Dodge the blue fire. Strike after he teleports.' };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const body = e => ({ x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h });
function seeded(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export class World {
  constructor(onEvent = () => {}) { this.onEvent = onEvent; this.time = 0; this.state = 'menu'; this.chapter = 0; this.difficulty = 'hero'; this.lives = 3; this.totalGold = 0; this.nextId = 1; }
  emit(type, data = {}) { this.onEvent({ type, ...data }); }
  start(chapter = 0, difficulty = 'hero', carry = null) {
    this.chapter = clamp(Math.floor(chapter), 0, CHAPTERS.length - 1);
    this.difficulty = Object.hasOwn(DIFFICULTIES, difficulty) ? difficulty : 'hero';
    this.settings = DIFFICULTIES[this.difficulty];
    this.lives = carry?.lives ?? this.settings.lives;
    this.totalGold = carry?.totalGold ?? 0;
    this.load();
  }
  load() {
    const spec = CHAPTERS[this.chapter]; this.spec = spec;
    this.state = 'playing'; this.time = 0; this.camera = 0; this.shake = 0;
    this.coins = 0; this.letters = new Set(); this.vases = 0; this.kills = 0;
    this.projectiles = []; this.particles = []; this.popups = []; this.rings = [];
    this.checkpoint = { x: 130, y: VIEW.ground };
    this.player = { x: 130, y: VIEW.ground, w: 42, h: 100, vx: 0, vy: 0, dir: 1, grounded: true, jumps: 0, coyote: .12, buffer: 0, attack: 0, cooldown: 0, charge: 0, holding: false, hitIds: new Set(), health: this.settings.health, magic: 70, gift: spec.gift, invuln: 1, magicCooldown: 0, slam: false, anim: 0, landTimer: 0, castTimer: 0, hurtTimer: 0 };
    this.platforms = []; this.hazards = []; this.pickups = []; this.enemies = []; this.crates = []; this.checkpoints = [];
    let end = 0;
    for (const [x, w] of spec.gaps) { this.platforms.push({ x: end, y: VIEW.ground, w: x - end, h: 180, ground: true }); end = x + w; }
    this.platforms.push({ x: end, y: VIEW.ground, w: spec.width - end + 600, h: 180, ground: true });
    const rand = seeded(9182 + this.chapter * 231);
    const arenaStart = spec.boss ? spec.width - 920 : spec.width;
    const safeGround = x => this.platforms.find(p => p.ground && x > p.x + 75 && x < p.x + p.w - 75);
    if (!spec.rush) {
      for (let x = 470; x < arenaStart - 280; x += 650) {
        const y = 445 - (Math.floor(rand() * 3) * 40);
        this.platforms.push({ x, y, w: 195, h: 26, ground: false });
        if (this.chapter % 2 === 1) this.platforms.push({ x: x - 125, y: 525, w: 100, h: 22, ground: false });
        for (let n = 0; n < 4; n++) this.addPickup('coin', x + 28 + n * 45, y - 38);
      }
      for (let x = 760; x < arenaStart - 160; x += 465) {
        if (!safeGround(x)) continue;
        const type = spec.enemy === 'harpy' || rand() < .21 ? 'harpy' : (spec.enemy || 'satyr');
        const ground = safeGround(x);
        this.enemies.push({ id: this.nextId++, type, x, y: type === 'harpy' ? 430 : 600, homeY: 420 + rand() * 50, homeX: x, w: type === 'centaur' ? 105 : 55, h: type === 'harpy' ? 65 : 90, health: type === 'centaur' ? 4 : 2 + Math.floor(this.chapter / 4), maxHealth: 4, vx: 0, vy: 0, dir: -1, min: Math.max(ground.x + 70, x - 130), max: Math.min(ground.x + ground.w - 70, x + 130), phase: 'patrol', timer: rand() * 2 + 1, invuln: 0, attackDone: false, anim: rand() * 4 });
      }
      for (let x = 930; x < arenaStart - 180; x += 1050) if (safeGround(x)) this.crates.push({ id: this.nextId++, x, y: 600, w: 58, h: 62, health: 1 });
      for (let x = 1620; x < arenaStart - 200; x += 1160) if (safeGround(x)) this.hazards.push({ kind: 'spikes', x, y: 583, w: 85, h: 17 });
    } else {
      for (let x = 510; x < spec.width - 180; x += 600) if (safeGround(x)) this.hazards.push({ kind: 'block', x, y: 548, w: 60, h: 52 });
      this.rushWall = -550;
    }
    // All collectibles are reachable; elevated ones are deliberately over solid platforms.
    for (let x = 280; x < spec.width - 240; x += 100) {
      const gap = spec.gaps.find(([gx, gw]) => x >= gx - 40 && x <= gx + gw + 40);
      this.addPickup('coin', x, gap ? 405 - Math.sin((x - gap[0]) / gap[1] * Math.PI) * 55 : 530);
    }
    for (let n = 0; n < 8; n++) {
      let x = 460 + n * (spec.width - 860) / 8;
      const platform = !spec.rush && this.platforms.find(p => !p.ground && Math.abs(p.x + p.w / 2 - x) < 210);
      if (platform) this.addPickup('letter', platform.x + platform.w / 2, platform.y - 53, { letter: n });
      else { while (!safeGround(x) && x < spec.width - 250) x += 25; this.addPickup('letter', x, spec.rush ? 465 : 500, { letter: n }); }
    }
    for (let n = 0; n < 4; n++) {
      let x = 640 + n * (spec.width - 1250) / 4;
      const platform = !spec.rush && this.platforms.find(p => !p.ground && Math.abs(p.x + p.w / 2 - x) < 245);
      if (platform) this.addPickup('vase', platform.x + platform.w - 35, platform.y - 35);
      else { while (!safeGround(x) && x < spec.width - 150) x += 25; this.addPickup('vase', x, 540); }
    }
    for (let x = 900; x < spec.width - 450; x += 1050) {
      while (!safeGround(x) && x < spec.width - 400) x += 25;
      this.addPickup('health', x, 530); this.addPickup('magic', x + 55, 520);
    }
    let cpX = spec.width * .48; while (!safeGround(cpX)) cpX += 25;
    this.checkpoints.push({ x: cpX, y: 600, active: false });
    if (spec.boss) {
      this.checkpoints.push({ x: arenaStart + 60, y: 600, active: false });
      const hp = { centaur: 24, minotaur: 30, hydra: 36, medusa: 32, titan: 38, hades: 46 }[spec.boss];
      this.boss = { id: this.nextId++, type: spec.boss, x: spec.width - 360, y: 600, homeX: spec.width - 360, w: spec.boss === 'hydra' ? 210 : 110, h: spec.boss === 'hydra' ? 190 : 160, health: hp, maxHealth: hp, phase: 'waiting', timer: 0, invuln: 0, cycle: 0, active: false, vulnerable: false, dir: -1, vx: 0, anim: 0, arenaStart, attackDone: false };
    } else this.boss = null;
    this.exit = { x: spec.width - 140, y: 600 };
    this.emit('start', { chapter: this.chapter, title: spec.name, intro: spec.intro, rush: !!spec.rush });
  }
  addPickup(type, x, y, extra = {}) { this.pickups.push({ id: this.nextId++, type, x, y, ...extra }); }
  pause() { if (this.state === 'playing') { this.state = 'paused'; this.emit('pause'); } }
  resume() { if (this.state === 'paused') { this.state = 'playing'; this.emit('resume'); } }
  swing(heavy = false) {
    const p = this.player; if (p.cooldown > 0 && !heavy || this.spec.rush) return;
    p.attack = heavy ? .38 : .27; p.attackHeavy = heavy; p.cooldown = heavy ? .6 : .38; p.hitIds.clear();
    this.emit('sword', { heavy });
    if (heavy) this.shake = 5;
  }
  cast() {
    const p = this.player; if (p.magic < 20 || p.magicCooldown > 0 || this.spec.rush) return;
    p.magic -= 20; p.magicCooldown = .65; p.castTimer = .3; this.emit('magic', { gift: p.gift });
    if (p.gift === 'sonic') {
      this.rings.push({ x: p.x, y: p.y - 55, radius: 12, life: .45, color: '#a6eaff' });
      for (const e of [...this.enemies, this.boss].filter(Boolean)) if (Math.abs(e.x - p.x) < 260 && Math.abs(e.y - p.y) < 160) this.hitEnemy(e, 3, true);
      for (const c of this.crates) if (Math.abs(c.x - p.x) < 240) c.health = 0;
    } else {
      this.projectiles.push({ x: p.x + p.dir * 45, y: p.y - 62, vx: p.dir * 690, vy: 0, w: 34, h: 20, life: 1.8, friendly: true, kind: p.gift, damage: 3 });
    }
  }
  hitEnemy(e, damage, magic = false) {
    if (e.health <= 0 || e.invuln > 0) return false;
    if (e === this.boss && !e.vulnerable) { this.emit('blocked'); this.burst(e.x, e.y - e.h * .5, '#deeaff', 5); return false; }
    e.health -= damage; e.invuln = .24;
    e.x = clamp(e.x + this.player.dir * (e === this.boss ? 6 : 22), e.min ?? e.arenaStart ?? 0, e.max ?? this.spec.width);
    this.burst(e.x, e.y - e.h * .5, magic ? '#85e9fc' : '#ffe89d', 13); this.emit('hit'); this.shake = damage >= 3 ? 6 : 2;
    this.popups.push({ x: e.x, y: e.y - e.h - 12, text: `−${damage}`, color: '#ffe7a3', life: .65 });
    if (e.health <= 0) {
      if (e === this.boss) { this.emit('bossDefeated', { name: BOSS_NAMES[e.type] }); this.burst(e.x, e.y - 80, '#ffe181', 60); this.shake = 12; pRestore(this.player, this.settings); }
      else { this.kills++; this.addPickup('coin', e.x, e.y - 45, { value: 5 }); if (this.kills % 4 === 0) this.addPickup('magic', e.x + 25, e.y - 45); this.emit('defeat'); }
    }
    return true;
  }
  hurt(damage, sourceX = this.player.x + 1) {
    const p = this.player; if (p.invuln > 0 || this.state !== 'playing') return;
    p.health = Math.max(0, p.health - damage * this.settings.damage);
    p.invuln = 1.1; p.hurtTimer = .28; p.vx = Math.sign(p.x - sourceX || -1) * 280; p.vy = -290; p.grounded = false; this.shake = 9;
    this.burst(p.x, p.y - 65, '#ffd0a0', 18); this.emit('hurt');
    if (p.health <= 0) this.die();
  }
  die() {
    if (this.state !== 'playing') return;
    this.lives--; this.state = 'dead'; this.emit('death', { lives: this.lives });
  }
  retry() {
    if (this.lives <= 0) { this.lives = this.settings.lives; this.load(); return; }
    const p = this.player; this.state = 'playing'; Object.assign(p, { x: this.checkpoint.x, y: this.checkpoint.y, vx: 0, vy: 0, health: this.settings.health, magic: Math.max(50, p.magic), invuln: 2.5, attack: 0, cooldown: 0, grounded: true, jumps: 0, slam: false, charge: 0, holding: false, landTimer: 0, castTimer: 0, hurtTimer: 0 });
    this.projectiles = []; this.camera = Math.max(0, p.x - 330); this.shake = 0;
    if (this.spec.rush) this.rushWall = p.x - 550;
    if (this.boss && this.boss.health > 0) Object.assign(this.boss, { phase: 'waiting', active: false, timer: 0, vulnerable: false, x: this.boss.homeX, health: this.boss.maxHealth });
    this.emit('retry');
  }
  complete() {
    if (this.state !== 'playing') return;
    this.state = 'clear'; this.totalGold += this.coins; this.emit('clear', { chapter: this.chapter, coins: this.coins, letters: this.letters.size, vases: this.vases, final: this.chapter === CHAPTERS.length - 1 });
  }
  burst(x, y, color, count) {
    for (let n = 0; n < count; n++) { const angle = Math.random() * Math.PI * 2, speed = 50 + Math.random() * 230; this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 100, life: .35 + Math.random() * .4, maxLife: .75, size: 2 + Math.random() * 4, color }); }
  }
  update(dt, input = {}) {
    dt = Math.min(dt, 1 / 30); if (this.state !== 'playing') return;
    this.time += dt;
    const p = this.player, cfg = this.settings;
    for (const timer of ['landTimer','castTimer','hurtTimer']) p[timer] = Math.max(0, p[timer] - dt);
    p.invuln = Math.max(0, p.invuln - dt); p.attack = Math.max(0, p.attack - dt); p.cooldown = Math.max(0, p.cooldown - dt); p.magicCooldown = Math.max(0, p.magicCooldown - dt); p.buffer = Math.max(0, p.buffer - dt); this.shake = Math.max(0, this.shake - dt * 22);
    if (input.jumpPressed) p.buffer = .15;
    p.coyote = p.grounded ? .12 : Math.max(0, p.coyote - dt);
    if (p.buffer > 0 && (p.grounded || p.coyote > 0 || p.jumps < 2)) {
      const extra = !p.grounded && p.coyote <= 0;
      p.vy = -710; p.grounded = false; p.landTimer = 0; p.jumps = extra ? 2 : 1; p.coyote = 0; p.buffer = 0; p.slam = false;
      this.emit('jump', { double: extra }); this.burst(p.x, p.y - 5, extra ? '#b3edff' : '#e6d6a2', 7);
    }
    if (input.jumpReleased && p.vy < -270) p.vy *= .65;
    if (input.down && !p.grounded && p.vy > -100) { p.vy = 1050; p.slam = true; }
    if (input.attackPressed && !this.spec.rush) { this.swing(); p.holding = true; p.charge = 0; }
    if (input.attack && p.holding) p.charge = Math.min(1.2, p.charge + dt);
    if (input.attackReleased) { if (p.charge > .45) this.swing(true); p.holding = false; p.charge = 0; }
    if (input.magicPressed) this.cast();
    const movement = this.spec.rush ? 1 : ((input.right ? 1 : 0) - (input.left ? 1 : 0));
    const speed = this.spec.rush ? 335 + this.chapter * 5 : 325;
    if (movement) { p.dir = movement; p.vx += (movement * speed - p.vx) * Math.min(1, dt * (p.grounded ? 14 : 8)); }
    else p.vx *= Math.max(0, 1 - dt * (p.grounded ? 13 : 2));
    p.anim += dt * Math.abs(p.vx) / 35;
    const oldY = p.y, wasGrounded = p.grounded;
    p.x = clamp(p.x + p.vx * dt, p.w / 2, this.spec.width + 50);
    p.vy += 1920 * dt; p.y += p.vy * dt; p.grounded = false;
    for (const plat of this.platforms) {
      if (p.x + p.w / 2 > plat.x && p.x - p.w / 2 < plat.x + plat.w && oldY <= plat.y + 2 && p.y >= plat.y && p.vy >= 0) {
        const landedHard = p.slam; if (!wasGrounded && p.vy > 180) p.landTimer = .12; p.y = plat.y; p.vy = 0; p.grounded = true; p.jumps = 0; p.slam = false;
        if (landedHard) { this.shake = 7; this.emit('slam'); this.rings.push({ x: p.x, y: p.y - 3, radius: 10, life: .4, color: '#ffdf95' }); for (const e of [...this.enemies, this.boss].filter(Boolean)) if (Math.abs(e.x - p.x) < 150 && Math.abs(e.y - p.y) < 65) this.hitEnemy(e, 3); }
        break;
      }
    }
    if (p.y > VIEW.h + 180) { this.die(); return; }
    if (this.spec.rush) {
      this.rushWall += dt * (307 + this.chapter * 5);
      if (p.x < this.rushWall + 30) { this.die(); return; }
    }
    for (const hazard of this.hazards) if (overlap(body(p), hazard)) this.hurt(hazard.kind === 'spikes' ? 18 : 15, hazard.x);
    // Checkpoints always sit on a safe, solid stretch.
    for (const cp of this.checkpoints) if (!cp.active && p.x > cp.x) { cp.active = true; this.checkpoint = { x: cp.x + 30, y: cp.y }; this.emit('checkpoint'); }
    for (const item of this.pickups) {
      if (item.taken || Math.abs(item.x - p.x) > 49 || item.y < p.y - p.h - 30 || item.y > p.y + 20) continue;
      item.taken = true;
      if (item.type === 'coin') this.coins += item.value || 1;
      if (item.type === 'letter') { this.letters.add(item.letter); if (this.letters.size === 8) { this.lives++; this.emit('allLetters'); } }
      if (item.type === 'vase') { this.vases++; if (this.vases === 4) this.emit('allVases'); }
      if (item.type === 'health') p.health = Math.min(cfg.health, p.health + 35);
      if (item.type === 'magic') p.magic = Math.min(100, p.magic + 35);
      this.burst(item.x, item.y, item.type === 'magic' ? '#8bdffa' : '#ffde7c', 5); this.emit('collect', { kind: item.type });
    }
    const slash = { x: p.dir === 1 ? p.x + 8 : p.x - 126, y: p.y - 110, w: p.attackHeavy ? 144 : 118, h: 107 };
    for (const enemy of this.enemies) {
      if (enemy.health <= 0) continue;
      enemy.invuln = Math.max(0, enemy.invuln - dt); enemy.anim += dt * 6;
      if (Math.abs(enemy.x - p.x) < 1000) this.updateEnemy(enemy, dt);
      if (p.attack > 0 && !p.hitIds.has(enemy.id) && overlap(slash, body(enemy))) { p.hitIds.add(enemy.id); this.hitEnemy(enemy, p.attackHeavy ? 3 : 1); }
      if (overlap(body(p), body(enemy))) this.hurt(12, enemy.x);
    }
    for (const c of this.crates) if (c.health > 0 && p.attack > 0 && overlap(slash, body(c))) { c.health = 0; this.addPickup('health', c.x, c.y - 55); this.addPickup('coin', c.x + 15, c.y - 45, { value: 5 }); this.burst(c.x, c.y - 35, '#e7ba70', 18); this.emit('break'); }
    if (this.boss && this.boss.health > 0) {
      const b = this.boss; b.invuln = Math.max(0, b.invuln - dt);
      if (p.x > b.arenaStart && !b.active) { b.active = true; b.phase = 'windup'; b.timer = 1.25; this.emit('bossStart', { name: BOSS_NAMES[b.type], hint: BOSS_HINTS[b.type] }); }
      if (b.active) { p.x = Math.max(b.arenaStart + 18, p.x); this.updateBoss(b, dt); }
      if (p.attack > 0 && b.active && !p.hitIds.has(b.id) && overlap(slash, body(b))) { p.hitIds.add(b.id); this.hitEnemy(b, p.attackHeavy ? 3 : 1); }
      if (b.phase !== 'teleport' && overlap(body(p), body(b))) this.hurt(18, b.x);
    }
    for (const shot of this.projectiles) {
      shot.life -= dt;
      if (shot.friendly && shot.kind === 'fire') {
        const target = [...this.enemies, this.boss].filter(e => e && e.health > 0 && Math.abs(e.x - shot.x) < 550).sort((a, b) => Math.abs(a.x - shot.x) - Math.abs(b.x - shot.x))[0];
        if (target) shot.vy += ((target.y - target.h * .5 - shot.y) * 4 - shot.vy) * dt * 3;
      }
      shot.x += shot.vx * dt; shot.y += shot.vy * dt;
      const box = { x: shot.x - shot.w / 2, y: shot.y - shot.h / 2, w: shot.w, h: shot.h };
      if (shot.friendly) { for (const enemy of [...this.enemies, this.boss].filter(Boolean)) if (enemy.health > 0 && overlap(box, body(enemy))) { this.hitEnemy(enemy, shot.damage, true); shot.life = 0; break; } }
      else if (overlap(box, body(p))) { this.hurt(shot.damage || 16, shot.x); shot.life = 0; }
    }
    this.projectiles = this.projectiles.filter(s => s.life > 0);
    for (const fx of this.particles) { fx.life -= dt; fx.x += fx.vx * dt; fx.y += fx.vy * dt; fx.vy += 470 * dt; }
    this.particles = this.particles.filter(fx => fx.life > 0);
    for (const popup of this.popups) { popup.y -= dt * 50; popup.life -= dt; } this.popups = this.popups.filter(x => x.life > 0);
    for (const r of this.rings) { r.life -= dt; r.radius += dt * 650; } this.rings = this.rings.filter(r => r.life > 0);
    const targetCam = clamp(p.x - VIEW.w * .32, 0, this.spec.width - VIEW.w + 180);
    this.camera += (targetCam - this.camera) * Math.min(1, dt * 5);
    if (p.x > this.exit.x - 45 && (!this.boss || this.boss.health <= 0)) this.complete();
  }
  updateEnemy(e, dt) {
    const p = this.player, dx = p.x - e.x;
    e.timer -= dt;
    if (e.type === 'harpy') {
      if (e.phase === 'patrol') { e.y = e.homeY + Math.sin(this.time * 2 + e.id) * 35; e.x += Math.cos(this.time * 1.5 + e.id) * 25 * dt; if (e.timer <= 0 && Math.abs(dx) < 500) { e.phase = 'swoop'; e.timer = .8; e.vx = clamp(dx * 1.3, -320, 320); e.vy = (p.y - 25 - e.y) * 1.2; } }
      else if (e.phase === 'swoop') { e.x += e.vx * dt; e.y += e.vy * dt; if (e.timer <= 0) { e.phase = 'return'; e.timer = 1.2; } }
      else { e.y += (e.homeY - e.y) * dt * 3; e.x += (e.homeX - e.x) * dt * 2; if (e.timer <= 0) { e.phase = 'patrol'; e.timer = 2.2; } }
      e.dir = dx > 0 ? 1 : -1; return;
    }
    if (e.phase === 'patrol') {
      if (Math.abs(dx) < 230) e.dir = dx > 0 ? 1 : -1;
      e.x += e.dir * (e.type === 'centaur' ? 78 : 48) * this.settings.speed * dt;
      if (e.x <= e.min) e.dir = 1; if (e.x >= e.max) e.dir = -1;
      e.x = clamp(e.x, e.min, e.max);
      if (Math.abs(dx) < 135 && Math.abs(e.y - p.y) < 70) { e.phase = 'windup'; e.timer = .55; e.attackDone = false; }
    } else if (e.phase === 'windup' && e.timer <= 0) { e.phase = 'attack'; e.timer = .32; this.emit('enemySwing'); }
    else if (e.phase === 'attack') {
      if (!e.attackDone) { e.attackDone = true; const hit = { x: e.dir === 1 ? e.x : e.x - 140, y: e.y - 95, w: 140, h: 92 }; if (overlap(hit, body(p))) this.hurt(18, e.x); }
      if (e.timer <= 0) { e.phase = 'recover'; e.timer = .8; }
    } else if (e.phase === 'recover' && e.timer <= 0) { e.phase = 'patrol'; e.timer = 1; }
  }
  updateBoss(b, dt) {
    const p = this.player; b.timer -= dt; b.anim += dt * 2; b.dir = p.x > b.x ? 1 : -1;
    b.vulnerable = b.phase === 'recover';
    if (b.phase === 'windup' && b.timer <= 0) {
      b.phase = 'attack'; b.timer = b.type === 'centaur' ? .9 : .85; b.cycle++; b.attackDone = false;
      if (b.type === 'centaur') b.vx = b.dir * 510;
      this.emit('bossAttack', { boss: b.type });
    }
    if (b.phase === 'attack') {
      if (b.type === 'centaur') b.x = clamp(b.x + b.vx * dt, b.arenaStart + 130, this.spec.width - 170);
      if (!b.attackDone) {
        b.attackDone = true;
        if (b.type === 'minotaur' || b.type === 'titan') {
          this.shake = 13; this.burst(b.x, b.y, '#dac699', 30);
          for (const dir of [-1, 1]) this.projectiles.push({ x: b.x + dir * 80, y: 580, vx: dir * (b.type === 'titan' ? 380 : 330), vy: 0, w: 62, h: 36, life: 2.5, kind: 'shock', damage: 23 });
          if (b.type === 'titan' && b.cycle % 2 === 0) for (let n = 0; n < 3; n++) this.projectiles.push({ x: p.x - 110 + n * 110, y: 140 - n * 25, vx: 0, vy: 290, w: 35, h: 35, life: 2, kind: 'stone', damage: 18 });
        } else if (b.type === 'hydra') {
          for (let n = 0; n < 3; n++) this.projectiles.push({ x: b.x - 80, y: b.y - 70 - n * 47, vx: b.dir * (310 + n * 30), vy: n === 2 ? 25 : 0, w: 39, h: 26, life: 2.5, kind: 'fire', damage: 18 });
        } else if (b.type === 'medusa') {
          this.projectiles.push({ x: b.x + b.dir * 70, y: 543, vx: b.dir * 440, vy: 0, w: 175, h: 44, life: 2.1, kind: 'gaze', damage: 25 });
        } else if (b.type === 'hades') {
          for (let n = 0; n < 3; n++) this.projectiles.push({ x: b.x + b.dir * 65, y: b.y - 70 - n * 45, vx: b.dir * (330 + n * 25), vy: n * 12, w: 40, h: 26, life: 2.2, kind: 'bluefire', damage: 21 });
        }
      }
      if (b.timer <= 0) {
        b.phase = b.type === 'hades' ? 'teleport' : 'recover';
        b.timer = b.type === 'hades' ? .5 : 2.45;
        if (b.phase === 'recover') this.emit('bossOpening');
      }
    } else if (b.phase === 'teleport' && b.timer <= 0) {
      b.x = clamp(p.x + (b.cycle % 2 ? 180 : -180), b.arenaStart + 180, this.spec.width - 210);
      b.phase = 'recover'; b.timer = 2.5; this.burst(b.x, 490, '#70d7ff', 30); this.emit('bossOpening');
    } else if (b.phase === 'recover' && b.timer <= 0) {
      b.phase = 'windup'; b.timer = 1.1 / this.settings.speed;
      if (b.type !== 'centaur' && b.type !== 'hades') b.x += (b.homeX - b.x) * .5;
    }
    b.vulnerable = b.phase === 'recover';
  }
  snapshot() { return { state: this.state, chapter: this.chapter, title: this.spec?.name, difficulty: this.difficulty, lives: this.lives, gold: this.coins, letters: this.letters?.size ?? 0, amphorae: this.vases, player: this.player ? { x: Math.round(this.player.x), y: Math.round(this.player.y), health: Math.round(this.player.health), magic: Math.round(this.player.magic), gift: this.player.gift } : null, boss: this.boss ? { type: this.boss.type, health: this.boss.health, phase: this.boss.phase } : null }; }
}
function pRestore(p, cfg) { p.health = Math.min(cfg.health, p.health + 25); p.magic = Math.min(100, p.magic + 30); }

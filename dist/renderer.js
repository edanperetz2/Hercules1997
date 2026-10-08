import { VIEW, BOSS_NAMES } from './engine.js';
export class Renderer {
  constructor(canvas, assets) { this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.assets = assets; this.menuTime = 0; }
  image(name, x, feet, height, dir = -1, options = {}) {
    const img = this.assets[name]; if (!img?.complete || !img.naturalWidth) return;
    const c = this.ctx, w = height * img.naturalWidth / img.naturalHeight;
    c.save(); c.translate(x, feet); c.scale(name === 'hero' ? dir : -dir, 1);
    if (options.rotation) c.rotate(options.rotation);
    if (options.squash) c.scale(1 / options.squash, options.squash);
    if (options.alpha !== undefined) c.globalAlpha = options.alpha;
    if (options.filter) c.filter = options.filter;
    c.drawImage(img, name === 'hero' ? -w * .62 : -w / 2, -height, w, height); c.restore();
  }
  background(name, camera, time) {
    const c = this.ctx, img = this.assets[name]; c.fillStyle = '#1b3456'; c.fillRect(0, 0, VIEW.w, VIEW.h);
    if (img?.complete && img.naturalWidth) {
      const bw = VIEW.h * img.naturalWidth / img.naturalHeight, offset = -camera * .24;
      const first = Math.floor(-offset / bw);
      for (let tile = first - 1; tile < first + 3; tile++) {
        const x = offset + tile * bw;
        c.save(); if (tile % 2) { c.translate(x + bw, 0); c.scale(-1, 1); c.drawImage(img, 0, 0, bw, VIEW.h); } else c.drawImage(img, x, 0, bw, VIEW.h); c.restore();
      }
    }
    const shade = c.createLinearGradient(0, 0, 0, VIEW.h); shade.addColorStop(0, '#10213e0a'); shade.addColorStop(.6, '#10213e00'); shade.addColorStop(1, name === 'underworld' ? '#06142b70' : '#17324725'); c.fillStyle = shade; c.fillRect(0, 0, VIEW.w, VIEW.h);
    // Small ambient light particles keep the painted environment alive.
    for (let n = 0; n < 22; n++) {
      const x = ((n * 193.73 - camera * .4 + time * (5 + n % 4)) % 1350 + 1350) % 1350 - 25;
      const y = 130 + ((n * 71.1) % 450) + Math.sin(time + n) * 11;
      c.globalAlpha = .13 + (Math.sin(time * 1.2 + n) + 1) * .13; c.fillStyle = name === 'underworld' ? '#76e1ff' : '#fff5be'; c.beginPath(); c.arc(x, y, n % 3 + 1, 0, Math.PI * 2); c.fill();
    } c.globalAlpha = 1;
  }
  menu(dt) {
    this.menuTime += dt; const c = this.ctx, t = this.menuTime;
    this.background('grove', 410 + Math.sin(t * .1) * 100, t);
    const g = c.createLinearGradient(0, 525, 0, 720); g.addColorStop(0, '#25382900'); g.addColorStop(1, '#10201f'); c.fillStyle = g; c.fillRect(0, 525, 1280, 195);
    this.image('column', 130, 700, 450, -1, { alpha: .65 }); this.image('column', 1120, 700, 360, -1, { alpha: .6 });
    c.save(); c.shadowColor = '#fff4bd55'; c.shadowBlur = 30; this.image('hero', 1020, 717 + Math.sin(t * 1.7) * 2, 415, -1, { rotation: .02 }); c.restore();
    this.image('amphora', 188, 712, 72, -1, { alpha: .9 });
  }
  render(world, dt) {
    if (world.state === 'menu') { this.menu(dt); return; }
    const c = this.ctx, w = world, p = w.player, t = w.time, cam = w.camera;
    this.background(w.spec.bg, cam, t);
    c.save(); if (w.shake > 0) c.translate(Math.sin(t * 173) * w.shake, Math.cos(t * 139) * w.shake * .6);
    c.translate(-cam, 0);
    // Painted props sit behind the functional collision geometry.
    for (let x = 350; x < w.spec.width; x += 785) if (x > cam - 200 && x < cam + VIEW.w + 200) this.image('column', x, 611, 195 + (Math.floor(x / 785) % 3) * 28, -1, { alpha: .55, filter: w.spec.bg === 'underworld' ? 'brightness(.65) saturate(.7)' : 'brightness(.9)' });
    for (const plat of w.platforms) {
      if (plat.x + plat.w < cam - 30 || plat.x > cam + VIEW.w + 30) continue;
      this.platform(plat, w.spec.bg, cam);
    }
    for (const h of w.hazards) {
      if (h.x > cam + VIEW.w || h.x + h.w < cam) continue;
      if (h.kind === 'spikes') {
        c.fillStyle = '#354653'; c.strokeStyle = '#deebeb'; c.lineWidth = 2;
        for (let x = h.x; x < h.x + h.w; x += 17) { c.beginPath(); c.moveTo(x, 600); c.lineTo(x + 8, 579); c.lineTo(x + 17, 600); c.closePath(); c.fill(); c.stroke(); }
      } else { this.image('column', h.x + h.w / 2, 600, 69, -1, { rotation: Math.PI / 2 }); c.fillStyle = '#a8b8b3'; c.fillRect(h.x, 587, h.w, 13); }
    }
    for (const cp of w.checkpoints) {
      if (Math.abs(cp.x - p.x) > 1000) continue;
      c.fillStyle = '#bd9964'; c.fillRect(cp.x - 3, 525, 6, 75); c.fillStyle = cp.active ? '#9df2d7' : '#e7c06f'; c.beginPath(); c.moveTo(cp.x + 3, 529); c.lineTo(cp.x + 42, 544); c.lineTo(cp.x + 3, 555); c.fill();
      if (cp.active) { c.globalAlpha = .15 + Math.sin(t * 3) * .07; c.fillStyle = '#b4ffe5'; c.beginPath(); c.ellipse(cp.x, 598, 50, 10, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
    }
    this.exit(w);
    for (const pickup of w.pickups) if (!pickup.taken && pickup.x > cam - 80 && pickup.x < cam + VIEW.w + 80) this.pickup(pickup, t);
    for (const crate of w.crates) if (crate.health > 0) { this.image('amphora', crate.x, crate.y, 65); }
    for (const e of w.enemies) if (e.health > 0 && e.x > cam - 180 && e.x < cam + VIEW.w + 180) this.enemy(e, t);
    if (w.boss?.health > 0) this.boss(w.boss, t);
    this.hero(p, t);
    for (const s of w.projectiles) this.projectile(s, t);
    for (const r of w.rings) { c.globalAlpha = r.life * 2; c.strokeStyle = r.color; c.lineWidth = 4; c.beginPath(); c.ellipse(r.x, r.y, r.radius, r.radius * .6, 0, 0, Math.PI * 2); c.stroke(); } c.globalAlpha = 1;
    for (const fx of w.particles) { c.globalAlpha = Math.min(1, fx.life / .25); c.fillStyle = fx.color; c.fillRect(fx.x, fx.y, fx.size, fx.size); } c.globalAlpha = 1;
    for (const popup of w.popups) { c.globalAlpha = Math.min(1, popup.life * 3); this.text(popup.text, popup.x, popup.y, 22, popup.color); } c.globalAlpha = 1;
    if (w.spec.rush) {
      const danger = c.createLinearGradient(w.rushWall - 100, 0, w.rushWall + 130, 0); danger.addColorStop(0, '#101027'); danger.addColorStop(.4, '#c55a463b'); danger.addColorStop(1, '#e79d4100'); c.fillStyle = danger; c.fillRect(cam - 100, 0, Math.max(0, w.rushWall - cam + 230), 720);
    }
    c.restore();
    const vignette = c.createRadialGradient(640, 345, 270, 640, 345, 820); vignette.addColorStop(0, '#07122800'); vignette.addColorStop(1, '#07122860'); c.fillStyle = vignette; c.fillRect(0, 0, 1280, 720);
    // Fine progress ribbon gives a sense of the remaining journey.
    c.fillStyle = '#08203a88'; c.fillRect(0, 716, 1280, 4); c.fillStyle = '#f0c66c'; c.fillRect(0, 716, p.x / w.spec.width * 1280, 4);
  }
  platform(plat, theme, cam) {
    const c = this.ctx, x = Math.max(plat.x, cam - 15), right = Math.min(plat.x + plat.w, cam + VIEW.w + 15), width = right - x;
    const dark = theme === 'underworld', ground = plat.ground;
    const grad = c.createLinearGradient(0, plat.y, 0, plat.y + plat.h); grad.addColorStop(0, dark ? '#394c60' : '#c0a879'); grad.addColorStop(.07, dark ? '#152b42' : '#8c765a'); grad.addColorStop(1, dark ? '#0c1526' : '#2f3836');
    c.fillStyle = grad; c.fillRect(x, plat.y, width, plat.h);
    c.fillStyle = dark ? '#739ea9' : theme === 'grove' && ground ? '#879b53' : '#dac091'; c.fillRect(x, plat.y, width, ground ? 8 : 5);
    c.strokeStyle = dark ? '#64839360' : '#c5ad7740'; c.lineWidth = 1;
    for (let row = 0; row < (ground ? 4 : 1); row++) { const y = plat.y + 16 + row * 42; c.beginPath(); c.moveTo(x, y + 30); c.lineTo(right, y + 30); c.stroke(); for (let xx = Math.floor(x / 130) * 130 + (row % 2) * 65; xx < right; xx += 130) { c.beginPath(); c.moveTo(xx, y - 10); c.lineTo(xx + 4, y + 30); c.stroke(); } }
    if (!ground) { c.fillStyle = '#0d20375c'; c.fillRect(x + 5, plat.y + plat.h, Math.max(0, width - 10), 5); }
  }
  hero(p, time) {
    const c = this.ctx, active = Math.abs(p.vx) > 40 && p.grounded, bob = active ? Math.sin(p.anim) * 3 : Math.sin(time * 2) * .7;
    c.fillStyle = '#09122148'; c.beginPath(); c.ellipse(p.x, p.grounded ? p.y + 1 : 601, p.grounded ? 27 : 21, p.grounded ? 6 : 4, 0, 0, Math.PI * 2); c.fill();
    const alpha = p.invuln > 0 && Math.floor(time * 14) % 2 === 0 ? .48 : 1;
    this.image('hero', p.x, p.y + bob + 1, 127, p.dir, { alpha, rotation: p.attack > 0 ? p.dir * -.09 : active ? Math.sin(p.anim) * .035 : !p.grounded ? -.06 : 0, squash: !p.grounded ? 1.045 : active ? 1 + Math.cos(p.anim * 2) * .015 : 1 });
    if (p.charge > .35) { c.globalAlpha = Math.min(.9, p.charge); c.strokeStyle = '#ffdb69'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y - 63, 64 + Math.sin(time * 20) * 4, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1; }
    if (p.attack > 0) {
      c.save(); c.translate(p.x, p.y - 65); c.scale(p.dir, 1);
      c.strokeStyle = p.attackHeavy ? '#fff1b0' : '#fff5d6'; c.shadowBlur = 16; c.shadowColor = '#fff4c2'; c.lineWidth = p.attackHeavy ? 11 : 7; c.lineCap = 'round';
      const phase = 1 - p.attack / (p.attackHeavy ? .38 : .27); c.beginPath(); c.arc(20, 6, p.attackHeavy ? 119 : 98, -.9 + phase * .5, .65 + phase * .3); c.stroke();
      c.shadowBlur = 0; c.globalAlpha = .25; c.lineWidth = 25; c.stroke(); c.restore();
    }
  }
  enemy(e, time) {
    const attack = e.phase === 'windup' || e.phase === 'attack', h = e.type === 'centaur' ? 123 : e.type === 'harpy' ? 110 : 105;
    const bob = e.type === 'harpy' ? Math.sin(time * 9) * 4 : Math.sin(e.anim) * 2;
    this.image(e.type, e.x, e.y + bob, h, e.dir, { rotation: attack ? e.dir * .12 : Math.sin(e.anim) * .015, alpha: e.invuln > 0 ? .55 : 1 });
    if (e.phase === 'windup') this.text('!', e.x, e.y - h - 15, 30, '#ffe29b');
    if (e.health < e.maxHealth && e.type !== 'harpy') { const c = this.ctx; c.fillStyle = '#1b213ea8'; c.fillRect(e.x - 25, e.y - h - 10, 50, 4); c.fillStyle = '#efb161'; c.fillRect(e.x - 25, e.y - h - 10, 50 * e.health / e.maxHealth, 4); }
  }
  boss(b, time) {
    if (b.phase === 'teleport') return;
    const name = ({ minotaur: 'satyr', medusa: 'harpy', titan: 'satyr' })[b.type] || b.type;
    const height = b.type === 'hydra' ? (b.vulnerable ? 194 : 258) : b.type === 'titan' ? 254 : b.type === 'minotaur' ? 205 : 210;
    let filter = b.type === 'medusa' ? 'hue-rotate(105deg) saturate(.8)' : b.type === 'titan' ? 'grayscale(.8) sepia(.4)' : undefined;
    if (b.vulnerable) { const c = this.ctx; c.globalAlpha = .4; c.fillStyle = '#f5c15e'; c.beginPath(); c.ellipse(b.x, 596, 93, 12, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
    this.image(name, b.x, b.y + Math.sin(time * 2) * 2, height, b.dir, { rotation: b.phase === 'windup' ? -.06 * b.dir : b.phase === 'attack' ? .1 * b.dir : 0, alpha: b.invuln > 0 ? .6 : 1, filter });
    if (b.active && b.phase === 'windup') this.text('!', b.x, b.y - height - 18, 37, '#ffdc79');
    if (b.active && b.vulnerable) this.text('STRIKE!', b.x, b.y - height - 13, 18, '#ffedae');
  }
  pickup(item, time) {
    const c = this.ctx, x = item.x, y = item.y + Math.sin(time * 3 + item.id) * 4;
    c.save(); c.shadowBlur = 14;
    if (item.type === 'vase') { c.shadowColor = '#ffce6450'; this.image('amphora', x, y + 22, 44); }
    else if (item.type === 'letter') { c.shadowColor = '#ffd35a'; c.fillStyle = '#132840cc'; c.strokeStyle = '#ebc56b'; c.lineWidth = 2; c.beginPath(); c.roundRect(x - 17, y - 21, 34, 42, 4); c.fill(); c.stroke(); this.text('HERCULES'[item.letter], x, y + 8, 24, '#ffe6a7'); }
    else if (item.type === 'coin') { c.shadowColor = '#ffc94d'; c.fillStyle = '#e7b243'; c.strokeStyle = '#fff1ad'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, 10 * (.55 + Math.abs(Math.cos(time * 2 + item.id)) * .45), 13, 0, 0, Math.PI * 2); c.fill(); c.stroke(); this.text('ϟ', x, y + 5, 15, '#795023'); }
    else { const magic = item.type === 'magic'; c.shadowColor = magic ? '#84f0ff' : '#91e3a0'; c.fillStyle = magic ? '#62dced' : '#80d181'; c.strokeStyle = magic ? '#d9faff' : '#e0ffd9'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 19); c.lineTo(x + 13, y); c.lineTo(x, y + 19); c.lineTo(x - 13, y); c.closePath(); c.fill(); c.stroke(); this.text(magic ? 'ϟ' : '+', x, y + 6, 18, '#173445'); }
    c.restore();
  }
  projectile(s, time) {
    const c = this.ctx, color = ({ lightning: '#adf2ff', fire: '#ffb260', bluefire: '#82dbff', gaze: '#b4efa0', shock: '#f2dfb3', stone: '#8a99a6' })[s.kind] || '#bdeefa';
    c.save(); c.translate(s.x, s.y); c.shadowBlur = 16; c.shadowColor = color; c.fillStyle = color; c.strokeStyle = '#ffffffc0'; c.lineWidth = 2;
    if (s.kind === 'lightning') { c.scale(s.vx > 0 ? 1 : -1, 1); c.beginPath(); c.moveTo(-25, -4); c.lineTo(0, -13); c.lineTo(-3, -3); c.lineTo(26, -5); c.lineTo(-2, 14); c.lineTo(3, 3); c.lineTo(-25, 5); c.closePath(); c.fill(); }
    else if (s.kind === 'shock' || s.kind === 'gaze') { c.globalAlpha = .8; c.beginPath(); c.ellipse(0, 0, s.w / 2, s.h / 2, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
    else { c.beginPath(); c.ellipse(0, 0, s.w / 2, s.h / 2, time * 3, 0, Math.PI * 2); c.fill(); c.stroke(); }
    c.restore();
  }
  exit(w) {
    const c = this.ctx, x = w.exit.x, open = !w.boss || w.boss.health <= 0;
    this.image('column', x - 72, 600, 190, -1); this.image('column', x + 72, 600, 190, -1);
    c.fillStyle = '#b9b5a6'; c.fillRect(x - 88, 408, 176, 18);
    if (open) { const glow = c.createRadialGradient(x, 511, 5, x, 511, 115); glow.addColorStop(0, '#ffed9c80'); glow.addColorStop(1, '#ffed9c00'); c.fillStyle = glow; c.fillRect(x - 115, 400, 230, 210); this.text('TO OLYMPUS', x, 388, 14, '#fff5c6'); }
    else this.text('DEFEAT THE GUARDIAN', x, 388, 12, '#eee2be');
  }
  text(text, x, y, size = 20, color = '#fff0c4') { const c = this.ctx; c.save(); c.font = `700 ${size}px Georgia,serif`; c.textAlign = 'center'; c.fillStyle = color; c.shadowColor = '#10213e'; c.shadowBlur = 3; c.shadowOffsetY = 2; c.fillText(text, x, y); c.restore(); }
}

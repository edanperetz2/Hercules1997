import { World, CHAPTERS, BOSS_NAMES, BOSS_HINTS, VIEW } from './engine.js';
import { Renderer } from './renderer.js';
import { AudioEngine } from './audio.js';

const $ = id => document.getElementById(id);
const canvas = $('game'), assets = {}, sound = new AudioEngine();
const screens = ['menu', 'pauseScreen', 'deathScreen', 'clearScreen', 'chaptersScreen', 'helpScreen'];
const SAVE_KEY = 'hercules-hero-journey-v1';
let save = null;
try { const candidate = JSON.parse(localStorage.getItem(SAVE_KEY)); if (candidate && Number.isInteger(candidate.chapter) && candidate.chapter >= 0 && candidate.chapter < CHAPTERS.length) save = candidate; } catch {}
let completed = new Set(Array.isArray(save?.completed) ? save.completed.filter(n => Number.isInteger(n) && n >= 0 && n < CHAPTERS.length) : []);
let ready = false, helpReturn = 'menu', toastTimer = 0, hudTimer = 0;
const keyboard = new Set(), touches = new Set(); let previous = {};
const world = new World(handleEvent), renderer = new Renderer(canvas, assets);
const keyActions = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', ArrowUp:'jump', KeyW:'jump', Space:'jump', ArrowDown:'down', KeyS:'down', KeyJ:'attack', KeyX:'attack', KeyK:'magic', KeyC:'magic' };
function hide(id, value = true) { $(id).classList.toggle('hidden', value); }
function showScreen(id) { for (const s of screens) hide(s, s !== id); hide('hud', world.state === 'menu'); hide('touchControls', world.state !== 'playing' || !isTouch()); }
function isTouch() { return matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0; }
function clearInput() { keyboard.clear(); touches.clear(); previous = {}; if (world.player) { world.player.holding = false; world.player.charge = 0; } }
function toast(message, duration = 3.5) { $('toast').textContent = message; hide('toast', false); $('srStatus').textContent = message; toastTimer = duration; }
function persist(nextChapter = world.chapter) {
  save = { chapter: Math.min(nextChapter, CHAPTERS.length - 1), difficulty: world.difficulty, completed: [...completed], totalGold: world.totalGold, sound: sound.enabled };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {}
  hide('continueButton', false);
}
function start(chapter = 0, difficulty = $('difficulty').value) {
  if (!ready) return;
  clearInput(); world.start(chapter, difficulty); showScreen(null); persist(); updateHud(); canvas.focus({ preventScroll: true });
}
function title() { world.state = 'menu'; clearInput(); hide('bossHud'); hide('toast'); showScreen('menu'); $('footerHint').textContent = 'Ten chapters. One hero.'; hide('continueButton', !save); }
function pause() { if (world.state === 'playing') world.pause(); else if (world.state === 'paused') world.resume(); }
function handleEvent(event) {
  sound.effect(event.type, event);
  if (event.type === 'start') { showScreen(null); toast(event.intro, 6); $('footerHint').textContent = event.rush ? 'Rush chapter · Keep moving. Double jump the gaps.' : 'Space to jump · J to strike · K to cast · Esc to pause'; }
  else if (event.type === 'pause') { clearInput(); persist(); $('pauseChapter').textContent = `Chapter ${world.chapter + 1} · ${world.spec.name}`; showScreen('pauseScreen'); }
  else if (event.type === 'resume' || event.type === 'retry') { clearInput(); showScreen(null); canvas.focus({ preventScroll: true }); }
  else if (event.type === 'death') { clearInput(); $('deathTitle').textContent = event.lives > 0 ? 'A hero gets back up.' : 'One more adventure?'; $('deathMessage').textContent = event.lives > 0 ? `${event.lives} ${event.lives === 1 ? 'life' : 'lives'} left. Return to your last checkpoint.` : 'Restart this chapter with a fresh set of lives.'; $('retryButton').textContent = event.lives > 0 ? 'Return to checkpoint' : 'Restart chapter'; hide('toast'); showScreen('deathScreen'); }
  else if (event.type === 'clear') {
    clearInput(); completed.add(world.chapter); persist(event.final ? 0 : world.chapter + 1);
    $('clearEyebrow').textContent = event.final ? 'A TRUE HERO' : `CHAPTER ${world.chapter + 1} COMPLETE`;
    $('clearTitle').textContent = event.final ? 'Welcome to Olympus.' : ['A hero in the making.','A step closer to legend.','The gods are watching.'][world.chapter % 3];
    $('clearCopy').textContent = event.final ? `You completed the journey and defeated Hades. ${world.totalGold} gold earned across this adventure.` : `${world.spec.name} is behind you. ${CHAPTERS[world.chapter + 1].name} awaits.`;
    $('resultCoins').textContent = event.coins; $('resultLetters').textContent = `${event.letters} / 8`; $('resultVases').textContent = `${event.vases} / 4`; $('nextButton').textContent = event.final ? 'Return to title' : 'Next chapter'; hide('toast'); showScreen('clearScreen');
  }
  else if (event.type === 'checkpoint') toast('Checkpoint reached', 2);
  else if (event.type === 'allLetters') toast('HERCULES! An extra life is yours.', 4);
  else if (event.type === 'allVases') toast('All four amphorae found. A perfect treasure hunt!', 4);
  else if (event.type === 'bossStart') toast(event.hint, 5);
  else if (event.type === 'bossOpening') toast('Now! Strike while the guardian recovers.', 1.7);
  else if (event.type === 'bossDefeated') toast('Guardian defeated. The gate is open.', 5);
}
function updateHud() {
  if (!world.player) return;
  const p = world.player;
  $('healthFill').style.width = `${100 * p.health / world.settings.health}%`; $('healthFill').style.background = p.health < world.settings.health * .3 ? 'linear-gradient(#edb277,#ca5849)' : '';
  $('magicFill').style.width = `${p.magic}%`; $('magicFill').title = `${p.gift} sword · ${Math.round(p.magic)} magic`;
  $('lives').textContent = `× ${world.lives}`; $('coinCount').textContent = world.coins;
  $('chapterName').textContent = `${String(world.chapter + 1).padStart(2,'0')} · ${world.spec.name.toUpperCase()}`;
  $('objective').textContent = world.spec.rush ? 'RUN · Keep ahead of the danger' : world.boss?.active && world.boss.health > 0 ? (world.boss.vulnerable ? 'An opening! Strike now.' : 'Watch the guardian’s attack') : `GIFT: ${p.gift.toUpperCase()} · Reach the temple gate`;
  $('letters').replaceChildren(...[...'HERCULES'].map((letter,i) => { const span = document.createElement('span'); span.textContent = letter; if (world.letters.has(i)) span.className = 'found'; return span; }));
  $('vaseCount').textContent = `AMPHORAE ${world.vases} / 4`;
  const b = world.boss; hide('bossHud', !b?.active || b.health <= 0 || world.state === 'menu');
  if (b) { $('bossName').textContent = BOSS_NAMES[b.type]; $('bossFill').style.width = `${Math.max(0, b.health / b.maxHealth * 100)}%`; $('bossHint').textContent = BOSS_HINTS[b.type]; }
}
function chapters() {
  $('chapterList').replaceChildren(...CHAPTERS.map((chapter,index) => {
    const button = document.createElement('button'); button.className = 'chapter-choice';
    const number = document.createElement('span'); number.className = 'number'; number.textContent = String(index+1).padStart(2,'0');
    const info = document.createElement('span'), strong = document.createElement('strong'), small = document.createElement('small'); strong.textContent = chapter.name; small.textContent = chapter.rush ? 'Rush' : chapter.boss ? 'Adventure + boss' : 'Adventure'; info.append(strong,small); button.append(number,info);
    if (completed.has(index)) { const tick = document.createElement('span'); tick.className = 'complete'; tick.textContent = '✓'; button.append(tick); }
    button.addEventListener('click', () => start(index)); return button;
  })); showScreen('chaptersScreen');
}
function openHelp() { helpReturn = world.state; if (world.state === 'playing') world.pause(); showScreen('helpScreen'); }
function closeHelp() { if (helpReturn === 'playing') world.resume(); else showScreen(({ menu:'menu',paused:'pauseScreen',dead:'deathScreen',clear:'clearScreen' })[world.state] || 'menu'); }

$('startButton').addEventListener('click', () => start());
$('continueButton').addEventListener('click', () => start(save?.chapter ?? 0, save?.difficulty ?? 'hero'));
$('pauseButton').addEventListener('click', pause); $('resumeButton').addEventListener('click', () => world.resume());
$('restartButton').addEventListener('click', () => start(world.chapter, world.difficulty)); $('retryButton').addEventListener('click', () => { world.retry(); updateHud(); });
for (const id of ['menuButton','deathMenuButton','clearMenuButton','chaptersClose']) $(id).addEventListener('click', title);
$('nextButton').addEventListener('click', () => { if (world.chapter === CHAPTERS.length - 1) title(); else { const carry = { lives: Math.max(1,world.lives), totalGold: world.totalGold }; clearInput(); world.start(world.chapter + 1, world.difficulty, carry); showScreen(null); persist(); updateHud(); canvas.focus({preventScroll:true}); } });
$('chaptersButton').addEventListener('click', chapters); $('helpButton').addEventListener('click', openHelp); $('helpClose').addEventListener('click', closeHelp); $('helpDone').addEventListener('click', closeHelp);
$('soundButton').addEventListener('click', () => { sound.enable(!sound.enabled); $('soundLabel').textContent = sound.enabled ? 'ON' : 'OFF'; $('soundButton').setAttribute('aria-label', sound.enabled ? 'Turn sound off' : 'Turn sound on'); $('soundButton').setAttribute('aria-pressed', String(sound.enabled)); if(sound.enabled) sound.effect('checkpoint'); });
$('fullscreenButton').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if ($('gameShell').requestFullscreen) await $('gameShell').requestFullscreen(); else toast('Rotate your phone to landscape for a larger view.'); } catch { toast('Fullscreen is unavailable in this browser.'); } });
document.addEventListener('fullscreenchange', () => $('fullscreenButton').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'));
canvas.addEventListener('pointerdown', () => canvas.focus({preventScroll:true}));
window.addEventListener('keydown', event => {
  if (event.target instanceof HTMLSelectElement) return;
  const action = keyActions[event.code];
  if (action && world.state === 'playing') { event.preventDefault(); keyboard.add(action); }
  if (event.repeat) return;
  if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); if (!$('helpScreen').classList.contains('hidden')) closeHelp(); else if (!$('chaptersScreen').classList.contains('hidden')) title(); else pause(); }
  if (event.code === 'Enter' && event.target.tagName !== 'BUTTON') { if (world.state === 'menu') start(); else if (world.state === 'paused') world.resume(); else if (world.state === 'dead') world.retry(); else if (world.state === 'clear') $('nextButton').click(); }
});
window.addEventListener('keyup', event => { const action = keyActions[event.code]; if (action) keyboard.delete(action); });
window.addEventListener('blur', () => { clearInput(); if (world.state === 'playing') world.pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && world.state === 'playing') world.pause(); });
for (const button of document.querySelectorAll('[data-control]')) {
  button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); touches.add(button.dataset.control); });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type, event => { event.preventDefault(); touches.delete(button.dataset.control); });
}
let lastPadPause = false;
function readInput() {
  const pad = navigator.getGamepads?.()?.find(p => p?.connected), a = {};
  for (const action of ['left','right','jump','down','attack','magic']) a[action] = keyboard.has(action) || touches.has(action);
  if (pad) {
    a.left ||= pad.axes[0] < -.25 || pad.buttons[14]?.pressed; a.right ||= pad.axes[0] > .25 || pad.buttons[15]?.pressed;
    a.down ||= pad.axes[1] > .55 || pad.buttons[13]?.pressed; a.jump ||= pad.buttons[0]?.pressed; a.attack ||= pad.buttons[2]?.pressed; a.magic ||= pad.buttons[3]?.pressed;
    const pressed = !!pad.buttons[9]?.pressed; if (pressed && !lastPadPause) { if (world.state === 'menu') start(); else pause(); } lastPadPause = pressed;
  }
  for (const action of ['jump','attack','magic']) { a[`${action}Pressed`] = !!a[action] && !previous[action]; a[`${action}Released`] = !a[action] && !!previous[action]; }
  previous = { ...a }; return a;
}
let last = performance.now(), acc = 0;
const pendingEdges = {};
function frame(now) {
  const dt = Math.min((now - last) / 1000, .05); last = now; acc += dt;
  const input = readInput();
  for (const edge of ['jumpPressed','attackPressed','magicPressed','jumpReleased','attackReleased']) { pendingEdges[edge] ||= input[edge]; input[edge] = !!pendingEdges[edge]; }
  while (acc >= 1/120) { world.update(1/120,input); acc -= 1/120; for (const edge of Object.keys(pendingEdges)) { pendingEdges[edge] = false; input[edge] = false; } }
  renderer.render(world, dt); sound.music(dt, world.state === 'playing', world.spec?.bg === 'underworld');
  if (toastTimer > 0 && world.state === 'playing') { toastTimer -= dt; if (toastTimer <= 0) hide('toast'); }
  hudTimer -= dt; if (hudTimer <= 0) { hudTimer = .12; updateHud(); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
hide('continueButton', !save); if (save?.difficulty) $('difficulty').value = save.difficulty;
$('startButton').disabled = true; $('chaptersButton').disabled = true; $('continueButton').disabled = true;
const assetNames = ['hero','grove','thebes','underworld','satyr','centaur','skeleton','harpy','hydra','hades','amphora','column'];
try {
  await Promise.all(assetNames.map(name => new Promise((resolve,reject) => { const image = new Image(); assets[name] = image; image.onload = resolve; image.onerror = () => reject(new Error(`Unable to load ${name}`)); image.src = `assets/${name}.webp`; })));
  ready = true; $('startButton').disabled = false; $('chaptersButton').disabled = false; $('continueButton').disabled = false; hide('loading');
} catch (error) { $('loading').textContent = 'Artwork could not load. Please refresh to try again.'; console.error(error); }

// Feature-detected tools expose the same controls as the visible interface.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const register = tool => { try { Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(() => {}); } catch {} };
  register({ name:'read_adventure_state', title:'Read adventure state', description:'Read the current chapter, health, magic, collectibles, and boss state.', inputSchema:{type:'object',properties:{},additionalProperties:false}, annotations:{readOnlyHint:true,untrustedContentHint:false}, execute:() => world.snapshot() });
  register({ name:'start_adventure_chapter', title:'Start adventure chapter', description:'Start one of the ten chapters. Restarts current gameplay; uses the selected difficulty.', inputSchema:{type:'object',properties:{chapter:{type:'integer',minimum:1,maximum:10}},required:['chapter'],additionalProperties:false}, annotations:{readOnlyHint:false,untrustedContentHint:false}, execute:input => { if (!ready) throw new Error('Artwork is still loading.'); if (!input || !Number.isInteger(input.chapter) || input.chapter < 1 || input.chapter > 10 || Object.keys(input).some(k => k !== 'chapter')) throw new Error('Chapter must be an integer from 1 to 10.'); start(input.chapter-1); return world.snapshot(); } });
  register({ name:'pause_adventure',title:'Pause adventure',description:'Pause active gameplay, or resume a paused adventure.',inputSchema:{type:'object',properties:{paused:{type:'boolean'}},required:['paused'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{ if (!input || typeof input.paused !== 'boolean' || Object.keys(input).some(k=>k!=='paused')) throw new Error('paused must be a boolean.'); if(input.paused) world.pause();else world.resume();return world.snapshot(); } });
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}

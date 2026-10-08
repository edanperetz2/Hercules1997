import { World, CHAPTERS, BOSS_NAMES, BOSS_HINTS, VIEW } from './engine.js';
import { Renderer } from './renderer.js';
import { AudioEngine } from './audio.js';
import { ACTIONS, ACTION_LABELS, keyLabel, readPreferences, bindKey, actionMap } from './controls.js';
import { TouchInput, fitPlayfield, bindTouchControls } from './mobile.js';

const $ = id => document.getElementById(id);
const canvas = $('game'), assets = {}, sound = new AudioEngine();
const screens = ['menu', 'pauseScreen', 'deathScreen', 'clearScreen', 'chaptersScreen', 'helpScreen', 'controlsScreen'];
const SAVE_KEY = 'hercules-hero-journey-v1';
const CONTROL_KEY = 'hercules-controls-v2';
let storedControls; try { storedControls = JSON.parse(localStorage.getItem(CONTROL_KEY)); } catch {}
let controls = readPreferences(storedControls, isTouch()), draftControls = readPreferences(controls), controlsAccepted = false, controlsReturn = null, captureAction = null;
let save = null;
try { const candidate = JSON.parse(localStorage.getItem(SAVE_KEY)); if (candidate && Number.isInteger(candidate.chapter) && candidate.chapter >= 0 && candidate.chapter < CHAPTERS.length) save = candidate; } catch {}
let completed = new Set(Array.isArray(save?.completed) ? save.completed.filter(n => Number.isInteger(n) && n >= 0 && n < CHAPTERS.length) : []);
let ready = false, helpReturn = 'menu', toastTimer = 0, hudTimer = 0;
const keyboard = new Set(), touches = new TouchInput(), pendingEdges = {}; let previous = {};
const world = new World(handleEvent), renderer = new Renderer(canvas, assets);
let keyActions = actionMap(controls.keys);
function hide(id, value = true) { $(id).classList.toggle('hidden', value); }
function showScreen(id) { for (const s of screens) hide(s, s !== id); hide('hud', world.state === 'menu'); hide('touchControls', world.state !== 'playing' || controls.mode !== 'touch'); syncViewport(); }
function isTouch() { return matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0; }
function clearInput() { keyboard.clear(); touches.clear(); previous = {}; for (const edge of Object.keys(pendingEdges)) pendingEdges[edge] = false; for(const b of document.querySelectorAll('[data-control]')) b.classList.toggle('pressed',false); if (world.player) { world.player.holding = false; world.player.charge = 0; } }
function toast(message, duration = 3.5) { $('toast').textContent = message; hide('toast', false); $('srStatus').textContent = message; toastTimer = duration; }
function persist(nextChapter = world.chapter) {
  save = { chapter: Math.min(nextChapter, CHAPTERS.length - 1), difficulty: world.difficulty, completed: [...completed], totalGold: world.totalGold, sound: sound.enabled };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {}
  hide('continueButton', false);
}
function start(chapter = 0, difficulty = $('difficulty').value) {
  if (!ready || !controlsAccepted) return;
  sound.unlock(); clearInput(); world.start(chapter, difficulty); showScreen(null); persist(); updateHud(); canvas.focus({ preventScroll: true });
}
function title() { world.state = 'menu'; clearInput(); hide('bossHud'); hide('toast'); showScreen('menu'); $('footerHint').textContent = 'Ten chapters. One hero.'; hide('continueButton', !save); }
function pause() { if (world.state === 'playing') world.pause(); else if (world.state === 'paused') world.resume(); }
function handleEvent(event) {
  sound.effect(event.type, event);
  if (event.type === 'start') { showScreen(null); toast(event.intro, 6); $('footerHint').textContent = event.rush ? 'Rush chapter · Keep moving. Double jump the gaps.' : controlHint(); }
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
  $('magicLabel').textContent = p.gift.toUpperCase();
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

function controlHint() {
  if (controls.mode === 'touch') return 'Touch buttons · Jump twice · Hold sword to charge · Ⅱ to pause';
  if (controls.mode === 'gamepad') return 'Left stick to move · A to jump · X sword · Y magic · Start to pause';
  return `${keyLabel(controls.keys.jump)} jump · ${keyLabel(controls.keys.attack)} sword · ${keyLabel(controls.keys.magic)} magic · Esc pause`;
}
function labelNode(tag, text) { const element = document.createElement(tag); element.textContent = text; return element; }
function updateControlHints() {
  $('menuControls').textContent = controlHint();
  canvas.setAttribute('aria-label', `Hercules platform game. ${controlHint()}`);
  const rows = [];
  for (const action of ACTIONS) {
    rows.push(labelNode('span', ACTION_LABELS[action]));
    const value = controls.mode === 'gamepad' ? ({left:'Stick / D-pad left',right:'Stick / D-pad right',jump:'A / Cross',attack:'X / Square',magic:'Y / Triangle',down:'Stick / D-pad down'})[action] : controls.mode === 'touch' ? ({left:'◀',right:'▶',jump:'↑',attack:'Sword button',magic:'ϟ',down:'▼'})[action] : keyLabel(controls.keys[action]);
    rows.push(labelNode('div', value));
  }
  rows.push(labelNode('span','Charged strike'),labelNode('div','Hold sword, then release'),labelNode('span','Pause'),labelNode('div',controls.mode === 'gamepad' ? 'Start / Options' : controls.mode === 'touch' ? 'Ⅱ button' : 'ESC / P'));
  $('helpBindings').replaceChildren(...rows);
  if (world.state === 'playing' && !world.spec.rush) $('footerHint').textContent = controlHint();
}
function renderBindings() {
  const nodes = [];
  for (const radio of document.querySelectorAll('input[name="controlMode"]')) radio.checked = radio.value === draftControls.mode;
  for (const action of ACTIONS) {
    const row = document.createElement('div'); row.className = 'binding-row'; row.append(labelNode('span',ACTION_LABELS[action]));
    const custom = draftControls.mode === 'custom';
    const value = draftControls.mode === 'gamepad' ? ({left:'Stick ←',right:'Stick →',jump:'A / Cross',attack:'X / Square',magic:'Y / Triangle',down:'Stick ↓'})[action] : draftControls.mode === 'touch' ? ({left:'◀',right:'▶',jump:'↑',attack:'Sword',magic:'ϟ',down:'▼'})[action] : keyLabel(draftControls.keys[action]);
    const key = labelNode(custom ? 'button' : 'kbd', captureAction === action ? 'Press a key…' : value);
    if (custom) { key.className = 'binding-key'; key.setAttribute('aria-label',`Change ${ACTION_LABELS[action]} key, currently ${value}`); key.addEventListener('click',()=>{captureAction=action; renderBindings();}); }
    row.append(key); nodes.push(row);
  }
  $('bindings').replaceChildren(...nodes);
  $('controlsNote').textContent = captureAction ? 'Press the key you want to use. Escape cancels. Duplicate keys are swapped.' : draftControls.mode === 'gamepad' ? 'Connect a controller and press any button. Keyboard remains available as a backup.' : draftControls.mode === 'custom' ? 'Select a key to change it. Escape and P are reserved for pause.' : draftControls.mode === 'touch' ? 'Use both thumbs: hold a direction, then tap Jump or Sword. Rotate for a larger view.' : 'Escape or P pauses the adventure.';
}
function openControls(returnTo = world.state) {
  controlsReturn = returnTo;
  if (world.state === 'playing') world.pause();
  clearInput(); captureAction = null; draftControls = readPreferences(controls); renderBindings(); showScreen('controlsScreen');
}
function finishControls() {
  captureAction = null; controls = readPreferences(draftControls); controlsAccepted = true; keyActions = actionMap(controls.keys); clearInput();
  try { localStorage.setItem(CONTROL_KEY,JSON.stringify(controls)); } catch {}
  updateControlHints();
  if (controlsReturn === 'playing') world.resume();
  else if (controlsReturn === 'paused') showScreen('pauseScreen');
  else if (controlsReturn === 'dead') showScreen('deathScreen');
  else if (controlsReturn === 'clear') showScreen('clearScreen');
  else title();
}
for (const radio of document.querySelectorAll('input[name="controlMode"]')) radio.addEventListener('change',()=>{
  if (!radio.checked) return; captureAction = null;
  draftControls = readPreferences({mode:radio.value,keys:draftControls.keys}); renderBindings();
});
$('controlsDone').addEventListener('click',finishControls);
$('changeControls').addEventListener('click',()=>openControls(helpReturn));
renderBindings(); updateControlHints(); showScreen('controlsScreen');

$('startButton').addEventListener('click', () => start());
$('continueButton').addEventListener('click', () => start(save?.chapter ?? 0, save?.difficulty ?? 'hero'));
$('pauseButton').addEventListener('click', pause); $('resumeButton').addEventListener('click', () => world.resume());
$('restartButton').addEventListener('click', () => start(world.chapter, world.difficulty)); $('retryButton').addEventListener('click', () => { world.retry(); updateHud(); });
for (const id of ['menuButton','deathMenuButton','clearMenuButton','chaptersClose']) $(id).addEventListener('click', title);
$('nextButton').addEventListener('click', () => { if (world.chapter === CHAPTERS.length - 1) title(); else { const carry = { lives: Math.max(1,world.lives), totalGold: world.totalGold }; clearInput(); world.start(world.chapter + 1, world.difficulty, carry); showScreen(null); persist(); updateHud(); canvas.focus({preventScroll:true}); } });
$('chaptersButton').addEventListener('click', chapters); $('helpButton').addEventListener('click', () => { if (!controlsAccepted || !$('controlsScreen').classList.contains('hidden')) openControls(controlsReturn); else openHelp(); }); $('helpClose').addEventListener('click', closeHelp); $('helpDone').addEventListener('click', closeHelp);
$('soundButton').addEventListener('click', () => { sound.enable(!sound.enabled); $('soundLabel').textContent = sound.enabled ? 'ON' : 'OFF'; $('soundButton').setAttribute('aria-label', sound.enabled ? 'Turn sound off' : 'Turn sound on'); $('soundButton').setAttribute('aria-pressed', String(sound.enabled)); if(sound.enabled) sound.effect('checkpoint'); });
async function largerView(exitOnly = false) {
  const shell=$('gameShell');
  if(document.fullscreenElement) { try { await document.exitFullscreen(); } catch {} }
  else if(shell.classList.contains('expanded') || exitOnly) shell.classList.toggle('expanded',false);
  else { try { if(!shell.requestFullscreen) throw new Error('Use page view'); await shell.requestFullscreen(); } catch { shell.classList.toggle('expanded',true); } }
  syncViewport();
}
function syncViewport() {
  const viewportHeight=window.visualViewport?.height || window.innerHeight || 720;
  document.documentElement.style.setProperty('--viewport-height',`${Math.round(viewportHeight)}px`);
  const mobile=isTouch() && Math.min(window.innerWidth || 1280,window.innerHeight || 720)<=1024;
  document.body.classList.toggle('mobile-device',mobile);
  const shell=$('gameShell'), expanded=!!document.fullscreenElement || shell.classList.contains('expanded');
  const portrait=(window.innerHeight || 720)>(window.innerWidth || 1280), reserve=mobile && portrait && controls.mode==='touch' ? 152 : 0;
  shell.classList.toggle('portrait-touch',reserve>0);
  if(mobile || expanded) {
    const fit=fitPlayfield(shell.clientWidth || window.innerWidth || 1280,shell.clientHeight || viewportHeight-54,reserve);
    $('playfield').style.width=`${fit.width}px`; $('playfield').style.height=`${fit.height}px`;
  } else { $('playfield').style.width='';$('playfield').style.height=''; }
  hide('rotateHint',!mobile || !portrait || world.state!=='playing');
  hide('exitExpanded',!expanded);
  $('fullscreenButton').setAttribute('aria-label',expanded?'Exit larger view':'Enter larger view');
}
$('fullscreenButton').addEventListener('click',()=>largerView());
$('exitExpanded').addEventListener('click',()=>largerView(true));
document.addEventListener('fullscreenchange',syncViewport);
window.addEventListener('resize',syncViewport);
window.visualViewport?.addEventListener('resize',syncViewport);
window.addEventListener('orientationchange',()=>{clearInput();syncViewport();});
canvas.addEventListener('pointerdown', () => canvas.focus({preventScroll:true}));
window.addEventListener('keydown', event => {
  if (!$('controlsScreen').classList.contains('hidden')) {
    if (captureAction) {
      event.preventDefault(); if (event.repeat) return;
      if (event.code === 'Escape') { captureAction = null; renderBindings(); return; }
      const keys = bindKey(draftControls.keys,captureAction,event.code);
      if (keys) { draftControls.keys = keys; captureAction = null; renderBindings(); }
      else $('controlsNote').textContent = 'Choose a letter, number, arrow, Space, Shift, or Ctrl. Escape and P are reserved.';
    }
    return;
  }
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
bindTouchControls([...document.querySelectorAll('[data-control]')],touches,{onGesture:()=>sound.unlock(),allow:()=>world.state==='playing' && controls.mode==='touch',pointerEvents:typeof window.PointerEvent!=='undefined'});
for(const type of ['pointerup','pointercancel']) window.addEventListener(type,event=>{
  touches.release(event.pointerId);for(const b of document.querySelectorAll('[data-control]'))b.classList.toggle('pressed',touches.has(b.dataset.control));
});
if(typeof window.PointerEvent==='undefined') for(const type of ['touchend','touchcancel']) window.addEventListener(type,event=>{
  for(const t of event.changedTouches || []) touches.release(t.identifier);
  for(const b of document.querySelectorAll('[data-control]'))b.classList.toggle('pressed',touches.has(b.dataset.control));
},{passive:true});
for(const type of ['pointerup','touchend','keydown']) document.addEventListener(type,()=>sound.unlock(),{passive:true});
window.addEventListener('pagehide',()=>{clearInput();if(world.state==='playing')world.pause();});
let lastPadPause = false;
function readInput() {
  const pad = controls.mode === 'gamepad' ? Array.from(navigator.getGamepads?.() || []).find(p => p?.connected) : null, a = {};
  for (const action of ['left','right','jump','down','attack','magic']) a[action] = keyboard.has(action) || touches.has(action);
  if (pad) {
    a.left ||= pad.axes[0] < -.25 || pad.buttons[14]?.pressed; a.right ||= pad.axes[0] > .25 || pad.buttons[15]?.pressed;
    a.down ||= pad.axes[1] > .55 || pad.buttons[13]?.pressed; a.jump ||= pad.buttons[0]?.pressed; a.attack ||= pad.buttons[2]?.pressed; a.magic ||= pad.buttons[3]?.pressed;
    const pressed = !!pad.buttons[9]?.pressed; if (pressed && !lastPadPause && $('controlsScreen').classList.contains('hidden') && $('helpScreen').classList.contains('hidden')) { if (world.state === 'menu') start(); else pause(); } lastPadPause = pressed;
  }
  for (const action of ['jump','attack','magic']) { a[`${action}Pressed`] = !!a[action] && !previous[action]; a[`${action}Released`] = !a[action] && !!previous[action]; }
  previous = { ...a }; return a;
}
let last = performance.now(), acc = 0;
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
const assetNames = ['hero','hero-face','grove','grass-terrain','training-dummy','thebes','underworld','satyr','centaur','skeleton','harpy','hydra','hades','amphora','column'];
try {
  await Promise.all(assetNames.map(name => new Promise((resolve,reject) => { const image = new Image(); assets[name] = image; image.onload = resolve; image.onerror = () => reject(new Error(`Unable to load ${name}`)); image.src = `assets/${name}.webp`; })));
  ready = true; $('startButton').disabled = false; $('chaptersButton').disabled = false; $('continueButton').disabled = false; hide('loading');
} catch (error) { $('loading').textContent = 'Artwork could not load. Please refresh to try again.'; console.error(error); }

// Feature-detected tools expose the same controls as the visible interface.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const register = tool => { try { Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(() => {}); } catch {} };
  register({ name:'read_adventure_state', title:'Read adventure state', description:'Read the current chapter, health, magic, collectibles, and boss state.', inputSchema:{type:'object',properties:{},additionalProperties:false}, annotations:{readOnlyHint:true,untrustedContentHint:false}, execute:() => world.snapshot() });
  register({ name:'start_adventure_chapter', title:'Start adventure chapter', description:'Start one of the ten chapters. Restarts current gameplay; uses the selected difficulty.', inputSchema:{type:'object',properties:{chapter:{type:'integer',minimum:1,maximum:10}},required:['chapter'],additionalProperties:false}, annotations:{readOnlyHint:false,untrustedContentHint:false}, execute:input => { if (!ready) throw new Error('Artwork is still loading.'); if (!input || !Number.isInteger(input.chapter) || input.chapter < 1 || input.chapter > 10 || Object.keys(input).some(k => k!=='chapter')) throw new Error('Chapter must be an integer from 1 to 10.'); if (!controlsAccepted) finishControls(); start(input.chapter-1); return world.snapshot(); } });
  register({ name:'pause_adventure',title:'Pause adventure',description:'Pause active gameplay, or resume a paused adventure.',inputSchema:{type:'object',properties:{paused:{type:'boolean'}},required:['paused'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{ if (!input || typeof input.paused !== 'boolean' || Object.keys(input).some(k=>k!=='paused')) throw new Error('paused must be a boolean.'); if(input.paused) world.pause();else world.resume();return world.snapshot(); } });
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}

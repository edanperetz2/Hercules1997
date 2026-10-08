export const ACTIONS = ['left', 'right', 'jump', 'attack', 'magic', 'down'];
export const ACTION_LABELS = { left:'Move left', right:'Move right', jump:'Jump / double jump', attack:'Sword / charged strike', magic:'Gift of the gods', down:'Ground slam' };
export const PRESETS = {
  modern: { name:'WASD + J / K', keys:{left:'KeyA',right:'KeyD',jump:'Space',attack:'KeyJ',magic:'KeyK',down:'KeyS'} },
  classic: { name:'Arrow keys + X / C', keys:{left:'ArrowLeft',right:'ArrowRight',jump:'KeyZ',attack:'KeyX',magic:'KeyC',down:'ArrowDown'} },
};
export function keyLabel(code) { return ({ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',Space:'SPACE',ShiftLeft:'L SHIFT',ShiftRight:'R SHIFT',ControlLeft:'L CTRL',ControlRight:'R CTRL'})[code] || code.replace(/^Key|^Digit|^Numpad/, '').toUpperCase(); }
export function usableKey(code) { return /^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Space|Shift(Left|Right)|Control(Left|Right)|Numpad[0-9])$/.test(code) && code !== 'KeyP'; }
export function validKeys(keys) { return keys && ACTIONS.every(a=>usableKey(keys[a] || '')) && new Set(ACTIONS.map(a=>keys[a])).size === ACTIONS.length; }
export function readPreferences(raw, touch = false) {
  const mode = ['modern','classic','custom','touch','gamepad'].includes(raw?.mode) ? raw.mode : touch ? 'touch' : 'modern';
  const keys = mode === 'classic' ? PRESETS.classic.keys : mode === 'custom' && validKeys(raw?.keys) ? raw.keys : PRESETS.modern.keys;
  return {mode, keys:{...keys}};
}
export function bindKey(keys, action, code) {
  if (!ACTIONS.includes(action) || !usableKey(code)) return null;
  const next = {...keys}, other = ACTIONS.find(a=>a !== action && next[a] === code);
  if (other) next[other] = next[action];
  next[action] = code; return next;
}
export function actionMap(keys) { return Object.fromEntries(ACTIONS.map(action=>[keys[action],action])); }

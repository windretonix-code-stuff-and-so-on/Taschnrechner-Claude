// Mouse + keyboard input, both driving the exact same state transitions
// (state.js) so calculator behavior can never diverge between the two. `C`
// (click or Escape) is handled with top priority and bypasses nothing —
// it is just always a plain clear() call, valid in every state.

import { appendChar, backspace, calculate, clear, negate } from './state.js';

const CHAR_CONTROL_MAP = {
  plus: '+',
  minus: '-',
  multiply: '×',
  divide: '÷',
  lparen: '(',
  rparen: ')',
  decimal: ',',
};

const KEYBOARD_MAP = {
  '+': 'plus',
  '-': 'minus',
  '*': 'multiply',
  '/': 'divide',
  '(': 'lparen',
  ')': 'rparen',
  ',': 'decimal',
  '.': 'decimal',
  Enter: 'equals',
  Backspace: 'backspace',
  Escape: 'clear',
};

function applyAction(state, key) {
  if (key === 'clear') return clear(state);
  if (key === 'equals') return calculate(state);
  if (key === 'backspace') return backspace(state);
  if (key === 'negate') return negate(state);
  if (key.startsWith('digit-')) return appendChar(state, key.slice('digit-'.length));
  if (CHAR_CONTROL_MAP[key]) return appendChar(state, CHAR_CONTROL_MAP[key]);
  return state;
}

export function createInputController({ rootEl, getState, setState }) {
  function dispatch(key) {
    setState(applyAction(getState(), key));
  }

  function pulse(key) {
    const el = rootEl.querySelector(`[data-key="${key}"]`);
    if (!el) return;
    el.classList.add('is-pressed');
    window.setTimeout(() => el.classList.remove('is-pressed'), 150);
  }

  function handleClick(event) {
    const sphereEl = event.target.closest('.sphere');
    if (!sphereEl || !rootEl.contains(sphereEl)) return;
    dispatch(sphereEl.dataset.key);
  }

  function keyToAction(event) {
    if (event.key >= '0' && event.key <= '9') return `digit-${event.key}`;
    return KEYBOARD_MAP[event.key] ?? null;
  }

  function handleKeydown(event) {
    const key = keyToAction(event);
    if (!key) return;
    event.preventDefault();
    dispatch(key);
    pulse(key);
  }

  rootEl.addEventListener('click', handleClick);
  window.addEventListener('keydown', handleKeydown);

  return {
    destroy() {
      rootEl.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeydown);
    },
  };
}

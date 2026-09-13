// Renders the 9-character visible window into the display element inside
// the main orb. Operators/parentheses get purely optical CSS padding that
// does NOT count toward the 9-character limit (brief). Smoke-based
// dissolve/rematerialize motion for displaced characters is layered on top
// in feature/animation-particles — this module owns the correct windowed
// text/DOM, independent of any animation.

const VISIBLE_LIMIT = 9;
// Includes both the U+2212 minus sign (button label) and the plain ASCII
// hyphen-minus (what inputController.js/state.js actually store in the
// expression for subtraction and for negate()'s "(-N)" wrapping) — found
// during the correctness review: only the Unicode sign was listed here,
// so the subtract/negate operator was silently missing its required
// optical padding.
const PADDED_CHARS = new Set(['+', '-', '−', '×', '÷', '(', ')']);

export function visibleWindow(text, limit = VISIBLE_LIMIT) {
  return text.length <= limit ? text : text.slice(text.length - limit);
}

export function isPaddedChar(ch) {
  return PADDED_CHARS.has(ch);
}

export function renderDisplay(displayEl, text) {
  displayEl.innerHTML = '';
  for (const ch of visibleWindow(text)) {
    const span = document.createElement('span');
    span.className = `char${isPaddedChar(ch) ? ' char--padded' : ''}`;
    span.textContent = ch;
    displayEl.appendChild(span);
  }
}

// What should currently be shown, given calculation state (state.js).
// Error mode intentionally renders empty text here — the wizard sequence
// (feature/animation-particles) owns the orb's content while an error is
// being shown.
export function textForState(state) {
  if (state.mode === 'result') return state.result ?? '';
  if (state.mode === 'error') return '';
  return state.expression;
}

// Calculation/expression state as pure, DOM-free transitions. Kept
// independent of animation state (PLAN.md) so the UI remains recoverable
// even if an animation is interrupted. inputController.js (later branch)
// wires DOM/keyboard events to these functions.

import { tokenize, TokenizeError } from './tokenizer.js';
import { parse, ParseError } from './parser.js';
import { evaluate, DivisionByZeroError } from './evaluator.js';
import { formatNumber } from './formatter.js';

const DIGITS = '0123456789';
const OPERATORS = '+-×÷';
const DECIMAL_SEPARATORS = ',.';

export function createState() {
  return {
    expression: '',
    result: null, // formatted display string of the last result, while mode === 'result'
    resultRaw: null, // raw numeric value of the last result, for continuation
    mode: 'idle', // 'idle' | 'result' | 'error'
    errorType: null, // 'division-by-zero' | 'other' | null
  };
}

function lastChar(expression) {
  return expression.length > 0 ? expression[expression.length - 1] : '';
}

function isDigit(ch) {
  return DIGITS.includes(ch);
}

function isOperator(ch) {
  return OPERATORS.includes(ch);
}

function isDecimalSeparator(ch) {
  return DECIMAL_SEPARATORS.includes(ch);
}

// Length of the open-paren run at the very end of the expression, e.g.
// "3×((" -> 2. Used to reason about "operator/paren just opened" contexts.
function trailingOpenParenCount(expression) {
  let count = 0;
  for (let i = expression.length - 1; i >= 0 && expression[i] === '('; i -= 1) {
    count += 1;
  }
  return count;
}

// Whether the current (rightmost, still-being-typed) number segment already
// contains a decimal separator.
function currentNumberHasSeparator(expression) {
  let i = expression.length - 1;
  while (i >= 0 && (isDigit(expression[i]) || isDecimalSeparator(expression[i]))) {
    if (isDecimalSeparator(expression[i])) {
      return true;
    }
    i -= 1;
  }
  return false;
}

function openParenBalance(expression) {
  let balance = 0;
  for (const ch of expression) {
    if (ch === '(') balance += 1;
    if (ch === ')') balance -= 1;
  }
  return balance;
}

export function canAppendChar(expression, ch) {
  const last = lastChar(expression);

  if (isDigit(ch)) {
    return true;
  }

  if (isDecimalSeparator(ch)) {
    if (last === '' || isOperator(last) || last === '(') return true; // ",5" style start is tolerated
    return !currentNumberHasSeparator(expression);
  }

  if (isOperator(ch)) {
    if (last === '') return false; // no leading binary operator (negation goes through the dedicated control)
    if (isOperator(last) || last === '(') return false;
    return true;
  }

  if (ch === '(') {
    if (last === '' || isOperator(last) || last === '(') return true;
    return false; // directly after a digit/decimal/')' -> would be implicit multiplication
  }

  if (ch === ')') {
    if (openParenBalance(expression) <= 0) return false;
    if (last === '' || isOperator(last) || last === '(') return false;
    return true;
  }

  return false;
}

export function appendChar(state, ch) {
  if (state.mode === 'result') {
    if (isDigit(ch) || ch === '(') {
      const fresh = createState();
      return appendChar(fresh, ch);
    }
    if (isOperator(ch)) {
      const continued = { ...createState(), expression: state.resultRaw ?? '' };
      return appendChar(continued, ch);
    }
    if (isDecimalSeparator(ch) || ch === ')') {
      return state; // no sensible continuation, ignore
    }
  }

  if (state.mode === 'error') {
    // any input after an error simply starts fresh, per the "C works at any
    // time" spirit — non-C input implicitly clears the stale error state.
    return appendChar(createState(), ch);
  }

  if (!canAppendChar(state.expression, ch)) {
    return state;
  }

  return { ...state, expression: state.expression + ch, mode: 'idle', errorType: null };
}

export function backspace(state) {
  if (state.mode === 'result' || state.mode === 'error') {
    return createState();
  }
  if (state.expression.length === 0) {
    return state;
  }
  return { ...state, expression: state.expression.slice(0, -1) };
}

export function clear(_state) {
  return createState();
}

// Toggles the sign of the trailing number (which may itself already be a
// parenthesized negative group) at the end of the expression, e.g.
// "25+12" -> "25+(-12)" -> "25+12".
export function negate(state) {
  if (state.mode !== 'idle') {
    return state;
  }
  const expr = state.expression;

  // Case 1: trailing "(-NUMBER)" -> strip back down to "NUMBER".
  const negMatch = expr.match(/\(-(\d+(?:[.,]\d+)?)\)$/);
  if (negMatch) {
    const withoutWrapper = expr.slice(0, expr.length - negMatch[0].length) + negMatch[1];
    return { ...state, expression: withoutWrapper };
  }

  // Case 2: trailing plain "NUMBER" -> wrap as "(-NUMBER)".
  const numMatch = expr.match(/(\d+(?:[.,]\d+)?)$/);
  if (numMatch) {
    const withoutNumber = expr.slice(0, expr.length - numMatch[0].length) + `(-${numMatch[1]})`;
    return { ...state, expression: withoutNumber };
  }

  return state;
}

function classifyError(err) {
  if (err instanceof DivisionByZeroError) return 'division-by-zero';
  if (err instanceof TokenizeError || err instanceof ParseError) return 'other';
  throw err;
}

// Repeated `=` on an already-produced result is a no-op (idempotent, no
// repeated animation) — the caller (animationController) decides whether to
// play the result/error sequence based on whether the mode actually changed.
export function calculate(state) {
  if (state.mode === 'result' || state.mode === 'error') {
    return state;
  }
  if (state.expression.trim() === '') {
    return state;
  }

  try {
    const tokens = tokenize(state.expression);
    const ast = parse(tokens);
    const raw = evaluate(ast);
    const formatted = formatNumber(raw);
    return {
      ...state,
      mode: 'result',
      result: formatted,
      resultRaw: formatted.replace(',', '.'),
      errorType: null,
    };
  } catch (err) {
    return {
      ...state,
      mode: 'error',
      result: null,
      resultRaw: null,
      errorType: classifyError(err),
    };
  }
}

import { assertEqual } from './assert.js';
import { createState, appendChar, calculate, clear, negate, backspace, canAppendChar } from '../js/state.js';

function typeAll(state, chars) {
  let s = state;
  for (const ch of chars) {
    s = appendChar(s, ch);
  }
  return s;
}

export const tests = [
  {
    name: 'idle state starts empty (no leading 0)',
    fn: () => assertEqual(createState().expression, ''),
  },
  {
    name: 'prevents a leading binary operator',
    fn: () => assertEqual(canAppendChar('', '+'), false),
  },
  {
    name: 'prevents two operators in a row',
    fn: () => assertEqual(canAppendChar('5+', '×'), false),
  },
  {
    name: 'prevents implicit multiplication: digit directly before (',
    fn: () => assertEqual(canAppendChar('2', '('), false),
  },
  {
    name: 'allows an operator directly before ( (explicit ×()',
    fn: () => assertEqual(canAppendChar('2×', '('), true),
  },
  {
    name: 'allows an incomplete-but-extendable expression like (25+',
    fn: () => {
      const s = typeAll(createState(), '(25+');
      assertEqual(s.expression, '(25+');
    },
  },
  {
    name: 'negate wraps a trailing number: 25+12 -> 25+(-12)',
    fn: () => {
      const s = typeAll(createState(), '25+12');
      assertEqual(negate(s).expression, '25+(-12)');
    },
  },
  {
    name: 'negate is reversible',
    fn: () => {
      const s = typeAll(createState(), '25+12');
      assertEqual(negate(negate(s)).expression, s.expression);
    },
  },
  {
    name: 'operator after a result continues from the result',
    fn: () => {
      let s = typeAll(createState(), '2+2');
      s = calculate(s);
      assertEqual(s.result, '4');
      s = appendChar(s, '+');
      assertEqual(s.expression, '4+');
      assertEqual(s.mode, 'idle');
    },
  },
  {
    name: 'digit after a result starts a brand new expression',
    fn: () => {
      let s = typeAll(createState(), '2+2');
      s = calculate(s);
      s = appendChar(s, '9');
      assertEqual(s.expression, '9');
    },
  },
  {
    name: 'repeated = is idempotent (no state change on second call)',
    fn: () => {
      let s = typeAll(createState(), '2+2');
      const once = calculate(s);
      const twice = calculate(once);
      assertEqual(twice, once);
    },
  },
  {
    name: 'division by zero sets error mode without throwing',
    fn: () => {
      const s = calculate(typeAll(createState(), '5÷0'));
      assertEqual(s.mode, 'error');
      assertEqual(s.errorType, 'division-by-zero');
    },
  },
  {
    name: 'C (clear) resets to idle at any mode',
    fn: () => {
      const afterError = calculate(typeAll(createState(), '5÷0'));
      assertEqual(clear(afterError).mode, 'idle');
      assertEqual(clear(afterError).expression, '');
    },
  },
  {
    name: 'backspace removes the last character',
    fn: () => {
      const s = typeAll(createState(), '12+3');
      assertEqual(backspace(s).expression, '12+');
    },
  },
];

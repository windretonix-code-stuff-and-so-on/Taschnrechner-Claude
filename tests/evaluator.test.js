import { assertEqual, assertThrows } from './assert.js';
import { tokenize } from '../js/tokenizer.js';
import { parse } from '../js/parser.js';
import { evaluate, DivisionByZeroError } from '../js/evaluator.js';

function evalStr(str) {
  return evaluate(parse(tokenize(str)));
}

export const tests = [
  {
    name: 'direct division by zero throws DivisionByZeroError',
    fn: () => {
      let caught = null;
      try {
        evalStr('5÷0');
      } catch (err) {
        caught = err;
      }
      if (!(caught instanceof DivisionByZeroError)) {
        throw new Error('expected DivisionByZeroError');
      }
    },
  },
  {
    name: 'indirect division by zero (via sub-expression) also throws',
    fn: () => {
      assertThrows(() => evalStr('5÷(3-3)'));
    },
  },
  {
    name: 'basic arithmetic is correct',
    fn: () => {
      assertEqual(evalStr('2+2'), 4);
      assertEqual(evalStr('10÷2'), 5);
    },
  },
];

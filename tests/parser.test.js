import { assertEqual, assertThrows } from './assert.js';
import { tokenize } from '../js/tokenizer.js';
import { parse, ParseError } from '../js/parser.js';
import { evaluate } from '../js/evaluator.js';

function evalStr(str) {
  return evaluate(parse(tokenize(str)));
}

export const tests = [
  {
    name: 'respects multiplication/division over addition/subtraction',
    fn: () => assertEqual(evalStr('2+3×4'), 14),
  },
  {
    name: 'respects parentheses over precedence',
    fn: () => assertEqual(evalStr('(2+3)×4'), 20),
  },
  {
    name: 'handles nested parentheses',
    fn: () => assertEqual(evalStr('((1+2)×(3+4))'), 21),
  },
  {
    name: 'handles unary minus / negative numbers via (-N)',
    fn: () => assertEqual(evalStr('25+(-12)'), 13),
  },
  {
    name: 'left-to-right for same-precedence operators',
    fn: () => assertEqual(evalStr('10-2-3'), 5),
  },
  {
    name: 'rejects an incomplete expression',
    fn: () => assertThrows(() => evalStr('(25+'), 'incomplete expr should throw'),
  },
  {
    name: 'rejects an empty expression',
    fn: () => assertThrows(() => parse(tokenize('')), 'empty expr should throw'),
  },
  {
    name: 'ParseError is exported',
    fn: () => assertEqual(typeof ParseError, 'function'),
  },
];

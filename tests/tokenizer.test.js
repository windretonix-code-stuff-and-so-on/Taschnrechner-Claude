import { assertEqual, assertThrows } from './assert.js';
import { tokenize, TokenType, TokenizeError } from '../js/tokenizer.js';

export const tests = [
  {
    name: 'tokenizes a simple sum',
    fn: () => {
      const tokens = tokenize('12+3');
      assertEqual(tokens.length, 3);
      assertEqual(tokens[0].type, TokenType.NUMBER);
      assertEqual(tokens[0].value, 12);
      assertEqual(tokens[1].type, TokenType.PLUS);
      assertEqual(tokens[2].value, 3);
    },
  },
  {
    name: 'accepts comma as decimal separator and normalizes to a number',
    fn: () => {
      const tokens = tokenize('1,5+2');
      assertEqual(tokens[0].value, 1.5);
    },
  },
  {
    name: 'accepts × and ÷ as well as * and /',
    fn: () => {
      assertEqual(tokenize('2×3')[1].type, TokenType.MUL);
      assertEqual(tokenize('2*3')[1].type, TokenType.MUL);
      assertEqual(tokenize('2÷3')[1].type, TokenType.DIV);
      assertEqual(tokenize('2/3')[1].type, TokenType.DIV);
    },
  },
  {
    name: 'tokenizes nested parentheses',
    fn: () => {
      const tokens = tokenize('((1+2))');
      assertEqual(tokens.length, 7);
      assertEqual(tokens[0].type, TokenType.LPAREN);
      assertEqual(tokens[1].type, TokenType.LPAREN);
    },
  },
  {
    name: 'rejects a second decimal separator in one number',
    fn: () => {
      assertThrows(() => tokenize('1,2,3'), 'double separator');
    },
  },
  {
    name: 'rejects unknown characters',
    fn: () => {
      assertThrows(() => tokenize('5#3'));
    },
  },
  {
    name: 'TokenizeError is exported',
    fn: () => {
      assertEqual(typeof TokenizeError, 'function');
    },
  },
];

// AST -> numeric result. No eval()/Function()/external math library — plain
// recursive tree-walking. Division by zero (direct or indirect, e.g. via a
// sub-expression that evaluates to zero) raises DivisionByZeroError so the
// UI layer can trigger the wizard error sequence instead of showing
// Infinity/NaN.

import { TokenType } from './tokenizer.js';

export class DivisionByZeroError extends Error {
  constructor() {
    super('Division durch Null');
  }
}

export function evaluate(node) {
  switch (node.type) {
    case 'Number':
      return node.value;
    case 'UnaryMinus':
      return -evaluate(node.value);
    case 'BinaryOp': {
      const left = evaluate(node.left);
      const right = evaluate(node.right);
      switch (node.op) {
        case TokenType.PLUS:
          return left + right;
        case TokenType.MINUS:
          return left - right;
        case TokenType.MUL:
          return left * right;
        case TokenType.DIV:
          if (right === 0) {
            throw new DivisionByZeroError();
          }
          return left / right;
        default:
          throw new Error(`Unbekannter Operator ${node.op}`);
      }
    }
    default:
      throw new Error(`Unbekannter Knotentyp ${node.type}`);
  }
}

// Token stream -> AST, recursive descent.
//
// Grammar (standard precedence: parens > unary minus > mul/div > add/sub):
//   expression := term (('+' | '-') term)*
//   term       := unary (('*' | '/') unary)*
//   unary      := '-' unary | primary
//   primary    := NUMBER | '(' expression ')'

import { TokenType } from './tokenizer.js';

export class ParseError extends Error {}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }

  next() {
    return this.tokens[this.pos++];
  }

  expect(type) {
    const token = this.peek();
    if (!token || token.type !== type) {
      throw new ParseError(`Erwartet ${type}, gefunden ${token ? token.type : 'Ende'}`);
    }
    return this.next();
  }

  parseExpression() {
    let node = this.parseTerm();
    while (this.peek() && (this.peek().type === TokenType.PLUS || this.peek().type === TokenType.MINUS)) {
      const op = this.next().type;
      const right = this.parseTerm();
      node = { type: 'BinaryOp', op, left: node, right };
    }
    return node;
  }

  parseTerm() {
    let node = this.parseUnary();
    while (this.peek() && (this.peek().type === TokenType.MUL || this.peek().type === TokenType.DIV)) {
      const op = this.next().type;
      const right = this.parseUnary();
      node = { type: 'BinaryOp', op, left: node, right };
    }
    return node;
  }

  parseUnary() {
    if (this.peek() && this.peek().type === TokenType.MINUS) {
      this.next();
      return { type: 'UnaryMinus', value: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.peek();
    if (!token) {
      throw new ParseError('Unerwartetes Ende des Ausdrucks');
    }
    if (token.type === TokenType.NUMBER) {
      this.next();
      return { type: 'Number', value: token.value };
    }
    if (token.type === TokenType.LPAREN) {
      this.next();
      const node = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return node;
    }
    throw new ParseError(`Unerwartetes Token ${token.type}`);
  }
}

export function parse(tokens) {
  const parser = new Parser(tokens);
  if (tokens.length === 0) {
    throw new ParseError('Leerer Ausdruck');
  }
  const ast = parser.parseExpression();
  if (parser.pos !== tokens.length) {
    throw new ParseError(`Unerwartetes Token nach Ausdrucksende: ${parser.peek().type}`);
  }
  return ast;
}

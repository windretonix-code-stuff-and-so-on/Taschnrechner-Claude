// Expression string -> token stream.
// Accepts both `×`/`÷` (canonical, produced by the calculator's own
// operator spheres) and `*`/`/` (convenience aliases, e.g. for tests/
// keyboard input) — both normalize to the same MUL/DIV token type.
// Decimal separator accepts both `,` (UI) and `.` (internal/tests).

export const TokenType = Object.freeze({
  NUMBER: 'NUMBER',
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  MUL: 'MUL',
  DIV: 'DIV',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
});

export class TokenizeError extends Error {}

const SIMPLE_TOKENS = {
  '+': TokenType.PLUS,
  '-': TokenType.MINUS,
  '−': TokenType.MINUS, // U+2212 minus sign
  '×': TokenType.MUL, // ×
  '*': TokenType.MUL,
  '÷': TokenType.DIV, // ÷
  '/': TokenType.DIV,
  '(': TokenType.LPAREN,
  ')': TokenType.RPAREN,
};

function isDigit(ch) {
  return ch >= '0' && ch <= '9';
}

export function tokenize(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (isDigit(ch) || ch === '.' || ch === ',') {
      let start = i;
      let sawSeparator = false;
      let raw = '';
      while (i < input.length && (isDigit(input[i]) || input[i] === '.' || input[i] === ',')) {
        if (input[i] === '.' || input[i] === ',') {
          if (sawSeparator) {
            throw new TokenizeError(`Unerwartetes zweites Dezimaltrennzeichen an Position ${i}`);
          }
          sawSeparator = true;
          raw += '.';
        } else {
          raw += input[i];
        }
        i += 1;
      }
      if (raw === '.' || raw === '') {
        throw new TokenizeError(`Ungültige Zahl an Position ${start}`);
      }
      tokens.push({ type: TokenType.NUMBER, value: Number(raw), raw });
      continue;
    }

    const simple = SIMPLE_TOKENS[ch];
    if (simple) {
      tokens.push({ type: simple, raw: ch });
      i += 1;
      continue;
    }

    throw new TokenizeError(`Unbekanntes Zeichen "${ch}" an Position ${i}`);
  }

  return tokens;
}

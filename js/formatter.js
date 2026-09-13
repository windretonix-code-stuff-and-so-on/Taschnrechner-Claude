// Numeric result -> display string. Normalizes binary floating-point
// artifacts (0.1+0.2 -> 0.3) and renders the decimal separator as a comma.
// Kept isolated so the underlying arithmetic (native JS numbers in V1)
// could later be swapped for a decimal arithmetic library without
// touching tokenizer/parser/evaluator/UI code.

const EPSILON_DECIMALS = 12;

export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    throw new Error('formatNumber() erwartet einen endlichen Wert (Division durch Null muss vorher abgefangen werden)');
  }

  let rounded = Number(value.toFixed(EPSILON_DECIMALS));
  // avoid a displayed "-0"
  if (rounded === 0) {
    rounded = 0;
  }

  let str = rounded.toString();
  if (str.includes('e') || str.includes('E')) {
    str = rounded.toFixed(EPSILON_DECIMALS).replace(/0+$/, '').replace(/\.$/, '');
  }

  return str.replace('.', ',');
}

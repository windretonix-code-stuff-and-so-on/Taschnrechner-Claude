export function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertThrows(fn, message = '') {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`${message} expected function to throw`);
}

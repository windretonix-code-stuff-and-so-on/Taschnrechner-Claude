import { assertEqual } from './assert.js';
import { formatNumber } from '../js/formatter.js';

export const tests = [
  {
    name: 'normalizes classic binary float artifacts',
    fn: () => assertEqual(formatNumber(0.1 + 0.2), '0,3'),
  },
  {
    name: 'renders the decimal separator as a comma',
    fn: () => assertEqual(formatNumber(1.5), '1,5'),
  },
  {
    name: 'renders integers without a trailing separator',
    fn: () => assertEqual(formatNumber(4), '4'),
  },
  {
    name: 'does not display a negative zero',
    fn: () => assertEqual(formatNumber(-0), '0'),
  },
  {
    name: 'does not throw for magnitudes >= 1e21 (Number.toFixed()s hard limit)',
    fn: () => {
      const result = formatNumber(1e21 * 3);
      if (typeof result !== 'string' || result.length === 0) {
        throw new Error('expected a non-empty formatted string, got ' + JSON.stringify(result));
      }
    },
  },
];

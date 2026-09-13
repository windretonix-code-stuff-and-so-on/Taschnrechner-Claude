import { assertEqual } from './assert.js';
import { visibleWindow, textForState, isPaddedChar } from '../js/displayController.js';
import { createState } from '../js/state.js';

export const tests = [
  {
    name: 'shorter-than-limit text is shown in full',
    fn: () => assertEqual(visibleWindow('12+3'), '12+3'),
  },
  {
    name: 'a 10th character displaces the oldest one out of the 9-char window',
    fn: () => assertEqual(visibleWindow('1234567890'), '234567890'),
  },
  {
    name: 'idle state shows the raw expression',
    fn: () => assertEqual(textForState({ ...createState(), expression: '2+2' }), '2+2'),
  },
  {
    name: 'result state shows the formatted result',
    fn: () => assertEqual(textForState({ ...createState(), mode: 'result', result: '4' }), '4'),
  },
  {
    name: 'error state shows no expression text (the wizard sequence owns the orb)',
    fn: () => assertEqual(textForState({ ...createState(), mode: 'error', errorType: 'division-by-zero' }), ''),
  },
  {
    name: 'both minus variants get optical padding (ASCII hyphen is what state.js actually stores)',
    fn: () => {
      assertEqual(isPaddedChar('-'), true);
      assertEqual(isPaddedChar('−'), true);
    },
  },
  {
    name: 'digits and the decimal comma are not padded',
    fn: () => {
      assertEqual(isPaddedChar('5'), false);
      assertEqual(isPaddedChar(','), false);
    },
  },
];

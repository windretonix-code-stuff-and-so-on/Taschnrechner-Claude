import { assertEqual } from './assert.js';
import { createState } from '../js/state.js';

export const tests = [
  {
    name: 'createState returns idle state with empty expression',
    fn: () => {
      const state = createState();
      assertEqual(state.mode, 'idle');
      assertEqual(state.expression, '');
    },
  },
];

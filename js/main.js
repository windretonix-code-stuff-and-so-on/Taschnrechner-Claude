// Orchestration entry point. Wires up state, input, display, animation,
// smoke, audio and layout modules. Filled in across the later PLAN.md
// branches (visual-design, animation-particles, audio-candle).

import { createLayout } from './layout.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  const artifact = document.createElement('div');
  artifact.className = 'artifact';
  app.appendChild(artifact);
  createLayout(artifact);
});

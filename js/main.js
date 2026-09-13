// Orchestration entry point: wires layout (DOM/geometry), state (pure
// calculation logic), input (mouse/keyboard) and display (9-char window)
// together. Animation/particles and audio/candle are layered on in later
// PLAN.md branches without touching this wiring.

import { createLayout } from './layout.js';
import { createInputController } from './inputController.js';
import { createState } from './state.js';
import { renderDisplay, textForState } from './displayController.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  const artifact = document.createElement('div');
  artifact.className = 'artifact';
  app.appendChild(artifact);

  const layout = createLayout(artifact);

  let state = createState();

  function syncDisplay() {
    const displayEl = layout.getDisplayElement();
    if (displayEl) {
      renderDisplay(displayEl, textForState(state));
    }
  }

  createInputController({
    rootEl: artifact,
    getState: () => state,
    setState: (next) => {
      state = next;
      syncDisplay();
    },
  });

  syncDisplay();
  window.addEventListener('resize', syncDisplay);
});

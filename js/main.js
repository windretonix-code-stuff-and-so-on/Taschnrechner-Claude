// Orchestration entry point: wires layout (DOM/geometry), state (pure
// calculation logic), input (mouse/keyboard), display (9-char window),
// smoke (canvas particles) and animation (result/error sequences)
// together. Calculation state stays independent of animation state
// throughout — an interrupted animation never leaves state inconsistent.

import { createLayout } from './layout.js';
import { createInputController } from './inputController.js';
import { createState, clear } from './state.js';
import { renderDisplay, textForState } from './displayController.js';
import { createSmokeRenderer } from './smokeRenderer.js';
import { createAnimationController } from './animationController.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  const artifact = document.createElement('div');
  artifact.className = 'artifact';
  app.appendChild(artifact);

  const layout = createLayout(artifact);

  const smoke = createSmokeRenderer({
    rearCanvas: layout.getRearCanvas(),
    frontCanvas: layout.getFrontCanvas(),
  });
  smoke.start();

  const anim = createAnimationController({
    getDisplayEl: layout.getDisplayElement,
    getWizardEl: layout.getWizardElement,
    getOrbEl: () => artifact.querySelector('.main-orb'),
    smoke,
  });

  let state = createState();

  function applyIdle() {
    const displayEl = layout.getDisplayElement();
    if (displayEl) renderDisplay(displayEl, textForState(state));
    smoke.setHiddenCount(Math.max(0, state.expression.length - 9));
  }

  function setState(next) {
    if (next === state) return; // calculate()/backspace-at-empty etc. no-op
    const prevMode = state.mode;
    const prevText = textForState(state);
    state = next;

    if (state.mode === 'idle') {
      anim.cancel(); // no-op if nothing running; also the `C`/digit priority abort
      applyIdle();
      return;
    }

    if (state.mode === 'result' && prevMode !== 'result') {
      anim.playResult(prevText, state.result ?? '', () => {});
      return;
    }

    if (state.mode === 'error' && prevMode !== 'error') {
      anim.playError(() => setState(clear(state)));
    }
  }

  createInputController({
    rootEl: artifact,
    getState: () => state,
    setState,
  });

  applyIdle();

  window.addEventListener('resize', () => {
    smoke.rebind(layout.getRearCanvas(), layout.getFrontCanvas());
    if (state.mode === 'idle') applyIdle();
  });
});

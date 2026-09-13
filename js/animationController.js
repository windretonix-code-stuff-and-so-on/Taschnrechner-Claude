// Orchestrates the two timed sequences from the brief — result (~1.4s) and
// error/wizard (~3.5s) — as plain setTimeout schedules whose every step
// checks a run token before touching the DOM. cancel() (wired to `C`)
// simply invalidates that token and snaps everything back to idle
// immediately: deterministic, no dangling callbacks can fire late.

import { renderDisplay } from './displayController.js';

const RESULT_DURATION = 1400;
const ERROR_DURATION = 3500;
const LAUGH_COUNT = 3;

export function createAnimationController({ getDisplayEl, getWizardEl, getOrbEl, smoke }) {
  let runId = 0;
  let timeouts = [];
  let running = null; // 'result' | 'error' | null

  function schedule(fn, delay) {
    const id = window.setTimeout(fn, delay);
    timeouts.push(id);
    return id;
  }

  function clearAllTimeouts() {
    for (const id of timeouts) window.clearTimeout(id);
    timeouts = [];
  }

  function hardReset() {
    const displayEl = getDisplayEl();
    const wizardEl = getWizardEl();
    const orbEl = getOrbEl();
    if (displayEl) displayEl.style.opacity = '1';
    if (wizardEl) wizardEl.classList.remove('is-visible', 'is-laughing');
    if (orbEl) orbEl.classList.remove('is-error');
    smoke.setTurbulent(false);
    smoke.setCondensing(false);
  }

  function cancel() {
    runId += 1;
    clearAllTimeouts();
    hardReset();
    running = null;
  }

  function playResult(fromText, toText, onDone) {
    cancel();
    const myRun = runId;
    running = 'result';
    const displayEl = getDisplayEl();

    smoke.burst(14);
    smoke.setCondensing(true);
    if (displayEl) displayEl.style.opacity = '0';

    schedule(() => {
      if (runId !== myRun) return;
      if (displayEl) displayEl.innerHTML = '';
    }, 320);

    schedule(() => {
      if (runId !== myRun) return;
      if (displayEl) {
        renderDisplay(displayEl, toText);
        displayEl.style.opacity = '1';
      }
    }, 900);

    schedule(() => {
      if (runId !== myRun) return;
      smoke.setCondensing(false);
    }, 1150);

    schedule(() => {
      if (runId !== myRun) return;
      running = null;
      onDone?.();
    }, RESULT_DURATION);
  }

  function playError(onDone) {
    cancel();
    const myRun = runId;
    running = 'error';
    const displayEl = getDisplayEl();
    const wizardEl = getWizardEl();
    const orbEl = getOrbEl();

    if (displayEl) {
      displayEl.innerHTML = '';
      displayEl.style.opacity = '0';
    }
    if (orbEl) orbEl.classList.add('is-error');
    smoke.setTurbulent(true);
    smoke.burst(10, { dark: true });

    schedule(() => {
      if (runId !== myRun) return;
      wizardEl?.classList.add('is-visible');
    }, 300);

    const laughGap = (ERROR_DURATION - 900) / LAUGH_COUNT;
    for (let i = 0; i < LAUGH_COUNT; i += 1) {
      const start = 600 + i * laughGap;
      schedule(() => {
        if (runId !== myRun) return;
        wizardEl?.classList.add('is-laughing');
        smoke.burst(4, { dark: true });
      }, start);
      schedule(() => {
        if (runId !== myRun) return;
        wizardEl?.classList.remove('is-laughing');
      }, start + laughGap * 0.55);
    }

    schedule(() => {
      if (runId !== myRun) return;
      wizardEl?.classList.remove('is-visible');
    }, ERROR_DURATION - 400);

    schedule(() => {
      if (runId !== myRun) return;
      smoke.setTurbulent(false);
      orbEl?.classList.remove('is-error');
    }, ERROR_DURATION - 150);

    schedule(() => {
      if (runId !== myRun) return;
      running = null;
      onDone?.();
    }, ERROR_DURATION);
  }

  return { playResult, playError, cancel, isRunning: () => running !== null };
}

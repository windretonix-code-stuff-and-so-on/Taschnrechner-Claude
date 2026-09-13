// Wizard-laugh playback and the mute/unmute (candle) toggle. No external
// audio asset is available in this environment (see ASSETS.md), so the
// laugh is synthesized with the Web Audio API instead: a short, low,
// slightly growling oscillator sweep with a soft envelope and a quiet
// delayed echo (poor man's "spatial reverb as if originating inside the
// orb"). Swapping in a real recorded laugh later only means replacing
// playImpulse()'s body — callers (animationController.js) are unaffected.

import { loadSoundEnabled, saveSoundEnabled } from './storage.js';

export function createAudioController() {
  let ctx = null;
  let enabled = loadSoundEnabled(true);

  function ensureCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = AudioCtx ? new AudioCtx() : null;
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playImpulse() {
    if (!enabled) return;
    const audioCtx = ensureCtx();
    if (!audioCtx) return; // Web Audio unavailable — fail silently, never block the UI

    const now = audioCtx.currentTime;
    const master = audioCtx.createGain();
    master.gain.value = 0.22;
    master.connect(audioCtx.destination);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.22);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(1, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.32);

    // quiet delayed repeat to fake a little spatial reverb
    const echo = audioCtx.createOscillator();
    const echoGain = audioCtx.createGain();
    echo.type = 'sawtooth';
    echo.frequency.setValueAtTime(120, now + 0.09);
    echo.frequency.exponentialRampToValueAtTime(70, now + 0.3);
    echoGain.gain.setValueAtTime(0.0001, now + 0.09);
    echoGain.gain.exponentialRampToValueAtTime(0.35, now + 0.12);
    echoGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    echo.connect(echoGain).connect(master);
    echo.start(now + 0.09);
    echo.stop(now + 0.36);
  }

  return {
    playImpulse,
    isEnabled: () => enabled,
    setEnabled(value) {
      enabled = value;
      saveSoundEnabled(value);
    },
    toggle() {
      enabled = !enabled;
      saveSoundEnabled(enabled);
      return enabled;
    },
  };
}

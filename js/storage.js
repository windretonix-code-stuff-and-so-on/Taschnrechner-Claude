// Persist sound on/off state locally. Filled in on feature/audio-candle.

const KEY = 'magic-orb-calculator:sound-enabled';

export function loadSoundEnabled(defaultValue = true) {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === null ? defaultValue : raw === 'true';
  } catch {
    return defaultValue;
  }
}

export function saveSoundEnabled(enabled) {
  try {
    localStorage.setItem(KEY, String(enabled));
  } catch {
    // storage unavailable (private mode etc.) — non-fatal, in-memory only
  }
}

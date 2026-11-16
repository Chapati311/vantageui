import { getSettings } from './settingsStore';

/**
 * Tiny UI sounds, made on the fly with the Web Audio API (no sound files).
 * They are short and very quiet on purpose: a web app can't tell if the
 * phone is on silent.
 */

export type SoundName = 'unlock' | 'openApp' | 'toggleOn' | 'toggleOff' | 'timerDone';

interface Note {
  /** Pitch in Hz at the start and the end of the note */
  from: number;
  to: number;
  /** Seconds after the sound starts */
  at: number;
  /** Length in seconds */
  length: number;
}

const VOLUME = 0.05;

const SOUNDS: Record<SoundName, Note[]> = {
  unlock: [
    { from: 660, to: 660, at: 0, length: 0.09 },
    { from: 990, to: 990, at: 0.07, length: 0.12 },
  ],
  openApp: [{ from: 520, to: 780, at: 0, length: 0.1 }],
  toggleOn: [{ from: 880, to: 880, at: 0, length: 0.05 }],
  toggleOff: [{ from: 590, to: 590, at: 0, length: 0.05 }],
  // A gentle two-tone chime, played three times
  timerDone: [0, 0.6, 1.2].flatMap((at) => [
    { from: 880, to: 880, at, length: 0.14 },
    { from: 1175, to: 1175, at: at + 0.16, length: 0.22 },
  ]),
};

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (!context) {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

export function playSound(name: SoundName): void {
  if (!getSettings().soundsEnabled) return;
  const audio = getContext();
  if (!audio) return;

  for (const note of SOUNDS[name]) {
    const start = audio.currentTime + note.at;
    const end = start + note.length;

    const oscillator = audio.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note.from, start);
    oscillator.frequency.linearRampToValueAtTime(note.to, end);

    // Quick fade in and out so there is no click
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(VOLUME, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }
}

/**
 * Browsers only allow sound after the user has touched the screen.
 * This wakes the audio engine up on the first touch. Call once at startup.
 */
export function initSounds(): void {
  const wake = () => {
    if (getSettings().soundsEnabled) getContext();
  };
  document.addEventListener('touchend', wake, { once: true });
  document.addEventListener('pointerup', wake, { once: true });
}

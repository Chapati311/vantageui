import { getSettings, type SoundPack } from './settingsStore';

/**
 * Tiny UI sounds, made on the fly with the Web Audio API (no sound files).
 * They are short and very quiet on purpose: a web app can't tell if the
 * phone is on silent.
 */

export type SoundName = 'unlock' | 'openApp' | 'toggleOn' | 'toggleOff' | 'tick' | 'timerDone';

interface Note {
  /** Pitch in Hz at the start and the end of the note */
  from: number;
  to: number;
  /** Seconds after the sound starts */
  at: number;
  /** Length in seconds */
  length: number;
}

/** Loudest a sound gets, at the "Sound volume" setting of 100%. Kept quiet on purpose. */
const MAX_VOLUME = 0.1;

const SOUNDS: Record<SoundName, Note[]> = {
  unlock: [
    { from: 660, to: 660, at: 0, length: 0.09 },
    { from: 990, to: 990, at: 0.07, length: 0.12 },
  ],
  openApp: [{ from: 520, to: 780, at: 0, length: 0.1 }],
  toggleOn: [{ from: 880, to: 880, at: 0, length: 0.05 }],
  toggleOff: [{ from: 590, to: 590, at: 0, length: 0.05 }],
  // A very short click: a dial or scroll wheel passing one step
  tick: [{ from: 1400, to: 1400, at: 0, length: 0.015 }],
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

/**
 * The sound packs: the same little melodies, played differently.
 * soft = round sine tones; glass = brighter and ringing longer; keys = a
 * mechanical click with a low thock; retro = old-phone square-wave bleeps.
 */
const PACKS: Record<Exclude<SoundPack, 'auto'>, { wave: OscillatorType; pitch: number; length: number; click?: boolean }> = {
  soft: { wave: 'sine', pitch: 1, length: 1 },
  glass: { wave: 'triangle', pitch: 1.5, length: 2.2 },
  keys: { wave: 'square', pitch: 0.35, length: 0.6, click: true },
  retro: { wave: 'square', pitch: 1, length: 1 },
};

let noise: AudioBuffer | null = null;
/** A very short burst of noise: the "click" of a key. */
function click(audio: AudioContext, at: number, volume: number): void {
  if (!noise) {
    noise = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.02), audio.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
  }
  const source = audio.createBufferSource();
  source.buffer = noise;
  const gain = audio.createGain();
  gain.gain.value = volume * 1.6;
  source.connect(gain).connect(audio.destination);
  source.start(at);
}

export function playSound(name: SoundName): void {
  const { soundsEnabled, soundVolume, soundPack } = getSettings();
  const volume = MAX_VOLUME * soundVolume;
  if (!soundsEnabled || volume < 0.001) return;
  const audio = getContext();
  if (!audio) return;
  // "auto": retro themes bleep like an old phone, modern ones are soft
  const pack = PACKS[soundPack === 'auto' ? (document.documentElement.dataset.retro ? 'retro' : 'soft') : soundPack];

  for (const note of SOUNDS[name]) {
    const start = audio.currentTime + note.at;
    const end = start + note.length * pack.length;
    if (pack.click) click(audio, start, volume);

    const oscillator = audio.createOscillator();
    oscillator.type = pack.wave;
    oscillator.frequency.setValueAtTime(note.from * pack.pitch, start);
    oscillator.frequency.linearRampToValueAtTime(note.to * pack.pitch, end);

    // Quick fade in and out so there is no click
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
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

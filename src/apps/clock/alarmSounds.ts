import { dbGet, dbPut } from '../../system/db';

/**
 * Alarm sounds, made live with the Web Audio API (no sound files needed),
 * plus your own sound file. Four packs: Synth, Nature, Retro and Calm.
 * A sound loops until stopped. "Gentle wake" fades it in over 30 seconds.
 */

export const ALARM_SOUNDS = [
  { id: 'synth-pulse', pack: 'Synth', name: 'Pulse' },
  { id: 'synth-rise', pack: 'Synth', name: 'Rise' },
  { id: 'nature-rain', pack: 'Nature', name: 'Rain' },
  { id: 'nature-birds', pack: 'Nature', name: 'Birds' },
  { id: 'nature-waves', pack: 'Nature', name: 'Waves' },
  { id: 'retro-beep', pack: 'Retro', name: 'Digital beeps' },
  { id: 'retro-chirp', pack: 'Retro', name: 'Chirp' },
  { id: 'calm-piano', pack: 'Calm', name: 'Piano' },
  { id: 'calm-chimes', pack: 'Calm', name: 'Chimes' },
  { id: 'custom', pack: 'Yours', name: 'Your sound' },
] as const;

export type AlarmSoundId = (typeof ALARM_SOUNDS)[number]['id'];

const CUSTOM_ID = 'alarm-custom-sound';

let context: AudioContext | null = null;
let master: GainNode | null = null;
let loopTimer = 0;
let customAudio: HTMLAudioElement | null = null;
const live = new Set<AudioScheduledSourceNode>();

function audio(): AudioContext | null {
  if (!context) {
    const AudioContextClass =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(frequency: number, at: number, length: number, type: OscillatorType = 'sine', level = 1, glideTo?: number): void {
  if (!context || !master) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(glideTo, at + length);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  oscillator.connect(gain).connect(master);
  oscillator.start(at);
  oscillator.stop(at + length + 0.05);
  live.add(oscillator);
  oscillator.onended = () => live.delete(oscillator);
}

/** Filtered white noise: rain, waves. */
function noise(at: number, length: number, filter: number, level: number, swell = false): void {
  if (!context || !master) return;
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * length), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = filter;
  const gain = context.createGain();
  gain.gain.setValueAtTime(swell ? 0.0001 : level, at);
  if (swell) {
    gain.gain.exponentialRampToValueAtTime(level, at + length * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  }
  source.connect(lowpass).connect(gain).connect(master);
  source.start(at);
  live.add(source);
  source.onended = () => live.delete(source);
}

/** One round of a sound. Returns how long the round lasts (seconds). */
function playRound(id: AlarmSoundId): number {
  const now = context!.currentTime + 0.05;
  switch (id) {
    case 'synth-pulse':
      [0, 0.25, 0.5, 0.75].forEach((t) => tone(880, now + t, 0.15, 'triangle', 0.6));
      return 1.6;
    case 'synth-rise':
      tone(330, now, 1.2, 'sawtooth', 0.25, 990);
      tone(660, now + 0.1, 1.1, 'triangle', 0.3, 1320);
      return 1.8;
    case 'nature-rain':
      noise(now, 3, 1800, 0.35);
      return 2.9;
    case 'nature-birds':
      [0, 0.18, 0.9, 1.05, 1.2].forEach((t, i) => tone(2600 + i * 180, now + t, 0.09, 'sine', 0.35, 3800 + i * 120));
      return 2.4;
    case 'nature-waves':
      noise(now, 4, 700, 0.5, true);
      return 4;
    case 'retro-beep':
      [0, 0.12, 0.24, 0.36].forEach((t) => tone(2048, now + t, 0.07, 'square', 0.25));
      return 1.2;
    case 'retro-chirp':
      tone(1200, now, 0.2, 'square', 0.2, 2400);
      tone(1200, now + 0.3, 0.2, 'square', 0.2, 2400);
      return 1.4;
    case 'calm-piano':
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, now + i * 0.35, 1.6, 'sine', 0.35));
      return 3;
    case 'calm-chimes':
      [1567.98, 1318.51, 1046.5, 1174.66].forEach((f, i) => tone(f, now + i * 0.5, 2.2, 'sine', 0.25));
      return 3.2;
    default:
      return 2;
  }
}

export async function saveCustomSound(file: Blob): Promise<void> {
  await dbPut('files', { id: CUSTOM_ID, blob: file });
}

export async function hasCustomSound(): Promise<boolean> {
  return Boolean(await dbGet('files', CUSTOM_ID).catch(() => undefined));
}

/**
 * Plays a sound on repeat until stopAlarmSound(). `volume` 0-1; `gentle`
 * starts silent and fades in over 30 seconds.
 */
export async function playAlarmSound(id: AlarmSoundId, volume: number, gentle: boolean): Promise<void> {
  stopAlarmSound();
  if (id === 'custom') {
    const file = await dbGet<{ id: string; blob: Blob }>('files', CUSTOM_ID).catch(() => undefined);
    if (file) {
      customAudio = new Audio(URL.createObjectURL(file.blob));
      customAudio.loop = true;
      customAudio.volume = gentle ? 0.05 : volume;
      void customAudio.play().catch(() => undefined);
      if (gentle) {
        const started = Date.now();
        loopTimer = window.setInterval(() => {
          if (customAudio) customAudio.volume = Math.min(volume, 0.05 + ((Date.now() - started) / 30_000) * volume);
        }, 500);
      }
      return;
    }
    id = 'calm-chimes'; // no file saved: a calm fallback
  }
  const ctx = audio();
  if (!ctx) return;
  master = ctx.createGain();
  master.gain.setValueAtTime(gentle ? 0.0001 : volume, ctx.currentTime);
  if (gentle) master.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), ctx.currentTime + 30);
  master.connect(ctx.destination);
  const loop = () => {
    const seconds = playRound(id);
    loopTimer = window.setTimeout(loop, seconds * 1000);
  };
  loop();
}

/** Plays one round only, for choosing a sound. */
export function previewAlarmSound(id: AlarmSoundId, volume: number): void {
  void playAlarmSound(id, volume, false);
  window.setTimeout(stopAlarmSound, 3200);
}

export function stopAlarmSound(): void {
  window.clearTimeout(loopTimer);
  window.clearInterval(loopTimer);
  live.forEach((node) => {
    try {
      node.stop();
    } catch {
      // Already stopped
    }
  });
  live.clear();
  master?.disconnect();
  master = null;
  if (customAudio) {
    customAudio.pause();
    URL.revokeObjectURL(customAudio.src);
    customAudio = null;
  }
}

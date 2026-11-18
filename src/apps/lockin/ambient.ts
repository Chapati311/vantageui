import { useSyncExternalStore } from 'react';

/**
 * Ambient sounds for focusing, made live with Web Audio (no files needed).
 * Two can play at once, each with its own volume.
 */

export const AMBIENT = [
  { id: 'rain', name: 'Rain' },
  { id: 'cafe', name: 'Cafe' },
  { id: 'library', name: 'Library' },
  { id: 'white', name: 'White noise' },
  { id: 'brown', name: 'Brown noise' },
  { id: 'fire', name: 'Fireplace' },
  { id: 'lofi', name: 'Lo-fi' },
] as const;

export type AmbientId = (typeof AMBIENT)[number]['id'];

interface Playing {
  id: AmbientId;
  volume: number;
}

let context: AudioContext | null = null;
const voices = new Map<AmbientId, { gain: GainNode; stop: () => void }>();
let playing: Playing[] = [];
const listeners = new Set<() => void>();

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

/** A looping buffer of noise: white, pink-ish or brown. */
function noiseBuffer(ctx: AudioContext, color: 'white' | 'pink' | 'brown'): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    if (color === 'white') data[i] = white * 0.5;
    else if (color === 'brown') {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else {
      b0 = 0.99765 * b0 + white * 0.099;
      b1 = 0.963 * b1 + white * 0.2965;
      b2 = 0.57 * b2 + white * 1.0526;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
    }
  }
  return buffer;
}

function loopNoise(ctx: AudioContext, out: AudioNode, color: 'white' | 'pink' | 'brown', filter?: { type: BiquadFilterType; frequency: number }): () => void {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, color);
  source.loop = true;
  if (filter) {
    const node = ctx.createBiquadFilter();
    node.type = filter.type;
    node.frequency.value = filter.frequency;
    source.connect(node).connect(out);
  } else source.connect(out);
  source.start();
  return () => source.stop();
}

/** Short random clicks (raindrops, crackles, cups) on top of a bed of noise. */
function sprinkle(ctx: AudioContext, out: AudioNode, everyMs: number, make: (at: number) => void): () => void {
  let timer = 0;
  const schedule = () => {
    make(ctx.currentTime + 0.02);
    timer = window.setTimeout(schedule, everyMs * (0.3 + Math.random() * 1.4));
  };
  schedule();
  return () => window.clearTimeout(timer);
  void out;
}

function click(ctx: AudioContext, out: AudioNode, at: number, frequency: number, level: number, length = 0.02): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(frequency, at);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, at + length);
  gain.gain.setValueAtTime(level, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  oscillator.connect(gain).connect(out);
  oscillator.start(at);
  oscillator.stop(at + length + 0.02);
}

/** A slow, soft chord loop through a muffled filter: lo-fi. */
function lofi(ctx: AudioContext, out: AudioNode): () => void {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.connect(out);
  const chords = [
    [220, 261.63, 329.63, 392],
    [174.61, 220, 261.63, 329.63],
    [196, 246.94, 293.66, 349.23],
    [164.81, 196, 246.94, 293.66],
  ];
  let index = 0;
  let timer = 0;
  const play = () => {
    const now = ctx.currentTime + 0.05;
    for (const frequency of chords[index % chords.length]) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = Math.random() * 12 - 6;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);
      oscillator.connect(gain).connect(filter);
      oscillator.start(now);
      oscillator.stop(now + 4);
    }
    // A soft kick on the first beat
    click(ctx, filter, now, 90, 0.4, 0.25);
    click(ctx, filter, now + 2, 90, 0.3, 0.25);
    index += 1;
    timer = window.setTimeout(play, 4000);
  };
  play();
  const crackle = loopNoise(ctx, out, 'white', { type: 'highpass', frequency: 6000 });
  return () => {
    window.clearTimeout(timer);
    crackle();
  };
}

function startVoice(id: AmbientId, volume: number): void {
  const ctx = audio();
  if (!ctx || voices.has(id)) return;
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), ctx.currentTime + 1.5);
  gain.connect(ctx.destination);
  const stops: (() => void)[] = [];
  switch (id) {
    case 'rain':
      stops.push(loopNoise(ctx, gain, 'pink', { type: 'lowpass', frequency: 2500 }));
      stops.push(sprinkle(ctx, gain, 60, (at) => click(ctx, gain, at, 3000 + Math.random() * 2000, 0.05)));
      break;
    case 'cafe':
      stops.push(loopNoise(ctx, gain, 'brown', { type: 'bandpass', frequency: 500 }));
      stops.push(sprinkle(ctx, gain, 2500, (at) => click(ctx, gain, at, 2200 + Math.random() * 800, 0.08, 0.06)));
      break;
    case 'library':
      stops.push(loopNoise(ctx, gain, 'pink', { type: 'lowpass', frequency: 600 }));
      break;
    case 'white':
      stops.push(loopNoise(ctx, gain, 'white'));
      break;
    case 'brown':
      stops.push(loopNoise(ctx, gain, 'brown'));
      break;
    case 'fire':
      stops.push(loopNoise(ctx, gain, 'brown', { type: 'lowpass', frequency: 400 }));
      stops.push(sprinkle(ctx, gain, 180, (at) => click(ctx, gain, at, 800 + Math.random() * 3000, 0.15 * Math.random(), 0.015)));
      break;
    case 'lofi':
      stops.push(lofi(ctx, gain));
      break;
  }
  voices.set(id, { gain, stop: () => stops.forEach((stop) => stop()) });
}

function stopVoice(id: AmbientId): void {
  const voice = voices.get(id);
  if (!voice || !context) return;
  voice.gain.gain.cancelScheduledValues(context.currentTime);
  voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), context.currentTime);
  voice.gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.8);
  window.setTimeout(() => {
    voice.stop();
    voice.gain.disconnect();
  }, 900);
  voices.delete(id);
}

function notify(next: Playing[]): void {
  playing = next;
  listeners.forEach((listener) => listener());
}

/** Turns a sound on (the oldest stops if two already play) or off. */
export function toggleAmbient(id: AmbientId): void {
  if (playing.some((item) => item.id === id)) {
    stopVoice(id);
    notify(playing.filter((item) => item.id !== id));
    return;
  }
  let next = [...playing, { id, volume: 0.5 }];
  if (next.length > 2) {
    stopVoice(next[0].id);
    next = next.slice(1);
  }
  startVoice(id, 0.5);
  notify(next);
}

export function setAmbientVolume(id: AmbientId, volume: number): void {
  const voice = voices.get(id);
  if (voice && context) voice.gain.gain.setTargetAtTime(Math.max(0.0001, volume), context.currentTime, 0.1);
  notify(playing.map((item) => (item.id === id ? { ...item, volume } : item)));
}

export function stopAllAmbient(): void {
  playing.forEach((item) => stopVoice(item.id));
  notify([]);
}

export function useAmbient(): Playing[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => playing,
  );
}

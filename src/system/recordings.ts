import { useSyncExternalStore } from 'react';
import { dbDelete, dbGetAll, dbPut } from './db';

/**
 * Voice recordings: made with the microphone (MediaRecorder), saved on the
 * phone in IndexedDB. Used by the Voice note widget and the Voice Recorder app.
 */

export interface Recording {
  id: string;
  name: string;
  createdAt: number;
  /** Length in milliseconds */
  duration: number;
  blob: Blob;
}

interface RecorderState {
  recordings: Recording[];
  /** While recording: when it started */
  recordingSince: number | null;
  /** The last problem, in plain words (no microphone, permission denied, ...) */
  error: string | null;
  loaded: boolean;
}

let state: RecorderState = { recordings: [], recordingSince: null, error: null, loaded: false };
const listeners = new Set<() => void>();
let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
/** While recording: listens to the microphone for the live waveform */
let micAnalyser: AnalyserNode | null = null;
let micContext: AudioContext | null = null;

type AudioContextClass = typeof AudioContext;
const AudioCtx = (): AudioContextClass | undefined =>
  window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext;

/** How loud the microphone is right now, 0-1 (0 when not recording). */
export function micLevel(): number {
  if (!micAnalyser) return 0;
  const data = new Uint8Array(micAnalyser.fftSize);
  micAnalyser.getByteTimeDomainData(data);
  let sum = 0;
  for (const sample of data) sum += ((sample - 128) / 128) ** 2;
  return Math.min(1, Math.sqrt(sum / data.length) * 4);
}

function update(patch: Partial<RecorderState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

async function load(): Promise<void> {
  try {
    const all = await dbGetAll<Recording>('recordings');
    update({ recordings: all.sort((a, b) => b.createdAt - a.createdAt), loaded: true });
  } catch {
    update({ loaded: true, error: "Recordings can't be read on this device." });
  }
}

const nameFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Starts recording from the microphone. Asks for permission the first time. */
export async function startRecording(): Promise<void> {
  if (recorder) return;
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    update({ error: "This browser can't record audio." });
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    recorder = new MediaRecorder(stream);
    const startedAt = Date.now();
    recorder.ondataavailable = (event) => event.data.size > 0 && chunks.push(event.data);
    // A second listener on the same microphone, only for the waveform
    try {
      const Ctx = AudioCtx();
      if (Ctx) {
        micContext = new Ctx();
        micAnalyser = micContext.createAnalyser();
        micAnalyser.fftSize = 256;
        micContext.createMediaStreamSource(stream).connect(micAnalyser);
      }
    } catch {
      micAnalyser = null;
    }
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      micAnalyser = null;
      void micContext?.close();
      micContext = null;
      const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/mp4' });
      recorder = null;
      const recording: Recording = {
        id: `rec-${startedAt}`,
        name: `Recording ${nameFormat.format(startedAt)}`,
        createdAt: startedAt,
        duration: Date.now() - startedAt,
        blob,
      };
      update({ recordingSince: null, recordings: [recording, ...state.recordings] });
      try {
        await dbPut('recordings', recording);
      } catch {
        update({ error: "The recording couldn't be saved." });
      }
    };
    recorder.start();
    update({ recordingSince: startedAt, error: null });
  } catch {
    recorder = null;
    update({ error: 'Microphone access was not allowed.' });
  }
}

export function stopRecording(): void {
  if (recorder && recorder.state !== 'inactive') recorder.stop();
}

export async function deleteRecording(id: string): Promise<void> {
  update({ recordings: state.recordings.filter((recording) => recording.id !== id) });
  await dbDelete('recordings', id);
}

export async function renameRecording(id: string, name: string): Promise<void> {
  const recording = state.recordings.find((item) => item.id === id);
  if (!recording) return;
  const renamed = { ...recording, name: name.trim() || recording.name };
  update({ recordings: state.recordings.map((item) => (item.id === id ? renamed : item)) });
  await dbPut('recordings', renamed);
}

/** Writes audio samples as a WAV file (plain 16-bit PCM, plays everywhere). */
function encodeWav(buffer: AudioBuffer): Blob {
  const channels = Math.min(2, buffer.numberOfChannels);
  const rate = buffer.sampleRate;
  const frames = buffer.length;
  const bytes = 44 + frames * channels * 2;
  const view = new DataView(new ArrayBuffer(bytes));
  const text = (offset: number, value: string) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, bytes - 8, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, frames * channels * 2, true);
  const data = [...Array(channels)].map((_, c) => buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < frames; i += 1) {
    for (let c = 0; c < channels; c += 1) {
      const sample = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Keeps only the part from `start` to `end` (seconds) of a recording,
 * saved as a new recording next to the original ("... (trimmed)").
 */
export async function trimRecording(id: string, start: number, end: number): Promise<void> {
  const recording = state.recordings.find((item) => item.id === id);
  const Ctx = AudioCtx();
  if (!recording || !Ctx) throw new Error("This phone can't edit audio.");
  const context = new Ctx();
  try {
    const source = await context.decodeAudioData(await recording.blob.arrayBuffer());
    const from = Math.max(0, Math.floor(start * source.sampleRate));
    const to = Math.min(source.length, Math.floor(end * source.sampleRate));
    if (to - from < source.sampleRate * 0.2) throw new Error('Keep at least a moment of sound.');
    const cut = context.createBuffer(source.numberOfChannels, to - from, source.sampleRate);
    for (let c = 0; c < source.numberOfChannels; c += 1) cut.copyToChannel(source.getChannelData(c).subarray(from, to), c);
    const createdAt = Date.now();
    const trimmed: Recording = {
      id: `rec-${createdAt}`,
      name: `${recording.name} (trimmed)`.slice(0, 48),
      createdAt,
      duration: Math.round(((to - from) / source.sampleRate) * 1000),
      blob: encodeWav(cut),
    };
    update({ recordings: [trimmed, ...state.recordings] });
    await dbPut('recordings', trimmed);
  } finally {
    void context.close();
  }
}

export function useRecorder(): RecorderState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      if (!state.loaded) void load();
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

export function getRecorderState(): RecorderState {
  return state;
}

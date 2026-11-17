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
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
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

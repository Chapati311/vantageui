import { useSyncExternalStore } from 'react';
import { dbDelete, dbGetAll, dbPut } from './db';

/**
 * Plays YOUR OWN music files (added in the Music app, kept on the phone in
 * IndexedDB). One player for the whole OS: the Music app, the now playing
 * widget, the visualizer and the vinyl widget all show the same song.
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  /** Seconds */
  duration: number;
  addedAt: number;
  blob: Blob;
}

interface PlayerState {
  tracks: Track[];
  loaded: boolean;
  currentId: string | null;
  playing: boolean;
  /** Seconds into the current song */
  position: number;
  shuffle: boolean;
  repeat: boolean;
}

let state: PlayerState = { tracks: [], loaded: false, currentId: null, playing: false, position: 0, shuffle: false, repeat: false };
const listeners = new Set<() => void>();
let audio: HTMLAudioElement | null = null;
let objectUrl: string | null = null;
let analyser: AnalyserNode | null = null;
let context: AudioContext | null = null;
let gain: GainNode | null = null;
let musicVolume = 1;

/** Music volume, 0-1 (Vantage's own player; the phone's volume needs the bridge). */
export function setMusicVolume(level: number): void {
  musicVolume = Math.max(0, Math.min(1, level));
  if (gain) gain.gain.value = musicVolume;
  else if (audio) audio.volume = musicVolume;
}

export function getMusicVolume(): number {
  return musicVolume;
}

function update(patch: Partial<PlayerState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

async function load(): Promise<void> {
  try {
    const tracks = await dbGetAll<Track>('tracks');
    update({ tracks: tracks.sort((a, b) => a.title.localeCompare(b.title)), loaded: true });
  } catch {
    update({ loaded: true });
  }
}

function element(): HTMLAudioElement {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = 'metadata';
  audio.addEventListener('timeupdate', () => update({ position: audio?.currentTime ?? 0 }));
  audio.addEventListener('play', () => update({ playing: true }));
  audio.addEventListener('pause', () => update({ playing: false }));
  audio.addEventListener('ended', () => (state.repeat ? void play(state.currentId!) : next()));
  return audio;
}

/** The analyser for visualizers (null until something has played). */
export function getAnalyser(): AnalyserNode | null {
  return analyser;
}

function connectAnalyser(media: HTMLAudioElement): void {
  if (analyser) return;
  try {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    context = new AudioContextClass();
    const source = context.createMediaElementSource(media);
    analyser = context.createAnalyser();
    analyser.fftSize = 64;
    // Volume goes through a gain node: iOS ignores the audio element's own volume
    gain = context.createGain();
    gain.gain.value = musicVolume;
    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(context.destination);
  } catch {
    analyser = null;
  }
}

/** Reads a title and artist from "Artist - Title.mp3". */
function namesFrom(fileName: string): { title: string; artist: string } {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
  const [first, ...rest] = base.split(' - ');
  return rest.length ? { artist: first.trim(), title: rest.join(' - ').trim() } : { artist: 'Unknown artist', title: base.trim() };
}

function durationOf(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const probe = new Audio();
    const url = URL.createObjectURL(blob);
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      resolve(Number.isFinite(probe.duration) ? probe.duration : 0);
      URL.revokeObjectURL(url);
    };
    probe.onerror = () => {
      resolve(0);
      URL.revokeObjectURL(url);
    };
    probe.src = url;
  });
}

/** Adds music files (from the Files picker) to the library. */
export async function addTracks(files: FileList | File[]): Promise<number> {
  let added = 0;
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(file.name)) continue;
    const track: Track = {
      id: `track-${Date.now().toString(36)}-${added}`,
      ...namesFrom(file.name),
      duration: await durationOf(file),
      addedAt: Date.now(),
      blob: file,
    };
    await dbPut('tracks', track);
    added += 1;
    update({ tracks: [...state.tracks, track].sort((a, b) => a.title.localeCompare(b.title)) });
  }
  return added;
}

export async function removeTrack(id: string): Promise<void> {
  if (state.currentId === id) {
    audio?.pause();
    update({ currentId: null, playing: false, position: 0 });
  }
  update({ tracks: state.tracks.filter((track) => track.id !== id) });
  await dbDelete('tracks', id);
}

export async function play(id: string): Promise<void> {
  const track = state.tracks.find((item) => item.id === id);
  if (!track) return;
  const media = element();
  if (state.currentId !== id) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(track.blob);
    media.src = objectUrl;
    update({ currentId: id, position: 0 });
  }
  connectAnalyser(media);
  if (context?.state === 'suspended') await context.resume();
  await media.play().catch(() => update({ playing: false }));
  // Lock screen / control center controls on iOS
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist });
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', previous);
  }
}

export function togglePlay(): void {
  if (!state.currentId) {
    if (state.tracks[0]) void play(state.tracks[0].id);
    return;
  }
  if (state.playing) audio?.pause();
  else void play(state.currentId);
}

function step(direction: 1 | -1): void {
  if (!state.tracks.length) return;
  const index = state.tracks.findIndex((track) => track.id === state.currentId);
  const nextIndex = state.shuffle
    ? Math.floor(Math.random() * state.tracks.length)
    : (index + direction + state.tracks.length) % state.tracks.length;
  void play(state.tracks[nextIndex].id);
}

export function next(): void {
  step(1);
}

export function previous(): void {
  // Like every player: more than 3 seconds in, "previous" restarts the song
  if (audio && audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  step(-1);
}

export function seek(seconds: number): void {
  if (audio) audio.currentTime = seconds;
}

export function setShuffle(on: boolean): void {
  update({ shuffle: on });
}

export function setRepeat(on: boolean): void {
  update({ repeat: on });
}

export function usePlayer(): PlayerState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      if (!state.loaded) void load();
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

export function currentTrack(player: PlayerState): Track | undefined {
  return player.tracks.find((track) => track.id === player.currentId);
}

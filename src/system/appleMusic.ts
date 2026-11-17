import { useSyncExternalStore } from 'react';

/**
 * Apple Music through MusicKit JS (Apple's official web player).
 * MusicKit needs a "developer token" that only an Apple Developer account
 * can make. Paste it in Customise > Music; then sign in with your Apple ID.
 * MusicKit plays music inside Vantage itself (it can't see the Music app).
 */

const TOKEN_KEY = 'vantage.appleMusicToken.v1';
const SCRIPT = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';

interface MusicKitItem {
  title?: string;
  artistName?: string;
  attributes?: { name?: string; artistName?: string; artwork?: { url: string } };
}

interface MusicKitInstance {
  isAuthorized: boolean;
  authorize: () => Promise<string>;
  unauthorize: () => Promise<void>;
  nowPlayingItem?: MusicKitItem;
  isPlaying: boolean;
  play: () => Promise<void>;
  pause: () => void;
  skipToNextItem: () => Promise<void>;
  skipToPreviousItem: () => Promise<void>;
  addEventListener: (name: string, callback: () => void) => void;
}

declare global {
  interface Window {
    MusicKit?: {
      configure: (options: { developerToken: string; app: { name: string; build: string } }) => Promise<MusicKitInstance>;
    };
  }
}

interface AppleMusicState {
  hasToken: boolean;
  signedIn: boolean;
  title: string | null;
  artist: string | null;
  playing: boolean;
  error: string | null;
}

let token = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
})();
let instance: MusicKitInstance | null = null;
let state: AppleMusicState = { hasToken: Boolean(token), signedIn: false, title: null, artist: null, playing: false, error: null };
const listeners = new Set<() => void>();

function update(patch: Partial<AppleMusicState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function readNowPlaying(): void {
  const item = instance?.nowPlayingItem;
  update({
    signedIn: Boolean(instance?.isAuthorized),
    playing: Boolean(instance?.isPlaying),
    title: item?.title ?? item?.attributes?.name ?? null,
    artist: item?.artistName ?? item?.attributes?.artistName ?? null,
  });
}

function loadScript(): Promise<void> {
  if (window.MusicKit) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("MusicKit couldn't be loaded (offline?)."));
    document.head.appendChild(script);
  });
}

async function ensureInstance(): Promise<MusicKitInstance | null> {
  if (instance) return instance;
  if (!token) return null;
  await loadScript();
  // The script sets window.MusicKit a moment after loading
  for (let i = 0; i < 20 && !window.MusicKit; i += 1) await new Promise((r) => setTimeout(r, 100));
  if (!window.MusicKit) throw new Error("MusicKit didn't start.");
  instance = await window.MusicKit.configure({ developerToken: token, app: { name: 'Vantage OS', build: '1.0' } });
  instance.addEventListener('nowPlayingItemDidChange', readNowPlaying);
  instance.addEventListener('playbackStateDidChange', readNowPlaying);
  readNowPlaying();
  return instance;
}

export function setAppleMusicToken(next: string): void {
  token = next.trim();
  instance = null;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Kept until reload.
  }
  update({ hasToken: Boolean(token), signedIn: false, error: null });
}

export async function signInAppleMusic(): Promise<void> {
  try {
    const music = await ensureInstance();
    if (!music) throw new Error('Add a MusicKit developer token first.');
    await music.authorize();
    readNowPlaying();
  } catch (error) {
    update({ error: (error as Error).message });
  }
}

export async function appleMusicControl(action: 'toggle' | 'next' | 'previous'): Promise<void> {
  const music = await ensureInstance().catch(() => null);
  if (!music) return;
  if (action === 'toggle') {
    if (music.isPlaying) music.pause();
    else await music.play().catch(() => undefined);
  } else if (action === 'next') await music.skipToNextItem().catch(() => undefined);
  else await music.skipToPreviousItem().catch(() => undefined);
  readNowPlaying();
}

export function useAppleMusic(): AppleMusicState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      if (token && !instance) void ensureInstance().catch((error: Error) => update({ error: error.message }));
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

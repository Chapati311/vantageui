import { useSyncExternalStore } from 'react';

/**
 * Spotify "now playing" through the official Spotify Web API.
 *
 * Spotify needs an app registration: make one at developer.spotify.com,
 * add this page's address as a Redirect URI, and paste the Client ID in
 * Customise > Music. Sign-in uses PKCE (no secret is stored in Vantage).
 * Play / pause / skip need Spotify Premium; showing the song works for all.
 */

const STORAGE_KEY = 'vantage.spotify.v1';
const VERIFIER_KEY = 'vantage.spotify.verifier';
const SCOPES = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';

interface SavedAuth {
  clientId: string;
  accessToken?: string;
  refreshToken?: string;
  /** When the access token stops working (ms) */
  expiresAt?: number;
}

export interface SpotifyTrack {
  title: string;
  artist: string;
  album: string;
  cover: string | null;
  /** ms */
  progress: number;
  duration: number;
  playing: boolean;
}

interface SpotifyState {
  clientId: string;
  connected: boolean;
  track: SpotifyTrack | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

function loadAuth(): SavedAuth {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return saved && typeof saved.clientId === 'string' ? saved : { clientId: '' };
  } catch {
    return { clientId: '' };
  }
}

let auth = loadAuth();
let state: SpotifyState = { clientId: auth.clientId, connected: Boolean(auth.refreshToken), track: null, status: 'idle', error: null };
const listeners = new Set<() => void>();
let pollTimer = 0;

function update(patch: Partial<SpotifyState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function saveAuth(next: SavedAuth): void {
  auth = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // Works until reload.
  }
  update({ clientId: auth.clientId, connected: Boolean(auth.refreshToken) });
}

/** On the phone, Spotify's login comes back to the app itself through iOS's sign-in sheet. */
const nativeSignIn = () => (window.vantageNative as { signIn?: (url: string, scheme: string) => Promise<string> } | undefined)?.signIn;
export const PHONE_REDIRECT_URI = 'vantageos://spotify';
/** The Redirect URI to register in your Spotify app (it depends on where Vantage runs). */
export const redirectUri = () => (nativeSignIn() ? PHONE_REDIRECT_URI : `${location.origin}${location.pathname}`);

const base64Url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export function setSpotifyClientId(clientId: string): void {
  saveAuth({ clientId: clientId.trim() });
}

/** Sends you to Spotify to sign in. Needs a secure page (https or localhost). */
export async function connectSpotify(): Promise<void> {
  if (!auth.clientId) throw new Error('Add your Spotify Client ID first.');
  if (!crypto.subtle) throw new Error('Spotify sign-in needs the app to run over https.');
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = base64Url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const params = new URLSearchParams({
    client_id: auth.clientId,
    response_type: 'code',
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
    state: 'vantage-spotify',
  });
  const url = `https://accounts.spotify.com/authorize?${params}`;
  const signIn = nativeSignIn();
  if (!signIn) {
    location.assign(url);
    return;
  }
  // On the phone: iOS's sign-in sheet, Vantage stays open underneath
  update({ error: null });
  let callback: string;
  try {
    callback = await signIn(url, 'vantageos');
  } catch (error) {
    const message = (error as Error).message;
    update({ error: message === 'cancelled' ? 'Spotify sign-in was cancelled.' : `Spotify sign-in failed: ${message}` });
    return;
  }
  const answer = new URL(callback.replace('vantageos://', 'https://vantageos.invalid/'));
  const code = answer.searchParams.get('code');
  if (!code) {
    update({ error: answer.searchParams.get('error') === 'access_denied' ? 'Spotify sign-in was cancelled.' : `Spotify said: ${answer.searchParams.get('error') ?? 'no code'}. Is ${PHONE_REDIRECT_URI} added as a Redirect URI in your Spotify app?` });
    return;
  }
  try {
    await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: PHONE_REDIRECT_URI, code_verifier: verifier });
  } catch (error) {
    update({ error: (error as Error).message });
  }
}

export function disconnectSpotify(): void {
  saveAuth({ clientId: auth.clientId });
  update({ track: null });
}

async function tokenRequest(body: Record<string, string>): Promise<void> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: auth.clientId, ...body }),
  });
  if (!response.ok) throw new Error('Spotify sign-in failed.');
  const json = (await response.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  saveAuth({
    ...auth,
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? auth.refreshToken,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  });
}

/** Call once at startup: finishes the sign-in when Spotify sends you back here. */
export async function handleSpotifyRedirect(): Promise<void> {
  const params = new URLSearchParams(location.search);
  if (params.get('state') !== 'vantage-spotify') return;
  const code = params.get('code');
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  // Clean the address bar either way
  history.replaceState(null, '', `${location.origin}${location.pathname}`);
  if (!code || !verifier) {
    update({ error: 'Spotify sign-in was cancelled.' });
    return;
  }
  try {
    await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: `${location.origin}${location.pathname}`, code_verifier: verifier });
  } catch (error) {
    update({ error: (error as Error).message });
  }
}

async function accessToken(): Promise<string | null> {
  if (!auth.refreshToken) return null;
  if (!auth.accessToken || !auth.expiresAt || Date.now() > auth.expiresAt) {
    await tokenRequest({ grant_type: 'refresh_token', refresh_token: auth.refreshToken });
  }
  return auth.accessToken ?? null;
}

async function api(path: string, method = 'GET'): Promise<Response | null> {
  const token = await accessToken();
  if (!token) return null;
  return fetch(`https://api.spotify.com/v1${path}`, { method, headers: { Authorization: `Bearer ${token}` } });
}

export async function refreshNowPlaying(): Promise<void> {
  if (!state.connected) return;
  try {
    const response = await api('/me/player/currently-playing');
    if (!response) return;
    if (response.status === 204) {
      update({ track: null, status: 'idle', error: null });
      return;
    }
    if (!response.ok) throw new Error(String(response.status));
    const json = await response.json();
    const item = json.item;
    update({
      status: 'idle',
      error: null,
      track: item
        ? {
            title: item.name,
            artist: (item.artists ?? []).map((artist: { name: string }) => artist.name).join(', '),
            album: item.album?.name ?? '',
            cover: item.album?.images?.[0]?.url ?? null,
            progress: json.progress_ms ?? 0,
            duration: item.duration_ms ?? 0,
            playing: Boolean(json.is_playing),
          }
        : null,
    });
  } catch {
    update({ status: 'error' });
  }
}

/** Play / pause / skip (Spotify Premium only). */
export async function spotifyControl(action: 'play' | 'pause' | 'next' | 'previous'): Promise<void> {
  const method = action === 'play' || action === 'pause' ? 'PUT' : 'POST';
  const response = await api(`/me/player/${action}`, method).catch(() => null);
  if (response && response.status === 403) update({ error: 'Controls need Spotify Premium.' });
  window.setTimeout(() => void refreshNowPlaying(), 400);
}

export function useSpotify(): SpotifyState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      if (listeners.size === 1) {
        void refreshNowPlaying();
        pollTimer = window.setInterval(() => document.visibilityState === 'visible' && void refreshNowPlaying(), 5000);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.clearInterval(pollTimer);
      };
    },
    () => state,
  );
}

import { Component, type ReactNode } from 'react';

/**
 * A new Vantage version replaced the old one's files on the server, while the
 * phone still ran the old one: opening an app then failed to load its code and
 * the whole screen went blank (found on the phone, 2026-11-26). Now such a
 * failure reloads onto the new version instead (at most once in 30 s, so a
 * real outage can't loop), coming back to the same screen.
 */
const KEY = 'vantage.staleReloadAt';

export function isLoadFailure(error: unknown): boolean {
  const text = String((error as Error)?.message ?? error);
  return /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Unable to preload CSS/i.test(text);
}

/** Reloads onto the latest version. False when it just did (don't loop). */
export function reloadForNewVersion(): boolean {
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // no storage: reload anyway
  }
  const url = new URL(window.location.href);
  url.searchParams.set('restore', '1');
  window.location.replace(url.toString());
  return true;
}

/** Call once at startup: Vite reports chunks that failed to load. */
export function installStaleBuildRecovery(): void {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadForNewVersion()) event.preventDefault();
  });
  window.addEventListener('unhandledrejection', (event) => {
    if (isLoadFailure(event.reason)) reloadForNewVersion();
  });
}

/** Wraps a lazy import: a failed load reloads onto the new version (and waits for it). */
export function loadOrReload<T>(load: () => Promise<T>): () => Promise<T> {
  return () =>
    load().catch((error: unknown) => {
      if (isLoadFailure(error) && reloadForNewVersion()) return new Promise<T>(() => {});
      throw error;
    });
}

/**
 * Catches a crash in one part (an app, a widget) so the rest of Vantage keeps
 * working, instead of the whole screen going blank.
 */
export class CrashGuard extends Component<{ children: ReactNode; fallback: (retry: () => void) => ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[vantage] part crashed:', error);
    if (isLoadFailure(error)) reloadForNewVersion();
  }
  render() {
    return this.state.failed ? this.props.fallback(() => this.setState({ failed: false })) : this.props.children;
  }
}

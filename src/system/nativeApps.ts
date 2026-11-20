/**
 * The phone's REAL installed apps (host mode: Vantage OS is the home screen on
 * the jailbroken iPhone). They come from the native bridge (SpringBoard),
 * are cached so the home screen is instant at start, and update live when
 * apps are installed or removed and when badges change.
 *
 * In the app registry they are apps with the id "ios:<bundle id>": tapping
 * one opens the real app.
 */
import { useSyncExternalStore } from 'react';
import { hasBridge, isHosted } from './nativeBridge';

export interface NativeApp {
  bundleId: string;
  name: string;
  /** PNG, base64 (cached on the phone) */
  icon: string;
  badge?: number | string;
  /** App Store category when iOS knows it */
  category?: string;
  source: 'system' | 'appstore' | 'trollstore' | 'jailbreak';
}

interface NativeBridgeApps {
  listApps?: () => Promise<NativeApp[]>;
  getBadges?: () => Promise<Record<string, number | string>>;
}

const CACHE_KEY = 'vantage.nativeApps.v1';
export const NATIVE_PREFIX = 'ios:';
export const nativeAppId = (bundleId: string) => `${NATIVE_PREFIX}${bundleId}`;
export const isNativeAppId = (id: string) => id.startsWith(NATIVE_PREFIX);
export const bundleIdOf = (id: string) => id.slice(NATIVE_PREFIX.length);

let apps: NativeApp[] = [];
let byId = new Map<string, NativeApp>();
const listeners = new Set<() => void>();

function set(next: NativeApp[], save: boolean) {
  apps = next;
  byId = new Map(next.map((app) => [app.bundleId, app]));
  if (save) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch {
      // full storage: the list still works until the next start
    }
  }
  listeners.forEach((listener) => listener());
}

/** All installed apps, sorted by name. */
export function getNativeApps(): NativeApp[] {
  return apps;
}

export function getNativeApp(bundleId: string): NativeApp | undefined {
  return byId.get(bundleId);
}

export function subscribeToNativeApps(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The installed apps, re-rendering when they (or their badges) change. */
export function useNativeApps(): NativeApp[] {
  return useSyncExternalStore(subscribeToNativeApps, getNativeApps, getNativeApps);
}

const bridge = () => window.vantageNative as NativeBridgeApps | undefined;

/** Asks SpringBoard for the full list (names, icons, badges). */
export async function refreshNativeApps(): Promise<void> {
  const list = await bridge()?.listApps?.().catch(() => null);
  if (!Array.isArray(list) || list.length === 0) return;
  set(list.filter((app) => app?.bundleId && app?.name), true);
}

/** Only the badges (small and fast). */
export async function refreshBadges(): Promise<void> {
  const badges = await bridge()?.getBadges?.().catch(() => null);
  if (!badges) return;
  let changed = false;
  const next = apps.map((app) => {
    const badge = badges[app.bundleId];
    if (badge === app.badge) return app;
    changed = true;
    return { ...app, badge };
  });
  if (changed) set(next, true);
}

/** Loads the cache now and the real list in the background; keeps it current. */
export function installNativeApps(): void {
  if (!isHosted()) return;
  try {
    const cached: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    if (Array.isArray(cached)) set(cached as NativeApp[], false);
  } catch {
    // no cache yet
  }
  if (!hasBridge()) return;
  void refreshNativeApps();
  window.addEventListener('vantage:apps-changed', () => void refreshNativeApps());
  window.addEventListener('vantage:badges-changed', () => void refreshBadges());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refreshBadges();
  });
}

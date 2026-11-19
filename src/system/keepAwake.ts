import { useSyncExternalStore } from 'react';

/**
 * Keeps the screen on while the setting is on, with the Screen Wake Lock
 * API. Safari has it from iOS 16.4; on 16.3 it isn't there, so the switch
 * says so instead of pretending (the native bridge can do it later).
 */

type Sentinel = { release: () => Promise<void>; addEventListener: (type: 'release', cb: () => void) => void };
type WakeLockApi = { request: (type: 'screen') => Promise<Sentinel> };

let sentinel: Sentinel | null = null;
let wanted = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const keepAwakeSupported = (): boolean => 'wakeLock' in navigator;

async function acquire(): Promise<void> {
  if (!wanted || sentinel || document.visibilityState !== 'visible') return;
  try {
    sentinel = await (navigator as unknown as { wakeLock: WakeLockApi }).wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
      notify();
    });
  } catch {
    sentinel = null;
  }
  notify();
}

/** Turns keep-awake on or off. Returns false when this phone can't do it. */
export async function setKeepAwake(on: boolean): Promise<boolean> {
  if (!keepAwakeSupported()) return false;
  wanted = on;
  if (on) await acquire();
  else {
    await sentinel?.release();
    sentinel = null;
  }
  notify();
  return true;
}

// The lock is dropped when the page is hidden; take it again when it's back
document.addEventListener('visibilitychange', () => void acquire());

export function useKeepAwake(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => wanted,
  );
}

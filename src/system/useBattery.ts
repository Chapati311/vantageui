import { useSyncExternalStore } from 'react';
import { watchBattery, type BatteryInfo } from './nativeBridge';

// One shared battery watcher for the whole OS, however many widgets show it.
let current: BatteryInfo | null = null;
let stopWatching: (() => void) | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!stopWatching) {
    stopWatching = watchBattery((info) => {
      current = info;
      listeners.forEach((notify) => notify());
    });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopWatching?.();
      stopWatching = null;
    }
  };
}

/** Current battery state, or `null` when the device can't report it. */
export function useBattery(): BatteryInfo | null {
  return useSyncExternalStore(subscribe, () => current);
}

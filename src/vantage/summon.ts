import { useSyncExternalStore } from 'react';
import { dismissFrame, summonFrame } from './bridge';

/**
 * One summon() for every way of calling Vantage (VANTAGE.md section 3):
 * the Ask bar, long-pressing the home indicator, double-tapping the status
 * bar, the lock screen, search ("Ask Vantage: ..."), and later the volume
 * chord through the native bridge.
 */

interface SummonState {
  open: boolean;
  trigger: string;
  text?: string;
}

let state: SummonState = { open: false, trigger: '' };
const listeners = new Set<() => void>();
const set = (next: SummonState) => {
  state = next;
  document.documentElement.toggleAttribute('data-summoned', next.open);
  listeners.forEach((listener) => listener());
};

export function summon(trigger: string, text?: string): void {
  set({ open: true, trigger, text });
  // Let the animation start before the frame gets busy
  window.setTimeout(() => summonFrame(trigger, text), 120);
}

export function dismiss(): void {
  if (!state.open) return;
  dismissFrame();
  set({ ...state, open: false });
}

export function useSummon(): SummonState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

import { useSyncExternalStore } from 'react';

/**
 * The secret: type the Konami code (up up down down left right left right
 * B A, on a keyboard) or tap the lock screen clock 7 times quickly, and the
 * phone turns into a Game Boy (Retro mode in Game Boy colors) with a little
 * pixel animation.
 */

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const TAPS_NEEDED = 7;
const TAP_WINDOW_MS = 2500;

let playing = false;
const listeners = new Set<() => void>();
let trigger: (() => void) | null = null;

function set(next: boolean) {
  playing = next;
  listeners.forEach((listener) => listener());
}

/** Runs the secret: the animation plays, then the action switches the theme. */
export function playEasterEgg(): void {
  if (playing) return;
  set(true);
  window.setTimeout(() => trigger?.(), 900);
  window.setTimeout(() => set(false), 2200);
}

/** The shell tells us what "switch to Game Boy" means (an action). */
export function onEasterEgg(run: () => void): void {
  trigger = run;
}

let taps: number[] = [];
/** Call on every tap of the lock clock. True when this tap set off the secret. */
export function countSecretTap(now = Date.now()): boolean {
  taps = [...taps.filter((at) => now - at < TAP_WINDOW_MS), now];
  if (taps.length < TAPS_NEEDED) return false;
  taps = [];
  playEasterEgg();
  return true;
}

let typed: string[] = [];
window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  typed = [...typed, key].slice(-KONAMI.length);
  if (typed.join() === KONAMI.join()) {
    typed = [];
    playEasterEgg();
  }
});

export function useEasterEggPlaying(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => playing,
  );
}

import { useSyncExternalStore } from 'react';

/**
 * Which Customise section is open. Kept outside the app so other places can
 * open Customise straight at a section (e.g. the music widget: "Connect
 * Spotify" opens Customise > Music).
 */
let section: string | null = null;
const listeners = new Set<() => void>();

export function setCustomiseSection(next: string | null): void {
  section = next;
  listeners.forEach((listener) => listener());
}

export function useCustomiseSection(): string | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => section,
  );
}

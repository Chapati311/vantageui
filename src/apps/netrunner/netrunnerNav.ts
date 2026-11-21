/**
 * Which Netrunner tool is open (kept apart from the app itself, so routes and
 * voice commands can open a tool without loading Netrunner's code first).
 */
import { useSyncExternalStore } from 'react';

let tool: string | null = null;
const listeners = new Set<() => void>();

export function setNetrunnerTool(next: string | null): void {
  tool = next;
  listeners.forEach((listener) => listener());
}

export function useNetrunnerTool(): string | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => tool,
  );
}

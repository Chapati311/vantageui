/**
 * Which Netrunner tool is open (kept apart from the app itself, so routes and
 * voice commands can open a tool without loading Netrunner's code first).
 */
import { useSyncExternalStore } from 'react';

let tool: string | null = null;
/** What a tool should start with (a host to ping, a domain to look up), used once. */
let target: { value: string; action?: string } | null = null;
const listeners = new Set<() => void>();

export function setNetrunnerTool(next: string | null, start?: { value: string; action?: string }): void {
  tool = next;
  target = start ?? null;
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

/** The start value for a tool (and what to do with it), once: the next call gets null. */
export function takeNetrunnerTarget(): { value: string; action?: string } | null {
  const value = target;
  target = null;
  return value;
}

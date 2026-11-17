import { useSyncExternalStore } from 'react';

/**
 * The 6-digit passcode that guards the lock screen.
 * Only a scrambled version (a hash) is saved, never the digits. This keeps
 * people out of the Vantage screens; it is not real security (anyone with
 * the phone and a computer could clear the app's storage). The real iPhone
 * passcode still protects the phone itself.
 */

const STORAGE_KEY = 'vantage.passcode.v1';
export const PASSCODE_LENGTH = 6;

interface Saved {
  salt: string;
  hash: string;
}

/** A simple repeated FNV-1a hash: fast, and the same on every browser (no secure context needed). */
function scramble(salt: string, code: string): string {
  let text = `${salt}:${code}`;
  let hash = 0x811c9dc5;
  for (let round = 0; round < 2000; round += 1) {
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    text = hash.toString(36) + salt;
  }
  return hash.toString(36);
}

function load(): Saved | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return saved && typeof saved.salt === 'string' && typeof saved.hash === 'string' ? saved : null;
  } catch {
    return null;
  }
}

let saved = load();
const listeners = new Set<() => void>();

function store(next: Saved | null): void {
  saved = next;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: works until the next reload.
  }
  listeners.forEach((listener) => listener());
}

export const isValidPasscode = (code: string) => new RegExp(`^\\d{${PASSCODE_LENGTH}}$`).test(code);

export function setPasscode(code: string): void {
  if (!isValidPasscode(code)) throw new Error(`The passcode must be ${PASSCODE_LENGTH} digits.`);
  const salt = Math.random().toString(36).slice(2, 10);
  store({ salt, hash: scramble(salt, code) });
}

export function removePasscode(): void {
  store(null);
}

export function hasPasscode(): boolean {
  return saved !== null;
}

export function checkPasscode(code: string): boolean {
  return saved !== null && scramble(saved.salt, code) === saved.hash;
}

/** True while a passcode is set. */
export function useHasPasscode(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    hasPasscode,
  );
}

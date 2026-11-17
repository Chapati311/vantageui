import { useSyncExternalStore } from 'react';

/**
 * Vantage's own notifications (a timer finishing, ...). They are saved on
 * the device, so they survive a reload. Notifications from OTHER iPhone apps
 * need the native bridge (after the jailbreak); until then there are none.
 */

export interface VantageNotification {
  id: string;
  /** Which app it belongs to (its icon is shown, tapping opens it) */
  appId: string;
  title: string;
  body: string;
  /** When it arrived (ms since 1970) */
  at: number;
}

const STORAGE_KEY = 'vantage.notifications.v1';
/** Older ones are dropped beyond this. */
const MAX_KEPT = 50;

function load(): VantageNotification[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((item) => item && typeof item.id === 'string') : [];
  } catch {
    return [];
  }
}

let list = load();
const listeners = new Set<() => void>();

function save(next: VantageNotification[]): void {
  list = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage full or blocked: keep them in memory only.
  }
  listeners.forEach((listener) => listener());
}

/** Adds a notification (newest first). */
export function pushNotification(notification: Omit<VantageNotification, 'id' | 'at'>): void {
  const item = { ...notification, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now() };
  save([item, ...list].slice(0, MAX_KEPT));
}

export function dismissNotification(id: string): void {
  save(list.filter((item) => item.id !== id));
}

export function clearNotifications(): void {
  save([]);
}

export function getNotifications(): VantageNotification[] {
  return list;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The notifications, newest first. Re-renders when one arrives or goes. */
export function useNotifications(): VantageNotification[] {
  return useSyncExternalStore(subscribe, getNotifications);
}

/** "now", "5 min", "2 h", "Yesterday", "3 d" */
export function timeAgo(at: number, now = Date.now()): string {
  const minutes = Math.floor((now - at) / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} d`;
}

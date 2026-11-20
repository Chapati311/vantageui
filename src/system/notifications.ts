import { useSyncExternalStore } from 'react';
import { hasBridge, isHosted } from './nativeBridge';

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
  /** A real notification from an iPhone app (host mode): opened/cleared through iOS */
  real?: boolean;
}

/** What SpringBoard sends for each real notification (Part 3.2). */
interface RealNotification {
  id: string;
  app: string;
  appName: string;
  title?: string;
  subtitle?: string;
  message?: string;
  date: number;
  thread?: string;
  actions: { id: string; title: string; text: boolean }[];
}

interface NotificationBridge {
  getNotifications?: () => Promise<RealNotification[]>;
  openNotification?: (id: string) => Promise<void>;
  dismissNotification?: (id: string) => Promise<void>;
  clearNotifications?: () => Promise<void>;
}
const REAL_PREFIX = 'ios-n:';
const realBridge = () => window.vantageNative as NotificationBridge | undefined;
/** Real notifications, as Vantage notifications (icon and name from the real app). */
let real: VantageNotification[] = [];
const toVantage = (n: RealNotification): VantageNotification => ({
  id: `${REAL_PREFIX}${n.id}`,
  appId: `ios:${n.app}`,
  title: n.title || n.appName,
  body: [n.subtitle, n.message].filter(Boolean).join(' · '),
  at: n.date,
  real: true,
});

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
/** Vantage's own and the real ones together, newest first (stable between changes). */
let merged = list;
const listeners = new Set<() => void>();

function publish(): void {
  merged = real.length ? [...list, ...real].sort((a, b) => b.at - a.at) : list;
  listeners.forEach((listener) => listener());
}

function save(next: VantageNotification[]): void {
  list = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage full or blocked: keep them in memory only.
  }
  publish();
}

/** Host mode: the phone's real notifications join the list and stay current. */
export function installRealNotifications(): void {
  if (!isHosted() || !hasBridge() || !realBridge()?.getNotifications) return;
  const apply = (items: RealNotification[] | null | undefined) => {
    if (!Array.isArray(items)) return;
    real = items.filter((n) => n && typeof n.id === 'string').map(toVantage);
    publish();
  };
  void realBridge()?.getNotifications?.().then(apply).catch(() => {});
  window.addEventListener('vantage:notifications', (event) => apply((event as CustomEvent<RealNotification[]>).detail));
}

/** Tapping a notification: a real one opens what it is about (the chat, the email). */
export function isRealNotification(id: string): boolean {
  return id.startsWith(REAL_PREFIX);
}

export function openRealNotification(id: string): void {
  real = real.filter((item) => item.id !== id);
  publish();
  void realBridge()?.openNotification?.(id.slice(REAL_PREFIX.length)).catch(() => {});
}

/** Adds a notification (newest first). */
export function pushNotification(notification: Omit<VantageNotification, 'id' | 'at'>): void {
  const item = { ...notification, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now() };
  save([item, ...list].slice(0, MAX_KEPT));
}

export function dismissNotification(id: string): void {
  if (isRealNotification(id)) {
    real = real.filter((item) => item.id !== id);
    publish();
    void realBridge()?.dismissNotification?.(id.slice(REAL_PREFIX.length)).catch(() => {});
    return;
  }
  save(list.filter((item) => item.id !== id));
}

export function clearNotifications(): void {
  if (real.length) {
    real = [];
    void realBridge()?.clearNotifications?.().catch(() => {});
  }
  save([]);
}

export function getNotifications(): VantageNotification[] {
  return merged;
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

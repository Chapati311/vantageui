import { useEffect, useState, useSyncExternalStore } from 'react';
import { getFocus } from './focusStore';
import { getLockIn, updateLockIn } from './lockInStore';

/**
 * ALL APP-BLOCKING RULES, IN ONE PLACE. Today they lock Vantage's own apps
 * (grey icons, a calm lock screen). After the jailbreak, the native bridge
 * can ask the same `blockState()` to block real iPhone apps system-wide.
 */

export interface BlockState {
  locked: boolean;
  /** Plain words: "Focus session", "Wind Down", "Daily limit reached", ... */
  reason: string;
  /** When it unlocks by itself (ms), if known */
  until: number | null;
}

const OPEN: BlockState = { locked: false, reason: '', until: null };

/** Apps you unlocked in an emergency: app id -> allowed until (ms). */
let emergencyUnlocks: Record<string, number> = {};
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/** Is "now" inside a daily window that may cross midnight (21:00-07:00)? */
export function inWindow(from: string, to: string, now = new Date()): boolean {
  const current = now.getHours() * 60 + now.getMinutes();
  const start = minutesOf(from);
  const end = minutesOf(to);
  return start <= end ? current >= start && current < end : current >= start || current < end;
}

/** The end of the window as a time stamp (for "unlocks at"). */
function windowEnd(to: string, now = new Date()): number {
  const end = new Date(now);
  end.setHours(Math.floor(minutesOf(to) / 60), minutesOf(to) % 60, 0, 0);
  if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 1);
  return end.getTime();
}

/** Wind Down runs from its start time until 06:00. */
export function windDownActive(now = new Date()): boolean {
  const { windDown } = getLockIn();
  return windDown.enabled && inWindow(windDown.start, '06:00', now);
}

export function blockState(appId: string, now = new Date()): BlockState {
  const { blocking, usage } = getLockIn();
  if (!blocking.distractions.includes(appId)) return OPEN;
  if ((emergencyUnlocks[appId] ?? 0) > now.getTime()) return OPEN;

  const focus = getFocus().session;
  if (blocking.duringSessions && focus) {
    return { locked: true, reason: focus.plan.tag ? `Focus: ${focus.plan.tag}` : 'Focus session', until: focus.phaseEndsAt };
  }
  if (blocking.lockedUntil && blocking.lockedUntil > now.getTime()) {
    return { locked: true, reason: 'Locked for a while', until: blocking.lockedUntil };
  }
  if (blocking.duringWindDown && windDownActive(now)) {
    return { locked: true, reason: 'Wind Down', until: windowEnd('06:00', now) };
  }
  if (blocking.schedule && inWindow(blocking.schedule.from, blocking.schedule.to, now)) {
    return { locked: true, reason: 'Scheduled lock', until: windowEnd(blocking.schedule.to, now) };
  }
  const limit = blocking.limits[appId] ?? 0;
  const today = now.toDateString();
  const used = usage.day === today ? usage.minutes[appId] ?? 0 : 0;
  if (limit > 0 && used >= limit) {
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    return { locked: true, reason: `Daily limit of ${limit} min reached`, until: midnight };
  }
  return OPEN;
}

/** Emergency unlock (after the 60 s wait and a reason): this app is open for 10 minutes. */
export function emergencyUnlock(appId: string): void {
  emergencyUnlocks = { ...emergencyUnlocks, [appId]: Date.now() + 10 * 60_000 };
  notify();
}

/** Counts a minute of use for the app that is open (called by the shell every minute). */
export function countUsage(appId: string): void {
  const today = new Date().toDateString();
  updateLockIn((current) => {
    const minutes = current.usage.day === today ? { ...current.usage.minutes } : {};
    minutes[appId] = (minutes[appId] ?? 0) + 1;
    return { usage: { day: today, minutes } };
  });
}

/** Re-checks every 30 s, so icons grey out and unlock on time. */
export function useBlockState(appId: string): BlockState {
  const [, setTick] = useState(0);
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => emergencyUnlocks,
  );
  useEffect(() => {
    const id = window.setInterval(() => setTick((tick) => tick + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return blockState(appId);
}

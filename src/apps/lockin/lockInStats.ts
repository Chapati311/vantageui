import { useSyncExternalStore } from 'react';

/**
 * Finished Lock In focus sessions. Small enough for localStorage, and read
 * by widgets (ring, streak, plant), the Widget Lab and Vanta Pet.
 */

export interface FocusSession {
  id: string;
  /** When it started (ms) */
  startedAt: number;
  /** Minutes actually focused */
  minutes: number;
  /** "Maths", "Reading", ... */
  tag: string;
  /** Deep work, Pomodoro, ... */
  type: string;
  /** Finished the planned time (not given up early) */
  completed: boolean;
  /** Your answer after the session: did you reach the goal? */
  result?: 'done' | 'partly' | 'not';
}

const STORAGE_KEY = 'vantage.lockin.sessions.v1';

function load(): FocusSession[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((item) => item && typeof item.minutes === 'number') : [];
  } catch {
    return [];
  }
}

let sessions = load();
const listeners = new Set<() => void>();

function store(next: FocusSession[]): void {
  sessions = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Kept until reload.
  }
  listeners.forEach((listener) => listener());
}

export function recordSession(session: Omit<FocusSession, 'id'>): void {
  store([...sessions, { ...session, id: `s-${session.startedAt}` }]);
}

/** Saves your answer ("done / partly / not") on the latest session. */
export function rateLastSession(result: 'done' | 'partly' | 'not'): void {
  if (!sessions.length) return;
  store(sessions.map((session, index) => (index === sessions.length - 1 ? { ...session, result } : session)));
}

export function deleteSession(id: string): void {
  store(sessions.filter((session) => session.id !== id));
}

export function getSessions(): FocusSession[] {
  return sessions;
}

const dayKey = (time: number) => {
  const date = new Date(time);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

/** Minutes focused on a given day (default: today). */
export function focusMinutesOn(date = new Date()): number {
  const key = dayKey(date.getTime());
  return sessions.filter((session) => dayKey(session.startedAt) === key).reduce((sum, session) => sum + session.minutes, 0);
}

export function focusMinutesToday(): number {
  return focusMinutesOn(new Date());
}

/**
 * Days in a row with at least one finished session, counting back from
 * today (or from yesterday, if today has none yet: the streak is still alive).
 */
export function streakDays(now = new Date()): number {
  const days = new Set(sessions.filter((session) => session.minutes >= 1).map((session) => dayKey(session.startedAt)));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function useFocusSessions(): FocusSession[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => sessions,
  );
}

import { useSyncExternalStore } from 'react';
import { petFocusBonus } from '../arcade/petStore';
import { runShortcut } from '../../system/nativeBridge';
import { pushNotification } from '../../system/notifications';
import { playSound } from '../../system/sounds';
import { recordSession } from './lockInStats';
import { getLockIn } from './lockInStore';

/**
 * The running focus session. Like the timer, it is stored as real clock
 * times, so it keeps going when you leave Lock In or reload.
 */

export type SessionType = 'pomodoro' | 'deep50' | 'deep90' | 'custom' | 'open';

export const SESSION_TYPES: { id: SessionType; name: string; work: number; rest: number; rounds: number; longRest: number }[] = [
  { id: 'pomodoro', name: 'Pomodoro', work: 25, rest: 5, rounds: 4, longRest: 15 },
  { id: 'deep50', name: 'Deep 50', work: 50, rest: 10, rounds: 2, longRest: 10 },
  { id: 'deep90', name: 'Deep 90', work: 90, rest: 15, rounds: 1, longRest: 15 },
  { id: 'custom', name: 'Custom', work: 40, rest: 8, rounds: 2, longRest: 8 },
  { id: 'open', name: 'Open', work: 0, rest: 0, rounds: 1, longRest: 0 },
];

export interface FocusPlan {
  type: SessionType;
  /** Minutes */
  work: number;
  rest: number;
  rounds: number;
  longRest: number;
  tag: string;
  goal: string;
  strict: boolean;
}

export interface RunningSession {
  plan: FocusPlan;
  startedAt: number;
  /** 'work' or 'break', which round (1-based), and when this phase ends (null = open, counting up) */
  phase: 'work' | 'break';
  round: number;
  phaseEndsAt: number | null;
  phaseStartedAt: number;
  /** Focused minutes so far (finished work phases) */
  focusedMs: number;
  /** While paused: how much of the phase was left */
  pausedLeft: number | null;
  /** Emergency unlock asked at (ms), for the 60 s wait */
  emergencyAt: number | null;
}

interface FocusState {
  session: RunningSession | null;
  /** After a session: asking "did you reach your goal?" */
  review: { minutes: number; goal: string; tag: string; type: SessionType; startedAt: number; completed: boolean } | null;
}

const STORAGE_KEY = 'vantage.focus.v1';

function load(): FocusState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && 'session' in saved) return saved;
  } catch {
    // Nothing running
  }
  return { session: null, review: null };
}

let state = load();
const listeners = new Set<() => void>();

function update(patch: Partial<FocusState>): void {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Kept until reload.
  }
  listeners.forEach((listener) => listener());
}

export function getFocus(): FocusState {
  return state;
}

export function useFocus(): FocusState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

const minutes = (value: number) => value * 60_000;

function focusShortcut(on: boolean): void {
  if (getLockIn().blocking.useFocusShortcuts) runShortcut(on ? 'FocusOn' : 'FocusOff');
}

export function startSession(plan: FocusPlan): void {
  const now = Date.now();
  update({
    session: {
      plan,
      startedAt: now,
      phase: 'work',
      round: 1,
      phaseStartedAt: now,
      phaseEndsAt: plan.type === 'open' ? null : now + minutes(plan.work),
      focusedMs: 0,
      pausedLeft: null,
      emergencyAt: null,
    },
    review: null,
  });
  playSound('unlock');
  focusShortcut(true);
}

/** How long is left in the current phase (or how long it has run, for open sessions). */
export function phaseTime(session: RunningSession, now = Date.now()): { left: number; elapsed: number; total: number } {
  const total = session.phase === 'work' ? minutes(session.plan.work) : minutes(isLongBreak(session) ? session.plan.longRest : session.plan.rest);
  if (session.pausedLeft !== null) return { left: session.pausedLeft, elapsed: total - session.pausedLeft, total };
  if (session.phaseEndsAt === null) return { left: 0, elapsed: now - session.phaseStartedAt, total: 0 };
  const left = Math.max(0, session.phaseEndsAt - now);
  return { left, elapsed: total - left, total };
}

const isLongBreak = (session: RunningSession) => session.round % Math.max(1, session.plan.rounds) === 0;

/** Total focused time including the running work phase. */
export function focusedSoFar(session: RunningSession, now = Date.now()): number {
  return session.focusedMs + (session.phase === 'work' ? phaseTime(session, now).elapsed : 0);
}

export function pauseSession(): void {
  const { session } = state;
  if (!session || session.plan.strict || session.pausedLeft !== null || session.phaseEndsAt === null) return;
  update({ session: { ...session, pausedLeft: phaseTime(session).left } });
}

export function resumeSession(): void {
  const { session } = state;
  if (!session || session.pausedLeft === null) return;
  const now = Date.now();
  update({ session: { ...session, phaseEndsAt: now + session.pausedLeft, pausedLeft: null } });
}

/** Ends the session and asks how it went. */
export function endSession(completed: boolean): void {
  const { session } = state;
  if (!session) return;
  const focused = Math.round(focusedSoFar(session) / 60_000);
  update({
    session: null,
    review: { minutes: focused, goal: session.plan.goal, tag: session.plan.tag, type: session.plan.type, startedAt: session.startedAt, completed },
  });
  focusShortcut(false);
  if (focused > 0) {
    recordSession({ startedAt: session.startedAt, minutes: focused, tag: session.plan.tag, type: session.plan.type, completed });
    petFocusBonus(focused);
  }
}

/** Strict sessions can only end through the emergency unlock: ask, wait 60 seconds, then end. */
export function askEmergency(): void {
  const { session } = state;
  if (session) update({ session: { ...session, emergencyAt: Date.now() } });
}

export function cancelEmergency(): void {
  const { session } = state;
  if (session) update({ session: { ...session, emergencyAt: null } });
}

export function finishReview(): void {
  update({ review: null });
}

/** Moves from work to break to work... and ends after the last round. */
function tick(): void {
  const { session } = state;
  if (!session || session.pausedLeft !== null || session.phaseEndsAt === null) return;
  const now = Date.now();
  if (now < session.phaseEndsAt) return;
  if (session.phase === 'work') {
    const focusedMs = session.focusedMs + minutes(session.plan.work);
    const last = session.round >= session.plan.rounds;
    if (last && session.plan.type !== 'pomodoro') {
      update({ session: { ...session, focusedMs } });
      playSound('timerDone');
      pushNotification({ appId: 'lockin', title: 'Focus', body: `Session done: ${Math.round(focusedMs / 60_000)} minutes of focus.` });
      endSession(true);
      return;
    }
    const breakMinutes = isLongBreak(session) ? session.plan.longRest : session.plan.rest;
    update({ session: { ...session, focusedMs, phase: 'break', phaseStartedAt: now, phaseEndsAt: now + minutes(breakMinutes) } });
    playSound('timerDone');
    pushNotification({ appId: 'lockin', title: 'Break', body: `Well done. ${breakMinutes} minutes off.` });
  } else {
    if (session.round >= session.plan.rounds) {
      endSession(true);
      return;
    }
    update({ session: { ...session, phase: 'work', round: session.round + 1, phaseStartedAt: now, phaseEndsAt: now + minutes(session.plan.work) } });
    playSound('unlock');
    pushNotification({ appId: 'lockin', title: 'Focus', body: `Round ${session.round + 1}: back to focus.` });
  }
}

window.setInterval(tick, 1000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && tick());

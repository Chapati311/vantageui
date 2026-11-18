import { useSyncExternalStore } from 'react';
import { pushNotification } from '../../system/notifications';
import { playSound } from '../../system/sounds';

/**
 * The timer and stopwatch live HERE, not inside the Clock app's screen.
 * They are stored as "when did it start / when does it end" (real clock
 * times), so they keep running when you leave the app, lock the phone, or
 * even reload the page.
 */

export type ClockTab = 'alarm' | 'world' | 'stopwatch' | 'timer';

export interface TimerState {
  /** What the timer was set to */
  durationMs: number;
  status: 'idle' | 'running' | 'paused' | 'done';
  /** While running: the clock time at which it finishes */
  endsAt: number;
  /** While paused: how much was left */
  remainingMs: number;
}

export interface StopwatchState {
  running: boolean;
  /** While running: the clock time at which it was (re)started */
  startedAt: number;
  /** Time collected before the last start */
  elapsedMs: number;
  /** Total elapsed time at each lap, newest last */
  laps: number[];
}

export interface ClockState {
  tab: ClockTab;
  /** The preset pills (minutes); hold one to change it */
  presets: number[];
  /** Running timer: numbers turned on their side (true) or flat */
  vertical: boolean;
  /** The one-time switch to flat numbers has been done (see load) */
  flatDefault?: boolean;
  timer: TimerState;
  stopwatch: StopwatchState;
}

export const MIN_TIMER_MS = 60_000;
export const MAX_TIMER_MS = 99 * 60_000;

const STORAGE_KEY = 'vantage.clock.v1';

const DEFAULTS: ClockState = {
  tab: 'alarm',
  presets: [1, 3, 5, 10, 25],
  vertical: false,
  flatDefault: true,
  timer: { durationMs: 5 * 60_000, status: 'idle', endsAt: 0, remainingMs: 5 * 60_000 },
  stopwatch: { running: false, startedAt: 0, elapsedMs: 0, laps: [] },
};

function load(): ClockState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved?.timer && saved?.stopwatch) {
      const tab = ['alarm', 'world', 'stopwatch', 'timer'].includes(saved.tab) ? saved.tab : DEFAULTS.tab;
      // Flat (horizontal) timer numbers became the default: switch saved data
      // over once, then respect whatever you choose afterwards.
      const vertical = saved.flatDefault ? Boolean(saved.vertical) : false;
      return { ...DEFAULTS, ...saved, tab, vertical, flatDefault: true, presets: Array.isArray(saved.presets) ? saved.presets : DEFAULTS.presets };
    }
  } catch {
    // Broken or blocked storage: start fresh.
  }
  return DEFAULTS;
}

let state = load();
const listeners = new Set<() => void>();

function update(patch: Partial<ClockState>): void {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: it still works until reload.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The whole clock state. Components re-render when it changes. */
export function useClockState(): ClockState {
  return useSyncExternalStore(subscribe, () => state);
}

export function setClockTab(tab: ClockTab): void {
  update({ tab });
}

export function setPreset(index: number, minutes: number): void {
  const presets = [...state.presets];
  presets[index] = Math.min(99, Math.max(1, Math.round(minutes)));
  update({ presets });
}

export function setTimerVertical(vertical: boolean): void {
  update({ vertical });
}

// ---- Timer ---------------------------------------------------------------

/** How much time is left right now. */
export function timerRemaining(timer: TimerState, now = Date.now()): number {
  if (timer.status === 'running') return Math.max(0, timer.endsAt - now);
  if (timer.status === 'paused') return timer.remainingMs;
  if (timer.status === 'done') return 0;
  return timer.durationMs;
}

let finishTimeout = 0;

/** Makes sure "timer done" fires at the right moment, even if nobody is looking. */
function scheduleFinish(): void {
  window.clearTimeout(finishTimeout);
  const { timer } = state;
  if (timer.status !== 'running') return;
  const left = timer.endsAt - Date.now();
  if (left <= 0) {
    update({ timer: { ...timer, status: 'done', remainingMs: 0 } });
    playSound('timerDone');
    const minutes = Math.round(timer.durationMs / 60_000);
    pushNotification({ appId: 'clock', title: 'Timer', body: `Your ${minutes} min timer is done.` });
  } else {
    finishTimeout = window.setTimeout(scheduleFinish, left);
  }
}

export function setTimerDuration(durationMs: number): void {
  if (state.timer.status === 'running' || state.timer.status === 'paused') return;
  const clamped = Math.min(MAX_TIMER_MS, Math.max(MIN_TIMER_MS, durationMs));
  update({ timer: { durationMs: clamped, status: 'idle', endsAt: 0, remainingMs: clamped } });
}

export function startTimer(): void {
  const { timer } = state;
  if (timer.status === 'running') return;
  const left = timer.status === 'paused' ? timer.remainingMs : timer.durationMs;
  update({ timer: { ...timer, status: 'running', endsAt: Date.now() + left } });
  scheduleFinish();
}

export function pauseTimer(): void {
  const { timer } = state;
  if (timer.status !== 'running') return;
  window.clearTimeout(finishTimeout);
  update({ timer: { ...timer, status: 'paused', remainingMs: timerRemaining(timer) } });
}

/** Back to the start. Also used to dismiss a finished timer. */
export function resetTimer(): void {
  window.clearTimeout(finishTimeout);
  const { timer } = state;
  update({ timer: { ...timer, status: 'idle', endsAt: 0, remainingMs: timer.durationMs } });
}

// ---- Stopwatch -----------------------------------------------------------

/** How long the stopwatch has been running in total, right now. */
export function stopwatchElapsed(stopwatch: StopwatchState, now = Date.now()): number {
  return stopwatch.elapsedMs + (stopwatch.running ? now - stopwatch.startedAt : 0);
}

export function startStopwatch(): void {
  if (state.stopwatch.running) return;
  update({ stopwatch: { ...state.stopwatch, running: true, startedAt: Date.now() } });
}

export function stopStopwatch(): void {
  const { stopwatch } = state;
  if (!stopwatch.running) return;
  update({ stopwatch: { ...stopwatch, running: false, elapsedMs: stopwatchElapsed(stopwatch) } });
}

export function addLap(): void {
  const { stopwatch } = state;
  if (!stopwatch.running) return;
  update({ stopwatch: { ...stopwatch, laps: [...stopwatch.laps, stopwatchElapsed(stopwatch)] } });
}

export function resetStopwatch(): void {
  update({ stopwatch: DEFAULTS.stopwatch });
}

// ---- Start-up ------------------------------------------------------------

// A timer that was running before a reload carries on (or finishes) now.
scheduleFinish();

// Timers are frozen while the phone sleeps, so check again when we wake up.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') scheduleFinish();
});

import { SESSION_TYPES, startSession } from '../apps/lockin/focusStore';
import { runAction } from './actions';
import { getWeather } from './weather';
import { togglePlay } from './musicPlayer';

/**
 * Quick actions in an app icon's long-press menu. `run` may return a short
 * message to show (e.g. tomorrow's weather); otherwise it opens the app.
 */
export interface QuickAction {
  label: string;
  run: () => string | void;
}

const LAST_RESULT_KEY = 'vantage.calcLast.v1';

/** The calculator saves its latest result here (for "Copy last result"). */
export function saveLastResult(value: string): void {
  try {
    localStorage.setItem(LAST_RESULT_KEY, value);
  } catch {
    // Not important enough to complain about
  }
}

export const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  clock: [
    {
      label: '5-min timer',
      run: () => {
        void runAction('timer.reset', {});
        void runAction('timer.setDuration', { minutes: 5 });
        void runAction('timer.start', {});
        return 'Timer started: 5 minutes.';
      },
    },
    { label: 'New alarm', run: () => void runAction('clock.showTab', { tab: 'alarm' }) },
  ],
  notes: [
    {
      label: 'New note',
      run: () => {
        void runAction('notes.create', { kind: 'text' });
      },
    },
  ],
  lockin: [
    {
      label: 'Start 25 min',
      run: () => {
        const p = SESSION_TYPES[0];
        startSession({ type: 'pomodoro', work: p.work, rest: p.rest, rounds: p.rounds, longRest: p.longRest, tag: '', goal: '', strict: false });
        return 'Locked in for 25 minutes.';
      },
    },
  ],
  weather: [
    {
      label: 'Tomorrow',
      run: () => {
        const day = getWeather()?.daily[1];
        return day ? `Tomorrow: ${day.condition}, ${day.high}° / ${day.low}°, rain ${day.rainChance}%.` : 'No forecast saved yet.';
      },
    },
  ],
  calculator: [
    {
      label: 'Copy last result',
      run: () => {
        const value = localStorage.getItem(LAST_RESULT_KEY);
        if (!value) return 'No result yet.';
        void navigator.clipboard?.writeText(value).catch(() => undefined);
        return `Copied ${value}.`;
      },
    },
  ],
  music: [
    {
      label: 'Play / pause',
      run: () => {
        togglePlay();
        return 'Music';
      },
    },
  ],
};

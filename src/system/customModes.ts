import { useEffect, useSyncExternalStore } from 'react';
import { inWindow } from '../apps/lockin/blocking';
import { getSettings, updateSettings, type Settings } from './settingsStore';

/**
 * Custom modes: your own named look (theme, wallpaper, accent, widget and
 * icon style, font), switched on by hand or on a daily schedule. When a
 * mode ends, the look from before it comes back.
 */

const LOOK_KEYS = ['darkTheme', 'lightTheme', 'appearance', 'accent', 'matchWallpaper', 'wallpaper', 'widgetStyle', 'iconShape', 'iconStyle', 'uiFont', 'homeDim', 'homeBlur'] as const;
type LookKey = (typeof LOOK_KEYS)[number];
export type Look = Pick<Settings, LookKey>;

export interface CustomMode {
  id: string;
  name: string;
  look: Look;
  /** Switch on every day from..to (may cross midnight), or null for by hand */
  schedule: { from: string; to: string } | null;
}

interface ModesState {
  modes: CustomMode[];
  /** The mode that is on, and the look to go back to */
  active: { id: string; previous: Look; byScheduler: boolean } | null;
}

const STORAGE_KEY = 'vantage.customModes.v1';

function load(): ModesState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && Array.isArray(saved.modes)) return { modes: saved.modes, active: saved.active ?? null };
  } catch {
    // Fresh
  }
  return { modes: [], active: null };
}

let state = load();
const listeners = new Set<() => void>();

function store(next: ModesState): void {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Kept until reload.
  }
  listeners.forEach((listener) => listener());
}

export function currentLook(): Look {
  const settings = getSettings();
  return Object.fromEntries(LOOK_KEYS.map((key) => [key, settings[key]])) as Look;
}

export function saveMode(name: string, schedule: CustomMode['schedule']): void {
  store({ ...state, modes: [...state.modes, { id: `mode-${Date.now().toString(36)}`, name: name.trim() || 'My mode', look: currentLook(), schedule }] });
}

export function deleteMode(id: string): void {
  if (state.active?.id === id) endMode();
  store({ ...state, modes: state.modes.filter((mode) => mode.id !== id) });
}

export function startMode(id: string, byScheduler = false): void {
  const mode = state.modes.find((item) => item.id === id);
  if (!mode) return;
  const previous = state.active ? state.active.previous : currentLook();
  updateSettings({ ...mode.look, mode: 'clean' });
  store({ ...state, active: { id, previous, byScheduler } });
}

export function endMode(): void {
  if (!state.active) return;
  updateSettings(state.active.previous);
  store({ ...state, active: null });
}

export function useCustomModes(): ModesState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

/** Starts and ends scheduled modes (checked every minute). */
export function useCustomModeSchedule(): void {
  useEffect(() => {
    const check = () => {
      const due = state.modes.find((mode) => mode.schedule && inWindow(mode.schedule.from, mode.schedule.to));
      if (due && state.active?.id !== due.id && !(state.active && !state.active.byScheduler)) startMode(due.id, true);
      else if (!due && state.active?.byScheduler) endMode();
    };
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, []);
}

import { useSyncExternalStore } from 'react';

export type Wallpaper = 'orbit' | 'dots' | 'plain';
export type AccentId = 'mint' | 'amber' | 'coral' | 'violet' | 'sky';
export type ModeId = 'clean' | 'focus' | 'retro';

/** Small settings that are remembered on the device. */
export interface Settings {
  soundsEnabled: boolean;
  /** false = dark (default), true = light */
  lightMode: boolean;
  /** The lock screen background */
  wallpaper: Wallpaper;
  accent: AccentId;
  /** Saved now, used later when modes are built */
  mode: ModeId;
  // Quick settings. For now these only change how the toggles look.
  wifi: boolean;
  bluetooth: boolean;
  flashlight: boolean;
  doNotDisturb: boolean;
  /** 0 = darkest, 1 = brightest */
  brightness: number;
}

const DEFAULTS: Settings = {
  soundsEnabled: true,
  lightMode: false,
  wallpaper: 'orbit',
  accent: 'mint',
  mode: 'clean',
  wifi: true,
  bluetooth: false,
  flashlight: false,
  doNotDisturb: false,
  brightness: 0.7,
};

const STORAGE_KEY = 'vantage.settings.v1';

function load(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return { ...DEFAULTS, ...(saved && typeof saved === 'object' ? saved : {}) };
  } catch {
    return DEFAULTS;
  }
}

let settings = load();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** For code outside React that needs to react to a changed setting. */
export const subscribeToSettings = subscribe;

export function getSettings(): Settings {
  return settings;
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  settings = { ...settings, [key]: value };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or blocked: the setting still works until reload.
  }
  listeners.forEach((notify) => notify());
}

/** Like useState, but for one saved setting: `const [on, setOn] = useSetting('wifi')`. */
export function useSetting<K extends keyof Settings>(
  key: K,
): [Settings[K], (value: Settings[K]) => void] {
  const value = useSyncExternalStore(subscribe, () => settings[key]);
  return [value, (next) => setSetting(key, next)];
}

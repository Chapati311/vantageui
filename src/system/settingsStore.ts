import { useSyncExternalStore } from 'react';

/** Small settings that are remembered on the device. */
export interface Settings {
  soundsEnabled: boolean;
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

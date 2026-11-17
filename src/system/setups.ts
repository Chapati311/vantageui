import { useSyncExternalStore } from 'react';
import { loadLayout, saveLayout } from '../shell/home/layoutStore';
import { presetsIn, SUGGESTED_ACCENTS } from '../theme/presets';
import { GRADIENTS, LIVE_WALLPAPERS, type WallpaperConfig } from '../theme/wallpapers';
import { getSettings, replaceAllSettings, sanitizeSettings, updateSettings, type Settings } from './settingsStore';

/**
 * A "setup" is your whole look: every setting plus the home screen layout.
 * Setups can be saved on the phone by name, exported as a file (to keep or
 * share) and imported again.
 */

export interface Setup {
  id: string;
  name: string;
  savedAt: number;
  settings: Settings;
  /** The home screen layout (see shell/home/layoutStore.ts) */
  layout: unknown;
}

/** What an exported file looks like. */
interface SetupFile {
  app: 'vantage-os';
  kind: 'setup';
  version: 1;
  setup: Omit<Setup, 'id'>;
}

const STORAGE_KEY = 'vantage.setups.v1';

function load(): Setup[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((item) => item && typeof item.name === 'string') : [];
  } catch {
    return [];
  }
}

let setups = load();
const listeners = new Set<() => void>();

function store(next: Setup[]): void {
  setups = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(setups));
  } catch {
    // Storage full or blocked: kept until reload.
  }
  listeners.forEach((listener) => listener());
}

function current(name: string): Omit<Setup, 'id'> {
  // Saved presets inside the settings are left out: they belong to the phone, not the setup
  return { name, savedAt: Date.now(), settings: { ...getSettings(), customPresets: [] }, layout: loadLayout() };
}

export function saveSetup(name: string): void {
  const trimmed = name.trim() || 'My setup';
  store([{ ...current(trimmed), id: `setup-${Date.now()}` }, ...setups.filter((setup) => setup.name !== trimmed)]);
}

/** Puts a setup on the phone. The page reloads so the home screen picks up the layout. */
export function applySetup(setup: Pick<Setup, 'settings' | 'layout'>): void {
  const keep = getSettings().customPresets;
  replaceAllSettings({ ...sanitizeSettings(setup.settings), customPresets: keep });
  if (Array.isArray(setup.layout)) saveLayout(setup.layout as Parameters<typeof saveLayout>[0]);
  window.setTimeout(() => window.location.reload(), 350);
}

export function deleteSetup(id: string): void {
  store(setups.filter((setup) => setup.id !== id));
}

export function getSavedSetups(): Setup[] {
  return setups;
}

export function useSetups(): Setup[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => setups,
  );
}

/** Downloads the current setup as a .json file. */
export function exportSetup(name = 'My Vantage setup'): void {
  const file: SetupFile = { app: 'vantage-os', kind: 'setup', version: 1, setup: current(name) };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** Reads an exported file. Throws a plain-words error if it isn't one. */
export async function readSetupFile(file: Blob): Promise<Omit<Setup, 'id'>> {
  let parsed: Partial<SetupFile>;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("This file isn't a Vantage setup.");
  }
  if (parsed?.app !== 'vantage-os' || parsed.kind !== 'setup' || !parsed.setup?.settings) {
    throw new Error("This file isn't a Vantage setup.");
  }
  return { ...parsed.setup, settings: sanitizeSettings(parsed.setup.settings) };
}

const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

/**
 * "Surprise me": a random theme in the current appearance, a random
 * wallpaper, and sometimes a different accent. Retro mode stays retro.
 */
export function surpriseMe(): void {
  const settings = getSettings();
  const wallpapers: WallpaperConfig[] = [
    ...LIVE_WALLPAPERS.map(({ id }) => ({ kind: 'live' as const, id })),
    ...GRADIENTS.map(({ id }) => ({ kind: 'gradient' as const, id })),
    { kind: 'theme' },
  ];
  const accent = Math.random() < 0.3 ? pick(SUGGESTED_ACCENTS) : null;

  if (settings.mode === 'retro') {
    updateSettings({ retroTheme: pick(presetsIn('retro').filter((p) => p.id !== settings.retroTheme)).id });
    return;
  }
  const light = settings.appearance === 'light';
  const group = light ? 'light' : 'dark';
  const currentId = light ? settings.lightTheme : settings.darkTheme;
  const theme = pick(presetsIn(group).filter((p) => p.id !== currentId)).id;
  updateSettings({
    ...(light ? { lightTheme: theme } : { darkTheme: theme }),
    wallpaper: pick(wallpapers),
    accent,
    matchWallpaper: false,
  });
}

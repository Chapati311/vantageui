import { useSyncExternalStore } from 'react';
import { isHexColor } from '../theme/color';
import {
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  DEFAULT_RETRO_THEME,
  PRESETS,
  presetsIn,
} from '../theme/presets';
import { isWallpaperConfig, type WallpaperConfig } from '../theme/wallpapers';

export type ModeId = 'clean' | 'focus' | 'retro' | 'winddown';
export type Appearance = 'dark' | 'light' | 'auto';
export type WidgetStyle = 'solid' | 'glass' | 'outline' | 'tinted';
export const LOCK_CLOCK_STYLES = ['dot', 'pixel', 'serif', 'vertical', 'analog', 'flip', 'binary', 'word'] as const;
export type LockClockStyle = (typeof LOCK_CLOCK_STYLES)[number];
export type BatteryStyle = 'percent' | 'ring' | 'bar' | 'pixel';
export type UiFont = 'inter' | 'system' | 'serif' | 'mono';
export type IconShape = 'circle' | 'squircle' | 'square';
export type IconStyle = 'outline' | 'filled' | 'tinted';

/** A look the user saved under their own name. */
export interface CustomPreset {
  id: string;
  name: string;
  darkTheme: string;
  lightTheme: string;
  appearance: Appearance;
  accent: string | null;
  matchWallpaper: boolean;
  wallpaper: WallpaperConfig;
  widgetStyle: WidgetStyle;
  widgetOpacity: number;
  cornerRadius: number;
}

/** Everything that is remembered on the device. */
export interface Settings {
  // ---- Theme
  /**
   * The theme used in dark mode, in light mode and in Retro mode (preset ids,
   * see theme/presets.ts). "appearance" picks dark or light; Retro mode always
   * uses the retro theme.
   */
  darkTheme: string;
  lightTheme: string;
  retroTheme: string;
  appearance: Appearance;
  /** In automatic mode: follow the sun in Zurich, or fixed hours */
  autoBy: 'sunset' | 'schedule';
  /** Fixed hours for automatic mode (0-23) */
  lightFrom: number;
  darkFrom: number;
  /** Accent color as hex, or null = the preset's own accent */
  accent: string | null;
  /** Take the accent and the tint of all surfaces from the wallpaper */
  matchWallpaper: boolean;
  customPresets: CustomPreset[];

  // ---- Wallpaper
  wallpaper: WallpaperConfig;
  /** On the home screen: darken (0-0.8) and blur (0-24 px) the wallpaper */
  homeDim: number;
  homeBlur: number;

  // ---- Lock screen
  lockClockStyle: LockClockStyle;
  lockClockSize: 'small' | 'large';
  /** Where the clock sits: near the top, or in the middle */
  lockClockPosition: 'top' | 'center';
  /** How the battery is shown in the status rows */
  batteryStyle: BatteryStyle;

  // ---- Home screen, icons, fonts
  /** How the page indicator above the dock looks */
  pageDots: 'dots' | 'numbers' | 'hidden';
  iconShape: IconShape;
  iconStyle: IconStyle;
  uiFont: UiFont;

  // ---- System pieces
  /** Play the dotted V boot animation when the app starts */
  bootAnimation: boolean;
  /** Passcode keys: dot-matrix digits or plain numbers */
  keypadStyle: 'dots' | 'plain';
  /** Lock screen notifications: show the count, or nothing */
  lockNotifications: 'count' | 'hidden';
  /** What the live pill may show */
  pillTimer: boolean;
  pillStopwatch: boolean;
  pillRecording: boolean;
  /** Brightness in the control center: round dial or straight slider */
  controlStyle: 'dial' | 'slider';
  /** 0 = no bounce, 1 = bouncy springs */
  springBounce: number;
  /** Lock screen wallpaper lags behind the swipe a little */
  parallax: boolean;
  /** Per app: open the Vantage version, or the original iPhone app */
  appStyles: Record<string, 'vantage' | 'original'>;

  // ---- Widgets
  widgetStyle: WidgetStyle;
  /** 0.4-1 */
  widgetOpacity: number;
  /** Corner roundness of square widgets in px, 12-36 */
  cornerRadius: number;

  // ---- Text and motion
  /** 0.85-1.3 */
  textScale: number;
  boldText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  /** 0.6 (slow) - 1.6 (fast) */
  animationSpeed: number;

  // ---- Sound
  soundsEnabled: boolean;
  /** 0-1 */
  soundVolume: number;

  // ---- Other
  /** Clean (normal), Focus (grayscale), Retro (old phone) or Wind Down (warm, dimmer) */
  mode: ModeId;
  /** When Wind Down started (ms), for the slow dimming */
  windDownSince: number | null;
  // Quick settings. For now these only change how the toggles look.
  wifi: boolean;
  bluetooth: boolean;
  flashlight: boolean;
  doNotDisturb: boolean;
  /** 0 = darkest, 1 = brightest */
  brightness: number;
}

export const DEFAULT_SETTINGS: Settings = {
  darkTheme: DEFAULT_DARK_THEME,
  lightTheme: DEFAULT_LIGHT_THEME,
  retroTheme: DEFAULT_RETRO_THEME,
  appearance: 'dark',
  autoBy: 'sunset',
  lightFrom: 7,
  darkFrom: 19,
  accent: null,
  matchWallpaper: false,
  customPresets: [],
  wallpaper: { kind: 'theme' },
  homeDim: 0.35,
  homeBlur: 0,
  lockClockStyle: 'dot',
  lockClockSize: 'large',
  lockClockPosition: 'top',
  batteryStyle: 'percent',
  pageDots: 'dots',
  iconShape: 'circle',
  iconStyle: 'outline',
  uiFont: 'inter',
  bootAnimation: true,
  keypadStyle: 'dots',
  lockNotifications: 'count',
  pillTimer: true,
  pillStopwatch: true,
  pillRecording: true,
  controlStyle: 'dial',
  springBounce: 0,
  parallax: true,
  appStyles: {},
  widgetStyle: 'solid',
  widgetOpacity: 1,
  cornerRadius: 28,
  textScale: 1,
  boldText: false,
  highContrast: false,
  reduceMotion: false,
  animationSpeed: 1,
  soundsEnabled: true,
  soundVolume: 0.5,
  mode: 'clean',
  windDownSince: null,
  wifi: true,
  bluetooth: false,
  flashlight: false,
  doNotDisturb: false,
  brightness: 0.7,
};

export const SETTINGS_STORAGE_KEY = 'vantage.settings.v1';

const OLD_ACCENTS: Record<string, string | null> = {
  mint: null,
  amber: '#fbbf24',
  coral: '#fb7185',
  violet: '#a78bfa',
  sky: '#38bdf8',
};

const between = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback;

const bool = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);

/**
 * Turns anything (saved settings from an older version, an imported file)
 * into valid settings. Unknown or broken values fall back to the default.
 */
export function sanitizeSettings(input: unknown): Settings {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;

  // Older versions stored these differently
  let wallpaper: WallpaperConfig = d.wallpaper;
  if (isWallpaperConfig(raw.wallpaper)) wallpaper = raw.wallpaper;
  else if (raw.wallpaper === 'orbit' || raw.wallpaper === 'dots') wallpaper = { kind: 'live', id: 'orbit' };
  else if (raw.wallpaper === 'plain') wallpaper = { kind: 'solid', color: 'bg' };

  let accent: string | null = d.accent;
  if (isHexColor(raw.accent)) accent = raw.accent;
  else if (typeof raw.accent === 'string' && raw.accent in OLD_ACCENTS) accent = OLD_ACCENTS[raw.accent];

  let appearance = oneOf(raw.appearance, ['dark', 'light', 'auto'] as const, d.appearance);
  if (raw.appearance === undefined && raw.lightMode === true) appearance = 'light';

  const darkIds = presetsIn('dark').map((preset) => preset.id);
  const lightIds = presetsIn('light').map((preset) => preset.id);
  const retroIds = presetsIn('retro').map((preset) => preset.id);
  // An older version stored a single "theme"
  const oldTheme = PRESETS.find((preset) => preset.id === raw.theme);
  const customPresets = Array.isArray(raw.customPresets)
    ? (raw.customPresets as unknown[])
        .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
        .filter((p) => typeof p.id === 'string' && typeof p.name === 'string')
        .map((p) => ({
          id: p.id as string,
          name: (p.name as string).slice(0, 24),
          darkTheme: oneOf(p.darkTheme, darkIds, d.darkTheme),
          lightTheme: oneOf(p.lightTheme, lightIds, d.lightTheme),
          appearance: oneOf(p.appearance, ['dark', 'light', 'auto'] as const, d.appearance),
          accent: isHexColor(p.accent) ? p.accent : null,
          matchWallpaper: bool(p.matchWallpaper, false),
          wallpaper: isWallpaperConfig(p.wallpaper) ? p.wallpaper : d.wallpaper,
          widgetStyle: oneOf(p.widgetStyle, ['solid', 'glass', 'outline', 'tinted'] as const, d.widgetStyle),
          widgetOpacity: between(p.widgetOpacity, 0.4, 1, d.widgetOpacity),
          cornerRadius: between(p.cornerRadius, 12, 36, d.cornerRadius),
        }))
    : [];

  return {
    darkTheme: oneOf(raw.darkTheme, darkIds, oldTheme?.group === 'dark' ? oldTheme.id : d.darkTheme),
    lightTheme: oneOf(raw.lightTheme, lightIds, oldTheme?.group === 'light' ? oldTheme.id : d.lightTheme),
    retroTheme: oneOf(raw.retroTheme, retroIds, d.retroTheme),
    appearance,
    autoBy: oneOf(raw.autoBy, ['sunset', 'schedule'] as const, d.autoBy),
    lightFrom: Math.round(between(raw.lightFrom, 0, 23, d.lightFrom)),
    darkFrom: Math.round(between(raw.darkFrom, 0, 23, d.darkFrom)),
    accent,
    matchWallpaper: bool(raw.matchWallpaper, d.matchWallpaper),
    customPresets,
    wallpaper,
    homeDim: between(raw.homeDim, 0, 0.8, d.homeDim),
    homeBlur: between(raw.homeBlur, 0, 24, d.homeBlur),
    lockClockStyle: oneOf(raw.lockClockStyle, LOCK_CLOCK_STYLES, d.lockClockStyle),
    lockClockSize: oneOf(raw.lockClockSize, ['small', 'large'] as const, d.lockClockSize),
    lockClockPosition: oneOf(raw.lockClockPosition, ['top', 'center'] as const, d.lockClockPosition),
    batteryStyle: oneOf(raw.batteryStyle, ['percent', 'ring', 'bar', 'pixel'] as const, d.batteryStyle),
    pageDots: oneOf(raw.pageDots, ['dots', 'numbers', 'hidden'] as const, d.pageDots),
    iconShape: oneOf(raw.iconShape, ['circle', 'squircle', 'square'] as const, d.iconShape),
    iconStyle: oneOf(raw.iconStyle, ['outline', 'filled', 'tinted'] as const, d.iconStyle),
    uiFont: oneOf(raw.uiFont, ['inter', 'system', 'serif', 'mono'] as const, d.uiFont),
    bootAnimation: bool(raw.bootAnimation, d.bootAnimation),
    keypadStyle: oneOf(raw.keypadStyle, ['dots', 'plain'] as const, d.keypadStyle),
    lockNotifications: oneOf(raw.lockNotifications, ['count', 'hidden'] as const, d.lockNotifications),
    pillTimer: bool(raw.pillTimer, d.pillTimer),
    pillStopwatch: bool(raw.pillStopwatch, d.pillStopwatch),
    pillRecording: bool(raw.pillRecording, d.pillRecording),
    controlStyle: oneOf(raw.controlStyle, ['dial', 'slider'] as const, d.controlStyle),
    springBounce: between(raw.springBounce, 0, 1, d.springBounce),
    parallax: bool(raw.parallax, d.parallax),
    appStyles:
      raw.appStyles && typeof raw.appStyles === 'object'
        ? Object.fromEntries(
            Object.entries(raw.appStyles as Record<string, unknown>).filter(([, value]) => value === 'vantage' || value === 'original'),
          ) as Record<string, 'vantage' | 'original'>
        : {},
    widgetStyle: oneOf(raw.widgetStyle, ['solid', 'glass', 'outline', 'tinted'] as const, d.widgetStyle),
    widgetOpacity: between(raw.widgetOpacity, 0.4, 1, d.widgetOpacity),
    cornerRadius: between(raw.cornerRadius, 12, 36, d.cornerRadius),
    textScale: between(raw.textScale, 0.85, 1.3, d.textScale),
    boldText: bool(raw.boldText, d.boldText),
    highContrast: bool(raw.highContrast, d.highContrast),
    reduceMotion: bool(raw.reduceMotion, d.reduceMotion),
    animationSpeed: between(raw.animationSpeed, 0.6, 1.6, d.animationSpeed),
    soundsEnabled: bool(raw.soundsEnabled, d.soundsEnabled),
    soundVolume: between(raw.soundVolume, 0, 1, d.soundVolume),
    mode: oneOf(raw.mode, ['clean', 'focus', 'retro', 'winddown'] as const, d.mode),
    windDownSince: typeof raw.windDownSince === 'number' ? raw.windDownSince : null,
    wifi: bool(raw.wifi, d.wifi),
    bluetooth: bool(raw.bluetooth, d.bluetooth),
    flashlight: bool(raw.flashlight, d.flashlight),
    doNotDisturb: bool(raw.doNotDisturb, d.doNotDisturb),
    brightness: between(raw.brightness, 0, 1, d.brightness),
  };
}

function load(): Settings {
  try {
    return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}'));
  } catch {
    return DEFAULT_SETTINGS;
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

/** Changes several settings at once (one save, one redraw). */
export function updateSettings(patch: Partial<Settings>): void {
  settings = sanitizeSettings({ ...settings, ...patch });
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or blocked: the setting still works until reload.
  }
  listeners.forEach((notify) => notify());
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  updateSettings({ [key]: value } as Partial<Settings>);
}

/** Like useState, but for one saved setting: `const [on, setOn] = useSetting('wifi')`. */
export function useSetting<K extends keyof Settings>(
  key: K,
): [Settings[K], (value: Settings[K]) => void] {
  const value = useSyncExternalStore(subscribe, () => settings[key]);
  return [value, (next) => setSetting(key, next)];
}

/** All settings at once (re-renders on any change - use sparingly). */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, () => settings);
}

// ---- Presets ----------------------------------------------------------------

/**
 * Switches to a built-in preset. A dark or light theme becomes the theme for
 * that mode (and switches to it, unless the mode is automatic). A retro theme
 * turns on Retro mode. The accent and wallpaper go back to the preset's own.
 */
export function applyPreset(id: string): void {
  const preset = PRESETS.find((p) => p.id === id);
  if (!preset) return;
  const common = { accent: null, matchWallpaper: false, wallpaper: { kind: 'theme' } as WallpaperConfig };
  if (preset.group === 'retro') {
    updateSettings({ ...common, retroTheme: preset.id, mode: 'retro' });
    return;
  }
  updateSettings({
    ...common,
    [preset.group === 'dark' ? 'darkTheme' : 'lightTheme']: preset.id,
    appearance: settings.appearance === 'auto' ? 'auto' : preset.group,
    // Leaving Retro mode when a modern theme is chosen
    mode: settings.mode === 'retro' ? 'clean' : settings.mode,
  });
}

/** Switches mode. Wind Down remembers when it started, for the slow dimming. */
export function setMode(mode: ModeId): void {
  // Focus mode can lock itself for a while (Focus home > Lock 30 min)
  if (settings.mode === 'focus' && mode !== 'focus' && Number(localStorage.getItem('vantage.focusLock.v1')) > Date.now()) return;
  updateSettings({ mode, windDownSince: mode === 'winddown' ? Date.now() : null });
}

/** Saves the current look under a name. */
export function saveCustomPreset(name: string): void {
  const s = settings;
  const preset: CustomPreset = {
    id: `custom-${Date.now().toString(36)}`,
    name: name.trim().slice(0, 24) || 'My look',
    darkTheme: s.darkTheme,
    lightTheme: s.lightTheme,
    appearance: s.appearance,
    accent: s.accent,
    matchWallpaper: s.matchWallpaper,
    wallpaper: s.wallpaper,
    widgetStyle: s.widgetStyle,
    widgetOpacity: s.widgetOpacity,
    cornerRadius: s.cornerRadius,
  };
  updateSettings({ customPresets: [...s.customPresets, preset] });
}

export function applyCustomPreset(id: string): void {
  const preset = settings.customPresets.find((p) => p.id === id);
  if (!preset) return;
  updateSettings({
    darkTheme: preset.darkTheme,
    lightTheme: preset.lightTheme,
    appearance: preset.appearance,
    accent: preset.accent,
    matchWallpaper: preset.matchWallpaper,
    wallpaper: preset.wallpaper,
    widgetStyle: preset.widgetStyle,
    widgetOpacity: preset.widgetOpacity,
    cornerRadius: preset.cornerRadius,
  });
}

export function deleteCustomPreset(id: string): void {
  updateSettings({ customPresets: settings.customPresets.filter((p) => p.id !== id) });
}

/** Replaces every setting (used when importing a backup). */
export function replaceAllSettings(next: unknown): void {
  settings = DEFAULT_SETTINGS;
  updateSettings(sanitizeSettings(next));
}

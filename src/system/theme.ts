import { useSyncExternalStore } from 'react';
import {
  contrast,
  hexToRgb,
  hslToRgb,
  isHexColor,
  mix,
  rgbToHex,
  rgbToHsl,
  rgbTriplet,
  rgba,
  type RGB,
} from '../theme/color';
import {
  AURORA_COLORS,
  STATUS_COLORS,
  WIND_DOWN,
  getPreset,
  paletteOf,
  type Palette,
  type RetroStyle,
  type ThemeGroup,
  type ThemePreset,
} from '../theme/presets';
import { setRetroMotion } from '../theme/tokens';
import { gradientStops, type WallpaperConfig } from '../theme/wallpapers';
import { getSettings, subscribeToSettings, type ModeId, type Settings } from './settingsStore';
import { sunTimes } from './sun';
import {
  getWallpaperPhoto,
  subscribeToWallpaperPhoto,
  type WallpaperColors,
} from './wallpaperPhoto';

/**
 * THE THEME ENGINE.
 * It works out every color, font, size and timing from the settings (the
 * dark / light / retro theme, automatic mode, the mode, the accent, the
 * wallpaper, widget style, text size, motion) and writes them as CSS
 * variables on <html>. Components only ever read those variables, so every
 * screen follows the theme by itself.
 */

/** Where "automatic" light/dark follows the sun. */
const SUN_PLACE = { latitude: 47.3769, longitude: 8.5417 }; // Zurich

/** What the rest of the app may want to know about the current theme. */
export interface ThemeState {
  presetId: string;
  presetName: string;
  group: ThemeGroup;
  dark: boolean;
  /** Retro themes draw the shell differently; null for modern themes */
  retro: RetroStyle | null;
  mode: ModeId;
  /** The wallpaper actually shown ("theme" is already replaced by the preset's) */
  wallpaper: WallpaperConfig;
  /** The colors of the "theme" gradient wallpaper */
  themeStops: string[];
  /** Colors found in the wallpaper, if it has any (photo, gradient, solid) */
  wallpaperColors: WallpaperColors | null;
  accent: string;
  bg: string;
  /** When automatic mode switches next (for Settings), or null */
  nextSwitch: Date | null;
}

// ---- Which theme is active -------------------------------------------------------

/** Is it dark mode right now, and when does that change next? */
export function darkNow(s: Settings, now = new Date()): { dark: boolean; nextSwitch: Date | null } {
  if (s.appearance !== 'auto') return { dark: s.appearance === 'dark', nextSwitch: null };

  if (s.autoBy === 'sunset') {
    const today = sunTimes(now, SUN_PLACE.latitude, SUN_PLACE.longitude);
    if (now < today.sunrise) return { dark: true, nextSwitch: today.sunrise };
    if (now < today.sunset) return { dark: false, nextSwitch: today.sunset };
    const tomorrow = sunTimes(new Date(now.getTime() + 86_400_000), SUN_PLACE.latitude, SUN_PLACE.longitude);
    return { dark: true, nextSwitch: tomorrow.sunrise };
  }

  // Fixed hours: light from `lightFrom` until `darkFrom`
  const hour = now.getHours() + now.getMinutes() / 60;
  const { lightFrom, darkFrom } = s;
  const light =
    lightFrom <= darkFrom ? hour >= lightFrom && hour < darkFrom : hour >= lightFrom || hour < darkFrom;
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(light ? darkFrom : lightFrom);
  if (next <= now) next.setDate(next.getDate() + 1);
  return { dark: !light, nextSwitch: next };
}

/** The preset in use right now. */
export function activePreset(s: Settings, now = new Date()): ThemePreset {
  if (s.mode === 'retro') return getPreset(s.retroTheme);
  return getPreset(darkNow(s, now).dark ? s.darkTheme : s.lightTheme);
}

// ---- Wallpaper ------------------------------------------------------------------

/** "Theme" wallpaper means the preset's own one. Retro themes always use their own. */
export function resolveWallpaper(s: Settings, preset: ThemePreset): WallpaperConfig {
  if (preset.group === 'retro' || s.wallpaper.kind === 'theme') return preset.wallpaper;
  // No photo saved (yet, or it was deleted): fall back to the preset's wallpaper
  if (s.wallpaper.kind === 'photo' && !getWallpaperPhoto()) return preset.wallpaper;
  return s.wallpaper;
}

/** The colors in a wallpaper, for "Colors from wallpaper". Live wallpapers have none. */
function colorsOf(wallpaper: WallpaperConfig, dark: boolean, themeStops: string[]): WallpaperColors | null {
  if (wallpaper.kind === 'photo') return getWallpaperPhoto()?.colors ?? null;
  if (wallpaper.kind === 'solid' && wallpaper.color !== 'bg') {
    return { dominant: wallpaper.color, vibrant: wallpaper.color, swatches: [] };
  }
  if (wallpaper.kind === 'gradient') {
    const stops = gradientStops(wallpaper.id, dark, themeStops).map(hexToRgb);
    const vibrant = [...stops].sort((a, b) => rgbToHsl(b)[1] - rgbToHsl(a)[1])[0];
    return {
      dominant: rgbToHex(stops[Math.floor(stops.length / 2)]),
      vibrant: rgbToHex(vibrant),
      swatches: stops.map(rgbToHex),
    };
  }
  return null;
}

/**
 * Makes a color readable as an accent on this background: it is brightened
 * (dark themes) or darkened (light themes) until it stands out at least 3:1.
 */
export function readableAccent(color: RGB, bg: RGB, dark: boolean): RGB {
  const [h, s0, l0] = rgbToHsl(color);
  const s = Math.max(s0, 0.4);
  let l = l0;
  let result = hslToRgb(h, s, l);
  for (let step = 0; step < 40 && contrast(result, bg) < 3; step++) {
    l = Math.min(0.95, Math.max(0.05, l + (dark ? 0.02 : -0.02)));
    result = hslToRgb(h, s, l);
  }
  return result;
}

// ---- Turning it all into CSS variables -----------------------------------------------

const gray = (c: RGB): RGB => {
  const y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return [y, y, y];
};

/** The UI fonts you can pick in Customise > Fonts. */
const UI_FONTS = {
  inter: "'Inter Variable', system-ui, sans-serif",
  system: "-apple-system, system-ui, 'Helvetica Neue', sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

export function computeTheme(s: Settings, now = new Date()) {
  const preset = activePreset(s, now);
  const retro = preset.retro?.style ?? null;
  const { nextSwitch } = darkNow(s, now);
  let palette: Palette = paletteOf(preset);
  const dark = palette.dark;
  const focus = s.mode === 'focus' && !retro;

  // The "theme" gradient (needed before matching, for gradient wallpapers)
  const stopsFor = (accent: RGB) =>
    dark
      ? [rgbToHex(palette.bg), rgbToHex(mix(palette.bg, accent, 0.1)), rgbToHex(mix(palette.bg, accent, 0.26))]
      : [rgbToHex(palette.bg), rgbToHex(mix(palette.bg, accent, 0.07)), rgbToHex(mix(palette.bg, accent, 0.16))];

  const wallpaper = resolveWallpaper(s, preset);
  let themeStops = stopsFor(palette.accent);
  const wallpaperColors = retro ? null : colorsOf(wallpaper, dark, themeStops);

  // Accent: from the wallpaper, chosen by the user, or the preset's own
  const matching = !retro && s.matchWallpaper && wallpaperColors !== null;
  let accent = palette.accent;
  if (matching) accent = readableAccent(hexToRgb(wallpaperColors.vibrant), palette.bg, dark);
  else if (!retro && s.accent && isHexColor(s.accent)) accent = hexToRgb(s.accent);

  // Colors from wallpaper: surfaces tinted 4% toward the accent
  if (matching) {
    const tint = (c: RGB) => mix(c, accent, 0.04);
    palette = {
      ...palette,
      surfaceTop: tint(palette.surfaceTop),
      surfaceBottom: tint(palette.surfaceBottom),
      surface: tint(palette.surface),
      raised: tint(palette.raised),
      surface3: tint(palette.surface3),
    };
  }

  // High contrast: secondary text closer to the main text, stronger lines
  if (s.highContrast) {
    palette = { ...palette, text3: palette.text2, text2: mix(palette.text2, palette.text, 0.45) };
  }

  // Focus mode: the whole theme in grayscale, the accent plain white (black on light)
  if (focus) {
    palette = {
      ...palette,
      bg: gray(palette.bg),
      surfaceTop: gray(palette.surfaceTop),
      surfaceBottom: gray(palette.surfaceBottom),
      surface: gray(palette.surface),
      raised: gray(palette.raised),
      surface3: gray(palette.surface3),
      text: gray(palette.text),
      text2: gray(palette.text2),
      text3: gray(palette.text3),
    };
    accent = dark ? [255, 255, 255] : [0, 0, 0];
  }
  themeStops = stopsFor(accent);

  // Text and glyphs on top of the accent: whichever of light or dark is clearer
  const darkInk: RGB = dark ? palette.bg : palette.text;
  const onAccent: RGB =
    contrast(accent, [255, 255, 255]) >= contrast(accent, darkInk) ? [255, 255, 255] : darkInk;

  const glow = retro || focus ? 0 : preset.glow * (dark ? 1 : 0.6);
  const hc = s.highContrast ? 2 : 1;
  const op = retro ? 1 : s.widgetOpacity;
  const line: RGB = dark ? [255, 255, 255] : [0, 0, 0];

  // ---- Widget surface, border and depth ----
  let surface: string;
  let border: string;
  let depth: string;
  let blur = 'none';

  if (retro === 'desktop') {
    // Classic Desktop: flat grey windows with a 3D bevel
    surface = preset.retro?.window ?? '#C0C0C0';
    border = '0 solid transparent';
    depth = 'inset -1px -1px #000000, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf';
  } else if (retro) {
    // LCD and terminal: flat screen color framed by a 2px ink line. No shadows.
    surface = rgbToHex(palette.surface);
    border = `2px solid ${rgbToHex(palette.text)}`;
    depth = 'none';
  } else {
    border = preset.shadowsOnly
      ? '1px solid transparent'
      : `1px solid ${rgba(line, (dark ? 0.06 : 0.08) * hc)}`;
    depth = dark
      ? `inset 0 1px 0 ${rgba([255, 255, 255], 0.05)}`
      : `inset 0 1px 0 ${rgba([255, 255, 255], 0.7)}, 0 1px 2px rgb(0 0 0 / 0.06)${preset.shadowsOnly ? ', 0 4px 12px rgb(0 0 0 / 0.05)' : ''}`;
    switch (s.widgetStyle) {
      case 'glass':
        surface = rgba(palette.surfaceTop, (dark ? 0.42 : 0.55) * op + 0.08);
        border = `1px solid ${rgba(line, (dark ? 0.12 : 0.1) * hc)}`;
        blur = 'blur(16px) saturate(140%)';
        break;
      case 'outline':
        surface = 'transparent';
        border = `1px solid ${rgba(line, Math.min(1, (dark ? 0.24 : 0.2) * hc))}`;
        depth = 'none';
        break;
      case 'tinted':
        surface = `linear-gradient(180deg, ${rgba(mix(palette.surfaceTop, accent, dark ? 0.16 : 0.12), op)} 0%, ${rgba(mix(palette.surfaceBottom, accent, dark ? 0.1 : 0.08), op)} 100%)`;
        break;
      default:
        surface = `linear-gradient(180deg, ${rgba(palette.surfaceTop, op)} 0%, ${rgba(palette.surfaceBottom, op)} 100%)`;
    }
  }

  // Retro fonts look smaller for their size, so their text is scaled up
  const fontScale = s.textScale * (retro ? 1.3 : 1);
  const text = (px: number) => `${Math.round(px * fontScale)}px`;
  const speed = s.animationSpeed;
  const status = STATUS_COLORS[dark ? 'dark' : 'light'];

  // Wind Down: the warm layer, and the screen dimming to 80% over 10 minutes
  const windDown = s.mode === 'winddown';
  const windElapsed = windDown && s.windDownSince ? (now.getTime() - s.windDownSince) / 60_000 : 0;
  const windDim = windDown ? Math.min(1, windElapsed / WIND_DOWN.minutes) * (1 - WIND_DOWN.dimTo) : 0;

  const vars: Record<string, string> = {
    '--color-bg': rgbToHex(palette.bg),
    '--surface-widget': surface,
    '--border-widget': border,
    '--highlight-top': depth,
    '--widget-blur': blur,
    '--glass-blur': retro ? 'none' : 'blur(14px)',
    '--color-surface': rgbToHex(palette.surface),
    '--color-surface-2': rgbToHex(palette.raised),
    '--color-surface-3': rgbToHex(palette.surface3),
    '--color-hairline': retro ? rgba(palette.text, 0.4) : rgba(line, Math.min(1, 0.12 * hc)),
    '--glass-bg': retro ? rgbToHex(palette.surface) : rgba(palette.surfaceBottom, 0.72),
    '--text-primary': rgbToHex(palette.text),
    '--text-secondary': rgbToHex(palette.text2),
    '--text-tertiary': rgbToHex(palette.text3),

    '--accent-rgb': rgbTriplet(accent),
    '--color-accent': rgbToHex(accent),
    '--color-accent-from': rgbToHex(retro ? accent : mix(accent, [255, 255, 255], 0.35)),
    '--color-accent-to': rgbToHex(retro ? accent : mix(accent, [0, 0, 0], 0.2)),
    '--gradient-accent': retro
      ? rgbToHex(accent)
      : `linear-gradient(135deg, ${rgbToHex(mix(accent, [255, 255, 255], 0.35))}, ${rgbToHex(mix(accent, [0, 0, 0], 0.2))})`,
    '--color-on-accent': rgbToHex(onAccent),
    '--glow-accent': glow > 0 ? `0 0 24px ${rgba(accent, 0.35 * glow)}` : 'none',
    '--glow-accent-filter': glow > 0 ? `drop-shadow(0 0 5px ${rgba(accent, 0.7 * glow)})` : 'none',

    // Status colors (SPECS.md). A retro screen only has its ink, so status is drawn in ink there.
    '--status-good': retro ? rgbToHex(palette.text) : status.good,
    '--status-warn': retro ? rgbToHex(palette.text) : status.warn,
    '--status-bad': retro ? rgbToHex(palette.text) : status.bad,

    // Unlit "ghost" dots and pixels: 7% for LED dots, 10% for LCD pixels
    '--ghost': retro ? '0.1' : '0.07',

    // Aurora wallpaper glows (fixed colors from SPECS.md)
    '--aurora-1': rgba(hexToRgb(AURORA_COLORS[0]), dark ? 0.5 : 0.35),
    '--aurora-2': rgba(hexToRgb(AURORA_COLORS[1]), dark ? 0.45 : 0.32),
    '--aurora-3': rgba(hexToRgb(AURORA_COLORS[2]), dark ? 0.35 : 0.28),

    // Home screen wallpaper treatment, and a scrim for text on top of photos
    '--wallpaper-dim': rgba(palette.bg, retro ? 0 : s.homeDim),
    '--wallpaper-blur': `${retro ? 0 : s.homeBlur}px`,
    '--scrim': rgba(palette.bg, 0.55),

    // Wind Down (SPECS.md: warm amber layer, screen to 80% over 10 minutes)
    '--winddown-warm': windDown ? rgba(hexToRgb(WIND_DOWN.color), WIND_DOWN.alpha) : 'transparent',
    '--winddown-dim': String(Math.round(windDim * 1000) / 1000),

    // Shapes: retro has no rounded corners at all
    '--radius-widget': retro ? '0px' : `${Math.round(s.cornerRadius)}px`,
    '--radius-pill': retro ? '0px' : '999px',
    '--radius-circle': retro ? '0px' : '50%',

    // Fonts: retro uses pixel fonts (VT323 for text, Press Start 2P for labels and titles)
    '--font-body': retro ? "'VT323', ui-monospace, monospace" : UI_FONTS[s.uiFont],
    '--font-display': retro ? "'Press Start 2P', ui-monospace, monospace" : "'Doto Variable', ui-monospace, monospace",
    '--font-serif': retro ? "'Press Start 2P', ui-monospace, monospace" : "'Instrument Serif', Georgia, serif",
    '--font-label': retro ? "'Press Start 2P', ui-monospace, monospace" : UI_FONTS[s.uiFont === 'serif' ? 'inter' : s.uiFont],

    '--text-11': retro ? '8px' : text(11),
    '--text-13': text(13),
    '--text-15': text(15),
    '--text-17': text(17),
    '--text-22': text(22),
    '--serif-34': retro ? '16px' : text(34),
    '--label-tracking': retro ? '0em' : '0.12em',

    '--fade-fast': `${Math.round(150 / speed)}ms`,
    '--fade-normal': `${Math.round(250 / speed)}ms`,

    // Classic Desktop: navy title bars and grey windows
    '--retro-title': preset.retro?.titleBar ?? rgbToHex(palette.text),
    '--retro-window': preset.retro?.window ?? rgbToHex(palette.surface),
    // Text on the teal desktop, and the four bevel shades of a 3D button
    // Where apps, search and settings are drawn (Classic Desktop: inside a grey window)
    '--app-bg': retro === 'desktop' ? (preset.retro?.window ?? '#C0C0C0') : rgbToHex(palette.bg),
    '--retro-on-desktop': retro === 'desktop' ? '#FFFFFF' : rgbToHex(palette.text),
    '--bevel-light': '#FFFFFF',
    '--bevel-mid': '#DFDFDF',
    '--bevel-dark': '#808080',
    '--bevel-darker': '#000000',
  };

  const state: ThemeState = {
    presetId: preset.id,
    presetName: preset.name,
    group: preset.group,
    dark,
    retro,
    mode: s.mode,
    wallpaper,
    themeStops,
    wallpaperColors,
    accent: rgbToHex(accent),
    bg: rgbToHex(palette.bg),
    nextSwitch,
  };
  return { vars, state };
}

// ---- Applying it to the page ---------------------------------------------------------

let state: ThemeState = computeTheme(getSettings()).state;
const listeners = new Set<() => void>();
let applied: Record<string, string> = {};
let frame = 0;
let started = false;

function setVars(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(vars)) {
    if (applied[name] !== value) root.style.setProperty(name, value);
  }
  applied = vars;
}

function apply() {
  frame = 0;
  const s = getSettings();
  const { vars, state: next } = computeTheme(s);
  const root = document.documentElement;

  // Changing theme, light/dark or accent crossfades over 300ms
  const major =
    started &&
    (applied['--color-bg'] !== vars['--color-bg'] ||
      applied['--color-accent'] !== vars['--color-accent'] ||
      state.retro !== next.retro);
  const reduce = quietChanges || s.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const update = () => {
    setVars(vars);
    root.dataset.theme = next.dark ? 'dark' : 'light';
    root.dataset.preset = next.presetId;
    root.dataset.mode = next.mode;
    if (next.retro) root.dataset.retro = next.retro;
    else delete root.dataset.retro;
    root.toggleAttribute('data-bold', s.boldText);
    root.toggleAttribute('data-contrast', s.highContrast);
    root.toggleAttribute('data-reduce-motion', s.reduceMotion);
    root.dataset.iconShape = s.iconShape;
    root.dataset.iconStyle = s.iconStyle;
    setRetroMotion(next.retro !== null);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next.bg);
  };

  const doc = document as Document & { startViewTransition?: (callback: () => void) => { ready: Promise<void> } };
  if (major && !reduce && doc.startViewTransition) {
    // The new theme spreads out in a circle from the last tap
    const transition = doc.startViewTransition(update);
    const { x, y } = lastTap;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 520, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => {});
  } else if (major && !reduce) {
    root.classList.add('theme-fading');
    update();
    window.setTimeout(() => root.classList.remove('theme-fading'), 320);
  } else {
    update();
  }

  started = true;
  if (JSON.stringify(next) !== JSON.stringify(state)) {
    state = next;
    listeners.forEach((listener) => listener());
  }
}

/** Re-applies on the next frame (many quick changes, e.g. a slider, become one). */
function scheduleApply() {
  if (!frame) frame = requestAnimationFrame(apply);
}

/** While true, theme changes apply instantly (e.g. the "Surprise me" reel spinning). */
let quietChanges = false;
export function setQuietThemeChanges(quiet: boolean): void {
  quietChanges = quiet;
}

/** Where the finger last touched, so a theme change can grow from there. */
const lastTap = { x: innerWidth / 2, y: innerHeight / 2 };

/** Call once at startup. */
export function initTheme(): void {
  window.addEventListener(
    'pointerdown',
    (event) => {
      lastTap.x = event.clientX;
      lastTap.y = event.clientY;
    },
    { capture: true, passive: true },
  );
  apply();
  subscribeToSettings(scheduleApply);
  subscribeToWallpaperPhoto(scheduleApply);
  // Automatic mode and Wind Down dimming: check every minute, and when the phone wakes up
  window.setInterval(scheduleApply, 60_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleApply();
  });
}

export function getThemeState(): ThemeState {
  return state;
}

export function useTheme(): ThemeState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

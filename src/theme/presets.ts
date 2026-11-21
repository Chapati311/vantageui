import { contrast, hexToRgb, mix, rgbToHex, type RGB } from './color';
import type { WallpaperConfig } from './wallpapers';

/**
 * THE 21 THEME PRESETS, exactly as in SPECS.md section 1.
 * Every preset gives the same set of colors, so every screen works in
 * every theme. The theme engine (src/system/theme.ts) turns them into
 * CSS variables.
 */

export type ThemeGroup = 'dark' | 'light' | 'retro' | 'hacker';

/** How a retro theme draws the home and lock screens (see src/shell/retro) */
export type RetroStyle = 'phone' | 'terminal' | 'desktop';

export interface ThemePreset {
  id: string;
  name: string;
  group: ThemeGroup;
  /** One short word for the accent, shown in the theme list */
  accentName: string;
  bg: string;
  surface: string;
  /** Raised surface (cards on top of cards, pressed controls) */
  raised: string;
  text: string;
  text2: string;
  accent: string;
  /** The wallpaper "Theme" means for this preset */
  wallpaper: WallpaperConfig;
  /** Soft glow around accent elements, 0 (none) to 1 */
  glow: number;
  /** Paper: shadows instead of borders */
  shadowsOnly?: boolean;
  /** One of the 10 signature theme packs (more than colors: see theme/packs.ts) */
  signature?: boolean;
  /** Retro themes only */
  retro?: {
    style: RetroStyle;
    /** Classic Desktop: navy title bars and grey bevelled windows */
    titleBar?: string;
    window?: string;
  };
}

export const PRESETS: ThemePreset[] = [
  // ---- Hacker mode (HACKER_MODE.md 1): terminal colours on a modern UI ----
  {
    id: 'hk-green',
    name: 'Green Terminal',
    group: 'hacker',
    accentName: 'phosphor',
    bg: '#020A04',
    surface: '#06140A',
    raised: '#0B2213',
    text: '#B8FFCB',
    text2: '#4FD27A',
    accent: '#33FF66',
    wallpaper: { kind: 'live', id: 'coderain' },
    glow: 1,
  },
  {
    id: 'hk-amber',
    name: 'Amber CRT',
    group: 'hacker',
    accentName: 'amber',
    bg: '#0A0600',
    surface: '#150D02',
    raised: '#241604',
    text: '#FFE2A8',
    text2: '#D59A2A',
    accent: '#FFB000',
    wallpaper: { kind: 'live', id: 'coderain' },
    glow: 1,
  },
  {
    id: 'hk-cyan',
    name: 'Cyan Ice',
    group: 'hacker',
    accentName: 'ice',
    bg: '#02080A',
    surface: '#061418',
    raised: '#0B2228',
    text: '#C9FBFF',
    text2: '#47BFD0',
    accent: '#00E5FF',
    wallpaper: { kind: 'live', id: 'coderain' },
    glow: 1,
  },
  {
    id: 'hk-red',
    name: 'Red Team',
    group: 'hacker',
    accentName: 'red',
    bg: '#0A0303',
    surface: '#170707',
    raised: '#260C0C',
    text: '#FFD6D6',
    text2: '#E06666',
    accent: '#FF3B3B',
    wallpaper: { kind: 'live', id: 'coderain' },
    glow: 1,
  },
  {
    id: 'hk-ghost',
    name: 'Ghost',
    group: 'hacker',
    accentName: 'white',
    bg: '#000000',
    surface: '#0A0A0A',
    raised: '#161616',
    text: '#FFFFFF',
    text2: '#A6A6A6',
    accent: '#FFFFFF',
    wallpaper: { kind: 'solid', color: 'bg' },
    glow: 0,
  },
  // ---- Dark ---------------------------------------------------------------
  {
    id: 'midnight',
    name: 'Midnight',
    group: 'dark',
    accentName: 'mint',
    bg: '#06090D',
    surface: '#0E141A',
    raised: '#151C23',
    text: '#FFFFFF',
    text2: '#8A939C',
    accent: '#2DD4BF',
    wallpaper: { kind: 'live', id: 'orbit' },
    glow: 1,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    group: 'dark',
    accentName: 'aqua',
    bg: '#041416',
    surface: '#0A2226',
    raised: '#0F2E33',
    text: '#E8FBF8',
    text2: '#7FA7A6',
    accent: '#5EEAD4',
    wallpaper: { kind: 'live', id: 'waves' },
    glow: 1,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    group: 'dark',
    accentName: 'violet',
    bg: '#07070D',
    surface: '#11111A',
    raised: '#191926',
    text: '#F5F3FF',
    text2: '#9792AE',
    accent: '#A78BFA',
    wallpaper: { kind: 'live', id: 'aurora' },
    glow: 1,
  },
  {
    id: 'mono',
    name: 'Mono',
    group: 'dark',
    accentName: 'white',
    bg: '#000000',
    surface: '#0A0A0A',
    raised: '#141414',
    text: '#FFFFFF',
    text2: '#8C8C8C',
    accent: '#FFFFFF',
    wallpaper: { kind: 'solid', color: 'bg' },
    glow: 0,
  },
  {
    id: 'sunset',
    name: 'Sunset',
    group: 'dark',
    accentName: 'amber',
    bg: '#120A0A',
    surface: '#1C1111',
    raised: '#261716',
    text: '#FFF4EC',
    text2: '#B39486',
    accent: '#FB923C',
    wallpaper: { kind: 'live', id: 'sundown' },
    glow: 1,
  },
  {
    id: 'ember',
    name: 'Ember',
    group: 'dark',
    accentName: 'red-orange',
    bg: '#0C0807',
    surface: '#17100E',
    raised: '#201714',
    text: '#FFF1EA',
    text2: '#A88D80',
    accent: '#FF5A36',
    wallpaper: { kind: 'gradient', id: 'theme' },
    glow: 1,
  },
  {
    id: 'forest',
    name: 'Forest',
    group: 'dark',
    accentName: 'green',
    bg: '#070C09',
    surface: '#0F1A13',
    raised: '#15241A',
    text: '#ECF7EF',
    text2: '#86A08E',
    accent: '#4ADE80',
    wallpaper: { kind: 'gradient', id: 'theme' },
    glow: 1,
  },
  {
    id: 'nebula',
    name: 'Nebula',
    group: 'dark',
    accentName: 'pink',
    bg: '#0A0614',
    surface: '#140D24',
    raised: '#1C1333',
    text: '#F3EEFF',
    text2: '#A397C2',
    accent: '#F472B6',
    wallpaper: { kind: 'live', id: 'starfield' },
    glow: 1,
  },
  {
    id: 'arctic',
    name: 'Arctic',
    group: 'dark',
    accentName: 'ice blue',
    bg: '#050A14',
    surface: '#0C1626',
    raised: '#122036',
    text: '#EAF4FF',
    text2: '#8BA3C2',
    accent: '#7DD3FC',
    wallpaper: { kind: 'gradient', id: 'theme' },
    glow: 1,
  },
  {
    id: 'volt',
    name: 'Volt',
    group: 'dark',
    accentName: 'neon yellow',
    bg: '#05040A',
    surface: '#0F0D1A',
    raised: '#171428',
    text: '#F0F0FF',
    text2: '#8C88A8',
    accent: '#E8FF3A',
    wallpaper: { kind: 'live', id: 'starfield' },
    glow: 0.8,
  },

  // ---- Signature packs, dark (SPECS.md section 1b; the rest of each pack is in theme/packs.ts)
  { id: 'signal', name: 'Signal', group: 'dark', signature: true, accentName: 'red', bg: '#000000', surface: '#111111', raised: '#1A1A1A', text: '#FFFFFF', text2: '#8C8C8C', accent: '#E8312A', wallpaper: { kind: 'solid', color: 'bg' }, glow: 0 },
  { id: 'obsidian', name: 'Obsidian Leaf', group: 'dark', signature: true, accentName: 'red dot', bg: '#0B0B0B', surface: '#121212', raised: '#1B1B1B', text: '#F2F2F2', text2: '#8F8F8F', accent: '#FF3B30', wallpaper: { kind: 'image', id: 'obsidian' }, glow: 0.3 },
  { id: 'lacquer', name: 'Lacquer', group: 'dark', signature: true, accentName: 'white', bg: '#120204', surface: '#000000', raised: '#111111', text: '#FFFFFF', text2: '#C2A3A6', accent: '#FFFFFF', wallpaper: { kind: 'image', id: 'lacquer' }, glow: 0 },
  { id: 'popink', name: 'Pop Ink', group: 'dark', signature: true, accentName: 'coral', bg: '#000000', surface: '#141414', raised: '#1F1F1F', text: '#FFFFFF', text2: '#9A9A9A', accent: '#F2694A', wallpaper: { kind: 'solid', color: 'bg' }, glow: 0 },
  { id: 'nightreed', name: 'Night Reed', group: 'dark', signature: true, accentName: 'red', bg: '#050A07', surface: '#0A0A0A', raised: '#151515', text: '#FFFFFF', text2: '#8FA394', accent: '#FF453A', wallpaper: { kind: 'image', id: 'nightreed' }, glow: 0.2 },

  // ---- Light ----------------------------------------------------------------
  {
    id: 'paper',
    name: 'Paper',
    group: 'light',
    accentName: 'deep teal',
    bg: '#EDEEF0',
    surface: '#F7F7F8',
    raised: '#FFFFFF',
    text: '#0B0D10',
    text2: '#6B717A',
    accent: '#0F766E',
    wallpaper: { kind: 'solid', color: 'bg' },
    glow: 0.4,
    shadowsOnly: true,
  },
  {
    id: 'sand',
    name: 'Sand',
    group: 'light',
    accentName: 'burnt orange',
    bg: '#F2EDE4',
    surface: '#FAF7F2',
    raised: '#FFFFFF',
    text: '#1E1A16',
    text2: '#7A7067',
    accent: '#C2410C',
    wallpaper: { kind: 'gradient', id: 'theme' },
    glow: 0.4,
  },
  {
    id: 'sky',
    name: 'Sky',
    group: 'light',
    accentName: 'blue',
    bg: '#E9EFF6',
    surface: '#F6F9FC',
    raised: '#FFFFFF',
    text: '#0B1320',
    text2: '#66758A',
    accent: '#2563EB',
    wallpaper: { kind: 'gradient', id: 'theme' },
    glow: 0.4,
  },
  {
    id: 'blossom',
    name: 'Blossom',
    group: 'light',
    accentName: 'pink',
    bg: '#F6ECEE',
    surface: '#FCF6F7',
    raised: '#FFFFFF',
    text: '#22161A',
    text2: '#8A6F76',
    accent: '#DB2777',
    wallpaper: { kind: 'gradient', id: 'theme' },
    glow: 0.4,
  },
  {
    id: 'matcha',
    name: 'Matcha',
    group: 'light',
    accentName: 'green',
    bg: '#ECF0E6',
    surface: '#F7F9F3',
    raised: '#FFFFFF',
    text: '#1A2014',
    text2: '#6E7A63',
    accent: '#4D7C0F',
    wallpaper: { kind: 'gradient', id: 'theme' },
    glow: 0.4,
  },

  // ---- Signature packs, light
  { id: 'porcelain', name: 'Porcelain', group: 'light', signature: true, accentName: 'orange', bg: '#EFEFEC', surface: '#FAFAF8', raised: '#FFFFFF', text: '#111111', text2: '#8A8A86', accent: '#FF4F1F', wallpaper: { kind: 'image', id: 'porcelain' }, glow: 0, shadowsOnly: true },
  { id: 'reedglass', name: 'Reed Glass', group: 'light', signature: true, accentName: 'red', bg: '#DDE4D9', surface: '#F4F6F2', raised: '#FFFFFF', text: '#0A0A0A', text2: '#55605A', accent: '#FF3B30', wallpaper: { kind: 'image', id: 'reed' }, glow: 0 },
  { id: 'frost', name: 'Frost', group: 'light', signature: true, accentName: 'black', bg: '#E4E6E9', surface: '#F7F8F9', raised: '#FFFFFF', text: '#111111', text2: '#6F757C', accent: '#111111', wallpaper: { kind: 'image', id: 'frost' }, glow: 0 },
  { id: 'notebook', name: 'Notebook', group: 'light', signature: true, accentName: 'highlighter', bg: '#F5EDD3', surface: '#FBF6E6', raised: '#FFFDF4', text: '#141414', text2: '#6E6450', accent: '#FFE45C', wallpaper: { kind: 'image', id: 'notebook' }, glow: 0, shadowsOnly: true },
  { id: 'gallery', name: 'Gallery', group: 'light', signature: true, accentName: 'red dot', bg: '#FFFFFF', surface: '#FFFFFF', raised: '#FFFFFF', text: '#0A0A0A', text2: '#7A7A7A', accent: '#E8312A', wallpaper: { kind: 'solid', color: 'bg' }, glow: 0 },

  // ---- Retro ----------------------------------------------------------------
  // For retro themes: bg = the screen, text = the ink. "Raised" is a faint ink
  // tint for selected rows; the accent is the ink itself (selected things are
  // drawn inverted: ink background, screen-colored content).
  {
    id: 'nokia',
    name: 'Nokia LCD',
    group: 'retro',
    accentName: 'green LCD',
    bg: '#C7F0D8',
    surface: '#C7F0D8',
    raised: '#B5DCC5',
    text: '#43523D',
    text2: '#6D8263',
    accent: '#43523D',
    wallpaper: { kind: 'live', id: 'pixel' },
    glow: 0,
    retro: { style: 'phone' },
  },
  {
    id: 'gameboy',
    name: 'Game Boy',
    group: 'retro',
    accentName: '4 greens',
    bg: '#9BBC0F',
    surface: '#8BAC0F',
    raised: '#8BAC0F',
    text: '#0F380F',
    text2: '#306230',
    accent: '#0F380F',
    wallpaper: { kind: 'live', id: 'pixel' },
    glow: 0,
    retro: { style: 'phone' },
  },
  {
    id: 'amber',
    name: 'Amber CRT',
    group: 'retro',
    accentName: 'amber',
    bg: '#140C00',
    surface: '#140C00',
    raised: '#2A1A00',
    text: '#FFB000',
    text2: '#7A5400',
    accent: '#FFB000',
    wallpaper: { kind: 'solid', color: 'bg' },
    glow: 0,
    retro: { style: 'terminal' },
  },
  {
    id: 'terminal',
    name: 'Green Terminal',
    group: 'retro',
    accentName: 'green',
    bg: '#050A05',
    surface: '#050A05',
    raised: '#0C1F0F',
    text: '#33FF66',
    text2: '#1A7A33',
    accent: '#33FF66',
    wallpaper: { kind: 'solid', color: 'bg' },
    glow: 0,
    retro: { style: 'terminal' },
  },
  {
    id: 'casio',
    name: 'Casio LCD',
    group: 'retro',
    accentName: 'watch grey',
    bg: '#B9C3A6',
    surface: '#B9C3A6',
    raised: '#A7B194',
    text: '#20261C',
    text2: '#535C4B',
    accent: '#20261C',
    wallpaper: { kind: 'live', id: 'pixel' },
    glow: 0,
    retro: { style: 'phone' },
  },
  {
    id: 'desktop',
    name: 'Classic Desktop',
    group: 'retro',
    accentName: 'navy',
    bg: '#008080',
    surface: '#C0C0C0',
    raised: '#C0C0C0',
    text: '#000000',
    text2: '#404040',
    accent: '#000080',
    wallpaper: { kind: 'solid', color: 'bg' },
    glow: 0,
    retro: { style: 'desktop', titleBar: '#000080', window: '#C0C0C0' },
  },
];

export const DEFAULT_DARK_THEME = 'midnight';
export const DEFAULT_LIGHT_THEME = 'paper';
export const DEFAULT_RETRO_THEME = 'nokia';

export function getPreset(id: string): ThemePreset {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[0];
}

export function presetsIn(group: ThemeGroup): ThemePreset[] {
  return PRESETS.filter((preset) => preset.group === group);
}

/** Status colors (good / warning / bad), from SPECS.md. */
export const STATUS_COLORS = {
  dark: { good: '#34D399', warn: '#FBBF24', bad: '#F87171' },
  light: { good: '#059669', warn: '#D97706', bad: '#DC2626' },
} as const;

/** Aurora's three glows, from SPECS.md. */
export const AURORA_COLORS = ['#22D3EE', '#A78BFA', '#34D399'] as const;

/** Wind Down's warm layer: #FFB36B at 12%. */
export const WIND_DOWN = { color: '#FFB36B', alpha: 0.12, dimTo: 0.8, minutes: 10 } as const;

/** Every color the engine needs, worked out from one preset. */
export interface Palette {
  dark: boolean;
  bg: RGB;
  /** Widget surface: top and bottom of its soft gradient */
  surfaceTop: RGB;
  surfaceBottom: RGB;
  surface: RGB;
  raised: RGB;
  /** One step above raised: tracks, switched-off controls */
  surface3: RGB;
  text: RGB;
  text2: RGB;
  text3: RGB;
  accent: RGB;
}

/** Turns a preset (its few table colors) into the full palette. */
export function paletteOf(preset: ThemePreset): Palette {
  const bg = hexToRgb(preset.bg);
  const surface = hexToRgb(preset.surface);
  const raised = hexToRgb(preset.raised);
  const text = hexToRgb(preset.text);
  const dark = preset.group === 'light' ? false : luminanceOf(bg) < 0.4;
  const surfaceTop = dark ? mix(surface, raised, 0.5) : raised;
  const surfaceBottom = dark ? mix(surface, bg, 0.15) : surface;
  // Secondary and faint text stay readable (4.5:1) on the background AND on cards
  const grounds = [bg, surface, surfaceTop, surfaceBottom, raised];
  const text2Readable = readableOn(hexToRgb(preset.text2), text, grounds);
  return {
    dark,
    bg,
    // Dark: from between surface and raised down to just above surface.
    // Light: from white-ish raised down to surface.
    surfaceTop,
    surfaceBottom,
    surface,
    raised,
    surface3: mix(raised, text, dark ? 0.07 : 0.1),
    text,
    text2: text2Readable,
    text3: readableFaint(text2Readable, grounds, dark ? 0.45 : 0.4),
    accent: hexToRgb(preset.accent),
  };
}

/**
 * The faint (third) text color: text2 mixed toward the background, but never
 * so far that it falls below 4.5:1 contrast (WCAG AA for text; DEVICE_QA Step 2
 * found 2.6:1 labels on the phone). If text2 itself is below that, text2.
 */
function readableFaint(text2: RGB, grounds: RGB[], most: number): RGB {
  for (let t = most; t > 0; t -= 0.05) {
    const candidate = mix(text2, grounds[0], t);
    if (grounds.every((ground) => contrast(candidate, ground) >= 4.5)) return candidate;
  }
  return text2;
}

/** A text color moved toward the main text color until it reads at 4.5:1 on every ground. */
function readableOn(color: RGB, toward: RGB, grounds: RGB[]): RGB {
  for (let t = 0; t <= 1; t += 0.05) {
    const candidate = mix(color, toward, t);
    if (grounds.every((ground) => contrast(candidate, ground) >= 4.5)) return candidate;
  }
  return toward;
}

function luminanceOf([r, g, b]: RGB): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** The colors of the "Theme" gradient wallpaper for a preset. */
export function themeGradient(preset: ThemePreset): string[] {
  const { bg, accent, dark } = paletteOf(preset);
  return dark
    ? [rgbToHex(bg), rgbToHex(mix(bg, accent, 0.1)), rgbToHex(mix(bg, accent, 0.26))]
    : [rgbToHex(bg), rgbToHex(mix(bg, accent, 0.07)), rgbToHex(mix(bg, accent, 0.16))];
}

/** Suggested accent colors in the accent picker. */
export const SUGGESTED_ACCENTS = [
  '#2DD4BF',
  '#5EEAD4',
  '#7DD3FC',
  '#A78BFA',
  '#F472B6',
  '#FF5A36',
  '#FB923C',
  '#E8FF3A',
  '#4ADE80',
];

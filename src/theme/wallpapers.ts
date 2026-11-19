/**
 * Every wallpaper the OS can show. A wallpaper is one of:
 *  - theme:    whatever the current theme preset uses
 *  - solid:    one color ('bg' = the theme's background color)
 *  - gradient: one of the gradients below ('theme' = made from the theme's colors)
 *  - live:     an animated wallpaper drawn in code (SPECS.md section 5)
 *  - photo:    the user's own photo (stored on the device in IndexedDB)
 *  - image:    one of the signature pictures in public/wallpapers (made by
 *              scripts/gen-wallpapers.mjs)
 */

export type LiveId = 'orbit' | 'starfield' | 'aurora' | 'waves' | 'sundown' | 'pixel';
export type GradientId = 'theme' | 'night' | 'ocean' | 'sunset' | 'dusk' | 'forest' | 'paper';

export type WallpaperConfig =
  | { kind: 'theme' }
  | { kind: 'solid'; color: string }
  | { kind: 'gradient'; id: GradientId }
  | { kind: 'live'; id: LiveId }
  | { kind: 'photo' }
  | { kind: 'image'; id: ImageId };

export type ImageId = 'lacquer' | 'obsidian' | 'reed' | 'nightreed' | 'porcelain' | 'notebook' | 'frost';

/** The signature pictures, with their main and most vivid color (for "colors from wallpaper"). */
export const IMAGE_WALLPAPERS: { id: ImageId; name: string; dominant: string; vibrant: string }[] = [
  { id: 'lacquer', name: 'Lacquer folds', dominant: '#5E0B12', vibrant: '#E0313E' },
  { id: 'obsidian', name: 'Obsidian leaf', dominant: '#1c1d1f', vibrant: '#8a8f94' },
  { id: 'reed', name: 'Reed glass', dominant: '#c9d3c4', vibrant: '#5e805c' },
  { id: 'nightreed', name: 'Night reed', dominant: '#0b1610', vibrant: '#46704c' },
  { id: 'porcelain', name: 'Porcelain', dominant: '#EFEFEC', vibrant: '#EFEFEC' },
  { id: 'notebook', name: 'Paper', dominant: '#F5EDD3', vibrant: '#E8D9A8' },
  { id: 'frost', name: 'Frost flower', dominant: '#c9cdd2', vibrant: '#9aa2ab' },
];

export const imageUrl = (id: ImageId): string => `${import.meta.env.BASE_URL}wallpapers/${id}.webp`;

export const LIVE_WALLPAPERS: { id: LiveId; name: string }[] = [
  { id: 'orbit', name: 'Orbit' },
  { id: 'starfield', name: 'Starfield' },
  { id: 'aurora', name: 'Aurora' },
  { id: 'waves', name: 'Waves' },
  { id: 'sundown', name: 'Sundown' },
  { id: 'pixel', name: 'Pixel LCD' },
];

/** Color stops from top to bottom. */
export interface GradientDef {
  id: Exclude<GradientId, 'theme'>;
  name: string;
  dark: string[];
  light: string[];
}

export const GRADIENTS: GradientDef[] = [
  { id: 'night', name: 'Night', dark: ['#06090d', '#0c1520', '#18263a'], light: ['#eef1f5', '#dfe6ef', '#cdd8e6'] },
  { id: 'ocean', name: 'Ocean', dark: ['#020e14', '#063241', '#0c5a63'], light: ['#e8f4f5', '#cfe8ea', '#a9d6da'] },
  { id: 'sunset', name: 'Sunset', dark: ['#120a10', '#4a1a26', '#b65a3c'], light: ['#fbf1ea', '#f6d9c8', '#efb59a'] },
  { id: 'dusk', name: 'Dusk', dark: ['#0a0814', '#221b45', '#4b3a7a'], light: ['#f2f0fa', '#e2dcf4', '#cbc0ec'] },
  { id: 'forest', name: 'Forest', dark: ['#050c09', '#0f2a1e', '#235040'], light: ['#eef4f0', '#d7e7dc', '#b9d6c3'] },
  { id: 'paper', name: 'Paper', dark: ['#14120f', '#1d1a16', '#27231d'], light: ['#f6f2ea', '#efe8dc', '#e5dccb'] },
];

/** Solid colors offered in Settings ('bg' = follow the theme's background). */
export const SOLID_COLORS: { color: string; name: string }[] = [
  { color: 'bg', name: 'Theme background' },
  { color: '#000000', name: 'Black' },
  { color: '#1b1f24', name: 'Graphite' },
  { color: '#0d1b2a', name: 'Navy' },
  { color: '#1d2b22', name: 'Moss' },
  { color: '#2a1d1a', name: 'Cocoa' },
  { color: '#f2eee6', name: 'Paper' },
  { color: '#ffffff', name: 'White' },
];

export function getGradient(id: GradientId): GradientDef {
  return GRADIENTS.find((gradient) => gradient.id === id) ?? GRADIENTS[0];
}

/** The color stops of a gradient. `themeStops` is used for the 'theme' gradient. */
export function gradientStops(id: GradientId, dark: boolean, themeStops: string[]): string[] {
  return id === 'theme' ? themeStops : getGradient(id)[dark ? 'dark' : 'light'];
}

export function gradientCss(stops: string[]): string {
  return `linear-gradient(180deg, ${stops.join(', ')})`;
}

const LIVE_IDS = LIVE_WALLPAPERS.map((live) => live.id);
const GRADIENT_IDS: GradientId[] = ['theme', ...GRADIENTS.map((gradient) => gradient.id)];

/** Checks a wallpaper read from storage or an imported file. */
export function isWallpaperConfig(value: unknown): value is WallpaperConfig {
  const w = value as WallpaperConfig;
  if (!w || typeof w !== 'object') return false;
  switch (w.kind) {
    case 'theme':
    case 'photo':
      return true;
    case 'solid':
      return typeof w.color === 'string';
    case 'gradient':
      return GRADIENT_IDS.includes(w.id);
    case 'live':
      return LIVE_IDS.includes(w.id);
    case 'image':
      return IMAGE_WALLPAPERS.some((image) => image.id === w.id);
    default:
      return false;
  }
}

export function sameWallpaper(a: WallpaperConfig, b: WallpaperConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** A short human name, for the Settings list. */
export function wallpaperName(wallpaper: WallpaperConfig): string {
  switch (wallpaper.kind) {
    case 'theme':
      return 'Theme';
    case 'photo':
      return 'Photo';
    case 'solid':
      return SOLID_COLORS.find((s) => s.color === wallpaper.color)?.name ?? 'Solid';
    case 'gradient':
      return wallpaper.id === 'theme' ? 'Theme gradient' : getGradient(wallpaper.id).name;
    case 'live':
      return LIVE_WALLPAPERS.find((l) => l.id === wallpaper.id)?.name ?? 'Live';
    case 'image':
      return IMAGE_WALLPAPERS.find((image) => image.id === wallpaper.id)?.name ?? 'Picture';
  }
}

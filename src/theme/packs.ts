import type { IconPack, LockClockStyle, NumeralStyle, SoundPack, UiFont, WidgetStyle } from '../system/settingsStore';

/**
 * THE 10 SIGNATURE THEME PACKS (SPECS.md section 1b). A pack is more than
 * colors: its colors live in presets.ts (same id), and everything else is
 * here. Applying a pack sets all of it at once (action "theme.applyPack").
 */
export interface ThemePack {
  /** Same id as its color preset in presets.ts */
  id: string;
  name: string;
  /** One line for the gallery */
  description: string;
  /** Which inspiration image it follows */
  inspiration: string;
  widgetStyle: WidgetStyle;
  iconPack: IconPack;
  numerals: NumeralStyle;
  uiFont: UiFont;
  lockClockStyle: LockClockStyle;
  soundPack: SoundPack;
  /** Corner roundness of square widgets */
  cornerRadius: number;
  /** How the accent is used, in words (shown in Customise) */
  accentRule: string;
  /** Busy wallpaper: how much to darken (or lighten) it behind the widgets, 0-0.6 */
  scrim: number;
}

export const PACKS: ThemePack[] = [
  // ---- Dark
  {
    id: 'signal',
    name: 'Signal',
    description: 'Pure black, solid cards, one red circle, line-art data.',
    inspiration: '08',
    widgetStyle: 'solid',
    iconPack: 'line',
    numerals: 'dot',
    uiFont: 'mono',
    lockClockStyle: 'dot',
    soundPack: 'keys',
    cornerRadius: 28,
    accentRule: 'One solid red circle per page',
    scrim: 0,
  },
  {
    id: 'obsidian',
    name: 'Obsidian Leaf',
    description: 'A dark leaf, glossy black circles, pixel icons, a red second dot.',
    inspiration: '11',
    widgetStyle: 'glossy',
    iconPack: 'pixel',
    numerals: 'dot',
    uiFont: 'inter',
    lockClockStyle: 'hands',
    soundPack: 'glass',
    cornerRadius: 32,
    accentRule: 'Red only as a tiny dot',
    scrim: 0.25,
  },
  {
    id: 'lacquer',
    name: 'Lacquer',
    description: 'Glossy red folds behind pure black circles and squares.',
    inspiration: '10',
    widgetStyle: 'pill',
    iconPack: 'glyph',
    numerals: 'dot',
    uiFont: 'inter',
    lockClockStyle: 'dot',
    soundPack: 'soft',
    cornerRadius: 30,
    accentRule: 'White, the wallpaper is the color',
    scrim: 0,
  },
  {
    id: 'popink',
    name: 'Pop Ink',
    description: 'Black with flat color blocks: coral, butter, cream, sky, mint.',
    inspiration: '14',
    widgetStyle: 'colorblock',
    iconPack: 'colorblock',
    numerals: 'segment',
    uiFont: 'inter',
    lockClockStyle: 'segment',
    soundPack: 'keys',
    cornerRadius: 34,
    accentRule: 'The card colors are the accent',
    scrim: 0,
  },
  {
    id: 'nightreed',
    name: 'Night Reed',
    description: 'Ribbed glass over deep green, black pills, serif numerals.',
    inspiration: '13',
    widgetStyle: 'pill',
    iconPack: 'glyph',
    numerals: 'serif',
    uiFont: 'inter',
    lockClockStyle: 'hands',
    soundPack: 'glass',
    cornerRadius: 30,
    accentRule: 'Red second hand only',
    scrim: 0.2,
  },
  // ---- Light
  {
    id: 'porcelain',
    name: 'Porcelain',
    description: 'Off-white grain, soft round cards, thin dials, one orange button.',
    inspiration: '09',
    widgetStyle: 'solid',
    iconPack: 'line',
    numerals: 'dot',
    uiFont: 'inter',
    lockClockStyle: 'segment',
    soundPack: 'soft',
    cornerRadius: 34,
    accentRule: 'Tiny orange dots and one button',
    scrim: 0,
  },
  {
    id: 'reedglass',
    name: 'Reed Glass',
    description: 'Ribbed glass over sage, black pills with white text, a big serif date.',
    inspiration: '13',
    widgetStyle: 'pill',
    iconPack: 'glyph',
    numerals: 'serif',
    uiFont: 'inter',
    lockClockStyle: 'numeral',
    soundPack: 'glass',
    cornerRadius: 30,
    accentRule: 'Red clock hand only',
    scrim: 0.15,
  },
  {
    id: 'frost',
    name: 'Frost',
    description: 'A pale flower, white frosted cards, soft grey text.',
    inspiration: '09',
    widgetStyle: 'glass',
    iconPack: 'line',
    numerals: 'serif',
    uiFont: 'inter',
    lockClockStyle: 'numeral',
    soundPack: 'glass',
    cornerRadius: 28,
    accentRule: 'Black, used for one button',
    scrim: 0.2,
  },
  {
    id: 'notebook',
    name: 'Notebook',
    description: 'Cream paper, paper cards, black ink, a yellow highlighter.',
    inspiration: '14',
    widgetStyle: 'paper',
    iconPack: 'line',
    numerals: 'dot',
    uiFont: 'inter',
    lockClockStyle: 'numeral',
    soundPack: 'keys',
    cornerRadius: 26,
    accentRule: 'Highlighter yellow behind the important thing',
    scrim: 0,
  },
  {
    id: 'gallery',
    name: 'Gallery',
    description: 'Pure white, thin-lined cards, black dots, a red detail.',
    inspiration: '09',
    widgetStyle: 'line',
    iconPack: 'line',
    numerals: 'dot',
    uiFont: 'inter',
    lockClockStyle: 'hands',
    soundPack: 'soft',
    cornerRadius: 28,
    accentRule: 'A single red dot',
    scrim: 0,
  },
];

export function getPack(id: string): ThemePack | undefined {
  return PACKS.find((pack) => pack.id === id);
}

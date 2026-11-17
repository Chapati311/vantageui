/**
 * Small color helpers for the theme engine. No libraries.
 * Colors are passed around as [red, green, blue] with each 0-255.
 */

export type RGB = [number, number, number];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** "#2dd4bf" or "#2df" -> [45, 212, 191]. Anything invalid gives black. */
export function hexToRgb(hex: string): RGB {
  let clean = hex.trim().replace('#', '');
  if (clean.length === 3) clean = [...clean].map((c) => c + c).join('');
  const value = Number.parseInt(clean, 16);
  if (clean.length !== 6 || Number.isNaN(value)) return [0, 0, 0];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((c) => Math.round(clamp(c, 0, 255)).toString(16).padStart(2, '0')).join('')}`;
}

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

/** -> [hue 0-360, saturation 0-1, lightness 0-1] */
export function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h * 60, s, l];
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  const hue = (((h % 360) + 360) % 360) / 360;
  const sat = clamp(s);
  const light = clamp(l);
  if (sat === 0) return [light * 255, light * 255, light * 255];
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const channel = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [channel(hue + 1 / 3) * 255, channel(hue) * 255, channel(hue - 1 / 3) * 255];
}

/** Mixes two colors: t = 0 gives `a`, t = 1 gives `b`. */
export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** How bright a color looks to the eye, 0 (black) to 1 (white). */
export function luminance([r, g, b]: RGB): number {
  const channel = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two colors, 1 (none) to 21 (black on white). */
export function contrast(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** "r g b" - the form used in CSS like rgb(var(--accent-rgb) / 0.35) */
export function rgbTriplet([r, g, b]: RGB): string {
  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
}

/** CSS color with transparency, e.g. rgb(14 20 26 / 0.72) */
export function rgba(color: RGB, alpha: number): string {
  return `rgb(${rgbTriplet(color)} / ${Math.round(clamp(alpha) * 1000) / 1000})`;
}

/** Same hue, new lightness (0-1). Keeps some saturation so it doesn't go grey. */
export function withLightness(color: RGB, lightness: number): RGB {
  const [h, s] = rgbToHsl(color);
  return hslToRgb(h, s, lightness);
}

/** Rotates the hue by `degrees`. */
export function shiftHue(color: RGB, degrees: number): RGB {
  const [h, s, l] = rgbToHsl(color);
  return hslToRgb(h + degrees, s, l);
}

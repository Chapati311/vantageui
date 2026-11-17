import { getSettings } from '../system/settingsStore';

/**
 * THE DESIGN SYSTEM, for JavaScript. The same values as tokens.css (keep the
 * two in sync), plus the motion settings, which only exist here because
 * springs are run by code, not by CSS.
 * Everything comes from the "Design system" section of CLAUDE.md.
 */

export const GRID = {
  columns: 4,
  margin: 16,
  gap: 12,
  /** The grid is designed for this screen */
  designWidth: 375,
  designHeight: 667,
  /** (375 - 2*16 - 3*12) / 4 */
  cell: 76.75,
  statusBar: 20,
  dockBottom: 16,
  dotsRow: 16,
  dotsGap: 8,
  /** A home page never holds more than this many widgets + icons */
  maxItemsPerPage: 7,
} as const;

/** The only spacing values allowed. */
export const SPACE = [4, 8, 12, 16, 24, 32] as const;

export const RADIUS = { widget: 28, pill: 999 } as const;

/** Heights of dot-matrix numbers. */
export type DotSize = 28 | 40 | 64 | 96;

export const ICON = { size: 24, stroke: 1.5 } as const;

/**
 * Springs. Use the one that matches what is moving.
 * They follow the "Animation speed" setting: faster speeds make the springs
 * stiffer (with matching damping, so they never get bouncier).
 */
let retroMotion = false;

/** The theme engine turns this on for retro themes: motion then jumps in steps. */
export function setRetroMotion(on: boolean): void {
  retroMotion = on;
}

/** Jumps in 4 steps, like an old screen redrawing. */
const steppedEase = (t: number) => Math.ceil(t * 4) / 4;

const spring = (stiffness: number, damping: number) => {
  const speed = getSettings().animationSpeed;
  if (retroMotion) {
    // Retro themes: stepped animation, never smooth springs
    return { type: 'tween' as const, duration: 0.24 / speed, ease: steppedEase };
  }
  return { type: 'spring' as const, stiffness: stiffness * speed * speed, damping: damping * speed };
};

export const SPRING = {
  /** Default for UI: presses, pages, items moving on the grid */
  get ui() {
    return spring(400, 34);
  },
  /** An app growing out of its icon and shrinking back */
  get app() {
    return spring(260, 28);
  },
  /** Sheets: lock screen, quick settings, search */
  get sheet() {
    return spring(300, 30);
  },
};

export const MOTION = {
  /** Past an edge, things move this much slower than the finger */
  rubberBand: 0.55,
  /** Everything tappable shrinks to this while pressed */
  pressScale: 0.96,
  /** A swipe faster than this (px per ms) counts as a flick, however short */
  flickVelocity: 0.5,
} as const;

/** Slows movement down once `value` goes outside `min`..`max`. */
export function rubberBand(value: number, min: number, max: number): number {
  if (value < min) return min + (value - min) * MOTION.rubberBand;
  if (value > max) return max + (value - max) * MOTION.rubberBand;
  return value;
}

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

/** Springs. Use the one that matches what is moving. */
export const SPRING = {
  /** Default for UI: presses, pages, items moving on the grid */
  ui: { type: 'spring', stiffness: 400, damping: 34 },
  /** An app growing out of its icon and shrinking back */
  app: { type: 'spring', stiffness: 260, damping: 28 },
  /** Sheets: lock screen, quick settings, search */
  sheet: { type: 'spring', stiffness: 300, damping: 30 },
} as const;

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

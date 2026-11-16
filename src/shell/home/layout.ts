/**
 * The rules of the home screen grid. Pure functions only (no React, no DOM),
 * so they are easy to reason about and test.
 */

export const COLS = 4;
export const ROWS = 6;
export const MAX_PAGES = 5;

/** One thing on the home screen: a widget or an app icon. */
export interface HomeItem {
  /** Unique, e.g. "widget:clock" or "app:phone" */
  id: string;
  kind: 'widget' | 'app';
  /** The widget id or app id it shows */
  ref: string;
  page: number;
  col: number;
  row: number;
  /** Width and height in grid cells */
  w: number;
  h: number;
}

/** A rectangle of cells on one page. */
export interface Slot {
  page: number;
  col: number;
  row: number;
  w: number;
  h: number;
}

function inBounds(slot: Slot): boolean {
  return (
    slot.page >= 0 &&
    slot.page < MAX_PAGES &&
    slot.col >= 0 &&
    slot.row >= 0 &&
    slot.col + slot.w <= COLS &&
    slot.row + slot.h <= ROWS
  );
}

function overlaps(a: Slot, b: Slot): boolean {
  return (
    a.page === b.page &&
    a.col < b.col + b.w &&
    b.col < a.col + a.w &&
    a.row < b.row + b.h &&
    b.row < a.row + a.h
  );
}

/** The free spot on the same page that is closest to where `item` is now. */
function nearestFreeSlot(item: HomeItem, taken: Slot[]): Slot | null {
  let best: Slot | null = null;
  let bestDistance = Infinity;
  for (let row = 0; row <= ROWS - item.h; row++) {
    for (let col = 0; col <= COLS - item.w; col++) {
      const slot: Slot = { page: item.page, col, row, w: item.w, h: item.h };
      if (taken.some((other) => overlaps(other, slot))) continue;
      const distance = Math.abs(col - item.col) + Math.abs(row - item.row);
      if (distance < bestDistance) {
        best = slot;
        bestDistance = distance;
      }
    }
  }
  return best;
}

/**
 * Puts an item into `target` (a new position and/or size). Anything in the
 * way is pushed to the nearest free spot on that page.
 * Returns the new layout, or `null` if there is not enough room.
 */
export function placeItem(layout: HomeItem[], id: string, target: Slot): HomeItem[] | null {
  const item = layout.find((i) => i.id === id);
  if (!item || !inBounds(target)) return null;

  const moved: HomeItem = { ...item, ...target };
  const samePage = layout.filter((i) => i.id !== id && i.page === target.page);
  const inTheWay = samePage.filter((i) => overlaps(i, moved));
  const taken: Slot[] = [moved, ...samePage.filter((i) => !inTheWay.includes(i))];

  const pushed = new Map<string, HomeItem>();
  // Find room for the biggest items first - they are the hardest to fit.
  for (const other of [...inTheWay].sort((a, b) => b.w * b.h - a.w * a.h)) {
    const slot = nearestFreeSlot(other, taken);
    if (!slot) return null;
    const relocated = { ...other, ...slot };
    taken.push(relocated);
    pushed.set(other.id, relocated);
  }

  return layout.map((i) => (i.id === id ? moved : (pushed.get(i.id) ?? i)));
}

/** The first empty cell, looking from `fromPage` onwards. */
export function firstFreeCell(layout: HomeItem[], fromPage: number): Slot | null {
  for (let page = fromPage; page < MAX_PAGES; page++) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const slot: Slot = { page, col, row, w: 1, h: 1 };
        if (!layout.some((item) => overlaps(item, slot))) return slot;
      }
    }
  }
  return null;
}

/** How many pages have something on them (at least 1). */
export function countPages(layout: HomeItem[]): number {
  return layout.reduce((max, item) => Math.max(max, item.page + 1), 1);
}

/** Removes empty pages so there are no gaps between pages. */
export function compactPages(layout: HomeItem[]): HomeItem[] {
  const used = [...new Set(layout.map((item) => item.page))].sort((a, b) => a - b);
  if (used.every((page, index) => page === index)) return layout;
  return layout.map((item) => ({ ...item, page: used.indexOf(item.page) }));
}

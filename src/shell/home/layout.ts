/**
 * The rules of the home screen grid. Pure functions only (no React, no DOM),
 * so they are easy to reason about and test.
 */

import { GRID } from '../../theme/tokens';

export const COLS = GRID.columns;
/** The most rows a page can ever have. The real number depends on the screen. */
export const MAX_ROWS = 6;
export const MIN_ROWS = 2;
export const MAX_PAGES = 5;
/** Design system: fewer, better items. A page never holds more than this. */
export const MAX_ITEMS_PER_PAGE = GRID.maxItemsPerPage;

/** One thing on the home screen: a widget or an app icon. */
export interface HomeItem {
  /** Unique, e.g. "widget:clock" or "app:phone" */
  id: string;
  kind: 'widget' | 'app' | 'folder';
  /** The widget id or app id it shows (a folder: its own id) */
  ref: string;
  /** A widget can look different from the others (long-press > Style) */
  style?: 'solid' | 'glass' | 'outline' | 'tinted';
  /** A folder's name and the apps in it */
  folder?: { name: string; apps: string[] };
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

/**
 * How many rows fit in `height` pixels, for cells of `cell` pixels with
 * `gap` pixels between them. This is what stops a page from overflowing.
 */
export function rowsThatFit(height: number, cell: number, gap: number): number {
  const rows = Math.floor((height + gap) / (cell + gap));
  return Math.min(MAX_ROWS, Math.max(MIN_ROWS, rows));
}

function inBounds(slot: Slot, rows: number): boolean {
  return (
    slot.page >= 0 &&
    slot.page < MAX_PAGES &&
    slot.col >= 0 &&
    slot.row >= 0 &&
    slot.col + slot.w <= COLS &&
    slot.row + slot.h <= rows
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
function nearestFreeSlot(item: HomeItem, taken: Slot[], rows: number): Slot | null {
  let best: Slot | null = null;
  let bestDistance = Infinity;
  for (let row = 0; row <= rows - item.h; row++) {
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
export function placeItem(
  layout: HomeItem[],
  id: string,
  target: Slot,
  rows: number,
): HomeItem[] | null {
  const item = layout.find((i) => i.id === id);
  if (!item || !inBounds(target, rows)) return null;
  // Moving onto another page is refused when that page is already full.
  const onTargetPage = layout.filter((i) => i.id !== id && i.page === target.page).length;
  if (item.page !== target.page && onTargetPage >= MAX_ITEMS_PER_PAGE) return null;

  const moved: HomeItem = { ...item, ...target };
  const samePage = layout.filter((i) => i.id !== id && i.page === target.page);
  const inTheWay = samePage.filter((i) => overlaps(i, moved));
  const taken: Slot[] = [moved, ...samePage.filter((i) => !inTheWay.includes(i))];

  const pushed = new Map<string, HomeItem>();
  // Find room for the biggest items first - they are the hardest to fit.
  for (const other of [...inTheWay].sort((a, b) => b.w * b.h - a.w * a.h)) {
    const slot = nearestFreeSlot(other, taken, rows);
    if (!slot) return null;
    const relocated = { ...other, ...slot };
    taken.push(relocated);
    pushed.set(other.id, relocated);
  }

  return layout.map((i) => (i.id === id ? moved : (pushed.get(i.id) ?? i)));
}

/** The first empty spot of a given size, looking from `fromPage` onwards. */
export function firstFreeSlot(
  layout: Slot[],
  size: { w: number; h: number },
  fromPage: number,
  rows = MAX_ROWS,
): Slot | null {
  for (let page = fromPage; page < MAX_PAGES; page++) {
    // A full page takes no more items, even if it has empty cells.
    if (layout.filter((item) => item.page === page).length >= MAX_ITEMS_PER_PAGE) continue;
    for (let row = 0; row <= rows - size.h; row++) {
      for (let col = 0; col <= COLS - size.w; col++) {
        // Only take the width and height: `size` may be a whole item with its own position.
        const slot: Slot = { page, col, row, w: size.w, h: size.h };
        if (!layout.some((item) => overlaps(item, slot))) return slot;
      }
    }
  }
  return null;
}

/**
 * Makes a layout fit a page that is only `rows` tall: anything that would
 * stick out below the last row moves to the next free spot (on a later page
 * if needed). Items that already fit stay exactly where they are.
 */
export function fitToRows(layout: HomeItem[], rows: number): HomeItem[] {
  const fits = (item: HomeItem) => item.row + item.h <= rows;
  if (layout.every(fits)) return layout;

  const placed = layout.filter(fits);
  const moved = new Map<string, HomeItem>();
  for (const item of layout.filter((i) => !fits(i))) {
    const slot = firstFreeSlot(placed, item, item.page, rows);
    if (!slot) continue; // nowhere at all: it stays put (and hidden) rather than vanish
    const relocated = { ...item, ...slot };
    placed.push(relocated);
    moved.set(item.id, relocated);
  }
  return layout.map((item) => moved.get(item.id) ?? item);
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

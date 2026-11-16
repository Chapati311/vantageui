import type { HomeItem } from './layout';

function widget(ref: string, page: number, col: number, row: number, w: number, h: number): HomeItem {
  return { id: `widget:${ref}`, kind: 'widget', ref, page, col, row, w, h };
}

function app(ref: string, page: number, col: number, row: number): HomeItem {
  return { id: `app:${ref}`, kind: 'app', ref, page, col, row, w: 1, h: 1 };
}

/**
 * What the home screen looks like before the user rearranges anything.
 * widget(name, page, column, row, width, height) - all counted from 0.
 * Rules from the design system: at most 7 items per page, ONE hero and ONE
 * accent-colored element per page, and nothing below row 5 (index 4).
 * The 4 dock apps are not here: they live in the dock (see appRegistry).
 */
export const DEFAULT_LAYOUT: HomeItem[] = [
  // Page 1 - hero: the clock. Accent: the battery ring. (7 items, fills 4 x 5)
  widget('clock', 0, 0, 0, 2, 2),
  widget('battery', 0, 2, 0, 1, 1),
  widget('date', 0, 3, 0, 1, 1),
  widget('weather', 0, 2, 1, 2, 1),
  widget('ask', 0, 0, 2, 4, 1),
  widget('music', 0, 0, 3, 2, 2),
  widget('calendar', 0, 2, 3, 2, 2),
  // Page 2 - hero: the photo. Accent: the voice note button. (4 items, the rest is space)
  widget('photo', 1, 0, 0, 2, 2),
  widget('notes', 1, 2, 0, 2, 1),
  widget('voice', 1, 2, 1, 1, 1),
  widget('flashlight', 1, 3, 1, 1, 1),
  // Page 3 - the remaining apps. No accent.
  app('weather', 2, 0, 0),
  app('calculator', 2, 1, 0),
  app('music', 2, 2, 0),
  app('maps', 2, 3, 0),
  app('settings', 2, 0, 1),
];

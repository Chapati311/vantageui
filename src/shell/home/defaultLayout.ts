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
 * The 4 dock apps are not here: they live in the dock (see appRegistry).
 */
export const DEFAULT_LAYOUT: HomeItem[] = [
  // Page 1
  widget('clock', 0, 0, 0, 2, 2),
  widget('battery', 0, 2, 0, 1, 1),
  widget('date', 0, 3, 0, 1, 1),
  widget('weather', 0, 2, 1, 2, 1),
  widget('ask', 0, 0, 2, 4, 1),
  widget('music', 0, 0, 3, 2, 2),
  widget('voice', 0, 2, 3, 1, 1),
  widget('flashlight', 0, 3, 3, 1, 1),
  app('music', 0, 2, 4),
  app('maps', 0, 3, 4),
  // Page 2
  widget('calendar', 1, 0, 0, 2, 2),
  widget('notes', 1, 2, 0, 2, 1),
  app('weather', 1, 2, 1),
  app('calculator', 1, 3, 1),
  app('settings', 1, 0, 2),
];

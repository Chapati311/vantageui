import type { HomeItem } from './layout';

function widget(ref: string, page: number, col: number, row: number, w: number, h: number): HomeItem {
  return { id: `widget:${ref}`, kind: 'widget', ref, page, col, row, w, h };
}

function app(ref: string, page: number, col: number, row: number): HomeItem {
  return { id: `app:${ref}`, kind: 'app', ref, page, col, row, w: 1, h: 1 };
}

/** What the home screen looks like before the user rearranges anything. */
export const DEFAULT_LAYOUT: HomeItem[] = [
  // Page 1
  widget('clock', 0, 0, 0, 2, 2),
  widget('battery', 0, 2, 0, 1, 1),
  widget('date', 0, 3, 0, 1, 1),
  widget('weather', 0, 2, 1, 2, 1),
  app('phone', 0, 0, 5),
  app('messages', 0, 1, 5),
  app('notes', 0, 2, 5),
  app('clock', 0, 3, 5),
  // Page 2
  app('weather', 1, 0, 0),
  app('calculator', 1, 1, 0),
  app('music', 1, 2, 0),
  app('maps', 1, 3, 0),
  app('settings', 1, 0, 1),
];

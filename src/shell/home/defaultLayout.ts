import type { HomeItem } from './layout';

function widget(ref: string, page: number, col: number, row: number, w: number, h: number): HomeItem {
  return { id: `widget:${ref}`, kind: 'widget', ref, page, col, row, w, h };
}

function app(ref: string, page: number, col: number, row: number): HomeItem {
  return { id: `app:${ref}`, kind: 'app', ref, page, col, row, w: 1, h: 1 };
}

function folder(id: string, name: string, apps: string[], page: number, col: number, row: number): HomeItem {
  return { id: `folder:${id}`, kind: 'folder', ref: id, page, col, row, w: 1, h: 1, folder: { name, apps } };
}

/**
 * What the home screen looks like before the user rearranges anything:
 * three pages, each with widgets AND app icons. Every app is reachable:
 * by its icon, inside a folder, or through a widget that opens it.
 * widget(name, page, column, row, width, height) - all counted from 0.
 * Rules from the design system: at most 7 items per page, ONE hero and ONE
 * accent-colored element per page, and nothing below row 5 (index 4).
 * The 4 dock apps are not here: they live in the dock (see appRegistry).
 */
export const DEFAULT_LAYOUT: HomeItem[] = [
  // Page 1 - hero: the clock. Accent: the battery ring.
  widget('clock', 0, 0, 0, 2, 2),
  widget('battery', 0, 2, 0, 1, 1),
  widget('lockin', 0, 3, 0, 1, 1),
  widget('weather', 0, 2, 1, 2, 1),
  widget('ask', 0, 0, 2, 4, 1),
  widget('music', 0, 0, 3, 2, 2),
  widget('calendar', 0, 2, 3, 2, 2),
  // Page 2 - hero: your photo. School and errands next to it, then apps.
  widget('photo', 1, 0, 0, 2, 2),
  widget('next-lesson', 1, 2, 0, 2, 1),
  widget('reminders', 1, 2, 1, 2, 1),
  app('camera', 1, 0, 2),
  app('maps', 1, 1, 2),
  app('settings', 1, 2, 2),
  folder('tools', 'Tools', ['calculator', 'recorder', 'compass', 'files', 'browser'], 1, 3, 2),
  // Page 3 - hero: Snake. Accent: the voice note button.
  widget('notes', 2, 0, 0, 2, 1),
  widget('homework', 2, 2, 0, 2, 1),
  widget('game-snake', 2, 0, 1, 2, 2),
  widget('voice', 2, 2, 1, 1, 1),
  widget('flashlight', 2, 3, 1, 1, 1),
  folder('people', 'People', ['contacts', 'mail'], 2, 2, 2),
  app('customise', 2, 3, 2),
];

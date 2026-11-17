import { HOME_APPS, DOCK_APP_IDS, getApp } from '../../system/appRegistry';
import { getWidget } from '../widgets/widgetRegistry';
import type { WidgetSize } from '../widgets/types';
import { DEFAULT_LAYOUT } from './defaultLayout';
import { COLS, MAX_PAGES, MAX_ROWS, countPages, firstFreeSlot, type HomeItem } from './layout';

/** Change the version if the layout format ever changes (old saved layouts are then ignored). */
const STORAGE_KEY = 'vantage.homeLayout.v4';

const isWholeNumber = (value: unknown): value is number => Number.isInteger(value);

/** Checks that a saved item still makes sense (the app/widget still exists, it fits). */
function isValid(item: HomeItem): boolean {
  if (typeof item?.id !== 'string' || typeof item.ref !== 'string') return false;
  if (![item.page, item.col, item.row, item.w, item.h].every(isWholeNumber)) return false;
  if (item.page < 0 || item.page >= MAX_PAGES || item.col < 0 || item.row < 0) return false;
  if (item.col + item.w > COLS || item.row + item.h > MAX_ROWS) return false;
  if (item.kind === 'app') {
    // Dock apps live in the dock, not on the grid.
    return item.w === 1 && item.h === 1 && !!getApp(item.ref) && !DOCK_APP_IDS.includes(item.ref);
  }
  if (item.kind === 'widget') {
    return !!getWidget(item.ref)?.sizes.includes(`${item.w}x${item.h}` as WidgetSize);
  }
  return false;
}

/** Gives every app in the registry that is not on the home screen yet a free spot. */
function addMissingApps(layout: HomeItem[]): HomeItem[] {
  const result = [...layout];
  for (const app of HOME_APPS) {
    const id = `app:${app.id}`;
    if (DOCK_APP_IDS.includes(app.id) || result.some((item) => item.id === id)) continue;
    const slot = firstFreeSlot(result, { w: 1, h: 1 }, countPages(result) - 1);
    if (slot) result.push({ ...slot, id, kind: 'app', ref: app.id });
  }
  return result;
}

/** The layout saved on this device, or the default one. */
export function loadLayout(): HomeItem[] {
  let layout = DEFAULT_LAYOUT;
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (Array.isArray(saved)) {
      // Drop anything that no longer exists (e.g. an app removed from the registry).
      const valid = (saved as HomeItem[]).filter(isValid);
      if (valid.length > 0) layout = valid;
    }
  } catch {
    // Broken or blocked storage: use the default.
  }
  return addMissingApps(layout.filter(isValid));
}

export function saveLayout(layout: HomeItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Storage can be full or blocked (private mode). The layout still works until reload.
  }
}

// ---- Changes from outside the home screen (the widget gallery, actions)

const listeners = new Set<() => void>();

/** Called when the layout was changed by addWidget / removeHomeItem. */
export function subscribeToLayout(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Puts a widget on the home screen, on the first free spot from `fromPage`
 * on. Returns false when there is no room anywhere.
 */
export function addWidget(widgetId: string, size: WidgetSize, fromPage = 0): boolean {
  const widget = getWidget(widgetId);
  if (!widget || !widget.sizes.includes(size)) return false;
  const [w, h] = size.split('x').map(Number);
  const layout = loadLayout();
  const slot = firstFreeSlot(layout, { w, h }, fromPage) ?? firstFreeSlot(layout, { w, h }, 0);
  if (!slot) return false;
  const id = `widget:${widgetId}:${Date.now().toString(36)}`;
  saveLayout([...layout, { ...slot, id, kind: 'widget', ref: widgetId }]);
  listeners.forEach((listener) => listener());
  return true;
}

/** Takes a widget off the home screen (apps always keep their place). */
export function removeHomeItem(id: string): void {
  const layout = loadLayout();
  const item = layout.find((entry) => entry.id === id);
  if (!item || item.kind !== 'widget') return;
  saveLayout(layout.filter((entry) => entry.id !== id));
  listeners.forEach((listener) => listener());
}

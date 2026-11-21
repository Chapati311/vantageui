import { dockAppIds, getApp, homeApps } from '../../system/appRegistry';
import { isHosted } from '../../system/nativeBridge';
import { getNativeApps, isNativeAppId, nativeAppId, subscribeToNativeApps } from '../../system/nativeApps';
import { getWidget } from '../widgets/widgetRegistry';
import type { WidgetSize } from '../widgets/types';
import { DEFAULT_LAYOUT } from './defaultLayout';
import { COLS, MAX_PAGES, MAX_ROWS, countPages, firstFreeSlot, setIconPageCapacity, type HomeItem } from './layout';

/** Change the version if the layout format ever changes (old saved layouts are then ignored). */
/** v5: three balanced pages with folders (older layouts are replaced once). */
const HOSTED = isHosted();
/** Host mode (the real home screen) keeps its own layout: the browser one stays as it was. */
const STORAGE_KEY = HOSTED ? 'vantage.homeLayout.host.v1' : 'vantage.homeLayout.v5';
/** Real app icons fill pages 4 x 4, like iOS (rows 1-4, above the page dots). */
const ICON_ROWS = 4;
if (HOSTED) setIconPageCapacity(COLS * ICON_ROWS);

const isWholeNumber = (value: unknown): value is number => Number.isInteger(value);

/** Checks that a saved item still makes sense (the app/widget still exists, it fits). */
function isValid(item: HomeItem): boolean {
  if (typeof item?.id !== 'string' || typeof item.ref !== 'string') return false;
  if (![item.page, item.col, item.row, item.w, item.h].every(isWholeNumber)) return false;
  if (item.page < 0 || item.page >= MAX_PAGES || item.col < 0 || item.row < 0) return false;
  if (item.col + item.w > COLS || item.row + item.h > MAX_ROWS) return false;
  if (item.kind === 'app') {
    // Real apps whose list hasn't arrived yet keep their place (never lose the arrangement).
    const exists = !!getApp(item.ref) || (isNativeAppId(item.ref) && getNativeApps().length === 0);
    // Dock apps live in the dock, not on the grid.
    return item.w === 1 && item.h === 1 && exists && !dockAppIds().includes(item.ref);
  }
  if (item.kind === 'widget') {
    return !!getWidget(item.ref)?.sizes.includes(`${item.w}x${item.h}` as WidgetSize);
  }
  if (item.kind === 'folder') {
    return item.w === 1 && item.h === 1 && Array.isArray(item.folder?.apps);
  }
  return false;
}

/**
 * Gives every app in the registry that is not on the home screen yet a free
 * spot. An app counts as placed when its icon is there, it is in a folder,
 * or a widget on the home screen opens it.
 */
function addMissingApps(layout: HomeItem[]): HomeItem[] {
  const result = [...layout];
  const placed = new Set<string>(dockAppIds());
  for (const item of layout) {
    if (item.kind === 'app') placed.add(item.ref);
    if (item.kind === 'folder') item.folder?.apps.forEach((app) => placed.add(app));
    if (item.kind === 'widget') {
      const opens = getWidget(item.ref)?.appId;
      if (opens) placed.add(opens);
    }
  }
  for (const app of orderedHomeApps()) {
    const id = `app:${app.id}`;
    if (placed.has(app.id)) continue;
    // New apps land on the last page (no room: the App Library still has them).
    const slot = firstFreeSlot(result, { w: 1, h: 1 }, Math.max(HOSTED ? 1 : 0, countPages(result) - 1), HOSTED ? ICON_ROWS : MAX_ROWS);
    if (slot) result.push({ ...slot, id, kind: 'app', ref: app.id });
  }
  return result;
}

// ---- Host mode: the first layout, built like iOS -------------------------------------

/** The everyday apps first (in this order), then everything else A-Z. */
const FIRST = [
  'ios:com.apple.mobilesafari', 'ios:com.apple.mobileslideshow', 'ios:com.apple.Preferences', 'ios:com.apple.AppStore',
  'ios:com.apple.Maps', 'ios:com.apple.Music', 'ios:com.apple.mobilemail', 'ios:com.apple.mobilecal',
  'notes', 'ios:com.apple.mobilenotes', 'clock', 'weather', 'customise', 'calculator', 'ios:com.apple.facetime',
  'ios:com.apple.reminders', 'ios:com.apple.MobileAddressBook', 'ios:com.apple.DocumentsApp', 'ios:com.apple.shortcuts',
];
function orderedHomeApps() {
  const apps = homeApps();
  const rank = (id: string) => (FIRST.includes(id) ? FIRST.indexOf(id) : FIRST.length);
  return [...apps].sort((a, b) => rank(a.id) - rank(b.id) || a.name.localeCompare(b.name));
}

/** Apple's smaller apps, kept together in one folder. */
const UTILITIES = [
  'com.apple.Magnifier', 'com.apple.measure', 'com.apple.tips', 'com.apple.Translate', 'com.apple.findmy',
  'com.apple.Bridge', 'com.apple.Home', 'com.apple.Passbook', 'com.apple.freeform', 'com.apple.Health',
  'com.apple.Fitness', 'com.apple.stocks', 'com.apple.MobileStore', 'com.apple.iBooks', 'com.apple.podcasts', 'com.apple.tv',
];

/** First run on the phone: page 1 widgets, then folders, then the real apps (added below). */
function hostDefaultLayout(): HomeItem[] {
  const layout = DEFAULT_LAYOUT.filter((item) => item.page === 0);
  const installed = getNativeApps();
  const folder = (id: string, name: string, bundleIds: string[]) => {
    const apps = bundleIds.filter((bid) => installed.some((app) => app.bundleId === bid)).map(nativeAppId);
    if (apps.length < 2) return;
    const slot = firstFreeSlot(layout, { w: 1, h: 1 }, 1, ICON_ROWS);
    if (slot) layout.push({ ...slot, id: `folder:${id}`, kind: 'folder', ref: id, folder: { name, apps } });
  };
  folder('utilities', 'Utilities', UTILITIES);
  folder('jailbreak', 'Jailbreak', installed.filter((app) => app.source === 'jailbreak' || app.source === 'trollstore' || /troll|dopamine/i.test(app.name)).map((app) => app.bundleId));

  // The apps, spread EVENLY over the icon pages (not 16 + 6): pages look balanced.
  const placed = new Set<string>(dockAppIds());
  layout.forEach((item) => item.kind === 'folder' && item.folder?.apps.forEach((id) => placed.add(id)));
  const apps = orderedHomeApps().filter((app) => !placed.has(app.id));
  const onFirst = layout.filter((item) => item.page === 1).length; // the folders
  const capacity = COLS * ICON_ROWS;
  const total = apps.length + onFirst;
  const pages = Math.max(1, Math.min(MAX_PAGES - 1, Math.ceil(total / capacity)));
  const perPage = Math.ceil(total / pages);
  let page = 1;
  for (const app of apps) {
    while (layout.filter((item) => item.page === page).length >= perPage && page < MAX_PAGES - 1) page++;
    const slot = firstFreeSlot(layout.filter((item) => item.page === page), { w: 1, h: 1 }, page, ICON_ROWS);
    if (!slot || slot.page !== page) continue;
    layout.push({ ...slot, id: `app:${app.id}`, kind: 'app', ref: app.id });
  }
  return layout;
}

// The real app list arrived or changed (install, remove): lay out again.
if (HOSTED) subscribeToNativeApps(() => listeners.forEach((listener) => listener()));

/** The layout saved on this device, or the default one. */
export function loadLayout(): HomeItem[] {
  let layout = HOSTED ? (getNativeApps().length ? hostDefaultLayout() : DEFAULT_LAYOUT.filter((item) => item.page === 0)) : DEFAULT_LAYOUT;
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (Array.isArray(saved)) {
      // Drop anything that no longer exists (e.g. an app removed from the registry).
      const valid = (saved as HomeItem[]).filter(isValid);
      if (valid.length > 0) layout = valid;
      // Host mode: the first saved layout before the apps arrived had no folders yet.
      else if (HOSTED && getNativeApps().length) layout = hostDefaultLayout();
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

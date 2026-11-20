/**
 * THE ONLY PLACE THAT TALKS TO THE PHONE ITSELF.
 *
 * Rule: use the jailbreak bridge (window.vantageNative, injected by the
 * SpringBoard tweak in a later phase) if it exists; otherwise fall back to
 * what a normal web app can do (URL schemes, iOS Shortcuts); otherwise say
 * honestly that it is unavailable. The rest of the app never checks for the
 * bridge itself - it calls these functions.
 *
 * Every function answers with how it was done, so screens can show
 * "Available after unlock" instead of pretending.
 */

export interface BatteryInfo {
  /** 0 = empty, 1 = full */
  level: number;
  charging: boolean;
}

export interface InstalledApp {
  name: string;
  bundleId: string;
  /** PNG as base64 */
  icon: string;
}

/** The jailbroken phone running Vantage OS as its home screen. */
export interface HostInfo {
  hosted: true;
  /** Tweak version, e.g. "0.3.0" */
  version: string;
  /** e.g. "16.3" */
  iosVersion: string;
  /** e.g. "iPhone12,8" */
  model: string;
}

/** One of an app's real quick actions (long-press). */
export interface AppShortcut {
  type: string;
  title: string;
  subtitle?: string;
}

/** What the phone knows about an installed app. */
export interface AppInfo {
  name: string;
  bundleId: string;
  source: 'system' | 'appstore' | 'trollstore' | 'jailbreak';
  category?: string;
  version?: string;
  build?: string;
  minimumOS?: string;
  shortcuts: number;
}

/** How a request was carried out. */
export type BridgeResult =
  | { ok: true; via: 'bridge' | 'url' | 'shortcut' }
  | { ok: false; reason: 'unavailable' | 'failed' };

/** What the jailbreak tweak will inject (CLAUDE.md, "Native bridge"). All optional. */
interface VantageNative {
  openApp?: (bundleId: string) => Promise<void>;
  listApps?: () => Promise<InstalledApp[]>;
  setFlashlight?: (on: boolean) => Promise<void>;
  getBattery?: () => Promise<BatteryInfo>;
  setBrightness?: (level: number) => Promise<void>;
  getBrightness?: () => Promise<number>;
  /**
   * Volume up then volume down within 400 ms: the volume is put back to where
   * it was and this is called to summon Vantage. (The tweak resolves with a
   * function that stops listening.)
   */
  onVolumeChord?: (callback: () => void) => void | Promise<() => void>;
  /** Always true inside VantageHost (the jailbroken phone's home screen). */
  isHosted?: () => Promise<boolean>;
  getInfo?: () => Promise<HostInfo>;
  version?: string;
  iosVersion?: string;
  getShortcuts?: (bundleId: string) => Promise<AppShortcut[]>;
  runShortcut?: (bundleId: string, type: string) => Promise<void>;
  getAppInfo?: (bundleId: string) => Promise<AppInfo>;
  uninstallApp?: (bundleId: string, confirmed: boolean) => Promise<void>;
  /** Sends a text message (after the user confirmed it on an action card). */
  sendMessage?: (to: string, body: string) => Promise<void>;
}

/** The browser battery API (Chrome/Android only - iOS Safari does not have it). */
interface BrowserBattery extends EventTarget {
  level: number;
  charging: boolean;
}

declare global {
  interface Window {
    vantageNative?: VantageNative;
  }
  interface Navigator {
    getBattery?: () => Promise<BrowserBattery>;
  }
}

const native = () => window.vantageNative;

/** True once the jailbreak bridge is there. */
export function hasBridge(): boolean {
  return !!native();
}

/**
 * True when Vantage OS IS the phone's home screen (inside the VantageHost app
 * on the jailbroken iPhone), not a website or home-screen web app. The
 * user agent also says so, in case the bridge is checked very early.
 */
export function isHosted(): boolean {
  return !!native() || (typeof navigator !== 'undefined' && navigator.userAgent.includes('VantageOSHost'));
}

/** Tweak version, iOS version and model when hosted, otherwise null. */
export async function hostInfo(): Promise<HostInfo | null> {
  const bridge = native();
  if (!bridge?.getInfo) return null;
  try {
    return await bridge.getInfo();
  } catch {
    return null;
  }
}

/** Opens a URL that iOS hands to another app (tel:, sms:, maps://, shortcuts://...). */
function openUrl(url: string): BridgeResult {
  try {
    window.location.href = url;
    return { ok: true, via: 'url' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

/** iOS Shortcuts the user has set up (CLAUDE.md lists them). */
export type ShortcutName = 'Flashlight' | 'LowPower' | 'DND' | 'CreateAlarm' | 'FocusOn' | 'FocusOff';

/** Runs one of the user's iOS Shortcuts, optionally with text as input. */
export function runShortcut(name: ShortcutName, input?: string): BridgeResult {
  const params = new URLSearchParams({ name });
  if (input !== undefined) {
    params.set('input', 'text');
    params.set('text', input);
  }
  const result = openUrl(`shortcuts://run-shortcut?${params.toString().replace(/\+/g, '%20')}`);
  return result.ok ? { ok: true, via: 'shortcut' } : result;
}

// ---- Apps -------------------------------------------------------------------------

/** URL schemes for real iOS apps, used until the bridge can open apps by bundle ID. */
const APP_URLS: Record<string, string> = {
  'com.apple.mobilephone': 'tel:',
  'com.apple.MobileSMS': 'sms:',
  'com.apple.Maps': 'maps://',
  'com.apple.mobilemail': 'mailto:',
  'com.apple.camera': '',
  'com.spotify.client': 'spotify:',
  'com.apple.shortcuts': 'shortcuts://',
  'com.apple.mobilecal': 'calshow://',
  'com.apple.reminders': 'x-apple-reminderkit://',
  'com.apple.mobilenotes': 'mobilenotes://',
  'com.apple.Music': 'music://',
  'com.apple.mobileslideshow': 'photos-redirect://',
  'com.apple.weather': 'weather://',
  'com.apple.DocumentsApp': 'shareddocuments://',
  'com.apple.mobilesafari': 'x-web-search://',
  'com.apple.Preferences': 'App-prefs:',
  'com.apple.VoiceMemos': 'voicememos://',
  'com.apple.MobileAddressBook': 'contacts://',
};

/** True when this app can be opened from Vantage (a link exists, or the bridge is there). */
export function canOpenApp(bundleId: string): boolean {
  return Boolean(native()?.openApp) || Boolean(APP_URLS[bundleId]);
}

/** Opens a real iOS app. */
export async function openApp(bundleId: string): Promise<BridgeResult> {
  const bridge = native();
  if (bridge?.openApp) {
    try {
      await bridge.openApp(bundleId);
      return { ok: true, via: 'bridge' };
    } catch {
      return { ok: false, reason: 'failed' };
    }
  }
  const url = APP_URLS[bundleId];
  return url ? openUrl(url) : { ok: false, reason: 'unavailable' };
}

/** Starts a phone call. */
export function call(number: string): BridgeResult {
  return openUrl(`tel:${number.replace(/[^\d+*#]/g, '')}`);
}

/** Opens Messages to a number, optionally with the text already written. */
export function message(number: string, body?: string): BridgeResult {
  const to = number.replace(/[^\d+]/g, '');
  // iOS wants "&body=", other systems "?body="
  const separator = /iP(hone|ad|od)/.test(navigator.userAgent) ? '&' : '?';
  return openUrl(`sms:${to}${body ? `${separator}body=${encodeURIComponent(body)}` : ''}`);
}

/** Opens Mail with a message ready to send. */
export function email(to: string, subject: string, body: string): BridgeResult {
  const params = new URLSearchParams({ subject, body }).toString().replace(/\+/g, '%20');
  return openUrl(`mailto:${encodeURIComponent(to)}?${params}`);
}

/** Opens Apple Maps searching for a place. */
export function showOnMap(query: string): BridgeResult {
  return openUrl(`maps://?q=${encodeURIComponent(query)}`);
}

/** The apps installed on the phone. Only possible with the bridge. */
export async function listApps(): Promise<InstalledApp[] | null> {
  const bridge = native();
  if (!bridge?.listApps) return null;
  try {
    return await bridge.listApps();
  } catch {
    return null;
  }
}

// ---- Hardware -------------------------------------------------------------------------

/** Turns the flashlight on or off. Without the bridge, runs the "Flashlight" Shortcut (it toggles). */
export async function setFlashlight(on: boolean): Promise<BridgeResult> {
  const bridge = native();
  if (bridge?.setFlashlight) {
    try {
      await bridge.setFlashlight(on);
      return { ok: true, via: 'bridge' };
    } catch {
      return { ok: false, reason: 'failed' };
    }
  }
  return runShortcut('Flashlight');
}

/** Sets the screen brightness (0-1). Only possible with the bridge. */
export async function setBrightness(level: number): Promise<BridgeResult> {
  const bridge = native();
  if (!bridge?.setBrightness) return { ok: false, reason: 'unavailable' };
  try {
    await bridge.setBrightness(Math.min(1, Math.max(0, level)));
    return { ok: true, via: 'bridge' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

/** The screen brightness (0-1), or null without the bridge. */
export async function getBrightness(): Promise<number | null> {
  const bridge = native();
  if (!bridge?.getBrightness) return null;
  try {
    return await bridge.getBrightness();
  } catch {
    return null;
  }
}

/** Do Not Disturb. Without the bridge, runs the "DND" Shortcut (it toggles). */
export function toggleDoNotDisturb(): BridgeResult {
  return runShortcut('DND');
}

/** Creates an alarm in the real iOS Clock app (so it rings even when Vantage OS is closed). */
export function createSystemAlarm(time: string, label: string): BridgeResult {
  return runShortcut('CreateAlarm', JSON.stringify({ time, label }));
}

// ---- Battery ----------------------------------------------------------------------------

/** The status bar shows the battery, so poll the bridge twice a minute. */
const BRIDGE_POLL_MS = 30_000;

/**
 * Calls `onChange` with the battery state now and whenever it changes.
 * Calls it with `null` if this device can't tell us (iOS before the jailbreak).
 * Returns a function that stops watching.
 */
export function watchBattery(onChange: (info: BatteryInfo | null) => void): () => void {
  let stopped = false;
  let cleanup = () => {};

  const bridge = native();
  if (bridge?.getBattery) {
    const read = () =>
      bridge.getBattery!()
        .then((info) => !stopped && onChange(info))
        .catch(() => !stopped && onChange(null));
    read();
    const timer = window.setInterval(read, BRIDGE_POLL_MS);
    cleanup = () => window.clearInterval(timer);
  } else if (navigator.getBattery) {
    navigator
      .getBattery()
      .then((battery) => {
        if (stopped) return;
        const report = () => onChange({ level: battery.level, charging: battery.charging });
        report();
        battery.addEventListener('levelchange', report);
        battery.addEventListener('chargingchange', report);
        cleanup = () => {
          battery.removeEventListener('levelchange', report);
          battery.removeEventListener('chargingchange', report);
        };
      })
      .catch(() => !stopped && onChange(null));
  } else {
    onChange(null);
  }

  return () => {
    stopped = true;
    cleanup();
  };
}

// ---- Vantage (VANTAGE.md section 6, step 7) ------------------------------------------------

/**
 * Calls `callback` when the volume chord is pressed (volume up, then down,
 * within 400 ms). Only the jailbreak tweak can see the buttons: without the
 * bridge this does nothing, and Vantage is summoned by touch instead.
 */
export function onVolumeChord(callback: () => void): void {
  try {
    void native()?.onVolumeChord?.(callback);
  } catch {
    // no bridge buttons: Vantage is summoned by touch instead
  }
}

/**
 * Sends a text message. With the bridge it really sends (only ever after
 * the user confirmed the exact text and recipient on an action card).
 * Without it, the Messages app opens with the text filled in and you tap send.
 */
export async function sendMessage(to: string, body: string): Promise<BridgeResult> {
  const bridge = native();
  if (bridge?.sendMessage) {
    try {
      await bridge.sendMessage(to, body);
      return { ok: true, via: 'bridge' };
    } catch {
      return { ok: false, reason: 'failed' };
    }
  }
  return message(to, body);
}

// ---- Real apps (host mode): quick actions, info, removing ------------------------------

/** The app's real quick actions (empty without the bridge). */
export async function getAppShortcuts(bundleId: string): Promise<AppShortcut[]> {
  try {
    return (await native()?.getShortcuts?.(bundleId)) ?? [];
  } catch {
    return [];
  }
}

/** Opens the app with one of its quick actions. */
export async function runAppShortcut(bundleId: string, type: string): Promise<BridgeResult> {
  const bridge = native();
  if (!bridge?.runShortcut) return { ok: false, reason: 'unavailable' };
  try {
    await bridge.runShortcut(bundleId, type);
    return { ok: true, via: 'bridge' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

export async function getAppInfo(bundleId: string): Promise<AppInfo | null> {
  try {
    return (await native()?.getAppInfo?.(bundleId)) ?? null;
  } catch {
    return null;
  }
}

/** Removes an app from the phone. Only call after the user confirmed it on screen. */
export async function uninstallApp(bundleId: string): Promise<BridgeResult> {
  const bridge = native();
  if (!bridge?.uninstallApp) return { ok: false, reason: 'unavailable' };
  try {
    await bridge.uninstallApp(bundleId, true);
    return { ok: true, via: 'bridge' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

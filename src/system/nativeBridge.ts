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
};

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

/** Opens Messages to a number. */
export function message(number: string): BridgeResult {
  return openUrl(`sms:${number.replace(/[^\d+]/g, '')}`);
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

/** Do Not Disturb. Without the bridge, runs the "DND" Shortcut (it toggles). */
export function toggleDoNotDisturb(): BridgeResult {
  return runShortcut('DND');
}

/** Creates an alarm in the real iOS Clock app (so it rings even when Vantage OS is closed). */
export function createSystemAlarm(time: string, label: string): BridgeResult {
  return runShortcut('CreateAlarm', JSON.stringify({ time, label }));
}

// ---- Battery ----------------------------------------------------------------------------

const BRIDGE_POLL_MS = 60_000;

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

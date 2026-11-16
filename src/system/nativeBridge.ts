/**
 * The ONLY place that talks to the phone itself.
 * Rule: use the jailbreak bridge (window.vantageNative) if it exists,
 * otherwise fall back to what a normal web app can do.
 */

export interface BatteryInfo {
  /** 0 = empty, 1 = full */
  level: number;
  charging: boolean;
}

/** What the Phase 2 jailbreak tweak will inject. */
interface VantageNative {
  getBattery?: () => Promise<BatteryInfo>;
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

const BRIDGE_POLL_MS = 60_000;

/**
 * Calls `onChange` with the battery state now and whenever it changes.
 * Calls it with `null` if this device can't tell us (iOS before the jailbreak).
 * Returns a function that stops watching.
 */
export function watchBattery(onChange: (info: BatteryInfo | null) => void): () => void {
  let stopped = false;
  let cleanup = () => {};

  const bridge = window.vantageNative;
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

/**
 * The phone's REAL controls (REAL_OS_PROMPT Part 2, host mode): Wi-Fi,
 * Bluetooth, airplane, cellular, brightness, volume, silent, Do Not Disturb,
 * rotation lock, flashlight, battery, now playing, accessories. SpringBoard
 * reads and changes them through the native bridge and pushes every change
 * (also changes made in iOS itself) as a 'vantage:controls' event.
 * A control iOS can't give is missing here - and then not shown, never faked.
 */
import { useSyncExternalStore } from 'react';
import { hasBridge, isHosted } from './nativeBridge';

export interface PhoneControls {
  wifi?: { on: boolean; network?: string; bars?: number };
  bluetooth?: { on: boolean; devices: { name: string; battery?: number }[] };
  airplane?: boolean;
  cellular?: boolean;
  brightness?: number;
  autoBrightness?: boolean;
  volume?: number;
  ringerVolume?: number;
  silent?: boolean;
  dnd?: boolean;
  rotationLock?: boolean;
  lowPower?: boolean;
  /** 0 = off, up to 1 (iOS has 4 levels) */
  flashlight?: number;
  battery?: { level: number; charging: boolean; health?: number };
  nowPlaying?: {
    title: string;
    artist?: string;
    album?: string;
    /** JPEG, base64 */
    artwork?: string;
    playing: boolean;
    duration?: number;
    elapsed?: number;
    app?: string;
  };
  accessories?: { name: string; level: number; charging: boolean }[];
}

export type ControlName = 'wifi' | 'bluetooth' | 'airplane' | 'cellular' | 'brightness' | 'volume' | 'ringerVolume' | 'silent' | 'dnd' | 'rotationLock' | 'flashlight';

interface ControlsBridge {
  getControls?: () => Promise<PhoneControls>;
  setControl?: (name: string, value: boolean | number) => Promise<void>;
  media?: (command: string) => Promise<void>;
}

const bridge = () => window.vantageNative as ControlsBridge | undefined;

let state: PhoneControls = {};
const listeners = new Set<() => void>();
const emit = (next: PhoneControls) => {
  state = next;
  listeners.forEach((listener) => listener());
};

/** True when the real controls are there (host mode with the bridge). */
export function hasRealControls(): boolean {
  return isHosted() && hasBridge() && !!bridge()?.getControls;
}

export function getControls(): PhoneControls {
  return state;
}

export function useControls(): PhoneControls {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}

/** Changes a real control. The screen updates at once; SpringBoard confirms right after. */
export async function setControl(name: ControlName, value: boolean | number): Promise<boolean> {
  const set = bridge()?.setControl;
  if (!set) return false;
  // Optimistic: show it now (the push from SpringBoard corrects it if iOS said no)
  const next: PhoneControls = { ...state };
  if (name === 'wifi' && next.wifi) next.wifi = { ...next.wifi, on: !!value };
  else if (name === 'bluetooth' && next.bluetooth) next.bluetooth = { ...next.bluetooth, on: !!value };
  else if (name === 'flashlight') next.flashlight = typeof value === 'number' ? value : value ? 1 : 0;
  else (next as Record<string, unknown>)[name] = value;
  emit(next);
  // Sliders (brightness, volume) send many values while dragging: at most one
  // request every 80 ms to SpringBoard, always ending with the last value.
  if (typeof value === 'number' && name !== 'flashlight') return throttled(name, value);
  try {
    await set(name, value);
    return true;
  } catch {
    void refreshControls();
    return false;
  }
}

const pending = new Map<string, number>();
const timers = new Map<string, number>();
function throttled(name: ControlName, value: number): Promise<boolean> {
  pending.set(name, value);
  if (!timers.has(name)) {
    const send = () => {
      const latest = pending.get(name);
      pending.delete(name);
      if (latest === undefined) {
        timers.delete(name);
        return;
      }
      void bridge()?.setControl?.(name, latest).catch(() => void refreshControls());
      timers.set(name, window.setTimeout(send, 80));
    };
    send();
  }
  return Promise.resolve(true);
}

/** Media of whatever app is playing: 'toggle', 'play', 'pause', 'next', 'previous'. */
export async function mediaCommand(command: 'toggle' | 'play' | 'pause' | 'next' | 'previous'): Promise<void> {
  if (command === 'toggle' && state.nowPlaying) emit({ ...state, nowPlaying: { ...state.nowPlaying, playing: !state.nowPlaying.playing } });
  await bridge()?.media?.(command).catch(() => {});
}

export async function refreshControls(): Promise<void> {
  const next = await bridge()?.getControls?.().catch(() => null);
  if (next) emit(next);
}

/** Starts listening (host mode only). */
export function installPhoneControls(): void {
  if (!hasRealControls()) return;
  void refreshControls();
  window.addEventListener('vantage:controls', (event) => {
    const detail = (event as CustomEvent<PhoneControls>).detail;
    if (detail && typeof detail === 'object') emit(detail);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refreshControls();
  });
}

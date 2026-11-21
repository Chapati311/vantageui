/**
 * Sends the current look to SpringBoard (host mode), so the parts of the phone
 * iOS draws itself - the lock screen above all - wear the Vantage theme too
 * (DEVICE_QA: waking the phone showed the plain iOS lock screen). Only colours
 * and a few choices go over; SpringBoard saves them as theme.json.
 */
import { isHosted } from './nativeBridge';

export interface NativeTheme {
  bg: string;
  surface: string;
  text: string;
  text2: string;
  accent: string;
  dark: boolean;
  retro: boolean;
  preset: string;
  clock: string;
  /** "Hacker" looks: the clock as a terminal prompt */
  terminal: boolean;
}

interface ThemeBridge {
  setNativeTheme?: (theme: NativeTheme) => Promise<void>;
}

let last = '';
let timer = 0;

export function exportThemeToPhone(theme: NativeTheme): void {
  const native = window.vantageNative as ThemeBridge | undefined;
  if (!isHosted() || !native?.setNativeTheme) return;
  const json = JSON.stringify(theme);
  if (json === last) return;
  window.clearTimeout(timer);
  // Many quick changes (a colour slider) become one
  timer = window.setTimeout(() => {
    last = json;
    void native.setNativeTheme?.(theme).catch(() => {
      last = '';
    });
  }, 400);
}

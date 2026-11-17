import { useSyncExternalStore } from 'react';
import { createSystemAlarm } from '../../system/nativeBridge';
import { pushNotification } from '../../system/notifications';
import { playAlarmSound, stopAlarmSound, type AlarmSoundId } from './alarmSounds';

/**
 * Alarms. They ring inside Vantage while it is open (the screen can be
 * locked in Vantage, but the app must be running): a web app cannot wake a
 * sleeping iPhone. For alarms that must ring with the phone asleep, the
 * "CreateAlarm" iOS Shortcut also sets one in Apple's Clock app.
 */

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  label: string;
  /** Monday first; all false = rings once */
  days: boolean[];
  enabled: boolean;
  /** null = the default sound */
  sound: AlarmSoundId | null;
}

export interface AlarmSettings {
  defaultSound: AlarmSoundId;
  snoozeMinutes: number;
  /** Fade in over 30 seconds */
  gentleWake: boolean;
  vibrate: boolean;
  /** 0-1 */
  volume: number;
}

interface Ringing {
  alarmId: string;
  /** What to show: the alarm's time and label */
  hour: number;
  minute: number;
  label: string;
}

interface AlarmState {
  alarms: Alarm[];
  settings: AlarmSettings;
  ringing: Ringing | null;
  /** Snoozed alarms: when they ring again (ms) */
  snoozed: { alarmId: string; at: number }[];
}

const STORAGE_KEY = 'vantage.alarms.v1';
const DEFAULT_SETTINGS: AlarmSettings = { defaultSound: 'calm-chimes', snoozeMinutes: 9, gentleWake: true, vibrate: true, volume: 0.8 };

function load(): AlarmState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && Array.isArray(saved.alarms)) {
      return { alarms: saved.alarms, settings: { ...DEFAULT_SETTINGS, ...saved.settings }, ringing: null, snoozed: saved.snoozed ?? [] };
    }
  } catch {
    // Start fresh
  }
  return { alarms: [], settings: DEFAULT_SETTINGS, ringing: null, snoozed: [] };
}

let state = load();
const listeners = new Set<() => void>();
/** "alarmId@YYYY-M-D H:M" for the minute each alarm last rang, so it rings once per minute */
const rangAt = new Set<string>();

function update(patch: Partial<AlarmState>): void {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ alarms: state.alarms, settings: state.settings, snoozed: state.snoozed }));
  } catch {
    // Kept until reload.
  }
  listeners.forEach((listener) => listener());
}

export function saveAlarm(alarm: Alarm): void {
  const exists = state.alarms.some((item) => item.id === alarm.id);
  const alarms = exists ? state.alarms.map((item) => (item.id === alarm.id ? alarm : item)) : [...state.alarms, alarm];
  update({ alarms: alarms.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)) });
}

export function deleteAlarm(id: string): void {
  update({ alarms: state.alarms.filter((alarm) => alarm.id !== id), snoozed: state.snoozed.filter((item) => item.alarmId !== id) });
}

export function setAlarmEnabled(id: string, enabled: boolean): void {
  update({ alarms: state.alarms.map((alarm) => (alarm.id === id ? { ...alarm, enabled } : alarm)) });
}

export function updateAlarmSettings(patch: Partial<AlarmSettings>): void {
  update({ settings: { ...state.settings, ...patch } });
}

export function newAlarm(): Alarm {
  return { id: `alarm-${Date.now().toString(36)}`, hour: 7, minute: 0, label: '', days: Array(7).fill(false), enabled: true, sound: null };
}

/** Also sets the alarm in Apple's Clock app, through the "CreateAlarm" Shortcut (or the bridge). */
export function addToIPhoneClock(alarm: Alarm): ReturnType<typeof createSystemAlarm> {
  const time = `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`;
  return createSystemAlarm(time, alarm.label || 'Vantage alarm');
}

function ring(alarm: Alarm): void {
  const { settings } = state;
  update({ ringing: { alarmId: alarm.id, hour: alarm.hour, minute: alarm.minute, label: alarm.label } });
  void playAlarmSound(alarm.sound ?? settings.defaultSound, settings.volume, settings.gentleWake);
  if (settings.vibrate) navigator.vibrate?.([600, 400, 600, 400, 600]);
  pushNotification({ appId: 'clock', title: 'Alarm', body: alarm.label || `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}` });
}

/** Stop: one-time alarms switch themselves off. */
export function stopRinging(): void {
  const ringing = state.ringing;
  stopAlarmSound();
  navigator.vibrate?.(0);
  if (!ringing) return;
  const alarm = state.alarms.find((item) => item.id === ringing.alarmId);
  const oneTime = alarm && !alarm.days.some(Boolean);
  update({
    ringing: null,
    alarms: oneTime ? state.alarms.map((item) => (item.id === alarm.id ? { ...item, enabled: false } : item)) : state.alarms,
  });
}

export function snooze(): void {
  const ringing = state.ringing;
  stopAlarmSound();
  navigator.vibrate?.(0);
  if (!ringing) return;
  update({ ringing: null, snoozed: [...state.snoozed, { alarmId: ringing.alarmId, at: Date.now() + state.settings.snoozeMinutes * 60_000 }] });
}

/** Checks every few seconds whether an alarm (or a snoozed one) is due. */
function check(): void {
  if (state.ringing) return;
  const now = new Date();
  const due = state.snoozed.find((item) => item.at <= now.getTime());
  if (due) {
    const alarm = state.alarms.find((item) => item.id === due.alarmId);
    update({ snoozed: state.snoozed.filter((item) => item !== due) });
    if (alarm) ring(alarm);
    return;
  }
  const weekday = (now.getDay() + 6) % 7;
  for (const alarm of state.alarms) {
    if (!alarm.enabled || alarm.hour !== now.getHours() || alarm.minute !== now.getMinutes()) continue;
    if (alarm.days.some(Boolean) && !alarm.days[weekday]) continue;
    const key = `${alarm.id}@${now.toDateString()} ${now.getHours()}:${now.getMinutes()}`;
    if (rangAt.has(key)) continue;
    rangAt.add(key);
    ring(alarm);
    return;
  }
}

window.setInterval(check, 5000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());

export function useAlarms(): AlarmState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

/** "in 7 h 20 min" until the alarm next rings. */
export function untilNext(alarm: Alarm, now = new Date()): string {
  for (let offset = 0; offset < 8; offset += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, alarm.hour, alarm.minute);
    if (day <= now) continue;
    const weekday = (day.getDay() + 6) % 7;
    if (alarm.days.some(Boolean) && !alarm.days[weekday]) continue;
    const minutes = Math.round((day.getTime() - now.getTime()) / 60_000);
    const hours = Math.floor(minutes / 60);
    return hours ? `in ${hours} h ${minutes % 60} min` : `in ${minutes} min`;
  }
  return '';
}

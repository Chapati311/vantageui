import { useSyncExternalStore } from 'react';
import { dbDelete, dbGetAll, dbPut } from './db';
import { pushNotification } from './notifications';

/**
 * Reminders, saved on the phone. One with a due time posts a notification
 * when it is due (while Vantage is open).
 */

export interface Reminder {
  id: string;
  title: string;
  /** "2026-11-17" or null */
  date: string | null;
  /** "08:00" or null */
  time: string | null;
  done: boolean;
  /** Already notified about */
  notified: boolean;
  createdAt: number;
}

interface ReminderState {
  reminders: Reminder[];
  loaded: boolean;
}

let state: ReminderState = { reminders: [], loaded: false };
const listeners = new Set<() => void>();

const dueKey = (reminder: Reminder) => `${reminder.date ?? '9999-12-31'} ${reminder.time ?? '23:59'}`;

function update(reminders: Reminder[]): void {
  state = { reminders: [...reminders].sort((a, b) => dueKey(a).localeCompare(dueKey(b)) || a.createdAt - b.createdAt), loaded: true };
  listeners.forEach((listener) => listener());
}

async function load(): Promise<void> {
  try {
    update(await dbGetAll<Reminder>('reminders'));
  } catch {
    update([]);
  }
}

export async function saveReminder(reminder: Reminder): Promise<void> {
  update([...state.reminders.filter((item) => item.id !== reminder.id), reminder]);
  await dbPut('reminders', reminder);
}

export async function setReminderDone(id: string, done: boolean): Promise<void> {
  const reminder = state.reminders.find((item) => item.id === id);
  if (reminder) await saveReminder({ ...reminder, done });
}

export async function deleteReminder(id: string): Promise<void> {
  update(state.reminders.filter((item) => item.id !== id));
  await dbDelete('reminders', id);
}

export function newReminder(): Reminder {
  return { id: `rem-${Date.now().toString(36)}`, title: '', date: null, time: null, done: false, notified: false, createdAt: Date.now() };
}

export function useReminders(): ReminderState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      if (!state.loaded) void load();
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

/** Is it due (date and time passed)? */
export function isDue(reminder: Reminder, now = new Date()): boolean {
  if (!reminder.date) return false;
  // A reminder for a day without a time is only late once that day is over
  if (!reminder.time) return new Date(`${reminder.date}T23:59:59`).getTime() < now.getTime();
  return new Date(`${reminder.date}T${reminder.time ?? '00:00'}:00`).getTime() <= now.getTime();
}

// Every 30 seconds: notify about reminders that just became due
window.setInterval(() => {
  if (!state.loaded) return;
  for (const reminder of state.reminders) {
    if (reminder.done || reminder.notified || !reminder.time || !isDue(reminder)) continue;
    pushNotification({ appId: 'reminders', title: 'Reminder', body: reminder.title });
    void saveReminder({ ...reminder, notified: true });
  }
}, 30_000);
void load();

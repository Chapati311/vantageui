import { useSyncExternalStore } from 'react';
import { dbDelete, dbGetAll, dbPut } from './db';

/**
 * Calendar events, saved on the phone (IndexedDB). The iPhone's own
 * calendars need the native bridge; until then, Vantage keeps its own.
 */

export interface CalendarEvent {
  id: string;
  title: string;
  /** "2026-11-17" */
  date: string;
  /** "14:30", or null for all day */
  time: string | null;
  /** Minutes; only for events with a time */
  duration: number;
  note: string;
}

interface EventState {
  events: CalendarEvent[];
  loaded: boolean;
}

let state: EventState = { events: [], loaded: false };
const listeners = new Set<() => void>();

const sortKey = (event: CalendarEvent) => `${event.date} ${event.time ?? '00:00'}`;

function update(events: CalendarEvent[]): void {
  state = { events: [...events].sort((a, b) => sortKey(a).localeCompare(sortKey(b))), loaded: true };
  listeners.forEach((listener) => listener());
}

async function load(): Promise<void> {
  try {
    // An event with a broken date (an old bug) would crash date formatting: skip it.
    update((await dbGetAll<CalendarEvent>('events')).filter((event) => /^\d{4}-\d{2}-\d{2}$/.test(event.date)));
  } catch {
    update([]);
  }
}

export async function saveEvent(event: CalendarEvent): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) return;
  update([...state.events.filter((item) => item.id !== event.id), event]);
  await dbPut('events', event);
}

export async function deleteEvent(id: string): Promise<void> {
  update(state.events.filter((item) => item.id !== id));
  await dbDelete('events', id);
}

export function useEvents(): EventState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      if (!state.loaded) void load();
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

/** "2026-11-17" for a Date, in local time. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The next event from now on (today's later ones first), or undefined. */
export function nextEvent(events: CalendarEvent[], now = new Date()): CalendarEvent | undefined {
  const today = dayKey(now);
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return events.find((event) => event.date > today || (event.date === today && (event.time === null || event.time >= time)));
}

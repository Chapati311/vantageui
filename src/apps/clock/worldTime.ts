import { useSyncExternalStore } from 'react';

/** Cities you can add to the world clock, with where they are on the globe. */
export const ALL_CITIES = [
  { name: 'Zurich', timeZone: 'Europe/Zurich', lat: 47.37, lon: 8.54 },
  { name: 'London', timeZone: 'Europe/London', lat: 51.51, lon: -0.13 },
  { name: 'Paris', timeZone: 'Europe/Paris', lat: 48.86, lon: 2.35 },
  { name: 'Berlin', timeZone: 'Europe/Berlin', lat: 52.52, lon: 13.4 },
  { name: 'Istanbul', timeZone: 'Europe/Istanbul', lat: 41.01, lon: 28.98 },
  { name: 'Dubai', timeZone: 'Asia/Dubai', lat: 25.2, lon: 55.27 },
  { name: 'Mumbai', timeZone: 'Asia/Kolkata', lat: 19.08, lon: 72.88 },
  { name: 'Singapore', timeZone: 'Asia/Singapore', lat: 1.35, lon: 103.82 },
  { name: 'Hong Kong', timeZone: 'Asia/Hong_Kong', lat: 22.32, lon: 114.17 },
  { name: 'Tokyo', timeZone: 'Asia/Tokyo', lat: 35.68, lon: 139.69 },
  { name: 'Sydney', timeZone: 'Australia/Sydney', lat: -33.87, lon: 151.21 },
  { name: 'Auckland', timeZone: 'Pacific/Auckland', lat: -36.85, lon: 174.76 },
  { name: 'Honolulu', timeZone: 'Pacific/Honolulu', lat: 21.31, lon: -157.86 },
  { name: 'Los Angeles', timeZone: 'America/Los_Angeles', lat: 34.05, lon: -118.24 },
  { name: 'Denver', timeZone: 'America/Denver', lat: 39.74, lon: -104.99 },
  { name: 'Chicago', timeZone: 'America/Chicago', lat: 41.88, lon: -87.63 },
  { name: 'New York', timeZone: 'America/New_York', lat: 40.71, lon: -74.01 },
  { name: 'São Paulo', timeZone: 'America/Sao_Paulo', lat: -23.55, lon: -46.63 },
  { name: 'Cairo', timeZone: 'Africa/Cairo', lat: 30.04, lon: 31.24 },
  { name: 'Nairobi', timeZone: 'Africa/Nairobi', lat: -1.29, lon: 36.82 },
];

export type City = (typeof ALL_CITIES)[number];

/** Kept for the world clock widget and older code. */
export const WORLD_CITIES = ALL_CITIES;

const STORAGE_KEY = 'vantage.worldCities.v1';
const DEFAULT = ['Europe/Zurich', 'Europe/London', 'America/New_York', 'Asia/Tokyo'];

function load(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (Array.isArray(saved)) return saved.filter((zone) => ALL_CITIES.some((city) => city.timeZone === zone));
  } catch {
    // Default list
  }
  return DEFAULT;
}

let chosen = load();
const listeners = new Set<() => void>();

function store(next: string[]): void {
  chosen = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chosen));
  } catch {
    // Kept until reload.
  }
  listeners.forEach((listener) => listener());
}

export function addCity(timeZone: string): void {
  if (!chosen.includes(timeZone)) store([...chosen, timeZone]);
}

export function removeCity(timeZone: string): void {
  store(chosen.filter((zone) => zone !== timeZone));
}

/** The cities in your world clock, in your order. */
export function useWorldCities(): City[] {
  const zones = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => chosen,
  );
  return zones.map((zone) => ALL_CITIES.find((city) => city.timeZone === zone)!).filter(Boolean);
}

export interface CityTime {
  /** "14:05" */
  time: string;
  /** "Today · +8h", "Tomorrow · +9h", "Same time" */
  note: string;
  /** Hour of the day there, with minutes as a fraction (14.5 = 14:30) */
  hour: number;
}

/** What the clock on the wall says in `timeZone` at the moment `now`. */
export function cityTime(now: Date, timeZone: string): CityTime {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';

  // Compare "wall clock" times as if both were in the same zone.
  const thereDay = Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day')));
  const there = thereDay + (Number(part('hour')) * 60 + Number(part('minute'))) * 60_000;
  const hereDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const here = hereDay + (now.getHours() * 60 + now.getMinutes()) * 60_000;

  const offsetMinutes = Math.round((there - here) / 60_000);
  const dayDifference = Math.round((thereDay - hereDay) / 86_400_000);

  const day = dayDifference === 0 ? 'Today' : dayDifference > 0 ? 'Tomorrow' : 'Yesterday';
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const offset = `${offsetMinutes > 0 ? '+' : '-'}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}h`;

  return {
    time: `${part('hour')}:${part('minute')}`,
    note: offsetMinutes === 0 ? 'Same time' : `${day} · ${offset}`,
    hour: Number(part('hour')) + Number(part('minute')) / 60,
  };
}

/** Where the sun is straight overhead right now (degrees), for day and night on the globe. */
export function subsolarPoint(now: Date): { lat: number; lon: number } {
  const dayOfYear = (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86_400_000;
  const lat = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  return { lat, lon: (12 - utcHours) * 15 };
}

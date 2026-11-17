import { useSyncExternalStore } from 'react';
import { WEATHER_PLACE } from './weather';

/**
 * UV index and air quality from Open-Meteo's free air quality API (no key).
 * Downloaded at most every 30 minutes; the last result is kept for offline.
 */

export interface AirQuality {
  fetchedAt: number;
  /** UV index right now (0-11+) */
  uv: number;
  /** European Air Quality Index (0 = clean ... 100+ = very poor) */
  aqi: number;
}

interface AirState {
  data: AirQuality | null;
  status: 'idle' | 'loading' | 'error';
}

const STORAGE_KEY = 'vantage.air.v1';
const MAX_AGE_MS = 30 * 60_000;

function loadSaved(): AirQuality | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return saved && typeof saved.uv === 'number' && typeof saved.aqi === 'number' ? saved : null;
  } catch {
    return null;
  }
}

let state: AirState = { data: loadSaved(), status: 'idle' };
const listeners = new Set<() => void>();

function update(patch: Partial<AirState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export async function refreshAirQuality(force = false): Promise<void> {
  if (state.status === 'loading') return;
  if (!force && state.data && Date.now() - state.data.fetchedAt < MAX_AGE_MS) return;
  update({ status: 'loading' });
  try {
    const url =
      'https://air-quality-api.open-meteo.com/v1/air-quality' +
      `?latitude=${WEATHER_PLACE.latitude}&longitude=${WEATHER_PLACE.longitude}` +
      `&current=uv_index,european_aqi&timezone=${encodeURIComponent(WEATHER_PLACE.timeZone)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(String(response.status));
    const json = (await response.json()) as { current?: { uv_index?: number; european_aqi?: number } };
    const data: AirQuality = {
      fetchedAt: Date.now(),
      uv: Math.round((json.current?.uv_index ?? 0) * 10) / 10,
      aqi: Math.round(json.current?.european_aqi ?? 0),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Not saved for offline; still shown.
    }
    update({ data, status: 'idle' });
  } catch {
    update({ status: 'error' });
  }
}

export function useAirQuality(): AirState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      void refreshAirQuality();
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

/** Plain words for the European AQI. */
export function aqiWord(aqi: number): string {
  if (aqi <= 20) return 'Good';
  if (aqi <= 40) return 'Fair';
  if (aqi <= 60) return 'Moderate';
  if (aqi <= 80) return 'Poor';
  if (aqi <= 100) return 'Very poor';
  return 'Extremely poor';
}

/** Plain words for the UV index. */
export function uvWord(uv: number): string {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very high';
  return 'Extreme';
}

import { useSyncExternalStore } from 'react';

/**
 * Real weather from the free Open-Meteo API (no key needed).
 * One shared copy for the whole OS: the Weather app and the home screen
 * widget both read from here, so they always show the same numbers.
 * The last result is saved on the device, so something shows offline too.
 */

/** Where the weather is for. Change this to move the forecast. */
export const WEATHER_PLACE = {
  name: 'Zurich',
  latitude: 47.3769,
  longitude: 8.5417,
  timeZone: 'Europe/Zurich',
};

/** The few kinds of weather we have a drawing for. */
export type WeatherKind = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

export interface WeatherNow {
  temperature: number;
  feelsLike: number;
  kind: WeatherKind;
  condition: string;
  /** km/h */
  wind: number;
  /** percent */
  humidity: number;
}

export interface WeatherHour {
  /** Hour of the day, 0-23 */
  hour: number;
  temperature: number;
  kind: WeatherKind;
  /** Chance of rain, percent */
  rainChance: number;
}

export interface WeatherDay {
  /** "2026-11-16" */
  date: string;
  kind: WeatherKind;
  condition: string;
  high: number;
  low: number;
  rainChance: number;
}

export interface Weather {
  /** When this was downloaded (milliseconds) */
  fetchedAt: number;
  place: string;
  now: WeatherNow;
  /** The next 24 hours, starting with the current hour */
  hourly: WeatherHour[];
  /** 7 days, starting today */
  daily: WeatherDay[];
}

export interface WeatherState {
  data: Weather | null;
  status: 'idle' | 'loading' | 'error';
}

/** Download again when the saved weather is older than this. */
const MAX_AGE_MS = 15 * 60_000;
const STORAGE_KEY = 'vantage.weather.v1';

/** Open-Meteo sends a "WMO weather code". This turns it into words and a drawing. */
function describe(code: number): { kind: WeatherKind; condition: string } {
  if (code === 0) return { kind: 'clear', condition: 'Clear' };
  if (code === 1) return { kind: 'clear', condition: 'Mostly clear' };
  if (code === 2) return { kind: 'cloudy', condition: 'Partly cloudy' };
  if (code === 3) return { kind: 'cloudy', condition: 'Cloudy' };
  if (code === 45 || code === 48) return { kind: 'fog', condition: 'Fog' };
  if (code >= 51 && code <= 57) return { kind: 'rain', condition: 'Drizzle' };
  if (code >= 61 && code <= 67) return { kind: 'rain', condition: 'Rain' };
  if (code >= 71 && code <= 77) return { kind: 'snow', condition: 'Snow' };
  if (code >= 80 && code <= 82) return { kind: 'rain', condition: 'Showers' };
  if (code === 85 || code === 86) return { kind: 'snow', condition: 'Snow showers' };
  if (code >= 95) return { kind: 'storm', condition: 'Thunderstorm' };
  return { kind: 'cloudy', condition: 'Cloudy' };
}

/** The shape of the part of Open-Meteo's answer that we use. */
interface ApiResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: (number | null)[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
  };
}

async function download(): Promise<Weather> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(WEATHER_PLACE.latitude),
    longitude: String(WEATHER_PLACE.longitude),
    timezone: WEATHER_PLACE.timeZone,
    forecast_days: '7',
    current:
      'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  }).toString();

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo answered ${response.status}`);
  const api = (await response.json()) as ApiResponse;

  // Hourly data starts at midnight. Skip ahead to the current hour.
  const currentHour = api.current.time.slice(0, 13); // "2026-11-16T17"
  const first = Math.max(
    0,
    api.hourly.time.findIndex((time) => time.slice(0, 13) === currentHour),
  );

  return {
    fetchedAt: Date.now(),
    place: WEATHER_PLACE.name,
    now: {
      temperature: Math.round(api.current.temperature_2m),
      feelsLike: Math.round(api.current.apparent_temperature),
      wind: Math.round(api.current.wind_speed_10m),
      humidity: Math.round(api.current.relative_humidity_2m),
      ...describe(api.current.weather_code),
    },
    hourly: api.hourly.time.slice(first, first + 24).map((time, offset) => {
      const index = first + offset;
      return {
        hour: Number(time.slice(11, 13)),
        temperature: Math.round(api.hourly.temperature_2m[index]),
        kind: describe(api.hourly.weather_code[index]).kind,
        rainChance: api.hourly.precipitation_probability[index] ?? 0,
      };
    }),
    daily: api.daily.time.map((date, index) => ({
      date,
      high: Math.round(api.daily.temperature_2m_max[index]),
      low: Math.round(api.daily.temperature_2m_min[index]),
      rainChance: api.daily.precipitation_probability_max[index] ?? 0,
      ...describe(api.daily.weather_code[index]),
    })),
  };
}

function loadSaved(): Weather | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return saved?.now && Array.isArray(saved.hourly) && Array.isArray(saved.daily) ? saved : null;
  } catch {
    return null;
  }
}

let state: WeatherState = { data: loadSaved(), status: 'idle' };
const listeners = new Set<() => void>();

function setState(next: WeatherState): void {
  state = next;
  listeners.forEach((notify) => notify());
}

/** Downloads the weather if what we have is missing or old. `force` always downloads. */
export function refreshWeather(force = false): void {
  if (state.status === 'loading') return;
  const fresh = state.data && Date.now() - state.data.fetchedAt < MAX_AGE_MS;
  if (fresh && !force) return;

  setState({ data: state.data, status: 'loading' });
  download()
    .then((data) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Storage full or blocked: it still works until reload.
      }
      setState({ data, status: 'idle' });
    })
    .catch(() => setState({ data: state.data, status: 'error' })); // keep the old numbers
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  refreshWeather();
  return () => listeners.delete(listener);
}

// Check for newer weather whenever the phone wakes up or comes back online.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && listeners.size > 0) refreshWeather();
});
window.addEventListener('online', () => {
  if (listeners.size > 0) refreshWeather();
});

/** The current weather. Anything that calls this stays up to date. */
export function useWeather(): WeatherState {
  return useSyncExternalStore(subscribe, () => state);
}

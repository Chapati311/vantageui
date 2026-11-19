import { useEffect, useSyncExternalStore } from 'react';

/**
 * Exchange rates for the calculator's converter, from the European Central
 * Bank via frankfurter.dev (free, no key, updated once a working day). The
 * last rates are kept on the phone, so converting works offline too (with
 * the date shown).
 */

export const CURRENCIES = ['CHF', 'EUR', 'USD', 'GBP', 'JPY', 'INR', 'CAD', 'AUD'] as const;
export type Currency = (typeof CURRENCIES)[number];

interface Rates {
  /** "2026-11-18" */
  date: string;
  /** Units per 1 EUR */
  rates: Record<string, number>;
}

interface RatesState {
  data: Rates | null;
  status: 'idle' | 'loading' | 'error';
}

const KEY = 'vantage.rates.v1';
const MAX_AGE_MS = 12 * 3_600_000;

function read(): Rates | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as (Rates & { fetchedAt?: number }) | null;
    return saved && typeof saved.rates === 'object' ? saved : null;
  } catch {
    return null;
  }
}

let state: RatesState = { data: read(), status: 'idle' };
const listeners = new Set<() => void>();
const update = (patch: Partial<RatesState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

export async function refreshRates(): Promise<void> {
  const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { fetchedAt?: number } | null;
  if (saved?.fetchedAt && Date.now() - saved.fetchedAt < MAX_AGE_MS) return;
  if (state.status === 'loading') return;
  update({ status: 'loading' });
  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${CURRENCIES.filter((c) => c !== 'EUR').join(',')}`,
    );
    if (!response.ok) throw new Error(String(response.status));
    const body = (await response.json()) as { date: string; rates: Record<string, number> };
    const data: Rates = { date: body.date, rates: { ...body.rates, EUR: 1 } };
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...data, fetchedAt: Date.now() }));
    } catch {
      // Storage full: the rates still work until the app closes
    }
    update({ data, status: 'idle' });
  } catch {
    update({ status: 'error' });
  }
}

/** Converts using the saved rates (null without rates). */
export function convertCurrency(value: number, from: Currency, to: Currency, rates: Rates | null): number | null {
  if (!rates || !rates.rates[from] || !rates.rates[to]) return null;
  return (value / rates.rates[from]) * rates.rates[to];
}

export function useRates(): RatesState {
  useEffect(() => void refreshRates(), []);
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

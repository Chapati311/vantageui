/**
 * Live numbers about this phone (Netrunner, Hacker widgets): its addresses,
 * traffic counters, CPU and memory, from the root helper's "stats". Polled
 * while something on screen uses it; the traffic rate is worked out from two
 * readings.
 */
import { useEffect, useState } from 'react';
import { askTool, hasRootTools } from '../../system/rootTools';

export interface InterfaceStats {
  ipv4?: string;
  ipv6?: string;
  netmask?: string;
  rx?: number;
  tx?: number;
}

export interface PhoneStats {
  cpu: { user: number; system: number; idle: number; nice: number };
  memory: { total: number; free: number; active: number; wired: number; compressed: number };
  bootTime: number;
  now: number;
  interfaces: Record<string, InterfaceStats>;
}

export interface LiveStats {
  stats: PhoneStats | null;
  /** bytes per second down / up on Wi-Fi (en0) + mobile data (pdp_ip0) */
  down: number;
  up: number;
  /** 0-1 since the last reading */
  cpu: number;
  history: { down: number; up: number }[];
  error: string | null;
}

const EMPTY: LiveStats = { stats: null, down: 0, up: 0, cpu: 0, history: [], error: null };
let current: LiveStats = EMPTY;
let previous: { at: number; rx: number; tx: number; busy: number; total: number } | null = null;
const listeners = new Set<(value: LiveStats) => void>();
let timer = 0;

async function read(): Promise<void> {
  try {
    const answer = await askTool('run', 'stats');
    const stats = answer.data as PhoneStats;
    const totals = Object.entries(stats.interfaces)
      .filter(([name]) => name === 'en0' || name.startsWith('pdp_ip'))
      .reduce((sum, [, i]) => ({ rx: sum.rx + (i.rx ?? 0), tx: sum.tx + (i.tx ?? 0) }), { rx: 0, tx: 0 });
    const busy = stats.cpu.user + stats.cpu.system + stats.cpu.nice;
    const total = busy + stats.cpu.idle;
    const at = performance.now();
    let down = 0;
    let up = 0;
    let cpu = current.cpu;
    if (previous) {
      const seconds = Math.max(0.2, (at - previous.at) / 1000);
      // Counters are 32-bit on iOS: a wrap shows as a negative step, skip it
      down = Math.max(0, totals.rx - previous.rx) / seconds;
      up = Math.max(0, totals.tx - previous.tx) / seconds;
      cpu = total > previous.total ? (busy - previous.busy) / (total - previous.total) : cpu;
    }
    previous = { at, rx: totals.rx, tx: totals.tx, busy, total };
    current = { stats, down, up, cpu, history: [...current.history, { down, up }].slice(-60), error: null };
  } catch (error) {
    current = { ...current, error: (error as Error).message };
  }
  listeners.forEach((listener) => listener(current));
}

/** Live stats, read every 2 s while at least one screen uses them. */
export function useLiveStats(): LiveStats {
  const [value, setValue] = useState(current);
  useEffect(() => {
    if (!hasRootTools()) {
      setValue({ ...EMPTY, error: 'Runs on the jailbroken iPhone.' });
      return;
    }
    listeners.add(setValue);
    if (listeners.size === 1) {
      void read();
      timer = window.setInterval(() => document.visibilityState === 'visible' && void read(), 2000);
    }
    return () => {
      listeners.delete(setValue);
      if (!listeners.size) {
        window.clearInterval(timer);
        previous = null;
      }
    };
  }, []);
  return value;
}

/** A small line chart path for a series, fitted to w x h. */
export function sparkPath(values: number[], w: number, h: number, max = Math.max(1, ...values)): string {
  if (values.length < 2) return '';
  const step = w / (values.length - 1);
  return values.map((v, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`).join(' ');
}

export function rate(bytesPerSecond: number): string {
  const bits = bytesPerSecond * 8;
  if (bits >= 1e6) return `${(bits / 1e6).toFixed(1)} Mb/s`;
  if (bits >= 1e3) return `${Math.round(bits / 1e3)} kb/s`;
  return `${Math.round(bits)} b/s`;
}

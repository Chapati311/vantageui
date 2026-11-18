/**
 * The brains of search, as pure functions (tested in searchEngine.test.ts):
 * fuzzy matching, math ("12*7"), unit conversion ("5 km in mi") and
 * understanding commands ("start 25 min focus", "timer 10").
 */

// ---- Fuzzy matching ---------------------------------------------------------

/**
 * How well `query` matches `text`: 0 = not at all, higher = better.
 * Whole-word start beats inside a word, which beats letters in order
 * ("clc" finds "Calculator"), with a small typo allowance for longer words.
 */
export function fuzzyScore(query: string, text: string): number {
  const q = query.trim().toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 90 - (t.length - q.length) * 0.1;
  if (t.split(/[\s-]+/).some((word) => word.startsWith(q))) return 75;
  if (t.includes(q)) return 60;
  // Letters in order, with gaps
  let position = 0;
  let gaps = 0;
  for (const char of q) {
    const found = t.indexOf(char, position);
    if (found < 0) {
      position = -1;
      break;
    }
    gaps += found - position;
    position = found + 1;
  }
  if (position >= 0 && q.length >= 2) return Math.max(20, 50 - gaps * 2);
  // One wrong letter in a longer word ("calandar")
  if (q.length >= 4 && t.length >= 4 && editDistance(q, t.slice(0, q.length)) <= 1) return 30;
  return 0;
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

/** The best score over a name and its keywords (keywords count a bit less). */
export function bestScore(query: string, name: string, keywords: string[] = []): number {
  return Math.max(fuzzyScore(query, name), ...keywords.map((word) => fuzzyScore(query, word) * 0.8));
}

// ---- Math ------------------------------------------------------------------

/**
 * Works out a math expression safely (no eval): + - * / ^ %, brackets,
 * "x" or "×" for times, "÷" for divide. Returns null if it isn't math.
 */
export function calculate(input: string): number | null {
  const text = input.replace(/\s+/g, '').replace(/[x×]/gi, '*').replace(/÷/g, '/').replace(/,/g, '.');
  // Must contain a digit and an operator, and nothing but math characters
  if (!/^[\d.+\-*/^%()]+$/.test(text) || !/\d/.test(text) || !/[+\-*/^%]/.test(text.replace(/^-/, ''))) return null;
  let index = 0;
  const peek = () => text[index];
  const number = (): number => {
    if (peek() === '(') {
      index += 1;
      const value = sum();
      if (peek() !== ')') throw new Error('bracket');
      index += 1;
      return value;
    }
    if (peek() === '-') {
      index += 1;
      return -number();
    }
    const match = /^\d*\.?\d+/.exec(text.slice(index));
    if (!match) throw new Error('number');
    index += match[0].length;
    let value = Number(match[0]);
    if (peek() === '%') {
      index += 1;
      value /= 100;
    }
    return value;
  };
  const power = (): number => {
    const base = number();
    if (peek() === '^') {
      index += 1;
      return base ** power();
    }
    return base;
  };
  const product = (): number => {
    let value = power();
    while (peek() === '*' || peek() === '/') {
      const op = text[index++];
      const right = power();
      value = op === '*' ? value * right : value / right;
    }
    return value;
  };
  function sum(): number {
    let value = product();
    while (peek() === '+' || peek() === '-') {
      const op = text[index++];
      const right = product();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }
  try {
    const value = sum();
    if (index !== text.length || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}

/** A number for display: up to 8 decimals, no float noise. */
export function niceNumber(value: number): string {
  if (Math.abs(value) >= 1e12 || (Math.abs(value) < 1e-6 && value !== 0)) return value.toExponential(4);
  return String(Number(value.toFixed(8)));
}

// ---- Unit conversion --------------------------------------------------------

/** Every unit as a factor to the base unit of its kind. */
const UNITS: Record<string, { kind: string; factor: number; name: string }> = {
  mm: { kind: 'length', factor: 0.001, name: 'mm' },
  cm: { kind: 'length', factor: 0.01, name: 'cm' },
  m: { kind: 'length', factor: 1, name: 'm' },
  km: { kind: 'length', factor: 1000, name: 'km' },
  in: { kind: 'length', factor: 0.0254, name: 'in' },
  inch: { kind: 'length', factor: 0.0254, name: 'in' },
  ft: { kind: 'length', factor: 0.3048, name: 'ft' },
  feet: { kind: 'length', factor: 0.3048, name: 'ft' },
  yd: { kind: 'length', factor: 0.9144, name: 'yd' },
  mi: { kind: 'length', factor: 1609.344, name: 'mi' },
  mile: { kind: 'length', factor: 1609.344, name: 'mi' },
  miles: { kind: 'length', factor: 1609.344, name: 'mi' },
  g: { kind: 'mass', factor: 0.001, name: 'g' },
  kg: { kind: 'mass', factor: 1, name: 'kg' },
  lb: { kind: 'mass', factor: 0.45359237, name: 'lb' },
  lbs: { kind: 'mass', factor: 0.45359237, name: 'lb' },
  oz: { kind: 'mass', factor: 0.028349523125, name: 'oz' },
  ml: { kind: 'volume', factor: 0.001, name: 'ml' },
  l: { kind: 'volume', factor: 1, name: 'l' },
  gal: { kind: 'volume', factor: 3.785411784, name: 'gal' },
  cup: { kind: 'volume', factor: 0.2365882365, name: 'cup' },
  'km/h': { kind: 'speed', factor: 1 / 3.6, name: 'km/h' },
  kmh: { kind: 'speed', factor: 1 / 3.6, name: 'km/h' },
  mph: { kind: 'speed', factor: 0.44704, name: 'mph' },
  'm/s': { kind: 'speed', factor: 1, name: 'm/s' },
  c: { kind: 'temp', factor: 1, name: '°C' },
  f: { kind: 'temp', factor: 1, name: '°F' },
  k: { kind: 'temp', factor: 1, name: 'K' },
};

const toCelsius = (value: number, unit: string) => (unit === 'f' ? ((value - 32) * 5) / 9 : unit === 'k' ? value - 273.15 : value);
const fromCelsius = (value: number, unit: string) => (unit === 'f' ? (value * 9) / 5 + 32 : unit === 'k' ? value + 273.15 : value);

/** "5 km in mi", "10kg to lb", "100 f in c". Returns "5 km = 3.1069 mi" or null. */
export function convert(input: string): string | null {
  const match = /^\s*(-?[\d.,]+)\s*(°?[a-z/]+)\s+(?:in|to|=|as)\s+(°?[a-z/]+)\s*$/i.exec(input);
  if (!match) return null;
  const value = Number(match[1].replace(',', '.'));
  const from = match[2].toLowerCase().replace('°', '');
  const to = match[3].toLowerCase().replace('°', '');
  const a = UNITS[from];
  const b = UNITS[to];
  if (!a || !b || a.kind !== b.kind || Number.isNaN(value)) return null;
  const result = a.kind === 'temp' ? fromCelsius(toCelsius(value, from), to) : (value * a.factor) / b.factor;
  return `${niceNumber(value)} ${a.name} = ${niceNumber(Number(result.toPrecision(6)))} ${b.name}`;
}

// ---- Commands ---------------------------------------------------------------

export type Command =
  | { type: 'focus'; minutes: number }
  | { type: 'timer'; minutes: number }
  | { type: 'alarm'; hour: number; minute: number }
  | { type: 'note'; text: string }
  | { type: 'reminder'; text: string }
  | { type: 'theme'; id: string };

/** Understands a few spoken-style commands. */
export function parseCommand(input: string, themeIds: string[] = []): Command | null {
  const text = input.trim().toLowerCase();
  let match = /^(?:start\s+)?(?:a\s+)?(\d{1,3})\s*(?:min(?:ute)?s?)?\s+(?:of\s+)?focus$|^(?:start\s+)?focus(?:\s+for)?\s+(\d{1,3})\s*(?:min(?:ute)?s?)?$|^lock\s*in(?:\s+(\d{1,3}))?/.exec(text);
  if (match) return { type: 'focus', minutes: Number(match[1] ?? match[2] ?? match[3] ?? 25) };
  match = /^(?:set\s+)?(?:a\s+)?(\d{1,3})\s*(?:min(?:ute)?s?)?\s+timer$|^timer\s+(?:for\s+)?(\d{1,3})\s*(?:min(?:ute)?s?)?$/.exec(text);
  if (match) return { type: 'timer', minutes: Number(match[1] ?? match[2]) };
  match = /^(?:set\s+)?(?:an\s+)?alarm\s+(?:at\s+|for\s+)?(\d{1,2})(?::|\.|h)?(\d{2})?\s*(am|pm)?$/.exec(text);
  if (match) {
    let hour = Number(match[1]);
    if (match[3] === 'pm' && hour < 12) hour += 12;
    if (match[3] === 'am' && hour === 12) hour = 0;
    const minute = Number(match[2] ?? 0);
    if (hour < 24 && minute < 60) return { type: 'alarm', hour, minute };
  }
  match = /^(?:new\s+)?note[:\s]+(.+)$/.exec(input.trim());
  if (match) return { type: 'note', text: match[1].trim() };
  match = /^(?:remind\s+me\s+(?:to\s+)?|reminder[:\s]+)(.+)$/i.exec(input.trim());
  if (match) return { type: 'reminder', text: match[1].trim() };
  match = /^(?:theme\s+)?(\w+)\s+theme$|^theme\s+(\w+)$/.exec(text);
  if (match) {
    const id = match[1] ?? match[2];
    if (themeIds.includes(id)) return { type: 'theme', id };
  }
  return null;
}

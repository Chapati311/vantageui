/** Units for conversions (search and the calculator's converter). */

/** Every unit as a factor to the base unit of its kind. */
export const UNITS: Record<string, { kind: string; factor: number; name: string }> = {
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

export const toCelsius = (value: number, unit: string) => (unit === 'f' ? ((value - 32) * 5) / 9 : unit === 'k' ? value - 273.15 : value);
export const fromCelsius = (value: number, unit: string) => (unit === 'f' ? (value * 9) / 5 + 32 : unit === 'k' ? value + 273.15 : value);

/** The units the calculator's converter offers, by kind (no aliases). */
export const UNIT_KINDS: { id: string; name: string; units: string[] }[] = [
  { id: 'length', name: 'Length', units: ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'] },
  { id: 'mass', name: 'Weight', units: ['g', 'kg', 'oz', 'lb'] },
  { id: 'volume', name: 'Volume', units: ['ml', 'l', 'cup', 'gal'] },
  { id: 'speed', name: 'Speed', units: ['km/h', 'm/s', 'mph'] },
  { id: 'temp', name: 'Temperature', units: ['c', 'f', 'k'] },
];

/** Converts between two units of the same kind (null if they don't match). */
export function convertValue(value: number, from: string, to: string): number | null {
  const a = UNITS[from];
  const b = UNITS[to];
  if (!a || !b || a.kind !== b.kind) return null;
  return a.kind === 'temp' ? fromCelsius(toCelsius(value, from), to) : (value * a.factor) / b.factor;
}

export const unitName = (unit: string): string => UNITS[unit]?.name ?? unit;

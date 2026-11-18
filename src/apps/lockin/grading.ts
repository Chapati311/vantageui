/**
 * GRADING SYSTEMS, AVERAGES, "WHAT DO I NEED?" AND PROMOTION RULES.
 * Pure functions only (no React, no storage) so every rule can be unit
 * tested (grading.test.ts).
 *
 * Every system is turned into a common form: a numeric scale from `low` to
 * `high` (`best` says which end is best), a pass mark, a rounding step for
 * averages, and optional letter labels. Letter systems (UK A-level, USA)
 * are stored as numbers too: A* = 6 ... E = 1, U = 0; A = 4 ... F = 0.
 */

export interface GradingSystem {
  id: string;
  name: string;
  /** Lowest and highest value of the scale */
  low: number;
  high: number;
  /** Which end is best */
  best: 'high' | 'low';
  /** Grades at least this good pass */
  pass: number;
  /** Averages are rounded to this step (0.5 = halves, 0.1, 1, ...) */
  rounding: number;
  /** Steps you can enter (0.25 for "5-", "5+", 1 for whole grades) */
  step: number;
  /** Letter names for the values, e.g. { 4: 'A', 3: 'B' } */
  labels?: Record<number, string>;
  /** Grades closer than this to the pass mark count as "close" (amber) */
  margin: number;
}

export const GRADING_SYSTEMS: GradingSystem[] = [
  { id: 'ch', name: 'Switzerland (1-6)', low: 1, high: 6, best: 'high', pass: 4, rounding: 0.5, step: 0.25, margin: 0.5 },
  { id: 'de', name: 'Germany (1-6)', low: 1, high: 6, best: 'low', pass: 4, rounding: 0.1, step: 0.33, margin: 0.5 },
  { id: 'de-ob', name: 'Germany Oberstufe (0-15 points)', low: 0, high: 15, best: 'high', pass: 5, rounding: 1, step: 1, margin: 2 },
  { id: 'at', name: 'Austria (1-5)', low: 1, high: 5, best: 'low', pass: 4, rounding: 1, step: 1, margin: 0.5 },
  { id: 'fr', name: 'France (0-20)', low: 0, high: 20, best: 'high', pass: 10, rounding: 0.1, step: 0.5, margin: 2 },
  { id: 'nl', name: 'Netherlands (1-10)', low: 1, high: 10, best: 'high', pass: 5.5, rounding: 0.1, step: 0.1, margin: 0.5 },
  { id: 'it', name: 'Italy (1-10)', low: 1, high: 10, best: 'high', pass: 6, rounding: 0.5, step: 0.5, margin: 0.5 },
  { id: 'uk-gcse', name: 'UK GCSE (9-1)', low: 1, high: 9, best: 'high', pass: 4, rounding: 1, step: 1, margin: 1 },
  {
    id: 'uk-alevel',
    name: 'UK A-level (A*-E)',
    low: 0,
    high: 6,
    best: 'high',
    pass: 1,
    rounding: 1,
    step: 1,
    margin: 1,
    labels: { 6: 'A*', 5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'E', 0: 'U' },
  },
  {
    id: 'us',
    name: 'USA (A-F, GPA 4.0)',
    low: 0,
    high: 4,
    best: 'high',
    pass: 1,
    rounding: 0.01,
    step: 1,
    margin: 0.5,
    labels: { 4: 'A', 3: 'B', 2: 'C', 1: 'D', 0: 'F' },
  },
  { id: 'in-pct', name: 'India (percentage)', low: 0, high: 100, best: 'high', pass: 33, rounding: 0.1, step: 1, margin: 7 },
  { id: 'in-cgpa', name: 'India (CGPA 10)', low: 0, high: 10, best: 'high', pass: 4, rounding: 0.01, step: 0.1, margin: 1 },
];

export function getSystem(id: string, custom: GradingSystem[] = []): GradingSystem {
  return [...GRADING_SYSTEMS, ...custom].find((system) => system.id === id) ?? GRADING_SYSTEMS[0];
}

/** Rounds like the school does (to the system's rounding step, halves away from... upwards on the scale). */
export function roundGrade(value: number, system: GradingSystem): number {
  const step = system.rounding;
  const rounded = Math.round((value + 1e-9) / step) * step;
  const decimals = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return Number(rounded.toFixed(decimals));
}

/** Is `a` better than `b` on this scale? */
export const isBetter = (a: number, b: number, system: GradingSystem) => (system.best === 'high' ? a > b : a < b);

/** Does this grade pass? */
export const passes = (value: number, system: GradingSystem) => (system.best === 'high' ? value >= system.pass : value <= system.pass);

export type GradeStatus = 'good' | 'close' | 'bad';

/** Green (passing comfortably), amber (within the margin of the pass mark) or red (failing). */
export function gradeStatus(value: number, system: GradingSystem): GradeStatus {
  if (!passes(value, system)) return 'bad';
  return Math.abs(value - system.pass) < system.margin ? 'close' : 'good';
}

/** How a value is shown: a letter for letter systems, else the number. */
export function gradeLabel(value: number, system: GradingSystem): string {
  if (system.labels) {
    const nearest = Math.round(value);
    if (Math.abs(value - nearest) < 1e-9 && system.labels[nearest]) return system.labels[nearest];
  }
  return String(Number(value.toFixed(2)));
}

export interface WeightedValue {
  value: number;
  weight: number;
}

/** Weighted average, or null when there is nothing to average. Not rounded. */
export function weightedAverage(items: WeightedValue[]): number | null {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return null;
  return items.reduce((sum, item) => sum + item.value * item.weight, 0) / total;
}

export interface NeedResult {
  /** The grade you need on the next test, already on the scale's step */
  needed: number | null;
  /** 'possible' | 'already' (even the worst grade reaches it) | 'impossible' (even the best doesn't) */
  verdict: 'possible' | 'already' | 'impossible';
}

/**
 * "What do I need?": which grade on the next test (with `weight`) brings the
 * average to `target` (before rounding the result to the step you can get).
 */
export function gradeNeeded(current: WeightedValue[], weight: number, target: number, system: GradingSystem): NeedResult {
  const total = current.reduce((sum, item) => sum + item.weight, 0);
  const sum = current.reduce((acc, item) => acc + item.value * item.weight, 0);
  const exact = (target * (total + weight) - sum) / weight;
  const worst = system.best === 'high' ? system.low : system.high;
  const bestValue = system.best === 'high' ? system.high : system.low;

  // Rounded to a grade you can actually get (counted in steps from the bottom of
  // the scale), in the direction that still reaches the target
  const step = system.step;
  const steps = (exact - system.low) / step;
  const snapped = system.low + (system.best === 'high' ? Math.ceil(steps - 1e-6) : Math.floor(steps + 1e-6)) * step;
  // Never past the ends of the scale because of rounding
  const needed = Number(Math.min(system.high, Math.max(system.low, snapped)).toFixed(4));
  if (system.best === 'high' ? exact > system.high + 1e-6 : exact < system.low - 1e-6) return { needed: null, verdict: 'impossible' };

  // Even the worst grade reaches the target
  if (system.best === 'high' ? exact <= worst + 1e-9 : exact >= worst - 1e-9) return { needed: worst, verdict: 'already' };
  if (isBetter(needed, bestValue, system)) return { needed: null, verdict: 'impossible' };
  return { needed, verdict: 'possible' };
}

// ---- Promotion / compensation rules ---------------------------------------

export interface PromotionRules {
  /** The overall average must be at least this good (null = no rule) */
  minAverage: number | null;
  /** At most this many failing subjects (null = no rule) */
  maxFails: number | null;
  /**
   * Swiss "double compensation": every point below the pass mark counts
   * double and must be covered by points above it.
   */
  doubleCompensation: boolean;
}

export const SWISS_RULES: PromotionRules = { minAverage: 4, maxFails: 3, doubleCompensation: true };

export type PromotionStatus = 'promoted' | 'edge' | 'risk';

export interface PromotionResult {
  status: PromotionStatus;
  /** Plain-words reasons, for the screen */
  reasons: string[];
  surplus: number;
  deficit: number;
}

/**
 * Checks subject averages (already rounded like the report card) against the
 * rules. "Edge" = promoted, but one more bad grade could change that.
 */
export function checkPromotion(subjectAverages: number[], system: GradingSystem, rules: PromotionRules): PromotionResult {
  const reasons: string[] = [];
  const distance = (value: number) => (system.best === 'high' ? value - system.pass : system.pass - value);
  const surplus = subjectAverages.reduce((sum, value) => sum + Math.max(0, distance(value)), 0);
  const deficit = subjectAverages.reduce((sum, value) => sum + Math.max(0, -distance(value)), 0);
  const fails = subjectAverages.filter((value) => !passes(value, system)).length;
  const average = weightedAverage(subjectAverages.map((value) => ({ value, weight: 1 })));

  let failed = false;
  let edge = false;
  if (rules.minAverage !== null && average !== null) {
    const ok = system.best === 'high' ? average >= rules.minAverage : average <= rules.minAverage;
    if (!ok) {
      failed = true;
      reasons.push(`Average ${roundGrade(average, system)} is below ${rules.minAverage}.`);
    } else if (Math.abs(average - rules.minAverage) < system.margin / 2) edge = true;
  }
  if (rules.maxFails !== null) {
    if (fails > rules.maxFails) {
      failed = true;
      reasons.push(`${fails} failing subjects (at most ${rules.maxFails} allowed).`);
    } else if (fails === rules.maxFails && fails > 0) edge = true;
  }
  if (rules.doubleCompensation) {
    if (deficit * 2 > surplus + 1e-9) {
      failed = true;
      reasons.push(`Points below the pass mark count double: ${deficit * 2} to cover, ${surplus} above.`);
    } else if (deficit > 0 && surplus - deficit * 2 < 1) edge = true;
  }
  if (!failed && !reasons.length) reasons.push(edge ? 'Promoted, but only just.' : 'Promoted.');
  return { status: failed ? 'risk' : edge ? 'edge' : 'promoted', reasons, surplus, deficit };
}

/** Trend of the last grades: positive = getting better (on any scale). */
export function trend(values: number[], system: GradingSystem): number {
  if (values.length < 2) return 0;
  const recent = values.slice(-3);
  const earlier = values.slice(0, -3).length ? values.slice(0, -3) : values.slice(0, 1);
  const diff = (recent.reduce((a, b) => a + b, 0) / recent.length) - (earlier.reduce((a, b) => a + b, 0) / earlier.length);
  return system.best === 'high' ? diff : -diff;
}

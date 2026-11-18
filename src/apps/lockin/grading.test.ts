import { describe, expect, it } from 'vitest';
import {
  GRADING_SYSTEMS,
  SWISS_RULES,
  checkPromotion,
  getSystem,
  gradeLabel,
  gradeNeeded,
  gradeStatus,
  passes,
  roundGrade,
  weightedAverage,
} from './grading';

const ch = getSystem('ch');
const de = getSystem('de');
const deOb = getSystem('de-ob');
const at = getSystem('at');
const fr = getSystem('fr');
const nl = getSystem('nl');
const it_ = getSystem('it');
const gcse = getSystem('uk-gcse');
const alevel = getSystem('uk-alevel');
const us = getSystem('us');
const inPct = getSystem('in-pct');
const inCgpa = getSystem('in-cgpa');

describe('every grading system', () => {
  it('has all 12 systems from SPECS', () => {
    expect(GRADING_SYSTEMS.map((system) => system.id)).toEqual(['ch', 'de', 'de-ob', 'at', 'fr', 'nl', 'it', 'uk-gcse', 'uk-alevel', 'us', 'in-pct', 'in-cgpa']);
  });

  it('knows the best end and the pass mark', () => {
    expect(passes(4, ch)).toBe(true);
    expect(passes(3.75, ch)).toBe(false);
    expect(passes(4, de)).toBe(true);
    expect(passes(4.3, de)).toBe(false);
    expect(passes(5, deOb)).toBe(true);
    expect(passes(4, deOb)).toBe(false);
    expect(passes(4, at)).toBe(true);
    expect(passes(5, at)).toBe(false);
    expect(passes(10, fr)).toBe(true);
    expect(passes(9.5, fr)).toBe(false);
    expect(passes(5.5, nl)).toBe(true);
    expect(passes(5.4, nl)).toBe(false);
    expect(passes(6, it_)).toBe(true);
    expect(passes(5.5, it_)).toBe(false);
    expect(passes(4, gcse)).toBe(true);
    expect(passes(3, gcse)).toBe(false);
    expect(passes(1, alevel)).toBe(true);
    expect(passes(0, alevel)).toBe(false);
    expect(passes(1, us)).toBe(true);
    expect(passes(0, us)).toBe(false);
    expect(passes(33, inPct)).toBe(true);
    expect(passes(32, inPct)).toBe(false);
    expect(passes(4, inCgpa)).toBe(true);
  });

  it('shows letters for letter systems', () => {
    expect(gradeLabel(6, alevel)).toBe('A*');
    expect(gradeLabel(1, alevel)).toBe('E');
    expect(gradeLabel(0, alevel)).toBe('U');
    expect(gradeLabel(4, us)).toBe('A');
    expect(gradeLabel(0, us)).toBe('F');
    expect(gradeLabel(3.5, us)).toBe('3.5');
    expect(gradeLabel(5.25, ch)).toBe('5.25');
  });
});

describe('rounding like the school', () => {
  it('rounds Swiss averages to halves', () => {
    expect(roundGrade(4.74, ch)).toBe(4.5);
    expect(roundGrade(4.75, ch)).toBe(5);
    expect(roundGrade(4.24, ch)).toBe(4);
    expect(roundGrade(4.25, ch)).toBe(4.5);
  });
  it('rounds to tenths and whole points', () => {
    expect(roundGrade(2.349, de)).toBe(2.3);
    expect(roundGrade(2.35, de)).toBe(2.4);
    expect(roundGrade(11.5, deOb)).toBe(12);
    expect(roundGrade(3.456, us)).toBe(3.46);
  });
});

describe('weighted averages', () => {
  it('weighs grades', () => {
    expect(weightedAverage([{ value: 6, weight: 2 }, { value: 3, weight: 1 }])).toBe(5);
    expect(weightedAverage([])).toBeNull();
    expect(weightedAverage([{ value: 5, weight: 0 }])).toBeNull();
  });
});

describe('status colors', () => {
  it('is green, amber or red', () => {
    expect(gradeStatus(5.5, ch)).toBe('good');
    expect(gradeStatus(4.25, ch)).toBe('close');
    expect(gradeStatus(3.5, ch)).toBe('bad');
    expect(gradeStatus(1.5, de)).toBe('good');
    expect(gradeStatus(3.8, de)).toBe('close');
    expect(gradeStatus(5, de)).toBe('bad');
  });
});

describe('what do I need?', () => {
  it('finds the grade for a target (high is best)', () => {
    // 4 and 5 (weight 1 each): to reach 5 overall with a third test of weight 1, you need a 6
    expect(gradeNeeded([{ value: 4, weight: 1 }, { value: 5, weight: 1 }], 1, 5, ch)).toEqual({ needed: 6, verdict: 'possible' });
    // ...rounds up to the next quarter you can get
    expect(gradeNeeded([{ value: 4, weight: 1 }], 1, 4.6, ch)).toEqual({ needed: 5.25, verdict: 'possible' });
  });
  it('is honest when the target is impossible', () => {
    expect(gradeNeeded([{ value: 3, weight: 2 }], 1, 5.5, ch)).toEqual({ needed: null, verdict: 'impossible' });
  });
  it('says when it is already safe', () => {
    expect(gradeNeeded([{ value: 6, weight: 3 }], 1, 4, ch)).toEqual({ needed: 1, verdict: 'already' });
  });
  it('works where low is best (Germany)', () => {
    // 2 and 3: to reach 2.0 with a third test you need a 1
    expect(gradeNeeded([{ value: 2, weight: 1 }, { value: 3, weight: 1 }], 1, 2, de).needed).toBeCloseTo(1, 1);
    expect(gradeNeeded([{ value: 5, weight: 3 }], 1, 1.5, de).verdict).toBe('impossible');
  });
});

describe('Swiss promotion rules', () => {
  it('promotes a clean report', () => {
    expect(checkPromotion([5, 4.5, 5.5, 4, 5], ch, SWISS_RULES).status).toBe('promoted');
  });
  it('allows a fail covered twice', () => {
    // 3.5 is 0.5 below: needs 1.0 above. Surplus = 1 + 0.5 = 1.5
    expect(checkPromotion([3.5, 5, 4.5, 4, 4], ch, SWISS_RULES).status).not.toBe('risk');
  });
  it('fails when the double deficit is not covered', () => {
    const result = checkPromotion([3, 4.5, 4, 4, 4], ch, SWISS_RULES);
    expect(result.status).toBe('risk');
    expect(result.deficit).toBe(1);
    expect(result.surplus).toBe(0.5);
  });
  it('fails with too many failing subjects', () => {
    expect(checkPromotion([3.5, 3.5, 3.5, 3.5, 6, 6, 6, 6], ch, SWISS_RULES).status).toBe('risk');
  });
  it('fails when the average is too low', () => {
    expect(checkPromotion([3.5, 4, 4], ch, { minAverage: 4, maxFails: null, doubleCompensation: false }).status).toBe('risk');
  });
});

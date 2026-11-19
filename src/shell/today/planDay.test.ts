import { describe, expect, it } from 'vitest';
import { planDay, toMinutes } from './planDay';

const at = (time: string) => {
  const date = new Date(2026, 10, 19);
  date.setHours(Number(time.slice(0, 2)), Number(time.slice(3)));
  return date;
};

describe('planDay', () => {
  it('keeps fixed items and fills gaps with homework focus blocks', () => {
    const plan = planDay({
      now: at('14:00'),
      fixed: [{ title: 'Maths', start: toMinutes('15:00'), end: toMinutes('15:45'), kind: 'lesson' }],
      homework: [{ title: 'Essay', due: '2026-11-20' }, { title: 'Worksheet', due: '2026-11-21' }],
      windDown: '21:00',
    });
    expect(plan[0]).toMatchObject({ kind: 'focus', title: 'Essay', start: toMinutes('14:00') });
    expect(plan.find((item) => item.kind === 'lesson')).toMatchObject({ title: 'Maths', start: toMinutes('15:00') });
    expect(plan.some((item) => item.title === 'Worksheet')).toBe(true);
    expect(plan.at(-1)).toMatchObject({ kind: 'winddown', start: toMinutes('21:00') });
  });

  it('never plans into the past and ends with Wind Down even late at night', () => {
    const plan = planDay({ now: at('23:10'), fixed: [], homework: [{ title: 'Essay', due: 'x' }], windDown: '21:00' });
    expect(plan).toHaveLength(1);
    expect(plan[0].kind).toBe('winddown');
  });

  it('skips gaps shorter than 30 minutes', () => {
    const plan = planDay({
      now: at('09:00'),
      fixed: [{ title: 'Call', start: toMinutes('09:20'), end: toMinutes('10:00'), kind: 'event' }],
      homework: [{ title: 'Read', due: 'x' }],
      windDown: '10:00',
    });
    expect(plan[0].kind).toBe('event');
  });
});

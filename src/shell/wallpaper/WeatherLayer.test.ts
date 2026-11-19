import { describe, expect, it } from 'vitest';
import { skyMood } from './skyMood';

const at = (hour: number, minute = 0) => new Date(2026, 10, 19, hour, minute);

describe('skyMood', () => {
  it('shows rain whenever it rains', () => expect(skyMood(at(12), true)).toBe('rain'));
  it('is plain during the day', () => expect(skyMood(at(12), false)).toBeNull());
  it('has stars at night', () => expect(skyMood(at(23), false)).toBe('night'));
  it('glows around sunset (about 16:45 in Zurich in November)', () => expect(skyMood(at(16, 30), false)).toBe('sunset'));
});

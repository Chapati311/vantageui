import { describe, expect, it } from 'vitest';
import { INITIAL, pressBackspace, pressClear, pressDigit, pressEquals, pressOperator, pressFunction, pressPercent, pressSign, type CalcState } from './calculator';

/** Presses keys in order, like fingers on the keypad. */
function press(keys: string, start: CalcState = INITIAL): CalcState {
  let state = start;
  for (const key of keys.split(' ')) {
    if (/^[0-9.]+$/.test(key)) for (const digit of key) state = pressDigit(state, digit);
    else if (key === '=') state = pressEquals(state);
    else if (key === 'C') state = pressClear(state);
    else if (key === '±') state = pressSign(state);
    else if (key === '%') state = pressPercent(state);
    else if (key === '⌫') state = pressBackspace(state);
    else state = pressOperator(state, key as '+' | '-' | '×' | '÷');
  }
  return state;
}

describe('calculator', () => {
  it('adds, subtracts, multiplies and divides', () => {
    expect(press('2 + 3 =').display).toBe('5');
    expect(press('9 - 12 =').display).toBe('-3');
    expect(press('7 × 6 =').display).toBe('42');
    expect(press('1 ÷ 4 =').display).toBe('0.25');
  });

  it('works left to right like a pocket calculator', () => {
    expect(press('2 + 3 × 4 =').display).toBe('20');
  });

  it('repeats the last operation on =', () => {
    expect(press('5 + 2 = =').display).toBe('9');
  });

  it('handles decimals without floating point noise', () => {
    expect(press('0.1 + 0.2 =').display).toBe('0.3');
  });

  it('refuses to divide by zero', () => {
    const state = press('5 ÷ 0 =');
    expect(state.error).toBe("Can't divide by zero");
  });

  it('percent of a running total', () => {
    expect(press('50 + 10 % =').display).toBe('55');
    expect(press('20 %').display).toBe('0.2');
  });

  it('sign, backspace and clear', () => {
    expect(press('12 ±').display).toBe('-12');
    expect(press('123 ⌫').display).toBe('12');
    expect(press('7 + 8 C').display).toBe('0');
    expect(press('7 + 8 C C')).toEqual(INITIAL);
  });

  it('keeps to nine digits', () => {
    expect(press('1234567891').display).toBe('123456789');
  });
});

describe('scientific and powers', () => {
  const type = (keys: string) => [...keys].reduce((state, key) => pressDigit(state, key), INITIAL);
  it('raises to a power', () => {
    const state = pressEquals(type2(pressOperator(type('2'), '^'), '10'));
    expect(state.display).toBe('1024');
  });
  it('sin 30 = 0.5 and sin 180 = 0 (in degrees)', () => {
    expect(pressFunction(type('30'), 'sin').display).toBe('0.5');
    expect(pressFunction(type('180'), 'sin').display).toBe('0');
  });
  it('square root, factorial and friendly errors', () => {
    expect(pressFunction(type('81'), 'sqrt').display).toBe('9');
    expect(pressFunction(type('5'), 'factorial').display).toBe('120');
    expect(pressFunction(pressSign(type('4')), 'sqrt').error).toBe('No negative roots');
  });
});

function type2(state: ReturnType<typeof pressDigit>, keys: string) {
  return [...keys].reduce((current, key) => pressDigit(current, key), state);
}

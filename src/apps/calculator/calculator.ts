/**
 * The calculator's brain: works like a pocket calculator (each operation
 * runs when the next one is pressed). Pure functions, no React.
 */

export type Operator = '+' | '-' | '×' | '÷';

export interface CalcState {
  /** What the display shows (as typed) */
  display: string;
  /** The number waiting for the pending operation */
  stored: number | null;
  operator: Operator | null;
  /** The next digit starts a new number */
  fresh: boolean;
  /** Pressing = again repeats the last operation */
  repeat: { operator: Operator; value: number } | null;
  error: string | null;
}

export const INITIAL: CalcState = { display: '0', stored: null, operator: null, fresh: true, repeat: null, error: null };

const MAX_DIGITS = 9;

function apply(a: number, operator: Operator, b: number): number {
  switch (operator) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    default:
      if (b === 0) throw new Error("Can't divide by zero");
      return a / b;
  }
}

/** A number as it fits on the 9-digit display. */
export function format(value: number): string {
  if (!Number.isFinite(value)) return '-';
  if (Math.abs(value) >= 1e9 || (Math.abs(value) < 1e-7 && value !== 0)) {
    // Too big or too small: round so it still fits
    return Number(value.toPrecision(4)).toString().slice(0, MAX_DIGITS + 2);
  }
  const whole = Math.trunc(Math.abs(value)).toString().length;
  const decimals = Math.max(0, MAX_DIGITS - whole);
  return String(Number(value.toFixed(decimals)));
}

const current = (state: CalcState) => Number(state.display);

export function pressDigit(state: CalcState, digit: string): CalcState {
  if (state.error) state = INITIAL;
  if (state.fresh) return { ...state, display: digit === '.' ? '0.' : digit, fresh: false, repeat: null };
  if (digit === '.' && state.display.includes('.')) return state;
  if (state.display.replace(/[-.]/g, '').length >= MAX_DIGITS) return state;
  const display = state.display === '0' && digit !== '.' ? digit : state.display + digit;
  return { ...state, display };
}

export function pressOperator(state: CalcState, operator: Operator): CalcState {
  if (state.error) return state;
  try {
    // A pending operation runs first (2 + 3 × ... shows 5)
    const value = state.stored !== null && state.operator && !state.fresh ? apply(state.stored, state.operator, current(state)) : current(state);
    return { ...state, display: format(value), stored: value, operator, fresh: true, repeat: null };
  } catch (error) {
    return { ...INITIAL, display: '-', error: (error as Error).message };
  }
}

export function pressEquals(state: CalcState): CalcState {
  if (state.error) return INITIAL;
  try {
    if (state.operator && state.stored !== null) {
      const value = current(state);
      const result = apply(state.stored, state.operator, value);
      return { ...INITIAL, display: format(result), repeat: { operator: state.operator, value } };
    }
    if (state.repeat) {
      const result = apply(current(state), state.repeat.operator, state.repeat.value);
      return { ...state, display: format(result), fresh: true };
    }
    return { ...state, fresh: true };
  } catch (error) {
    return { ...INITIAL, display: '-', error: (error as Error).message };
  }
}

export function pressClear(state: CalcState): CalcState {
  // First press clears the number being typed, second clears everything
  if (!state.fresh && state.display !== '0') return { ...state, display: '0', fresh: true };
  return INITIAL;
}

export function pressSign(state: CalcState): CalcState {
  if (state.error || state.display === '0') return state;
  return { ...state, display: state.display.startsWith('-') ? state.display.slice(1) : `-${state.display}` };
}

export function pressPercent(state: CalcState): CalcState {
  if (state.error) return state;
  // 50 + 10 % = 55 (ten percent of 50); otherwise just divide by 100
  const value = state.stored !== null && (state.operator === '+' || state.operator === '-') ? (state.stored * current(state)) / 100 : current(state) / 100;
  return { ...state, display: format(value), fresh: true };
}

export function pressBackspace(state: CalcState): CalcState {
  if (state.fresh || state.error) return state;
  const display = state.display.length > 1 && state.display !== '-0' ? state.display.slice(0, -1) : '0';
  return { ...state, display: display === '-' ? '0' : display };
}

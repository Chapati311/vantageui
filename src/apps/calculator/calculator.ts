/**
 * The calculator's brain: works like a pocket calculator (each operation
 * runs when the next one is pressed). Pure functions, no React.
 */

export type Operator = '+' | '-' | '×' | '÷' | '^';

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
    case '^':
      return a ** b;
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

// ---- Scientific (the scientific sheet) ------------------------------------

export type ScientificFn = 'sin' | 'cos' | 'tan' | 'ln' | 'log' | 'sqrt' | 'square' | 'inverse' | 'factorial' | 'pi' | 'e';

const RAD = Math.PI / 180;

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new Error('Only for whole numbers');
  if (n > 170) throw new Error('Too big');
  let result = 1;
  for (let i = 2; i <= n; i += 1) result *= i;
  return result;
}

/** Runs a function on the number on the display (angles in degrees). */
export function pressFunction(state: CalcState, fn: ScientificFn): CalcState {
  if (state.error) state = INITIAL;
  try {
    const x = current(state);
    let value: number;
    switch (fn) {
      case 'pi':
        value = Math.PI;
        break;
      case 'e':
        value = Math.E;
        break;
      case 'sin':
        value = Math.sin(x * RAD);
        break;
      case 'cos':
        value = Math.cos(x * RAD);
        break;
      case 'tan':
        if (Math.abs(Math.cos(x * RAD)) < 1e-12) throw new Error('Not defined');
        value = Math.tan(x * RAD);
        break;
      case 'ln':
        if (x <= 0) throw new Error('Only above zero');
        value = Math.log(x);
        break;
      case 'log':
        if (x <= 0) throw new Error('Only above zero');
        value = Math.log10(x);
        break;
      case 'sqrt':
        if (x < 0) throw new Error('No negative roots');
        value = Math.sqrt(x);
        break;
      case 'square':
        value = x * x;
        break;
      case 'inverse':
        if (x === 0) throw new Error("Can't divide by zero");
        value = 1 / x;
        break;
      default:
        value = factorial(x);
    }
    // Tiny floating-point leftovers (sin 180 = 1.2e-16) become 0
    if (Math.abs(value) < 1e-12) value = 0;
    return { ...state, display: format(value), fresh: true };
  } catch (error) {
    return { ...INITIAL, display: '-', error: (error as Error).message };
  }
}

/** Puts a number on the display, e.g. one picked from the history tape. */
export function pressValue(state: CalcState, value: string): CalcState {
  if (!Number.isFinite(Number(value))) return state;
  return { ...state, display: value, fresh: true, error: null };
}

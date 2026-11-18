import { useEffect, useState } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { AppShell } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { playSound } from '../../system/sounds';
import {
  INITIAL,
  pressBackspace,
  pressClear,
  pressDigit,
  pressEquals,
  pressOperator,
  pressPercent,
  pressSign,
  type CalcState,
  type Operator,
} from './calculator';
import styles from './Calculator.module.css';

type Key = { label: string; kind: 'digit' | 'op' | 'fn' | 'equals'; wide?: boolean };

const KEYS: Key[] = [
  { label: 'C', kind: 'fn' },
  { label: '±', kind: 'fn' },
  { label: '%', kind: 'fn' },
  { label: '÷', kind: 'op' },
  { label: '7', kind: 'digit' },
  { label: '8', kind: 'digit' },
  { label: '9', kind: 'digit' },
  { label: '×', kind: 'op' },
  { label: '4', kind: 'digit' },
  { label: '5', kind: 'digit' },
  { label: '6', kind: 'digit' },
  { label: '-', kind: 'op' },
  { label: '1', kind: 'digit' },
  { label: '2', kind: 'digit' },
  { label: '3', kind: 'digit' },
  { label: '+', kind: 'op' },
  { label: '0', kind: 'digit', wide: true },
  { label: '.', kind: 'digit' },
  { label: '=', kind: 'equals' },
];

/** Calculator. The signature: a dot-matrix display. Swipe the display to delete a digit. */
export function CalculatorApp() {
  const [state, setState] = useState<CalcState>(INITIAL);

  const press = (key: string) => {
    playSound('tick');
    setState((current) => {
      if (/^[0-9.]$/.test(key)) return pressDigit(current, key);
      if (key === 'C') return pressClear(current);
      if (key === '±') return pressSign(current);
      if (key === '%') return pressPercent(current);
      if (key === '=') return pressEquals(current);
      if (key === '⌫') return pressBackspace(current);
      return pressOperator(current, key as Operator);
    });
  };

  // Typing on a keyboard works too
  useEffect(() => {
    const map: Record<string, string> = { '*': '×', '/': '÷', Enter: '=', '=': '=', Backspace: '⌫', Escape: 'C', '+': '+', '-': '-', '%': '%' };
    const listener = (event: KeyboardEvent) => {
      const key = /^[0-9.]$/.test(event.key) ? event.key : map[event.key];
      if (key) press(key);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  });

  const digits = state.display.replace(/[^0-9]/g, '').length;
  const size = digits <= 5 ? 64 : 40;

  return (
    <AppShell fixed>
      <div className={styles.calculator}>
        <div
          className={styles.display}
          role="status"
          aria-label={state.error ?? state.display}
          onPointerDown={(event) => (event.currentTarget.dataset.x = String(event.clientX))}
          onPointerUp={(event) => {
            if (Math.abs(event.clientX - Number(event.currentTarget.dataset.x)) > 40) press('⌫');
          }}
        >
          <span className="label">{state.error ?? (state.operator ? `${state.operator}` : ' ')}</span>
          <DotNumber value={state.display} size={size} instant />
        </div>
        <div className={styles.keys}>
          {KEYS.map((key) => (
            <Pressable
              key={key.label}
              className={`${styles.key} ${styles[key.kind]} ${key.wide ? styles.wide : ''} ${key.kind === 'op' && state.operator === key.label && state.fresh ? styles.active : ''}`}
              aria-label={key.label === 'C' ? 'Clear' : key.label}
              onClick={() => press(key.label)}
            >
              {key.label === 'C' && (!state.fresh && state.display !== '0') ? 'CE' : key.label}
            </Pressable>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

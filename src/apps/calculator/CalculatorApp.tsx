import { useEffect, useState } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { AppShell, Button, EmptyState, Row, Section, Sheet } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { saveLastResult } from '../../system/quickActions';
import { playSound } from '../../system/sounds';
import {
  INITIAL,
  pressBackspace,
  pressClear,
  pressDigit,
  pressEquals,
  pressFunction,
  pressOperator,
  pressPercent,
  pressSign,
  pressValue,
  type CalcState,
  type Operator,
  type ScientificFn,
} from './calculator';
import { Converter } from './Converter';
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

/** The scientific sheet's keys (angles in degrees). */
const SCIENTIFIC: { label: string; fn?: ScientificFn; op?: Operator; name: string }[] = [
  { label: 'sin', fn: 'sin', name: 'Sine' },
  { label: 'cos', fn: 'cos', name: 'Cosine' },
  { label: 'tan', fn: 'tan', name: 'Tangent' },
  { label: 'xʸ', op: '^', name: 'Power' },
  { label: 'ln', fn: 'ln', name: 'Natural log' },
  { label: 'log', fn: 'log', name: 'Log base 10' },
  { label: '√', fn: 'sqrt', name: 'Square root' },
  { label: 'x²', fn: 'square', name: 'Square' },
  { label: '1/x', fn: 'inverse', name: 'One over x' },
  { label: 'x!', fn: 'factorial', name: 'Factorial' },
  { label: 'π', fn: 'pi', name: 'Pi' },
  { label: 'e', fn: 'e', name: 'e' },
];

interface TapeLine {
  sum: string;
  result: string;
}

const TAPE_KEY = 'vantage.calcTape.v1';

function loadTape(): TapeLine[] {
  try {
    const saved = JSON.parse(localStorage.getItem(TAPE_KEY) ?? '[]') as TapeLine[];
    return Array.isArray(saved) ? saved.slice(0, 50) : [];
  } catch {
    return [];
  }
}

/**
 * Calculator. The signature: a dot-matrix display. Swipe the display to
 * delete a digit. Above it, the history tape (tap it for every sum, tap a
 * result to use it again), a unit and currency converter, and a scientific
 * sheet.
 */
export function CalculatorApp() {
  const [state, setState] = useState<CalcState>(INITIAL);
  const [tape, setTape] = useState<TapeLine[]>(loadTape);
  const [sheet, setSheet] = useState<'history' | 'convert' | 'scientific' | null>(null);

  // Remember the tape on the phone
  useEffect(() => {
    try {
      localStorage.setItem(TAPE_KEY, JSON.stringify(tape.slice(0, 50)));
    } catch {
      // Storage full: the tape still works until the app closes
    }
  }, [tape]);

  const press = (key: string) => {
    playSound('tick');
    setState((current) => {
      if (/^[0-9.]$/.test(key)) return pressDigit(current, key);
      if (key === 'C') return pressClear(current);
      if (key === '±') return pressSign(current);
      if (key === '%') return pressPercent(current);
      if (key === '⌫') return pressBackspace(current);
      if (key === '=') {
        const next = pressEquals(current);
        if (!next.error && current.operator && current.stored !== null) {
          const line = { sum: `${current.stored} ${current.operator} ${current.display}`, result: next.display };
          setTape((lines) => [line, ...lines].slice(0, 50));
          saveLastResult(next.display);
        }
        return next;
      }
      return pressOperator(current, key as Operator);
    });
  };

  // Typing on a keyboard works too
  useEffect(() => {
    const map: Record<string, string> = {
      '*': '×',
      '/': '÷',
      Enter: '=',
      '=': '=',
      Backspace: '⌫',
      Escape: 'C',
      '+': '+',
      '-': '-',
      '%': '%',
      '^': '^',
    };
    const listener = (event: KeyboardEvent) => {
      if (sheet) return;
      const key = /^[0-9.]$/.test(event.key) ? event.key : map[event.key];
      if (key) press(key);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  });

  const digits = state.display.replace(/[^0-9]/g, '').length;
  const size = digits <= 5 ? 64 : 40;
  const last = tape[0];

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
          <div className={styles.displayTop}>
            <div className={styles.tools}>
              <Pressable className={`label ${styles.tool}`} onClick={() => setSheet('history')}>
                History
              </Pressable>
              <Pressable className={`label ${styles.tool}`} onClick={() => setSheet('convert')}>
                Convert
              </Pressable>
              <Pressable className={`label ${styles.tool}`} onClick={() => setSheet('scientific')}>
                Scientific
              </Pressable>
            </div>
            <span className="label">{state.error ?? (state.operator ? `${state.operator === '^' ? 'xʸ' : state.operator}` : ' ')}</span>
          </div>
          {/* The tape: the last sum, small and grey, above the display */}
          <Pressable className={styles.tape} aria-label="History" onClick={() => setSheet('history')}>
            {last ? `${last.sum} = ${last.result}` : ' '}
          </Pressable>
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
              {key.label === 'C' && !state.fresh && state.display !== '0' ? 'CE' : key.label}
            </Pressable>
          ))}
        </div>
      </div>

      <Sheet
        open={sheet === 'history'}
        onClose={() => setSheet(null)}
        title="History"
        action={tape.length > 0 ? <Button onPress={() => setTape([])}>Clear</Button> : undefined}
      >
        {tape.length === 0 ? (
          <EmptyState title="No sums yet" message="Every result you get with = lands here. Tap one to use it again." />
        ) : (
          <Section>
            {tape.map((line, index) => (
              <Row
                key={`${index}-${line.sum}`}
                title={line.result}
                detail={line.sum}
                onPress={() => {
                  setState((current) => pressValue(current, line.result));
                  setSheet(null);
                }}
              />
            ))}
          </Section>
        )}
      </Sheet>

      <Sheet open={sheet === 'convert'} onClose={() => setSheet(null)} title="Convert">
        <Converter
          value={Number(state.display) || 0}
          onUse={(value) => {
            setState((current) => pressValue(current, value));
            setSheet(null);
          }}
        />
      </Sheet>

      <Sheet open={sheet === 'scientific'} onClose={() => setSheet(null)} title="Scientific">
        <div className={styles.sciDisplay}>
          <DotNumber value={state.display} size={40} instant />
        </div>
        <div className={styles.sciKeys}>
          {SCIENTIFIC.map((key) => (
            <Pressable
              key={key.label}
              className={`${styles.key} ${styles.fn}`}
              aria-label={key.name}
              onClick={() => {
                playSound('tick');
                setState((current) => (key.op ? pressOperator(current, key.op) : pressFunction(current, key.fn!)));
                if (key.op) setSheet(null);
              }}
            >
              {key.label}
            </Pressable>
          ))}
        </div>
        <p className={styles.note}>Angles are in degrees. xʸ: type the power next, then =.</p>
      </Sheet>
    </AppShell>
  );
}

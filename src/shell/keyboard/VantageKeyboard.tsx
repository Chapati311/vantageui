import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useSettings } from '../../system/settingsStore';
import { playSound } from '../../system/sounds';
import styles from './VantageKeyboard.module.css';

/*
 * The Vantage keyboard (user request: the iOS keyboard "looks very bad").
 * Typing in any Vantage text field opens this keyboard instead of iOS's: it
 * wears the theme (colours, font, corners) or a chosen style (Customise >
 * Keyboard). The field keeps focus; keys type into it the way a real keyboard
 * would (React sees normal input events). The globe key switches that field
 * to the iOS keyboard (emoji, dictation, other languages).
 * iOS doesn't let a web page replace the keyboard in OTHER apps.
 */

type Field = HTMLInputElement | HTMLTextAreaElement;
type Layer = 'letters' | 'numbers' | 'symbols';

const LETTERS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const NUMBERS = ['1234567890', '-/:;()$&@"', '.,?!\''];
const SYMBOLS = ['[]{}#%^*+=', '_\\|~<>€£¥•', '.,?!\''];
const TEXT_TYPES = ['text', 'search', 'email', 'url', 'password', 'tel', 'number', ''];

/** Fields this keyboard types into (not checkboxes, dates, colours...). */
export function isTypingField(el: EventTarget | null): el is Field {
  if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
  return el instanceof HTMLInputElement && TEXT_TYPES.includes(el.type) && !el.readOnly && !el.disabled && !el.dataset.systemKeyboard;
}

/** Puts text into a field like typing does, so React's onChange runs. */
function insert(field: Field, text: string, deleteBack = false) {
  const value = field.value;
  let start = field.selectionStart ?? value.length;
  let end = field.selectionEnd ?? value.length;
  if (deleteBack && start === end) start = Math.max(0, start - 1);
  // Numbers fields don't support selection: just append / trim
  const supportsSelection = field.type !== 'number' && field.type !== 'email';
  if (!supportsSelection) {
    start = deleteBack ? Math.max(0, value.length - 1) : value.length;
    end = value.length;
  }
  const next = value.slice(0, start) + text + value.slice(end);
  const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(field, next);
  if (supportsSelection) field.setSelectionRange(start + text.length, start + text.length);
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

function pressEnter(field: Field) {
  if (field instanceof HTMLTextAreaElement) {
    insert(field, '\n');
    return;
  }
  const init = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
  const down = new KeyboardEvent('keydown', init);
  field.dispatchEvent(down);
  field.dispatchEvent(new KeyboardEvent('keyup', init));
  // A form around it submits (search fields, the Terminal)
  if (!down.defaultPrevented) {
    const form = field.form;
    if (form) form.requestSubmit?.();
    else field.blur();
  }
}

export function VantageKeyboard() {
  const settings = useSettings();
  const enabled = settings.keyboard === 'vantage';
  const [field, setField] = useState<Field | null>(null);
  const [layer, setLayer] = useState<Layer>('letters');
  const [shift, setShift] = useState<'off' | 'once' | 'caps'>('once');
  const lastShiftTap = useRef(0);
  const repeat = useRef(0);
  const board = useRef<HTMLDivElement>(null);

  // iOS moves focus away from the field when a button is touched (that would close
  // the keyboard after every key): stop that at touchstart (needs a non-passive listener)
  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const hold = (event: TouchEvent) => event.preventDefault();
    el.addEventListener('touchstart', hold, { passive: false });
    return () => el.removeEventListener('touchstart', hold);
  });

  // Which field is being typed in: iOS's keyboard stays away from it (inputmode none)
  useEffect(() => {
    if (!enabled) return;
    const onFocus = (event: FocusEvent) => {
      const el = event.target;
      if (!isTypingField(el)) return;
      if (!el.dataset.voInputmode) el.dataset.voInputmode = el.getAttribute('inputmode') ?? '';
      el.setAttribute('inputmode', 'none');
      setField(el);
      setLayer(el.type === 'number' || el.type === 'tel' || /numeric|decimal/.test(el.dataset.voInputmode) ? 'numbers' : 'letters');
      setShift(el.value ? 'off' : el.type === 'email' || el.type === 'url' || el.autocapitalize === 'none' ? 'off' : 'once');
      // Keep it above the keyboard
      window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
    };
    const onBlur = (event: FocusEvent) => {
      // Moving to another field: keep the keyboard
      window.setTimeout(() => {
        if (!isTypingField(document.activeElement)) setField(null);
      }, 0);
      void event;
    };
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);
    return () => {
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
    };
  }, [enabled]);

  useEffect(() => {
    document.documentElement.style.setProperty('--vo-keyboard', field ? 'var(--vo-keyboard-height)' : '0px');
    document.documentElement.toggleAttribute('data-keyboard', !!field);
  }, [field]);

  if (!enabled || !field) return null;

  const click = () => settings.keyboardSound && playSound('tick');
  const type = (text: string) => {
    click();
    const upper = shift !== 'off' && layer === 'letters';
    insert(field, upper ? text.toUpperCase() : text);
    if (shift === 'once') setShift('off');
    // After ". " a new sentence starts with a capital
    if (text === ' ' && /[.!?]\s$/.test(field.value)) setShift('once');
  };
  const backspace = () => {
    click();
    insert(field, '', true);
  };
  const holdBackspace = () => {
    backspace();
    const step = (delay: number) => {
      repeat.current = window.setTimeout(() => {
        insert(field, '', true);
        step(Math.max(45, delay * 0.85));
      }, delay);
    };
    step(380);
  };
  const stop = () => window.clearTimeout(repeat.current);
  const toggleShift = () => {
    click();
    const now = Date.now();
    if (now - lastShiftTap.current < 320) setShift('caps');
    else setShift(shift === 'off' ? 'once' : 'off');
    lastShiftTap.current = now;
  };
  const useSystemKeyboard = () => {
    // This field: the iOS keyboard (emoji, dictation, languages)
    field.dataset.systemKeyboard = '1';
    const before = field.dataset.voInputmode ?? '';
    if (before) field.setAttribute('inputmode', before);
    else field.removeAttribute('inputmode');
    setField(null);
    field.blur();
    window.setTimeout(() => field.focus(), 30);
  };

  const rows = layer === 'letters' ? LETTERS : layer === 'numbers' ? NUMBERS : SYMBOLS;
  const upper = shift !== 'off' && layer === 'letters';
  // Keep focus in the field: keys act on pointerdown and never take focus
  const keep = (event: React.PointerEvent | React.MouseEvent) => event.preventDefault();
  const key = (label: string, onPress: () => void, extra = '', aria?: string) => (
    <button
      key={label + extra}
      type="button"
      className={`${styles.key} ${extra}`}
      aria-label={aria ?? label}
      onPointerDown={(event) => {
        keep(event);
        onPress();
      }}
      onMouseDown={keep}
    >
      {label}
    </button>
  );
  const returnLabel = field.enterKeyHint === 'search' || field.type === 'search' ? 'search' : field.enterKeyHint === 'go' ? 'go' : field instanceof HTMLTextAreaElement ? '↵' : 'done';

  return (
    <div
      ref={board}
      className={styles.keyboard}
      data-style={settings.keyboardStyle}
      data-shape={settings.keyboardShape}
      role="group"
      aria-label="Vantage keyboard"
      data-no-gesture
      onPointerDown={keep}
      style={{ '--rows': settings.keyboardNumberRow && layer === 'letters' ? 5 : 4 } as CSSProperties}
    >
      {settings.keyboardNumberRow && layer === 'letters' && <div className={styles.row}>{[...'1234567890'].map((c) => key(c, () => type(c)))}</div>}
      {rows.map((row, r) => (
        <div key={r} className={styles.row}>
          {r === 2 &&
            (layer === 'letters'
              ? key(shift === 'caps' ? '⇪' : '⇧', toggleShift, `${styles.wide} ${shift !== 'off' ? styles.on : ''}`, shift === 'caps' ? 'Caps lock' : 'Shift')
              : key(layer === 'numbers' ? '#+=' : '123', () => setLayer(layer === 'numbers' ? 'symbols' : 'numbers'), styles.wide, layer === 'numbers' ? 'More symbols' : 'Numbers'))}
          {[...row].map((c) => key(upper ? c.toUpperCase() : c, () => type(c)))}
          {r === 2 && (
            <button
              type="button"
              className={`${styles.key} ${styles.wide}`}
              aria-label="Delete"
              onPointerDown={(event) => {
                keep(event);
                holdBackspace();
              }}
              onPointerUp={stop}
              onPointerLeave={stop}
              onPointerCancel={stop}
              onMouseDown={keep}
            >
              ⌫
            </button>
          )}
        </div>
      ))}
      <div className={styles.row}>
        {key(layer === 'letters' ? '123' : 'ABC', () => setLayer(layer === 'letters' ? 'numbers' : 'letters'), styles.wide, layer === 'letters' ? 'Numbers' : 'Letters')}
        {key('🌐', useSystemKeyboard, styles.mid, 'iOS keyboard')}
        {key('space', () => type(' '), styles.space, 'Space')}
        {key(returnLabel, () => {
          click();
          pressEnter(field);
        }, `${styles.wide} ${styles.accent}`, 'Return')}
      </div>
    </div>
  );
}

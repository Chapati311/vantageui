import { useEffect, useLayoutEffect, useRef } from 'react';
import { playSound } from '../../system/sounds';
import styles from './ScrollWheel.module.css';

interface ScrollWheelProps<T extends string | number> {
  /** For screen readers, e.g. "Hours" */
  label: string;
  options: { value: T; label: string }[];
  value: T;
  /** Called once the wheel comes to rest on a new option */
  onChange: (value: T) => void;
  disabled?: boolean;
}

/** Height of one option (px). Five are visible: two above and two below the chosen one. */
const ROW = 40;
const VISIBLE = 5;

/**
 * A picker wheel, like the ones for setting an alarm. Flick it and it snaps
 * to an option, with a soft click as each option passes the middle. Options
 * fade and tilt away from the middle, like a drum.
 */
export function ScrollWheel<T extends string | number>({ label, options, value, onChange, disabled }: ScrollWheelProps<T>) {
  const list = useRef<HTMLDivElement>(null);
  const shownIndex = useRef(-1);
  const frame = useRef(0);
  const settle = useRef<number | undefined>(undefined);
  const index = Math.max(0, options.findIndex((option) => option.value === value));

  /** Fades and tilts each option by its distance from the middle. Writes styles directly (no re-render). */
  const paint = () => {
    const element = list.current;
    if (!element) return;
    const position = element.scrollTop / ROW;
    const items = element.children;
    for (let i = 0; i < items.length; i += 1) {
      const distance = Math.min(Math.abs(i - position), 2.5);
      const item = items[i] as HTMLElement;
      item.style.opacity = String(1 - distance * 0.34);
      item.style.transform = `rotateX(${(i - position) * -18}deg) scale(${1 - distance * 0.06})`;
    }
    const nearest = Math.round(position);
    if (shownIndex.current !== -1 && nearest !== shownIndex.current) playSound('tick');
    shownIndex.current = nearest;
  };

  // Put the wheel on the chosen option (first show, and when the value changes from outside)
  useLayoutEffect(() => {
    const element = list.current;
    if (!element) return;
    if (Math.round(element.scrollTop / ROW) !== index) element.scrollTop = index * ROW;
    shownIndex.current = index;
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      window.clearTimeout(settle.current);
    },
    [],
  );

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(paint);
    // When the wheel has stopped for a moment, report the option in the middle
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const element = list.current;
      if (!element) return;
      const nearest = Math.min(options.length - 1, Math.max(0, Math.round(element.scrollTop / ROW)));
      if (options[nearest] && options[nearest].value !== value) onChange(options[nearest].value);
    }, 140);
  };

  return (
    <div
      className={`${styles.wheel} ${disabled ? styles.disabled : ''}`}
      style={{ height: ROW * VISIBLE }}
      role="listbox"
      aria-label={label}
    >
      <span className={styles.band} style={{ top: ROW * 2, height: ROW }} aria-hidden="true" />
      <div
        ref={list}
        className={styles.list}
        style={{ paddingBlock: ROW * 2 }}
        onScroll={onScroll}
        tabIndex={0}
        onKeyDown={(event) => {
          const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
          if (!step) return;
          event.preventDefault();
          const next = options[Math.min(options.length - 1, Math.max(0, index + step))];
          if (next) onChange(next.value);
        }}
      >
        {options.map((option, i) => (
          <div
            key={String(option.value)}
            className={styles.option}
            style={{ height: ROW }}
            role="option"
            aria-selected={i === index}
            onClick={() => list.current?.scrollTo({ top: i * ROW, behavior: 'smooth' })}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}

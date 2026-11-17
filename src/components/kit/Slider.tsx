import { useRef, type PointerEvent } from 'react';
import styles from './Slider.module.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  /** Values snap to multiples of this */
  step: number;
  onChange: (value: number) => void;
  /** How the value is shown on the right, e.g. (v) => `${v}px` */
  format?: (value: number) => string;
  disabled?: boolean;
}

/** A pill-shaped slider you drag anywhere on. Changes apply while you drag. */
export function Slider({ label, value, min, max, step, onChange, format, disabled }: SliderProps) {
  const track = useRef<HTMLDivElement>(null);
  const fraction = (value - min) / (max - min);

  const setFrom = (event: PointerEvent<HTMLDivElement>) => {
    const rect = track.current!.getBoundingClientRect();
    const raw = min + ((event.clientX - rect.left) / rect.width) * (max - min);
    const snapped = Math.round(raw / step) * step;
    const next = Math.min(max, Math.max(min, Number(snapped.toFixed(4))));
    if (next !== value) onChange(next);
  };

  return (
    <div className={`${styles.row} ${disabled ? styles.disabled : ''}`} aria-disabled={disabled}>
      <span className={styles.label}>{label}</span>
      <div
        ref={track}
        className={styles.track}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setFrom(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) setFrom(event);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') onChange(Math.min(max, value + step));
          if (event.key === 'ArrowLeft') onChange(Math.max(min, value - step));
        }}
      >
        <div className={styles.fill} style={{ transform: `scaleX(${fraction})` }} />
      </div>
      <span className={styles.value}>{format ? format(value) : value}</span>
    </div>
  );
}

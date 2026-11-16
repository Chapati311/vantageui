import type { ComponentType, PointerEvent } from 'react';
import styles from './Slider.module.css';

interface SliderProps {
  label: string;
  icon: ComponentType;
  /** 0 to 1 */
  value: number;
  onChange: (value: number) => void;
}

/** A big pill-shaped slider you drag anywhere on. */
export function Slider({ label, icon: Glyph, value, onChange }: SliderProps) {
  const setFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onChange(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)));
  };

  return (
    <div
      className={styles.slider}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      onPointerDown={(event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        setFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) setFromPointer(event);
      }}
      onPointerUp={(event) => event.stopPropagation()}
    >
      <div className={styles.fill} style={{ transform: `scaleX(${value})` }} />
      <span className={styles.icon}>
        <Glyph />
      </span>
    </div>
  );
}

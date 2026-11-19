import { useRef, useState, type ComponentType, type PointerEvent, type ReactNode } from 'react';
import { playSound } from '../../system/sounds';
import { DotNumber } from '../DotNumber';
import { useTheme } from '../../system/theme';
import styles from './Dial.module.css';

interface DialProps {
  label: string;
  /** 0 to 1 */
  value: number;
  /** Called once, when the finger lifts */
  onChange: (value: number) => void;
  /** Called on every move while turning (for live previews) */
  onInput?: (value: number) => void;
  /** Snap to this many steps, with a soft click on each one */
  steps?: number;
  /** Draw the ring as this many dots that light up, instead of a line */
  dots?: number;
  /** An icon in the middle, above the number */
  icon?: ComponentType;
  /** Replaces the icon, number and label in the middle */
  children?: ReactNode;
  /** 'small' = 2 grid cells wide (control center), 'large' = the full width (timer) */
  size?: 'small' | 'large';
  /** Draw the ring in the text color instead of the accent (when another accent is on screen) */
  plain?: boolean;
  disabled?: boolean;
}

// The ring has a gap at the bottom. Angles in degrees, 0 = pointing right, clockwise.
const START_ANGLE = 135; // bottom-left
const SWEEP = 270; // round to bottom-right
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_LENGTH = CIRCUMFERENCE * (SWEEP / 360);

const pointAt = (fraction: number) => {
  const angle = ((START_ANGLE + fraction * SWEEP) * Math.PI) / 180;
  return { x: 50 + RADIUS * Math.cos(angle), y: 50 + RADIUS * Math.sin(angle) };
};

/** A thin circular dial you turn by dragging a finger around it. */
export function Dial({ label, value, onChange, onInput, steps, dots, icon: Glyph, children, size = 'small', disabled, plain }: DialProps) {
  // While turning, the value lives here, so nothing is saved on every move.
  const [dragValue, setDragValue] = useState<number | null>(null);
  const lastStep = useRef<number | null>(null);
  const shown = dragValue ?? value;

  const snap = (fraction: number) => (steps ? Math.round(fraction * steps) / steps : fraction);

  /** Where on the ring the finger is, as 0..1 (or null in the gap at the bottom). */
  const readPointer = (event: PointerEvent<HTMLDivElement>): number | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const angle = ((Math.atan2(dy, dx) * 180) / Math.PI - START_ANGLE + 360) % 360;
    return angle > SWEEP ? null : snap(angle / SWEEP);
  };

  const update = (next: number) => {
    setDragValue(next);
    onInput?.(next);
    // A soft click each time the dial passes a step (every 5% without steps)
    const step = Math.round(next * (steps ?? 20));
    if (lastStep.current !== null && step !== lastStep.current) playSound('tick');
    lastStep.current = step;
  };

  const knob = pointAt(shown);
  const retro = useTheme().retro !== null;

  return (
    <div
      className={`${styles.dial} ${size === 'large' ? styles.large : ''} ${disabled ? styles.disabled : ''} ${plain ? styles.plain : ''}`}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(shown * 100)}
      aria-disabled={disabled}
      onPointerDown={(event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        lastStep.current = Math.round(value * (steps ?? 20));
        update(readPointer(event) ?? value);
      }}
      onPointerMove={(event) => {
        if (dragValue === null) return;
        const next = readPointer(event);
        // Ignore the gap, and don't let the value jump from one end to the other.
        if (next !== null && next !== dragValue && Math.abs(next - dragValue) < 0.5) update(next);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        if (dragValue !== null) onChange(dragValue);
        setDragValue(null);
      }}
      onPointerCancel={() => setDragValue(null)}
    >
      <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
        {dots ? (
          Array.from({ length: dots }, (_, index) => {
            const fraction = index / (dots - 1);
            const point = pointAt(fraction);
            const lit = fraction <= shown + 0.0001 && shown > 0;
            return retro ? (
              <rect key={index} className={lit ? styles.dotLit : styles.dotOff} x={Math.round(point.x / 2) * 2 - 1.3} y={Math.round(point.y / 2) * 2 - 1.3} width="2.6" height="2.6" />
            ) : (
              <circle key={index} className={lit ? styles.dotLit : styles.dotOff} cx={point.x} cy={point.y} r="1.4" />
            );
          })
        ) : (
          <g transform={`rotate(${START_ANGLE} 50 50)`}>
            <circle className={styles.track} cx="50" cy="50" r={RADIUS} strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`} />
            <circle className={styles.level} cx="50" cy="50" r={RADIUS} strokeDasharray={`${ARC_LENGTH * shown} ${CIRCUMFERENCE}`} />
          </g>
        )}
        <circle className={styles.knob} cx={knob.x} cy={knob.y} r={size === 'large' ? 2.6 : 3.6} />
      </svg>
      <div className={styles.center}>
        {children ?? (
          <>
            {Glyph && <Glyph />}
            <DotNumber value={String(Math.round(shown * 100))} size={40} />
            <span className="label">{label}</span>
          </>
        )}
      </div>
    </div>
  );
}

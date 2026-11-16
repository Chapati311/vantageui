import { useState, type ComponentType, type PointerEvent } from 'react';
import { DotNumber } from './DotNumber';
import styles from './Dial.module.css';

interface DialProps {
  label: string;
  icon: ComponentType;
  /** 0 to 1 */
  value: number;
  /** Called once, when the finger lifts */
  onChange: (value: number) => void;
}

// The dial is a ring with a gap at the bottom. Angles in degrees,
// 0 = pointing right, going clockwise.
const START_ANGLE = 135; // bottom-left
const SWEEP = 270; // to bottom-right
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_LENGTH = CIRCUMFERENCE * (SWEEP / 360);

/** A thin circular dial you turn by dragging a finger around it. */
export function Dial({ label, icon: Glyph, value, onChange }: DialProps) {
  // While dragging we keep the value here, so nothing is saved on every move.
  const [dragValue, setDragValue] = useState<number | null>(null);
  const shown = dragValue ?? value;

  /** Where on the ring the finger is, as 0..1 (or null in the gap at the bottom). */
  const readPointer = (event: PointerEvent<HTMLDivElement>): number | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const angle = ((Math.atan2(dy, dx) * 180) / Math.PI - START_ANGLE + 360) % 360;
    return angle > SWEEP ? null : angle / SWEEP;
  };

  const knobAngle = ((START_ANGLE + shown * SWEEP) * Math.PI) / 180;

  return (
    <div
      className={styles.dial}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(shown * 100)}
      onPointerDown={(event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragValue(readPointer(event) ?? value);
      }}
      onPointerMove={(event) => {
        if (dragValue === null) return;
        const next = readPointer(event);
        // Ignore the gap, and don't let the value jump from one end to the other.
        if (next !== null && Math.abs(next - dragValue) < 0.5) setDragValue(next);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        if (dragValue !== null) onChange(dragValue);
        setDragValue(null);
      }}
      onPointerCancel={() => setDragValue(null)}
    >
      <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
        <g transform={`rotate(${START_ANGLE} 50 50)`}>
          <circle className={styles.track} cx="50" cy="50" r={RADIUS} strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`} />
          <circle
            className={styles.level}
            cx="50"
            cy="50"
            r={RADIUS}
            strokeDasharray={`${ARC_LENGTH * shown} ${CIRCUMFERENCE}`}
          />
        </g>
        <circle
          className={styles.knob}
          cx={50 + RADIUS * Math.cos(knobAngle)}
          cy={50 + RADIUS * Math.sin(knobAngle)}
          r="3.6"
        />
      </svg>
      <div className={styles.center}>
        <Glyph />
        <DotNumber value={String(Math.round(shown * 100))} size={40} />
        <span className="label">{label}</span>
      </div>
    </div>
  );
}

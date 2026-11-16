import { DotNumber } from '../../components/DotNumber';
import { Widget } from '../../components/Widget';
import { useBattery } from '../../system/useBattery';
import styles from './BatteryWidget.module.css';

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A thin ring that fills with the battery level, with the percent inside in
 * the same dot numbers as every other widget. This ring is the one
 * accent-colored element on its page.
 */
export function BatteryWidget() {
  const battery = useBattery();
  const level = battery?.level ?? 0;
  const percent = battery ? Math.round(level * 100) : null;

  return (
    <Widget shape="circle">
      <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
        <circle className={styles.track} cx="50" cy="50" r={RADIUS} />
        <circle
          className={styles.level}
          cx="50"
          cy="50"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - level)}
        />
      </svg>
      <div className={styles.percent} aria-label="Battery">
        {/* narrowOne: lets "100" fit inside a one-cell circle */}
        <DotNumber value={percent === null ? '--' : String(percent)} size={28} narrowOne />
      </div>
    </Widget>
  );
}

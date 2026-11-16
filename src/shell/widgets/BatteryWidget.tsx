import { Widget } from '../../components/Widget';
import { useBattery } from '../../system/useBattery';
import styles from './BatteryWidget.module.css';

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A ring that fills up with the battery level, with the percent inside. */
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
      <div
        className={`${styles.percent} ${percent === 100 ? styles.full : ''}`}
        aria-label="Battery"
      >
        {percent ?? '--'}
      </div>
    </Widget>
  );
}

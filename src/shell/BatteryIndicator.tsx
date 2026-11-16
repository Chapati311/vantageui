import { useBattery } from '../system/useBattery';
import styles from './BatteryIndicator.module.css';

/** Small battery icon + percentage. Shows "--" when the level is unknown. */
export function BatteryIndicator() {
  const battery = useBattery();
  const percent = battery ? Math.round(battery.level * 100) : null;

  return (
    <div className={styles.battery} aria-label={percent === null ? 'Battery unknown' : `Battery ${percent}%`}>
      <span className={styles.label}>
        {percent === null ? '--' : `${percent}%`}
        {battery?.charging ? ' +' : ''}
      </span>
      <span className={styles.icon}>
        <span className={styles.fill} style={{ transform: `scaleX(${battery?.level ?? 0})` }} />
      </span>
    </div>
  );
}

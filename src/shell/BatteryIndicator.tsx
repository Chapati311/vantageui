import { BoltIcon } from '../components/glyphs';
import { useBattery } from '../system/useBattery';
import styles from './BatteryIndicator.module.css';

/** Small battery icon + percentage. Shows "--" when the level is unknown. */
export function BatteryIndicator() {
  const battery = useBattery();
  const percent = battery ? Math.round(battery.level * 100) : null;
  const label =
    percent === null
      ? 'Battery unknown'
      : `Battery ${percent}%${battery?.charging ? ', charging' : ''}`;

  return (
    <div className={styles.battery} aria-label={label}>
      {battery?.charging && (
        <span className={styles.bolt}>
          <BoltIcon />
        </span>
      )}
      <span className={styles.label}>{percent === null ? '--' : `${percent}%`}</span>
      <span className={styles.icon}>
        <span className={styles.fill} style={{ transform: `scaleX(${battery?.level ?? 0})` }} />
      </span>
    </div>
  );
}

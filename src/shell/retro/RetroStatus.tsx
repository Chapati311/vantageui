import { useBattery } from '../../system/useBattery';
import { useOnline } from '../../system/useOnline';
import { useLiveText } from './useLiveText';
import styles from './Retro.module.css';

/**
 * The old-phone status bar: signal bars on the left, battery bars on the
 * right, the operator name "VANTAGE" in the middle.
 * The bars only show what is real: signal = connected to the internet or
 * not (a web app can't read the real signal), battery = empty outline when
 * the level is unknown (iPhone Safari).
 */
export function RetroStatus() {
  const online = useOnline();
  const battery = useBattery();
  const batteryBars = battery ? Math.max(1, Math.round(battery.level * 4)) : 0;
  const live = useLiveText();

  return (
    <div className={styles.status}>
      <span className={styles.signal} aria-label={online ? 'Online' : 'Offline'}>
        {[1, 2, 3, 4, 5].map((bar) => (
          <span key={bar} className={`${styles.bar} ${online ? styles.lit : ''}`} style={{ height: bar * 4 }} />
        ))}
      </span>
      <span className={styles.operator}>{live ?? 'VANTAGE'}</span>
      <span
        className={styles.battery}
        aria-label={battery ? `Battery ${Math.round(battery.level * 100)}%` : 'Battery unknown'}
      >
        {[4, 3, 2, 1].map((segment) => (
          <span key={segment} className={`${styles.cell} ${segment <= batteryBars ? styles.lit : ''}`} />
        ))}
      </span>
    </div>
  );
}

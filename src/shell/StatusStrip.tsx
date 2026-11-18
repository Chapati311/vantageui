import { useOnline } from '../system/useOnline';
import { useClock } from '../system/useClock';
import { formatTime } from '../system/timeFormat';
import { WifiIcon } from '../components/glyphs';
import { BatteryIndicator } from './BatteryIndicator';
import styles from './StatusStrip.module.css';

/** iOS draws its own status bar over an app started from the home screen. */
const IOS_STANDALONE = typeof navigator !== 'undefined' && (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * The status bar along the top: time in the middle, connection on the left,
 * battery on the right. Shown on the home screen and in every app. When
 * Vantage runs as an iPhone home-screen app, iOS already shows its own bar
 * there, so this one steps aside.
 */
export function StatusStrip({ hidden }: { hidden?: boolean }) {
  const now = useClock();
  const online = useOnline();
  if (IOS_STANDALONE || hidden) return null;
  return (
    <div className={styles.strip} aria-hidden="true">
      <span className={`${styles.side} ${online ? '' : styles.off}`}>
        <WifiIcon />
      </span>
      <span className={styles.time}>{formatTime(now)}</span>
      <span className={`${styles.side} ${styles.right}`}>
        <BatteryIndicator />
      </span>
    </div>
  );
}

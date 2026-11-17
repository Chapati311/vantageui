import { DotNumber } from '../components/DotNumber';
import { formatDate, formatTime } from '../system/timeFormat';
import { useClock } from '../system/useClock';
import styles from './LockClock.module.css';

/** The big clock and date. Re-renders once per minute, on its own. */
export function LockClock() {
  const now = useClock();

  return (
    <div className={styles.wrap}>
      <time dateTime={now.toISOString()}>
        <DotNumber value={formatTime(now)} size={96} clock blinkColon />
      </time>
      <div className="label">{formatDate(now)}</div>
    </div>
  );
}

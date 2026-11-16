import { formatDate, formatTime } from '../system/timeFormat';
import { useClock } from '../system/useClock';
import styles from './LockClock.module.css';

/** The big clock and date. Re-renders once per minute, on its own. */
export function LockClock() {
  const now = useClock();

  return (
    <div className={styles.wrap}>
      <time className={styles.time} dateTime={now.toISOString()}>
        {formatTime(now)}
      </time>
      <div className={styles.date}>{formatDate(now)}</div>
    </div>
  );
}

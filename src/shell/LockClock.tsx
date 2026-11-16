import { formatDate, formatTime } from '../system/timeFormat';
import { useClock } from '../system/useClock';
import styles from './LockClock.module.css';

/** The big clock and date. Re-renders once per minute, on its own. */
export function LockClock() {
  const now = useClock();
  const [hours, minutes] = formatTime(now).split(':');

  return (
    <div className={styles.wrap}>
      <time className={styles.time} dateTime={now.toISOString()} aria-label={`${hours}:${minutes}`}>
        <span>{hours}</span>
        {/* Our own colon: two single round dots that softly blink once a second */}
        <span className={styles.colon} aria-hidden="true">
          <span className={styles.colonDot} />
          <span className={styles.colonDot} />
        </span>
        <span>{minutes}</span>
      </time>
      <div className={styles.date}>{formatDate(now)}</div>
    </div>
  );
}

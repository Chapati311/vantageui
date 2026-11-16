import { useClock } from '../system/useClock';
import styles from './LockClock.module.css';

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** The big clock and date. Re-renders once per minute, on its own. */
export function LockClock() {
  const now = useClock();

  return (
    <div className={styles.wrap}>
      <time className={styles.time} dateTime={now.toISOString()}>
        {timeFormat.format(now)}
      </time>
      <div className={styles.date}>{dateFormat.format(now).replace(',', '')}</div>
    </div>
  );
}

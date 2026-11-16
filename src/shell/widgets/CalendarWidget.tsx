import { Widget } from '../../components/Widget';
import { useClock } from '../../system/useClock';
import styles from './CalendarWidget.module.css';

/**
 * DEMO event. A web app can't read the phone's calendar, so the "next
 * event" is made up until the native bridge (or a Calendar app) exists.
 */
const DEMO_EVENT = { title: 'Design review', time: '14:30' };

const weekdayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long' });

/** Today's date, and the next event under a thin line. */
export function CalendarWidget() {
  const now = useClock();

  return (
    <Widget shape="rounded">
      <div className={styles.calendar}>
        <div>
          <div className={styles.label}>{weekdayFormat.format(now)}</div>
          <div className={styles.day}>{now.getDate()}</div>
          <div className={styles.label}>{monthFormat.format(now)}</div>
        </div>
        <div className={styles.event}>
          <span className={styles.label}>Next · {DEMO_EVENT.time}</span>
          <span className={styles.title}>{DEMO_EVENT.title}</span>
        </div>
      </div>
    </Widget>
  );
}

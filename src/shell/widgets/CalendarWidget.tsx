import { DotNumber } from '../../components/DotNumber';
import { Widget } from '../../components/Widget';
import { useClock } from '../../system/useClock';
import styles from './CalendarWidget.module.css';

/**
 * DEMO event. A web app can't read the phone's calendar, so the "next
 * event" is made up until the native bridge (or a Calendar app) exists.
 */
const DEMO_EVENT = { title: 'Design review', time: '14:30' };

const dateFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', month: 'short' });

/** Today's date, and the next event under a thin line. */
export function CalendarWidget() {
  const now = useClock();
  const parts = dateFormat.formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  return (
    <Widget shape="rounded">
      <div className={styles.calendar}>
        <div className={styles.today}>
          <span className="label">
            {part('weekday')} · {part('month')}
          </span>
          <DotNumber value={String(now.getDate())} size={40} />
        </div>
        <div className={styles.event}>
          <span className="label">Next · {DEMO_EVENT.time}</span>
          <span className={styles.title}>{DEMO_EVENT.title}</span>
        </div>
      </div>
    </Widget>
  );
}

import { DotNumber } from '../../components/DotNumber';
import { Widget } from '../../components/Widget';
import { dayKey, nextEvent, useEvents } from '../../system/events';
import { useClock } from '../../system/useClock';
import styles from './CalendarWidget.module.css';

const shortDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric' });
const dateFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', month: 'short' });

/** Today's date, and the next event under a thin line. */
export function CalendarWidget() {
  const now = useClock();
  const { events } = useEvents();
  const next = nextEvent(events, now);
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
          <span className="label">{next ? (next.date === dayKey(now) ? next.time ?? 'Today' : shortDate.format(new Date(`${next.date}T00:00:00`))) : 'Next'}</span>
          <span className={styles.empty}>{next ? next.title : 'No events'}</span>
        </div>
      </div>
    </Widget>
  );
}

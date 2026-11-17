import { DotNumber } from '../../components/DotNumber';
import { Widget } from '../../components/Widget';
import { useClock } from '../../system/useClock';
import styles from './CalendarWidget.module.css';

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
          {/* Events come from the Vantage Calendar app (Phase 5). Until then there are none. */}
          <span className="label">Next</span>
          <span className={styles.empty}>No events</span>
        </div>
      </div>
    </Widget>
  );
}

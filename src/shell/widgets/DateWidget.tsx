import { DotNumber } from '../../components/DotNumber';
import { Widget } from '../../components/Widget';
import { formatWeekday } from '../../system/timeFormat';
import { useClock } from '../../system/useClock';
import styles from './DateWidget.module.css';

/** Weekday and day of the month in a circle. */
export function DateWidget() {
  const now = useClock();

  return (
    <Widget shape="circle">
      <div className={styles.date}>
        <span className="label">{formatWeekday(now)}</span>
        <DotNumber value={String(now.getDate())} size={28} />
      </div>
    </Widget>
  );
}

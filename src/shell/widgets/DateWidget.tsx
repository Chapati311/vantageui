import { Widget } from '../../components/Widget';
import { formatWeekday } from '../../system/timeFormat';
import { useClock } from '../../system/useClock';
import styles from './DateWidget.module.css';

/** Weekday and day of the month in a circle. */
export function DateWidget() {
  const now = useClock();

  return (
    <Widget shape="circle">
      <span className={styles.ring} />
      <div className={styles.weekday}>{formatWeekday(now)}</div>
      <div className={styles.day}>{now.getDate()}</div>
    </Widget>
  );
}

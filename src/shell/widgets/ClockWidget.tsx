import { Widget } from '../../components/Widget';
import { formatDate, formatTime } from '../../system/timeFormat';
import { useClock } from '../../system/useClock';
import styles from './ClockWidget.module.css';

export function ClockWidget() {
  const now = useClock();

  return (
    <Widget size="wide">
      <div className={styles.wrap}>
        <time className={styles.time} dateTime={now.toISOString()}>
          {formatTime(now)}
        </time>
        <div className={styles.date}>{formatDate(now)}</div>
      </div>
    </Widget>
  );
}

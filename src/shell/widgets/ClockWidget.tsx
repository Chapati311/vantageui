import { Widget } from '../../components/Widget';
import { formatTime } from '../../system/timeFormat';
import { useClock } from '../../system/useClock';
import type { WidgetProps } from './types';
import styles from './ClockWidget.module.css';

/** Dot-matrix clock. 2x2: hours above minutes. 2x1: one line. */
export function ClockWidget({ size }: WidgetProps) {
  const now = useClock();
  const [hours, minutes] = formatTime(now).split(':');

  return (
    <Widget shape="rounded">
      {size === '2x2' ? (
        <time className={styles.stack} dateTime={now.toISOString()}>
          <span>{hours}</span>
          <span className={styles.minutes}>{minutes}</span>
        </time>
      ) : (
        <time className={styles.line} dateTime={now.toISOString()}>
          {hours}:{minutes}
        </time>
      )}
    </Widget>
  );
}

import { DotNumber } from '../../components/DotNumber';
import { Widget } from '../../components/Widget';
import { formatTime } from '../../system/timeFormat';
import { useClock } from '../../system/useClock';
import type { WidgetProps } from './types';
import styles from './ClockWidget.module.css';

/** The hero of page 1. 2x2: hours above minutes. 2x1: one line. */
export function ClockWidget({ size }: WidgetProps) {
  const now = useClock();
  const time = formatTime(now);
  const [hours, minutes] = time.split(':');

  return (
    <Widget shape="rounded">
      <time className={styles.clock} dateTime={now.toISOString()}>
        {size === '2x2' ? (
          <>
            <DotNumber value={hours} size={64} />
            <DotNumber value={minutes} size={64} muted />
          </>
        ) : (
          <DotNumber value={time} size={40} clock />
        )}
      </time>
    </Widget>
  );
}

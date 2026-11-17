import { DotNumber } from '../../../components/DotNumber';
import { Widget } from '../../../components/Widget';
import { useClock } from '../../../system/useClock';
import { AnalogClock } from '../../lockClocks/AnalogClock';
import { BinaryClock } from '../../lockClocks/BinaryClock';
import { FlipClock } from '../../lockClocks/FlipClock';
import { wordTime } from '../../lockClocks/wordTime';
import type { WidgetProps } from '../types';
import styles from './TimeWidgets.module.css';

const two = (value: number) => String(value).padStart(2, '0');

/** Hours above minutes, in dots. */
export function VerticalClockWidget() {
  const now = useClock();
  return (
    <Widget shape="rounded">
      <div className={styles.vertical}>
        <DotNumber value={two(now.getHours())} size={40} />
        <DotNumber value={two(now.getMinutes())} size={40} muted />
      </div>
    </Widget>
  );
}

/** A thin analog clock: a circle at 1x1, a bigger face at 2x2. */
export function AnalogClockWidget() {
  const now = useClock();
  return (
    <Widget shape="circle">
      <div className={styles.analog}>
        <AnalogClock date={now} size="100%" />
      </div>
    </Widget>
  );
}

/** Two flip cards. */
export function FlipClockWidget({ size }: WidgetProps) {
  const now = useClock();
  return (
    <Widget shape="rounded">
      <FlipClock date={now} height={size === '2x2' ? 96 : 52} />
    </Widget>
  );
}

/** Columns of dots that count in binary. */
export function BinaryClockWidget({ size }: WidgetProps) {
  const now = useClock();
  return (
    <Widget shape="rounded">
      <BinaryClock date={now} dot={size === '2x2' ? 18 : 10} />
    </Widget>
  );
}

/** "It's twenty past seven" in serif. */
export function WordClockWidget({ size }: WidgetProps) {
  const now = useClock();
  return (
    <Widget shape="rounded">
      <p className={`${styles.words} ${size === '4x1' ? styles.wordsWide : ''}`}>{wordTime(now)}</p>
    </Widget>
  );
}

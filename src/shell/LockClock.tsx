import { DotNumber, PixelNumber } from '../components/DotNumber';
import { useSettings, type LockClockStyle } from '../system/settingsStore';
import { formatDate, formatTime } from '../system/timeFormat';
import { useClock } from '../system/useClock';
import { AnalogClock } from './lockClocks/AnalogClock';
import { BinaryClock } from './lockClocks/BinaryClock';
import { FlipClock } from './lockClocks/FlipClock';
import { HandsClock, NumeralClock, SegmentClock } from './lockClocks/PackClocks';
import { wordTime } from './lockClocks/wordTime';
import styles from './lockClocks/LockClocks.module.css';

const two = (value: number) => String(value).padStart(2, '0');

interface LockClockProps {
  /** Show this style instead of the saved one (for the previews in Customise) */
  style?: LockClockStyle;
}

/**
 * The lock screen clock and date, in the style chosen in Customise > Lock
 * screen. Re-renders once per minute, on its own.
 */
export function LockClock({ style }: LockClockProps) {
  const now = useClock();
  const settings = useSettings();
  const face = style ?? settings.lockClockStyle;
  const large = settings.lockClockSize === 'large';
  const dotSize = large ? 96 : 64;

  let clock;
  switch (face) {
    case 'pixel':
      clock = <PixelNumber value={formatTime(now)} size={dotSize} clock blinkColon />;
      break;
    case 'serif':
      clock = <span className={`${styles.serif} ${large ? '' : styles.small}`}>{formatTime(now)}</span>;
      break;
    case 'vertical':
      clock = (
        <span className={styles.vertical}>
          <DotNumber value={two(now.getHours())} size={large ? 96 : 64} />
          <DotNumber value={two(now.getMinutes())} size={large ? 96 : 64} muted />
        </span>
      );
      break;
    case 'analog':
      clock = <AnalogClock date={now} size={large ? 220 : 156} />;
      break;
    case 'flip':
      clock = <FlipClock date={now} height={large ? 120 : 88} />;
      break;
    case 'binary':
      clock = <BinaryClock date={now} dot={large ? 28 : 20} />;
      break;
    case 'word':
      clock = <span className={`${styles.word} ${large ? '' : styles.small}`}>{wordTime(now)}</span>;
      break;
    case 'segment':
      clock = <SegmentClock large={large} />;
      break;
    case 'numeral':
      clock = <NumeralClock date={now} large={large} />;
      break;
    case 'hands':
      clock = <HandsClock size={large ? 220 : 156} />;
      break;
    case 'prompt':
      // Hacker look: the time as the answer to a terminal command
      clock = (
        <span className={styles.prompt}>
          <span className={styles.promptLine}>root@vantage:~$ date</span>
          <DotNumber value={formatTime(now)} size={dotSize} clock blinkColon />
        </span>
      );
      break;
    default:
      clock = <DotNumber value={formatTime(now)} size={dotSize} clock blinkColon />;
  }

  return (
    <div className={styles.wrap}>
      <time dateTime={now.toISOString()} className={styles.time}>
        {clock}
      </time>
      <div className="label">{formatDate(now)}</div>
    </div>
  );
}

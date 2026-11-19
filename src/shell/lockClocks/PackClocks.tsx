import { useEffect, useState } from 'react';
import styles from './LockClocks.module.css';

const two = (value: number) => String(value).padStart(2, '0');

/** Time that ticks every second (only these clocks need seconds). */
function useSeconds(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer = 0;
    const tick = () => {
      setNow(new Date());
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
    };
    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
    return () => window.clearTimeout(timer);
  }, []);
  return now;
}

/** Segmented mono, like a stopwatch readout: "14 02 57", seconds in grey. */
export function SegmentClock({ large }: { large: boolean }) {
  const now = useSeconds();
  return (
    <span className={`${styles.segment} ${large ? '' : styles.small}`} aria-label={`${two(now.getHours())}:${two(now.getMinutes())}`}>
      <span>{two(now.getHours())}</span>
      <span>{two(now.getMinutes())}</span>
      <span className={styles.segmentSeconds}>{two(now.getSeconds())}</span>
    </span>
  );
}

/** Big serif numerals, hours over minutes, like a magazine cover. */
export function NumeralClock({ date, large }: { date: Date; large: boolean }) {
  return (
    <span className={`${styles.numeral} ${large ? '' : styles.small}`} aria-label={`${two(date.getHours())}:${two(date.getMinutes())}`}>
      <span>{two(date.getHours())}</span>
      <span className={styles.numeralMinutes}>{two(date.getMinutes())}</span>
    </span>
  );
}

/**
 * A thin dial with 60 ticks and three slim hands; the seconds are a small
 * red dot travelling round the edge.
 */
export function HandsClock({ size }: { size: number }) {
  const now = useSeconds();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;
  const angle = (seconds / 60) * Math.PI * 2;
  return (
    <svg className={styles.hands} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${two(now.getHours())}:${two(now.getMinutes())}`}>
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          className={i % 5 === 0 ? styles.handsTickMajor : styles.handsTick}
          x1="50"
          y1="3"
          x2="50"
          y2={i % 5 === 0 ? 8 : 6}
          transform={`rotate(${i * 6} 50 50)`}
        />
      ))}
      <line className={styles.handsHour} x1="50" y1="50" x2="50" y2="28" transform={`rotate(${hours * 30} 50 50)`} />
      <line className={styles.handsMinute} x1="50" y1="50" x2="50" y2="14" transform={`rotate(${minutes * 6} 50 50)`} />
      <line className={styles.handsSecond} x1="50" y1="56" x2="50" y2="12" transform={`rotate(${seconds * 6} 50 50)`} />
      <circle className={styles.handsDot} cx={50 + Math.sin(angle) * 43} cy={50 - Math.cos(angle) * 43} r="2" />
      <circle className={styles.handsCenter} cx="50" cy="50" r="1.8" />
    </svg>
  );
}

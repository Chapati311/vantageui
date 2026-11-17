import styles from './LockClocks.module.css';

/** A thin analog clock: hairline ring, 12 small ticks, two thin hands, an accent center. */
export function AnalogClock({ date, size }: { date: Date; size: number }) {
  const minutes = date.getMinutes();
  const hours = (date.getHours() % 12) + minutes / 60;
  return (
    <svg className={styles.analog} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={date.toTimeString().slice(0, 5)}>
      <circle className={styles.analogRing} cx="50" cy="50" r="48" />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          className={i % 3 === 0 ? styles.tickMajor : styles.tick}
          x1="50"
          y1="5"
          x2="50"
          y2={i % 3 === 0 ? 11 : 8}
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
      <line className={styles.hourHand} x1="50" y1="50" x2="50" y2="26" transform={`rotate(${hours * 30} 50 50)`} />
      <line className={styles.minuteHand} x1="50" y1="50" x2="50" y2="12" transform={`rotate(${minutes * 6} 50 50)`} />
      <circle className={styles.center} cx="50" cy="50" r="2.4" />
    </svg>
  );
}

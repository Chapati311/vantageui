import styles from './LockClocks.module.css';

/** How many dots each column has: hour tens (0-2), hour ones (0-9), minute tens (0-5), minute ones (0-9). */
const BITS = [2, 4, 3, 4];

/**
 * A binary clock: four columns of dots, one per digit of HH:MM. A lit dot
 * counts 1, 2, 4 or 8 from the bottom; add them up to read the digit.
 */
export function BinaryClock({ date, dot }: { date: Date; dot: number }) {
  const digits = [
    Math.floor(date.getHours() / 10),
    date.getHours() % 10,
    Math.floor(date.getMinutes() / 10),
    date.getMinutes() % 10,
  ];
  return (
    <div
      className={styles.binary}
      style={{ gap: dot * 0.8 }}
      role="img"
      aria-label={`${digits[0]}${digits[1]}:${digits[2]}${digits[3]}`}
    >
      {digits.map((digit, column) => (
        <div key={column} className={styles.binaryColumn} style={{ gap: dot * 0.6, marginLeft: column === 2 ? dot : 0 }}>
          {[8, 4, 2, 1].map((weight, row) =>
            row < 4 - BITS[column] ? (
              <span key={weight} style={{ width: dot, height: dot }} />
            ) : (
              <span
                key={weight}
                className={`${styles.bit} ${digit & weight ? (column < 2 ? styles.bitHour : styles.bitMinute) : ''}`}
                style={{ width: dot, height: dot }}
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
}

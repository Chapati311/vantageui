import styles from './Temperature.module.css';

/**
 * A temperature in the display font. The degree sign is drawn as a small
 * thin ring, because the dot-matrix font's own "°" looks like a blob.
 * It takes its size from the font-size of whatever it sits in.
 */
export function Temperature({ value }: { value: number | null }) {
  return (
    <span className={styles.temperature} aria-label={value === null ? 'No data' : `${value} degrees`}>
      {value ?? '--'}
      {value !== null && <span className={styles.ring} />}
    </span>
  );
}

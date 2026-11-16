import type { DotSize } from '../theme/tokens';
import { DotNumber } from './DotNumber';
import styles from './Temperature.module.css';

interface TemperatureProps {
  value: number | null;
  /** Height of the digits: one of the design system dot sizes */
  size: DotSize;
}

/** A temperature in dot numbers, with the degree sign drawn as a small thin ring. */
export function Temperature({ value, size }: TemperatureProps) {
  return (
    <span className={styles.temperature} aria-label={value === null ? 'No data' : `${value} degrees`}>
      <DotNumber value={value === null ? '--' : String(value)} size={size} />
      {/* The ring is a fixed share of the digit height, so it scales with it */}
      {value !== null && <span className={styles.ring} style={{ width: size / 4, height: size / 4 }} />}
    </span>
  );
}

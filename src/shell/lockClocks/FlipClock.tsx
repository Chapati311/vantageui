import { AnimatePresence, motion } from 'motion/react';
import { SPRING } from '../../theme/tokens';
import styles from './LockClocks.module.css';

const two = (value: number) => String(value).padStart(2, '0');

/** One card. When its number changes, the new one flips down over the old one. */
function Card({ value, height }: { value: string; height: number }) {
  return (
    <span className={styles.flipCard} style={{ height, width: height * 0.92, fontSize: height * 0.62 }}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className={styles.flipValue}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={SPRING.ui}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className={styles.flipLine} />
    </span>
  );
}

/** A flip clock: hours and minutes on two cards with a hinge line. */
export function FlipClock({ date, height }: { date: Date; height: number }) {
  return (
    <div className={styles.flip} role="img" aria-label={`${two(date.getHours())}:${two(date.getMinutes())}`}>
      <Card value={two(date.getHours())} height={height} />
      <Card value={two(date.getMinutes())} height={height} />
    </div>
  );
}

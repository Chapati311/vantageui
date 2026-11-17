import { motion } from 'motion/react';
import { useClockState } from '../apps/clock/clockStore';
import { MOTION, SPRING } from '../theme/tokens';
import styles from './TimerBanner.module.css';
import { runAction } from '../system/actions';

/**
 * A small glass pill at the top of the screen when a timer has finished,
 * wherever you are in the OS. It springs in from above; tap it to dismiss.
 */
export function TimerBanner() {
  const { timer } = useClockState();
  const done = timer.status === 'done';

  return (
    <motion.button
      type="button"
      className={`label ${styles.banner} ${done ? styles.show : ''}`}
      aria-hidden={!done}
      tabIndex={done ? 0 : -1}
      initial={false}
      // x: -50% keeps it centred; y parks it above the screen while hidden
      animate={{ x: '-50%', y: done ? '0%' : '-300%', opacity: done ? 1 : 0 }}
      whileTap={{ scale: MOTION.pressScale }}
      transition={SPRING.sheet}
      onClick={() => void runAction('timer.reset', {})}
    >
      <span className={styles.dot} />
      Timer done
    </motion.button>
  );
}

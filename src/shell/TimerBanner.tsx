import { resetTimer, useClockState } from '../apps/clock/clockStore';
import styles from './TimerBanner.module.css';

/**
 * A small glass pill at the top of the screen when a timer has finished,
 * wherever you are in the OS. Tap it to dismiss.
 */
export function TimerBanner() {
  const { timer } = useClockState();
  const done = timer.status === 'done';

  return (
    <button
      type="button"
      className={`${styles.banner} ${done ? styles.show : ''}`}
      aria-hidden={!done}
      tabIndex={done ? 0 : -1}
      onClick={resetTimer}
    >
      <span className={styles.dot} />
      Timer done
    </button>
  );
}

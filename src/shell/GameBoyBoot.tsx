import { useEasterEggPlaying } from '../system/easterEgg';
import styles from './GameBoyBoot.module.css';

const COLS = 15;
const ROWS = 27;

/**
 * The easter egg's pixel animation: the screen fills with big green pixels
 * in a diagonal wipe, a pixel "VANTAGE" logo drops in like an old handheld
 * starting up, then it all clears into Game Boy mode.
 */
export function GameBoyBoot() {
  const playing = useEasterEggPlaying();
  if (!playing) return null;
  return (
    <div className={styles.layer} aria-live="polite" aria-label="Game Boy mode">
      <div className={styles.pixels} aria-hidden="true">
        {Array.from({ length: COLS * ROWS }, (_, index) => (
          <span key={index} style={{ animationDelay: `${((index % COLS) + Math.floor(index / COLS)) * 18}ms` }} />
        ))}
      </div>
      <div className={styles.logo}>VANTAGE</div>
    </div>
  );
}

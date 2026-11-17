import styles from './LiveWaves.module.css';

/**
 * Two full wave periods side by side (800 units wide, one period = 400).
 * The strip is twice the screen width and slides left by half, so the loop
 * is seamless.
 */
const WAVE = 'M0 50 Q100 10 200 50 T400 50 T600 50 T800 50 V100 H0Z';

/** Three soft layers of waves rolling slowly near the bottom of the screen. */
export function LiveWaves() {
  return (
    <div className={styles.waves} aria-hidden="true">
      {[0, 1, 2].map((layer) => (
        <svg
          key={layer}
          className={`${styles.wave} ${styles[`layer${layer}`]}`}
          viewBox="0 0 800 100"
          preserveAspectRatio="none"
        >
          <path d={WAVE} />
        </svg>
      ))}
    </div>
  );
}

import styles from './LiveAurora.module.css';

/**
 * Soft colored glows drifting slowly, like an aurora. The colors come from
 * the accent (see --aurora-1/2/3 in the theme engine). Each glow is a
 * radial gradient that only moves (no blur filter), so it stays cheap.
 */
export function LiveAurora() {
  return (
    <div className={styles.aurora} aria-hidden="true">
      <span className={`${styles.glow} ${styles.one}`} />
      <span className={`${styles.glow} ${styles.two}`} />
      <span className={`${styles.glow} ${styles.three}`} />
    </div>
  );
}

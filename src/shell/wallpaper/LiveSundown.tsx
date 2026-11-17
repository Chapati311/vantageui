import styles from './LiveSundown.module.css';

/**
 * A big sun slowly sinking toward a thin horizon, cut by soft horizontal
 * bands near its bottom, with a faint warm sky behind it. The sun is drawn
 * in the accent color, so it follows the theme.
 */
export function LiveSundown() {
  return (
    <div className={styles.sundown} aria-hidden="true">
      <div className={styles.sky} />
      <div className={styles.sun} />
      <div className={styles.horizon} />
      <div className={styles.reflection} />
    </div>
  );
}

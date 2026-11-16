import styles from './LockDots.module.css';

/** A quiet, still wallpaper: a faint grid of dots that fades out in the middle. */
export function LockDots() {
  return <div className={styles.dots} aria-hidden="true" />;
}

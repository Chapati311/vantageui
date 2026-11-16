import styles from './NotificationCount.module.css';

interface NotificationCountProps {
  count: number;
}

/** An accent dot + the number of waiting notifications. */
export function NotificationCount({ count }: NotificationCountProps) {
  return (
    <div className={styles.wrap} aria-label={`${count} notifications`}>
      <span className={`${styles.dot} ${count > 0 ? styles.active : ''}`} />
      <span className={styles.count}>{count}</span>
    </div>
  );
}

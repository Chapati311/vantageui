import { BellIcon } from '../components/glyphs';
import styles from './NotificationCount.module.css';

interface NotificationCountProps {
  count: number;
}

/** A bell + the number of waiting notifications (just a quiet bell when there are none). */
export function NotificationCount({ count }: NotificationCountProps) {
  return (
    <div className={styles.wrap} aria-label={`${count} notifications`}>
      <span className={`${styles.bell} ${count > 0 ? styles.active : ''}`}>
        <BellIcon />
      </span>
      {/* No number when there is nothing waiting */}
      {count > 0 && <span className={styles.count}>{count}</span>}
    </div>
  );
}

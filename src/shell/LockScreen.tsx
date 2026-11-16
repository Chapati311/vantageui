import { BatteryIndicator } from './BatteryIndicator';
import { LockClock } from './LockClock';
import { NotificationCount } from './NotificationCount';
import { useSwipeUp } from './gestures/useSwipeUp';
import styles from './LockScreen.module.css';

/** Placeholder until there is a real notification system. */
const PLACEHOLDER_NOTIFICATIONS = 3;

interface LockScreenProps {
  locked: boolean;
  onUnlock: () => void;
}

/** Sits on top of the home screen and slides away when swiped up. */
export function LockScreen({ locked, onUnlock }: LockScreenProps) {
  const ref = useSwipeUp<HTMLDivElement>({ enabled: locked, onSwipedUp: onUnlock });

  return (
    <div
      ref={ref}
      className={`${styles.lock} ${locked ? '' : styles.unlocked}`}
      aria-hidden={!locked}
    >
      <div className={styles.pattern} />
      <div className={styles.status}>
        <NotificationCount count={PLACEHOLDER_NOTIFICATIONS} />
        <BatteryIndicator />
      </div>
      <div className={styles.center}>
        <LockClock />
      </div>
      <div className={styles.hint}>swipe up to unlock</div>
    </div>
  );
}

import { useRef } from 'react';
import { BatteryIndicator } from './BatteryIndicator';
import { useSetting } from '../system/settingsStore';
import { LockClock } from './LockClock';
import { LockDots } from './LockDots';
import { LockOrbit } from './LockOrbit';
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
  const orbit = useRef<HTMLDivElement>(null);
  const [wallpaper] = useSetting('wallpaper');

  // The wallpaper reacts to the swipe: the rings spread apart, fade, and lag
  // behind the rest of the screen (parallax).
  const reactToSwipe = (progress: number | null) => {
    const el = orbit.current;
    if (!el) return;
    if (progress === null) {
      el.style.transition = '';
      el.style.transform = '';
      el.style.opacity = '';
    } else {
      el.style.transition = 'none';
      el.style.transform = `translate3d(0, ${progress * 90}px, 0) scale(${1 + progress * 1.6})`;
      el.style.opacity = String(1 - progress * 0.85);
    }
  };

  const ref = useSwipeUp<HTMLDivElement>({
    enabled: locked,
    onSwipedUp: onUnlock,
    onProgress: reactToSwipe,
  });

  return (
    <div
      ref={ref}
      className={`${styles.lock} ${locked ? '' : styles.unlocked}`}
      aria-hidden={!locked}
    >
      {wallpaper === 'orbit' && <LockOrbit paused={!locked} spreadRef={orbit} />}
      {wallpaper === 'dots' && <LockDots />}
      <div className={styles.status}>
        <NotificationCount count={PLACEHOLDER_NOTIFICATIONS} />
        <BatteryIndicator />
      </div>
      <div className={styles.clock}>
        <LockClock />
      </div>
      <div className={styles.hint}>swipe up to unlock</div>
    </div>
  );
}

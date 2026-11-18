import { useDrag } from '@use-gesture/react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import { MOTION, SPRING, rubberBand } from '../theme/tokens';
import { BatteryIndicator } from './BatteryIndicator';
import { LivePill } from './LivePill';
import { LockClock } from './LockClock';
import { NotificationCount } from './NotificationCount';
import { useNotifications } from '../system/notifications';
import { useSetting } from '../system/settingsStore';
import { Wallpaper } from './wallpaper/Wallpaper';
import styles from './LockScreen.module.css';

interface LockScreenProps {
  locked: boolean;
  onUnlock: () => void;
}

/**
 * Sits on top of the home screen. Drag it up to unlock: it follows the
 * finger 1:1, and on release a spring carries it open or back. A quick
 * flick is enough, however short.
 */
export function LockScreen({ locked, onUnlock }: LockScreenProps) {
  // Vantage's own notifications (other apps' need the native bridge)
  const notificationCount = useNotifications().length;
  const [clockPosition] = useSetting('lockClockPosition');
  const [lockNotifications] = useSetting('lockNotifications');
  const [lockWallpaper] = useSetting('lockWallpaper');
  const ref = useRef<HTMLDivElement>(null);

  // 0 = covering the screen, 1 = slid away above it. A "motion value":
  // changing it moves the screen without re-rendering React.
  const progress = useMotionValue(locked ? 0 : 1);
  const y = useTransform(progress, (value) => `${-value * 100}%`);
  const target = useRef(locked ? 0 : 1);

  const settle = (open: boolean, velocity: number) => {
    target.current = open ? 1 : 0;
    animate(progress, target.current, { ...SPRING.sheet, velocity });
    if (open) onUnlock();
  };

  // Locked or unlocked from somewhere else (e.g. the "Lock" action in search)
  useEffect(() => {
    const wanted = locked ? 0 : 1;
    if (target.current === wanted) return;
    target.current = wanted;
    animate(progress, wanted, SPRING.sheet);
  }, [locked, progress]);

  const bind = useDrag(
    ({ first, last, movement: [, moved], velocity: [, speed], direction: [, direction], memo }) => {
      const height = ref.current?.offsetHeight ?? 1;
      // Grabbing it mid-animation catches it where it is.
      if (first) {
        progress.stop();
        memo = progress.get();
      }
      // Past either end it moves slower than the finger (rubber band).
      const value = rubberBand((memo as number) - moved / height, 0, 1);
      if (!last) {
        progress.set(value);
        return memo;
      }
      // A flick decides by its direction; a slow release by where it is.
      const flick = speed > MOTION.flickVelocity;
      const open = flick ? direction < 0 : value > 0.5;
      settle(open, ((direction < 0 ? speed : -speed) * 1000) / height);
      return memo;
    },
    { axis: 'y', filterTaps: true, enabled: locked },
  );

  return (
    <motion.div
      ref={ref}
      {...(bind() as object)}
      className={`${styles.lock} ${locked ? '' : styles.unlocked}`}
      style={{ y }}
      aria-hidden={!locked}
    >
      {/* Paused while unlocked: nobody can see it, so it saves battery */}
      <Wallpaper place="lock" config={lockWallpaper ?? undefined} paused={!locked} progress={progress} />
      <div className={styles.status}>
        {lockNotifications === 'count' ? <NotificationCount count={notificationCount} /> : <span />}
        <BatteryIndicator />
      </div>
      <div className={`${styles.clock} ${clockPosition === 'center' ? styles.centered : ''}`}>
        <LockClock />
      </div>
      <div className={styles.live}>
        <LivePill unlockFirst />
      </div>
      <div className={`label ${styles.hint}`}>Swipe up to unlock</div>
    </motion.div>
  );
}

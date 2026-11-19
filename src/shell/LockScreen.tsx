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
import { runAction } from '../system/actions';
import { countSecretTap } from '../system/easterEgg';
import { ChargingOverlay } from './lock/ChargingOverlay';
import { LockNotifications } from './lock/LockNotifications';
import { LockNowPlaying } from './lock/LockNowPlaying';
import { LockShortcuts } from './lock/LockShortcuts';
import { LockWidgets } from './lock/LockWidgets';
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
  // The clock lifts away a little faster than the screen, and fades
  const clockY = useTransform(progress, [0, 1], [0, -80]);
  const clockOpacity = useTransform(progress, [0, 0.6], [1, 0]);
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
      {/* Clock, widgets, music and notifications in one column */}
      <motion.div
        className={`${styles.column} ${clockPosition === 'center' ? styles.centered : ''}`}
        style={{ y: clockY, opacity: clockOpacity }}
      >
        {/* Tap the clock: the next clock style. Seven quick taps: a secret. */}
        <div
          className={styles.clock}
          role="button"
          aria-label="Change clock style"
          onClick={() => {
            void runAction('lock.nextClockStyle', {});
            // The 8th step brings the clock back to the style it had before the 7 taps
            if (countSecretTap()) void runAction('lock.nextClockStyle', {});
          }}
        >
          <LockClock />
        </div>
        <LockWidgets />
        <LockNowPlaying />
        {lockNotifications !== 'hidden' && <LockNotifications />}
      </motion.div>
      <div className={styles.live}>
        <LivePill unlockFirst />
      </div>
      <div className={`label ${styles.hint}`}>Swipe up to unlock</div>
      <LockShortcuts />
      <ChargingOverlay active={locked} />
    </motion.div>
  );
}

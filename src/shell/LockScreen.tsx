import { useDrag } from '@use-gesture/react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useSetting } from '../system/settingsStore';
import { MOTION, SPRING, rubberBand } from '../theme/tokens';
import { BatteryIndicator } from './BatteryIndicator';
import { LockClock } from './LockClock';
import { LockDots } from './LockDots';
import { LockOrbit } from './LockOrbit';
import { NotificationCount } from './NotificationCount';
import styles from './LockScreen.module.css';

/** Placeholder until there is a real notification system. */
const PLACEHOLDER_NOTIFICATIONS = 3;

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
  const ref = useRef<HTMLDivElement>(null);
  const [wallpaper] = useSetting('wallpaper');

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
      {wallpaper === 'orbit' && <LockOrbit paused={!locked} progress={progress} />}
      {wallpaper === 'dots' && <LockDots />}
      <div className={styles.status}>
        <NotificationCount count={PLACEHOLDER_NOTIFICATIONS} />
        <BatteryIndicator />
      </div>
      <div className={styles.clock}>
        <LockClock />
      </div>
      <div className={`label ${styles.hint}`}>Swipe up to unlock</div>
    </motion.div>
  );
}

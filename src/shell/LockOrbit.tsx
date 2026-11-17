import { motion, useTransform, type MotionValue } from 'motion/react';
import type { CSSProperties } from 'react';
import styles from './LockOrbit.module.css';

/**
 * Each ring: its size counted in grid steps (so the rings sit on the same
 * rhythm as the home grid), how long one turn takes, and which way it turns.
 */
const RINGS = [
  { steps: 1, seconds: 36, reverse: false, startAt: 0.1 },
  { steps: 2, seconds: 58, reverse: true, startAt: 0.55 },
  { steps: 3, seconds: 84, reverse: false, startAt: 0.8 },
  { steps: 4, seconds: 120, reverse: true, startAt: 0.3 },
  { steps: 5, seconds: 170, reverse: false, startAt: 0.65 },
];

interface LockOrbitProps {
  /** Stop all movement (when the lock screen is not showing) to save battery */
  paused: boolean;
  /** Home screen: no glowing core (the page's one accent belongs to a widget) */
  quiet?: boolean;
  /** How far the lock screen has been swiped away: 0 to 1 */
  progress: MotionValue<number>;
}

/**
 * The living wallpaper of the lock screen: thin rings with small dots slowly
 * orbiting a glowing core. As you swipe up, the rings spread apart, fade,
 * and lag behind the screen. Only transform and opacity change.
 */
export function LockOrbit({ paused, progress, quiet = false }: LockOrbitProps) {
  const scale = useTransform(progress, [0, 1], [1, 2.6]);
  const opacity = useTransform(progress, [0, 1], [1, 0.15]);
  const y = useTransform(progress, (value) => `${value * 15}vh`);

  return (
    <div className={`${styles.orbit} ${paused ? styles.paused : ''}`} aria-hidden="true">
      <motion.div className={styles.spread} style={{ scale, opacity, y }}>
        {RINGS.map((ring) => (
          <div
            key={ring.steps}
            className={styles.ring}
            style={
              {
                '--steps': ring.steps,
                animationDuration: `${ring.seconds}s`,
                animationDirection: ring.reverse ? 'reverse' : 'normal',
                // A negative delay starts each ring part-way round its circle.
                animationDelay: `${-ring.seconds * ring.startAt}s`,
              } as CSSProperties
            }
          >
            <span className={styles.dot} />
          </div>
        ))}
        <span className={`${styles.core} ${quiet ? styles.quiet : ''}`} />
      </motion.div>
    </div>
  );
}

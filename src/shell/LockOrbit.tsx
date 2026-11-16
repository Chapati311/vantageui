import type { Ref } from 'react';
import styles from './LockOrbit.module.css';

/** Each ring: its size in px, how long one turn takes, and which way it turns. */
const RINGS = [
  { size: 92, seconds: 36, reverse: false, startAt: 0.1 },
  { size: 156, seconds: 58, reverse: true, startAt: 0.55 },
  { size: 224, seconds: 84, reverse: false, startAt: 0.8 },
  { size: 296, seconds: 120, reverse: true, startAt: 0.3 },
  { size: 372, seconds: 170, reverse: false, startAt: 0.65 },
];

interface LockOrbitProps {
  /** Stop all movement (when the lock screen is not showing) to save battery */
  paused: boolean;
  /** The lock screen moves this element while you swipe, so the rings spread apart */
  spreadRef: Ref<HTMLDivElement>;
}

/**
 * The living wallpaper of the lock screen: thin rings with small dots slowly
 * orbiting a glowing core. Only `transform` is animated.
 */
export function LockOrbit({ paused, spreadRef }: LockOrbitProps) {
  return (
    <div className={`${styles.orbit} ${paused ? styles.paused : ''}`} aria-hidden="true">
      <div ref={spreadRef} className={styles.spread}>
        {RINGS.map((ring) => (
          <div
            key={ring.size}
            className={styles.ring}
            style={{
              width: ring.size,
              height: ring.size,
              animationDuration: `${ring.seconds}s`,
              animationDirection: ring.reverse ? 'reverse' : 'normal',
              // A negative delay starts each ring part-way round its circle.
              animationDelay: `${-ring.seconds * ring.startAt}s`,
            }}
          >
            <span className={styles.dot} />
          </div>
        ))}
        <span className={styles.core} />
      </div>
    </div>
  );
}

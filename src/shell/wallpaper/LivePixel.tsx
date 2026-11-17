import type { CSSProperties } from 'react';
import { seededRandom } from './random';
import styles from './LivePixel.module.css';

/** The pixel grid: one square pixel every 8 px. */
const CELL = 8;
const SPRITES = 9;

/** A few lit pixels that hop across the screen in steps, like an old LCD. */
const HOPPERS = (() => {
  const random = seededRandom(3);
  return Array.from({ length: SPRITES }, () => ({
    row: Math.floor(random() * 80),
    col: Math.floor(random() * 46),
    seconds: 6 + Math.floor(random() * 10),
    delay: -random() * 10,
    hops: 4 + Math.floor(random() * 6),
  }));
})();

/**
 * Pixel LCD: a whole screen of square "ghost" pixels (unlit pixels faintly
 * visible, like a real LCD) with a few lit pixels hopping in steps.
 */
export function LivePixel() {
  return (
    <div className={styles.lcd} aria-hidden="true">
      {HOPPERS.map((hopper, index) => (
        <span
          key={index}
          className={styles.pixel}
          style={
            {
              left: hopper.col * CELL,
              top: hopper.row * CELL,
              '--distance': `${hopper.hops * CELL}px`,
              animationDuration: `${hopper.seconds}s`,
              animationDelay: `${hopper.delay}s`,
              animationTimingFunction: `steps(${hopper.hops}, end)`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

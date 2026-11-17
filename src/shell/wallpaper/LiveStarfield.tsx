import type { CSSProperties } from 'react';
import { seededRandom } from './random';
import styles from './LiveStarfield.module.css';

const COUNT = 70;

/** Made once: where each star is, how big, and how it twinkles. */
const STARS = (() => {
  const random = seededRandom(11);
  return Array.from({ length: COUNT }, (_, index) => {
    const seconds = 2.5 + random() * 4;
    return {
      x: random() * 100,
      y: random() * 100,
      size: random() < 0.85 ? 1.5 : 2.5,
      seconds,
      delay: -random() * seconds,
      peak: 0.35 + random() * 0.6,
      // A few stars glow in the accent color
      accent: index % 14 === 0,
    };
  });
})();

/**
 * Stars that twinkle, on two layers that drift slowly at different speeds
 * (a little depth). Only opacity and transform change.
 */
export function LiveStarfield() {
  const near = STARS.filter((_, index) => index % 3 === 0);
  const far = STARS.filter((_, index) => index % 3 !== 0);
  const draw = (stars: typeof STARS) =>
    stars.map((star, index) => (
      <span
        key={index}
        className={`${styles.star} ${star.accent ? styles.accent : ''}`}
        style={
          {
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            '--peak': star.peak,
            animationDuration: `${star.seconds}s`,
            animationDelay: `${star.delay}s`,
          } as CSSProperties
        }
      />
    ));

  return (
    <div className={styles.field} aria-hidden="true">
      <div className={`${styles.layer} ${styles.far}`}>{draw(far)}</div>
      <div className={`${styles.layer} ${styles.near}`}>{draw(near)}</div>
    </div>
  );
}

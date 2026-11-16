import styles from './DotLogo.module.css';

/** The Vantage "V" on a 7x7 dot grid. 1 = lit dot. (Same as the app icon.) */
const PATTERN = [
  '1000001',
  '1000001',
  '0100010',
  '0100010',
  '0010100',
  '0010100',
  '0001000',
];
const GRID = PATTERN.length;

/** Milliseconds between one lit dot appearing and the next. */
const STAGGER_MS = 45;

interface DotLogoProps {
  /** Light the dots up one by one instead of showing them all at once */
  animated?: boolean;
  /** White instead of the accent (for pages that already have an accent element) */
  mono?: boolean;
}

/** The logo: a bold "V" drawn in dots, in the accent colors. */
export function DotLogo({ animated = false, mono = false }: DotLogoProps) {
  let litCount = 0;

  return (
    <svg className={styles.logo} viewBox={`0 0 ${GRID} ${GRID}`} role="img" aria-label="Vantage logo">
      <defs>
        <linearGradient id="vantage-logo-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={GRID} y2={GRID}>
          <stop offset="0" className={styles.gradientFrom} />
          <stop offset="1" className={styles.gradientTo} />
        </linearGradient>
      </defs>
      {PATTERN.flatMap((row, y) =>
        [...row].map((cell, x) => {
          const lit = cell === '1';
          const delay = lit ? litCount++ * STAGGER_MS : 0;
          return (
            <circle
              key={`${x}-${y}`}
              cx={x + 0.5}
              cy={y + 0.5}
              r={0.36}
              className={lit ? `${mono ? styles.litMono : styles.lit} ${animated ? styles.appear : ''}` : styles.unlit}
              style={lit && animated ? { animationDelay: `${delay}ms` } : undefined}
            />
          );
        }),
      )}
    </svg>
  );
}

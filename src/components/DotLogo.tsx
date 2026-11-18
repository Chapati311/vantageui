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
  /** Scatter the dots outward and fade (the boot screen dissolving) */
  dissolve?: boolean;
}

/** A repeatable "random" number per dot, so the scatter looks the same every time. */
const jitter = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value) - 0.5;
};

/** The logo: a bold "V" drawn in dots, in the accent colors. */
export function DotLogo({ animated = false, mono = false, dissolve = false }: DotLogoProps) {
  let litCount = 0;

  return (
    <svg className={`${styles.logo} ${dissolve ? styles.dissolve : ''}`} viewBox={`0 0 ${GRID} ${GRID}`} role="img" aria-label="Vantage logo">
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
              style={
                lit
                  ? ({
                      animationDelay: animated ? `${delay}ms` : undefined,
                      // Where it flies in from, and where it scatters to
                      '--dx': `${jitter(x * 7 + y) * 14}px`,
                      '--dy': `${jitter(x + y * 7 + 3) * 14}px`,
                      '--ox': `${(x - 3) * 3 + jitter(x * 3 + y) * 4}px`,
                      '--oy': `${(y - 3) * 3 + jitter(y * 5 + x) * 4}px`,
                    } as React.CSSProperties)
                  : undefined
              }
            />
          );
        }),
      )}
    </svg>
  );
}

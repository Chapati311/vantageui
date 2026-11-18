import styles from './SetupArt.module.css';

/**
 * Small looping pictures for the Lock In setup steps, drawn in dots and
 * thin lines (CSS animations only: cheap on the A13, and they turn into
 * simple fades with Reduce motion).
 */
export function SetupArt({ step }: { step: number }) {
  if (step === 0) {
    // A ring with a dot orbiting it: focus
    return (
      <svg className={styles.art} viewBox="0 0 120 120" aria-hidden="true">
        <circle className={styles.line} cx="60" cy="60" r="40" />
        <circle className={styles.line} cx="60" cy="60" r="24" />
        <g className={styles.orbit}>
          <circle className={styles.dot} cx="60" cy="20" r="5" />
        </g>
        <circle className={styles.accent} cx="60" cy="60" r="7" />
      </svg>
    );
  }
  if (step === 1) {
    // A globe of dots, slowly turning: where you are
    return (
      <svg className={styles.art} viewBox="0 0 120 120" aria-hidden="true">
        <circle className={styles.line} cx="60" cy="60" r="44" />
        <g className={styles.spinSlow}>
          {Array.from({ length: 7 }, (_, row) =>
            Array.from({ length: 9 }, (_, col) => {
              const lat = ((row - 3) / 3.4) * (Math.PI / 2);
              const lon = ((col - 4) / 4.4) * (Math.PI / 2);
              return <circle key={`${row}-${col}`} className={styles.dotFaint} cx={60 + 42 * Math.cos(lat) * Math.sin(lon)} cy={60 - 42 * Math.sin(lat)} r="1.8" />;
            }),
          )}
        </g>
        <circle className={styles.accent} cx="66" cy="44" r="4" />
      </svg>
    );
  }
  if (step === 2) {
    // App squares; some grey out with a lock: distractions
    return (
      <svg className={styles.art} viewBox="0 0 120 120" aria-hidden="true">
        {[0, 1, 2].flatMap((row) =>
          [0, 1, 2].map((col) => {
            const locked = (row + col) % 2 === 0;
            return (
              <rect
                key={`${row}-${col}`}
                className={locked ? styles.lockedApp : styles.app}
                style={{ animationDelay: `${(row * 3 + col) * 0.15}s` }}
                x={22 + col * 28}
                y={22 + row * 28}
                width="20"
                height="20"
                rx="10"
              />
            );
          }),
        )}
        <path className={styles.lock} d="M54 54h12v10H54zM56 54v-4a4 4 0 0 1 8 0v4" />
      </svg>
    );
  }
  // A ring filling up: your daily goal
  return (
    <svg className={styles.art} viewBox="0 0 120 120" aria-hidden="true">
      <circle className={styles.line} cx="60" cy="60" r="42" />
      <circle className={styles.fill} cx="60" cy="60" r="42" transform="rotate(-90 60 60)" />
      {Array.from({ length: 5 }, (_, index) => (
        <circle key={index} className={styles.dot} style={{ animationDelay: `${index * 0.2}s` }} cx={44 + index * 8} cy="60" r="2.5" />
      ))}
    </svg>
  );
}

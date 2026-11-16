import styles from './WeatherArt.module.css';

/**
 * A small wireframe drawing for the weather: thin outlined shapes and a row
 * of dots instead of a colorful icon. Only "cloudy" exists so far.
 */
export function WeatherArt() {
  return (
    <svg className={styles.art} viewBox="0 0 64 48" aria-hidden="true">
      {/* Cloud: three overlapping outlines */}
      <circle cx="22" cy="24" r="11" />
      <circle cx="36" cy="18" r="13" />
      <circle cx="47" cy="26" r="9" />
      {/* Ground line */}
      <path d="M6 37h52" />
      {/* Dot row */}
      {Array.from({ length: 8 }, (_, index) => (
        <circle key={index} className={styles.dot} cx={11 + index * 6} cy="43" r="0.9" />
      ))}
    </svg>
  );
}

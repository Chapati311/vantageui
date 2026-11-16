import type { WeatherKind } from '../../system/weather';
import styles from './WeatherArt.module.css';

/** A row of small dots, used as "ground" or as snow. */
function Dots({ y, count = 8, from = 11 }: { y: number; count?: number; from?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <circle key={index} className={styles.dot} cx={from + index * 6} cy={y} r="0.9" />
      ))}
    </>
  );
}

/** Three overlapping outlines. `y` moves the whole cloud up or down. */
function Cloud({ y = 0 }: { y?: number }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <circle cx="22" cy="24" r="11" />
      <circle cx="36" cy="18" r="13" />
      <circle cx="47" cy="26" r="9" />
    </g>
  );
}

/**
 * A small wireframe drawing for the weather: thin outlined shapes and dots
 * instead of a colorful icon. One drawing per kind of weather.
 */
export function WeatherArt({ kind }: { kind: WeatherKind }) {
  return (
    <svg className={styles.art} viewBox="0 0 64 48" aria-hidden="true">
      {kind === 'clear' && (
        <>
          <circle cx="32" cy="22" r="10" />
          <circle cx="32" cy="22" r="16" strokeDasharray="1.500 5" />
          <path d="M6 43h52" />
        </>
      )}
      {kind === 'cloudy' && (
        <>
          <Cloud />
          <path d="M6 37h52" />
          <Dots y={43} />
        </>
      )}
      {kind === 'fog' && (
        <>
          <path d="M10 12h44M16 20h38M8 28h40M14 36h42" />
          <Dots y={43} />
        </>
      )}
      {kind === 'rain' && (
        <>
          <Cloud y={-4} />
          <path d="M20 38l-3 8M30 38l-3 8M40 38l-3 8M50 38l-3 8" />
        </>
      )}
      {kind === 'snow' && (
        <>
          <Cloud y={-4} />
          <Dots y={37} count={6} from={17} />
          <Dots y={42} count={6} from={14} />
          <Dots y={47} count={6} from={17} />
        </>
      )}
      {kind === 'storm' && (
        <>
          <Cloud y={-4} />
          <path d="M35 32l-7 8h8l-5 7" />
        </>
      )}
    </svg>
  );
}

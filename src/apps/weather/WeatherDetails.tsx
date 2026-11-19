import { sunTimes } from '../../system/sun';
import { formatTime } from '../../system/timeFormat';
import { useClock } from '../../system/useClock';
import { WEATHER_PLACE, type WeatherHour } from '../../system/weather';
import styles from './WeatherDetails.module.css';

const GRAPH_ROWS = 9;

/**
 * Temperature over the next 24 hours as a dot graph: one column per hour,
 * the lit dot at that hour's temperature (between the day's low and high).
 */
export function TemperatureGraph({ hours }: { hours: WeatherHour[] }) {
  const temps = hours.map((hour) => hour.temperature);
  const low = Math.min(...temps);
  const high = Math.max(...temps);
  const rowOf = (t: number) => (high === low ? Math.floor(GRAPH_ROWS / 2) : Math.round(((t - low) / (high - low)) * (GRAPH_ROWS - 1)));

  return (
    <div className={styles.block}>
      <div className={styles.graphHead}>
        <span className="label">Temperature</span>
        <span className="label">
          {low}° to {high}°
        </span>
      </div>
      <div
        className={styles.graph}
        style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}
        role="img"
        aria-label={`From ${low} to ${high} degrees in the next 24 hours`}
      >
        {Array.from({ length: GRAPH_ROWS }, (_, rowFromTop) => {
          const row = GRAPH_ROWS - 1 - rowFromTop;
          return hours.map((hour, column) => {
            const at = rowOf(hour.temperature);
            const state = at === row ? styles.on : at > row ? styles.under : '';
            return <span key={`${row}-${column}`} className={`${styles.dot} ${state} ${column === 0 && at === row ? styles.now : ''}`} />;
          });
        })}
      </div>
      <div className={styles.axis} style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
        {hours.map((hour, index) => (
          <span key={index} className="label">
            {index % 6 === 0 ? (index === 0 ? 'Now' : String(hour.hour).padStart(2, '0')) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

const RAIN_ROWS = 5;

/** Chance of rain per hour as columns of dots (5 dots = 100%). */
export function RainDots({ hours }: { hours: WeatherHour[] }) {
  const max = Math.max(...hours.map((hour) => hour.rainChance));
  return (
    <div className={styles.block}>
      <div className={styles.graphHead}>
        <span className="label">Rain chance</span>
        <span className="label">{max === 0 ? 'Dry all day' : `Up to ${max}%`}</span>
      </div>
      <div
        className={styles.rain}
        style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}
        role="img"
        aria-label={`Rain chance up to ${max} percent`}
      >
        {Array.from({ length: RAIN_ROWS }, (_, rowFromTop) => {
          const row = RAIN_ROWS - 1 - rowFromTop;
          return hours.map((hour, column) => (
            <span
              key={`${row}-${column}`}
              className={`${styles.dot} ${Math.round((hour.rainChance / 100) * RAIN_ROWS) > row ? styles.on : ''}`}
            />
          ));
        })}
      </div>
    </div>
  );
}

/** Sunrise to sunset as a thin arc, with the sun as a dot where it is now. */
export function SunArc() {
  const now = useClock();
  const { sunrise, sunset } = sunTimes(now, WEATHER_PLACE.latitude, WEATHER_PLACE.longitude);
  const progress = Math.min(1, Math.max(0, (now.getTime() - sunrise.getTime()) / (sunset.getTime() - sunrise.getTime())));
  const up = now > sunrise && now < sunset;
  const angle = Math.PI * (1 - progress);
  const x = 50 + Math.cos(angle) * 40;
  const y = 46 - Math.sin(angle) * 36;
  const daylight = Math.round((sunset.getTime() - sunrise.getTime()) / 60_000);

  return (
    <div className={styles.card}>
      <span className="label">Sun</span>
      <svg className={styles.arc} viewBox="0 0 100 52" aria-hidden="true">
        <path className={styles.arcTrack} d="M10 46 A40 36 0 0 1 90 46" />
        <path className={styles.horizon} d="M2 46h96" />
        {up && <circle className={styles.sun} cx={x} cy={y} r="4" />}
      </svg>
      <div className={styles.sunTimes}>
        <span>{formatTime(sunrise)}</span>
        <span>{formatTime(sunset)}</span>
      </div>
      <span className={styles.detail}>
        {Math.floor(daylight / 60)} h {daylight % 60} min of daylight
      </span>
    </div>
  );
}

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** A thin compass ring with an arrow showing where the wind blows to. */
export function WindCompass({ speed, direction }: { speed: number; direction?: number }) {
  const from = direction === undefined ? null : DIRECTIONS[Math.round(direction / 45) % 8];
  return (
    <div className={styles.card}>
      <span className="label">Wind</span>
      <div className={styles.compass}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className={styles.ring} cx="50" cy="50" r="44" />
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i * 10 * Math.PI) / 180;
            const long = i % 9 === 0;
            return (
              <line
                key={i}
                className={styles.tick}
                x1={50 + Math.sin(a) * 44}
                y1={50 - Math.cos(a) * 44}
                x2={50 + Math.sin(a) * (long ? 36 : 40)}
                y2={50 - Math.cos(a) * (long ? 36 : 40)}
              />
            );
          })}
          <text className={styles.north} x="50" y="31" textAnchor="middle">
            N
          </text>
          {direction !== undefined && (
            // The wind comes FROM `direction`, so the arrow points the other way
            <g transform={`rotate(${direction + 180} 50 50)`}>
              <path className={styles.arrow} d="M50 8 L55 19 L50 16 L45 19 Z" />
            </g>
          )}
        </svg>
        <div className={styles.speed}>
          <span className={styles.speedValue}>{speed}</span>
          <span className="label">km/h</span>
        </div>
      </div>
      <span className={styles.detail}>{from ? `From the ${from}` : 'Direction after the next update'}</span>
    </div>
  );
}

import { WeatherArt } from '../../shell/widgets/WeatherArt';
import type { WeatherDay } from '../../system/weather';
import styles from './DailyList.module.css';

const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });

/** 7 days. The thin bar shows each day's low-to-high within the week's range. */
export function DailyList({ days }: { days: WeatherDay[] }) {
  const weekLow = Math.min(...days.map((day) => day.low));
  const weekHigh = Math.max(...days.map((day) => day.high));
  const span = Math.max(1, weekHigh - weekLow);

  return (
    <div>
      {days.map((day, index) => (
        <div key={day.date} className={styles.day}>
          <span className={styles.name}>{index === 0 ? 'Today' : weekday.format(new Date(`${day.date}T00:00:00Z`))}</span>
          <div className={styles.art}>
            <WeatherArt kind={day.kind} />
          </div>
          <span className={`label ${styles.rain}`}>{day.rainChance}%</span>
          <span className={styles.low}>{day.low}°</span>
          <div className={styles.track}>
            <div
              className={styles.range}
              style={{
                left: `${((day.low - weekLow) / span) * 100}%`,
                width: `${Math.max(6, ((day.high - day.low) / span) * 100)}%`,
              }}
            />
          </div>
          <span className={styles.high}>{day.high}°</span>
        </div>
      ))}
    </div>
  );
}

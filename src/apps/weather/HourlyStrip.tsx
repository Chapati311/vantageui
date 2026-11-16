import { ScrollArea } from '../../components/ScrollArea';
import { WeatherArt } from '../../shell/widgets/WeatherArt';
import type { WeatherHour } from '../../system/weather';
import styles from './HourlyStrip.module.css';

/** The next 24 hours in a row you can drag sideways. */
export function HourlyStrip({ hours }: { hours: WeatherHour[] }) {
  return (
    <ScrollArea horizontal className={styles.strip}>
      {hours.map((hour, index) => (
        <div key={index} className={styles.hour}>
          <span className={styles.time}>{index === 0 ? 'Now' : String(hour.hour).padStart(2, '0')}</span>
          <div className={styles.art}>
            <WeatherArt kind={hour.kind} />
          </div>
          <span className={styles.temperature}>{hour.temperature}°</span>
          <span className={styles.rain}>{hour.rainChance}%</span>
        </div>
      ))}
    </ScrollArea>
  );
}

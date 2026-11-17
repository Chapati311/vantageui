import { Widget } from '../../../components/Widget';
import { cityTime } from '../../../apps/clock/worldTime';
import { useClock } from '../../../system/useClock';
import type { WidgetProps } from '../types';
import styles from './TimeWidgets.module.css';

const CITIES = [
  { name: 'London', timeZone: 'Europe/London' },
  { name: 'New York', timeZone: 'America/New_York' },
  { name: 'Tokyo', timeZone: 'Asia/Tokyo' },
  { name: 'Sydney', timeZone: 'Australia/Sydney' },
];

/** The time in a few cities: a list at 2x2, a row at 4x1. */
export function WorldClocksWidget({ size }: WidgetProps) {
  const now = useClock();
  const wide = size === '4x1';
  const cities = wide ? CITIES : CITIES.slice(0, 3);
  return (
    <Widget shape={wide ? 'circle' : 'rounded'}>
      <div className={`${styles.world} ${wide ? styles.worldWide : ''}`}>
        {cities.map((city) => (
          <div key={city.name} className={styles.city}>
            <span className={styles.cityName}>{city.name}</span>
            <span className={styles.cityTime}>{cityTime(now, city.timeZone).time}</span>
          </div>
        ))}
      </div>
    </Widget>
  );
}

import { ScrollArea } from '../../components/ScrollArea';
import { useClock } from '../../system/useClock';
import { WORLD_CITIES, cityTime } from './worldTime';
import styles from './WorldTab.module.css';

/** The current time in a few cities. Updates once per minute. */
export function WorldTab() {
  const now = useClock();

  return (
    <ScrollArea className={styles.world}>
      {WORLD_CITIES.map((city) => {
        const { time, note } = cityTime(now, city.timeZone);
        return (
          <div key={city.timeZone} className={styles.city}>
            <div className={styles.text}>
              <span className={styles.name}>{city.name}</span>
              <span className={styles.note}>{note}</span>
            </div>
            <time className={styles.time}>{time}</time>
          </div>
        );
      })}
    </ScrollArea>
  );
}

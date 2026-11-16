import { CircleButton } from '../../components/CircleButton';
import { ScrollArea } from '../../components/ScrollArea';
import { ResetIcon } from '../../components/glyphs';
import { WeatherArt } from '../../shell/widgets/WeatherArt';
import { formatTime } from '../../system/timeFormat';
import { WEATHER_PLACE, refreshWeather, useWeather } from '../../system/weather';
import { DailyList } from './DailyList';
import { HourlyStrip } from './HourlyStrip';
import styles from './WeatherApp.module.css';

/** Now, the next 24 hours, and 7 days for one place. */
export function WeatherApp() {
  const { data, status } = useWeather();

  // Nothing saved and nothing downloaded yet
  if (!data) {
    return (
      <div className={styles.empty}>
        <h1 className={styles.place}>{status === 'error' ? 'No connection' : 'One moment'}</h1>
        <p className={styles.label}>
          {status === 'error' ? 'The weather could not be loaded' : 'Loading the weather'}
        </p>
        {status === 'error' && (
          <CircleButton label="Try again" onClick={() => refreshWeather(true)}>
            <ResetIcon />
          </CircleButton>
        )}
      </div>
    );
  }

  const { now } = data;
  const updated =
    status === 'loading'
      ? 'Updating'
      : `${status === 'error' ? 'Offline · saved' : 'Updated'} ${formatTime(new Date(data.fetchedAt))}`;

  return (
    <ScrollArea className={styles.app}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.place}>{WEATHER_PLACE.name}</h1>
          <p className={styles.label}>{updated}</p>
        </div>
        <CircleButton small label="Refresh" onClick={() => refreshWeather(true)}>
          <ResetIcon />
        </CircleButton>
      </header>

      <section className={styles.now}>
        <div>
          <div className={styles.temperature}>{now.temperature}°</div>
          <p className={styles.condition}>{now.condition}</p>
        </div>
        <div className={styles.art}>
          <WeatherArt kind={now.kind} />
        </div>
      </section>

      <section className={styles.stats}>
        <Stat label="Feels like" value={`${now.feelsLike}°`} />
        <Stat label="Wind" value={String(now.wind)} unit="km/h" />
        <Stat label="Humidity" value={String(now.humidity)} unit="%" />
      </section>

      <h2 className={styles.heading}>Next 24 hours</h2>
      <HourlyStrip hours={data.hourly} />

      <h2 className={styles.heading}>7 days</h2>
      <DailyList days={data.daily} />
    </ScrollArea>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.label}>{label}</span>
      <span className={styles.statValue}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
    </div>
  );
}

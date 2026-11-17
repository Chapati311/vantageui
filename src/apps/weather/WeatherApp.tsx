import { CircleButton } from '../../components/CircleButton';
import { DotNumber } from '../../components/DotNumber';
import { ScrollArea } from '../../components/ScrollArea';
import { Temperature } from '../../components/Temperature';
import { ResetIcon } from '../../components/glyphs';
import { WeatherArt } from '../../shell/widgets/WeatherArt';
import { formatTime } from '../../system/timeFormat';
import { WEATHER_PLACE, useWeather } from '../../system/weather';
import { DailyList } from './DailyList';
import { HourlyStrip } from './HourlyStrip';
import styles from './WeatherApp.module.css';
import { runAction } from '../../system/actions';

/** Now, the next 24 hours, and 7 days for one place. */
export function WeatherApp() {
  const { data, status } = useWeather();

  // Nothing saved and nothing downloaded yet
  if (!data) {
    return (
      <div className={styles.empty}>
        <h1 className={styles.place}>{status === 'error' ? 'No connection' : 'One moment'}</h1>
        <p className="label">
          {status === 'error' ? 'The weather could not be loaded' : 'Loading the weather'}
        </p>
        {status === 'error' && (
          <CircleButton small label="Try again" onClick={() => void runAction('weather.refresh', {})}>
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
        <div className={styles.heading}>
          <h1 className={styles.place}>{WEATHER_PLACE.name}</h1>
          <p className="label">{updated}</p>
        </div>
        <CircleButton small label="Refresh" onClick={() => void runAction('weather.refresh', {})}>
          <ResetIcon />
        </CircleButton>
      </header>

      {/* The hero: a huge temperature with the drawing beside it */}
      <section className={styles.now}>
        <div className={styles.heading}>
          <Temperature value={now.temperature} size={96} />
          <p className={styles.condition}>{now.condition}</p>
        </div>
        <div className={styles.art}>
          <WeatherArt kind={now.kind} />
        </div>
      </section>

      <section className={styles.stats}>
        <Stat label="Feels like">
          <Temperature value={now.feelsLike} size={28} />
        </Stat>
        <Stat label="Wind km/h">
          <DotNumber value={String(now.wind)} size={28} />
        </Stat>
        <Stat label="Humidity %">
          <DotNumber value={String(now.humidity)} size={28} />
        </Stat>
      </section>

      <h2 className={`label ${styles.section}`}>Next 24 hours</h2>
      <HourlyStrip hours={data.hourly} />

      <h2 className={`label ${styles.section}`}>7 days</h2>
      <DailyList days={data.daily} />
    </ScrollArea>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.stat}>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

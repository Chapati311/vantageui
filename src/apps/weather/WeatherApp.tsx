import { CircleButton } from '../../components/CircleButton';
import { DotNumber } from '../../components/DotNumber';
import { AppShell, EmptyState } from '../../components/kit';
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
      <AppShell title="Weather" fixed>
        {status === 'error' ? (
          <EmptyState kind="error" title="No connection" message="The weather couldn't be loaded." action={{ label: 'Try again', onPress: () => void runAction('weather.refresh', {}) }} />
        ) : (
          <EmptyState kind="loading" title="One moment" message={`Getting the weather for ${WEATHER_PLACE.name}.`} />
        )}
      </AppShell>
    );
  }

  const { now } = data;
  const updated =
    status === 'loading'
      ? 'Updating'
      : `${status === 'error' ? 'Offline · saved' : 'Updated'} ${formatTime(new Date(data.fetchedAt))}`;

  return (
    <AppShell
      title={WEATHER_PLACE.name}
      trailing={
        <CircleButton small label="Refresh" onClick={() => void runAction('weather.refresh', {})}>
          <ResetIcon />
        </CircleButton>
      }
    >
      <p className="label">{updated}</p>

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
    </AppShell>
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

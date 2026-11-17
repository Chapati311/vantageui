import { Temperature } from '../../components/Temperature';
import { Widget } from '../../components/Widget';
import { WEATHER_PLACE, useWeather } from '../../system/weather';
import { WeatherArt } from './WeatherArt';
import type { WidgetProps } from './types';
import styles from './WeatherWidget.module.css';

/** Real weather, from the same shared data as the Weather app. */
export function WeatherWidget({ size }: WidgetProps) {
  const { data, status } = useWeather();
  // Nothing downloaded yet: say honestly whether it is still loading or failed
  const missing = status === 'error' ? 'No connection' : 'Loading';
  const today = data?.daily[0];
  const value = data ? data.now.temperature : null;

  const details = (
    <div className={styles.details}>
      <span className={styles.condition}>{data ? data.now.condition : missing}</span>
      {today && (
        <span className="label">
          {today.high}° / {today.low}°
        </span>
      )}
    </div>
  );

  // 1x1: just the number
  if (size === '1x1') {
    return (
      <Widget shape="rounded">
        <Temperature value={value} size={28} />
      </Widget>
    );
  }

  // 2x1: number on the left, condition and high/low on the right
  if (size === '2x1') {
    return (
      <Widget shape="rounded">
        <div className={styles.row}>
          <Temperature value={value} size={28} />
          {details}
        </div>
      </Widget>
    );
  }

  // 2x2: everything, plus the drawing
  return (
    <Widget shape="rounded">
      <div className={styles.tall}>
        <div className={styles.top}>
          <span className="label">{WEATHER_PLACE.name}</span>
          <div className={styles.art}>{data && <WeatherArt kind={data.now.kind} />}</div>
        </div>
        <Temperature value={value} size={40} />
        {details}
      </div>
    </Widget>
  );
}

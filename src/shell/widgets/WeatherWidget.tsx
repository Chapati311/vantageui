import { Widget } from '../../components/Widget';
import { WEATHER_PLACE, useWeather } from '../../system/weather';
import { WeatherArt } from './WeatherArt';
import type { WidgetProps } from './types';
import styles from './WeatherWidget.module.css';

/** Real weather, from the same shared data as the Weather app. */
export function WeatherWidget({ size }: WidgetProps) {
  const { data } = useWeather();
  const today = data?.daily[0];

  const temperature = (
    <div className={styles.temperature}>{data ? `${data.now.temperature}°` : '--'}</div>
  );
  const art = <div className={styles.art}>{data && <WeatherArt kind={data.now.kind} />}</div>;

  // 1x1: just the number
  if (size === '1x1') return <Widget shape="rounded">{temperature}</Widget>;

  // 2x1: place and number on the left, drawing on the right
  if (size === '2x1') {
    return (
      <Widget shape="rounded">
        <div className={styles.row}>
          <div className={styles.column}>
            <span className={styles.label}>{WEATHER_PLACE.name}</span>
            {temperature}
          </div>
          {art}
        </div>
      </Widget>
    );
  }

  // 2x2: everything
  return (
    <Widget shape="rounded">
      <div className={styles.tall}>
        <div className={styles.top}>
          <span className={styles.label}>{WEATHER_PLACE.name}</span>
          {art}
        </div>
        {temperature}
        <span className={styles.label}>
          {data && today ? `${data.now.condition} · ${today.high}° / ${today.low}°` : 'No data yet'}
        </span>
      </div>
    </Widget>
  );
}

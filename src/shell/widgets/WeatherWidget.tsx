import { Widget } from '../../components/Widget';
import { WeatherArt } from './WeatherArt';
import type { WidgetProps } from './types';
import styles from './WeatherWidget.module.css';

/** FAKE data for now. Later this comes from the Open-Meteo API. */
const FAKE_WEATHER = {
  place: 'Zurich',
  temperature: 12,
  condition: 'Cloudy',
  high: 14,
  low: 7,
};

export function WeatherWidget({ size }: WidgetProps) {
  const weather = FAKE_WEATHER;
  const temperature = <div className={styles.temperature}>{weather.temperature}°</div>;

  // 1x1: just the number
  if (size === '1x1') return <Widget shape="rounded">{temperature}</Widget>;

  // 2x1: place and number on the left, drawing on the right
  if (size === '2x1') {
    return (
      <Widget shape="rounded">
        <div className={styles.row}>
          <div className={styles.column}>
            <span className={styles.label}>{weather.place}</span>
            {temperature}
          </div>
          <div className={styles.art}>
            <WeatherArt />
          </div>
        </div>
      </Widget>
    );
  }

  // 2x2: everything
  return (
    <Widget shape="rounded">
      <div className={styles.tall}>
        <div className={styles.top}>
          <span className={styles.label}>{weather.place}</span>
          <div className={styles.art}>
            <WeatherArt />
          </div>
        </div>
        {temperature}
        <span className={styles.label}>
          {weather.condition} · {weather.high}° / {weather.low}°
        </span>
      </div>
    </Widget>
  );
}

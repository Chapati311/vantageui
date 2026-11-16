import { Widget } from '../../components/Widget';
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

  if (size === '1x1') return <Widget shape="rounded">{temperature}</Widget>;

  return (
    <Widget shape="rounded">
      <div className={size === '2x2' ? styles.tall : styles.row}>
        {temperature}
        <div className={styles.details}>
          <span className={styles.place}>{weather.place}</span>
          <span>{weather.condition}</span>
          {size === '2x2' && (
            <span className={styles.place}>
              {weather.high}° / {weather.low}°
            </span>
          )}
        </div>
      </div>
    </Widget>
  );
}

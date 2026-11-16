import { Widget } from '../../components/Widget';
import styles from './WeatherWidget.module.css';

/** FAKE data for now. Later this comes from the Open-Meteo API. */
const FAKE_WEATHER = {
  place: 'Zurich',
  temperature: 12,
  condition: 'Cloudy',
  high: 14,
  low: 7,
};

export function WeatherWidget() {
  const weather = FAKE_WEATHER;

  return (
    <Widget size="small" label={weather.place}>
      <div className={styles.temperature}>{weather.temperature}°</div>
      <div className={styles.details}>
        <span>{weather.condition}</span>
        <span className={styles.range}>
          {weather.high}° / {weather.low}°
        </span>
      </div>
    </Widget>
  );
}

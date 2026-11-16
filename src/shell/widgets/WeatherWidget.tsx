import { Temperature } from '../../components/Temperature';
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
    <div className={styles.temperature}>
      <Temperature value={data ? data.now.temperature : null} />
    </div>
  );
  const condition = <span className={styles.condition}>{data ? data.now.condition : 'No data'}</span>;
  const highLow = today && (
    <span className={styles.label}>
      H {today.high}° · L {today.low}°
    </span>
  );

  // 1x1: just the number
  if (size === '1x1') return <Widget shape="rounded">{temperature}</Widget>;

  // 2x1: number on the left, condition and high/low on the right
  if (size === '2x1') {
    return (
      <Widget shape="rounded">
        <div className={styles.row}>
          {temperature}
          <div className={styles.column}>
            {condition}
            {highLow}
          </div>
        </div>
      </Widget>
    );
  }

  // 2x2: everything, plus the drawing
  return (
    <Widget shape="rounded">
      <div className={styles.tall}>
        <div className={styles.top}>
          <span className={styles.label}>{WEATHER_PLACE.name}</span>
          <div className={styles.art}>{data && <WeatherArt kind={data.now.kind} />}</div>
        </div>
        {temperature}
        <div className={styles.column}>
          {condition}
          {highLow}
        </div>
      </div>
    </Widget>
  );
}

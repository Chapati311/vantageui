import { Widget } from '../../../components/Widget';
import { sunTimes } from '../../../system/sun';
import { formatTime } from '../../../system/timeFormat';
import { useClock } from '../../../system/useClock';
import { WEATHER_PLACE } from '../../../system/weather';
import styles from './TimeWidgets.module.css';

const RADIUS = 45;

/** Where on the arc the sun is: 0 at sunrise, 1 at sunset. */
function pointAt(fraction: number) {
  const angle = Math.PI * fraction;
  return { x: 50 - RADIUS * Math.cos(angle), y: 48 - RADIUS * Math.sin(angle) };
}

/** The sun's path today: a dotted arc from sunrise to sunset, with the sun on it. */
export function SunArcWidget() {
  const now = useClock();
  const { sunrise, sunset } = sunTimes(now, WEATHER_PLACE.latitude, WEATHER_PLACE.longitude);
  const raw = (now.getTime() - sunrise.getTime()) / (sunset.getTime() - sunrise.getTime());
  const up = raw >= 0 && raw <= 1;
  const fraction = Math.min(1, Math.max(0, raw));
  const sun = pointAt(fraction);
  const start = pointAt(0);

  return (
    <Widget shape="rounded">
      <div className={styles.sun}>
        <span className="label">{up ? 'Daylight' : raw < 0 ? 'Before sunrise' : 'After sunset'}</span>
        <svg className={styles.sunArc} viewBox="0 0 100 52" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <line className={styles.horizon} x1="0" y1="48" x2="100" y2="48" />
          <path className={styles.sunTrack} d={`M${start.x} 48 A${RADIUS} ${RADIUS} 0 0 1 95 48`} />
          {up && <path className={styles.sunDone} d={`M${start.x} 48 A${RADIUS} ${RADIUS} 0 0 1 ${sun.x} ${sun.y}`} />}
          <circle className={styles.sunDot} cx={sun.x} cy={up ? sun.y : 48} r={up ? 3.5 : 2.5} opacity={up ? 1 : 0.4} />
        </svg>
        <div className={styles.sunTimes}>
          <span>↑ {formatTime(sunrise)}</span>
          <span>{formatTime(sunset)} ↓</span>
        </div>
      </div>
    </Widget>
  );
}

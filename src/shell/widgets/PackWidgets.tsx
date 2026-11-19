import { Widget } from '../../components/Widget';
import { useClock } from '../../system/useClock';
import { useWeather } from '../../system/weather';
import { HandsClock } from '../lockClocks/PackClocks';
import type { WidgetProps } from './types';
import styles from './PackWidgets.module.css';

/** A big serif day number with the weekday above it, like a magazine date. */
export function SerifDateWidget({ size }: WidgetProps) {
  const now = useClock();
  const small = size === '1x1';
  return (
    <Widget shape="rounded">
      <div className={`${styles.serifDate} ${small ? styles.small : ''}`}>
        <span className="label">{now.toLocaleDateString('en-GB', { weekday: small ? 'short' : 'long' })}</span>
        <span className={styles.numeral}>{now.getDate()}</span>
        {!small && <span className="label">{now.toLocaleDateString('en-GB', { month: 'long' })}</span>}
      </div>
    </Widget>
  );
}

/** A thin dial with 60 ticks, three slim hands and a red second dot. */
export function TickDialWidget() {
  return (
    <Widget shape="circle">
      <div className={styles.dial}>
        <HandsClock size={100} />
      </div>
    </Widget>
  );
}

/**
 * Humidity as a wireframe cylinder (line-art data): thin ellipses and sides,
 * filled with horizontal lines up to the humidity level.
 */
export function HumidityWidget({ size }: WidgetProps) {
  const humidity = useWeather().data?.now.humidity ?? null;
  const level = humidity === null ? 0 : humidity / 100;
  const top = 18;
  const bottom = 82;
  const fillTop = bottom - (bottom - top) * level;
  return (
    <Widget shape="rounded">
      <div className={styles.lineArt}>
        <div className={styles.head}>
          <span className="label">Humidity</span>
          <span className={styles.value}>{humidity === null ? '--' : `${humidity}%`}</span>
        </div>
        <svg className={styles.drawing} viewBox="0 0 100 100" aria-hidden="true">
          <ellipse className={styles.line} cx="50" cy={top} rx="26" ry="7" />
          <path className={styles.line} d={`M24 ${top} V${bottom} M76 ${top} V${bottom}`} />
          <path className={styles.line} d={`M24 ${bottom} A26 7 0 0 0 76 ${bottom}`} />
          <path className={styles.ghost} d={`M24 ${bottom} A26 7 0 0 1 76 ${bottom}`} />
          {/* The water: an ellipse at its level and lines below it */}
          {humidity !== null && (
            <>
              <ellipse className={styles.fillLine} cx="50" cy={fillTop} rx="26" ry="7" />
              {Array.from({ length: Math.floor((bottom - fillTop) / 6) }, (_, i) => (
                <path key={i} className={styles.fill} d={`M24 ${fillTop + 6 * (i + 1)} A26 7 0 0 0 76 ${fillTop + 6 * (i + 1)}`} />
              ))}
            </>
          )}
        </svg>
        {size !== '1x1' && (
          <span className={styles.caption}>
            {humidity === null ? 'Waiting for the weather' : humidity > 70 ? 'Humid' : humidity < 35 ? 'Dry' : 'Comfortable'}
          </span>
        )}
      </div>
    </Widget>
  );
}

/** Wind as a wireframe cone pointing where the wind blows, with the speed. */
export function WindConeWidget({ size }: WidgetProps) {
  const now = useWeather().data?.now;
  const direction = now?.windDirection;
  return (
    <Widget shape="rounded">
      <div className={styles.lineArt}>
        <div className={styles.head}>
          <span className="label">Wind</span>
          <span className={styles.value}>{now ? `${now.wind} km/h` : '--'}</span>
        </div>
        <svg className={styles.drawing} viewBox="0 0 100 100" aria-hidden="true">
          <g transform={`rotate(${(direction ?? 90) + 90} 50 50)`}>
            {/* A cone lying on its side: the tip points downwind */}
            <path className={styles.line} d="M14 50 L80 34 M14 50 L80 66" />
            <ellipse className={styles.line} cx="80" cy="50" rx="6" ry="16" />
            {[30, 46, 62].map((x) => (
              <ellipse key={x} className={styles.ghost} cx={x} cy="50" rx={(x - 14) * 0.09} ry={(x - 14) * 0.24} />
            ))}
          </g>
        </svg>
        {size !== '1x1' && (
          <span className={styles.caption}>{direction === undefined ? 'Direction after the next update' : 'Points where it blows'}</span>
        )}
      </div>
    </Widget>
  );
}

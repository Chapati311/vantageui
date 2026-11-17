import { DotNumber } from '../../../components/DotNumber';
import { Widget } from '../../../components/Widget';
import { aqiWord, useAirQuality, uvWord } from '../../../system/airQuality';
import { directionName, useCompass } from '../../../system/compass';
import { initials, useContacts } from '../../../system/contacts';
import { call } from '../../../system/nativeBridge';
import { useClock } from '../../../system/useClock';
import { useWeather } from '../../../system/weather';
import type { WidgetProps } from '../types';
import { quoteOfTheDay } from './quotes';
import styles from './InfoWidgets.module.css';

/** Rows of dots for the chance of rain over the next hours: more dots = more likely. */
export function RainDotsWidget({ size }: WidgetProps) {
  const { data, status } = useWeather();
  const hours = data?.hourly.slice(0, size === '4x1' ? 12 : 8) ?? [];
  const most = Math.max(0, ...hours.map((hour) => hour.rainChance));
  return (
    <Widget shape="rounded">
      <div className={styles.rain}>
        <span className="label">{data ? (most < 10 ? 'No rain soon' : `Rain up to ${most}%`) : status === 'error' ? 'No connection' : 'Loading'}</span>
        <div className={styles.rainColumns}>
          {hours.map((hour) => (
            <div key={hour.hour} className={styles.rainColumn}>
              {[4, 3, 2, 1, 0].map((level) => (
                <span key={level} className={hour.rainChance > level * 20 ? styles.rainDot : styles.rainDotOff} />
              ))}
              <span className={styles.rainHour}>{String(hour.hour).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
      </div>
    </Widget>
  );
}

/** UV index and air quality right now. */
export function AirWidget() {
  const { data, status } = useAirQuality();
  return (
    <Widget shape="rounded">
      {data ? (
        <div className={styles.air}>
          <div className={styles.airItem}>
            <span className="label">UV</span>
            <DotNumber value={String(Math.round(data.uv))} size={28} />
            <span className={styles.airWord}>{uvWord(data.uv)}</span>
          </div>
          <span className={styles.airLine} />
          <div className={styles.airItem}>
            <span className="label">Air</span>
            <DotNumber value={String(data.aqi)} size={28} />
            <span className={styles.airWord}>{aqiWord(data.aqi)}</span>
          </div>
        </div>
      ) : (
        <span className="label">{status === 'error' ? 'No connection' : 'Loading'}</span>
      )}
    </Widget>
  );
}

/** Thin dial rings that turn so N always points north. Tap once to allow the sensor. */
export function CompassWidget() {
  const { heading, status, request } = useCompass();
  const rotation = -(heading ?? 0);
  return (
    <Widget shape="circle">
      <button
        type="button"
        className={styles.compass}
        onClick={status === 'needs-permission' ? request : undefined}
        aria-label={heading !== null ? `Heading ${heading} degrees ${directionName(heading)}` : 'Compass'}
      >
        <svg className={styles.dial} viewBox="0 0 100 100" style={{ transform: `rotate(${rotation}deg)` }} aria-hidden="true">
          <circle className={styles.dialRing} cx="50" cy="50" r="46" />
          <circle className={styles.dialRing} cx="50" cy="50" r="36" />
          {Array.from({ length: 36 }, (_, i) => (
            <line key={i} className={i % 9 === 0 ? styles.dialTickMajor : styles.dialTick} x1="50" y1="4" x2="50" y2={i % 9 === 0 ? 11 : 8} transform={`rotate(${i * 10} 50 50)`} />
          ))}
          <text className={styles.north} x="50" y="22" textAnchor="middle">
            N
          </text>
        </svg>
        <span className={styles.compassCenter}>
          {heading !== null ? (
            <>
              <span className={styles.heading}>{heading}°</span>
              <span className="label">{directionName(heading)}</span>
            </>
          ) : (
            <span className={`label ${styles.compassNote}`}>
              {status === 'needs-permission' ? 'Tap to start' : status === 'denied' ? 'Not allowed' : status === 'unsupported' ? 'No compass' : 'Finding north'}
            </span>
          )}
        </span>
      </button>
    </Widget>
  );
}

/** A short quote, a new one every day. */
export function QuoteWidget({ size }: WidgetProps) {
  const now = useClock();
  const quote = quoteOfTheDay(now);
  return (
    <Widget shape="rounded">
      <figure className={`${styles.quote} ${size === '4x2' ? styles.quoteLarge : ''}`}>
        <blockquote>{quote.text}</blockquote>
        <figcaption className="label">{quote.by}</figcaption>
      </figure>
    </Widget>
  );
}

/** Up to four favorite people. Tap one to call. */
export function FavoritesWidget({ size }: WidgetProps) {
  const { contacts, loaded } = useContacts();
  const favorites = contacts.filter((contact) => contact.favorite).slice(0, 4);
  return (
    <Widget shape={size === '4x1' ? 'circle' : 'rounded'}>
      {favorites.length === 0 ? (
        <div className={styles.emptyFavorites}>
          <span className="label">Favorites</span>
          <span className={styles.emptyNote}>{loaded ? 'Star people in the Phone app' : ''}</span>
        </div>
      ) : (
        <div className={`${styles.favorites} ${size === '4x1' ? styles.favoritesRow : ''}`}>
          {favorites.map((contact) => (
            <button key={contact.id} type="button" className={styles.person} onClick={() => void call(contact.phone)} aria-label={`Call ${contact.name}`}>
              <span className={styles.avatar}>{initials(contact.name)}</span>
              <span className={styles.personName}>{contact.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}
    </Widget>
  );
}

import { useMemo } from 'react';
import { useSetting } from '../../system/settingsStore';
import { skyMood } from './skyMood';
import { useClock } from '../../system/useClock';
import { WEATHER_PLACE, useWeather } from '../../system/weather';
import styles from './WeatherLayer.module.css';

// Fixed, scattered positions (the same every time, so nothing jumps)
const DROPS = Array.from({ length: 28 }, (_, i) => ({ x: (i * 37) % 100, delay: (i * 0.23) % 1.6, speed: 0.9 + ((i * 7) % 5) / 10 }));
const STARS = Array.from({ length: 34 }, (_, i) => ({ x: (i * 53) % 100, y: (i * 29) % 62, delay: (i * 0.37) % 3, big: i % 7 === 0 }));

/**
 * Customise > Wallpapers > "React to the weather": a very light layer on
 * top of any wallpaper. Rain: small dots falling. Night: a few twinkling
 * stars. Around sunset: a warm glow from the bottom. Off by default.
 */
export function WeatherLayer({ paused }: { paused?: boolean }) {
  const [on] = useSetting('weatherWallpaper');
  const now = useClock();
  const weather = useWeather().data;
  const raining = weather ? ['rain', 'storm', 'snow'].includes(weather.now.kind) : false;
  // Recompute every minute at most (the clock ticks each minute)
  const mood = useMemo(() => skyMood(now, raining, WEATHER_PLACE.latitude, WEATHER_PLACE.longitude), [now, raining]);
  if (!on || !mood) return null;

  return (
    <div className={`${styles.layer} ${paused ? styles.paused : ''}`} aria-hidden="true">
      {mood === 'rain' &&
        DROPS.map((drop, i) => (
          <span
            key={i}
            className={`${styles.drop} ${weather?.now.kind === 'snow' ? styles.snow : ''}`}
            style={{
              left: `${drop.x}%`,
              animationDelay: `${drop.delay}s`,
              animationDuration: `${drop.speed * (weather?.now.kind === 'snow' ? 4 : 1.2)}s`,
            }}
          />
        ))}
      {mood === 'night' &&
        STARS.map((star, i) => (
          <span
            key={i}
            className={`${styles.star} ${star.big ? styles.big : ''}`}
            style={{ left: `${star.x}%`, top: `${star.y}%`, animationDelay: `${star.delay}s` }}
          />
        ))}
      {mood === 'sunset' && <span className={styles.glow} />}
    </div>
  );
}

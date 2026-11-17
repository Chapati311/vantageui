import { useState } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { PlusIcon } from '../../components/glyphs';
import { Button, Row, Sheet, SwipeToDelete } from '../../components/kit';
import { sunTimes } from '../../system/sun';
import { useClock } from '../../system/useClock';
import { DotGlobe } from './DotGlobe';
import { ALL_CITIES, addCity, cityTime, removeCity, useWorldCities, type City } from './worldTime';
import styles from './Clock.module.css';

/** A small arc for the city's day: the sun dot rides it between sunrise and sunset. */
function DayArc({ city, now }: { city: City; now: Date }) {
  const { sunrise, sunset } = sunTimes(now, city.lat, city.lon);
  const fraction = (now.getTime() - sunrise.getTime()) / (sunset.getTime() - sunrise.getTime());
  const up = fraction >= 0 && fraction <= 1;
  const angle = Math.PI * Math.min(1, Math.max(0, fraction));
  const x = 24 - 20 * Math.cos(angle);
  const y = 22 - 18 * Math.sin(angle);
  return (
    <svg className={styles.dayArc} viewBox="0 0 48 24" aria-label={up ? 'Daytime' : 'Night'}>
      <path className={styles.dayArcTrack} d="M4 22 A20 18 0 0 1 44 22" />
      <circle className={up ? styles.dayArcSun : styles.dayArcMoon} cx={up ? x : 24} cy={up ? y : 22} r={up ? 2.6 : 2} />
    </svg>
  );
}

/** World clock: a dot globe with day and night, and your cities with their time and day arc. */
export function WorldTab() {
  const now = useClock();
  const cities = useWorldCities();
  const [adding, setAdding] = useState(false);
  const available = ALL_CITIES.filter((city) => !cities.some((chosen) => chosen.timeZone === city.timeZone));

  return (
    <>
      <DotGlobe cities={cities} now={now} />
      <div className={styles.cityList}>
        {cities.map((city) => {
          const { time, note } = cityTime(now, city.timeZone);
          return (
            <SwipeToDelete key={city.timeZone} onDelete={() => removeCity(city.timeZone)} label={`Remove ${city.name}`}>
              <div className={styles.city}>
                <div className={styles.cityText}>
                  <span className={styles.cityName}>{city.name}</span>
                  <span className="label">{note}</span>
                </div>
                <DayArc city={city} now={now} />
                <DotNumber value={time} size={28} clock quietColon />
              </div>
            </SwipeToDelete>
          );
        })}
      </div>
      <Button icon={PlusIcon} onPress={() => setAdding(true)}>
        Add a city
      </Button>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a city">
        {available.map((city) => (
          <Row
            key={city.timeZone}
            title={city.name}
            value={cityTime(now, city.timeZone).time}
            onPress={() => {
              addCity(city.timeZone);
              setAdding(false);
            }}
          />
        ))}
      </Sheet>
    </>
  );
}

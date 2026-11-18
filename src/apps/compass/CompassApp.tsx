import { useState } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { AppShell, Button, EmptyState } from '../../components/kit';
import { directionName, useCompass } from '../../system/compass';
import styles from './Compass.module.css';

const LETTERS: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };

/**
 * Compass. The signature: thin dial rings that turn so north stays north,
 * with the heading in dot-matrix numbers. Tap "Show where I am" for your
 * coordinates.
 */
export function CompassApp() {
  const { heading, status, request } = useCompass();
  const [position, setPosition] = useState<string | null>(null);

  const locate = () => {
    if (!navigator.geolocation) {
      setPosition("This device can't tell where it is.");
      return;
    }
    setPosition('Finding you');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = `${Math.abs(coords.latitude).toFixed(4)}° ${coords.latitude >= 0 ? 'N' : 'S'}`;
        const lon = `${Math.abs(coords.longitude).toFixed(4)}° ${coords.longitude >= 0 ? 'E' : 'W'}`;
        setPosition(`${lat}   ${lon}${coords.altitude !== null ? `   ${Math.round(coords.altitude)} m` : ''}`);
      },
      () => setPosition('Location was not allowed.'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  if (status === 'unsupported' || status === 'denied') {
    return (
      <AppShell title="Compass" fixed>
        <EmptyState
          kind="error"
          title={status === 'denied' ? 'Not allowed' : 'No compass'}
          message={status === 'denied' ? 'Allow motion and orientation for this app in Safari settings.' : "This device doesn't have a compass. Open Vantage on the iPhone."}
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Compass" fixed>
      <div className={styles.compass}>
        <div className={styles.dialBox}>
          <span className={styles.marker} />
          <svg className={styles.dial} viewBox="0 0 200 200" style={{ transform: `rotate(${-(heading ?? 0)}deg)` }} aria-hidden="true">
            <circle className={styles.ring} cx="100" cy="100" r="96" />
            <circle className={styles.ring} cx="100" cy="100" r="78" />
            <circle className={styles.ring} cx="100" cy="100" r="40" />
            {Array.from({ length: 72 }, (_, i) => (
              <line key={i} className={i % 6 === 0 ? styles.tickMajor : styles.tick} x1="100" y1="6" x2="100" y2={i % 6 === 0 ? 16 : 11} transform={`rotate(${i * 5} 100 100)`} />
            ))}
            {[0, 90, 180, 270].map((angle) => (
              <text key={angle} className={angle === 0 ? styles.north : styles.letter} x="100" y="34" textAnchor="middle" transform={`rotate(${angle} 100 100)`}>
                {LETTERS[angle]}
              </text>
            ))}
            {[30, 60, 120, 150, 210, 240, 300, 330].map((angle) => (
              <text key={angle} className={styles.degree} x="100" y="30" textAnchor="middle" transform={`rotate(${angle} 100 100)`}>
                {angle}
              </text>
            ))}
          </svg>
          <div className={styles.center}>
            {heading !== null ? (
              <>
                <DotNumber value={String(heading)} size={40} />
                <span className="label">{directionName(heading)}</span>
              </>
            ) : status === 'needs-permission' ? (
              <Button onPress={request}>Start compass</Button>
            ) : (
              <span className="label">Finding north</span>
            )}
          </div>
        </div>
        <Button onPress={locate}>Show where I am</Button>
        {position && <span className={styles.position}>{position}</span>}
      </div>
    </AppShell>
  );
}

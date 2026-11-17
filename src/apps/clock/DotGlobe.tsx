import { subsolarPoint, type City } from './worldTime';
import styles from './Clock.module.css';

const RAD = Math.PI / 180;

/**
 * The Earth as a sphere of dots, seen from above the first city. Dots on
 * the night side are faint, the day side bright; your cities are lit up,
 * the first one in the accent.
 */
export function DotGlobe({ cities, now }: { cities: City[]; now: Date }) {
  const center = cities[0] ?? { lat: 30, lon: 10 };
  const sun = subsolarPoint(now);
  const lat0 = Math.min(50, Math.max(-50, center.lat)) * RAD;
  const lon0 = center.lon * RAD;

  /** Orthographic projection. Returns null for the far side of the globe. */
  const project = (lat: number, lon: number) => {
    const phi = lat * RAD;
    const lambda = lon * RAD;
    const cosc = Math.sin(lat0) * Math.sin(phi) + Math.cos(lat0) * Math.cos(phi) * Math.cos(lambda - lon0);
    if (cosc < 0) return null;
    return {
      x: 50 + 44 * Math.cos(phi) * Math.sin(lambda - lon0),
      y: 50 - 44 * (Math.cos(lat0) * Math.sin(phi) - Math.sin(lat0) * Math.cos(phi) * Math.cos(lambda - lon0)),
      edge: cosc,
    };
  };

  const daylight = (lat: number, lon: number) =>
    Math.sin(lat * RAD) * Math.sin(sun.lat * RAD) + Math.cos(lat * RAD) * Math.cos(sun.lat * RAD) * Math.cos((lon - sun.lon) * RAD) > 0;

  const dots: { x: number; y: number; r: number; day: boolean }[] = [];
  for (let lat = -80; lat <= 80; lat += 8) {
    const step = 8 / Math.max(0.25, Math.cos(lat * RAD));
    for (let lon = -180; lon < 180; lon += step) {
      const point = project(lat, lon);
      if (point) dots.push({ x: point.x, y: point.y, r: 0.5 + point.edge * 0.6, day: daylight(lat, lon) });
    }
  }

  return (
    <svg className={styles.globe} viewBox="0 0 100 100" role="img" aria-label="Globe with day and night">
      <circle className={styles.globeEdge} cx="50" cy="50" r="45" />
      {dots.map((dot, index) => (
        <circle key={index} cx={dot.x} cy={dot.y} r={dot.r} className={dot.day ? styles.globeDay : styles.globeNight} />
      ))}
      {cities.map((city, index) => {
        const point = project(city.lat, city.lon);
        return point ? <circle key={city.timeZone} cx={point.x} cy={point.y} r={index === 0 ? 2.4 : 1.8} className={index === 0 ? styles.globeHome : styles.globeCity} /> : null;
      })}
    </svg>
  );
}

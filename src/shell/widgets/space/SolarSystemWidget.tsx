import { Widget } from '../../../components/Widget';
import { useClock } from '../../../system/useClock';
import styles from './SpaceWidgets.module.css';

/**
 * Where each planet is around the sun: its mean longitude on 1 January 2000
 * (degrees) and how far it moves per day. Good to a few degrees, which is
 * plenty for a picture. Orbits are evenly spaced, not to scale.
 */
const PLANETS = [
  { name: 'Mercury', start: 252.25, perDay: 4.09233, size: 1.6 },
  { name: 'Venus', start: 181.98, perDay: 1.60213, size: 2.2 },
  { name: 'Earth', start: 100.46, perDay: 0.98561, size: 2.4 },
  { name: 'Mars', start: 355.45, perDay: 0.52403, size: 1.9 },
  { name: 'Jupiter', start: 34.4, perDay: 0.08309, size: 3.6 },
  { name: 'Saturn', start: 49.94, perDay: 0.03346, size: 3.2 },
  { name: 'Uranus', start: 313.23, perDay: 0.01173, size: 2.6 },
  { name: 'Neptune', start: 304.88, perDay: 0.00598, size: 2.6 },
];

const J2000 = Date.UTC(2000, 0, 1, 12);

/** The solar system right now, seen from above. Earth is the brightest dot. */
export function SolarSystemWidget() {
  const now = useClock();
  const days = (now.getTime() - J2000) / 86_400_000;
  return (
    <Widget shape="rounded">
      <svg className={styles.fill} viewBox="0 0 100 100" role="img" aria-label="The planets around the sun, now">
        {PLANETS.map((planet, index) => {
          const radius = 9 + index * 5.2;
          const angle = (((planet.start + planet.perDay * days) % 360) * Math.PI) / 180;
          // Counter-clockwise, as seen from above the north pole
          const x = 50 + radius * Math.cos(angle);
          const y = 50 - radius * Math.sin(angle);
          return (
            <g key={planet.name}>
              <circle className={styles.orbitRing} cx="50" cy="50" r={radius} />
              <circle className={planet.name === 'Earth' ? styles.earth : styles.planet} cx={x} cy={y} r={planet.size / 2 + 0.6} />
            </g>
          );
        })}
        <circle className={styles.sun} cx="50" cy="50" r="3.6" />
      </svg>
    </Widget>
  );
}

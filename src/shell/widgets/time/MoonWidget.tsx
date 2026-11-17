import { Widget } from '../../../components/Widget';
import { useClock } from '../../../system/useClock';
import type { WidgetProps } from '../types';
import styles from './TimeWidgets.module.css';

/** Days from one new moon to the next */
const SYNODIC_MONTH = 29.530588853;
/** A known new moon: 6 January 2000, 18:14 UTC */
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

const NAMES = [
  'New moon',
  'Waxing crescent',
  'First quarter',
  'Waxing gibbous',
  'Full moon',
  'Waning gibbous',
  'Last quarter',
  'Waning crescent',
];

/** 0 = new moon, 0.5 = full moon, back to 1. */
export function moonPhase(date: Date): number {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000;
  return (((days / SYNODIC_MONTH) % 1) + 1) % 1;
}

/** The lit part of the moon disc as an SVG path (radius 40 around 50,50). */
function litPath(phase: number): string {
  const r = 40;
  const k = Math.cos(2 * Math.PI * phase);
  const rx = Math.abs(k) * r;
  const waxing = phase < 0.5;
  const crescent = k > 0;
  // Outer edge on the lit side, then back along the shadow line (an ellipse)
  const outerSweep = waxing ? 1 : 0;
  const innerSweep = waxing ? (crescent ? 0 : 1) : crescent ? 1 : 0;
  return `M50 ${50 - r} A${r} ${r} 0 0 ${outerSweep} 50 ${50 + r} A${rx} ${r} 0 0 ${innerSweep} 50 ${50 - r}Z`;
}

/** Tonight's moon, drawn, with the phase name and how much is lit. */
export function MoonWidget({ size }: WidgetProps) {
  const now = useClock();
  const phase = moonPhase(now);
  const lit = Math.round(((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100);
  const name = NAMES[Math.round(phase * 8) % 8];
  const disc = (
    <svg className={styles.moonDisc} viewBox="0 0 100 100" role="img" aria-label={`${name}, ${lit}% lit`}>
      <circle className={styles.moonDark} cx="50" cy="50" r="40" />
      {lit > 0 && <path className={styles.moonLit} d={litPath(phase)} />}
    </svg>
  );
  return (
    <Widget shape={size === '1x1' ? 'circle' : 'rounded'}>
      {size === '1x1' ? (
        disc
      ) : (
        <div className={styles.moon}>
          {disc}
          <div className={styles.moonText}>
            <span className={styles.moonName}>{name}</span>
            <span className="label">{lit}% lit</span>
          </div>
        </div>
      )}
    </Widget>
  );
}

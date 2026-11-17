import { useEffect, useState, type CSSProperties } from 'react';
import { Widget } from '../../../components/Widget';
import { LiveAurora } from '../../wallpaper/LiveAurora';
import { LiveStarfield } from '../../wallpaper/LiveStarfield';
import { LiveWaves } from '../../wallpaper/LiveWaves';
import styles from './SpaceWidgets.module.css';

/** Three thin rings with a dot each, turning at different speeds. */
export function OrbitWidget() {
  return (
    <Widget shape="circle">
      <div className={styles.orbit} aria-hidden="true">
        {[0.34, 0.62, 0.9].map((size, index) => (
          <span
            key={size}
            className={styles.orbitRingCss}
            style={
              {
                '--size': size,
                animationDuration: `${18 + index * 14}s`,
                animationDirection: index % 2 ? 'reverse' : 'normal',
              } as CSSProperties
            }
          >
            <span className={styles.orbitDot} />
          </span>
        ))}
        <span className={styles.orbitCore} />
      </div>
    </Widget>
  );
}

/** A window onto the starfield wallpaper. */
export function StarfieldWidget() {
  return (
    <Widget shape="rounded">
      <div className={styles.scene} aria-hidden="true">
        <LiveStarfield />
      </div>
    </Widget>
  );
}

/** Soft aurora glows drifting. */
export function AuroraWidget() {
  return (
    <Widget shape="rounded">
      <div className={styles.scene} aria-hidden="true">
        <LiveAurora />
      </div>
    </Widget>
  );
}

/** A slow ocean wave line. */
export function WavesWidget() {
  return (
    <Widget shape="rounded">
      <div className={styles.scene} aria-hidden="true">
        <LiveWaves />
      </div>
    </Widget>
  );
}

/** Soft blobs rising and sinking, like a lava lamp. Only transform moves. */
export function LavaLampWidget() {
  return (
    <Widget shape="rounded">
      <div className={styles.lava} aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={styles.blob} style={{ '--i': index } as CSSProperties} />
        ))}
      </div>
    </Widget>
  );
}

const DROPS = Array.from({ length: 18 }, (_, index) => ({
  x: (index * 37) % 100,
  size: 3 + ((index * 7) % 5),
  seconds: 4 + ((index * 13) % 6),
  delay: -((index * 11) % 9),
}));

/** Drops sliding down a window pane. */
export function RainOnGlassWidget() {
  return (
    <Widget shape="rounded">
      <div className={styles.rain} aria-hidden="true">
        {DROPS.map((drop, index) => (
          <span
            key={index}
            className={styles.drop}
            style={{
              left: `${drop.x}%`,
              width: drop.size,
              height: drop.size * 1.3,
              animationDuration: `${drop.seconds}s`,
              animationDelay: `${drop.delay}s`,
            }}
          />
        ))}
      </div>
    </Widget>
  );
}

/** A circle that grows for 4 seconds (breathe in) and shrinks for 4 (breathe out). */
export function BreathingWidget() {
  const [inhale, setInhale] = useState(true);
  useEffect(() => {
    const id = window.setInterval(() => setInhale((value) => !value), 4000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <Widget shape="circle">
      <span className={styles.breath} aria-hidden="true" />
      <span className={`label ${styles.breathLabel}`}>{inhale ? 'Breathe in' : 'Breathe out'}</span>
    </Widget>
  );
}

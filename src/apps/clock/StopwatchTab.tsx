import { useEffect, useRef, useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { DotNumber } from '../../components/DotNumber';
import { FlagIcon, PauseIcon, PlayIcon, ResetIcon } from '../../components/glyphs';
import { runAction } from '../../system/actions';
import { stopwatchElapsed, useClockState } from './clockStore';
import { formatStopwatch } from './format';
import { PixelRing } from '../../components/PixelRing';
import { useTheme } from '../../system/theme';
import styles from './Clock.module.css';

const RADIUS = 46;

/**
 * Stopwatch: the time inside a thin ring, with a dot sweeping round the
 * ring once a second. Laps below: the fastest in the accent, the slowest grey.
 * The numbers and the dot are updated directly each frame (no re-render).
 */
export function StopwatchTab() {
  const retro = useTheme().retro !== null;
  const { stopwatch } = useClockState();
  const dotRef = useRef<SVGCircleElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  // Whole seconds for the big dot number: re-rendered once a second, not every frame
  const [seconds, setSeconds] = useState(() => Math.floor(stopwatchElapsed(stopwatch) / 1000));

  useEffect(() => {
    const paint = () => {
      const elapsed = stopwatchElapsed(stopwatch);
      const angle = ((elapsed % 1000) / 1000) * Math.PI * 2 - Math.PI / 2;
      dotRef.current?.setAttribute('cx', String(50 + RADIUS * Math.cos(angle)));
      dotRef.current?.setAttribute('cy', String(50 + RADIUS * Math.sin(angle)));
      if (textRef.current) textRef.current.textContent = formatStopwatch(elapsed);
      setSeconds(Math.floor(elapsed / 1000));
    };
    paint();
    if (!stopwatch.running) return;
    let frame = requestAnimationFrame(function loop() {
      paint();
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [stopwatch]);

  const elapsed = stopwatchElapsed(stopwatch);
  const hasTime = stopwatch.running || stopwatch.elapsedMs > 0;
  const laps = stopwatch.laps.map((total, index) => ({ number: index + 1, total, split: total - (stopwatch.laps[index - 1] ?? 0) }));
  const splits = laps.map((lap) => lap.split);
  const fastest = laps.length > 1 ? Math.min(...splits) : -1;
  const slowest = laps.length > 1 ? Math.max(...splits) : -1;

  return (
    <div className={styles.stopwatch}>
      <div className={styles.ringBox}>
        {retro && <PixelRing className={styles.ring} fraction={(stopwatchElapsed(stopwatch) % 60_000) / 60_000} count={60} />}
        <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true" style={retro ? { display: 'none' } : undefined}>
          <circle className={styles.ringTrack} cx="50" cy="50" r={RADIUS} />
          {Array.from({ length: 60 }, (_, i) => (
            <line key={i} className={i % 5 === 0 ? styles.tickMajor : styles.tick} x1="50" y1="9" x2="50" y2={i % 5 === 0 ? 12 : 10.5} transform={`rotate(${i * 6} 50 50)`} />
          ))}
          <circle ref={dotRef} className={styles.sweep} cx="50" cy={50 - RADIUS} r="2.2" />
        </svg>
        <span className={styles.ringCenter}>
          <DotNumber value={`${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`} size={40} />
          <span ref={textRef} className={styles.hundredths}>
            {formatStopwatch(elapsed)}
          </span>
        </span>
      </div>

      <div className={styles.buttons}>
        {stopwatch.running ? (
          <CircleButton label="Lap" onClick={() => void runAction('stopwatch.lap', {})}>
            <FlagIcon />
          </CircleButton>
        ) : (
          <CircleButton label="Reset" disabled={!hasTime} onClick={() => void runAction('stopwatch.reset', {})}>
            <ResetIcon />
          </CircleButton>
        )}
        {stopwatch.running ? (
          <CircleButton label="Stop" onClick={() => void runAction('stopwatch.stop', {})}>
            <PauseIcon />
          </CircleButton>
        ) : (
          <CircleButton label="Start" onClick={() => void runAction('stopwatch.start', {})}>
            <PlayIcon />
          </CircleButton>
        )}
      </div>

      <div className={styles.laps}>
        {[...laps].reverse().map((lap) => (
          <div key={lap.number} className={`${styles.lap} ${lap.split === fastest ? styles.fastest : ''} ${lap.split === slowest ? styles.slowest : ''}`}>
            <span className="label">Lap {lap.number}</span>
            <span className={styles.lapSplit}>{formatStopwatch(lap.split)}</span>
            <span className={styles.lapTotal}>{formatStopwatch(lap.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

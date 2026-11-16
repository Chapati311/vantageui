import { useEffect, useRef } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { ScrollArea } from '../../components/ScrollArea';
import { FlagIcon, PauseIcon, PlayIcon, ResetIcon } from '../../components/glyphs';
import {
  addLap,
  resetStopwatch,
  startStopwatch,
  stopStopwatch,
  stopwatchElapsed,
  useClockState,
} from './clockStore';
import { formatStopwatch } from './format';
import styles from './StopwatchTab.module.css';

export function StopwatchTab() {
  const { stopwatch } = useClockState();
  const display = useRef<HTMLTimeElement>(null);

  // The hundredths change too fast for React. While running we write the
  // text straight into the page once per frame instead of re-rendering.
  useEffect(() => {
    const show = () => {
      if (display.current) display.current.textContent = formatStopwatch(stopwatchElapsed(stopwatch));
    };
    show();
    if (!stopwatch.running) return;
    let frame = requestAnimationFrame(function loop() {
      show();
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [stopwatch]);

  const hasTime = stopwatch.running || stopwatch.elapsedMs > 0;
  // Newest lap first, each with the time since the lap before it.
  const laps = stopwatch.laps
    .map((total, index) => ({
      number: index + 1,
      total,
      split: total - (stopwatch.laps[index - 1] ?? 0),
    }))
    .reverse();

  return (
    <div className={styles.stopwatch}>
      <time ref={display} className={styles.time} />

      <div className={styles.actions}>
        {stopwatch.running ? (
          <CircleButton label="Lap" onClick={addLap}>
            <FlagIcon />
          </CircleButton>
        ) : (
          <CircleButton label="Reset" disabled={!hasTime} onClick={resetStopwatch}>
            <ResetIcon />
          </CircleButton>
        )}
        {stopwatch.running ? (
          <CircleButton primary label="Stop" onClick={stopStopwatch}>
            <PauseIcon />
          </CircleButton>
        ) : (
          <CircleButton primary label="Start" onClick={startStopwatch}>
            <PlayIcon />
          </CircleButton>
        )}
      </div>

      <ScrollArea className={styles.laps}>
        {laps.map((lap) => (
          <div key={lap.number} className={styles.lap}>
            <span className={styles.lapNumber}>Lap {lap.number}</span>
            <span className={styles.lapSplit}>+{formatStopwatch(lap.split)}</span>
            <span className={styles.lapTotal}>{formatStopwatch(lap.total)}</span>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { DotNumber } from '../../components/DotNumber';
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
  const [, setFrame] = useState(0);

  // While running, redraw once per screen frame. Only this tab re-renders.
  useEffect(() => {
    if (!stopwatch.running) return;
    let frame = requestAnimationFrame(function loop() {
      setFrame((count) => count + 1);
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [stopwatch.running]);

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
      <time className={styles.time}>
        {/* instant: the hundredths change too fast for the dots to fade */}
        <DotNumber value={formatStopwatch(stopwatchElapsed(stopwatch))} size={40} instant />
      </time>

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
            <span className={`label ${styles.lapNumber}`}>Lap {lap.number}</span>
            <span className={styles.lapSplit}>+{formatStopwatch(lap.split)}</span>
            <span className={styles.lapTotal}>{formatStopwatch(lap.total)}</span>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}

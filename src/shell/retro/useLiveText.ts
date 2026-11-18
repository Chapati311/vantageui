import { useEffect, useState } from 'react';
import { stopwatchElapsed, timerRemaining, useClockState } from '../../apps/clock/clockStore';
import { phaseTime, useFocus } from '../../apps/lockin/focusStore';

const mmss = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/**
 * What is running, as one short line for the retro status bar
 * ("TIMER 04:59", "FOCUS 22:10", "SW 01:23"), or null when nothing runs.
 */
export function useLiveText(): string | null {
  const { timer, stopwatch } = useClockState();
  const { session } = useFocus();
  const [, setTick] = useState(0);
  const active = session !== null || timer.status === 'running' || timer.status === 'paused' || timer.status === 'done' || stopwatch.running;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  if (session) {
    const { left, elapsed } = phaseTime(session);
    return `${session.phase === 'break' ? 'BREAK' : 'FOCUS'} ${mmss(session.phaseEndsAt === null ? elapsed : left)}`;
  }
  if (timer.status === 'done') return 'TIMER DONE';
  if (timer.status === 'running' || timer.status === 'paused') return `TIMER ${mmss(timerRemaining(timer))}`;
  if (stopwatch.running) return `SW ${mmss(stopwatchElapsed(stopwatch))}`;
  return null;
}

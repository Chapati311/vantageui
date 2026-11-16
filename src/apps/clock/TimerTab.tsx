import { useEffect, useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { MinusIcon, PauseIcon, PlayIcon, PlusIcon, ResetIcon } from '../../components/glyphs';
import {
  MAX_TIMER_MS,
  MIN_TIMER_MS,
  pauseTimer,
  resetTimer,
  setTimerDuration,
  startTimer,
  timerRemaining,
  useClockState,
} from './clockStore';
import { formatCountdown } from './format';
import styles from './TimerTab.module.css';
import { Pressable } from '../../components/Pressable';

const MINUTE = 60_000;
const PRESET_MINUTES = [1, 5, 10, 25];

const STATUS_LABEL = {
  idle: 'Ready',
  running: 'Running',
  paused: 'Paused',
  done: 'Done',
};

/** Countdown timer. The big number runs down the left side, turned 90 degrees. */
export function TimerTab() {
  const { timer } = useClockState();
  const [, setTick] = useState(0);

  // While running, redraw 4 times a second. Only this tab re-renders.
  useEffect(() => {
    if (timer.status !== 'running') return;
    const interval = window.setInterval(() => setTick((tick) => tick + 1), 250);
    return () => window.clearInterval(interval);
  }, [timer.status]);

  const remaining = timerRemaining(timer);
  const progress = 1 - remaining / timer.durationMs; // 0 at the start, 1 when done
  const canEdit = timer.status === 'idle' || timer.status === 'done';

  return (
    <div className={styles.timer}>
      <div className={styles.display}>
        <div className={styles.track}>
          <div className={styles.progress} style={{ transform: `scaleY(${progress})` }} />
        </div>
        <time className={styles.time} aria-label={`${formatCountdown(remaining)} left`}>
          {formatCountdown(remaining)}
        </time>
      </div>

      <div className={styles.side}>
        <div className={`${styles.status} ${timer.status === 'done' ? styles.done : ''}`}>
          {STATUS_LABEL[timer.status]}
        </div>

        <div className={`${styles.setup} ${canEdit ? '' : styles.locked}`}>
          <div className={styles.presets}>
            {PRESET_MINUTES.map((minutes) => (
              <Pressable
                key={minutes}
                className={`${styles.preset} ${timer.durationMs === minutes * MINUTE ? styles.selected : ''}`}
                aria-label={`${minutes} minutes`}
                onClick={() => setTimerDuration(minutes * MINUTE)}
              >
                {minutes}
              </Pressable>
            ))}
          </div>
          <div className={styles.stepper}>
            <CircleButton
              small
              label="One minute less"
              disabled={timer.durationMs <= MIN_TIMER_MS}
              onClick={() => setTimerDuration(timer.durationMs - MINUTE)}
            >
              <MinusIcon />
            </CircleButton>
            <span className={styles.unit}>min</span>
            <CircleButton
              small
              label="One minute more"
              disabled={timer.durationMs >= MAX_TIMER_MS}
              onClick={() => setTimerDuration(timer.durationMs + MINUTE)}
            >
              <PlusIcon />
            </CircleButton>
          </div>
        </div>

        <div className={styles.actions}>
          <CircleButton label="Reset" disabled={timer.status === 'idle'} onClick={resetTimer}>
            <ResetIcon />
          </CircleButton>
          {timer.status === 'running' ? (
            <CircleButton primary label="Pause" onClick={pauseTimer}>
              <PauseIcon />
            </CircleButton>
          ) : (
            <CircleButton
              primary
              label="Start"
              onClick={() => {
                if (timer.status === 'done') resetTimer();
                startTimer();
              }}
            >
              <PlayIcon />
            </CircleButton>
          )}
        </div>
      </div>
    </div>
  );
}

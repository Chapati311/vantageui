import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { stopwatchElapsed, timerRemaining, useClockState } from '../apps/clock/clockStore';
import { formatCountdown } from '../apps/clock/format';
import { FlagIcon, PauseIcon } from '../components/glyphs';
import { ClockIcon } from '../system/appIcons';
import { runAction } from '../system/actions';
import { MOTION, SPRING } from '../theme/tokens';
import styles from './LivePill.module.css';

/** What is running right now, if anything. */
function useLiveActivity() {
  const { timer, stopwatch } = useClockState();
  const [now, setNow] = useState(Date.now);
  const active = timer.status === 'running' || timer.status === 'paused' || stopwatch.running;

  // Tick once a second, only while something is running
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  if (timer.status === 'running' || timer.status === 'paused') {
    return {
      kind: 'timer' as const,
      paused: timer.status === 'paused',
      text: formatCountdown(timerRemaining(timer, now)),
      progress: 1 - timerRemaining(timer, now) / timer.durationMs,
    };
  }
  if (stopwatch.running) {
    const seconds = Math.floor(stopwatchElapsed(stopwatch, now) / 1000);
    const text = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    return { kind: 'stopwatch' as const, paused: false, text, progress: (seconds % 60) / 60 };
  }
  return null;
}

/**
 * A small pill that shows what is running (a timer counting down, the
 * stopwatch) on the home and lock screens. Tap it to jump to the Clock.
 * `compact`: 24px tall, to fit the home screen's page-dots row.
 * `unlockFirst`: on the lock screen, a tap unlocks before opening the Clock.
 */
export function LivePill({ compact, unlockFirst }: { compact?: boolean; unlockFirst?: boolean }) {
  const activity = useLiveActivity();

  return (
    <AnimatePresence initial={false}>
      {activity && (
        <motion.button
          key="pill"
          type="button"
          className={`${styles.pill} ${compact ? styles.compact : ''}`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          whileTap={{ scale: MOTION.pressScale }}
          transition={SPRING.ui}
          aria-label={`${activity.kind === 'timer' ? 'Timer' : 'Stopwatch'} ${activity.text}. Open Clock`}
          onClick={() => {
            if (unlockFirst) void runAction('shell.unlock', {});
            void runAction('clock.showTab', { tab: activity.kind });
            void runAction('app.open', { appId: 'clock' });
          }}
        >
          <span className={styles.ring} style={{ ['--progress' as string]: activity.progress }}>
            {activity.kind === 'timer' ? activity.paused ? <PauseIcon /> : <ClockIcon /> : <FlagIcon />}
          </span>
          <span className={`${styles.time} ${activity.paused ? styles.paused : ''}`}>{activity.text}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/** True while the live pill has something to show. */
export function useHasLiveActivity(): boolean {
  return useLiveActivity() !== null;
}

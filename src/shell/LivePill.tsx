import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { stopwatchElapsed, timerRemaining, useClockState } from '../apps/clock/clockStore';
import { formatCountdown } from '../apps/clock/format';
import { CloseIcon, FlagIcon, MicIcon, PauseIcon, PlayIcon, SkipNextIcon, SkipPreviousIcon } from '../components/glyphs';
import { ClockIcon, LockInIcon, MusicIcon } from '../system/appIcons';
import { currentTrack, usePlayer } from '../system/musicPlayer';
import { playSound } from '../system/sounds';
import { phaseTime, useFocus } from '../apps/lockin/focusStore';
import { runAction } from '../system/actions';
import { stopRecording, useRecorder } from '../system/recordings';
import { useSettings } from '../system/settingsStore';
import { MOTION, SPRING } from '../theme/tokens';
import styles from './LivePill.module.css';

/** What is running right now, if anything. */
function useLiveActivity() {
  const { timer, stopwatch } = useClockState();
  const { recordingSince } = useRecorder();
  const { session: focus } = useFocus();
  const settings = useSettings();
  const player = usePlayer();
  const song = currentTrack(player);
  // A song shows once it has played this session (a paused song stays, so you can resume it)
  const musicOn = song !== undefined && (player.playing || player.position > 0);
  const [now, setNow] = useState(Date.now);
  const timerOn = settings.pillTimer && (timer.status === 'running' || timer.status === 'paused');
  const stopwatchOn = settings.pillStopwatch && stopwatch.running;
  const recordingOn = settings.pillRecording && recordingSince !== null;
  const active = timerOn || stopwatchOn || recordingOn || focus !== null || musicOn;

  // Tick once a second, only while something is running
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  if (focus) {
    const { left, elapsed, total } = phaseTime(focus, now);
    const open = focus.phaseEndsAt === null && focus.pausedLeft === null;
    const shown = Math.round((open ? elapsed : left) / 1000);
    const text = `${String(Math.floor(shown / 60)).padStart(2, '0')}:${String(shown % 60).padStart(2, '0')}`;
    return {
      kind: 'focus' as const,
      paused: focus.pausedLeft !== null || focus.phase === 'break',
      text,
      progress: open || !total ? 0 : 1 - left / total,
    };
  }
  if (recordingOn) {
    const seconds = Math.floor((now - recordingSince) / 1000);
    const text = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    return { kind: 'recording' as const, paused: false, text, progress: (seconds % 60) / 60 };
  }
  if (timerOn) {
    return {
      kind: 'timer' as const,
      paused: timer.status === 'paused',
      text: formatCountdown(timerRemaining(timer, now)),
      progress: 1 - timerRemaining(timer, now) / timer.durationMs,
    };
  }
  if (stopwatchOn) {
    const seconds = Math.floor(stopwatchElapsed(stopwatch, now) / 1000);
    const text = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    return { kind: 'stopwatch' as const, paused: false, text, progress: (seconds % 60) / 60 };
  }
  if (musicOn && song) {
    return {
      kind: 'music' as const,
      paused: !player.playing,
      text: song.title,
      progress: song.duration ? Math.min(1, player.position / song.duration) : 0,
    };
  }
  return null;
}

type Activity = NonNullable<ReturnType<typeof useLiveActivity>>;

/** The buttons the pill shows when you long-press it. */
function controlsFor(activity: Activity): { label: string; icon: ComponentType; run: () => void }[] {
  switch (activity.kind) {
    case 'timer':
      return [
        {
          label: activity.paused ? 'Resume' : 'Pause',
          icon: activity.paused ? PlayIcon : PauseIcon,
          run: () => void runAction(activity.paused ? 'timer.start' : 'timer.pause', {}),
        },
        { label: 'Cancel', icon: CloseIcon, run: () => void runAction('timer.reset', {}) },
      ];
    case 'stopwatch':
      return [
        { label: 'Lap', icon: FlagIcon, run: () => void runAction('stopwatch.lap', {}) },
        { label: 'Stop', icon: PauseIcon, run: () => void runAction('stopwatch.stop', {}) },
      ];
    case 'recording':
      return [{ label: 'Stop recording', icon: CloseIcon, run: () => stopRecording() }];
    case 'music':
      return [
        { label: 'Previous song', icon: SkipPreviousIcon, run: () => void runAction('music.previous', {}) },
        {
          label: activity.paused ? 'Play' : 'Pause',
          icon: activity.paused ? PlayIcon : PauseIcon,
          run: () => void runAction('music.togglePlay', {}),
        },
        { label: 'Next song', icon: SkipNextIcon, run: () => void runAction('music.next', {}) },
      ];
    default:
      return [];
  }
}

/**
 * A small pill that shows what is running (a timer counting down, the
 * stopwatch, a song) on the home and lock screens. Tap it to jump to the app.
 * Long-press it and it grows to show controls; it morphs smoothly between sizes.
 * `compact`: 24px tall, to fit the home screen's page-dots row.
 * `unlockFirst`: on the lock screen, a tap unlocks before opening the app.
 */
export function LivePill({ compact, unlockFirst }: { compact?: boolean; unlockFirst?: boolean }) {
  const activity = useLiveActivity();
  const [expanded, setExpanded] = useState(false);
  const pressTimer = useRef(0);
  const longPressed = useRef(false);
  const self = useRef<HTMLDivElement>(null);
  const hasActivity = activity !== null;

  // Collapse when you touch anywhere else, or after a few quiet seconds
  useEffect(() => {
    if (!expanded) return;
    const outside = (event: PointerEvent) => {
      if (!self.current?.contains(event.target as Node)) setExpanded(false);
    };
    const timer = window.setTimeout(() => setExpanded(false), 6000);
    document.addEventListener('pointerdown', outside, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', outside, true);
    };
  }, [expanded, activity?.paused]);
  useEffect(() => {
    if (!hasActivity) setExpanded(false);
  }, [hasActivity]);

  const openApp = (activity: Activity) => {
    if (activity.kind === 'recording') {
      stopRecording();
      return;
    }
    if (unlockFirst) void runAction('shell.unlock', {});
    if (activity.kind === 'focus') void runAction('app.open', { appId: 'lockin' });
    else if (activity.kind === 'music') void runAction('app.open', { appId: 'music' });
    else {
      void runAction('clock.showTab', { tab: activity.kind });
      void runAction('app.open', { appId: 'clock' });
    }
  };

  const controls = activity ? controlsFor(activity) : [];
  const cancelPress = () => window.clearTimeout(pressTimer.current);

  return (
    <AnimatePresence initial={false}>
      {activity && (
        <motion.div
          ref={self}
          key="pill"
          layout
          role="group"
          className={`${styles.pill} ${compact && !expanded ? styles.compact : ''} ${expanded ? styles.expanded : ''}`}
          style={{ borderRadius: 999 }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={SPRING.ui}
        >
          <motion.button
            layout="position"
            type="button"
            className={styles.main}
            whileTap={{ scale: MOTION.pressScale }}
            transition={SPRING.ui}
            aria-label={
              activity.kind === 'focus'
                ? `Focus ${activity.text}. Open Focus`
                : activity.kind === 'recording'
                  ? `Recording ${activity.text}. Tap to stop`
                  : activity.kind === 'music'
                    ? `${activity.text}. Open Music`
                    : `${activity.kind === 'timer' ? 'Timer' : 'Stopwatch'} ${activity.text}. Open Clock`
            }
            onPointerDown={() => {
              longPressed.current = false;
              cancelPress();
              pressTimer.current = window.setTimeout(() => {
                longPressed.current = true;
                if (controls.length) {
                  setExpanded((open) => !open);
                  playSound('tick');
                }
              }, 450);
            }}
            onPointerUp={cancelPress}
            onPointerCancel={cancelPress}
            onPointerLeave={cancelPress}
            onContextMenu={(event) => event.preventDefault()}
            onClick={() => {
              if (longPressed.current) return;
              openApp(activity);
            }}
          >
            <span className={styles.ring} style={{ ['--progress' as string]: activity.progress }}>
              {activity.kind === 'focus' ? (
                <LockInIcon />
              ) : activity.kind === 'recording' ? (
                <MicIcon />
              ) : activity.kind === 'music' ? (
                <MusicIcon />
              ) : activity.kind === 'timer' ? (
                activity.paused ? (
                  <PauseIcon />
                ) : (
                  <ClockIcon />
                )
              ) : (
                <FlagIcon />
              )}
            </span>
            <span className={`${styles.time} ${activity.paused ? styles.paused : ''}`}>{activity.text}</span>
          </motion.button>
          <AnimatePresence initial={false}>
            {expanded &&
              controls.map((control, index) => (
                <motion.button
                  key={control.label}
                  layout="position"
                  type="button"
                  className={styles.control}
                  aria-label={control.label}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1, transition: { ...SPRING.ui, delay: 0.04 * index } }}
                  exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.1 } }}
                  whileTap={{ scale: MOTION.pressScale }}
                  onClick={() => {
                    control.run();
                    playSound('tick');
                  }}
                >
                  <control.icon />
                </motion.button>
              ))}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** True while the live pill has something to show. */
export function useHasLiveActivity(): boolean {
  return useLiveActivity() !== null;
}

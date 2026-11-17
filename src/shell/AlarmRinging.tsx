import { useDrag } from '@use-gesture/react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useAlarms } from '../apps/clock/alarmStore';
import { DotNumber } from '../components/DotNumber';
import { runAction } from '../system/actions';
import { MOTION, SPRING } from '../theme/tokens';
import { Wallpaper } from './wallpaper/Wallpaper';
import styles from './AlarmRinging.module.css';

const two = (value: number) => String(value).padStart(2, '0');

/**
 * A ringing alarm, over everything (even the lock screen): the orbit
 * wallpaper, the time, the label. Swipe up to stop, tap Snooze to sleep a
 * few more minutes.
 */
export function AlarmRinging() {
  const { ringing, settings } = useAlarms();
  return <AnimatePresence>{ringing && <Ringing key={ringing.alarmId} {...ringing} snoozeMinutes={settings.snoozeMinutes} />}</AnimatePresence>;
}

function Ringing({ hour, minute, label, snoozeMinutes }: { hour: number; minute: number; label: string; snoozeMinutes: number }) {
  const progress = useMotionValue(0);
  const y = useTransform(progress, (value) => `${-value * 100}%`);

  const bind = useDrag(
    ({ last, movement: [, moved], velocity: [, speed], direction: [, direction] }) => {
      const height = window.innerHeight;
      const value = Math.max(0, -moved / height);
      if (!last) {
        progress.set(value);
        return;
      }
      if ((speed > MOTION.flickVelocity && direction < 0) || value > 0.35) {
        void animate(progress, 1, SPRING.sheet).then(() => void runAction('alarm.stop', {}));
      } else animate(progress, 0, SPRING.sheet);
    },
    { axis: 'y', filterTaps: true },
  );

  return (
    <motion.div className={styles.screen} style={{ y }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SPRING.ui} role="alertdialog" aria-label="Alarm" {...(bind() as object)}>
      <Wallpaper place="lock" config={{ kind: 'live', id: 'orbit' }} progress={progress} />
      <div className={styles.content}>
        <span className="label">Alarm</span>
        <DotNumber value={`${two(hour)}:${two(minute)}`} size={96} clock blinkColon />
        {label && <span className={styles.label}>{label}</span>}
      </div>
      <button type="button" className={styles.snooze} onClick={() => void runAction('alarm.snooze', {})}>
        Snooze {snoozeMinutes} min
      </button>
      <span className={`label ${styles.hint}`}>Swipe up to stop</span>
    </motion.div>
  );
}

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type ComponentType } from 'react';
import { DotNumber } from '../../../components/DotNumber';
import { Widget } from '../../../components/Widget';
import { useAlarms } from '../../../apps/clock/alarmStore';
import { useLockIn } from '../../../apps/lockin/lockInStore';
import { useClock } from '../../../system/useClock';
import { SPRING } from '../../../theme/tokens';
import { WeatherWidget } from '../WeatherWidget';
import type { WidgetProps } from '../types';
import { HomeworkWidget, LockInRingWidget, NextLessonWidget } from './LockInWidgets';
import styles from './SmartStack.module.css';

const two = (value: number) => String(value).padStart(2, '0');

/** Evening card: when Wind Down starts. */
function WindDownCard() {
  const { windDown } = useLockIn();
  const [h, m] = (windDown.start || '21:30').split(':');
  return (
    <Widget shape="rounded">
      <div className={styles.card}>
        <span className="label">Wind Down</span>
        <DotNumber value={`${h}:${m}`} size={28} />
        <span className={styles.detail}>Sleep by {windDown.sleep || '22:30'}</span>
      </div>
    </Widget>
  );
}

/** Evening card: tomorrow's first alarm. */
function TomorrowAlarmCard() {
  const now = useClock();
  const { alarms } = useAlarms();
  // Tomorrow, counted Monday = 0 (getDay counts Sunday = 0, so this is one day ahead)
  const weekday = now.getDay();
  const first = alarms
    .filter((alarm) => alarm.enabled && (alarm.days.every((day) => !day) || alarm.days[weekday]))
    .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))[0];
  return (
    <Widget shape="rounded">
      <div className={styles.card}>
        <span className="label">Tomorrow</span>
        <DotNumber value={first ? `${two(first.hour)}:${two(first.minute)}` : '--:--'} size={28} />
        <span className={styles.detail}>{first ? first.label || 'Alarm' : 'No alarm set'}</span>
      </div>
    </Widget>
  );
}

type Slot = 'morning' | 'afternoon' | 'evening';

/** What the stack shows at each time of day, and the app each card opens. */
const SLOTS: Record<Slot, { component: ComponentType<WidgetProps>; appId: string; name: string }[]> = {
  morning: [
    { component: WeatherWidget, appId: 'weather', name: 'Weather' },
    { component: NextLessonWidget, appId: 'lockin', name: 'First lesson' },
  ],
  afternoon: [
    { component: HomeworkWidget, appId: 'lockin', name: 'Homework' },
    { component: LockInRingWidget, appId: 'lockin', name: 'Focus' },
  ],
  evening: [
    { component: WindDownCard, appId: 'lockin', name: 'Wind Down' },
    { component: TomorrowAlarmCard, appId: 'clock', name: "Tomorrow's alarm" },
  ],
};

export function slotAt(hour: number): Slot {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

/** The app the card on top opens (read by the widget's tap). */
let currentApp = 'weather';
export const smartStackApp = () => currentApp;

const ROTATE_MS = 8000;

/**
 * Smart stack: two widgets that fit the time of day (morning: weather and
 * your first lesson; afternoon: homework and focus; evening: Wind Down and
 * tomorrow's alarm). It flips between them every few seconds; the dots on
 * the side show which one is on top.
 */
export function SmartStackWidget({ size }: WidgetProps) {
  const now = useClock();
  const slot = slotAt(now.getHours());
  const cards = SLOTS[slot];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((value) => (value + 1) % cards.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [cards.length, slot]);

  const card = cards[index % cards.length];
  currentApp = card.appId;
  const Card = card.component;

  return (
    <div className={styles.stack} aria-label={`Smart stack: ${card.name}`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={`${slot}-${index}`}
          className={styles.layer}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.96 }}
          transition={SPRING.ui}
        >
          <Card size={size} />
        </motion.div>
      </AnimatePresence>
      <div className={styles.dots} aria-hidden="true">
        {cards.map((item, i) => (
          <span key={item.name} className={`${styles.dot} ${i === index % cards.length ? styles.on : ''}`} />
        ))}
      </div>
    </div>
  );
}

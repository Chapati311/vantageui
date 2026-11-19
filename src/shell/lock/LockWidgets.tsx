import type { ReactNode } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { useAlarms } from '../../apps/clock/alarmStore';
import { focusMinutesOn, useFocusSessions } from '../../apps/lockin/lockInStats';
import { useLockIn } from '../../apps/lockin/lockInStore';
import { nextEvent, useEvents } from '../../system/events';
import { useSettings } from '../../system/settingsStore';
import { useBattery } from '../../system/useBattery';
import { useClock } from '../../system/useClock';
import { useWeather } from '../../system/weather';
import styles from './Lock.module.css';

/** Every widget that fits under the lock clock, with a name for Customise. */
export const LOCK_WIDGETS: { id: string; name: string }[] = [
  { id: 'weather', name: 'Temperature' },
  { id: 'battery', name: 'Battery' },
  { id: 'focus', name: 'Focus today' },
  { id: 'alarm', name: 'Next alarm' },
  { id: 'event', name: 'Next event' },
  { id: 'date', name: 'Date' },
];

const RING = 2 * Math.PI * 46;

/** One round lock widget: a thin ring (optional), a dot number, a tiny label. */
function Round({ ring, label, children }: { ring?: number; label: string; children: ReactNode }) {
  return (
    <div className={styles.round}>
      {ring !== undefined && (
        <svg className={styles.roundRing} viewBox="0 0 100 100" aria-hidden="true">
          <circle className={styles.roundTrack} cx="50" cy="50" r="46" />
          <circle
            className={styles.roundFill}
            cx="50"
            cy="50"
            r="46"
            strokeDasharray={`${RING * Math.max(0, Math.min(1, ring))} ${RING}`}
            transform="rotate(-90 50 50)"
          />
        </svg>
      )}
      <span className={styles.roundValue}>{children}</span>
      <span className={styles.roundLabel}>{label}</span>
    </div>
  );
}

const two = (value: number) => String(value).padStart(2, '0');

function LockWidget({ id }: { id: string }) {
  const now = useClock();
  const weather = useWeather().data;
  const battery = useBattery();
  const lockIn = useLockIn();
  useFocusSessions();
  const { alarms } = useAlarms();
  const { events } = useEvents();

  switch (id) {
    case 'weather':
      return (
        <Round label={weather ? `${weather.daily[0]?.low ?? '--'}° ${weather.daily[0]?.high ?? '--'}°` : 'Weather'}>
          <DotNumber value={weather ? `${weather.now.temperature}` : '--'} size={28} />
        </Round>
      );
    case 'battery':
      return (
        <Round ring={battery?.level ?? 0} label={battery?.charging ? 'Charging' : 'Battery'}>
          <DotNumber value={battery ? String(Math.round(battery.level * 100)) : '--'} size={28} narrowOne />
        </Round>
      );
    case 'focus': {
      const minutes = focusMinutesOn(now);
      return (
        <Round ring={minutes / Math.max(1, lockIn.dailyGoal)} label="Focus min">
          <DotNumber value={String(minutes)} size={28} narrowOne />
        </Round>
      );
    }
    case 'alarm': {
      const next = alarms
        .filter((alarm) => alarm.enabled)
        .map((alarm) => {
          const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), alarm.hour, alarm.minute);
          if (at <= now) at.setDate(at.getDate() + 1);
          return { alarm, at };
        })
        .sort((a, b) => a.at.getTime() - b.at.getTime())[0];
      return (
        <Round label={next ? 'Alarm' : 'Alarm off'}>
          <span className={styles.small}>{next ? `${two(next.alarm.hour)}:${two(next.alarm.minute)}` : '--:--'}</span>
        </Round>
      );
    }
    case 'event': {
      const event = nextEvent(events, now);
      return (
        <Round label={event ? event.title : 'No events'}>
          <span className={styles.small}>{event ? (event.time ?? 'Today') : 'Free'}</span>
        </Round>
      );
    }
    case 'date':
      return (
        <Round label={now.toLocaleDateString('en-GB', { month: 'short' })}>
          <DotNumber value={String(now.getDate())} size={28} />
        </Round>
      );
    default:
      return null;
  }
}

/** Up to four round widgets in a row under the lock clock. */
export function LockWidgets() {
  const { lockWidgets } = useSettings();
  if (lockWidgets.length === 0) return null;
  return (
    <div className={styles.widgets}>
      {lockWidgets.slice(0, 4).map((id) => (
        <LockWidget key={id} id={id} />
      ))}
    </div>
  );
}

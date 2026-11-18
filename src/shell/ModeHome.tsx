import { useEffect, useState } from 'react';
import { useAlarms } from '../apps/clock/alarmStore';
import { AppIcon } from '../components/AppIcon';
import { DotNumber } from '../components/DotNumber';
import { Button } from '../components/kit';
import { Pressable } from '../components/Pressable';
import { runAction } from '../system/actions';
import { getApp } from '../system/appRegistry';
import { formatDate, formatTime } from '../system/timeFormat';
import { useClock } from '../system/useClock';
import { useSettings } from '../system/settingsStore';
import type { ScreenRect } from './AppView';
import styles from './ModeHome.module.css';

/** Focus mode: only the essentials (SPECS / CLAUDE.md). */
const FOCUS_APPS = ['phone', 'messages', 'music', 'notes', 'clock'];
/** Wind Down: just what an evening needs. */
const WIND_DOWN_APPS = ['clock', 'lockin'];

const FOCUS_LOCK_KEY = 'vantage.focusLock.v1';

export function focusLockedUntil(): number {
  try {
    return Number(localStorage.getItem(FOCUS_LOCK_KEY)) || 0;
  } catch {
    return 0;
  }
}

/**
 * The simple home screen of Focus and Wind Down modes: a big clock, a few
 * apps, nothing else. Focus mode can lock itself for a while.
 */
export function ModeHome({ mode, onOpenApp }: { mode: 'focus' | 'winddown'; onOpenApp: (appId: string, from: ScreenRect | null) => void }) {
  const now = useClock();
  const settings = useSettings();
  const { alarms } = useAlarms();
  const [lockedUntil, setLockedUntil] = useState(focusLockedUntil);
  const [, setTick] = useState(0);
  const apps = (mode === 'focus' ? FOCUS_APPS : WIND_DOWN_APPS).map((id) => getApp(id)).filter((app) => app !== undefined);
  const next = alarms.filter((alarm) => alarm.enabled).map((alarm) => `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`)[0];
  const locked = lockedUntil > Date.now();

  useEffect(() => {
    if (!locked) return;
    const id = window.setInterval(() => setTick((tick) => tick + 1), 15_000);
    return () => window.clearInterval(id);
  }, [locked]);

  const lockFor = (minutes: number) => {
    const until = Date.now() + minutes * 60_000;
    localStorage.setItem(FOCUS_LOCK_KEY, String(until));
    setLockedUntil(until);
  };
  void settings;

  return (
    <div className={styles.home}>
      <div className={styles.clock}>
        <DotNumber value={formatTime(now)} size={96} clock blinkColon />
        <span className="label">{formatDate(now)}</span>
        {mode === 'winddown' && <span className={styles.note}>{next ? `Alarm ${next}` : 'No alarm set'}</span>}
      </div>
      <div className={styles.apps}>
        {apps.map((app) => (
          <Pressable key={app.id} className={styles.app} aria-label={app.name} onClick={(event) => onOpenApp(app.id, (event.currentTarget as HTMLElement).getBoundingClientRect())}>
            <AppIcon app={app} />
            <span className={styles.appName}>{app.name}</span>
          </Pressable>
        ))}
      </div>
      <div className={styles.footer}>
        {mode === 'focus' ? (
          locked ? (
            <span className={styles.note}>Focus is locked until {new Date(lockedUntil).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.</span>
          ) : (
            <>
              <div className={styles.row}>
                <Button onPress={() => lockFor(30)}>Lock 30 min</Button>
                <Button onPress={() => lockFor(60)}>Lock 1 h</Button>
              </div>
              <Button onPress={() => void runAction('mode.set', { mode: 'clean' })}>Leave Focus</Button>
            </>
          )
        ) : (
          <Button onPress={() => void runAction('mode.set', { mode: 'clean' })}>End Wind Down</Button>
        )}
      </div>
    </div>
  );
}

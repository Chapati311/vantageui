import { useState } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { BellIcon, PlusIcon } from '../../components/glyphs';
import { Button, EmptyState, SwipeToDelete, Toggle } from '../../components/kit';
import { motion } from 'motion/react';
import { pressState } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { AlarmEditor } from './AlarmEditor';
import { AlarmSoundsSheet } from './AlarmSoundsSheet';
import { newAlarm, untilNext, useAlarms, type Alarm } from './alarmStore';
import { useLockIn } from '../lockin/lockInStore';
import styles from './Clock.module.css';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const two = (value: number) => String(value).padStart(2, '0');

/**
 * Bedtime first: when you mean to sleep (from Wind Down), your next alarm
 * and how much sleep that leaves. Then the alarm cards, mornings first:
 * dot-matrix time, label, seven day dots, a switch. Tap to edit, swipe
 * left to delete.
 */
export function AlarmTab() {
  const { alarms: unsorted } = useAlarms();
  const { windDown } = useLockIn();
  const alarms = [...unsorted].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
  const sleep = windDown.sleep || '22:30';
  const [sleepH, sleepM] = sleep.split(':').map(Number);
  const firstMorning = alarms.find((alarm) => alarm.enabled && alarm.hour >= 4 && alarm.hour < 12);
  const sleepMinutes = firstMorning ? (firstMorning.hour * 60 + firstMorning.minute - (sleepH * 60 + sleepM) + 1440) % 1440 : null;
  const [editing, setEditing] = useState<Alarm | null>(null);
  const [soundsOpen, setSoundsOpen] = useState(false);

  return (
    <>
      <div className={styles.alarmActions}>
        <Button icon={BellIcon} onPress={() => setSoundsOpen(true)}>
          Sounds
        </Button>
        <Button icon={PlusIcon} onPress={() => setEditing(newAlarm())}>
          New alarm
        </Button>
      </div>

      {/* Bedtime: sleep target, wake-up alarm, and the sleep in between.
          Only with a real morning alarm (no "--:--" placeholders). */}
      {firstMorning && (
      <div className={styles.bedtime}>
        <span className={styles.bedtimePart}>
          <span className="label">Sleep</span>
          <DotNumber value={sleep} size={28} />
        </span>
        <span className={styles.bedtimeLine} aria-hidden="true" />
        <span className={styles.bedtimePart}>
          <span className="label">Wake</span>
          <DotNumber
            value={firstMorning ? `${two(firstMorning.hour)}:${two(firstMorning.minute)}` : '--:--'}
            size={28}
            muted={!firstMorning}
          />
        </span>
        <span className={styles.bedtimeNote}>
          {sleepMinutes !== null ? `${Math.floor(sleepMinutes / 60)} h ${sleepMinutes % 60} min of sleep` : 'No morning alarm on'}
        </span>
      </div>
      )}

      {alarms.length === 0 ? (
        <EmptyState
          icon={BellIcon}
          title="No alarms"
          message="Alarms ring while Vantage is open. Add one to Apple's Clock too, for when the phone sleeps."
        />
      ) : (
        <div className={styles.alarmList}>
          {alarms.map((alarm) => (
            <SwipeToDelete key={alarm.id} onDelete={() => void runAction('alarm.delete', { id: alarm.id })}>
              {/* A div, not a button: the switch inside is a button of its own */}
              <motion.div
                role="button"
                tabIndex={0}
                className={`${styles.alarmCard} ${alarm.enabled ? '' : styles.alarmOff}`}
                onClick={() => setEditing(alarm)}
                onKeyDown={(event) => event.key === 'Enter' && setEditing(alarm)}
                {...pressState}
              >
                <span className={styles.alarmTime}>
                  <DotNumber
                    value={`${two(alarm.hour)}:${two(alarm.minute)}`}
                    size={40}
                    clock
                    quietColon={!alarm.enabled}
                    muted={!alarm.enabled}
                  />
                  <span className={styles.alarmLabel}>{alarm.label || (alarm.enabled ? untilNext(alarm) : 'Off')}</span>
                </span>
                <span className={styles.alarmRight}>
                  <span className={styles.days} aria-label="Repeats on">
                    {DAY_LETTERS.map((letter, index) => (
                      <span key={index} className={alarm.days[index] ? styles.dayOn : styles.dayOff} title={letter} />
                    ))}
                  </span>
                  <span onClick={(event) => event.stopPropagation()}>
                    <Toggle
                      label={`Alarm ${two(alarm.hour)}:${two(alarm.minute)}`}
                      on={alarm.enabled}
                      onChange={(on) => void runAction('alarm.setEnabled', { id: alarm.id, enabled: on })}
                    />
                  </span>
                </span>
              </motion.div>
            </SwipeToDelete>
          ))}
        </div>
      )}

      <AlarmEditor alarm={editing} onClose={() => setEditing(null)} />
      <AlarmSoundsSheet open={soundsOpen} onClose={() => setSoundsOpen(false)} />
    </>
  );
}

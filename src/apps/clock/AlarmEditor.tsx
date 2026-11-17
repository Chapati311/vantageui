import { useEffect, useState } from 'react';
import { Button, Row, ScrollWheel, Section, Sheet } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { ALARM_SOUNDS, previewAlarmSound } from './alarmSounds';
import { addToIPhoneClock, useAlarms, type Alarm } from './alarmStore';
import styles from './Clock.module.css';

const HOURS = Array.from({ length: 24 }, (_, hour) => ({ value: hour, label: String(hour).padStart(2, '0') }));
const MINUTES = Array.from({ length: 60 }, (_, minute) => ({ value: minute, label: String(minute).padStart(2, '0') }));
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** The sheet for one alarm: time on scroll wheels, label, repeat days, sound. */
export function AlarmEditor({ alarm, onClose }: { alarm: Alarm | null; onClose: () => void }) {
  const { alarms, settings } = useAlarms();
  const [draft, setDraft] = useState<Alarm | null>(alarm);
  const [note, setNote] = useState<string | null>(null);
  const exists = alarm ? alarms.some((item) => item.id === alarm.id) : false;

  useEffect(() => {
    setDraft(alarm);
    setNote(null);
  }, [alarm]);

  const save = () => {
    if (!draft) return;
    void runAction('alarm.save', { alarm: { ...draft, enabled: true } });
    onClose();
  };

  return (
    <Sheet
      open={alarm !== null}
      onClose={onClose}
      title={exists ? 'Edit alarm' : 'New alarm'}
      action={
        <Button kind="primary" onPress={save}>
          Save
        </Button>
      }
    >
      {draft && (
        <>
          <div className={styles.wheels}>
            <ScrollWheel label="Hour" options={HOURS} value={draft.hour} onChange={(hour) => setDraft({ ...draft, hour })} />
            <span className={styles.wheelColon}>:</span>
            <ScrollWheel label="Minute" options={MINUTES} value={draft.minute} onChange={(minute) => setDraft({ ...draft, minute })} />
          </div>

          <input className={styles.input} placeholder="Label" aria-label="Label" value={draft.label} maxLength={32} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />

          <div className={styles.dayPicker} role="group" aria-label="Repeat on">
            {DAYS.map((day, index) => (
              <Pressable
                key={day}
                className={`${styles.dayButton} ${draft.days[index] ? styles.dayButtonOn : ''}`}
                aria-pressed={draft.days[index]}
                onClick={() => setDraft({ ...draft, days: draft.days.map((on, i) => (i === index ? !on : on)) })}
              >
                {day[0]}
              </Pressable>
            ))}
          </div>

          <Section label="Sound">
            {ALARM_SOUNDS.map((sound) => {
              const chosen = (draft.sound ?? settings.defaultSound) === sound.id;
              return (
                <Row
                  key={sound.id}
                  title={sound.name}
                  detail={sound.pack}
                  value={chosen ? 'Chosen' : undefined}
                  onPress={() => {
                    setDraft({ ...draft, sound: sound.id });
                    previewAlarmSound(sound.id, settings.volume);
                  }}
                />
              );
            })}
          </Section>

          <Button
            onPress={() => {
              const result = addToIPhoneClock(draft);
              setNote(result.ok ? 'Opening the CreateAlarm shortcut to set it in Clock.' : "Couldn't reach the CreateAlarm shortcut. Add it in the Shortcuts app first.");
            }}
          >
            Also set in iPhone Clock
          </Button>
          {note && <p className={styles.note}>{note}</p>}

          {exists && (
            <Button
              kind="destructive"
              onPress={() => {
                void runAction('alarm.delete', { id: draft.id });
                onClose();
              }}
            >
              Delete alarm
            </Button>
          )}
        </>
      )}
    </Sheet>
  );
}

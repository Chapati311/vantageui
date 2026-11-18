import { useEffect, useState } from 'react';
import { Button, Row, Section, SegmentedControl, Toggle } from '../../components/kit';
import { runAction } from '../../system/actions';
import { dayKey } from '../../system/events';
import { useClock } from '../../system/useClock';
import { useWeather } from '../../system/weather';
import { newAlarm, useAlarms } from '../clock/alarmStore';
import { AMBIENT, stopAllAmbient, toggleAmbient, useAmbient } from './ambient';
import { windDownActive } from './blocking';
import { updateLockIn, useLockIn } from './lockInStore';
import styles from './LockIn.module.css';

/**
 * Wind Down: a calm evening. On a schedule the phone warms and dims, the home
 * screen simplifies and distractions lock. The routine: tomorrow's alarm, a
 * one-line journal, top 3 for tomorrow, sleep sounds that fade out.
 * In the morning: a short summary.
 */
export function WindDownTab() {
  const data = useLockIn();
  const now = useClock();
  const plan = data.windDown;
  const today = dayKey(now);
  // The routine resets every evening
  const routine = plan.routineDate === today ? plan : { ...plan, journal: '', topThree: ['', '', ''] };
  const set = (patch: Partial<typeof plan>) => updateLockIn({ windDown: { ...routine, ...patch, routineDate: today } });
  const morning = now.getHours() >= 5 && now.getHours() < 12;

  return (
    <>
      {morning && <MorningSummary />}
      <Section label="Schedule" note={plan.enabled ? (windDownActive(now) ? 'Wind Down is on now.' : `Starts at ${plan.start} every evening, until 06:00.`) : undefined}>
        <Row title="Wind Down every evening" trailing={<Toggle label="Wind Down every evening" on={plan.enabled} onChange={(enabled) => set({ enabled })} />} />
      </Section>
      {plan.enabled && (
        <div className={styles.row}>
          <label className={styles.timeField}>
            <span className="label">Start</span>
            <input className={styles.input} type="time" value={plan.start} onChange={(e) => e.target.value && set({ start: e.target.value })} />
          </label>
          <label className={styles.timeField}>
            <span className="label">Sleep</span>
            <input className={styles.input} type="time" value={plan.sleep} onChange={(e) => e.target.value && set({ sleep: e.target.value })} />
          </label>
        </div>
      )}
      <Button onPress={() => void runAction('mode.set', { mode: 'winddown' })}>Wind down now</Button>

      <TomorrowAlarm />

      <Section label="One line about today" card={false}>
        <input className={styles.input} placeholder="Today I..." aria-label="Journal" value={routine.journal} maxLength={140} onChange={(e) => set({ journal: e.target.value })} />
      </Section>
      <Section label="Top 3 for tomorrow" card={false}>
        {routine.topThree.map((task, index) => (
          <input
            key={index}
            className={styles.input}
            placeholder={`${index + 1}.`}
            aria-label={`Task ${index + 1}`}
            value={task}
            maxLength={60}
            onChange={(e) => set({ topThree: routine.topThree.map((item, i) => (i === index ? e.target.value : item)) })}
          />
        ))}
      </Section>
      <SleepSounds />
    </>
  );
}

function TomorrowAlarm() {
  const { alarms } = useAlarms();
  const [time, setTime] = useState('07:00');
  const set = () => {
    const [hour, minute] = time.split(':').map(Number);
    void runAction('alarm.save', { alarm: { ...newAlarm(), hour, minute, label: 'Good morning' } });
  };
  const next = alarms.filter((alarm) => alarm.enabled);
  return (
    <Section label="Tomorrow's alarm" note={next.length ? `On: ${next.map((alarm) => `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`).join(', ')}. Gentle wake fades it in.` : 'No alarm set yet.'} card={false}>
      <div className={styles.row}>
        <input className={styles.input} type="time" aria-label="Alarm time" value={time} onChange={(e) => e.target.value && setTime(e.target.value)} />
        <Button onPress={set}>Set alarm</Button>
      </div>
    </Section>
  );
}

function SleepSounds() {
  const playing = useAmbient();
  const [minutes, setMinutes] = useState<'15' | '30' | '45'>('30');
  const [endsAt, setEndsAt] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) return;
    const timeout = window.setTimeout(() => {
      stopAllAmbient();
      setEndsAt(null);
    }, endsAt - Date.now());
    return () => window.clearTimeout(timeout);
  }, [endsAt]);

  return (
    <Section label="Sleep sounds" note={endsAt ? `Fades out at ${new Date(endsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.` : 'Pick a sound, then a timer.'} card={false}>
      <div className={styles.chips}>
        {AMBIENT.filter((sound) => ['rain', 'brown', 'fire', 'library'].includes(sound.id)).map((sound) => (
          <button key={sound.id} type="button" className={`${styles.chip} ${playing.some((item) => item.id === sound.id) ? styles.chipOn : ''}`} onClick={() => toggleAmbient(sound.id)}>
            {sound.name}
          </button>
        ))}
      </div>
      <SegmentedControl
        label="Fade out after"
        value={minutes}
        onChange={setMinutes}
        options={[
          { id: '15', label: '15 min' },
          { id: '30', label: '30 min' },
          { id: '45', label: '45 min' },
        ]}
      />
      <Button disabled={!playing.length} onPress={() => setEndsAt(Date.now() + Number(minutes) * 60_000)}>
        Start timer
      </Button>
    </Section>
  );
}

/** Good morning: weather, the first lesson, homework due today. */
export function MorningSummary() {
  const data = useLockIn();
  const { data: weather } = useWeather();
  const now = useClock();
  const today = dayKey(now);
  const weekday = (now.getDay() + 6) % 7;
  const first = data.lessons.filter((lesson) => lesson.day === weekday).sort((a, b) => a.start.localeCompare(b.start))[0];
  const firstSubject = data.subjects.find((subject) => subject.id === first?.subjectId);
  const due = data.homework.filter((item) => !item.done && item.due === today);
  return (
    <Section label="Good morning">
      <Row title="Weather" value={weather ? `${weather.now.temperature}° ${weather.now.condition}` : 'Loading'} />
      <Row title="First lesson" value={first ? `${firstSubject?.name} ${first.start}` : 'None today'} />
      <Row title="Homework due" value={due.length ? `${due.length}: ${due.map((item) => item.title).join(', ')}` : 'Nothing'} />
    </Section>
  );
}

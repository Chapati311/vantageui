import { useEffect, useState } from 'react';
import { DotNumber } from '../../../components/DotNumber';
import { Widget } from '../../../components/Widget';
import { SESSION_TYPES, phaseTime, startSession, useFocus } from '../../../apps/lockin/focusStore';
import { getSystem, gradeLabel, gradeStatus, roundGrade, weightedAverage } from '../../../apps/lockin/grading';
import { focusMinutesOn, streakDays, useFocusSessions } from '../../../apps/lockin/lockInStats';
import { useLockIn } from '../../../apps/lockin/lockInStore';
import { dayKey } from '../../../system/events';
import { useReminders } from '../../../system/reminders';
import { useClock } from '../../../system/useClock';
import type { WidgetProps } from '../types';
import styles from './ProductivityWidgets.module.css';

const RING = 2 * Math.PI * 44;

/** Today's focus as a ring (toward your daily goal) and your streak. One tap on "Lock in" starts a Pomodoro. */
export function LockInRingWidget({ size }: WidgetProps) {
  const small = size === '1x1';
  const data = useLockIn();
  useFocusSessions();
  const { session } = useFocus();
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(id);
  }, [session]);

  const today = focusMinutesOn(new Date());
  const fraction = Math.min(1, today / data.dailyGoal);
  const left = session ? phaseTime(session).left : 0;
  const pomodoro = SESSION_TYPES[0];

  return (
    <Widget shape={small ? 'circle' : 'rounded'}>
      <div className={`${styles.lockin} ${small ? styles.lockinSmall : ''}`}>
        <svg className={styles.lockinRing} viewBox="0 0 100 100" aria-hidden="true">
          <circle className={styles.ringTrack} cx="50" cy="50" r="44" />
          <circle className={session ? styles.ringFocus : styles.ringDone} cx="50" cy="50" r="44" strokeDasharray={`${RING * (session ? 1 - left / (session.plan.work * 60_000 || 1) : fraction)} ${RING}`} transform="rotate(-90 50 50)" />
        </svg>
        <div className={styles.lockinCenter}>
          {session ? (
            <>
              <DotNumber value={small ? String(Math.ceil(left / 60_000)) : `${String(Math.floor(left / 60_000)).padStart(2, '0')}:${String(Math.floor((left % 60_000) / 1000)).padStart(2, '0')}`} size={small ? 28 : 28} />
              {small && <span className={styles.ringCaption}>min left</span>}
            </>
          ) : (
            <>
              <DotNumber value={small ? String(Math.min(99, Math.round(fraction * 100))) : String(streakDays())} size={28} />
              {/* Says what the number is (DEVICE_QA P1-13): today's focus goal in %, or the streak */}
              {small ? <span className={styles.ringCaption}>focus %</span> : <span className="label">day streak</span>}
            </>
          )}
        </div>
        {!session && !small && (
          <button
            type="button"
            className={styles.lockinButton}
            onClick={(event) => {
              event.stopPropagation();
              startSession({ type: 'pomodoro', work: pomodoro.work, rest: pomodoro.rest, rounds: pomodoro.rounds, longRest: pomodoro.longRest, tag: '', goal: '', strict: false });
            }}
          >
            Focus
          </button>
        )}
      </div>
    </Widget>
  );
}

/** Pixel plant stages: it grows one stage per streak day (up to 6). */
const PLANT = [
  ['.......', '.......', '.......', '.......', '.......', '...1...', '.11111.'],
  ['.......', '.......', '.......', '.......', '...1...', '...1...', '.11111.'],
  ['.......', '.......', '.......', '..1.1..', '...1...', '...1...', '.11111.'],
  ['.......', '.......', '.11.11.', '..1.1..', '...1...', '...1...', '.11111.'],
  ['.......', '...1...', '.11111.', '.11.11.', '..111..', '...1...', '.11111.'],
  ['..111..', '.11111.', '1111111', '.11111.', '..111..', '...1...', '.11111.'],
  ['.1.1.1.', '1111111', '1111111', '.11111.', '..111..', '...1...', '.11111.'],
];

/** A plant that grows with your Lock In streak (and wilts back to a seed if you skip a day). */
export function PlantWidget() {
  useFocusSessions();
  const streak = streakDays();
  const stage = PLANT[Math.min(PLANT.length - 1, streak)];
  return (
    <Widget shape="rounded">
      <div className={styles.plant}>
        <svg className={styles.plantArt} viewBox="0 0 7 7" role="img" aria-label={`Plant, ${streak} day streak`}>
          {stage.flatMap((row, y) =>
            [...row].map((value, x) => (
              <rect key={`${x}-${y}`} x={x + 0.08} y={y + 0.08} width="0.84" height="0.84" className={value === '1' ? (y === 6 ? styles.pot : styles.leaf) : styles.plantOff} />
            )),
          )}
        </svg>
        <span className="label">{streak === 0 ? 'Focus today to plant it' : `${streak} day${streak === 1 ? '' : 's'}`}</span>
      </div>
    </Widget>
  );
}

/** The next lesson from your timetable. */
export function NextLessonWidget() {
  const data = useLockIn();
  const now = useClock();
  const weekday = (now.getDay() + 6) % 7;
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const sorted = [...data.lessons].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
  const next = sorted.find((lesson) => lesson.day === weekday && lesson.end > time) ?? sorted.find((lesson) => lesson.day > weekday) ?? sorted[0];
  const subject = data.subjects.find((item) => item.id === next?.subjectId);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <Widget shape="rounded">
      <div className={styles.info}>
        <span className="label">{next ? (next.day === weekday ? (next.start <= time ? 'Now' : 'Next') : days[next.day]) : 'Next lesson'}</span>
        {next && subject ? (
          <>
            <span className={styles.infoTitle}>
              <span className={styles.dot} style={{ background: subject.color }} />
              {subject.name}
            </span>
            <span className={styles.infoDetail}>
              {next.start}-{next.end}
              {next.room ? ` · ${next.room}` : ''}
            </span>
          </>
        ) : (
          <span className={styles.infoDetail}>Add your week in Focus</span>
        )}
      </div>
    </Widget>
  );
}

/** Homework due soonest. */
export function HomeworkWidget() {
  const data = useLockIn();
  const now = useClock();
  const today = dayKey(now);
  const open = data.homework.filter((item) => !item.done).sort((a, b) => a.due.localeCompare(b.due));
  return (
    <Widget shape="rounded">
      <div className={styles.info}>
        <span className="label">Homework</span>
        {open.length ? (
          open.slice(0, 2).map((item) => (
            <span key={item.id} className={`${styles.infoLine} ${item.due < today ? styles.overdue : ''}`}>
              {item.title}
              <span className={styles.infoDetail}>{item.due === today ? 'today' : item.due < today ? 'overdue' : new Date(`${item.due}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short' })}</span>
            </span>
          ))
        ) : (
          <span className={styles.infoDetail}>All done</span>
        )}
      </div>
    </Widget>
  );
}

/** Your overall grade average, colored by how it is going. */
export function GradeAverageWidget() {
  const data = useLockIn();
  const system = getSystem(data.gradingSystemId, data.customSystems);
  const averages = data.subjects
    .map((subject) => weightedAverage(data.grades.filter((grade) => grade.subjectId === subject.id).map((grade) => ({ value: grade.value, weight: grade.weight }))))
    .filter((value): value is number => value !== null)
    .map((value) => roundGrade(value, system));
  const overall = weightedAverage(averages.map((value) => ({ value, weight: 1 })));
  return (
    <Widget shape="circle">
      <div className={styles.average}>
        <span className="label">Average</span>
        <span className={`${styles.averageValue} ${overall !== null ? styles[gradeStatus(overall, system)] : ''}`}>
          {overall !== null ? gradeLabel(roundGrade(overall, system), system) : '--'}
        </span>
      </div>
    </Widget>
  );
}

/** Reminders for today (and overdue ones). */
export function RemindersWidget() {
  const { reminders } = useReminders();
  const now = useClock();
  const today = dayKey(now);
  const open = reminders.filter((item) => !item.done && (!item.date || item.date <= today));
  return (
    <Widget shape="rounded">
      <div className={styles.info}>
        <span className="label">Reminders · {open.length}</span>
        {open.length ? (
          open.slice(0, 3).map((item) => (
            <span key={item.id} className={styles.infoLine}>
              <span className={styles.circle} />
              {item.title}
            </span>
          ))
        ) : (
          <span className={styles.infoDetail}>Nothing for today</span>
        )}
      </div>
    </Widget>
  );
}

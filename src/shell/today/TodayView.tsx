import { AnimatePresence, motion } from 'motion/react';
import { memo, useMemo, useState } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { Pressable } from '../../components/Pressable';
import { Temperature } from '../../components/Temperature';
import { focusMinutesOn, useFocusSessions } from '../../apps/lockin/lockInStats';
import { useLockIn } from '../../apps/lockin/lockInStore';
import { runAction } from '../../system/actions';
import { dayKey, useEvents } from '../../system/events';
import { useSettings } from '../../system/settingsStore';
import { useClock } from '../../system/useClock';
import { useWeather } from '../../system/weather';
import { SPRING } from '../../theme/tokens';
import { quoteOfTheDay } from '../widgets/info/quotes';
import { formatMinutes, planDay, toMinutes, type PlanItem } from './planDay';
import styles from './TodayView.module.css';

const RING = 2 * Math.PI * 44;
const dateFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

function greeting(hour: number): string {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Today: one swipe right of home page 1. A greeting with your name, the
 * weather, what's next (lessons and events), homework due, today's focus
 * ring, a quote, and "Plan my day", which lays out the rest of the day.
 */
export const TodayView = memo(TodayViewImpl);

function TodayViewImpl({ onOpenApp }: { onOpenApp: (appId: string) => void }) {
  const now = useClock();
  const settings = useSettings();
  const lockIn = useLockIn();
  useFocusSessions();
  const { events } = useEvents();
  const weather = useWeather().data;
  const [planOpen, setPlanOpen] = useState(false);

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const weekday = (now.getDay() + 6) % 7; // 0 = Monday
  const today = dayKey(now);
  const subjectName = (id: string) => lockIn.subjects.find((subject) => subject.id === id)?.name ?? 'Lesson';

  // Lessons and timed events still to come today
  const fixed = useMemo(
    () =>
      [
        ...lockIn.lessons
          .filter((lesson) => lesson.day === weekday)
          .map((lesson) => ({
            title: subjectName(lesson.subjectId),
            start: toMinutes(lesson.start),
            end: toMinutes(lesson.end),
            kind: 'lesson' as const,
          })),
        ...events
          .filter((event) => event.date === today && event.time)
          .map((event) => ({
            title: event.title,
            start: toMinutes(event.time!),
            end: toMinutes(event.time!) + (event.duration || 30),
            kind: 'event' as const,
          })),
      ].sort((a, b) => a.start - b.start),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lockIn.lessons, lockIn.subjects, events, weekday, today],
  );
  const upcoming = fixed.filter((item) => item.end > minutesNow).slice(0, 2);
  const homework = lockIn.homework.filter((item) => !item.done).sort((a, b) => a.due.localeCompare(b.due));
  const dueSoon = homework.filter((item) => item.due <= dayKey(new Date(now.getTime() + 86_400_000)));
  const focusToday = focusMinutesOn(now);
  const fraction = Math.min(1, focusToday / Math.max(1, lockIn.dailyGoal));
  const quote = quoteOfTheDay(now);

  const plan: PlanItem[] = planOpen
    ? planDay({
        now,
        fixed,
        homework: homework.map((item) => ({ title: `${subjectName(item.subjectId)}: ${item.title}`, due: item.due })),
        windDown: lockIn.windDown.start || '21:30',
      })
    : [];

  return (
    <div className={styles.today}>
      <header className={styles.header}>
        <p className="label">{dateFormat.format(now)}</p>
        <h1 className={styles.hello}>
          {greeting(now.getHours())}
          {settings.userName ? `, ${settings.userName}` : ''}
        </h1>
      </header>

      <div className={styles.row}>
        <Pressable className={styles.card} onClick={() => onOpenApp('weather')} aria-label="Weather">
          <span className="label">{weather?.place ?? 'Weather'}</span>
          {weather ? (
            <>
              <Temperature value={weather.now.temperature} size={40} />
              <span className={styles.detail}>
                {weather.now.condition} · {weather.daily[0]?.high ?? '--'}° / {weather.daily[0]?.low ?? '--'}°
              </span>
            </>
          ) : (
            <span className={styles.detail}>Weather loads when you're online.</span>
          )}
        </Pressable>
        <Pressable
          className={`${styles.card} ${styles.focus}`}
          onClick={() => onOpenApp('lockin')}
          aria-label={`Focus today: ${focusToday} of ${lockIn.dailyGoal} minutes`}
        >
          <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
            <circle className={styles.track} cx="50" cy="50" r="44" />
            <circle
              className={styles.fill}
              cx="50"
              cy="50"
              r="44"
              strokeDasharray={`${RING * fraction} ${RING}`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <span className={styles.ringCenter}>
            <DotNumber value={String(focusToday)} size={28} />
            <span className="label">of {lockIn.dailyGoal} min</span>
          </span>
        </Pressable>
      </div>

      <Pressable
        className={styles.card}
        onClick={() => onOpenApp(upcoming[0]?.kind === 'event' ? 'calendar' : 'lockin')}
        aria-label="Next up"
      >
        <span className="label">Next up</span>
        {upcoming.length ? (
          upcoming.map((item) => (
            <span key={`${item.title}${item.start}`} className={styles.line}>
              <span className={styles.time}>{formatMinutes(item.start)}</span>
              <span className={styles.what}>{item.title}</span>
            </span>
          ))
        ) : (
          <span className={styles.detail}>Nothing else on the timetable today.</span>
        )}
      </Pressable>

      <Pressable className={styles.card} onClick={() => onOpenApp('lockin')} aria-label="Homework due">
        <span className="label">Homework due</span>
        {dueSoon.length ? (
          <span className={styles.line}>
            <DotNumber value={String(dueSoon.length)} size={28} />
            <span className={styles.what}>{dueSoon[0].title}</span>
          </span>
        ) : (
          <span className={styles.detail}>
            {homework.length ? `Nothing due by tomorrow. ${homework.length} open later.` : 'All done. Nothing open.'}
          </span>
        )}
      </Pressable>

      <p className={styles.quote}>
        “{quote.text}” <span className={styles.by}>{quote.by}</span>
      </p>

      <Pressable className={styles.plan} style={{ visibility: planOpen ? 'hidden' : undefined }} onClick={() => setPlanOpen(true)}>
        Plan my day
      </Pressable>

      {/* The plan slides up over Today */}
      <AnimatePresence>
        {planOpen && (
          <motion.div
            className={styles.sheet}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={SPRING.sheet}
            data-no-gesture
          >
            <div className={styles.sheetHead}>
              <h2 className={styles.sheetTitle}>Your day</h2>
              <Pressable className={`label ${styles.close}`} onClick={() => setPlanOpen(false)}>
                Done
              </Pressable>
            </div>
            <ol className={styles.timeline}>
              {plan.map((item, index) => (
                <li
                  key={`${item.start}${item.title}`}
                  className={`${styles.step} ${styles[item.kind]}`}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <span className={styles.time}>{formatMinutes(item.start)}</span>
                  <span className={styles.dot} aria-hidden="true" />
                  <span className={styles.what}>{item.title}</span>
                  {item.kind === 'focus' && (
                    <Pressable
                      className={`label ${styles.start}`}
                      onClick={() => {
                        void runAction('app.open', { appId: 'lockin' });
                        setPlanOpen(false);
                      }}
                    >
                      Focus
                    </Pressable>
                  )}
                </li>
              ))}
            </ol>
            {homework.length === 0 && (
              <p className={styles.detail}>No open homework, so the plan only has your fixed times. Add homework in Focus.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

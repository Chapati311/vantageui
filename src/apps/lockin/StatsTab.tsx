import { DotNumber } from '../../components/DotNumber';
import { EmptyState, Row, Section } from '../../components/kit';
import { useClock } from '../../system/useClock';
import { getSystem, gradeLabel, roundGrade, weightedAverage } from './grading';
import { streakDays, useFocusSessions } from './lockInStats';
import { useLockIn } from './lockInStore';
import styles from './LockIn.module.css';

const dayName = (date: Date) => date.toLocaleDateString('en-GB', { weekday: 'narrow' });
const hours = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

/** Focus hours per day and per subject, streaks, grade averages and a weekly review. */
export function StatsTab() {
  const sessions = useFocusSessions();
  const data = useLockIn();
  const now = useClock();
  const system = getSystem(data.gradingSystemId, data.customSystems);

  const minutesOn = (date: Date) =>
    sessions.filter((session) => new Date(session.startedAt).toDateString() === date.toDateString()).reduce((sum, session) => sum + session.minutes, 0);
  const days = Array.from({ length: 7 }, (_, index) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index));
  const perDay = days.map(minutesOn);
  const most = Math.max(60, ...perDay);
  const thisWeek = perDay.reduce((a, b) => a + b, 0);
  const lastWeek = Array.from({ length: 7 }, (_, index) => minutesOn(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13 + index))).reduce((a, b) => a + b, 0);
  const tags = new Map<string, number>();
  sessions.forEach((session) => tags.set(session.tag || 'No tag', (tags.get(session.tag || 'No tag') ?? 0) + session.minutes));
  const reached = sessions.filter((session) => session.result === 'done').length;
  const rated = sessions.filter((session) => session.result).length;

  if (sessions.length === 0 && data.grades.length === 0) {
    return <EmptyState title="No stats yet" message="Finish a focus session and your week shows up here." />;
  }

  return (
    <>
      <div className={styles.statRow}>
        <div className={styles.stat}>
          <DotNumber value={String(streakDays())} size={40} />
          <span className="label">Day streak</span>
        </div>
        <div className={styles.stat}>
          <DotNumber value={String(Math.round(thisWeek / 60))} size={40} />
          <span className="label">Hours this week</span>
        </div>
      </div>

      <Section label="Last 7 days" card={false}>
        <div className={styles.bars} role="img" aria-label={`Focus per day: ${perDay.join(', ')} minutes`}>
          {perDay.map((minutes, index) => (
            <div key={index} className={styles.barColumn}>
              <div className={styles.barDots}>
                {Array.from({ length: 8 }, (_, dot) => (
                  <span key={dot} className={7 - dot < Math.round((minutes / most) * 8) ? (index === 6 ? styles.barToday : styles.barOn) : styles.barOff} />
                ))}
              </div>
              <span className="label">{dayName(days[index])}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Weekly review">
        <Row title="This week" value={hours(thisWeek)} />
        <Row title="Last week" value={hours(lastWeek)} />
        <Row title="Change" value={lastWeek ? `${thisWeek >= lastWeek ? '+' : ''}${Math.round(((thisWeek - lastWeek) / lastWeek) * 100)}%` : 'New'} />
        {rated > 0 && <Row title="Goals reached" value={`${reached} of ${rated}`} />}
      </Section>

      {tags.size > 0 && (
        <Section label={data.role === 'student' ? 'Per subject' : 'Per project'}>
          {[...tags.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([tag, minutes]) => (
              <Row key={tag} title={tag} value={hours(minutes)} />
            ))}
        </Section>
      )}

      {data.subjects.length > 0 && data.grades.length > 0 && (
        <Section label="Grade averages">
          {data.subjects.map((subject) => {
            const average = weightedAverage(data.grades.filter((grade) => grade.subjectId === subject.id).map((grade) => ({ value: grade.value, weight: grade.weight })));
            return <Row key={subject.id} title={subject.name} value={average !== null ? gradeLabel(roundGrade(average, system), system) : '--'} />;
          })}
        </Section>
      )}
    </>
  );
}

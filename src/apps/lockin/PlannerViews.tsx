import { useState } from 'react';
import { PlusIcon } from '../../components/glyphs';
import { Button, EmptyState, Row, Section, SegmentedControl, Sheet, SwipeToDelete } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { dayKey } from '../../system/events';
import { saveReminder, newReminder } from '../../system/reminders';
import { useClock } from '../../system/useClock';
import { useFocusSessions } from './lockInStats';
import { newId, upsert, useLockIn, type Exam, type Homework, type Lesson, type WorkTask } from './lockInStore';
import styles from './LockIn.module.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const shortDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const daysUntil = (date: string, from: Date) =>
  Math.round((new Date(`${date}T00:00:00`).getTime() - new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()) / 86_400_000);

function SubjectPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { subjects } = useLockIn();
  return (
    <div className={styles.chips}>
      {subjects.map((subject) => (
        <Pressable key={subject.id} className={`${styles.chip} ${value === subject.id ? styles.chipOn : ''}`} onClick={() => onChange(subject.id)}>
          <span className={styles.chipDot} style={{ background: subject.color }} />
          {subject.name}
        </Pressable>
      ))}
    </div>
  );
}

/** The week as a grid: one column per school day, lessons as colored blocks. */
export function TimetableView() {
  const data = useLockIn();
  const now = useClock();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Lesson>({ id: '', subjectId: '', day: 0, start: '08:00', end: '08:45', room: '' });
  const today = (now.getDay() + 6) % 7;
  const subjectOf = (id: string) => data.subjects.find((subject) => subject.id === id);

  if (!data.subjects.length) return <EmptyState title="No subjects yet" message="Add subjects in Grades first, then fill your week." />;

  return (
    <>
      <div className={styles.week}>
        {DAYS.map((day, index) => (
          <div key={day} className={`${styles.weekDay} ${index === today ? styles.weekToday : ''}`}>
            <span className="label">{day}</span>
            {data.lessons
              .filter((lesson) => lesson.day === index)
              .sort((a, b) => a.start.localeCompare(b.start))
              .map((lesson) => {
                const subject = subjectOf(lesson.subjectId);
                return (
                  <Pressable key={lesson.id} className={styles.lesson} style={{ borderColor: subject?.color }} onClick={() => upsert('lessons', lesson, true)} aria-label={`${subject?.name} ${lesson.start}. Tap to remove`}>
                    <span className={styles.lessonTime}>{lesson.start}</span>
                    <span className={styles.lessonName}>{subject?.glyph ?? '?'}</span>
                  </Pressable>
                );
              })}
          </div>
        ))}
      </div>
      <p className={styles.planNote}>Tap a lesson to remove it.</p>
      <Button icon={PlusIcon} onPress={() => setAdding(true)}>
        Add a lesson
      </Button>
      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title="Lesson"
        action={
          <Button
            kind="primary"
            disabled={!draft.subjectId || draft.end <= draft.start}
            onPress={() => {
              upsert('lessons', { ...draft, id: newId('les') });
              setAdding(false);
            }}
          >
            Add
          </Button>
        }
      >
        <SubjectPicker value={draft.subjectId} onChange={(subjectId) => setDraft({ ...draft, subjectId })} />
        <SegmentedControl label="Day" value={String(draft.day)} onChange={(value) => setDraft({ ...draft, day: Number(value) })} options={DAYS.map((day, index) => ({ id: String(index), label: day }))} />
        <div className={styles.row}>
          <input className={styles.input} type="time" aria-label="Starts" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
          <input className={styles.input} type="time" aria-label="Ends" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
        </div>
        <input className={styles.input} placeholder="Room (optional)" aria-label="Room" value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} />
      </Sheet>
    </>
  );
}

/** Homework: due dates, overdue in red, swipe to complete. */
export function HomeworkView() {
  const data = useLockIn();
  const now = useClock();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Homework>({ id: '', subjectId: '', title: '', due: dayKey(new Date(Date.now() + 86_400_000)), done: false });
  const [remind, setRemind] = useState(true);
  const open = data.homework.filter((item) => !item.done).sort((a, b) => a.due.localeCompare(b.due));
  const today = dayKey(now);

  return (
    <>
      {open.length === 0 ? (
        <EmptyState title="All done" message="No homework waiting." action={{ label: 'Add homework', onPress: () => setAdding(true) }} />
      ) : (
        <Section label="To do" note="Swipe left when it is done.">
          {open.map((item) => {
            const subject = data.subjects.find((entry) => entry.id === item.subjectId);
            const overdue = item.due < today;
            return (
              <SwipeToDelete key={item.id} label="Done" onDelete={() => upsert('homework', { ...item, done: true })}>
                <Row
                  icon={<span className={styles.glyph} style={{ background: subject?.color }}>{subject?.glyph}</span>}
                  title={item.title}
                  detail={subject?.name}
                  value={<span className={overdue ? styles.bad : undefined}>{item.due === today ? 'Today' : overdue ? `Overdue · ${shortDate(item.due)}` : shortDate(item.due)}</span>}
                />
              </SwipeToDelete>
            );
          })}
        </Section>
      )}
      {open.length > 0 && (
        <Button icon={PlusIcon} onPress={() => setAdding(true)}>
          Add homework
        </Button>
      )}
      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title="Homework"
        action={
          <Button
            kind="primary"
            disabled={!draft.title.trim() || !draft.subjectId}
            onPress={() => {
              const item = { ...draft, id: newId('hw'), title: draft.title.trim() };
              upsert('homework', item);
              if (remind) {
                // A reminder the evening before, in the Reminders app
                const before = new Date(`${item.due}T00:00:00`);
                before.setDate(before.getDate() - 1);
                void saveReminder({ ...newReminder(), title: `Homework: ${item.title}`, date: dayKey(before), time: '18:00' });
              }
              setDraft({ ...draft, title: '' });
              setAdding(false);
            }}
          >
            Add
          </Button>
        }
      >
        {data.subjects.length === 0 ? <p className={styles.planNote}>Add subjects in Grades first.</p> : <SubjectPicker value={draft.subjectId} onChange={(subjectId) => setDraft({ ...draft, subjectId })} />}
        <input className={styles.input} placeholder="What to do" aria-label="Homework" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <input className={styles.input} type="date" aria-label="Due" value={draft.due} onChange={(e) => e.target.value && setDraft({ ...draft, due: e.target.value })} />
        <SegmentedControl
          label="Reminder"
          value={remind ? 'yes' : 'no'}
          onChange={(value) => setRemind(value === 'yes')}
          options={[
            { id: 'yes', label: 'Remind me the day before' },
            { id: 'no', label: 'No reminder' },
          ]}
        />
      </Sheet>
    </>
  );
}

/** Exam countdowns, each with a study plan made of focus sessions. */
export function ExamsView() {
  const data = useLockIn();
  const now = useClock();
  const sessions = useFocusSessions();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Exam>({ id: '', subjectId: '', title: '', date: dayKey(new Date(Date.now() + 7 * 86_400_000)), minutesPerDay: 45 });
  const upcoming = data.exams.filter((exam) => daysUntil(exam.date, now) >= 0).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      {upcoming.length === 0 ? (
        <EmptyState title="No exams" message="Add one and Focus plans your study sessions." action={{ label: 'Add an exam', onPress: () => setAdding(true) }} />
      ) : (
        upcoming.map((exam) => {
          const subject = data.subjects.find((entry) => entry.id === exam.subjectId);
          const left = daysUntil(exam.date, now);
          // One study day per day until the exam (not the exam day itself)
          const plan = Array.from({ length: Math.min(left, 14) }, (_, index) => {
            const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + index);
            const key = dayKey(day);
            const done = sessions.filter((session) => dayKey(new Date(session.startedAt)) === key && session.tag === subject?.name).reduce((sum, session) => sum + session.minutes, 0);
            return { key, day, done };
          });
          return (
            <SwipeToDelete key={exam.id} onDelete={() => upsert('exams', exam, true)}>
              <div className={styles.examCard}>
                <div className={styles.examHead}>
                  <span className={styles.glyph} style={{ background: subject?.color }}>{subject?.glyph}</span>
                  <span className={styles.examTitle}>{exam.title || subject?.name}</span>
                  <span className={styles.examDays}>{left === 0 ? 'Today' : `${left} day${left === 1 ? '' : 's'}`}</span>
                </div>
                <span className="label">Study plan · {exam.minutesPerDay} min a day, tag "{subject?.name}"</span>
                <div className={styles.planDots}>
                  {plan.map((item) => (
                    <span
                      key={item.key}
                      title={`${shortDate(item.key)}: ${item.done} of ${exam.minutesPerDay} min`}
                      className={item.done >= exam.minutesPerDay ? styles.planDone : item.done > 0 ? styles.planPart : styles.planOpen}
                    />
                  ))}
                </div>
              </div>
            </SwipeToDelete>
          );
        })
      )}
      {upcoming.length > 0 && (
        <Button icon={PlusIcon} onPress={() => setAdding(true)}>
          Add an exam
        </Button>
      )}
      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title="Exam"
        action={
          <Button
            kind="primary"
            disabled={!draft.subjectId}
            onPress={() => {
              upsert('exams', { ...draft, id: newId('ex'), title: draft.title.trim() });
              setAdding(false);
            }}
          >
            Add
          </Button>
        }
      >
        {data.subjects.length === 0 ? <p className={styles.planNote}>Add subjects in Grades first.</p> : <SubjectPicker value={draft.subjectId} onChange={(subjectId) => setDraft({ ...draft, subjectId })} />}
        <input className={styles.input} placeholder="Topic (optional)" aria-label="Topic" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <input className={styles.input} type="date" aria-label="Exam date" value={draft.date} onChange={(e) => e.target.value && setDraft({ ...draft, date: e.target.value })} />
        <SegmentedControl
          label="Study per day"
          value={String(draft.minutesPerDay)}
          onChange={(value) => setDraft({ ...draft, minutesPerDay: Number(value) })}
          options={[
            { id: '25', label: '25 min' },
            { id: '45', label: '45 min' },
            { id: '60', label: '60 min' },
            { id: '90', label: '90 min' },
          ]}
        />
      </Sheet>
    </>
  );
}

/** Work mode: tasks per project, with priority and deadline, and time tracked from focus sessions. */
export function TasksView() {
  const data = useLockIn();
  const sessions = useFocusSessions();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<WorkTask>({ id: '', projectId: '', title: '', priority: 'normal', deadline: null, done: false });
  const open = data.tasks.filter((task) => !task.done);
  const order = { high: 0, normal: 1, low: 2 };

  return (
    <>
      {data.subjects.length > 0 && (
        <Section label="Time tracked">
          {data.subjects.map((project) => {
            const minutes = sessions.filter((session) => session.tag === project.name).reduce((sum, session) => sum + session.minutes, 0);
            return <Row key={project.id} icon={<span className={styles.glyph} style={{ background: project.color }}>{project.glyph}</span>} title={project.name} value={`${Math.floor(minutes / 60)}h ${minutes % 60}m`} />;
          })}
        </Section>
      )}
      {open.length === 0 ? (
        <EmptyState title="Nothing open" message="Add tasks to your projects." action={{ label: 'Add a task', onPress: () => setAdding(true) }} />
      ) : (
        <Section label="Tasks" note="Swipe left when it is done.">
          {[...open]
            .sort((a, b) => order[a.priority] - order[b.priority] || (a.deadline ?? '9').localeCompare(b.deadline ?? '9'))
            .map((task) => {
              const project = data.subjects.find((entry) => entry.id === task.projectId);
              return (
                <SwipeToDelete key={task.id} label="Done" onDelete={() => upsert('tasks', { ...task, done: true })}>
                  <Row
                    icon={<span className={styles.glyph} style={{ background: project?.color }}>{task.priority === 'high' ? '!' : project?.glyph}</span>}
                    title={task.title}
                    detail={project?.name}
                    value={task.deadline ? shortDate(task.deadline) : undefined}
                  />
                </SwipeToDelete>
              );
            })}
        </Section>
      )}
      {open.length > 0 && (
        <Button icon={PlusIcon} onPress={() => setAdding(true)}>
          Add a task
        </Button>
      )}
      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title="Task"
        action={
          <Button
            kind="primary"
            disabled={!draft.title.trim() || !draft.projectId}
            onPress={() => {
              upsert('tasks', { ...draft, id: newId('task'), title: draft.title.trim() });
              setDraft({ ...draft, title: '' });
              setAdding(false);
            }}
          >
            Add
          </Button>
        }
      >
        {data.subjects.length === 0 ? <p className={styles.planNote}>Add a project first.</p> : <SubjectPicker value={draft.projectId} onChange={(projectId) => setDraft({ ...draft, projectId })} />}
        <input className={styles.input} placeholder="Task" aria-label="Task" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <SegmentedControl
          label="Priority"
          value={draft.priority}
          onChange={(priority) => setDraft({ ...draft, priority })}
          options={[
            { id: 'high', label: 'High' },
            { id: 'normal', label: 'Normal' },
            { id: 'low', label: 'Low' },
          ]}
        />
        <input className={styles.input} type="date" aria-label="Deadline" value={draft.deadline ?? ''} onChange={(e) => setDraft({ ...draft, deadline: e.target.value || null })} />
      </Sheet>
    </>
  );
}

/** Work mode's projects (they take the place of school subjects). */
export function ProjectsView({ onAdd }: { onAdd: () => void }) {
  const { subjects } = useLockIn();
  if (!subjects.length) return <EmptyState title="No projects" message="Projects group your tasks and focus time." action={{ label: 'Add a project', onPress: onAdd }} />;
  return (
    <>
      <Section label="Projects" note="Tag focus sessions with a project to track its time.">
        {subjects.map((project) => (
          <SwipeToDelete key={project.id} onDelete={() => upsert('subjects', project, true)}>
            <Row icon={<span className={styles.glyph} style={{ background: project.color }}>{project.glyph}</span>} title={project.name} />
          </SwipeToDelete>
        ))}
      </Section>
      <Button icon={PlusIcon} onPress={onAdd}>
        Add a project
      </Button>
    </>
  );
}

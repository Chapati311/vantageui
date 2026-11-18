import { useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { BackIcon, PlusIcon } from '../../components/glyphs';
import { Button, EmptyState, Row, Section, SegmentedControl, Sheet, SwipeToDelete, Toggle } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { dayKey } from '../../system/events';
import {
  GRADING_SYSTEMS,
  checkPromotion,
  getSystem,
  gradeLabel,
  gradeNeeded,
  gradeStatus,
  roundGrade,
  trend,
  weightedAverage,
  type GradingSystem,
} from './grading';
import { SUBJECT_COLORS, newId, updateLockIn, upsert, useLockIn, type Grade, type GradeType, type Subject } from './lockInStore';
import styles from './LockIn.module.css';

const STATUS_CLASS = { good: styles.good, close: styles.close, bad: styles.bad };

/** Averages per subject and overall, promotion status, and each subject's grades. */
export function GradesView() {
  const data = useLockIn();
  const system = getSystem(data.gradingSystemId, data.customSystems);
  const [openSubject, setOpenSubject] = useState<string | null>(null);
  const [addingSubject, setAddingSubject] = useState(false);
  const [systemSheet, setSystemSheet] = useState(false);

  const averageOf = (subjectId: string) =>
    weightedAverage(data.grades.filter((grade) => grade.subjectId === subjectId).map((grade) => ({ value: grade.value, weight: grade.weight })));
  const subjectAverages = data.subjects.map((subject) => averageOf(subject.id)).filter((value): value is number => value !== null);
  const rounded = subjectAverages.map((value) => roundGrade(value, system));
  const overall = weightedAverage(rounded.map((value) => ({ value, weight: 1 })));
  const promotion = rounded.length ? checkPromotion(rounded, system, data.rules) : null;

  const subject = data.subjects.find((item) => item.id === openSubject);
  if (subject) return <SubjectDetail subject={subject} system={system} onBack={() => setOpenSubject(null)} />;

  return (
    <>
      <div className={styles.summary}>
        <div className={styles.summaryNumber}>
          <span className="label">Average</span>
          {overall !== null ? (
            <span className={`${styles.big} ${STATUS_CLASS[gradeStatus(overall, system)]}`}>{gradeLabel(roundGrade(overall, system), system)}</span>
          ) : (
            <span className={styles.big}>--</span>
          )}
        </div>
        <div className={styles.summaryText}>
          {promotion ? (
            <>
              <span className={`${styles.badge} ${promotion.status === 'promoted' ? styles.good : promotion.status === 'edge' ? styles.close : styles.bad}`}>
                {promotion.status === 'promoted' ? 'Promoted' : promotion.status === 'edge' ? 'On the edge' : 'At risk'}
              </span>
              <span className={styles.small}>{promotion.reasons[0]}</span>
            </>
          ) : (
            <span className={styles.small}>Add subjects and grades to see your average.</span>
          )}
          <button type="button" className={styles.link} onClick={() => setSystemSheet(true)}>
            {system.name}
          </button>
        </div>
      </div>

      {data.subjects.length === 0 ? (
        <EmptyState title="No subjects" message="Add your subjects, then their grades." action={{ label: 'Add a subject', onPress: () => setAddingSubject(true) }} />
      ) : (
        <Section label="Subjects">
          {data.subjects.map((item) => {
            const average = averageOf(item.id);
            const values = data.grades.filter((grade) => grade.subjectId === item.id).map((grade) => grade.value);
            const direction = trend(values, system);
            return (
              <SwipeToDelete
                key={item.id}
                onDelete={() => {
                  upsert('subjects', item, true);
                  updateLockIn((current) => ({ grades: current.grades.filter((grade) => grade.subjectId !== item.id) }));
                }}
              >
                <Row
                  icon={<span className={styles.glyph} style={{ background: item.color }}>{item.glyph}</span>}
                  title={item.name}
                  detail={`${values.length} grade${values.length === 1 ? '' : 's'}${direction > 0.05 ? ' · getting better' : direction < -0.05 ? ' · getting worse' : ''}`}
                  value={
                    average !== null ? (
                      <span className={STATUS_CLASS[gradeStatus(roundGrade(average, system), system)]}>{gradeLabel(roundGrade(average, system), system)}</span>
                    ) : (
                      '--'
                    )
                  }
                  onPress={() => setOpenSubject(item.id)}
                />
              </SwipeToDelete>
            );
          })}
        </Section>
      )}
      {data.subjects.length > 0 && (
        <Button icon={PlusIcon} onPress={() => setAddingSubject(true)}>
          Add a subject
        </Button>
      )}
      <SubjectSheet open={addingSubject} onClose={() => setAddingSubject(false)} />
      <SystemSheet open={systemSheet} onClose={() => setSystemSheet(false)} />
    </>
  );
}

export function SubjectSheet({ open, onClose, label = 'subject' }: { open: boolean; onClose: () => void; label?: string }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`New ${label}`}
      action={
        <Button
          kind="primary"
          disabled={!name.trim()}
          onPress={() => {
            upsert('subjects', { id: newId('sub'), name: name.trim(), color, glyph: name.trim().slice(0, 2) });
            setName('');
            onClose();
          }}
        >
          Add
        </Button>
      }
    >
      <input className={styles.input} placeholder="Name" aria-label="Name" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
      <div className={styles.colors}>
        {SUBJECT_COLORS.map((option) => (
          <Pressable key={option} className={`${styles.colorDot} ${option === color ? styles.colorOn : ''}`} style={{ background: option }} aria-label={option} onClick={() => setColor(option)} />
        ))}
      </div>
    </Sheet>
  );
}

function SubjectDetail({ subject, system, onBack }: { subject: Subject; system: GradingSystem; onBack: () => void }) {
  const data = useLockIn();
  const grades = data.grades.filter((grade) => grade.subjectId === subject.id).sort((a, b) => a.date.localeCompare(b.date));
  const average = weightedAverage(grades.map((grade) => ({ value: grade.value, weight: grade.weight })));
  const [adding, setAdding] = useState(false);
  const [target, setTarget] = useState(String(system.pass));
  const [weight, setWeight] = useState('1');
  const need = grades.length ? gradeNeeded(grades.map((grade) => ({ value: grade.value, weight: grade.weight })), Number(weight) || 1, Number(target), system) : null;

  return (
    <>
      <div className={styles.detailBar}>
        <CircleButton small label="Back" onClick={onBack}>
          <BackIcon />
        </CircleButton>
        <span className={styles.detailTitle}>{subject.name}</span>
        <CircleButton small label="Add a grade" onClick={() => setAdding(true)}>
          <PlusIcon />
        </CircleButton>
      </div>
      <div className={styles.summary}>
        <div className={styles.summaryNumber}>
          <span className="label">Average</span>
          <span className={`${styles.big} ${average !== null ? STATUS_CLASS[gradeStatus(roundGrade(average, system), system)] : ''}`}>
            {average !== null ? gradeLabel(roundGrade(average, system), system) : '--'}
          </span>
        </div>
        {average !== null && <span className={styles.small}>Exact: {average.toFixed(3)}</span>}
      </div>
      {grades.length > 1 && (
        <svg className={styles.trend} viewBox="0 0 100 30" preserveAspectRatio="none" aria-label="Grade trend">
          <polyline
            className={styles.trendLine}
            points={grades
              .map((grade, index) => {
                const fraction = (grade.value - system.low) / (system.high - system.low);
                const y = system.best === 'high' ? 28 - fraction * 26 : 2 + fraction * 26;
                return `${(index / (grades.length - 1)) * 100},${y}`;
              })
              .join(' ')}
          />
        </svg>
      )}
      {grades.length === 0 ? (
        <EmptyState title="No grades" message="Add your first grade for this subject." action={{ label: 'Add a grade', onPress: () => setAdding(true) }} />
      ) : (
        <Section label="Grades" note="Swipe left to delete.">
          {[...grades].reverse().map((grade) => (
            <SwipeToDelete key={grade.id} onDelete={() => upsert('grades', grade, true)}>
              <Row
                title={<span className={STATUS_CLASS[gradeStatus(grade.value, system)]}>{gradeLabel(grade.value, system)}</span>}
                detail={`${grade.type} · weight ${grade.weight}${grade.note ? ` · ${grade.note}` : ''}`}
                value={new Date(`${grade.date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              />
            </SwipeToDelete>
          ))}
        </Section>
      )}
      {grades.length > 0 && (
        <Section label="What do I need?" card={false}>
          <div className={styles.row}>
            <input className={styles.input} inputMode="decimal" aria-label="Target average" value={target} onChange={(e) => setTarget(e.target.value)} />
            <input className={styles.input} inputMode="decimal" aria-label="Weight of the next test" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <p className={styles.planNote}>
            Target average, then weight of the next test.{' '}
            {need?.verdict === 'impossible'
              ? 'Even the best grade will not get you there. Honest answer: aim for the next test after that too.'
              : need?.verdict === 'already'
                ? 'You are safe: even the lowest grade keeps you there.'
                : need?.needed !== null && need?.needed !== undefined
                  ? `You need at least ${gradeLabel(need.needed, system)}.`
                  : ''}
          </p>
        </Section>
      )}
      <GradeSheet open={adding} subjectId={subject.id} system={system} onClose={() => setAdding(false)} />
    </>
  );
}

function GradeSheet({ open, subjectId, system, onClose }: { open: boolean; subjectId: string; system: GradingSystem; onClose: () => void }) {
  const [value, setValue] = useState('');
  const [weight, setWeight] = useState('1');
  const [type, setType] = useState<GradeType>('exam');
  const [date, setDate] = useState(dayKey(new Date()));
  const [note, setNote] = useState('');
  const letters = system.labels ? Object.entries(system.labels).sort((a, b) => Number(b[0]) - Number(a[0])) : null;
  const parsed = Number(value);
  const valid = value !== '' && parsed >= system.low && parsed <= system.high && Number(weight) > 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New grade"
      action={
        <Button
          kind="primary"
          disabled={!valid}
          onPress={() => {
            const grade: Grade = { id: newId('g'), subjectId, value: parsed, weight: Number(weight), type, date, note: note.trim() };
            upsert('grades', grade);
            setValue('');
            setNote('');
            onClose();
          }}
        >
          Add
        </Button>
      }
    >
      {letters ? (
        <div className={styles.chips}>
          {letters.map(([number, letter]) => (
            <Pressable key={number} className={`${styles.chip} ${value === number ? styles.chipOn : ''}`} onClick={() => setValue(number)}>
              {letter}
            </Pressable>
          ))}
        </div>
      ) : (
        <input className={styles.input} inputMode="decimal" placeholder={`Grade (${system.low} to ${system.high})`} aria-label="Grade" value={value} onChange={(e) => setValue(e.target.value.replace(',', '.'))} />
      )}
      <input className={styles.input} inputMode="decimal" placeholder="Weight" aria-label="Weight" value={weight} onChange={(e) => setWeight(e.target.value.replace(',', '.'))} />
      <SegmentedControl
        label="Type"
        value={type}
        onChange={setType}
        options={[
          { id: 'exam', label: 'Exam' },
          { id: 'quiz', label: 'Quiz' },
          { id: 'oral', label: 'Oral' },
          { id: 'project', label: 'Project' },
        ]}
      />
      <input className={styles.input} type="date" aria-label="Date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
      <input className={styles.input} placeholder="Note (optional)" aria-label="Note" value={note} maxLength={60} onChange={(e) => setNote(e.target.value)} />
    </Sheet>
  );
}

function SystemSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useLockIn();
  const [custom, setCustom] = useState({ name: '', low: '1', high: '10', best: 'high' as 'high' | 'low', pass: '5', rounding: '0.1' });
  const all = [...GRADING_SYSTEMS, ...data.customSystems];
  const rules = data.rules;

  return (
    <Sheet open={open} onClose={onClose} title="Grading">
      <Section label="System">
        {all.map((system) => (
          <Row key={system.id} title={system.name} value={system.id === data.gradingSystemId ? 'Chosen' : undefined} onPress={() => updateLockIn({ gradingSystemId: system.id })} />
        ))}
      </Section>
      <Section label="Your own system" card={false}>
        <input className={styles.input} placeholder="Name" aria-label="Name" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
        <div className={styles.row}>
          <input className={styles.input} inputMode="decimal" aria-label="Lowest" placeholder="Lowest" value={custom.low} onChange={(e) => setCustom({ ...custom, low: e.target.value })} />
          <input className={styles.input} inputMode="decimal" aria-label="Highest" placeholder="Highest" value={custom.high} onChange={(e) => setCustom({ ...custom, high: e.target.value })} />
        </div>
        <div className={styles.row}>
          <input className={styles.input} inputMode="decimal" aria-label="Pass from" placeholder="Pass from" value={custom.pass} onChange={(e) => setCustom({ ...custom, pass: e.target.value })} />
          <input className={styles.input} inputMode="decimal" aria-label="Round to" placeholder="Round to" value={custom.rounding} onChange={(e) => setCustom({ ...custom, rounding: e.target.value })} />
        </div>
        <SegmentedControl
          label="Best end"
          value={custom.best}
          onChange={(best) => setCustom({ ...custom, best })}
          options={[
            { id: 'high', label: 'High is best' },
            { id: 'low', label: 'Low is best' },
          ]}
        />
        <Button
          disabled={!custom.name.trim()}
          onPress={() => {
            const system: GradingSystem = {
              id: newId('sys'),
              name: custom.name.trim(),
              low: Number(custom.low),
              high: Number(custom.high),
              best: custom.best,
              pass: Number(custom.pass),
              rounding: Number(custom.rounding) || 0.1,
              step: Number(custom.rounding) || 0.1,
              margin: (Number(custom.high) - Number(custom.low)) / 10,
            };
            updateLockIn((current) => ({ customSystems: [...current.customSystems, system], gradingSystemId: system.id }));
          }}
        >
          Save my system
        </Button>
      </Section>
      <Section label="Promotion rules" note="Like Swiss schools: the average, how many fails, and points below the pass mark counting double.">
        <Row
          title="Minimum average"
          trailing={<Toggle label="Minimum average" on={rules.minAverage !== null} onChange={(on) => updateLockIn({ rules: { ...rules, minAverage: on ? getSystem(data.gradingSystemId, data.customSystems).pass : null } })} />}
        />
        <Row title="At most 3 fails" trailing={<Toggle label="At most 3 fails" on={rules.maxFails !== null} onChange={(on) => updateLockIn({ rules: { ...rules, maxFails: on ? 3 : null } })} />} />
        <Row title="Double compensation" trailing={<Toggle label="Double compensation" on={rules.doubleCompensation} onChange={(on) => updateLockIn({ rules: { ...rules, doubleCompensation: on } })} />} />
      </Section>
    </Sheet>
  );
}

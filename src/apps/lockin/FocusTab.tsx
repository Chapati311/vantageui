import { useEffect, useState } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { Button, Row, Section, SegmentedControl, Slider, Toggle } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { AMBIENT, setAmbientVolume, toggleAmbient, useAmbient } from './ambient';
import {
  SESSION_TYPES,
  askEmergency,
  cancelEmergency,
  endSession,
  finishReview,
  focusedSoFar,
  pauseSession,
  phaseTime,
  resumeSession,
  startSession,
  useFocus,
  type FocusPlan,
  type SessionType,
} from './focusStore';
import { focusMinutesOn, rateLastSession, streakDays, useFocusSessions } from './lockInStats';
import { useLockIn } from './lockInStore';
import styles from './LockIn.module.css';

const RING = 2 * Math.PI * 46;
const TIPS = [
  'Stand up, stretch your back and shoulders.',
  'Drink a glass of water.',
  'Look out of the window at something far away.',
  'Breathe in for four, out for six.',
  "Don't check your phone: let your mind wander.",
  'Walk a few steps. Ideas like movement.',
];

const clock = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/** Focus: pick a session, Lock in, the countdown in a big ring; breaks; a short review. */
export function FocusTab() {
  const { session, review } = useFocus();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => setTick((tick) => tick + 1), 500);
    return () => window.clearInterval(id);
  }, [session]);

  if (review) return <Review minutes={review.minutes} goal={review.goal} />;
  if (session?.phase === 'break') return <Break />;
  if (session) return <Running />;
  return <Plan />;
}

function Plan() {
  const data = useLockIn();
  const sessions = useFocusSessions();
  const [type, setType] = useState<SessionType>('pomodoro');
  const [custom, setCustom] = useState({ work: 40, rest: 8, rounds: 2 });
  const [tag, setTag] = useState('');
  const [goal, setGoal] = useState('');
  const [strict, setStrict] = useState(false);
  const preset = SESSION_TYPES.find((item) => item.id === type)!;
  const plan: FocusPlan = {
    type,
    work: type === 'custom' ? custom.work : preset.work,
    rest: type === 'custom' ? custom.rest : preset.rest,
    rounds: type === 'custom' ? custom.rounds : preset.rounds,
    longRest: type === 'custom' ? custom.rest : preset.longRest,
    tag,
    goal: goal.trim(),
    strict,
  };
  const today = focusMinutesOn(new Date());
  const progress = Math.min(1, today / data.dailyGoal);
  void sessions;

  return (
    <>
      <div className={styles.ringBox}>
        <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
          <circle className={styles.ringTrack} cx="50" cy="50" r="46" />
          <circle className={styles.ringGoal} cx="50" cy="50" r="46" strokeDasharray={`${RING * progress} ${RING}`} transform="rotate(-90 50 50)" />
        </svg>
        <div className={styles.ringCenter}>
          <DotNumber value={type === 'open' ? '00:00' : `${String(plan.work).padStart(2, '0')}:00`} size={40} />
          <span className="label">
            {today} / {data.dailyGoal} min
          </span>
          <span className="label">{streakDays()} day streak</span>
        </div>
      </div>

      <SegmentedControl
        label="Session type"
        value={type}
        onChange={setType}
        options={SESSION_TYPES.map((item) => ({ id: item.id, label: item.id === 'pomodoro' ? 'Pomo' : item.name.replace('Deep ', 'D') }))}
      />
      {type === 'custom' && (
        <Section label="Custom" card={false}>
          <Slider label="Focus" value={custom.work} min={5} max={180} step={5} format={(v) => `${v}m`} onChange={(work) => setCustom({ ...custom, work })} />
          <Slider label="Break" value={custom.rest} min={1} max={30} step={1} format={(v) => `${v}m`} onChange={(rest) => setCustom({ ...custom, rest })} />
          <Slider label="Rounds" value={custom.rounds} min={1} max={8} step={1} onChange={(rounds) => setCustom({ ...custom, rounds })} />
        </Section>
      )}
      <p className={styles.planNote}>
        {type === 'open' ? 'Counts up until you stop.' : `${plan.work} min focus, ${plan.rest} min break, ${plan.rounds} round${plan.rounds > 1 ? 's' : ''}.`}
      </p>

      {data.subjects.length > 0 && (
        <div className={styles.chips} role="group" aria-label={data.role === 'student' ? 'Subject' : 'Project'}>
          {data.subjects.map((subject) => (
            <Pressable key={subject.id} className={`${styles.chip} ${tag === subject.name ? styles.chipOn : ''}`} onClick={() => setTag(tag === subject.name ? '' : subject.name)}>
              <span className={styles.chipDot} style={{ background: subject.color }} />
              {subject.name}
            </Pressable>
          ))}
        </div>
      )}
      <input className={styles.input} placeholder="Goal for this session (optional)" aria-label="Goal" value={goal} maxLength={80} onChange={(e) => setGoal(e.target.value)} />
      <Section>
        <Row title="Strict" detail="No pausing; ending early takes a 60 s wait" trailing={<Toggle label="Strict" on={strict} onChange={setStrict} />} />
      </Section>
      <Button kind="primary" wide onPress={() => startSession(plan)}>
        Start focus
      </Button>
      <AmbientPicker />
    </>
  );
}

function AmbientPicker() {
  const playing = useAmbient();
  return (
    <Section label="Ambient sound" note="Pick up to two and mix them." card={false}>
      <div className={styles.chips}>
        {AMBIENT.map((sound) => (
          <Pressable key={sound.id} className={`${styles.chip} ${playing.some((item) => item.id === sound.id) ? styles.chipOn : ''}`} onClick={() => toggleAmbient(sound.id)}>
            {sound.name}
          </Pressable>
        ))}
      </div>
      {playing.map((item) => (
        <Slider
          key={item.id}
          label={AMBIENT.find((sound) => sound.id === item.id)!.name}
          value={Math.round(item.volume * 100)}
          min={0}
          max={100}
          step={5}
          format={(v) => `${v}%`}
          onChange={(value) => setAmbientVolume(item.id, value / 100)}
        />
      ))}
    </Section>
  );
}

function Running() {
  const { session } = useFocus();
  if (!session) return null;
  const { left, elapsed, total } = phaseTime(session);
  const open = session.phaseEndsAt === null && session.pausedLeft === null;
  const fraction = open ? (elapsed % 3_600_000) / 3_600_000 : total ? left / total : 0;
  const emergencyLeft = session.emergencyAt ? Math.max(0, 60_000 - (Date.now() - session.emergencyAt)) : null;

  return (
    <>
      <div className={styles.ringBox}>
        <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
          <circle className={styles.ringTrack} cx="50" cy="50" r="46" />
          <circle className={styles.ringLeft} cx="50" cy="50" r="46" strokeDasharray={`${RING * fraction} ${RING}`} transform="rotate(-90 50 50)" />
        </svg>
        <div className={styles.ringCenter}>
          <DotNumber value={clock(open ? elapsed : left)} size={64} />
          <span className="label">
            {session.plan.tag || 'Focus'} · round {session.round}/{session.plan.rounds}
            {session.pausedLeft !== null ? ' · paused' : ''}
          </span>
        </div>
      </div>
      {session.plan.goal && <p className={styles.goal}>{session.plan.goal}</p>}
      <p className={styles.planNote}>{Math.round(focusedSoFar(session) / 60_000)} minutes focused so far.</p>

      {session.plan.strict ? (
        emergencyLeft === null ? (
          <Button onPress={askEmergency}>Emergency unlock</Button>
        ) : emergencyLeft > 0 ? (
          <>
            <p className={styles.planNote}>Take a breath. You can end in {Math.ceil(emergencyLeft / 1000)} s.</p>
            <Button onPress={cancelEmergency}>Keep focusing</Button>
          </>
        ) : (
          <Button kind="destructive" onPress={() => endSession(false)}>
            End session
          </Button>
        )
      ) : (
        <div className={styles.row}>
          {!open && (
            <Button onPress={() => (session.pausedLeft !== null ? resumeSession() : pauseSession())}>{session.pausedLeft !== null ? 'Resume' : 'Pause'}</Button>
          )}
          <Button kind="destructive" onPress={() => endSession(session.plan.type === 'open')}>
            {session.plan.type === 'open' ? 'Finish' : 'End early'}
          </Button>
        </div>
      )}
      <AmbientPicker />
    </>
  );
}

function Break() {
  const { session } = useFocus();
  const [inhale, setInhale] = useState(true);
  useEffect(() => {
    const id = window.setInterval(() => setInhale((value) => !value), 4000);
    return () => window.clearInterval(id);
  }, []);
  if (!session) return null;
  const { left } = phaseTime(session);
  const tip = TIPS[session.round % TIPS.length];
  return (
    <div className={styles.break}>
      <span className="label">Break · {clock(left)}</span>
      <div className={styles.breath}>
        <span className={styles.breathCircle} />
        <span className={styles.breathWord}>{inhale ? 'Breathe in' : 'Breathe out'}</span>
      </div>
      <p className={styles.goal}>{tip}</p>
      {!session.plan.strict && <Button onPress={() => endSession(true)}>Stop for today</Button>}
    </div>
  );
}

function Review({ minutes, goal }: { minutes: number; goal: string }) {
  const answer = (result: 'done' | 'partly' | 'not' | null) => {
    if (result) rateLastSession(result);
    finishReview();
  };
  return (
    <div className={styles.break}>
      <span className="label">Session over</span>
      <DotNumber value={String(minutes)} size={64} />
      <span className="label">minutes of focus</span>
      {goal ? (
        <>
          <p className={styles.goal}>Did you reach your goal: "{goal}"?</p>
          <div className={styles.row}>
            <Button onPress={() => answer('done')}>Done</Button>
            <Button onPress={() => answer('partly')}>Partly</Button>
            <Button onPress={() => answer('not')}>Not</Button>
          </div>
        </>
      ) : (
        <Button kind="primary" onPress={() => answer(null)}>
          Nice
        </Button>
      )}
    </div>
  );
}

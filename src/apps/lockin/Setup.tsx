import { useState } from 'react';
import { AppShell, Button, Row, Section, SegmentedControl, Slider, Toggle } from '../../components/kit';
import { HOME_APPS } from '../../system/appRegistry';
import { COUNTRIES, updateLockIn, type Role } from './lockInStore';
import { GRADING_SYSTEMS } from './grading';

/** First launch: student or working, country (sets the grading system), distraction apps, daily goal. */
export function Setup() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>('student');
  const [country, setCountry] = useState('ch');
  const [distractions, setDistractions] = useState<string[]>([]);
  const [goal, setGoal] = useState(120);
  const system = COUNTRIES.find((item) => item.id === country)?.system ?? 'ch';

  const finish = () =>
    updateLockIn((current) => ({
      setupDone: true,
      role,
      country,
      gradingSystemId: system,
      dailyGoal: goal,
      blocking: { ...current.blocking, distractions },
    }));

  return (
    <AppShell title={['Lock In', 'Where', 'Distractions', 'Your goal'][step]}>
      {step === 0 && (
        <>
          <p>Focus sessions, grades, homework and a calm evening, in one place. First, a few questions.</p>
          <Section label="I am">
            <SegmentedControl
              label="Role"
              value={role}
              onChange={setRole}
              options={[
                { id: 'student', label: 'A student' },
                { id: 'working', label: 'Working' },
              ]}
            />
          </Section>
        </>
      )}
      {step === 1 && (
        <Section label={role === 'student' ? 'Your school is in' : 'You work in'} note={`Grades use: ${GRADING_SYSTEMS.find((item) => item.id === system)?.name}. You can change it later.`}>
          {COUNTRIES.map((item) => (
            <Row key={item.id} title={item.name} value={item.id === country ? 'Chosen' : undefined} onPress={() => setCountry(item.id)} />
          ))}
        </Section>
      )}
      {step === 2 && (
        <Section label="Apps that pull you away" note="These lock during focus sessions and Wind Down (inside Vantage).">
          {HOME_APPS.filter((app) => app.id !== 'lockin').map((app) => (
            <Row
              key={app.id}
              title={app.name}
              trailing={
                <Toggle
                  label={app.name}
                  on={distractions.includes(app.id)}
                  onChange={(on) => setDistractions(on ? [...distractions, app.id] : distractions.filter((id) => id !== app.id))}
                />
              }
            />
          ))}
        </Section>
      )}
      {step === 3 && (
        <Section label="Focus each day" card={false}>
          <Slider label="Daily goal" value={goal} min={30} max={360} step={15} format={(value) => `${Math.floor(value / 60)}h${value % 60 ? ` ${value % 60}` : ''}`} onChange={setGoal} />
        </Section>
      )}
      <Button kind="primary" wide onPress={() => (step < 3 ? setStep(step + 1) : finish())}>
        {step < 3 ? 'Next' : 'Start'}
      </Button>
      {step > 0 && <Button onPress={() => setStep(step - 1)}>Back</Button>}
    </AppShell>
  );
}

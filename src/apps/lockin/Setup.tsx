import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { AppShell, Button, Row, Section, SegmentedControl, Slider, Toggle } from '../../components/kit';
import { HOME_APPS } from '../../system/appRegistry';
import { SPRING } from '../../theme/tokens';
import { COUNTRIES, updateLockIn, type Role } from './lockInStore';
import { GRADING_SYSTEMS } from './grading';
import { SetupArt } from './SetupArt';
import styles from './Setup.module.css';

const STEPS = ['Focus', 'Where', 'Distractions', 'Your goal'];

/**
 * First launch: student or working, country (sets the grading system),
 * distraction apps, daily goal. Step dots on top, a small moving picture per
 * step, and each step slides in from the side you are going.
 */
export function Setup() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [role, setRole] = useState<Role>('student');
  const [country, setCountry] = useState('ch');
  const [distractions, setDistractions] = useState<string[]>([]);
  const [goal, setGoal] = useState(120);
  const system = COUNTRIES.find((item) => item.id === country)?.system ?? 'ch';

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

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
    <AppShell title={STEPS[step]}>
      <div className={styles.dots} role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((name, index) => (
          <motion.span key={name} className={`${styles.dot} ${index <= step ? styles.dotOn : ''}`} animate={{ width: index === step ? 24 : 8 }} transition={SPRING.ui} />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={step}
          className={styles.step}
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: d * 48, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d * -48, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SPRING.ui}
        >
          <SetupArt step={step} />
          {step === 0 && (
            <>
              <p className={styles.text}>Focus sessions, grades, homework and a calm evening, in one place. First, a few questions.</p>
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
            <Section label="Focus each day">
              <Slider label="Daily goal" value={goal} min={30} max={360} step={15} format={(value) => `${Math.floor(value / 60)}h${value % 60 ? ` ${value % 60}` : ''}`} onChange={setGoal} />
            </Section>
          )}
        </motion.div>
      </AnimatePresence>

      <Button kind="primary" wide onPress={() => (step < STEPS.length - 1 ? go(step + 1) : finish())}>
        {step < STEPS.length - 1 ? 'Next' : 'Start'}
      </Button>
      {step > 0 && <Button onPress={() => go(step - 1)}>Back</Button>}
    </AppShell>
  );
}

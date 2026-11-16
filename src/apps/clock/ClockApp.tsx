import { Segmented } from '../../components/Segmented';
import { setClockTab, useClockState, type ClockTab } from './clockStore';
import { StopwatchTab } from './StopwatchTab';
import { TimerTab } from './TimerTab';
import { WorldTab } from './WorldTab';
import styles from './ClockApp.module.css';

const TABS: { id: ClockTab; label: string }[] = [
  { id: 'timer', label: 'Timer' },
  { id: 'stopwatch', label: 'Stopwatch' },
  { id: 'world', label: 'World' },
];

export function ClockApp() {
  const { tab } = useClockState();

  return (
    <div className={styles.app}>
      <Segmented label="Clock" options={TABS} value={tab} onChange={setClockTab} />
      <div className={styles.tab}>
        {tab === 'timer' && <TimerTab />}
        {tab === 'stopwatch' && <StopwatchTab />}
        {tab === 'world' && <WorldTab />}
      </div>
    </div>
  );
}

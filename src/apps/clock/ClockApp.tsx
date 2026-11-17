import { Segmented } from '../../components/Segmented';
import { useClockState, type ClockTab } from './clockStore';
import { StopwatchTab } from './StopwatchTab';
import { TimerTab } from './TimerTab';
import { WorldTab } from './WorldTab';
import styles from './ClockApp.module.css';
import { runAction } from '../../system/actions';

const TABS: { id: ClockTab; label: string }[] = [
  { id: 'timer', label: 'Timer' },
  { id: 'stopwatch', label: 'Stopwatch' },
  { id: 'world', label: 'World' },
];

export function ClockApp() {
  const { tab } = useClockState();

  return (
    <div className={styles.app}>
      <Segmented label="Clock" options={TABS} value={tab} onChange={(tab) => void runAction('clock.showTab', { tab })} />
      <div className={styles.tab}>
        {tab === 'timer' && <TimerTab />}
        {tab === 'stopwatch' && <StopwatchTab />}
        {tab === 'world' && <WorldTab />}
      </div>
    </div>
  );
}

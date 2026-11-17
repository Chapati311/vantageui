import { AppShell, TabBar } from '../../components/kit';
import { BellIcon, FlagIcon } from '../../components/glyphs';
import { ClockIcon } from '../../system/appIcons';
import { runAction } from '../../system/actions';
import { GlobeIcon } from './icons';
import { AlarmTab } from './AlarmTab';
import { useClockState, type ClockTab } from './clockStore';
import { StopwatchTab } from './StopwatchTab';
import { TimerTab } from './TimerTab';
import { WorldTab } from './WorldTab';

const TABS = [
  { id: 'alarm' as const, label: 'Alarm', icon: BellIcon },
  { id: 'world' as const, label: 'World', icon: GlobeIcon },
  { id: 'stopwatch' as const, label: 'Stopwatch', icon: FlagIcon },
  { id: 'timer' as const, label: 'Timer', icon: ClockIcon },
];

const TITLES: Record<ClockTab, string> = { alarm: 'Alarm', world: 'World', stopwatch: 'Stopwatch', timer: 'Timer' };

/** Clock: Alarm, World, Stopwatch and Timer, with a floating pill tab bar. */
export function ClockApp() {
  const { tab, timer } = useClockState();
  const fixed = tab === 'stopwatch' || tab === 'timer';
  return (
    <AppShell
      title={TITLES[tab]}
      fixed={fixed}
      tabBar={
        <TabBar
          tabs={TABS.map((item) => ({ ...item, badge: item.id === 'timer' && timer.status === 'running' }))}
          value={tab}
          onChange={(next) => void runAction('clock.showTab', { tab: next })}
        />
      }
    >
      {tab === 'alarm' && <AlarmTab />}
      {tab === 'world' && <WorldTab />}
      {tab === 'stopwatch' && <StopwatchTab />}
      {tab === 'timer' && <TimerTab />}
    </AppShell>
  );
}

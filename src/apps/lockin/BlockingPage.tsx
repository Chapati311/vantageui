import { CircleButton } from '../../components/CircleButton';
import { BackIcon } from '../../components/glyphs';
import { AppShell, Row, Section, SegmentedControl, Toggle } from '../../components/kit';
import { HOME_APPS } from '../../system/appRegistry';
import { updateLockIn, useLockIn, type Blocking } from './lockInStore';

/** Groups for the distraction list. */
const GROUPS: { name: string; ids: string[] }[] = [
  { name: 'Social', ids: ['messages', 'mail', 'phone', 'contacts'] },
  { name: 'Entertainment', ids: ['arcade', 'music', 'browser', 'photos', 'camera', 'maps'] },
];

/** Which apps lock, when, daily limits, strict mode and the Focus Shortcuts. */
export function BlockingPage({ onBack }: { onBack: () => void }) {
  const data = useLockIn();
  const blocking = data.blocking;
  const set = (patch: Partial<Blocking>) => updateLockIn({ blocking: { ...blocking, ...patch } });
  const toggleApp = (id: string, on: boolean) => set({ distractions: on ? [...blocking.distractions, id] : blocking.distractions.filter((item) => item !== id) });
  const grouped = new Set(GROUPS.flatMap((group) => group.ids));
  const custom = HOME_APPS.filter((app) => !grouped.has(app.id) && app.id !== 'lockin' && app.id !== 'settings');
  const lockedFor = blocking.lockedUntil && blocking.lockedUntil > Date.now() ? Math.ceil((blocking.lockedUntil - Date.now()) / 3_600_000) : 0;

  const appRow = (id: string) => {
    const app = HOME_APPS.find((item) => item.id === id);
    if (!app) return null;
    const on = blocking.distractions.includes(id);
    return (
      <Row
        key={id}
        title={app.name}
        detail={on ? (blocking.limits[id] ? `Limit ${blocking.limits[id]} min a day` : 'Locks when you lock in') : undefined}
        trailing={<Toggle label={app.name} on={on} onChange={(value) => toggleApp(id, value)} />}
      />
    );
  };

  return (
    <AppShell
      title="App blocking"
      leading={
        <CircleButton small label="Back" onClick={onBack}>
          <BackIcon />
        </CircleButton>
      }
    >
      <Section label="Lock distractions">
        <Row title="During focus sessions" trailing={<Toggle label="During focus sessions" on={blocking.duringSessions} onChange={(on) => set({ duringSessions: on })} />} />
        <Row title="During Wind Down" trailing={<Toggle label="During Wind Down" on={blocking.duringWindDown} onChange={(on) => set({ duringWindDown: on })} />} />
        <Row
          title="Every day 21:00 - 07:00"
          trailing={<Toggle label="Scheduled lock" on={blocking.schedule !== null} onChange={(on) => set({ schedule: on ? { from: '21:00', to: '07:00' } : null })} />}
        />
      </Section>
      <Section label="Lock now" note={lockedFor ? `Locked for about ${lockedFor} more hour${lockedFor === 1 ? '' : 's'}.` : undefined} card={false}>
        <SegmentedControl
          label="Lock now for"
          value={lockedFor ? 'on' : 'off'}
          onChange={(value) => set({ lockedUntil: value === 'off' ? null : Date.now() + Number(value) * 3_600_000 })}
          options={[
            { id: 'off', label: 'Off' },
            { id: '1', label: '1 h' },
            { id: '2', label: '2 h' },
            { id: '4', label: '4 h' },
          ]}
        />
      </Section>
      {GROUPS.map((group) => (
        <Section key={group.name} label={group.name}>
          {group.ids.map(appRow)}
        </Section>
      ))}
      <Section label="Custom">{custom.map((app) => appRow(app.id))}</Section>
      <Section label="Daily limit for locked apps" note="Each distraction may be used this long a day, then it locks until midnight." card={false}>
        <SegmentedControl
          label="Daily limit"
          value={String(blocking.distractions.length ? blocking.limits[blocking.distractions[0]] ?? 0 : 0)}
          onChange={(value) => set({ limits: Object.fromEntries(blocking.distractions.map((id) => [id, Number(value)])) })}
          options={[
            { id: '0', label: 'None' },
            { id: '15', label: '15 min' },
            { id: '30', label: '30 min' },
            { id: '60', label: '1 h' },
          ]}
        />
      </Section>
      <Section label="Rules" note="Shortcuts: make two iOS Shortcuts named FocusOn and FocusOff that turn a Focus on and off. Lock In runs them at the start and end of each session.">
        <Row title="Strict mode" detail="No emergency unlock" trailing={<Toggle label="Strict mode" on={blocking.strict} onChange={(on) => set({ strict: on })} />} />
        <Row title="Silence notifications" detail="Runs FocusOn / FocusOff" trailing={<Toggle label="Silence notifications" on={blocking.useFocusShortcuts} onChange={(on) => set({ useFocusShortcuts: on })} />} />
      </Section>
    </AppShell>
  );
}

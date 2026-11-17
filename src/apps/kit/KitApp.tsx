import { useState } from 'react';
import { AppShell, TabBar } from '../../components/kit';
import { GridIcon, ListIcon, SunIcon, WarningIcon } from '../../components/glyphs';
import { KitControls } from './KitControls';
import { KitLists } from './KitLists';
import { KitOverlays } from './KitOverlays';
import { KitStates } from './KitStates';

type KitTab = 'lists' | 'controls' | 'overlays' | 'states';

const TABS = [
  { id: 'lists' as const, label: 'Lists', icon: ListIcon },
  { id: 'controls' as const, label: 'Controls', icon: SunIcon },
  { id: 'overlays' as const, label: 'Overlays', icon: GridIcon, badge: true },
  { id: 'states' as const, label: 'States', icon: WarningIcon },
];

const TITLES: Record<KitTab, string> = {
  lists: 'Lists',
  controls: 'Controls',
  overlays: 'Overlays',
  states: 'States',
};

/**
 * The component kit test page: every kit component in every state, so the
 * kit can be checked in any theme (open it from search: "kit").
 * The switches here only change this page; nothing is saved.
 */
export function KitApp() {
  const [tab, setTab] = useState<KitTab>('lists');
  return (
    <AppShell title={TITLES[tab]} tabBar={<TabBar tabs={TABS} value={tab} onChange={setTab} />}>
      {tab === 'lists' && <KitLists />}
      {tab === 'controls' && <KitControls />}
      {tab === 'overlays' && <KitOverlays />}
      {tab === 'states' && <KitStates />}
    </AppShell>
  );
}

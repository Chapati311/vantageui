import { useMemo, useRef, useState } from 'react';
import { LockIcon, SoundIcon, WifiIcon } from '../components/glyphs';
import { getApp, type AppDefinition } from '../system/appRegistry';
import { useSetting } from '../system/settingsStore';
import { playSound } from '../system/sounds';
import { AppView, type ScreenRect } from './AppView';
import { Boot } from './Boot';
import { HomeScreen } from './HomeScreen';
import { LockScreen } from './LockScreen';
import { QuickSettings } from './QuickSettings';
import { Search, type SearchAction } from './Search';
import { TimerBanner } from './TimerBanner';
import styles from './Shell.module.css';

interface OpenApp {
  app: AppDefinition;
  from: ScreenRect | null;
}

/** Where an app's icon is right now (on the grid or in the dock), if it is visible. */
function findIconRect(appId: string): ScreenRect | null {
  const rect = document.querySelector(`[data-app-icon="${appId}"]`)?.getBoundingClientRect();
  return rect && rect.right > 0 && rect.left < window.innerWidth ? rect : null;
}

/**
 * The OS frame. It decides which layer is showing. From back to front:
 * home screen, search, the open app, quick settings, lock screen, boot.
 */
export function Shell() {
  const [booting, setBooting] = useState(true);
  const [locked, setLocked] = useState(true);
  const [openApp, setOpenApp] = useState<OpenApp | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useSetting('soundsEnabled');
  const searchInput = useRef<HTMLInputElement>(null);

  const unlock = () => {
    setLocked(false);
    playSound('unlock');
  };

  const launchApp = (appId: string, from: ScreenRect | null) => {
    const app = getApp(appId);
    if (!app) return;
    setOpenApp({ app, from });
    playSound('openApp');
  };

  const openSearch = () => {
    setSearchOpen(true);
    // Focus right away (inside the touch) so iOS shows the keyboard.
    searchInput.current?.focus();
  };

  const closeSearch = () => {
    setSearchOpen(false);
    searchInput.current?.blur();
  };

  // Things search can do besides opening apps.
  const actions = useMemo<SearchAction[]>(
    () => [
      {
        id: 'lock',
        name: 'Lock',
        icon: LockIcon,
        keywords: ['sleep', 'screen'],
        run: () => {
          setOpenApp(null);
          setQuickSettingsOpen(false);
          setLocked(true);
        },
      },
      {
        id: 'quick-settings',
        name: 'Quick settings',
        icon: WifiIcon,
        keywords: ['wifi', 'bluetooth', 'flashlight', 'brightness', 'toggles'],
        run: () => setQuickSettingsOpen(true),
      },
      {
        id: 'sounds',
        name: soundsEnabled ? 'Mute sounds' : 'Unmute sounds',
        icon: SoundIcon,
        keywords: ['sound', 'audio', 'volume', 'silent'],
        run: () => setSoundsEnabled(!soundsEnabled),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [soundsEnabled],
  );

  return (
    <div className={styles.shell}>
      <HomeScreen
        onOpenApp={launchApp}
        onSwipeDown={openSearch}
        onSwipeDownFromTop={() => setQuickSettingsOpen(true)}
      />
      <Search
        open={searchOpen}
        inputRef={searchInput}
        actions={actions}
        onClose={closeSearch}
        onOpenApp={launchApp}
      />
      {openApp && (
        <AppView
          key={openApp.app.id}
          app={openApp.app}
          from={openApp.from}
          getReturnRect={() => findIconRect(openApp.app.id)}
          onClosed={() => setOpenApp(null)}
        />
      )}
      <QuickSettings open={quickSettingsOpen} onClose={() => setQuickSettingsOpen(false)} />
      <LockScreen locked={locked} onUnlock={unlock} />
      <TimerBanner />
      {booting && <Boot onDone={() => setBooting(false)} />}
    </div>
  );
}

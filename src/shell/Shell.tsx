import { useEffect, useMemo, useRef, useState } from 'react';
import { LockIcon, SoundIcon, WifiIcon } from '../components/glyphs';
import { registerShell, runAction } from '../system/actions';
import { getApp, type AppDefinition } from '../system/appRegistry';
import { useSetting } from '../system/settingsStore';
import { useTheme } from '../system/theme';
import { AppView, type ScreenRect } from './AppView';
import { Boot } from './Boot';
import { HomeScreen } from './HomeScreen';
import { LockScreen } from './LockScreen';
import { QuickSettings } from './QuickSettings';
import { RetroHome } from './retro/RetroHome';
import { RetroLock } from './retro/RetroLock';
import { Search, type SearchAction } from './Search';
import { TimerBanner } from './TimerBanner';
import { Wallpaper } from './wallpaper/Wallpaper';
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
 * wallpaper, home screen, search, the open app, quick settings, lock screen,
 * Wind Down layer, boot. Retro themes swap the home and lock screens for the
 * old-phone versions.
 */
export function Shell() {
  const [booting, setBooting] = useState(true);
  const [locked, setLocked] = useState(true);
  const [openApp, setOpenApp] = useState<OpenApp | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [soundsEnabled] = useSetting('soundsEnabled');
  const [homeBlur] = useSetting('homeBlur');
  const theme = useTheme();
  const searchInput = useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setSearchOpen(true);
    // Focus right away (inside the touch) so iOS shows the keyboard.
    searchInput.current?.focus();
  };

  const closeSearch = () => {
    setSearchOpen(false);
    searchInput.current?.blur();
  };

  // Let actions (src/system/actions.ts) drive the shell: open apps, lock, ...
  const controls = useRef({
    openApp: (appId: string, from?: DOMRect | null) => {
      const app = getApp(appId);
      if (!app) return;
      setSearchOpen(false);
      setQuickSettingsOpen(false);
      setOpenApp({ app, from: from ?? findIconRect(appId) });
    },
    closeApp: () => setOpenApp(null),
    lock: () => {
      setOpenApp(null);
      setSearchOpen(false);
      setQuickSettingsOpen(false);
      setLocked(true);
    },
    unlock: () => setLocked(false),
    openSearch,
    openControlCenter: () => setQuickSettingsOpen(true),
    closeOverlays: () => {
      setSearchOpen(false);
      setQuickSettingsOpen(false);
    },
  });
  useEffect(() => registerShell(controls.current), []);

  const openAppFrom = (appId: string, from: ScreenRect | null) =>
    void runAction('app.open', { appId, from: from as DOMRect | null });

  // Things search can do besides opening apps.
  const actions = useMemo<SearchAction[]>(
    () => [
      {
        id: 'lock',
        name: 'Lock',
        icon: LockIcon,
        keywords: ['sleep', 'screen'],
        run: () => void runAction('shell.lock', {}),
      },
      {
        id: 'quick-settings',
        name: 'Controls',
        icon: WifiIcon,
        keywords: ['wifi', 'bluetooth', 'flashlight', 'brightness', 'toggles'],
        run: () => void runAction('shell.openControlCenter', {}),
      },
      {
        id: 'sounds',
        name: soundsEnabled ? 'Mute sounds' : 'Unmute sounds',
        icon: SoundIcon,
        keywords: ['sound', 'audio', 'volume', 'silent'],
        run: () => void runAction('settings.set', { key: 'soundsEnabled', value: !soundsEnabled }),
      },
    ],
    [soundsEnabled],
  );

  const unlock = () => void runAction('shell.unlock', {});
  const retro = theme.retro !== null;

  return (
    <div className={styles.shell}>
      {retro ? (
        <RetroHome onOpenApp={(appId) => openAppFrom(appId, null)} onOpenSearch={openSearch} />
      ) : (
        <>
          {/*
            The home screen's wallpaper. It stops moving while nobody can see it
            (locked, or an app is open) and when it is blurred (re-blurring a moving
            picture every frame would be too slow on the A13).
          */}
          <Wallpaper place="home" paused={locked || openApp !== null || homeBlur > 0} />
          <HomeScreen
            onOpenApp={openAppFrom}
            onSwipeDown={openSearch}
            onSwipeDownFromTop={() => void runAction('shell.openControlCenter', {})}
          />
        </>
      )}
      <Search
        open={searchOpen}
        inputRef={searchInput}
        actions={actions}
        onClose={closeSearch}
        onOpenApp={openAppFrom}
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
      {retro ? <RetroLock locked={locked} onUnlock={unlock} /> : <LockScreen locked={locked} onUnlock={unlock} />}
      <TimerBanner />
      {/* Wind Down: a warm layer and slow dimming over everything (touches go through) */}
      <div className={styles.windDown} aria-hidden="true" />
      {booting && <Boot onDone={() => setBooting(false)} />}
    </div>
  );
}

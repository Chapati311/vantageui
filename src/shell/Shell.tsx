import { useEffect, useMemo, useRef, useState } from 'react';
import { BellIcon, GridIcon, LockIcon, SoundIcon, WifiIcon } from '../components/glyphs';
import { registerShell, runAction } from '../system/actions';
import { getApp, type AppDefinition } from '../system/appRegistry';
import { hasPasscode } from '../system/passcode';
import { getSettings, useSetting } from '../system/settingsStore';
import { useTheme } from '../system/theme';
import { AppSwitcher } from './AppSwitcher';
import { AppView, type ScreenRect } from './AppView';
import { Boot } from './Boot';
import { HomeScreen } from './HomeScreen';
import { LockScreen } from './LockScreen';
import { NotificationCenter } from './NotificationCenter';
import { PasscodeScreen } from './PasscodeScreen';
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
  const [booting, setBooting] = useState(() => getSettings().bootAnimation);
  const [locked, setLocked] = useState(true);
  const [openApp, setOpenApp] = useState<OpenApp | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  /** Recently opened apps, most recent first (for the app switcher) */
  const [recents, setRecents] = useState<string[]>([]);
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
      closeAllOverlays();
      setRecents((list) => [appId, ...list.filter((id) => id !== appId)].slice(0, 8));
      setOpenApp({ app, from: from ?? findIconRect(appId) });
    },
    closeApp: () => setOpenApp(null),
    lock: () => {
      setOpenApp(null);
      closeAllOverlays();
      setPasscodeOpen(false);
      setLocked(true);
    },
    // With a passcode set, unlocking asks for it first
    unlock: () => (hasPasscode() ? setPasscodeOpen(true) : setLocked(false)),
    openSearch,
    openControlCenter: () => {
      setNotificationsOpen(false);
      setQuickSettingsOpen(true);
    },
    openNotifications: () => {
      setQuickSettingsOpen(false);
      setNotificationsOpen(true);
    },
    openAppSwitcher: () => {
      closeAllOverlays();
      setOpenApp(null);
      setSwitcherOpen(true);
    },
    closeOverlays: () => closeAllOverlays(),
  });

  function closeAllOverlays() {
    setSearchOpen(false);
    setQuickSettingsOpen(false);
    setNotificationsOpen(false);
    setSwitcherOpen(false);
  }

  /** Top edge: the left half pulls down notifications, the right half the control center. */
  const swipeDownFromTop = (x: number) =>
    void runAction(x < window.innerWidth / 2 ? 'shell.openNotifications' : 'shell.openControlCenter', {});
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
        id: 'notifications',
        name: 'Notifications',
        icon: BellIcon,
        keywords: ['alerts', 'messages'],
        run: () => void runAction('shell.openNotifications', {}),
      },
      {
        id: 'recents',
        name: 'Recent apps',
        icon: GridIcon,
        keywords: ['switcher', 'multitask', 'recent'],
        run: () => void runAction('shell.openAppSwitcher', {}),
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
            onSwipeDownFromTop={swipeDownFromTop}
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
          onOpenSwitcher={() => void runAction('shell.openAppSwitcher', {})}
          onSwipeDownFromTop={swipeDownFromTop}
          onSwitchApp={(direction) => {
            const next = recents[direction === 1 ? 1 : recents.length - 1];
            if (next && next !== openApp.app.id) void runAction('app.open', { appId: next });
          }}
        />
      )}
      <AppSwitcher
        open={switcherOpen}
        recents={recents}
        onOpen={(appId, from) => void runAction('app.open', { appId, from: from as DOMRect })}
        onRemove={(appId) => setRecents((list) => list.filter((id) => id !== appId))}
        onClose={() => setSwitcherOpen(false)}
      />
      <QuickSettings open={quickSettingsOpen} onClose={() => setQuickSettingsOpen(false)} />
      <NotificationCenter open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      {retro ? <RetroLock locked={locked} onUnlock={unlock} /> : <LockScreen locked={locked} onUnlock={unlock} />}
      <PasscodeScreen
        open={passcodeOpen}
        onSuccess={() => {
          setPasscodeOpen(false);
          setLocked(false);
        }}
        onCancel={() => setPasscodeOpen(false)}
      />
      <TimerBanner />
      {/* Wind Down: a warm layer and slow dimming over everything (touches go through) */}
      <div className={styles.windDown} aria-hidden="true" />
      {booting && <Boot onDone={() => setBooting(false)} />}
    </div>
  );
}

import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SPRING } from '../theme/tokens';
import { BellIcon, GridIcon, LockIcon, SoundIcon, WifiIcon } from '../components/glyphs';
import { registerShell, runAction } from '../system/actions';
import { getApp, type AppDefinition } from '../system/appRegistry';
import { hasPasscode } from '../system/passcode';
import { getSettings, useSetting } from '../system/settingsStore';
import { useTheme } from '../system/theme';
import { blockState, countUsage } from '../apps/lockin/blocking';
import { canOpenApp, openApp as openNativeApp } from '../system/nativeBridge';
import { AlarmRinging } from './AlarmRinging';
import { LockedApp } from './LockedApp';
import { ModeHome } from './ModeHome';
import { StatusStrip } from './StatusStrip';
import { useDailyShuffle } from './dailyShuffle';
import { useCustomModeSchedule } from '../system/customModes';
import { morningSummary, useWindDownSchedule } from './windDownSchedule';
import { AppSwitcher } from './AppSwitcher';
import { AppView, shapeOf, type ScreenRect } from './AppView';
import { Boot } from './Boot';
import { FirstSetup } from './setup/FirstSetup';
import { GameBoyBoot } from './GameBoyBoot';
import { VantageOverlay } from '../vantage/VantageOverlay';
import { isVantageConnected, provideContext } from '../vantage/bridge';
import { summon } from '../vantage/summon';
import { getNotifications } from '../system/notifications';
import { getFocus } from '../apps/lockin/focusStore';
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
  const element = document.querySelector(`[data-app-icon="${appId}"]`);
  if (!element) return null;
  const shape = shapeOf(element);
  return shape.left + shape.width > 0 && shape.left < window.innerWidth ? shape : null;
}

/**
 * The OS frame. It decides which layer is showing. From back to front:
 * wallpaper, home screen, search, the open app, quick settings, lock screen,
 * Wind Down layer, boot. Retro themes swap the home and lock screens for the
 * old-phone versions.
 */
export function Shell() {
  const [booting, setBooting] = useState(() => getSettings().bootAnimation);
  const [reduceMotion] = useSetting('reduceMotion');
  const [setupDone] = useSetting('setupDone');
  // What Vantage is told about the moment (VANTAGE.md: the "context" message)
  provideContext(() => {
    const focus = getFocus().session;
    return {
      app: openAppRef.current,
      screen: lockedRef.current ? 'lock' : openAppRef.current ? 'app' : 'home',
      focusState: focus ? { phase: focus.phase, paused: focus.pausedLeft !== null } : null,
      recentNotifications: getNotifications()
        .slice(0, 5)
        .map((note) => ({ app: note.appId, title: note.title })),
    };
  });

  // Double-tap the status bar (the top 24 px) to summon Vantage
  useEffect(() => {
    let last = 0;
    const tap = (event: PointerEvent) => {
      if (event.clientY > 24) return;
      if (event.timeStamp - last < 320) {
        last = 0;
        summon('status-bar');
      } else last = event.timeStamp;
    };
    window.addEventListener('pointerup', tap, true);
    return () => window.removeEventListener('pointerup', tap, true);
  }, []);

  // A signature pack was applied: the home screen pops in again in its new style
  useEffect(() => {
    const replay = () => setUnlockCount((count) => count + 1);
    window.addEventListener('vantage:pack', replay);
    return () => window.removeEventListener('vantage:pack', replay);
  }, []);
  const [locked, setLocked] = useState(true);
  const [openApp, setOpenApp] = useState<OpenApp | null>(null);
  const openAppRef = useRef<string | null>(null);
  openAppRef.current = openApp?.app.id ?? null;
  const lockedRef = useRef(true);
  lockedRef.current = locked;
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  /** Counts unlocks: the home screen items pop in each time */
  const [unlockCount, setUnlockCount] = useState(0);
  /** A Lock In-locked app someone tried to open */
  const [lockedApp, setLockedApp] = useState<string | null>(null);
  /** Recently opened apps, most recent first (for the app switcher) */
  const [recents, setRecents] = useState<string[]>([]);
  const [soundsEnabled] = useSetting('soundsEnabled');
  const [homeBlur] = useSetting('homeBlur');
  const [mode] = useSetting('mode');
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
    openApp: (requested: string, from?: ScreenRect | null) => {
      // Once Vantage is connected, Lock In lives inside it: its widgets and shortcuts open Vantage
      const appId = requested === 'lockin' && isVantageConnected() ? 'vantage' : requested;
      const app = getApp(appId);
      if (!app) return;
      closeAllOverlays();
      // App styles: "Original" opens the real iPhone app instead
      if (getSettings().appStyles[appId] === 'original' && app.bundleId && canOpenApp(app.bundleId)) {
        void openNativeApp(app.bundleId);
        return;
      }
      // Lock In: a locked distraction shows the calm lock screen instead
      if (blockState(appId).locked) {
        setLockedApp(appId);
        return;
      }
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
    unlock: () => {
      if (hasPasscode()) setPasscodeOpen(true);
      else {
        setLocked(false);
        setUnlockCount((count) => count + 1);
        morningSummary();
      }
    },
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

  // Lock In: count a minute of use for the open app (for daily limits)
  const openAppId = openApp?.app.id;
  useEffect(() => {
    if (!openAppId || locked) return;
    const id = window.setInterval(() => document.visibilityState === 'visible' && countUsage(openAppId), 60_000);
    return () => window.clearInterval(id);
  }, [openAppId, locked]);

  // Wind Down and your own scheduled modes switch on and off by themselves
  useWindDownSchedule();
  useCustomModeSchedule();
  useDailyShuffle();

  const openAppFrom = (appId: string, from: ScreenRect | null) => void runAction('app.open', { appId, from: from as DOMRect | null });

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
    // Reduce motion (in Settings): springs become instant fades everywhere
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
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
            {/* The home screen sinks back a little while an app is open */}
            <motion.div
              className={styles.homeLayer}
              initial={false}
              animate={{ scale: openApp ? 0.94 : 1, opacity: openApp ? 0.6 : 1 }}
              transition={SPRING.app}
            >
              {mode === 'focus' || mode === 'winddown' ? (
                <ModeHome mode={mode} onOpenApp={openAppFrom} />
              ) : (
                <HomeScreen onOpenApp={openAppFrom} onSwipeDown={openSearch} onSwipeDownFromTop={swipeDownFromTop} enterKey={unlockCount} />
              )}
            </motion.div>
          </>
        )}
        <Search
          open={searchOpen}
          inputRef={searchInput}
          actions={actions}
          recents={recents}
          onClose={closeSearch}
          onOpenApp={openAppFrom}
        />
        {openApp && (
          <AppView
            key={openApp.app.id}
            app={openApp.app}
            from={openApp.from}
            // Back into what it came out of (a widget), or its icon
            getReturnRect={() => openApp.from ?? findIconRect(openApp.app.id)}
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
            setUnlockCount((count) => count + 1);
            morningSummary();
          }}
          onCancel={() => setPasscodeOpen(false)}
        />
        <LockedApp appId={lockedApp} onClose={() => setLockedApp(null)} />
        {/* Time and battery along the top, above home and apps (the lock screen has its own) */}
        <StatusStrip hidden={retro || locked} />
        <AlarmRinging />
        <TimerBanner />
        {/* Wind Down: a warm layer and slow dimming over everything (touches go through) */}
        <div className={styles.windDown} aria-hidden="true" />
        {/* A new phone: the first-boot setup, after the boot animation */}
        <AnimatePresence>{!setupDone && !booting && <FirstSetup key="setup" />}</AnimatePresence>
        <GameBoyBoot />
        <VantageOverlay />
        {booting && <Boot onDone={() => setBooting(false)} />}
      </div>
    </MotionConfig>
  );
}

import { isHosted } from '../../system/nativeBridge';
import { useState, type ComponentType } from 'react';
import {
  BluetoothIcon,
  BellIcon,
  BoltIcon,
  FlagIcon,
  GridIcon,
  LockIcon,
  MoonIcon,
  SoundIcon,
  SunIcon,
  TextIcon,
  WifiIcon,
} from '../../components/glyphs';
import { AppShell, Button } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { CustomiseIcon, MusicIcon } from '../../system/appIcons';
import { LOCK_CLOCK_NAMES, useSettings } from '../../system/settingsStore';
import { useSetups } from '../../system/setups';
import { useLabWidgets } from '../../shell/widgets/lab/labStore';
import { setQuietThemeChanges, useTheme } from '../../system/theme';
import { playSound } from '../../system/sounds';
import { getPreset } from '../../theme/presets';
import { wallpaperName } from '../../theme/wallpapers';
import { AccentPage } from '../settings/AccentPage';
import { AccessibilityPage } from '../settings/AccessibilityPage';
import { AppearancePage } from '../settings/AppearancePage';
import { ModePage } from '../settings/ModePage';
import { SoundPage } from '../settings/SoundPage';
import { ThemesPage } from '../settings/ThemesPage';
import { WallpaperPage } from '../settings/WallpaperPage';
import { WidgetsPage } from '../settings/WidgetsPage';
import { setCustomiseSection, useCustomiseSection } from './customiseNav';
import { KeyboardPage } from './KeyboardPage';
import { LivePreview } from './LivePreview';
import { LockScreenPage } from './LockScreenPage';
import { MusicPage } from './MusicPage';
import { SetupsPage } from './SetupsPage';
import {
  BootPage,
  ControlCenterPage,
  FontsPage,
  HomeScreenPage,
  IconsPage,
  LivePillPage,
  MotionPage,
  NotificationsPage,
} from './SystemSections';
import { WidgetLabPage } from './WidgetLabPage';
import { StatusBarPage } from './StatusBarPage';
import { CircleIcon, LayersIcon, PaletteIcon, PictureIcon, SparkIcon } from './icons';
import styles from './CustomiseApp.module.css';

type SectionId =
  | 'themes'
  | 'colors'
  | 'appearance'
  | 'wallpapers'
  | 'lock'
  | 'home'
  | 'icons'
  | 'fonts'
  | 'keyboard'
  | 'widgets'
  | 'widgetlab'
  | 'statusbar'
  | 'controls'
  | 'notifications'
  | 'pill'
  | 'motion'
  | 'sounds'
  | 'music'
  | 'boot'
  | 'modes'
  | 'access'
  | 'setups';

interface SectionDef {
  id: SectionId;
  name: string;
  icon: ComponentType;
  page: ComponentType<{ onBack: () => void }>;
}

const LOOK: SectionDef[] = [
  { id: 'themes', name: 'Themes', icon: PaletteIcon, page: ThemesPage },
  { id: 'colors', name: 'Colors', icon: CustomiseIcon, page: AccentPage },
  { id: 'appearance', name: 'Light and dark', icon: SunIcon, page: AppearancePage },
  { id: 'wallpapers', name: 'Wallpapers', icon: PictureIcon, page: WallpaperPage },
  { id: 'lock', name: 'Lock screen', icon: LockIcon, page: LockScreenPage },
  { id: 'home', name: 'Home screen', icon: GridIcon, page: HomeScreenPage },
  { id: 'icons', name: 'Icons', icon: CircleIcon, page: IconsPage },
  { id: 'fonts', name: 'Fonts', icon: TextIcon, page: FontsPage },
  { id: 'keyboard', name: 'Keyboard', icon: GridIcon, page: KeyboardPage },
  { id: 'widgets', name: 'Widget style', icon: LayersIcon, page: WidgetsPage },
  { id: 'widgetlab', name: 'Widget Lab', icon: SparkIcon, page: WidgetLabPage },
];

const SYSTEM: SectionDef[] = [
  { id: 'statusbar', name: 'Status bar', icon: BoltIcon, page: StatusBarPage },
  { id: 'controls', name: 'Control center', icon: WifiIcon, page: ControlCenterPage },
  { id: 'notifications', name: 'Notifications', icon: BellIcon, page: NotificationsPage },
  { id: 'pill', name: 'Live pill', icon: FlagIcon, page: LivePillPage },
  { id: 'motion', name: 'Motion and feel', icon: SparkIcon, page: MotionPage },
  { id: 'sounds', name: 'Sounds', icon: SoundIcon, page: SoundPage },
  { id: 'music', name: 'Music', icon: MusicIcon, page: MusicPage },
  { id: 'boot', name: 'Boot and unlock', icon: LockIcon, page: BootPage },
  { id: 'modes', name: 'Modes', icon: MoonIcon, page: ModePage },
  { id: 'access', name: 'Accessibility', icon: TextIcon, page: AccessibilityPage },
  { id: 'setups', name: 'Setups', icon: LayersIcon, page: SetupsPage },
];

const MODE_NAMES = { clean: 'Clean', focus: 'Focus', retro: 'Retro', winddown: 'Wind Down', hacker: 'Hacker' } as const;
/** Real iOS Settings pages, opened from SpringBoard (prefs URLs). */
const PHONE_SETTINGS = [
  { name: 'Wi-Fi', url: 'App-prefs:WIFI', icon: WifiIcon },
  { name: 'Bluetooth', url: 'App-prefs:Bluetooth', icon: BluetoothIcon },
  { name: 'Display', url: 'App-prefs:DISPLAY', icon: SunIcon },
  { name: 'Notifications', url: 'App-prefs:NOTIFICATIONS_ID', icon: BellIcon },
  { name: 'Battery', url: 'App-prefs:BATTERY_USAGE', icon: BoltIcon },
  { name: 'General', url: 'App-prefs:General', icon: GridIcon },
];

/** Opens a page of the real iOS Settings app (VantageHost hands App-prefs: URLs to iOS). */
function openIosSettings(url: string) {
  window.location.href = url;
}

const STYLE_NAMES = { solid: 'Solid', glass: 'Glass', outline: 'Outline', tinted: 'Tinted', glossy: 'Glossy', pill: 'Black', colorblock: 'Color block', paper: 'Paper', line: 'Line' } as const;
const APPEARANCE_NAMES = { dark: 'Dark', light: 'Light', auto: 'Automatic' } as const;
const BATTERY_NAMES = { percent: 'Battery number', ring: 'Battery ring', bar: 'Battery bar', pixel: 'Pixel battery' } as const;

/**
 * Customise: everything about how the phone looks and feels. A live mini
 * phone at the top shows each change instantly; "Surprise me" picks a
 * random look; the sections are grouped LOOK and SYSTEM.
 */
export function CustomiseApp() {
  const open = useCustomiseSection() as SectionId | null;
  const setOpen = setCustomiseSection;
  const settings = useSettings();
  const theme = useTheme();
  const setups = useSetups();
  const labCount = useLabWidgets().length;
  const [spinning, setSpinning] = useState(false);
  const [reelTick, setReelTick] = useState(0);

  // "Surprise me": like a slot machine, a run of random looks that slows
  // down, then stops on one (the last one gets the full theme animation)
  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    const delays = [70, 80, 90, 110, 130, 160, 200, 260, 340];
    let at = 0;
    delays.forEach((delay, index) => {
      at += delay;
      window.setTimeout(() => {
        const last = index === delays.length - 1;
        setQuietThemeChanges(!last);
        void runAction('customise.surprise', {});
        setReelTick((tick) => tick + 1);
        playSound('tick');
        if (last) {
          window.setTimeout(() => setQuietThemeChanges(false), 50);
          setSpinning(false);
        }
      }, at);
    });
  };

  const all = [...LOOK, ...SYSTEM];
  const section = all.find((item) => item.id === open);
  if (section) {
    const Page = section.page;
    return <Page onBack={() => setOpen(null)} />;
  }

  const values: Record<SectionId, string> = {
    themes: theme.presetName,
    colors: theme.retro
      ? 'Ink'
      : settings.matchWallpaper
        ? 'From wallpaper'
        : settings.accent
          ? settings.accent.toUpperCase()
          : getPreset(theme.presetId).accentName,
    appearance: APPEARANCE_NAMES[settings.appearance],
    wallpapers: theme.retro ? 'Theme' : wallpaperName(settings.wallpaper),
    lock: LOCK_CLOCK_NAMES[settings.lockClockStyle],
    statusbar: BATTERY_NAMES[settings.batteryStyle],
    home: { dots: 'Page dots', numbers: 'Page numbers', hidden: 'No indicator' }[settings.pageDots],
    icons: settings.iconLook === 'glyph' ? `Vantage glyph, ${settings.iconShape}` : settings.iconLook === 'tinted' ? 'Tinted' : 'Original',
    fonts: { inter: 'Inter', system: 'System', serif: 'Serif', mono: 'Mono' }[settings.uiFont],
    keyboard: settings.keyboard === 'system' ? 'iOS keyboard' : `Vantage, ${{ theme: 'theme', glass: 'glass', terminal: 'terminal', pixel: 'pixel', minimal: 'plain' }[settings.keyboardStyle]}`,
    widgetlab: labCount ? `${labCount} made` : 'Build your own',
    controls: settings.controlStyle === 'dial' ? 'Round dial' : 'Slider',
    notifications: settings.lockNotifications === 'count' ? 'Count on lock' : 'Hidden on lock',
    pill:
      [settings.pillTimer && 'Timer', settings.pillStopwatch && 'Stopwatch', settings.pillRecording && 'Recording']
        .filter(Boolean)
        .join(', ') || 'Off',
    music: 'Spotify, Apple Music',
    boot: settings.bootAnimation ? 'Animation on' : 'Animation off',
    access: settings.highContrast ? 'High contrast' : `${Math.round(settings.textScale * 100)}% text`,
    widgets: theme.retro ? 'Retro' : STYLE_NAMES[settings.widgetStyle],
    modes: MODE_NAMES[settings.mode],
    motion: settings.reduceMotion ? 'Reduced' : `${settings.animationSpeed}x, ${Math.round(settings.springBounce * 100)}% bounce`,
    sounds: settings.soundsEnabled
      ? `${settings.soundPack === 'auto' ? 'Auto' : settings.soundPack[0].toUpperCase() + settings.soundPack.slice(1)}, ${Math.round(settings.soundVolume * 100)}%`
      : 'Off',
    setups: setups.length ? `${setups.length} saved` : 'Save and share',
  };

  const grid = (label: string, items: SectionDef[]) => (
    <section className={styles.group}>
      <h2 className="label">{label}</h2>
      <div className={styles.grid}>
        {items.map(({ id, name, icon: Glyph }) => (
          <Pressable key={id} className={styles.tile} onClick={() => setOpen(id)}>
            <span className={styles.tileIcon}>
              <Glyph />
            </span>
            <span className={styles.tileName}>{name}</span>
            <span className={styles.tileValue}>{values[id]}</span>
          </Pressable>
        ))}
      </div>
    </section>
  );

  return (
    <AppShell title="Customise">
      <LivePreview />
      <div className={styles.surprise}>
        <Button icon={SparkIcon} disabled={spinning} onPress={spin}>
          {spinning ? 'Spinning' : 'Surprise me'}
        </Button>
        {/* The reel: the look's name rolls past like a slot machine */}
        <div className={styles.reel} aria-live="polite">
          {/* A new key restarts the roll-in each time the look changes */}
          <span key={`${theme.presetName}-${reelTick}`} className={`${styles.reelText} ${spinning ? styles.fast : ''}`}>
            {theme.presetName} · {wallpaperName(settings.wallpaper)}
          </span>
        </div>
      </div>
      {grid('Look', LOOK)}
      {grid('System', SYSTEM)}
      {/* On the phone: shortcuts into the REAL iOS Settings (Part 2) */}
      {isHosted() && (
        <section className={styles.group}>
          <h2 className="label">Phone settings</h2>
          <div className={styles.grid}>
            {PHONE_SETTINGS.map(({ name, url, icon: Glyph }) => (
              <Pressable key={url} className={styles.tile} onClick={() => void openIosSettings(url)}>
                <span className={styles.tileIcon}>
                  <Glyph />
                </span>
                <span className={styles.tileName}>{name}</span>
                <span className={styles.tileValue}>Settings</span>
              </Pressable>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

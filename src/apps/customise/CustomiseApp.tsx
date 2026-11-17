import { useState, type ComponentType } from 'react';
import { BellIcon, BoltIcon, FlagIcon, GridIcon, LockIcon, MoonIcon, SoundIcon, SunIcon, TextIcon, WifiIcon } from '../../components/glyphs';
import { AppShell, Button } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { CustomiseIcon, MusicIcon } from '../../system/appIcons';
import { useSettings } from '../../system/settingsStore';
import { useSetups } from '../../system/setups';
import { useLabWidgets } from '../../shell/widgets/lab/labStore';
import { useTheme } from '../../system/theme';
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

const MODE_NAMES = { clean: 'Clean', focus: 'Focus', retro: 'Retro', winddown: 'Wind Down' } as const;
const STYLE_NAMES = { solid: 'Solid', glass: 'Glass', outline: 'Outline', tinted: 'Tinted' } as const;
const APPEARANCE_NAMES = { dark: 'Dark', light: 'Light', auto: 'Automatic' } as const;
const LOCK_NAMES = {
  dot: 'Dot clock',
  pixel: 'Pixel clock',
  serif: 'Serif clock',
  vertical: 'Vertical clock',
  analog: 'Thin analog',
  flip: 'Flip clock',
  binary: 'Binary clock',
  word: 'Word clock',
} as const;
const BATTERY_NAMES = { percent: 'Battery number', ring: 'Battery ring', bar: 'Battery bar', pixel: 'Pixel battery' } as const;

/**
 * Customise: everything about how the phone looks and feels. A live mini
 * phone at the top shows each change instantly; "Surprise me" picks a
 * random look; the sections are grouped LOOK and SYSTEM.
 */
export function CustomiseApp() {
  const [open, setOpen] = useState<SectionId | null>(null);
  const settings = useSettings();
  const theme = useTheme();
  const setups = useSetups();
  const labCount = useLabWidgets().length;

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
    lock: LOCK_NAMES[settings.lockClockStyle],
    statusbar: BATTERY_NAMES[settings.batteryStyle],
    home: { dots: 'Page dots', numbers: 'Page numbers', hidden: 'No indicator' }[settings.pageDots],
    icons: `${settings.iconShape[0].toUpperCase()}${settings.iconShape.slice(1)}, ${settings.iconStyle}`,
    fonts: { inter: 'Inter', system: 'System', serif: 'Serif', mono: 'Mono' }[settings.uiFont],
    widgetlab: labCount ? `${labCount} made` : 'Build your own',
    controls: settings.controlStyle === 'dial' ? 'Round dial' : 'Slider',
    notifications: settings.lockNotifications === 'count' ? 'Count on lock' : 'Hidden on lock',
    pill: [settings.pillTimer && 'Timer', settings.pillStopwatch && 'Stopwatch', settings.pillRecording && 'Recording'].filter(Boolean).join(', ') || 'Off',
    music: 'Spotify, Apple Music',
    boot: settings.bootAnimation ? 'Animation on' : 'Animation off',
    access: settings.highContrast ? 'High contrast' : `${Math.round(settings.textScale * 100)}% text`,
    widgets: theme.retro ? 'Retro' : STYLE_NAMES[settings.widgetStyle],
    modes: MODE_NAMES[settings.mode],
    motion: settings.reduceMotion ? 'Reduced' : `${settings.animationSpeed}x, ${Math.round(settings.springBounce * 100)}% bounce`,
    sounds: settings.soundsEnabled ? `${Math.round(settings.soundVolume * 100)}%` : 'Off',
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
        <Button icon={SparkIcon} onPress={() => void runAction('customise.surprise', {})}>
          Surprise me
        </Button>
      </div>
      {grid('Look', LOOK)}
      {grid('System', SYSTEM)}
    </AppShell>
  );
}

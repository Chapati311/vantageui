import { useState, type ComponentType } from 'react';
import { GridIcon, MoonIcon, SoundIcon, SunIcon } from '../../components/glyphs';
import { AppShell, Button } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { CustomiseIcon } from '../../system/appIcons';
import { useSettings } from '../../system/settingsStore';
import { useSetups } from '../../system/setups';
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
import { SetupsPage } from './SetupsPage';
import { LayersIcon, PaletteIcon, PictureIcon, SparkIcon } from './icons';
import styles from './CustomiseApp.module.css';

type SectionId = 'themes' | 'colors' | 'appearance' | 'wallpapers' | 'widgets' | 'modes' | 'motion' | 'sounds' | 'setups';

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
  { id: 'widgets', name: 'Widgets', icon: GridIcon, page: WidgetsPage },
];

const SYSTEM: SectionDef[] = [
  { id: 'modes', name: 'Modes', icon: MoonIcon, page: ModePage },
  { id: 'motion', name: 'Motion and text', icon: SparkIcon, page: AccessibilityPage },
  { id: 'sounds', name: 'Sounds', icon: SoundIcon, page: SoundPage },
  { id: 'setups', name: 'Setups', icon: LayersIcon, page: SetupsPage },
];

const MODE_NAMES = { clean: 'Clean', focus: 'Focus', retro: 'Retro', winddown: 'Wind Down' } as const;
const STYLE_NAMES = { solid: 'Solid', glass: 'Glass', outline: 'Outline', tinted: 'Tinted' } as const;
const APPEARANCE_NAMES = { dark: 'Dark', light: 'Light', auto: 'Automatic' } as const;

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
    widgets: theme.retro ? 'Retro' : STYLE_NAMES[settings.widgetStyle],
    modes: MODE_NAMES[settings.mode],
    motion: settings.reduceMotion ? 'Reduced' : `${settings.animationSpeed}x speed`,
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

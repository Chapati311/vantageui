import { useState, type ComponentType } from 'react';
import { Pressable } from '../../components/Pressable';
import { BackIcon } from '../../components/glyphs';
import { useSettings } from '../../system/settingsStore';
import { useTheme } from '../../system/theme';
import { getPreset } from '../../theme/presets';
import { wallpaperName } from '../../theme/wallpapers';
import { AccentPage } from './AccentPage';
import { AccessibilityPage } from './AccessibilityPage';
import { AppearancePage } from './AppearancePage';
import { ModePage } from './ModePage';
import { Section, SettingsPage } from './SettingsPage';
import { SoundPage } from './SoundPage';
import { ThemesPage } from './ThemesPage';
import { WallpaperPage } from './WallpaperPage';
import { WidgetsPage } from './WidgetsPage';
import styles from './SettingsApp.module.css';

type PageId = 'themes' | 'appearance' | 'accent' | 'wallpaper' | 'mode' | 'widgets' | 'access' | 'sound';

const PAGES: Record<PageId, ComponentType<{ onBack: () => void }>> = {
  themes: ThemesPage,
  appearance: AppearancePage,
  accent: AccentPage,
  wallpaper: WallpaperPage,
  mode: ModePage,
  widgets: WidgetsPage,
  access: AccessibilityPage,
  sound: SoundPage,
};

const MODE_NAMES = { clean: 'Clean', focus: 'Focus', retro: 'Retro', winddown: 'Wind Down' } as const;
const STYLE_NAMES = { solid: 'Solid', glass: 'Glass', outline: 'Outline', tinted: 'Tinted' } as const;
const APPEARANCE_NAMES = { dark: 'Dark', light: 'Light', auto: 'Automatic' } as const;

/** The main Settings list. Each row opens a page. */
export function SettingsApp() {
  const [page, setPage] = useState<PageId | null>(null);
  const s = useSettings();
  const theme = useTheme();

  if (page) {
    const Page = PAGES[page];
    return <Page onBack={() => setPage(null)} />;
  }

  const row = (id: PageId, name: string, value: string) => (
    <Pressable key={id} className={styles.menuRow} onClick={() => setPage(id)}>
      <span className={styles.menuName}>{name}</span>
      <span className={styles.menuValue}>{value}</span>
      <span className={styles.chevron}>
        <BackIcon />
      </span>
    </Pressable>
  );

  const accent = theme.retro
    ? 'Ink'
    : s.matchWallpaper
      ? 'From wallpaper'
      : s.accent
        ? s.accent.toUpperCase()
        : `${getPreset(theme.presetId).accentName}`;

  return (
    <SettingsPage title="Settings">
      <Section label="Look">
        <div className={styles.menu}>
          {row('themes', 'Themes', theme.presetName)}
          {row('appearance', 'Appearance', APPEARANCE_NAMES[s.appearance])}
          {row('accent', 'Accent', accent)}
          {row('wallpaper', 'Wallpaper', theme.retro ? 'Theme' : wallpaperName(s.wallpaper))}
          {row('widgets', 'Widgets', theme.retro ? 'Retro' : STYLE_NAMES[s.widgetStyle])}
        </div>
      </Section>
      <Section label="System">
        <div className={styles.menu}>
          {row('mode', 'Mode', MODE_NAMES[s.mode])}
          {row('access', 'Text and motion', s.reduceMotion ? 'Reduced motion' : `${Math.round(s.textScale * 100)}% text`)}
          {row('sound', 'Sound', s.soundsEnabled ? `${Math.round(s.soundVolume * 100)}%` : 'Off')}
        </div>
      </Section>
    </SettingsPage>
  );
}

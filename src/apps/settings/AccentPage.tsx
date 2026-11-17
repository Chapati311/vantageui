import { Pressable } from '../../components/Pressable';
import { Toggle } from '../../components/Toggle';
import { CheckIcon } from '../../components/glyphs';
import { runAction } from '../../system/actions';
import { useSettings } from '../../system/settingsStore';
import { useTheme } from '../../system/theme';
import { SUGGESTED_ACCENTS, getPreset } from '../../theme/presets';
import { Section, SettingsPage } from './SettingsPage';
import styles from './SettingsApp.module.css';

/** The accent color: the theme's own, a suggestion, any color, or from the wallpaper. */
export function AccentPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  const theme = useTheme();
  const retro = theme.retro !== null;
  const themeAccent = getPreset(theme.presetId).accent;
  const current = s.matchWallpaper ? null : (s.accent?.toLowerCase() ?? null);

  const swatch = (color: string | null, label: string) => {
    const shown = color ?? themeAccent;
    const selected = !s.matchWallpaper && (color === null ? current === null : current === color.toLowerCase());
    return (
      <Pressable
        key={label}
        className={`${styles.swatch} ${selected ? styles.selected : ''}`}
        style={{ background: shown }}
        aria-label={label}
        aria-pressed={selected}
        onClick={() => void runAction('theme.setAccent', { color })}
      />
    );
  };

  return (
    <SettingsPage title="Accent" onBack={onBack}>
      {retro ? (
        <Section label="Accent" note="Retro themes draw everything in their own ink color, so the accent is not used." >
          <span />
        </Section>
      ) : (
        <>
          <Section label="Suggested" note="The first color is the theme's own accent.">
            <div className={styles.swatches}>
              {swatch(null, `Theme accent (${themeAccent})`)}
              {SUGGESTED_ACCENTS.filter((color) => color.toLowerCase() !== themeAccent.toLowerCase()).map((color) =>
                swatch(color, color),
              )}
              {/* Any color: the phone's own color picker */}
              <label className={`${styles.swatch} ${styles.anyColor}`} aria-label="Any color">
                <input
                  type="color"
                  value={s.accent ?? themeAccent}
                  onChange={(event) => void runAction('theme.setAccent', { color: event.target.value })}
                />
              </label>
            </div>
          </Section>

          {theme.wallpaperColors && theme.wallpaperColors.swatches.length > 0 && (
            <Section label="From your wallpaper">
              <div className={styles.swatches}>
                {theme.wallpaperColors.swatches.map((color) => swatch(color, color))}
              </div>
            </Section>
          )}

          <Section
            label="Colors from wallpaper"
            note={
              theme.wallpaperColors
                ? 'The most vivid color of the wallpaper becomes the accent (made readable), and every surface is tinted 4% toward it.'
                : 'Choose a photo, gradient or solid wallpaper to use this. Live wallpapers have no colors of their own.'
            }
          >
            <div className={styles.row}>
              <span>Match wallpaper</span>
              <Toggle
                label="Match wallpaper"
                on={s.matchWallpaper}
                onChange={(on) => void runAction('theme.matchWallpaper', { on })}
              />
            </div>
          </Section>

          {s.matchWallpaper && theme.wallpaperColors && (
            <Section label="Accent now">
              <div className={styles.row}>
                <span>{theme.accent.toUpperCase()}</span>
                <span className={`${styles.swatch} ${styles.selected}`} style={{ width: 28, background: theme.accent }}>
                  <CheckIcon />
                </span>
              </div>
            </Section>
          )}
        </>
      )}
    </SettingsPage>
  );
}

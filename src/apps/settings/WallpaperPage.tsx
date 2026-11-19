import { useRef, useState } from 'react';
import { Pressable } from '../../components/Pressable';
import { ScaledPreview } from '../../components/ScaledPreview';
import { Row, Section as KitSection, SegmentedControl, Slider, Toggle } from '../../components/kit';
import { Wallpaper } from '../../shell/wallpaper/Wallpaper';
import { runAction } from '../../system/actions';
import { useSettings } from '../../system/settingsStore';
import { useTheme } from '../../system/theme';
import { useWallpaperPhoto } from '../../system/wallpaperPhoto';
import {
  GRADIENTS,
  LIVE_WALLPAPERS,
  SOLID_COLORS,
  sameWallpaper,
  type WallpaperConfig,
} from '../../theme/wallpapers';
import { changeSetting } from './setSetting';
import { Section, SettingsPage } from './SettingsPage';
import styles from './SettingsApp.module.css';

/** Live, gradient, solid or your own photo, and how it looks behind the home screen. */
export function WallpaperPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  const theme = useTheme();
  const photo = useWallpaperPhoto();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Which screen the tiles below change
  const [screen, setScreen] = useState<'both' | 'home' | 'lock'>(s.lockWallpaper ? 'home' : 'both');
  const current = screen === 'lock' ? (s.lockWallpaper ?? s.wallpaper) : s.wallpaper;
  const choose = (wallpaper: WallpaperConfig) => void runAction('wallpaper.set', { wallpaper, screen });

  const tile = (wallpaper: WallpaperConfig, name: string) => {
    const selected = sameWallpaper(wallpaper, current);
    return (
      <Pressable
        key={name}
        className={`${styles.tile} ${selected ? styles.selected : ''}`}
        aria-pressed={selected}
        onClick={() => choose(wallpaper)}
      >
        <span className={styles.tileFrame}>
          <ScaledPreview>
            <Wallpaper place="preview" config={wallpaper} paused />
          </ScaledPreview>
        </span>
        <span className={styles.tileName}>{name}</span>
      </Pressable>
    );
  };

  if (theme.retro) {
    return (
      <SettingsPage title="Wallpaper" onBack={onBack}>
        <Section label="Wallpaper" note="Retro themes always use their own screen. Choose a modern theme to change the wallpaper.">
          <span />
        </Section>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage title="Wallpaper" onBack={onBack}>
      <Section label="Change it for" note={screen === 'lock' ? 'The lock screen gets its own wallpaper.' : screen === 'home' ? 'Only the home screen changes.' : 'Home and lock screen the same.'}>
        <SegmentedControl
          label="Change it for"
          value={screen}
          onChange={setScreen}
          options={[
            { id: 'both', label: 'Both' },
            { id: 'home', label: 'Home' },
            { id: 'lock', label: 'Lock' },
          ]}
        />
      </Section>

      <Section label="Every day">
        <KitSection>
          <Row
            title="Daily shuffle"
            detail="A different live wallpaper every day"
            trailing={<Toggle label="Daily shuffle" on={s.wallpaperShuffle} onChange={(on) => changeSetting('wallpaperShuffle', on)} />}
          />
          <Row
            title="React to the weather"
            detail="Rain dots, night stars, a sunset glow"
            trailing={<Toggle label="React to the weather" on={s.weatherWallpaper} onChange={(on) => changeSetting('weatherWallpaper', on)} />}
          />
        </KitSection>
      </Section>

      <Section label="Theme" note="The wallpaper that belongs to the theme you are using.">
        <div className={styles.tiles}>{tile({ kind: 'theme' }, `${theme.presetName}'s own`)}</div>
      </Section>

      <Section label="Live" note="Live wallpapers stop moving whenever you can't see them, to save battery.">
        <div className={styles.tiles}>{LIVE_WALLPAPERS.map((live) => tile({ kind: 'live', id: live.id }, live.name))}</div>
      </Section>

      <Section label="Gradient">
        <div className={styles.tiles}>
          {tile({ kind: 'gradient', id: 'theme' }, 'Theme')}
          {GRADIENTS.map((gradient) => tile({ kind: 'gradient', id: gradient.id }, gradient.name))}
        </div>
      </Section>

      <Section label="Solid">
        <div className={styles.swatches}>
          {SOLID_COLORS.map((solid) => {
            const wallpaper: WallpaperConfig = { kind: 'solid', color: solid.color };
            const selected = sameWallpaper(wallpaper, s.wallpaper);
            return (
              <Pressable
                key={solid.color}
                className={`${styles.swatch} ${selected ? styles.selected : ''}`}
                style={{
                  background: solid.color === 'bg' ? 'var(--color-bg)' : solid.color,
                  boxShadow: 'inset 0 0 0 1px var(--color-hairline)',
                }}
                aria-label={solid.name}
                aria-pressed={selected}
                onClick={() => choose(wallpaper)}
              />
            );
          })}
        </div>
      </Section>

      <Section
        label="Photo"
        note={error ?? 'Your photo stays on this phone. It is shrunk to screen size and its colors can tint the whole theme (see Accent).'}
      >
        {photo && <div className={styles.tiles}>{tile({ kind: 'photo' }, 'Your photo')}</div>}
        <div className={styles.buttons}>
          <Pressable className={styles.button} disabled={busy} onClick={() => fileInput.current?.click()}>
            {busy ? 'Loading' : photo ? 'Choose another' : 'Choose photo'}
          </Pressable>
          {photo && (
            <Pressable className={styles.button} onClick={() => void runAction('wallpaper.removePhoto', {})}>
              Remove
            </Pressable>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            setBusy(true);
            setError(null);
            try {
              await runAction('wallpaper.setPhoto', { file });
            } catch (problem) {
              setError(problem instanceof Error ? problem.message : 'This photo could not be used.');
            } finally {
              setBusy(false);
            }
          }}
        />
      </Section>

      <Section label="Behind the home screen" note="Darkening and blurring keep widgets easy to read on busy wallpapers. A blurred wallpaper doesn't move.">
        <Slider
          label="Darken"
          value={s.homeDim}
          min={0}
          max={0.8}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(value) => changeSetting('homeDim', value)}
        />
        <Slider
          label="Blur"
          value={s.homeBlur}
          min={0}
          max={24}
          step={2}
          format={(v) => `${v}`}
          onChange={(value) => changeSetting('homeBlur', value)}
        />
      </Section>
    </SettingsPage>
  );
}

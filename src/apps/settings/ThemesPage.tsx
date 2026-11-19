import { useState } from 'react';
import { Pressable } from '../../components/Pressable';
import { TrashIcon } from '../../components/glyphs';
import { runAction } from '../../system/actions';
import { useSettings } from '../../system/settingsStore';
import { PRESETS, presetsIn, type ThemeGroup } from '../../theme/presets';
import { getPack } from '../../theme/packs';
import { Section, SettingsPage } from './SettingsPage';
import { ThemeCard } from './ThemeCard';
import styles from './SettingsApp.module.css';

const GROUPS: { group: ThemeGroup; label: string; note: string }[] = [
  { group: 'dark', label: 'Dark', note: 'Used in dark mode.' },
  { group: 'light', label: 'Light', note: 'Used in light mode.' },
  {
    group: 'retro',
    label: 'Retro',
    note: 'Choosing one turns on Retro mode: pixel fonts, square pixels and the old-phone layout.',
  },
];

/** The 10 signature packs first, then all 21 presets as little phones, plus the looks you saved yourself. */
export function ThemesPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  const [name, setName] = useState('');

  const isChosen = (group: ThemeGroup, id: string) =>
    group === 'dark'
      ? s.darkTheme === id && s.mode !== 'retro'
      : group === 'light'
        ? s.lightTheme === id && s.mode !== 'retro'
        : s.retroTheme === id && s.mode === 'retro';

  const signature = PRESETS.filter((preset) => preset.signature);
  const packChosen = (id: string, group: ThemeGroup) =>
    s.mode !== 'retro' &&
    (group === 'dark' ? s.darkTheme === id && s.appearance !== 'light' : s.lightTheme === id && s.appearance !== 'dark');

  return (
    <SettingsPage title="Themes" onBack={onBack}>
      <Section label="Signature" note="Whole looks: wallpaper, widgets, icons, numbers, clock and sounds, made to go together.">
        <div className={`${styles.tiles} ${styles.tilesTwo}`}>
          {signature.map((preset) => {
            const pack = getPack(preset.id);
            const chosen = packChosen(preset.id, preset.group);
            return (
              <Pressable
                key={preset.id}
                className={`${styles.tile} ${chosen ? styles.selected : ''}`}
                aria-pressed={chosen}
                onClick={() => void runAction('theme.applyPack', { id: preset.id })}
              >
                <span className={styles.tileFrame}>
                  <ThemeCard preset={preset} />
                </span>
                <span className={styles.tileName}>{preset.name}</span>
                <span className={styles.tileDetail}>{pack?.description ?? preset.accentName}</span>
              </Pressable>
            );
          })}
        </div>
      </Section>

      {GROUPS.map(({ group, label, note }) => (
        <Section key={group} label={label} note={note}>
          <div className={`${styles.tiles} ${styles.tilesTwo}`}>
            {presetsIn(group)
              .filter((preset) => !preset.signature)
              .map((preset) => (
                <Pressable
                  key={preset.id}
                  className={`${styles.tile} ${isChosen(group, preset.id) ? styles.selected : ''}`}
                  aria-pressed={isChosen(group, preset.id)}
                  onClick={() => void runAction('theme.apply', { id: preset.id })}
                >
                  <span className={styles.tileFrame}>
                    <ThemeCard preset={preset} />
                  </span>
                  <span className={styles.tileName}>{preset.name}</span>
                  <span className={styles.tileDetail}>{preset.accentName}</span>
                </Pressable>
              ))}
          </div>
        </Section>
      ))}

      <Section label="My presets" note="Saves the themes, accent, wallpaper and widget style you have now.">
        {s.customPresets.map((preset) => (
          <div key={preset.id} className={styles.buttons}>
            <Pressable className={styles.button} onClick={() => void runAction('theme.applySavedPreset', { id: preset.id })}>
              {preset.name}
            </Pressable>
            <Pressable
              className={styles.button}
              style={{ flex: 'none' }}
              aria-label={`Delete ${preset.name}`}
              onClick={() => void runAction('theme.deleteSavedPreset', { id: preset.id })}
            >
              <TrashIcon />
            </Pressable>
          </div>
        ))}
        <form
          className={styles.buttons}
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            void runAction('theme.savePreset', { name });
            setName('');
          }}
        >
          <input
            className={styles.input}
            value={name}
            maxLength={24}
            placeholder="Name this look"
            aria-label="Name for the new preset"
            onChange={(event) => setName(event.target.value)}
          />
          <Pressable type="submit" className={styles.button} style={{ flex: 'none' }} disabled={!name.trim()}>
            Save
          </Pressable>
        </form>
      </Section>
    </SettingsPage>
  );
}

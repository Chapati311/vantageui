import type { ReactNode } from 'react';
import { ScrollArea } from '../../components/ScrollArea';
import { Segmented } from '../../components/Segmented';
import { Toggle } from '../../components/Toggle';
import {
  useSetting,
  type AccentId,
  type ModeId,
  type Wallpaper,
} from '../../system/settingsStore';
import { AccentPicker } from './AccentPicker';
import styles from './SettingsApp.module.css';

const WALLPAPERS: { id: Wallpaper; label: string }[] = [
  { id: 'orbit', label: 'Orbit' },
  { id: 'dots', label: 'Dots' },
  { id: 'plain', label: 'Plain' },
];

const MODES: { id: ModeId; label: string }[] = [
  { id: 'clean', label: 'Clean' },
  { id: 'focus', label: 'Focus' },
  { id: 'retro', label: 'Retro' },
];

const ACCENTS: { id: AccentId; name: string }[] = [
  { id: 'mint', name: 'Mint' },
  { id: 'amber', name: 'Amber' },
  { id: 'coral', name: 'Coral' },
  { id: 'violet', name: 'Violet' },
  { id: 'sky', name: 'Sky' },
];

export function SettingsApp() {
  const [wallpaper, setWallpaper] = useSetting('wallpaper');
  const [accent, setAccent] = useSetting('accent');
  const [lightMode, setLightMode] = useSetting('lightMode');
  const [soundsEnabled, setSoundsEnabled] = useSetting('soundsEnabled');
  const [mode, setMode] = useSetting('mode');

  return (
    <ScrollArea className={styles.app}>
      <h1 className={styles.title}>Settings</h1>

      <Section label="Lock screen wallpaper">
        <Segmented label="Wallpaper" options={WALLPAPERS} value={wallpaper} onChange={setWallpaper} />
      </Section>

      <Section label="Accent color">
        <AccentPicker accents={ACCENTS} value={accent} onChange={setAccent} />
      </Section>

      <Section label="Look and sound">
        <div className={styles.row}>
          <span>Light mode</span>
          <Toggle label="Light mode" on={lightMode} onChange={setLightMode} />
        </div>
        <div className={styles.row}>
          <span>Sounds</span>
          <Toggle label="Sounds" on={soundsEnabled} onChange={setSoundsEnabled} />
        </div>
      </Section>

      <Section label="Mode" note="Saved for later. Focus and Retro don't change anything yet.">
        <Segmented label="Mode" options={MODES} value={mode} onChange={setMode} />
      </Section>
    </ScrollArea>
  );
}

function Section({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className="label">{label}</h2>
      {children}
      {note && <p className={styles.note}>{note}</p>}
    </section>
  );
}

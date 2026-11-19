import { Slider } from '../../components/kit/Slider';
import { Toggle } from '../../components/kit/Toggle';
import { SegmentedControl } from '../../components/kit/SegmentedControl';
import { useSettings } from '../../system/settingsStore';
import { playSound } from '../../system/sounds';
import { changeSetting } from './setSetting';
import { Section, SettingsPage } from './SettingsPage';
import styles from './SettingsApp.module.css';

/** UI sounds on or off, how loud, and which sound pack. */
export function SoundPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  return (
    <SettingsPage title="Sound" onBack={onBack}>
      <Section
        label="UI sounds"
        note="Short sounds for unlocking, opening apps and switches. A web app can't see the silent switch, so they are quiet."
      >
        <div className={styles.row}>
          <span>Sounds</span>
          <Toggle label="Sounds" on={s.soundsEnabled} onChange={(on) => changeSetting('soundsEnabled', on)} />
        </div>
        {s.soundsEnabled && (
          <Slider
            label="Volume"
            value={s.soundVolume}
            min={0.1}
            max={1}
            step={0.1}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(value) => {
              changeSetting('soundVolume', value);
              playSound('toggleOn');
            }}
          />
        )}
      </Section>

      {s.soundsEnabled && (
        <Section label="Sound pack" note="Auto follows the theme: soft tones, or bleeps in retro themes. Tap one to hear it.">
          <SegmentedControl
            label="Sound pack"
            value={s.soundPack}
            onChange={(value) => {
              changeSetting('soundPack', value);
              window.setTimeout(() => playSound('unlock'), 30);
            }}
            options={[
              { id: 'auto', label: 'Auto' },
              { id: 'soft', label: 'Soft' },
              { id: 'glass', label: 'Glass' },
              { id: 'keys', label: 'Keys' },
              { id: 'retro', label: 'Retro' },
            ]}
          />
        </Section>
      )}
    </SettingsPage>
  );
}

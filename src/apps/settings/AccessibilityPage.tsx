import { Slider } from '../../components/kit/Slider';
import { Toggle } from '../../components/kit/Toggle';
import { useSettings } from '../../system/settingsStore';
import { changeSetting } from './setSetting';
import { Section, SettingsPage } from './SettingsPage';
import styles from './SettingsApp.module.css';

const percent = (v: number) => `${Math.round(v * 100)}%`;

/** Text size, bold text, contrast and motion. */
export function AccessibilityPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  return (
    <SettingsPage title="Text and motion" onBack={onBack}>
      <Section label="Text" note="Dot-matrix numbers keep their size so the grid stays exact.">
        <Slider
          label="Text size"
          value={s.textScale}
          min={0.85}
          max={1.3}
          step={0.05}
          format={percent}
          onChange={(value) => changeSetting('textScale', value)}
        />
        <div className={styles.row}>
          <span>Bold text</span>
          <Toggle label="Bold text" on={s.boldText} onChange={(on) => changeSetting('boldText', on)} />
        </div>
        <div className={styles.row}>
          <span>High contrast</span>
          <Toggle label="High contrast" on={s.highContrast} onChange={(on) => changeSetting('highContrast', on)} />
        </div>
      </Section>
      <Section label="Motion">
        <Slider
          label="Speed"
          value={s.animationSpeed}
          min={0.6}
          max={1.6}
          step={0.1}
          format={percent}
          onChange={(value) => changeSetting('animationSpeed', value)}
        />
        <div className={styles.row}>
          <span>Reduce motion</span>
          <Toggle label="Reduce motion" on={s.reduceMotion} onChange={(on) => changeSetting('reduceMotion', on)} />
        </div>
      </Section>
    </SettingsPage>
  );
}

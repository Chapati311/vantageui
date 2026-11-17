import { Pressable } from '../../components/Pressable';
import { ScaledPreview } from '../../components/ScaledPreview';
import { SegmentedControl } from '../../components/kit';
import { runAction } from '../../system/actions';
import { LOCK_CLOCK_STYLES, useSettings, type LockClockStyle } from '../../system/settingsStore';
import { LockClock } from '../../shell/LockClock';
import { Section, SettingsPage } from '../settings/SettingsPage';
import styles from './LockScreenPage.module.css';

const NAMES: Record<LockClockStyle, string> = {
  dot: 'Dot',
  pixel: 'Pixel',
  serif: 'Serif',
  vertical: 'Vertical',
  analog: 'Thin analog',
  flip: 'Flip',
  binary: 'Binary',
  word: 'Words',
};

/** Lock screen clock: eight styles, two sizes, two positions. */
export function LockScreenPage({ onBack }: { onBack: () => void }) {
  const settings = useSettings();

  return (
    <SettingsPage title="Lock screen" onBack={onBack}>
      <Section label="Clock style">
        <div className={styles.grid}>
          {LOCK_CLOCK_STYLES.map((id) => (
            <Pressable
              key={id}
              className={`${styles.tile} ${settings.lockClockStyle === id ? styles.selected : ''}`}
              aria-pressed={settings.lockClockStyle === id}
              onClick={() => void runAction('settings.set', { key: 'lockClockStyle', value: id })}
            >
              <span className={styles.frame}>
                <ScaledPreview>
                  <div className={styles.screen}>
                    <LockClock style={id} />
                  </div>
                </ScaledPreview>
              </span>
              <span className={styles.name}>{NAMES[id]}</span>
            </Pressable>
          ))}
        </div>
      </Section>

      <Section label="Size">
        <SegmentedControl
          label="Clock size"
          value={settings.lockClockSize}
          onChange={(value) => void runAction('settings.set', { key: 'lockClockSize', value })}
          options={[
            { id: 'small', label: 'Small' },
            { id: 'large', label: 'Large' },
          ]}
        />
      </Section>

      <Section label="Position">
        <SegmentedControl
          label="Clock position"
          value={settings.lockClockPosition}
          onChange={(value) => void runAction('settings.set', { key: 'lockClockPosition', value })}
          options={[
            { id: 'top', label: 'Top' },
            { id: 'center', label: 'Middle' },
          ]}
        />
      </Section>
    </SettingsPage>
  );
}

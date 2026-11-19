import { Pressable } from '../../components/Pressable';
import { ScaledPreview } from '../../components/ScaledPreview';
import { Row, Section as KitSection, SegmentedControl, Toggle } from '../../components/kit';
import { LOCK_WIDGETS } from '../../shell/lock/LockWidgets';
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
  segment: 'Segment',
  numeral: 'Numeral',
  hands: 'Three hands',
};

/** Lock screen: eight clock styles, size, position, round widgets and the two shortcuts. */
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

      <Section label="Widgets" note="Up to four round widgets under the clock. Tap to add or remove; they show in the order you pick them.">
        <div className={styles.chips}>
          {LOCK_WIDGETS.map((widget) => {
            const on = settings.lockWidgets.includes(widget.id);
            return (
              <Pressable
                key={widget.id}
                className={`${styles.chip} ${on ? styles.chipOn : ''}`}
                aria-pressed={on}
                onClick={() => {
                  const next = on ? settings.lockWidgets.filter((id) => id !== widget.id) : [...settings.lockWidgets, widget.id].slice(-4);
                  void runAction('settings.set', { key: 'lockWidgets', value: next });
                }}
              >
                {widget.name}
              </Pressable>
            );
          })}
        </div>
      </Section>

      <Section label="Shortcuts" note="Flashlight and camera at the bottom. Hold one for half a second to use it.">
        <KitSection>
          <Row
            title="Flashlight and camera"
            trailing={
              <Toggle
                label="Lock screen shortcuts"
                on={settings.lockShortcuts}
                onChange={(on) => void runAction('settings.set', { key: 'lockShortcuts', value: on })}
              />
            }
          />
        </KitSection>
      </Section>
    </SettingsPage>
  );
}

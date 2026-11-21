import { CheckIcon } from '../../components/glyphs';
import { Row, Section as KitSection } from '../../components/kit';
import { runAction } from '../../system/actions';
import { useSetting, type BatteryStyle } from '../../system/settingsStore';
import { BatteryIndicator } from '../../shell/BatteryIndicator';
import { hasBridge } from '../../system/nativeBridge';
import { Section, SettingsPage } from '../settings/SettingsPage';
import styles from './StatusBarPage.module.css';

const STYLES: { id: BatteryStyle; name: string }[] = [
  { id: 'percent', name: 'Number' },
  { id: 'ring', name: 'Ring' },
  { id: 'bar', name: 'Bar only' },
  { id: 'pixel', name: 'Pixel blocks' },
];

/** How the battery looks in the status rows (lock screen). */
export function StatusBarPage({ onBack }: { onBack: () => void }) {
  const [batteryStyle] = useSetting('batteryStyle');
  return (
    <SettingsPage title="Status bar" onBack={onBack}>
      <Section
        label="Battery"
        note={hasBridge() ? undefined : "Safari doesn't tell web apps the battery level on iPhone, so it shows -- until the native bridge is connected."}
      >
        <KitSection>
          {STYLES.map(({ id, name }) => (
            <Row
              key={id}
              title={name}
              onPress={() => void runAction('settings.set', { key: 'batteryStyle', value: id })}
              trailing={
                <span className={styles.trailing}>
                  <BatteryIndicator style={id} />
                  <span className={`${styles.check} ${batteryStyle === id ? styles.on : ''}`}>
                    {batteryStyle === id && <CheckIcon />}
                  </span>
                </span>
              }
            />
          ))}
        </KitSection>
      </Section>
    </SettingsPage>
  );
}

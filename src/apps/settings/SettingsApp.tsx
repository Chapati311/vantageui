import { Toggle } from '../../components/Toggle';
import { useSetting } from '../../system/settingsStore';
import styles from './SettingsApp.module.css';

export function SettingsApp() {
  const [soundsEnabled, setSoundsEnabled] = useSetting('soundsEnabled');
  const [lightMode, setLightMode] = useSetting('lightMode');

  return (
    <div className={styles.app}>
      <h1 className={styles.title}>Settings</h1>
      <div className={styles.row}>
        <span>Sounds</span>
        <Toggle label="Sounds" on={soundsEnabled} onChange={setSoundsEnabled} />
      </div>
      <div className={styles.row}>
        <span>Light mode</span>
        <Toggle label="Light mode" on={lightMode} onChange={setLightMode} />
      </div>
    </div>
  );
}

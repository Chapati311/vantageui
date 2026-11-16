import { FlashlightIcon } from '../../components/glyphs';
import { useSetting } from '../../system/settingsStore';
import styles from './FlashlightWidget.module.css';

/**
 * A round flashlight switch. It shares its on/off state with the toggle in
 * quick settings. The tap itself is handled in widgetRegistry.
 */
export function FlashlightWidget() {
  const [on] = useSetting('flashlight');

  return (
    <div
      className={`${styles.toggle} ${on ? styles.on : ''}`}
      role="switch"
      aria-checked={on}
      aria-label="Flashlight"
    >
      <FlashlightIcon />
    </div>
  );
}

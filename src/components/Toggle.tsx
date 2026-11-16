import { playSound } from '../system/sounds';
import styles from './Toggle.module.css';

interface ToggleProps {
  label: string;
  on: boolean;
  onChange: (on: boolean) => void;
}

/** A small on/off switch for settings lists. */
export function Toggle({ label, on, onChange }: ToggleProps) {
  const flip = () => {
    onChange(!on);
    playSound(on ? 'toggleOff' : 'toggleOn');
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`${styles.toggle} ${on ? styles.on : ''}`}
      onClick={flip}
    >
      <span className={styles.knob} />
    </button>
  );
}

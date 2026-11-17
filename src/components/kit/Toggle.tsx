import { motion } from 'motion/react';
import { playSound } from '../../system/sounds';
import { SPRING } from '../../theme/tokens';
import { Pressable } from '../Pressable';
import styles from './Toggle.module.css';

interface ToggleProps {
  label: string;
  on: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
}

/** A small on/off switch for settings lists. The knob springs across. */
export function Toggle({ label, on, onChange, disabled }: ToggleProps) {
  const flip = () => {
    onChange(!on);
    playSound(on ? 'toggleOff' : 'toggleOn');
  };

  return (
    <Pressable
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className={`${styles.toggle} ${on ? styles.on : ''}`}
      onClick={flip}
    >
      <motion.span
        className={styles.knob}
        initial={false}
        animate={{ x: on ? '100%' : '0%' }}
        transition={SPRING.ui}
      />
    </Pressable>
  );
}

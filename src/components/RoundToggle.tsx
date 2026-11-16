import type { ComponentType } from 'react';
import { playSound } from '../system/sounds';
import styles from './RoundToggle.module.css';
import { Pressable } from './Pressable';

interface RoundToggleProps {
  label: string;
  icon: ComponentType;
  on: boolean;
  onChange: (on: boolean) => void;
}

/**
 * A large round on/off button with a glyph, used in quick settings.
 * No visible text: the glyph says it (the label is still read out by screen readers).
 */
export function RoundToggle({ label, icon: Glyph, on, onChange }: RoundToggleProps) {
  const flip = () => {
    onChange(!on);
    playSound(on ? 'toggleOff' : 'toggleOn');
  };

  return (
    <Pressable
      aria-pressed={on}
      aria-label={label}
      className={`${styles.toggle} ${on ? styles.on : ''}`}
      onClick={flip}
    >
      <span className={styles.circle}>
        <Glyph />
      </span>
    </Pressable>
  );
}

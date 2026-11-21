import type { ComponentType } from 'react';
import { playSound } from '../system/sounds';
import styles from './RoundToggle.module.css';
import { Pressable } from './Pressable';

interface RoundToggleProps {
  /** Turning it off/on could cut the phone off the network (test bots skip it) */
  risky?: boolean;
  label: string;
  icon: ComponentType;
  on: boolean;
  onChange: (on: boolean) => void;
}

/**
 * A large round on/off button with a glyph, used in quick settings.
 * No visible text: the glyph says it (the label is still read out by screen readers).
 */
export function RoundToggle({ label, icon: Glyph, on, onChange, risky }: RoundToggleProps) {
  const flip = () => {
    onChange(!on);
    playSound(on ? 'toggleOff' : 'toggleOn');
  };

  return (
    <Pressable
      aria-pressed={on}
      aria-label={label}
      // Cuts the phone off the network (Wi-Fi, airplane...): test bots never press these
      data-qa-risky={risky || undefined}
      className={`${styles.toggle} ${on ? styles.on : ''}`}
      onClick={flip}
    >
      <span className={styles.circle}>
        <Glyph />
      </span>
    </Pressable>
  );
}

import type { ComponentType, ReactNode } from 'react';
import { Pressable } from '../Pressable';
import { MOTION } from '../../theme/tokens';
import styles from './Button.module.css';

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  /** 'primary' is the one accent-filled button on a screen; 'destructive' is red text */
  kind?: 'primary' | 'secondary' | 'destructive';
  icon?: ComponentType;
  /** Stretch to the full width */
  wide?: boolean;
  disabled?: boolean;
}

/** A pill-shaped text button (48px tall). */
export function Button({ children, onPress, kind = 'secondary', icon: Glyph, wide, disabled }: ButtonProps) {
  return (
    <Pressable
      className={`${styles.button} ${styles[kind]} ${wide ? styles.wide : ''}`}
      // Press = shrink only. The usual brightness filter leaves a CSS filter on
      // the button, and iOS draws text under a filter soft and faint.
      whileTap={{ scale: MOTION.pressScale }}
      disabled={disabled}
      onClick={onPress}
    >
      {Glyph && <Glyph />}
      {children}
    </Pressable>
  );
}

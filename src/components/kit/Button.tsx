import type { ComponentType, ReactNode } from 'react';
import { Pressable } from '../Pressable';
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
      disabled={disabled}
      onClick={onPress}
    >
      {Glyph && <Glyph />}
      {children}
    </Pressable>
  );
}

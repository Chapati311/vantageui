import type { ReactNode } from 'react';
import styles from './CircleButton.module.css';

interface CircleButtonProps {
  /** What the button does, for screen readers */
  label: string;
  onClick: () => void;
  /** The main action on the screen: filled with the accent */
  primary?: boolean;
  /** Smaller (44px instead of 64px) */
  small?: boolean;
  disabled?: boolean;
  /** A glyph, or one or two characters */
  children: ReactNode;
}

/** A round button with a glyph in it. */
export function CircleButton({ label, onClick, primary, small, disabled, children }: CircleButtonProps) {
  const className = [styles.button, primary && styles.primary, small && styles.small]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={className} aria-label={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

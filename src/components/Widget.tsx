import type { ReactNode } from 'react';
import styles from './Widget.module.css';

export type WidgetSize = 'small' | 'wide';

interface WidgetProps {
  /** small = one grid column (square), wide = both columns */
  size: WidgetSize;
  /** Tiny heading in the top-left corner */
  label?: string;
  children: ReactNode;
}

/** The rounded card every home screen widget sits in. */
export function Widget({ size, label, children }: WidgetProps) {
  return (
    <section className={`${styles.widget} ${styles[size]}`}>
      {label && <h2 className={styles.label}>{label}</h2>}
      {children}
    </section>
  );
}

import type { ReactNode } from 'react';
import styles from './Widget.module.css';

interface WidgetProps {
  /** circle = fully round (a pill when the widget is wider than tall) */
  shape: 'circle' | 'rounded';
  children: ReactNode;
}

/** The dark card every home screen widget sits in. It fills its grid slot. */
export function Widget({ shape, children }: WidgetProps) {
  return <div className={`${styles.widget} ${styles[shape]}`}>{children}</div>;
}

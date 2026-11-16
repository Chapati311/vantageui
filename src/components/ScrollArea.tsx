import type { ReactNode } from 'react';
import styles from './ScrollArea.module.css';

interface ScrollAreaProps {
  /** Scroll sideways instead of up and down */
  horizontal?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * The page itself never scrolls. This is the one place where scrolling is
 * allowed: a box whose content can be dragged up/down (or sideways).
 */
export function ScrollArea({ horizontal, className, children }: ScrollAreaProps) {
  return (
    <div className={`${styles.area} ${horizontal ? styles.horizontal : styles.vertical} ${className ?? ''}`}>
      {children}
    </div>
  );
}

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import styles from './ScaledPreview.module.css';

/** The phone screen the previews are drawn at, then shrunk to fit. */
const SCREEN_WIDTH = 375;
const SCREEN_HEIGHT = 667;

/**
 * Draws its content at full phone-screen size (375 x 667) and shrinks it to
 * fit its box, so a preview looks exactly like the real screen, just smaller.
 */
export function ScaledPreview({ children, className }: { children: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => setScale(element.clientWidth / SCREEN_WIDTH);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} className={`${styles.box} ${className ?? ''}`} aria-hidden="true">
      {scale > 0 && (
        <div className={styles.screen} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, transform: `scale(${scale})` }}>
          {children}
        </div>
      )}
    </div>
  );
}

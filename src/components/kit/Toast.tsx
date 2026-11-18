import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { SPRING } from '../../theme/tokens';
import styles from './Toast.module.css';

interface ToastProps {
  /** The message, or null when hidden */
  message: string | null;
  /** Called when the toast should go away */
  onDone: () => void;
  /** 'success' draws a check with a little burst of dots */
  kind?: 'info' | 'success';
  /** How long it stays, in ms */
  duration?: number;
}

const BURST = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

/** A small pill near the bottom that confirms what just happened. */
export function Toast({ message, onDone, kind = 'info', duration = 2400 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, duration);
    return () => window.clearTimeout(timer);
  }, [message, onDone, duration]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          className={styles.toast}
          role="status"
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.94 }}
          transition={SPRING.ui}
        >
          {kind === 'success' && (
            <span className={styles.mark} aria-hidden="true">
              {BURST.map((angle) => (
                <span key={angle} className={styles.spark} style={{ '--x': `${Math.cos(angle) * 14}px`, '--y': `${Math.sin(angle) * 14}px` } as React.CSSProperties} />
              ))}
              <svg viewBox="0 0 16 16">
                <path className={styles.check} d="M3.5 8.5 6.5 11.5 12.5 4.5" pathLength={1} />
              </svg>
            </span>
          )}
          <span className="label">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

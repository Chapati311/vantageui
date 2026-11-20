import { useDrag } from '@use-gesture/react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform, usePresence } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { MOTION, SPRING, rubberBand } from '../../theme/tokens';
import { Overlay } from './OverlayLayer';
import styles from './Sheet.module.css';

interface SheetProps {
  open: boolean;
  /** Called when the sheet is dragged down, the backdrop is tapped, or Escape is pressed */
  onClose: () => void;
  /** Shown small and centered at the top */
  title?: string;
  /** A button on the right of the title, e.g. "Done" */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * A card that slides up from the bottom over the app. It follows your finger
 * when you drag it down; let go past a third of its height (or flick) and it
 * closes, otherwise it springs back.
 */
export function Sheet({ open, ...props }: SheetProps) {
  return (
    <Overlay>
      <AnimatePresence>{open && <SheetPanel key="sheet" {...props} />}</AnimatePresence>
    </Overlay>
  );
}

function SheetPanel({ onClose, title, action, children }: Omit<SheetProps, 'open'>) {
  const panel = useRef<HTMLDivElement>(null);
  const [isPresent, safeToRemove] = usePresence();
  // How far down the sheet is pushed, in px (0 = fully open)
  const y = useMotionValue(10_000);
  const height = useRef(1);
  const backdrop = useTransform(y, (value) => 1 - Math.min(1, Math.max(0, value / height.current)));

  // Slide in from below the screen
  useLayoutEffect(() => {
    height.current = panel.current?.offsetHeight ?? 1;
    y.set(height.current);
    animate(y, 0, SPRING.sheet);
  }, [y]);

  // Slide out when closed from outside (AnimatePresence waits for this).
  // Taps inside the sheet can leave a spring running on `y`, and the content
  // may have changed height since it opened: stop it, measure again, and never
  // wait forever for the animation's "done" (the sheet stayed on screen after
  // Remove app > Cancel).
  useEffect(() => {
    if (isPresent) return;
    y.stop();
    height.current = panel.current?.offsetHeight ?? height.current;
    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      safeToRemove?.();
    };
    const fallback = window.setTimeout(remove, 700);
    void animate(y, height.current, SPRING.sheet).then(remove);
    return () => window.clearTimeout(fallback);
  }, [isPresent, safeToRemove, y]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const bind = useDrag(
    ({ first, last, movement: [, moved], velocity: [, speed], direction: [, direction], memo, event, cancel }) => {
      if (first) {
        // Don't steal the drag from a list inside the sheet that is scrolled down
        const scroller = (event.target as HTMLElement).closest('[data-sheet-scroll]');
        if (scroller && scroller.scrollTop > 0) {
          cancel();
          return;
        }
        y.stop();
        memo = y.get();
      }
      const next = rubberBand(memo + moved, 0, Infinity);
      if (!last) {
        y.set(next);
        return memo;
      }
      const flick = speed > MOTION.flickVelocity && direction > 0;
      if (flick || next > height.current / 3) onClose();
      else animate(y, 0, SPRING.sheet);
      return memo;
    },
    // Pointer events (not touch-only) and no pointer capture: with touch-only
    // listening, WebKit with touch never turned a tap on a button inside the
    // sheet into a click (found with Playwright's iPhone profile).
    { axis: 'y', filterTaps: true, pointer: { capture: false } },
  );

  return (
    // data-no-gesture: the home screen's swipe code must never take a sheet's
    // touches (it grabbed the pointer, and WebKit then dropped the click on
    // buttons inside the sheet).
    <div className={styles.layer} data-no-gesture>
      <motion.div className={styles.backdrop} style={{ opacity: backdrop }} onClick={onClose} />
      <motion.div
        ref={panel}
        className={styles.sheet}
        style={{ y }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        {...(bind() as object)}
      >
        <span className={styles.grabber} aria-hidden="true" />
        {(title || action) && (
          <div className={styles.header}>
            <span className={styles.title}>{title}</span>
            <span className={styles.action}>{action}</span>
          </div>
        )}
        <div className={styles.body} data-sheet-scroll>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

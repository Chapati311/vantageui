import { useDrag } from '@use-gesture/react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { MOTION, SPRING, rubberBand } from '../../theme/tokens';
import { TrashIcon } from '../glyphs';
import styles from './SwipeToDelete.module.css';

/** Width of the delete button (one grid cell). */
const WIDTH = 76.75;

/**
 * Wraps a card so it can be swiped left to show a delete button. A long
 * swipe deletes right away. Taps on the card still work.
 */
export function SwipeToDelete({ onDelete, children, label = 'Delete' }: { onDelete: () => void; children: ReactNode; label?: string }) {
  const x = useMotionValue(0);
  const buttonOpacity = useTransform(x, [-WIDTH, -16, 0], [1, 0, 0]);
  const wrap = useRef<HTMLDivElement>(null);
  const gone = useRef(false);

  // The card slides away, then the gap closes smoothly, then it is removed
  const remove = async () => {
    if (gone.current) return;
    gone.current = true;
    const el = wrap.current;
    await animate(x, -(el?.offsetWidth ?? 400), { duration: 0.18, ease: 'easeIn' });
    if (el) {
      el.style.height = `${el.offsetHeight}px`;
      el.style.overflow = 'hidden';
      await animate(el, { height: 0, opacity: 0, marginTop: 0, marginBottom: 0 }, { duration: 0.22, ease: [0.2, 0.9, 0.3, 1] });
    }
    onDelete();
  };

  const bind = useDrag(
    ({ first, last, movement: [moved], velocity: [speed], direction: [direction], memo = x.get() }) => {
      if (first) x.stop();
      const next = rubberBand(memo + moved, -WIDTH, 0);
      if (!last) {
        x.set(next);
        return memo;
      }
      if (next < -WIDTH * 2.2) {
        void remove();
        return memo;
      }
      const open = (speed > MOTION.flickVelocity && direction < 0) || next < -WIDTH / 2;
      animate(x, open ? -WIDTH : 0, SPRING.ui);
      return memo;
    },
    { axis: 'x', filterTaps: true, pointer: { capture: false } /* pointer events: touch-only listening ate taps on WebKit (see Sheet.tsx) */ },
  );

  return (
    <div ref={wrap} className={styles.wrap}>
      <motion.button type="button" className={styles.delete} style={{ opacity: buttonOpacity }} onClick={() => void remove()} aria-label={label}>
        <TrashIcon />
      </motion.button>
      <motion.div
        className={styles.content}
        style={{ x }}
        onClickCapture={(event) => {
          // A tap on a swiped-open card just closes it
          if (x.get() < -4) {
            event.stopPropagation();
            animate(x, 0, SPRING.ui);
          }
        }}
        {...(bind() as object)}
      >
        {children}
      </motion.div>
    </div>
  );
}

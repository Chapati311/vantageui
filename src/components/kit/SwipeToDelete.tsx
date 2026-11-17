import { useDrag } from '@use-gesture/react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import type { ReactNode } from 'react';
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

  const bind = useDrag(
    ({ first, last, movement: [moved], velocity: [speed], direction: [direction], memo = x.get() }) => {
      if (first) x.stop();
      const next = rubberBand(memo + moved, -WIDTH, 0);
      if (!last) {
        x.set(next);
        return memo;
      }
      if (next < -WIDTH * 2.2) {
        onDelete();
        return memo;
      }
      const open = (speed > MOTION.flickVelocity && direction < 0) || next < -WIDTH / 2;
      animate(x, open ? -WIDTH : 0, SPRING.ui);
      return memo;
    },
    { axis: 'x', filterTaps: true, pointer: { touch: true } },
  );

  return (
    <div className={styles.wrap}>
      <motion.button type="button" className={styles.delete} style={{ opacity: buttonOpacity }} onClick={onDelete} aria-label={label}>
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

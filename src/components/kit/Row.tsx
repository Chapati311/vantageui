import { useDrag } from '@use-gesture/react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import type { ReactNode } from 'react';
import { MOTION, SPRING, rubberBand } from '../../theme/tokens';
import { BackIcon, TrashIcon } from '../glyphs';
import { pressState } from '../Pressable';
import styles from './Row.module.css';

interface RowProps {
  title: ReactNode;
  /** A second, quieter line under the title */
  detail?: ReactNode;
  /** A short value on the right, e.g. "On" or "Zurich" */
  value?: ReactNode;
  /** An icon (or anything small) on the left */
  icon?: ReactNode;
  /** A control on the right, e.g. a Toggle. Replaces the chevron. */
  trailing?: ReactNode;
  /** Makes the whole row tappable; shows a chevron unless `trailing` is set */
  onPress?: () => void;
  /** Swipe left to reveal a delete button */
  onDelete?: () => void;
  /** Red title, for actions like "Delete all" */
  destructive?: boolean;
  disabled?: boolean;
}

/** Width of the delete button behind a row (one grid cell). */
const DELETE_WIDTH = 76.75;

/**
 * One line in a Section card: icon, title, detail, value, and a chevron or a
 * control. Rows with `onDelete` can be swiped left to delete; a long swipe
 * deletes right away.
 */
export function Row({ title, detail, value, icon, trailing, onPress, onDelete, destructive, disabled }: RowProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-DELETE_WIDTH, -16, 0], [1, 0, 0]);

  const bind = useDrag(
    ({ first, last, movement: [moved], velocity: [speed], direction: [direction], memo = x.get() }) => {
      if (first) x.stop();
      const next = rubberBand(memo + moved, -DELETE_WIDTH, 0);
      if (!last) {
        x.set(next);
        return memo;
      }
      // A long swipe deletes straight away, a short one leaves the button showing
      if (next < -DELETE_WIDTH * 2.2) {
        onDelete?.();
        return memo;
      }
      const open = (speed > MOTION.flickVelocity && direction < 0) || next < -DELETE_WIDTH / 2;
      animate(x, open ? -DELETE_WIDTH : 0, SPRING.ui);
      return memo;
    },
    { axis: 'x', filterTaps: true, enabled: Boolean(onDelete) && !disabled, pointer: { touch: true } },
  );

  const tappable = Boolean(onPress) && !disabled;
  const content = (
    <>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </span>
      {value !== undefined && <span className={styles.value}>{value}</span>}
      {trailing}
      {tappable && !trailing && (
        <span className={styles.chevron} aria-hidden="true">
          <BackIcon />
        </span>
      )}
    </>
  );

  const classes = `${styles.row} ${destructive ? styles.destructive : ''} ${disabled ? styles.disabled : ''}`;

  return (
    <div className={styles.wrap}>
      {onDelete && (
        <motion.button
          type="button"
          className={styles.delete}
          style={{ opacity: deleteOpacity }}
          aria-label="Delete"
          onClick={onDelete}
        >
          <TrashIcon />
        </motion.button>
      )}
      {tappable ? (
        <motion.button
          type="button"
          className={classes}
          style={{ x }}
          onClick={() => {
            // A tap on a swiped-open row just closes it
            if (x.get() < -4) animate(x, 0, SPRING.ui);
            else onPress?.();
          }}
          whileTap={pressState.whileTap}
          transition={pressState.transition}
          {...(bind() as object)}
        >
          {content}
        </motion.button>
      ) : (
        <motion.div className={classes} style={{ x }} aria-disabled={disabled} {...(bind() as object)}>
          {content}
        </motion.div>
      )}
    </div>
  );
}

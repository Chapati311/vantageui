import { motion } from 'motion/react';
import { AppIcon } from '../../components/AppIcon';
import { Icon } from '../../components/Icon';
import { Pressable, pressState } from '../../components/Pressable';
import { getApp } from '../../system/appRegistry';
import { SPRING } from '../../theme/tokens';
import type { WidgetSize } from '../widgets/types';
import { getWidget } from '../widgets/widgetRegistry';
import type { HomeItem } from './layout';
import styles from './HomeItemView.module.css';

/** What is inside a home screen slot: the widget or the app icon itself. */
export function HomeItemContent({ item }: { item: HomeItem }) {
  const widget = item.kind === 'widget' ? getWidget(item.ref) : undefined;
  const app = item.kind === 'app' ? getApp(item.ref) : undefined;
  const WidgetComponent = widget?.component;

  return (
    <>
      {WidgetComponent && <WidgetComponent size={`${item.w}x${item.h}` as WidgetSize} />}
      {app && <AppIcon app={app} />}
    </>
  );
}

interface HomeItemViewProps {
  item: HomeItem;
  /** Position and size in pixels */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Edit mode: wiggle and show the resize button */
  editing: boolean;
  /** Invisible while its dragged copy is on screen */
  hidden: boolean;
  /** Used to make neighbours wiggle out of step */
  index: number;
  onResize: (id: string) => void;
}

/**
 * One home screen item at its place on the grid. When its place changes
 * (something was rearranged) it springs there.
 */
export function HomeItemView({ item, x, y, width, height, editing, hidden, index, onResize }: HomeItemViewProps) {
  const widget = item.kind === 'widget' ? getWidget(item.ref) : undefined;
  if (!widget && !getApp(item.ref)) return null;

  // Only things that DO something when tapped get a press state.
  const tappable = !editing && (item.kind === 'app' || !!widget?.onTap);
  const canResize = editing && !!widget && widget.sizes.length > 1;

  return (
    <motion.div
      className={`${styles.frame} ${hidden ? styles.hidden : ''}`}
      data-item-id={item.id}
      style={{ width, height }}
      initial={false}
      animate={{ x, y }}
      // A hidden item (its copy is being dragged) jumps instead of springing.
      transition={hidden ? { duration: 0 } : SPRING.ui}
    >
      <motion.div className={styles.press} {...(tappable ? pressState : {})}>
        <div
          className={[
            styles.content,
            editing && styles.editing,
            editing && styles.wiggle,
            editing && index % 2 === 1 && styles.wiggleAlt,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <HomeItemContent item={item} />
        </div>
      </motion.div>
      {canResize && (
        <Pressable
          className={styles.resize}
          data-no-gesture
          aria-label={`Resize ${widget.name}`}
          onClick={() => onResize(item.id)}
        >
          <span className={styles.resizeBadge}>
            <Icon>
              <path d="M14 5h5v5M10 19H5v-5M19 5l-6 6M5 19l6-6" />
            </Icon>
          </span>
        </Pressable>
      )}
    </motion.div>
  );
}

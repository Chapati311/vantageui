import type { CSSProperties } from 'react';
import { motion, useAnimate } from 'motion/react';
import { useEffect } from 'react';
import { AppTile, FolderTile } from '../../components/AppTile';
import { WidgetEditContext } from './widgetEdit';
import { Icon } from '../../components/Icon';
import { Pressable, pressState } from '../../components/Pressable';
import { getApp } from '../../system/appRegistry';
import { SPRING } from '../../theme/tokens';
import type { WidgetSize } from '../widgets/types';
import { getWidget } from '../widgets/widgetRegistry';
import type { HomeItem } from './layout';
import styles from './HomeItemView.module.css';

/** What is inside a home screen slot: the widget or the app icon itself. */
export function HomeItemContent({ item, editTick = 0 }: { item: HomeItem; editTick?: number }) {
  const widget = item.kind === 'widget' ? getWidget(item.ref) : undefined;
  const app = item.kind === 'app' ? getApp(item.ref) : undefined;
  const WidgetComponent = widget?.component;

  return (
    <>
      {WidgetComponent && (
        // A widget can have its own style (long-press > Style)
        <div className={styles.widgetStyle} data-widget-style={item.style}>
          <WidgetEditContext.Provider value={editTick}>
            <WidgetComponent size={`${item.w}x${item.h}` as WidgetSize} />
          </WidgetEditContext.Provider>
        </div>
      )}
      {app && <AppTile app={app} />}
      {item.kind === 'folder' && item.folder && <FolderTile name={item.folder.name} apps={item.folder.apps} />}
    </>
  );
}

interface HomeItemViewProps {
  /** On a home page you can't see right now: its animations pause */
  offscreen?: boolean;
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
  /** An app is held over it: it will go in (folder) - grows a little */
  dropping?: boolean;
  /** Used to make neighbours wiggle out of step */
  index: number;
  onResize: (id: string) => void;
  /** Edit mode: take a widget off the home screen */
  onRemove: (id: string) => void;
  /** Bumped when "Edit" is chosen in the item's menu */
  editTick?: number;
  /** Bumped on every unlock: the item pops in, `enterOrder` x 30 ms after the first */
  enterKey?: number;
  enterOrder?: number;
}

/**
 * One home screen item at its place on the grid. When its place changes
 * (something was rearranged) it springs there.
 */
/** The color-block widget colors (Pop Ink): coral, butter, cream, sky, mint */
const BLOCK_COLORS = ['#F2694A', '#F6CE46', '#F3EAD7', '#9EC9F0', '#9FE3C1'];

export function HomeItemView({ item, x, y, width, height, editing, hidden, dropping, index, onResize, onRemove, editTick, enterKey = 0, enterOrder = 0, offscreen = false }: HomeItemViewProps) {
  const [scope, animateItem] = useAnimate();
  useEffect(() => {
    if (!enterKey || !scope.current) return;
    void animateItem(scope.current, { opacity: [0, 1], scale: [0.86, 1] }, { ...SPRING.ui, delay: enterOrder * 0.03 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterKey]);
  const widget = item.kind === 'widget' ? getWidget(item.ref) : undefined;
  if (!widget && !getApp(item.ref) && item.kind !== 'folder') return null;

  // Only things that DO something when tapped get a press state.
  const tappable = !editing && (item.kind !== 'widget' || !!widget?.onTap || !!widget?.appId);
  const canResize = editing && !!widget && widget.sizes.length > 1;

  return (
    <motion.div
      className={`${styles.frame} ${hidden ? styles.hidden : ''} ${dropping ? styles.dropping : ''}`}
      data-item-id={item.id}
      data-offscreen={offscreen || undefined}
      // Color-block packs: each item takes the next color of the set (by its place on the page)
      style={{ width, height, '--block-color': BLOCK_COLORS[(item.row * 4 + item.col + item.page) % BLOCK_COLORS.length] } as CSSProperties}
      initial={false}
      animate={{ x, y }}
      // A hidden item (its copy is being dragged) jumps instead of springing.
      transition={hidden ? { duration: 0 } : SPRING.ui}
    >
      <motion.div ref={scope} className={styles.press} {...(tappable ? pressState : {})}>
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
          <HomeItemContent item={item} editTick={editTick} />
        </div>
      </motion.div>
      {editing && widget && (
        <Pressable
          className={styles.remove}
          data-no-gesture
          aria-label={`Remove ${widget.name}`}
          onClick={() => onRemove(item.id)}
        >
          <span className={styles.removeBadge}>
            <Icon>
              <path d="M7 12h10" />
            </Icon>
          </span>
        </Pressable>
      )}
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

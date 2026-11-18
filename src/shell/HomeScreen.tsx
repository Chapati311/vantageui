import { motion, useMotionValue } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable } from '../components/Pressable';
import { getWidget } from './widgets/widgetRegistry';
import { Dock } from './home/Dock';
import { HomeItemContent, HomeItemView } from './home/HomeItemView';
import { PageDots } from './home/PageDots';
import { WidgetGallery } from './home/WidgetGallery';
import { runAction } from '../system/actions';
import { LivePill, useHasLiveActivity } from './LivePill';
import { useSetting } from '../system/settingsStore';
import {
  COLS,
  MAX_PAGES,
  MAX_ROWS,
  compactPages,
  countPages,
  fitToRows,
  placeItem,
  type HomeItem,
} from './home/layout';
import { loadLayout, saveLayout, subscribeToLayout } from './home/layoutStore';
import { slotRect, useGridMetrics } from './home/useGridMetrics';
import { useHomeGestures } from './home/useHomeGestures';
import styles from './HomeScreen.module.css';

interface HomeScreenProps {
  /** An app icon was tapped. `from` is where the icon is on screen. */
  onOpenApp?: (appId: string, from: DOMRect) => void;
  /** Swipe down in the middle of the screen */
  onSwipeDown?: () => void;
  /** Swipe down starting at the very top */
  /** Gets where along the top edge the swipe started (px from the left) */
  onSwipeDownFromTop?: (x: number) => void;
}

/**
 * The home screen: pages of a 4-column grid where widgets and app icons
 * live together, with page dots and a fixed dock underneath.
 * Every size and position comes from the design system grid (tokens.css).
 * Long-press to rearrange and resize.
 */
export function HomeScreen({ onOpenApp, onSwipeDown, onSwipeDownFromTop }: HomeScreenProps) {
  const live = useHasLiveActivity();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(surfaceRef, gridRef);

  // Motion values: moving these moves things on screen without re-rendering React.
  const trackX = useMotionValue(0); // the row of pages
  const ghostX = useMotionValue(0); // the copy of an item that follows the finger
  const ghostY = useMotionValue(0);

  // What is saved on the device (laid out for the tallest screen)...
  const [saved, setSaved] = useState<HomeItem[]>(loadLayout);
  // ...and what is shown: the same layout, fitted to the rows this screen has room
  // for. Anything that would stick out below the last row moves to a later page.
  const rows = metrics?.rows ?? MAX_ROWS;
  // Apps you hid in Customise > Home screen stay out of sight (search still finds them)
  const [hiddenApps] = useSetting('hiddenApps');
  const layout = useMemo(
    () => fitToRows(saved.filter((item) => !(item.kind === 'app' && hiddenApps.includes(item.ref))), rows),
    [saved, rows, hiddenApps],
  );
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const [editing, setEditing] = useState(false);
  const [page, setPage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Widgets added or removed from elsewhere (the gallery, actions): reload
  useEffect(() => subscribeToLayout(() => setSaved(loadLayout())), []);

  // In edit mode there is one extra empty page to drag things onto.
  const pageCount = Math.min(MAX_PAGES, countPages(layout) + (editing ? 1 : 0));

  /** Applies a new layout and saves it on the device. */
  const commit = (next: HomeItem[]) => {
    layoutRef.current = next;
    setSaved(next);
    saveLayout(next);
  };

  const stopEditing = () => {
    commit(compactPages(layoutRef.current));
    setEditing(false);
  };

  // If the page we are on disappears (e.g. the extra edit page), go to the last one.
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const moveItem = (id: string, to: { page: number; col: number; row: number }): HomeItem => {
    const current = layoutRef.current.find((item) => item.id === id)!;
    const next = placeItem(layoutRef.current, id, { ...to, w: current.w, h: current.h }, rows);
    if (!next) return current; // no room: it goes back where it was
    commit(next);
    return next.find((item) => item.id === id)!;
  };

  /** Switches a widget to its next size that fits. */
  const resizeItem = (id: string) => {
    const item = layoutRef.current.find((i) => i.id === id);
    const sizes = item && getWidget(item.ref)?.sizes;
    if (!item || !sizes) return;
    const currentIndex = sizes.indexOf(`${item.w}x${item.h}` as (typeof sizes)[number]);
    for (let offset = 1; offset < sizes.length; offset++) {
      const [w, h] = sizes[(currentIndex + offset) % sizes.length].split('x').map(Number);
      const target = {
        page: item.page,
        col: Math.min(item.col, COLS - w),
        row: Math.min(item.row, rows - h),
        w,
        h,
      };
      const next = placeItem(layoutRef.current, id, target, rows);
      if (next) {
        commit(next);
        return;
      }
    }
  };

  const tapItem = (id: string) => {
    const item = layoutRef.current.find((i) => i.id === id);
    const element = surfaceRef.current?.querySelector(`[data-item-id="${id}"]`);
    if (!item || !element) return;
    const rect = element.getBoundingClientRect();
    if (item.kind === 'app') {
      onOpenApp?.(item.ref, rect);
    } else {
      // Some widgets do something when tapped (see widgetRegistry).
      getWidget(item.ref)?.onTap?.({
        openSearch: () => onSwipeDown?.(),
        openApp: (appId) => onOpenApp?.(appId, rect),
      });
    }
  };

  const { drag, dropTarget } = useHomeGestures(surfaceRef, {
    metrics,
    layout,
    page,
    pageCount,
    editing,
    trackX,
    ghostX,
    ghostY,
    setPage,
    startEditing: () => setEditing(true),
    stopEditing,
    onMoveItem: moveItem,
    onTapItem: tapItem,
    onSwipeDown,
    onSwipeDownFromTop,
  });

  const draggedItem = drag ? layout.find((item) => item.id === drag.id) : undefined;
  const dropRect = metrics && dropTarget ? slotRect({ ...dropTarget, page }, metrics) : null;
  const draggedRect = metrics && draggedItem ? slotRect(draggedItem, metrics) : null;

  return (
    <div ref={surfaceRef} className={styles.home}>
      <div ref={gridRef} className={styles.grid}>
        <motion.div className={styles.track} style={{ x: trackX }}>
          {metrics &&
            layout.map((item, index) => (
              <HomeItemView
                key={item.id}
                item={item}
                {...slotRect(item, metrics)}
                editing={editing}
                hidden={drag?.id === item.id}
                index={index}
                onResize={resizeItem}
                onRemove={(id) => void runAction('home.removeWidget', { itemId: id })}
              />
            ))}
          {dropRect && (
            <div
              className={styles.dropOutline}
              style={{
                width: dropRect.width,
                height: dropRect.height,
                transform: `translate3d(${dropRect.x}px, ${dropRect.y}px, 0)`,
              }}
            />
          )}
        </motion.div>

        {editing && (
          <div className={styles.editBar} data-no-gesture>
            <Pressable className={styles.done} data-no-gesture onClick={() => setGalleryOpen(true)}>
              Add widget
            </Pressable>
            <Pressable className={styles.done} data-no-gesture onClick={stopEditing}>
              Done
            </Pressable>
          </div>
        )}
      </div>

      {/* Page dots have their own row, 8px above the dock. A running timer or
          stopwatch takes their place (the live pill). */}
      <div className={styles.dots}>
        {live ? <LivePill compact /> : <PageDots count={pageCount} current={Math.min(page, pageCount - 1)} />}
      </div>

      <Dock onOpenApp={(appId, from) => onOpenApp?.(appId, from)} />

      {/* The copy of an item that follows the finger while dragging */}
      {draggedItem && draggedRect && (
        <motion.div
          className={styles.ghost}
          style={{ x: ghostX, y: ghostY, width: draggedRect.width, height: draggedRect.height }}
        >
          <div className={styles.lifted}>
            <HomeItemContent item={draggedItem} />
          </div>
        </motion.div>
      )}
      <WidgetGallery open={galleryOpen} page={page} onClose={() => setGalleryOpen(false)} />
    </div>
  );
}

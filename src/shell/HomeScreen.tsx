import { useEffect, useRef, useState } from 'react';
import { getWidget } from './widgets/widgetRegistry';
import { HomeItemView } from './home/HomeItemView';
import { PageDots } from './home/PageDots';
import {
  COLS,
  MAX_PAGES,
  ROWS,
  compactPages,
  countPages,
  placeItem,
  type HomeItem,
} from './home/layout';
import { loadLayout, saveLayout } from './home/layoutStore';
import { slotRect, trackTransform, useGridMetrics } from './home/useGridMetrics';
import { useHomeGestures } from './home/useHomeGestures';
import styles from './HomeScreen.module.css';

interface HomeScreenProps {
  /** An app icon was tapped. `from` is where the icon is on screen. */
  onOpenApp?: (appId: string, from: DOMRect) => void;
  /** Swipe down in the middle of the screen */
  onSwipeDown?: () => void;
  /** Swipe down starting at the very top */
  onSwipeDownFromTop?: () => void;
}

/**
 * The home screen: pages of a 4-column grid where widgets and app icons
 * live together. Long-press to rearrange and resize.
 */
export function HomeScreen({ onOpenApp, onSwipeDown, onSwipeDownFromTop }: HomeScreenProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(surfaceRef, gridRef);

  const [layout, setLayout] = useState<HomeItem[]>(loadLayout);
  const layoutRef = useRef(layout);
  const [editing, setEditing] = useState(false);
  const [page, setPage] = useState(0);

  // In edit mode there is one extra empty page to drag things onto.
  const pageCount = Math.min(MAX_PAGES, countPages(layout) + (editing ? 1 : 0));

  /** Applies a new layout and saves it on the device. */
  const commit = (next: HomeItem[]) => {
    layoutRef.current = next;
    setLayout(next);
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
    const next = placeItem(layoutRef.current, id, { ...to, w: current.w, h: current.h });
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
      const next = placeItem(layoutRef.current, id, {
        page: item.page,
        col: Math.min(item.col, COLS - w),
        row: Math.min(item.row, ROWS - h),
        w,
        h,
      });
      if (next) {
        commit(next);
        return;
      }
    }
  };

  const tapItem = (id: string) => {
    const item = layoutRef.current.find((i) => i.id === id);
    const element = surfaceRef.current?.querySelector(`[data-item-id="${id}"]`);
    if (item?.kind === 'app' && element) onOpenApp?.(item.ref, element.getBoundingClientRect());
  };

  const { drag, dropTarget } = useHomeGestures(surfaceRef, trackRef, ghostRef, {
    metrics,
    layout,
    page,
    pageCount,
    editing,
    setPage,
    startEditing: () => setEditing(true),
    stopEditing,
    onMoveItem: moveItem,
    onTapItem: tapItem,
    onSwipeDown,
    onSwipeDownFromTop,
  });

  const draggedItem = drag ? layout.find((item) => item.id === drag.id) : undefined;

  return (
    <div ref={surfaceRef} className={styles.home}>
      <div ref={gridRef} className={styles.grid}>
        <div
          ref={trackRef}
          className={styles.track}
          style={{ transform: trackTransform(page, metrics?.pitch ?? 0) }}
        >
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
              />
            ))}
          {metrics && dropTarget && (
            <DropOutline {...slotRect({ ...dropTarget, page }, metrics)} />
          )}
        </div>
      </div>

      <div className={styles.bottom}>
        <PageDots count={pageCount} current={Math.min(page, pageCount - 1)} />
        {editing && (
          <button type="button" className={styles.done} data-no-gesture onClick={stopEditing}>
            Done
          </button>
        )}
      </div>

      {metrics && drag && draggedItem && (
        <HomeItemView
          ghost
          frameRef={ghostRef}
          item={draggedItem}
          {...slotRect(draggedItem, metrics)}
          x={drag.x}
          y={drag.y}
        />
      )}
    </div>
  );
}

/** Shows where the dragged item will land. */
function DropOutline({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  return (
    <div
      className={styles.dropOutline}
      style={{ width, height, transform: `translate3d(${x}px, ${y}px, 0)` }}
    />
  );
}

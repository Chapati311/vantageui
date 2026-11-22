import { animate, type MotionValue } from 'motion/react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { MOTION, SPRING, rubberBand } from '../../theme/tokens';
import { COLS, type HomeItem } from './layout';
import type { GridMetrics } from './useGridMetrics';

/** Hold a finger still this long to enter edit mode. */
const LONG_PRESS_MS = 450;
/** A finger must move this far (px) before it counts as a swipe or drag. */
const MOVE_SLOP = 8;
/** Without a flick, swipe further than this share of the screen to change page. */
const PAGE_DISTANCE = 0.5;
/** While dragging an item: hold it this close (px) to a screen edge to change page. */
const EDGE_ZONE = 28;
const EDGE_FLIP_MS = 600;
/** A downward swipe must travel this far (px) to count. */
const SWIPE_DOWN_MIN = 40;
/** A downward swipe that starts within this many px of the top is a "top edge" swipe. */
const TOP_EDGE = 56;
/** How long the dropped item is given to spring into its slot. */
const SETTLE_MS = 260;

/** The item being dragged. */
export interface DragState {
  id: string;
}

/** The cell the dragged item would land on (on the current page). */
export interface DropTarget {
  col: number;
  row: number;
  w: number;
  h: number;
  /** Held over a folder or another app: the app goes INTO it (makes a folder with an app) */
  into?: string;
}

interface Options {
  metrics: GridMetrics | null;
  layout: HomeItem[];
  page: number;
  pageCount: number;
  /** The leftmost page: -1 when the Today view sits left of page 1, else 0 */
  minPage?: number;
  editing: boolean;
  /** Where the row of pages is: 0 = page 1, -screenWidth = page 2, ... */
  trackX: MotionValue<number>;
  /** Where the dragged copy of an item is, in home screen pixels */
  ghostX: MotionValue<number>;
  ghostY: MotionValue<number>;
  setPage: (page: number) => void;
  startEditing: () => void;
  stopEditing: () => void;
  /** Moves an item and returns where it ended up (unchanged if there was no room). */
  onMoveItem: (id: string, to: { page: number; col: number; row: number }) => HomeItem;
  /** An app dropped onto a folder (or another app): returns the folder it went into */
  onDropInto?: (id: string, targetId: string) => HomeItem | null;
  onTapItem: (id: string) => void;
  /** Long-press on an item outside edit mode: its menu */
  onLongPressItem?: (id: string) => void;
  onSwipeDown?: () => void;
  /** Long-press on empty space (the wallpaper) outside edit mode */
  onLongPressEmpty?: () => void;
  /** Two quick taps on empty space */
  onDoubleTapEmpty?: () => void;
  /** Gets where along the top edge the swipe started (px from the left) */
  onSwipeDownFromTop?: (x: number) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * All touch handling for the home screen, in one place:
 *  - swipe left/right      -> change page. The pages follow the finger 1:1,
 *                             rubber-band at the ends, and a spring finishes
 *                             the move. A quick flick is enough.
 *  - long-press an item    -> its menu; long-press the wallpaper -> wallpaper picker
 *  - pinch in              -> edit mode (and in edit mode, hold an item to drag it)
 *  - double-tap empty      -> lock
 *  - two fingers down      -> search
 *  - drag in edit mode     -> move an item, hold at a screen edge to change page
 *  - swipe down            -> search (or quick settings, from the top edge)
 *  - tap                   -> open an app / leave edit mode
 *
 * While a finger is moving we only change "motion values" (no React
 * re-render), which keeps it at 60 fps. Grabbing the pages while they are
 * still springing catches them where they are.
 */
export function useHomeGestures(surfaceRef: RefObject<HTMLElement | null>, options: Options) {
  const latest = useRef(options);
  latest.current = options;

  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  /** True while a finger is moving the pages, so nothing else animates them. */
  const paging = useRef(false);

  // When the page changes for any other reason (dragging an item to the edge,
  // a page disappearing), spring the row of pages there.
  const { page, metrics, trackX } = options;
  const pitch = metrics?.pitch ?? 0;
  useEffect(() => {
    if (paging.current) return;
    animate(trackX, -page * pitch, SPRING.ui);
  }, [page, pitch, trackX]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    type Mode = 'idle' | 'pressed' | 'paging' | 'vertical' | 'dragging' | 'ignored' | 'settling';
    let mode: Mode = 'idle';
    let pointerId = -1;

    // Finger position, relative to the home screen
    let pointerX = 0;
    let pointerY = 0;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocityX = 0; // px per ms

    let pressedItemId: string | null = null;
    /** The press started on a widget's own button (play, roll the dice...) */
    let pressedControl = false;
    let longPressTimer = 0;

    // Paging
    let trackStart = 0;

    // Dragging an item
    let dragItem: HomeItem | null = null;
    let grabX = 0; // where inside the item the finger is holding it
    let grabY = 0;
    let target: DropTarget | null = null;
    let edgeDirection = 0;
    let edgeTimer = 0;
    let settleTimer = 0;

    const readPointer = (event: PointerEvent) => {
      const rect = surface.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
    };

    const capture = () => {
      try {
        surface.setPointerCapture(pointerId);
      } catch {
        // The pointer is already gone - nothing to capture.
      }
    };

    // ---- Paging -----------------------------------------------------------

    const beginPaging = () => {
      const { trackX } = latest.current;
      mode = 'paging';
      paging.current = true;
      capture();
      trackX.stop(); // catch the pages mid-spring
      trackStart = trackX.get();
    };

    const movePaging = () => {
      const { pageCount, metrics, trackX, minPage = 0 } = latest.current;
      if (!metrics) return;
      const furthest = -(pageCount - 1) * metrics.pitch;
      trackX.set(rubberBand(trackStart + (pointerX - startX), furthest, -minPage * metrics.pitch));
    };

    const endPaging = (cancelled: boolean) => {
      const { page, pageCount, metrics, trackX, setPage, minPage = 0 } = latest.current;
      mode = 'idle';
      paging.current = false;
      if (!metrics) return;

      // Where the pages are now, counted in pages (e.g. 0.4 = 40% towards page 2)
      const position = -trackX.get() / metrics.pitch;
      let next = page;
      if (!cancelled) {
        if (Math.abs(velocityX) > MOTION.flickVelocity) {
          // A flick goes one page in its direction, however short it was.
          next = velocityX < 0 ? Math.floor(position) + 1 : Math.ceil(position) - 1;
        } else if (Math.abs(position - page) > PAGE_DISTANCE) {
          next = Math.round(position);
        }
      }
      next = clamp(next, minPage, pageCount - 1);
      animate(trackX, -next * metrics.pitch, { ...SPRING.ui, velocity: velocityX * 1000 });
      if (next !== page) setPage(next);
    };

    // ---- Dragging an item ---------------------------------------------------

    const updateTarget = () => {
      const { metrics } = latest.current;
      if (!metrics || !dragItem) return;
      const step = metrics.cell + metrics.gap;
      const col = clamp(Math.round((pointerX - grabX - metrics.originX) / step), 0, COLS - dragItem.w);
      const row = clamp(
        Math.round((pointerY - grabY - metrics.originY) / step),
        0,
        metrics.rows - dragItem.h,
      );
      // An app held over the middle of a folder or another app: it will go into it
      let into: string | undefined;
      if (dragItem.kind === 'app') {
        const { layout, page } = latest.current;
        const fx = (pointerX - metrics.originX) / step;
        const fy = (pointerY - metrics.originY) / step;
        const cellX = Math.floor(fx);
        const cellY = Math.floor(fy);
        const inMiddle = fx - cellX > 0.12 && fx - cellX < 0.8 && fy - cellY > 0.12 && fy - cellY < 0.8;
        const over = inMiddle
          ? layout.find(
              (i) =>
                i.page === page &&
                i.id !== dragItem!.id &&
                (i.kind === 'folder' || i.kind === 'app') &&
                cellX >= i.col &&
                cellX < i.col + i.w &&
                cellY >= i.row &&
                cellY < i.row + i.h,
            )
          : undefined;
        into = over?.id;
      }
      if (!target || target.col !== col || target.row !== row || target.into !== into) {
        target = { col, row, w: dragItem.w, h: dragItem.h, into };
        setDropTarget(target);
      }
    };

    const armEdgeTimer = () => {
      edgeTimer = window.setTimeout(() => {
        const { page, pageCount, setPage } = latest.current;
        const next = clamp(page + edgeDirection, 0, pageCount - 1);
        if (next !== page) setPage(next);
        if (edgeDirection !== 0) armEdgeTimer(); // keep flipping while held at the edge
      }, EDGE_FLIP_MS);
    };

    const beginDrag = (itemId: string) => {
      const { layout, ghostX, ghostY } = latest.current;
      const item = layout.find((i) => i.id === itemId);
      const element = surface.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`);
      if (!item || !element) {
        mode = 'ignored';
        return;
      }
      const s = surface.getBoundingClientRect();
      const r = element.getBoundingClientRect();
      grabX = pointerX - (r.left - s.left);
      grabY = pointerY - (r.top - s.top);
      dragItem = item;
      target = null;
      mode = 'dragging';
      capture();
      ghostX.set(pointerX - grabX);
      ghostY.set(pointerY - grabY);
      setDrag({ id: itemId });
      updateTarget();
    };

    const moveDrag = () => {
      const { ghostX, ghostY } = latest.current;
      ghostX.set(pointerX - grabX);
      ghostY.set(pointerY - grabY);
      updateTarget();

      const direction =
        pointerX < EDGE_ZONE ? -1 : pointerX > surface.clientWidth - EDGE_ZONE ? 1 : 0;
      if (direction !== edgeDirection) {
        window.clearTimeout(edgeTimer);
        edgeDirection = direction;
        if (direction !== 0) armEdgeTimer();
      }
    };

    const endDrag = (cancelled: boolean) => {
      window.clearTimeout(edgeTimer);
      edgeDirection = 0;
      const { page, metrics, ghostX, ghostY, onMoveItem, onDropInto } = latest.current;
      const item = dragItem!;
      const intoFolder = !cancelled && target?.into && onDropInto ? onDropInto(item.id, target.into) : null;
      const placed = intoFolder
        ? intoFolder
        : !cancelled && target
          ? onMoveItem(item.id, { page, col: target.col, row: target.row })
          : item;

      // The dragged copy springs into its final slot, then is removed.
      if (metrics) {
        const step = metrics.cell + metrics.gap;
        animate(
          ghostX,
          metrics.originX + placed.col * step + (placed.page - page) * metrics.pitch,
          SPRING.ui,
        );
        animate(ghostY, metrics.originY + placed.row * step, SPRING.ui);
      }
      dragItem = null;
      target = null;
      setDropTarget(null);
      mode = 'settling';
      settleTimer = window.setTimeout(() => {
        setDrag(null);
        mode = 'idle';
      }, SETTLE_MS);
    };

    // ---- Pointer events -----------------------------------------------------

    const onLongPress = () => {
      if (mode !== 'pressed') return;
      const { editing, startEditing, onLongPressItem, onLongPressEmpty, page } = latest.current;
      // Outside edit mode, holding an item shows its menu (Edit home screen is in there)
      if (!editing && pressedItemId && onLongPressItem) {
        mode = 'ignored';
        navigator.vibrate?.(10);
        onLongPressItem(pressedItemId);
        return;
      }
      // Holding the wallpaper (not on the Today view): change the wallpaper
      if (!editing && !pressedItemId) {
        mode = 'ignored';
        if (page >= 0 && onLongPressEmpty) {
          navigator.vibrate?.(10);
          onLongPressEmpty();
        }
        return;
      }
      if (!editing) startEditing();
      if (pressedItemId) beginDrag(pressedItemId);
      else mode = 'ignored';
    };

    // ---- Two fingers: pinch in = edit mode, swipe down = search ------------

    const touches = new Map<number, { x: number; y: number; startX: number; startY: number }>();
    let twoFingerDone = false;
    const spread = () => {
      const [a, b] = [...touches.values()];
      return { now: Math.hypot(a.x - b.x, a.y - b.y), start: Math.hypot(a.startX - b.startX, a.startY - b.startY) };
    };
    const onAnyDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
      if (touches.size === 2) {
        twoFingerDone = false;
        // A second finger cancels whatever the first one started
        window.clearTimeout(longPressTimer);
        if (mode === 'paging') endPaging(true);
        if (mode === 'pressed' || mode === 'vertical') mode = 'ignored';
      }
    };
    const onAnyMove = (event: PointerEvent) => {
      const touch = touches.get(event.pointerId);
      if (!touch) return;
      touch.x = event.clientX;
      touch.y = event.clientY;
      if (touches.size !== 2 || twoFingerDone) return;
      const { now, start } = spread();
      const { editing, startEditing, onSwipeDown } = latest.current;
      const down = Math.min(...[...touches.values()].map((t) => t.y - t.startY));
      if (!editing && start > 0 && now < start * 0.7) {
        twoFingerDone = true;
        navigator.vibrate?.(10);
        startEditing();
      } else if (down > SWIPE_DOWN_MIN) {
        twoFingerDone = true;
        onSwipeDown?.();
      }
    };
    const onAnyUp = (event: PointerEvent) => {
      touches.delete(event.pointerId);
    };

    // ---- Double tap on empty space --------------------------------------------
    let lastEmptyTap = 0;
    let lastEmptyX = 0;
    let lastEmptyY = 0;

    const onDown = (event: PointerEvent) => {
      if (mode !== 'idle' || !event.isPrimary) return;
      const element = event.target as Element;
      if (element.closest('[data-no-gesture]')) return; // real buttons handle themselves
      pointerId = event.pointerId;
      readPointer(event);
      startX = lastX = pointerX;
      startY = pointerY;
      lastTime = event.timeStamp;
      velocityX = 0;
      const item = element.closest<HTMLElement>('[data-item-id]');
      pressedItemId = item?.dataset.itemId ?? null;
      const control = element.closest('button, [role="button"], input, a');
      pressedControl = Boolean(item && control && item.contains(control) && control !== item);
      mode = 'pressed';
      longPressTimer = window.setTimeout(onLongPress, LONG_PRESS_MS);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      readPointer(event);
      const dt = event.timeStamp - lastTime;
      if (dt > 0) velocityX = (pointerX - lastX) / dt;
      lastX = pointerX;
      lastTime = event.timeStamp;

      if (mode === 'pressed') {
        const dx = pointerX - startX;
        const dy = pointerY - startY;
        if (Math.hypot(dx, dy) < MOVE_SLOP) return;
        window.clearTimeout(longPressTimer);
        if (latest.current.editing && pressedItemId) {
          beginDrag(pressedItemId);
        } else if (Math.abs(dx) > Math.abs(dy)) {
          beginPaging();
        } else {
          mode = latest.current.editing ? 'ignored' : 'vertical';
        }
      }

      if (mode === 'paging') movePaging();
      else if (mode === 'dragging') moveDrag();
    };

    const finish = (event: PointerEvent, cancelled: boolean) => {
      if (event.pointerId !== pointerId) return;
      pointerId = -1;
      window.clearTimeout(longPressTimer);
      readPointer(event);
      // A finger that rested before lifting is not a flick.
      if (event.timeStamp - lastTime > 80) velocityX = 0;

      if (mode === 'paging') endPaging(cancelled);
      else if (mode === 'dragging') endDrag(cancelled);
      else if (mode === 'pressed') {
        mode = 'idle';
        if (cancelled) return;
        // A plain tap
        const { editing, stopEditing, onTapItem } = latest.current;
        if (editing) {
          if (!pressedItemId) stopEditing(); // tap empty space = done
        } else if (pressedItemId && !pressedControl) {
          onTapItem(pressedItemId);
        } else if (!pressedItemId && latest.current.page >= 0 && !(event.target as Element).closest('button, a, input')) {
          const now = event.timeStamp;
          if (now - lastEmptyTap < 320 && Math.hypot(pointerX - lastEmptyX, pointerY - lastEmptyY) < 40) {
            lastEmptyTap = 0;
            latest.current.onDoubleTapEmpty?.();
          } else {
            lastEmptyTap = now;
            lastEmptyX = pointerX;
            lastEmptyY = pointerY;
          }
        }
      } else if (mode === 'vertical') {
        mode = 'idle';
        if (!cancelled && pointerY - startY > SWIPE_DOWN_MIN) {
          const { onSwipeDown, onSwipeDownFromTop } = latest.current;
          if (startY < TOP_EDGE) onSwipeDownFromTop?.(startX);
          else onSwipeDown?.();
        }
      } else if (mode === 'ignored') {
        mode = 'idle';
      }
    };

    const onUp = (event: PointerEvent) => finish(event, false);
    const onCancel = (event: PointerEvent) => finish(event, true);
    const onContextMenu = (event: Event) => event.preventDefault();

    surface.addEventListener('pointerdown', onAnyDown, true);
    surface.addEventListener('pointermove', onAnyMove, true);
    surface.addEventListener('pointerup', onAnyUp, true);
    surface.addEventListener('pointercancel', onAnyUp, true);
    surface.addEventListener('pointerdown', onDown);
    surface.addEventListener('pointermove', onMove);
    surface.addEventListener('pointerup', onUp);
    surface.addEventListener('pointercancel', onCancel);
    surface.addEventListener('contextmenu', onContextMenu);
    return () => {
      surface.removeEventListener('pointerdown', onAnyDown, true);
      surface.removeEventListener('pointermove', onAnyMove, true);
      surface.removeEventListener('pointerup', onAnyUp, true);
      surface.removeEventListener('pointercancel', onAnyUp, true);
      surface.removeEventListener('pointerdown', onDown);
      surface.removeEventListener('pointermove', onMove);
      surface.removeEventListener('pointerup', onUp);
      surface.removeEventListener('pointercancel', onCancel);
      surface.removeEventListener('contextmenu', onContextMenu);
      window.clearTimeout(longPressTimer);
      window.clearTimeout(edgeTimer);
      window.clearTimeout(settleTimer);
    };
  }, [surfaceRef]);

  return { drag, dropTarget };
}

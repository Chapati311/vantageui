import { useEffect, useRef, useState, type RefObject } from 'react';
import { COLS, type HomeItem } from './layout';
import { trackTransform, type GridMetrics } from './useGridMetrics';

/** Hold a finger still this long to enter edit mode. */
const LONG_PRESS_MS = 450;
/** A finger must move this far (px) before it counts as a swipe or drag. */
const MOVE_SLOP = 8;
/** Swipe further than this share of the screen to change page... */
const PAGE_DISTANCE = 0.25;
/** ...or flick faster than this (px per ms). */
const PAGE_FLICK = 0.4;
/** While dragging an item: hold it this close (px) to a screen edge to change page. */
const EDGE_ZONE = 28;
const EDGE_FLIP_MS = 600;
/** A downward swipe must travel this far (px) to count. */
const SWIPE_DOWN_MIN = 40;
/** A downward swipe that starts within this many px of the top is a "top edge" swipe. */
const TOP_EDGE = 56;
/** Time for a dropped item to glide into its slot. */
const SETTLE_MS = 180;

/** The item being dragged, and where it was picked up (home screen pixels). */
export interface DragState {
  id: string;
  x: number;
  y: number;
}

/** The cell the dragged item would land on (on the current page). */
export interface DropTarget {
  col: number;
  row: number;
  w: number;
  h: number;
}

interface Options {
  metrics: GridMetrics | null;
  layout: HomeItem[];
  page: number;
  pageCount: number;
  editing: boolean;
  setPage: (page: number) => void;
  startEditing: () => void;
  stopEditing: () => void;
  /** Moves an item and returns where it ended up (unchanged if there was no room). */
  onMoveItem: (id: string, to: { page: number; col: number; row: number }) => HomeItem;
  onTapItem: (id: string) => void;
  onSwipeDown?: () => void;
  onSwipeDownFromTop?: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * All touch handling for the home screen, in one place:
 *  - swipe left/right      -> change page (the pages follow the finger)
 *  - long-press            -> edit mode (and pick up the item under the finger)
 *  - drag in edit mode     -> move an item, hold at a screen edge to change page
 *  - swipe down            -> search (or quick settings, from the top edge)
 *  - tap                   -> open an app / leave edit mode
 *
 * While a finger is moving we change `transform` directly on the elements
 * instead of re-rendering React, which keeps it at 60 fps.
 */
export function useHomeGestures(
  surfaceRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
  ghostRef: RefObject<HTMLElement | null>,
  options: Options,
) {
  const latest = useRef(options);
  latest.current = options;

  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

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
    let velocityX = 0;

    let pressedItemId: string | null = null;
    let longPressTimer = 0;

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

    const movePaging = () => {
      const { page, pageCount, metrics } = latest.current;
      const track = trackRef.current;
      if (!track || !metrics) return;
      let dx = pointerX - startX;
      const pullingPastEnd = (page === 0 && dx > 0) || (page === pageCount - 1 && dx < 0);
      if (pullingPastEnd) dx *= 0.3; // rubber-band feel at the first/last page
      track.style.transform = trackTransform(page, metrics.pitch, dx);
    };

    const endPaging = (cancelled: boolean) => {
      const { page, pageCount, metrics, setPage } = latest.current;
      const track = trackRef.current;
      mode = 'idle';
      if (!track || !metrics) return;
      const dx = pointerX - startX;
      let next = page;
      if (!cancelled) {
        const far = Math.abs(dx) > metrics.pitch * PAGE_DISTANCE;
        const fast = Math.abs(velocityX) > PAGE_FLICK && Math.sign(velocityX) === Math.sign(dx);
        if (far || fast) next = clamp(page - Math.sign(dx), 0, pageCount - 1);
      }
      track.style.transition = ''; // back to the CSS snap animation
      track.style.transform = trackTransform(next, metrics.pitch);
      if (next !== page) setPage(next);
    };

    // ---- Dragging an item ---------------------------------------------------

    const updateTarget = () => {
      const { metrics } = latest.current;
      if (!metrics || !dragItem) return;
      const step = metrics.cell + metrics.gap;
      const col = clamp(Math.round((pointerX - grabX - metrics.originX) / step), 0, COLS - dragItem.w);
      const row = clamp(Math.round((pointerY - grabY - metrics.originY) / step), 0, metrics.rows - dragItem.h);
      if (!target || target.col !== col || target.row !== row) {
        target = { col, row, w: dragItem.w, h: dragItem.h };
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
      const item = latest.current.layout.find((i) => i.id === itemId);
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
      setDrag({ id: itemId, x: pointerX - grabX, y: pointerY - grabY });
      updateTarget();
    };

    const moveDrag = () => {
      const ghost = ghostRef.current;
      if (ghost) ghost.style.transform = `translate3d(${pointerX - grabX}px, ${pointerY - grabY}px, 0)`;
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
      const { page, metrics, onMoveItem } = latest.current;
      const item = dragItem!;
      const placed =
        !cancelled && target ? onMoveItem(item.id, { page, col: target.col, row: target.row }) : item;

      // Let the dragged copy glide into its final slot, then remove it.
      const ghost = ghostRef.current;
      if (ghost && metrics) {
        const step = metrics.cell + metrics.gap;
        const x = metrics.originX + placed.col * step + (placed.page - page) * metrics.pitch;
        const y = metrics.originY + placed.row * step;
        ghost.style.transition = 'transform var(--duration-fast) var(--ease-out)';
        ghost.style.transform = `translate3d(${x}px, ${y}px, 0)`;
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
      const { editing, startEditing } = latest.current;
      if (!editing) startEditing();
      if (pressedItemId) beginDrag(pressedItemId);
      else mode = 'ignored';
    };

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
      pressedItemId = element.closest<HTMLElement>('[data-item-id]')?.dataset.itemId ?? null;
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
          mode = 'paging';
          capture();
          if (trackRef.current) trackRef.current.style.transition = 'none';
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

      if (mode === 'paging') endPaging(cancelled);
      else if (mode === 'dragging') endDrag(cancelled);
      else if (mode === 'pressed') {
        mode = 'idle';
        if (cancelled) return;
        // A plain tap
        const { editing, stopEditing, onTapItem } = latest.current;
        if (editing) {
          if (!pressedItemId) stopEditing(); // tap empty space = done
        } else if (pressedItemId) {
          onTapItem(pressedItemId);
        }
      } else if (mode === 'vertical') {
        mode = 'idle';
        if (!cancelled && pointerY - startY > SWIPE_DOWN_MIN) {
          const { onSwipeDown, onSwipeDownFromTop } = latest.current;
          if (startY < TOP_EDGE) onSwipeDownFromTop?.();
          else onSwipeDown?.();
        }
      } else if (mode === 'ignored') {
        mode = 'idle';
      }
    };

    const onUp = (event: PointerEvent) => finish(event, false);
    const onCancel = (event: PointerEvent) => finish(event, true);
    const onContextMenu = (event: Event) => event.preventDefault();

    surface.addEventListener('pointerdown', onDown);
    surface.addEventListener('pointermove', onMove);
    surface.addEventListener('pointerup', onUp);
    surface.addEventListener('pointercancel', onCancel);
    surface.addEventListener('contextmenu', onContextMenu);
    return () => {
      surface.removeEventListener('pointerdown', onDown);
      surface.removeEventListener('pointermove', onMove);
      surface.removeEventListener('pointerup', onUp);
      surface.removeEventListener('pointercancel', onCancel);
      surface.removeEventListener('contextmenu', onContextMenu);
      window.clearTimeout(longPressTimer);
      window.clearTimeout(edgeTimer);
      window.clearTimeout(settleTimer);
    };
  }, [surfaceRef, trackRef, ghostRef]);

  return { drag, dropTarget };
}

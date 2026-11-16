import { useEffect, useRef, type RefObject } from 'react';

/** Drag further than this share of the screen height (halfway) to complete the swipe. */
const DISTANCE_THRESHOLD = 0.5;

interface SwipeUpOptions {
  enabled: boolean;
  onSwipedUp: () => void;
  /**
   * Called while dragging with how far the element has moved (0 = not at all,
   * 1 = a full screen), and with `null` when the finger lifts.
   */
  onProgress?: (progress: number | null) => void;
}

/**
 * Lets the user drag an element upwards with a finger (or mouse).
 * The element follows the finger; on release it either calls `onSwipedUp`
 * or snaps back. The element's CSS decides where it rests and how it animates.
 *
 * While dragging we move the element directly (no React re-render) and only
 * touch `transform`, so it stays smooth.
 */
export function useSwipeUp<T extends HTMLElement>({
  enabled,
  onSwipedUp,
  onProgress,
}: SwipeUpOptions): RefObject<T | null> {
  const ref = useRef<T>(null);
  const callbacks = useRef({ onSwipedUp, onProgress });
  callbacks.current = { onSwipedUp, onProgress };

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let pointerId: number | null = null;
    let startY = 0;

    const onDown = (event: PointerEvent) => {
      if (pointerId !== null) return; // ignore extra fingers
      pointerId = event.pointerId;
      el.setPointerCapture(pointerId);
      startY = event.clientY;
      el.style.transition = 'none'; // follow the finger instantly
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const offset = Math.min(0, event.clientY - startY); // only upwards
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
      callbacks.current.onProgress?.(Math.min(1, -offset / el.offsetHeight));
    };

    const finish = (event: PointerEvent, cancelled: boolean) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      const dragged = startY - event.clientY;
      const pastHalfway = dragged > el.offsetHeight * DISTANCE_THRESHOLD;
      if (!cancelled && pastHalfway) callbacks.current.onSwipedUp();
      callbacks.current.onProgress?.(null);
      // Hand control back to the CSS, which animates to the resting position.
      el.style.transition = '';
      el.style.transform = '';
    };

    const onUp = (event: PointerEvent) => finish(event, false);
    const onCancel = (event: PointerEvent) => finish(event, true);

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
      el.style.transition = '';
      el.style.transform = '';
    };
  }, [enabled]);

  return ref;
}

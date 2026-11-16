import { useEffect, useRef, type RefObject } from 'react';

/** Drag further than this share of the screen height to complete the swipe. */
const DISTANCE_THRESHOLD = 0.3;
/** ...or flick upwards faster than this (pixels per millisecond). */
const VELOCITY_THRESHOLD = 0.5;

interface SwipeUpOptions {
  enabled: boolean;
  onSwipedUp: () => void;
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
}: SwipeUpOptions): RefObject<T | null> {
  const ref = useRef<T>(null);
  const callback = useRef(onSwipedUp);
  callback.current = onSwipedUp;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let pointerId: number | null = null;
    let startY = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0; // px per ms, negative = moving up

    const onDown = (event: PointerEvent) => {
      if (pointerId !== null) return; // ignore extra fingers
      pointerId = event.pointerId;
      el.setPointerCapture(pointerId);
      startY = lastY = event.clientY;
      lastTime = event.timeStamp;
      velocity = 0;
      el.style.transition = 'none'; // follow the finger instantly
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const dt = event.timeStamp - lastTime;
      if (dt > 0) velocity = (event.clientY - lastY) / dt;
      lastY = event.clientY;
      lastTime = event.timeStamp;
      const offset = Math.min(0, event.clientY - startY); // only upwards
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const finish = (event: PointerEvent, cancelled: boolean) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      const dragged = startY - event.clientY;
      const farEnough = dragged > el.offsetHeight * DISTANCE_THRESHOLD;
      const fastEnough = dragged > 10 && velocity < -VELOCITY_THRESHOLD;
      if (!cancelled && (farEnough || fastEnough)) callback.current();
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

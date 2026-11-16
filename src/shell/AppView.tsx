import { useEffect, useLayoutEffect, useRef, type PointerEvent } from 'react';
import { PlaceholderApp } from '../apps/PlaceholderApp';
import type { AppDefinition } from '../system/appRegistry';
import { DURATION_NORMAL_MS } from '../theme/motion';
import styles from './AppView.module.css';

/** A rectangle on screen (where an icon is). */
export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface AppViewProps {
  app: AppDefinition;
  /** Where the app zooms out of (the tapped icon) */
  from: ScreenRect | null;
  /** Where to shrink back to when closing. Asked at close time. */
  getReturnRect: () => ScreenRect | null;
  onClosed: () => void;
}

/** Swipe up further than this (px) from the bottom edge to go home. */
const CLOSE_DISTANCE = 60;
/** Used when the icon is not on screen: shrink into the middle. */
const FALLBACK_SIZE = 72;

/**
 * Shows one app full-screen. It grows out of its icon when opened and
 * shrinks back into it when you swipe up from the bottom edge.
 * Only transform and opacity are animated.
 */
export function AppView({ app, from, getReturnRect, onClosed }: AppViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const swipeStartY = useRef<number | null>(null);

  /** The transform that squeezes the full-screen view into `rect`. */
  const squeezeInto = (rect: ScreenRect | null): string => {
    const el = ref.current!;
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const target = rect ?? {
      left: (width - FALLBACK_SIZE) / 2,
      top: (height - FALLBACK_SIZE) / 2,
      width: FALLBACK_SIZE,
      height: FALLBACK_SIZE,
    };
    return `translate3d(${target.left}px, ${target.top}px, 0) scale(${target.width / width}, ${target.height / height})`;
  };

  // Opening: start squeezed into the icon, then let the CSS transition grow it.
  useLayoutEffect(() => {
    const el = ref.current!;
    el.style.transition = 'none';
    el.style.transform = squeezeInto(from);
    el.style.opacity = '0';
    el.getBoundingClientRect(); // make the browser apply the start position
    el.style.transition = '';
    el.style.transform = '';
    el.style.opacity = '';
    // Only on first show
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const el = ref.current!;
    el.style.transition = '';
    el.style.transform = squeezeInto(getReturnRect());
    el.style.opacity = '0';
    window.setTimeout(onClosed, DURATION_NORMAL_MS);
  };

  // Escape closes the app (handy when testing on a computer).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---- Swipe up from the bottom edge: the app shrinks with the finger ----

  const onSwipeStart = (event: PointerEvent<HTMLDivElement>) => {
    if (closing.current) return;
    swipeStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
    ref.current!.style.transition = 'none';
  };

  const onSwipeMove = (event: PointerEvent<HTMLDivElement>) => {
    if (swipeStartY.current === null) return;
    const el = ref.current!;
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const dy = Math.min(0, event.clientY - swipeStartY.current);
    const progress = Math.min(1, -dy / (height * 0.6));
    const scale = 1 - progress * 0.5;
    const x = (width * (1 - scale)) / 2;
    const y = (height * (1 - scale)) / 2 + dy * 0.3;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}, ${scale})`;
  };

  const onSwipeEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (swipeStartY.current === null) return;
    const dragged = swipeStartY.current - event.clientY;
    swipeStartY.current = null;
    if (event.type === 'pointerup' && dragged > CLOSE_DISTANCE) {
      close();
    } else {
      // Not far enough: snap back to full-screen
      const el = ref.current!;
      el.style.transition = '';
      el.style.transform = '';
    }
  };

  const Content = app.component;

  return (
    <div ref={ref} className={styles.view}>
      <div className={styles.content}>{Content ? <Content /> : <PlaceholderApp app={app} />}</div>
      <div
        className={styles.homeZone}
        aria-label="Swipe up to go home"
        onPointerDown={onSwipeStart}
        onPointerMove={onSwipeMove}
        onPointerUp={onSwipeEnd}
        onPointerCancel={onSwipeEnd}
      >
        <span className={styles.homeBar} />
      </div>
    </div>
  );
}

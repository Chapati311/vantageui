import { useDrag } from '@use-gesture/react';
import { animate, motion, useMotionValue } from 'motion/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { PlaceholderApp } from '../apps/PlaceholderApp';
import { OverlayLayer } from '../components/kit/OverlayLayer';
import type { AppDefinition } from '../system/appRegistry';
import { MOTION, SPRING } from '../theme/tokens';
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
  /** Where the app grows out of (the tapped icon) */
  from: ScreenRect | null;
  /** Where to shrink back to when closing. Asked at close time. */
  getReturnRect: () => ScreenRect | null;
  onClosed: () => void;
}

/** Without a flick, swipe up further than this (px) from the bottom edge to go home. */
const CLOSE_DISTANCE = 80;
/** Used when the icon is not on screen: shrink into the middle. */
const FALLBACK_SIZE = 72;

/**
 * Shows one app full-screen. It grows out of the exact icon position with a
 * spring, and shrinks back into the icon when you swipe up from the bottom
 * edge (it follows the finger first; a quick flick is enough).
 * Only transform and opacity change.
 */
export function AppView({ app, from, getReturnRect, onClosed }: AppViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  // Motion values: the view's position, size and visibility.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const opacity = useMotionValue(1);

  const size = () => ({
    width: ref.current?.offsetWidth ?? window.innerWidth,
    height: ref.current?.offsetHeight ?? window.innerHeight,
  });

  /** The position and scale that squeeze the full-screen view into `rect`. */
  const squeezedInto = (rect: ScreenRect | null) => {
    const { width, height } = size();
    const target = rect ?? {
      left: (width - FALLBACK_SIZE) / 2,
      top: (height - FALLBACK_SIZE) / 2,
      width: FALLBACK_SIZE,
      height: FALLBACK_SIZE,
    };
    return {
      x: target.left,
      y: target.top,
      scaleX: target.width / width,
      scaleY: target.height / height,
    };
  };

  const stopAll = () => [x, y, scaleX, scaleY, opacity].forEach((value) => value.stop());

  /** Springs everything to a position. Returns a promise that ends with the spring. */
  const springTo = (to: { x: number; y: number; scaleX: number; scaleY: number }, fade: number) => {
    animate(y, to.y, SPRING.app);
    animate(scaleX, to.scaleX, SPRING.app);
    animate(scaleY, to.scaleY, SPRING.app);
    animate(opacity, fade, SPRING.app);
    return animate(x, to.x, SPRING.app);
  };

  // Opening: start squeezed into the icon, then spring to full-screen.
  useLayoutEffect(() => {
    const start = squeezedInto(from);
    x.set(start.x);
    y.set(start.y);
    scaleX.set(start.scaleX);
    scaleY.set(start.scaleY);
    opacity.set(0);
    springTo({ x: 0, y: 0, scaleX: 1, scaleY: 1 }, 1);
    return stopAll;
    // Only on first show
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    void springTo(squeezedInto(getReturnRect()), 0).then(onClosed);
  };

  // Escape closes the app (handy when testing on a computer).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Swipe up from the bottom edge: the app shrinks with the finger.
  const bind = useDrag(
    ({ first, last, movement: [, moved], velocity: [, speed], direction: [, direction] }) => {
      if (closing.current) return;
      if (first) stopAll(); // catch it mid-spring
      const { width, height } = size();
      const up = Math.max(0, -moved);
      const scale = 1 - Math.min(1, up / (height * 0.6)) * 0.5;

      if (!last) {
        scaleX.set(scale);
        scaleY.set(scale);
        x.set((width * (1 - scale)) / 2);
        y.set((height * (1 - scale)) / 2 - up * 0.3);
        return;
      }
      const flick = speed > MOTION.flickVelocity && direction < 0;
      if (flick || up > CLOSE_DISTANCE) close();
      else void springTo({ x: 0, y: 0, scaleX: 1, scaleY: 1 }, 1); // not far enough: back to full-screen
    },
    { axis: 'y', filterTaps: true },
  );

  const Content = app.component;

  return (
    <motion.div ref={ref} className={styles.view} style={{ x, y, scaleX, scaleY, opacity }}>
      <OverlayLayer>
        <div className={styles.content}>{Content ? <Content /> : <PlaceholderApp app={app} />}</div>
        <div className={styles.homeZone} aria-label="Swipe up to go home" {...(bind() as object)}>
          <span className={styles.homeBar} />
        </div>
      </OverlayLayer>
    </motion.div>
  );
}

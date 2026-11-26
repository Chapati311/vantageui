import { summon } from '../vantage/summon';
import { useDrag } from '@use-gesture/react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
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
  /** Corner roundness of the shape the app grows out of (px) */
  radius?: number;
}

/** Where an element is on screen and how round its corners are (for growing an app out of it). */
export function shapeOf(element: Element): ScreenRect {
  const rect = element.getBoundingClientRect();
  // The visible shape is the first element inside that has rounded corners
  const shaped = [element, ...Array.from(element.querySelectorAll('*'))].find((node) => getComputedStyle(node).borderTopLeftRadius !== '0px');
  const value = shaped ? getComputedStyle(shaped).borderTopLeftRadius : '0px';
  const radius = value.endsWith('%') ? (Math.min(rect.width, rect.height) * parseFloat(value)) / 100 : parseFloat(value);
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, radius: Math.min(radius, Math.min(rect.width, rect.height) / 2) };
}

interface AppViewProps {
  app: AppDefinition;
  /** Where the app grows out of (the tapped icon) */
  from: ScreenRect | null;
  /** Where to shrink back to when closing. Asked at close time. */
  getReturnRect: () => ScreenRect | null;
  onClosed: () => void;
  /** Swipe up from the bottom edge and hold: show the recent apps */
  onOpenSwitcher?: () => void;
  /** Swipe sideways along the bottom edge: jump to the previous / next recent app */
  onSwitchApp?: (direction: 1 | -1) => void;
  /** Pulled down from the top edge (gets where it started, px from the left) */
  onSwipeDownFromTop?: (x: number) => void;
  /** True while the app fully covers the screen and is still: the home screen behind can stop drawing */
  onCovered?: (covered: boolean) => void;
}

/** Without a flick, swipe up further than this (px) from the bottom edge to go home. */
const CLOSE_DISTANCE = 80;
/** Dragged up at least this far (px) and held still for PAUSE_MS: the app switcher. */
const HOLD_DISTANCE = 90;
const PAUSE_MS = 260;
/** Used when the icon is not on screen: shrink into the middle. */
const FALLBACK_SIZE = 72;

/**
 * Shows one app full-screen. It grows out of the exact icon position with a
 * spring, and shrinks back into the icon when you swipe up from the bottom
 * edge (it follows the finger first; a quick flick is enough).
 * Only transform and opacity change.
 */
export function AppView({ app, from, getReturnRect, onClosed, onOpenSwitcher, onSwitchApp, onSwipeDownFromTop, onCovered }: AppViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const holdTimer = useRef(0);
  /** How far up the finger was when the pause timer started */
  const holdFrom = useRef(0);
  /** The pause opened the switcher: the rest of this swipe does nothing */
  const switched = useRef(false);

  // Motion values: the view's position, size and visibility.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const opacity = useMotionValue(1);
  // The shape morphs from the icon/widget's rounded corners to the full screen
  const shape = useRef({ radius: 0, startScale: 1 });
  const borderRadius = useTransform([scaleX, scaleY], ([sx, sy]: number[]) => {
    const { radius, startScale } = shape.current;
    if (!radius || startScale >= 1) return '0px';
    const progress = Math.min(1, Math.max(0, (sx - startScale) / (1 - startScale)));
    const visible = radius * (1 - progress);
    return `${visible / Math.max(sx, 0.01)}px / ${visible / Math.max(sy, 0.01)}px`;
  });

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
  const covered = useRef(onCovered);
  covered.current = onCovered;
  /** Bumped by every new spring or touch, so an interrupted spring can't report "covered" */
  const motionId = useRef(0);
  const springTo = (to: { x: number; y: number; scaleX: number; scaleY: number }, fade: number) => {
    covered.current?.(false);
    const id = ++motionId.current;
    const full = to.x === 0 && to.y === 0 && to.scaleX === 1 && to.scaleY === 1 && fade === 1;
    animate(y, to.y, SPRING.app);
    animate(scaleX, to.scaleX, SPRING.app);
    animate(scaleY, to.scaleY, SPRING.app);
    animate(opacity, fade, SPRING.app);
    const done = animate(x, to.x, SPRING.app);
    // Fully open and at rest: nothing shows through, so home can stop drawing
    if (full) void done.then(() => id === motionId.current && !closing.current && covered.current?.(true));
    return done;
  };

  // Opening: start squeezed into the icon, then spring to full-screen.
  useLayoutEffect(() => {
    const start = squeezedInto(from);
    shape.current = { radius: from?.radius ?? 0, startScale: start.scaleX };
    x.set(start.x);
    y.set(start.y);
    scaleX.set(start.scaleX);
    scaleY.set(start.scaleY);
    opacity.set(0);
    springTo({ x: 0, y: 0, scaleX: 1, scaleY: 1 }, 1);
    return () => {
      stopAll();
      covered.current?.(false);
    };
    // Only on first show
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const back = getReturnRect();
    const target = squeezedInto(back);
    shape.current = { radius: back?.radius ?? 0, startScale: target.scaleX };
    void springTo(target, 0).then(onClosed);
  };

  // Escape closes the app (handy when testing on a computer), and so does the
  // iPhone's home button in host mode ('vantage:close-app' from the Shell).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('vantage:close-app', close);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('vantage:close-app', close);
    };
  });

  const holdSummon = useRef(0);
  const holdStart = useRef<{ x: number; y: number } | null>(null);

  // Swipe up from the bottom edge: the app shrinks with the finger.
  // Let go quickly to go home; slow down and hold to see the recent apps.
  // Sideways along the edge: switch to the previous / next app.
  const bind = useDrag(
    ({ first, last, movement: [movedX, moved], velocity: [, speed], direction: [, direction], memo }) => {
      if (closing.current) return;
      if (first) {
        stopAll(); // catch it mid-spring
        motionId.current++;
        covered.current?.(false); // home shows again behind the shrinking app
      }
      const { width, height } = size();
      // Decide once which way this swipe goes
      const axis: 'x' | 'y' | undefined =
        memo ?? (Math.abs(movedX) > 12 || Math.abs(moved) > 12 ? (Math.abs(movedX) > Math.abs(moved) ? 'x' : 'y') : undefined);

      if (axis === 'x') {
        if (!last) {
          x.set(movedX * 0.6);
          return axis;
        }
        if (Math.abs(movedX) > width / 4 && onSwitchApp) {
          onSwitchApp(movedX > 0 ? -1 : 1);
        } else {
          void springTo({ x: 0, y: 0, scaleX: 1, scaleY: 1 }, 1);
        }
        return axis;
      }

      const up = Math.max(0, -moved);
      const scale = 1 - Math.min(1, up / (height * 0.6)) * 0.5;
      if (switched.current) {
        if (last) switched.current = false;
        return axis;
      }
      if (!last) {
        scaleX.set(scale);
        scaleY.set(scale);
        x.set((width * (1 - scale)) / 2);
        y.set((height * (1 - scale)) / 2 - up * 0.3);
        // Swipe up and PAUSE: if the finger stays (almost) still for a moment,
        // the recent apps. Every real movement starts the wait again.
        if (up > HOLD_DISTANCE && onOpenSwitcher) {
          if (Math.abs(up - holdFrom.current) > 6 || !holdTimer.current) {
            holdFrom.current = up;
            window.clearTimeout(holdTimer.current);
            holdTimer.current = window.setTimeout(() => {
              holdTimer.current = 0;
              switched.current = true;
              navigator.vibrate?.(10);
              onOpenSwitcher();
              void springTo(squeezedInto(null), 0);
            }, PAUSE_MS);
          }
        } else if (holdTimer.current) {
          window.clearTimeout(holdTimer.current);
          holdTimer.current = 0;
        }
        return axis;
      }
      window.clearTimeout(holdTimer.current);
      holdTimer.current = 0;
      // A quick swipe up (or far enough) goes home
      const flick = speed > MOTION.flickVelocity && direction < 0;
      if (flick || up > CLOSE_DISTANCE) {
        close();
      } else {
        void springTo({ x: 0, y: 0, scaleX: 1, scaleY: 1 }, 1); // not far enough: back to full-screen
      }
      return axis;
    },
    { filterTaps: true },
  );

  // Pull down from the top edge: notifications (left half) or controls (right half)
  const bindTop = useDrag(
    ({ last, movement: [, moved], initial: [startX] }) => {
      if (last && moved > 40) onSwipeDownFromTop?.(startX);
    },
    { axis: 'y', filterTaps: true },
  );

  const Content = app.component;

  return (
    <motion.div ref={ref} className={styles.view} data-app-view style={{ x, y, scaleX, scaleY, opacity, borderRadius }}>
      <OverlayLayer>
        <div className={styles.content}>
          <Content />
        </div>
        <div className={styles.topZone} aria-hidden="true" {...(bindTop() as object)} />
        <div
          className={styles.homeZone}
          aria-label="Swipe up to go home, hold to ask Vantage"
          {...(bind() as object)}
          // Holding the home indicator still (no swipe) summons Vantage
          onPointerDownCapture={(event) => {
            holdStart.current = { x: event.clientX, y: event.clientY };
            window.clearTimeout(holdSummon.current);
            holdSummon.current = window.setTimeout(() => summon('home-indicator'), 550);
          }}
          onPointerMoveCapture={(event) => {
            const from = holdStart.current;
            if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > 8) window.clearTimeout(holdSummon.current);
          }}
          onPointerUpCapture={() => window.clearTimeout(holdSummon.current)}
          onPointerCancelCapture={() => window.clearTimeout(holdSummon.current)}
        >
          <span className={styles.homeBar} />
        </div>
      </OverlayLayer>
    </motion.div>
  );
}

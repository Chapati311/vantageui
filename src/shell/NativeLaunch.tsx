import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { getApp } from '../system/appRegistry';
import { openApp as openNativeApp } from '../system/nativeBridge';
import { getNativeApp } from '../system/nativeApps';
import type { ScreenRect } from './AppView';
import styles from './NativeLaunch.module.css';

/** How long the zoom takes before iOS takes over (fast: it must never feel slow). */
const OPEN_S = 0.2;
const CLOSE_S = 0.26;
const EASE = [0.2, 0.9, 0.3, 1] as const;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
}

let request: ((appId: string, from: ScreenRect | null) => void) | null = null;

/**
 * Opens a REAL app with Vantage's part of the animation (REAL_OS_PROMPT 1.6):
 * its icon grows to fill the screen, then iOS opens the app (iOS starts real
 * apps from the middle of the screen). Back on the home screen, the screen
 * shrinks into the icon again. Without an icon position: a quick fade.
 * The card is always full screen; only its clip shape and opacity animate
 * (no layout work per frame).
 */
export function launchNativeApp(appId: string, from: ScreenRect | null): void {
  if (request) request(appId, from);
  else {
    const bundleId = getApp(appId)?.bundleId;
    if (bundleId) void openNativeApp(bundleId);
  }
}

const boxOf = (rect: ScreenRect | DOMRect | null | undefined): Box | null =>
  rect && rect.width > 0
    ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height, radius: ('radius' in rect && rect.radius) || rect.width / 2 }
    : null;

export function NativeLaunch() {
  const [appId, setAppId] = useState<string | null>(null);
  const icon = useRef<Box | null>(null);
  const opened = useRef<string | null>(null);
  /** 0 = the icon's shape, 1 = the whole screen */
  const grow = useMotionValue(1);
  const opacity = useMotionValue(0);
  const clipPath = useTransform(grow, (t) => {
    const box = icon.current;
    if (!box) return 'inset(0px round 0px)';
    const W = window.innerWidth;
    const H = window.innerHeight;
    const k = 1 - t;
    const top = box.top * k;
    const left = box.left * k;
    const right = (W - box.left - box.width) * k;
    const bottom = (H - box.top - box.height) * k;
    return `inset(${top}px ${right}px ${bottom}px ${left}px round ${box.radius * k}px)`;
  });

  // Open: grow from the icon to the whole screen, then hand over to iOS.
  useEffect(() => {
    request = (id, from) => {
      const bundleId = getApp(id)?.bundleId;
      if (!bundleId) return;
      opened.current = id;
      icon.current = boxOf(from);
      setAppId(id);
      const handOver = () => void openNativeApp(bundleId);
      if (icon.current) {
        grow.set(0);
        opacity.set(1);
        void animate(grow, 1, { duration: OPEN_S, ease: EASE }).then(handOver);
      } else {
        grow.set(1);
        void animate(opacity, 1, { duration: 0.12 }).then(handOver);
      }
      // If iOS didn't take over (app gone, refused), don't leave the card up.
      window.setTimeout(() => {
        if (document.visibilityState === 'visible' && opened.current === id) {
          opened.current = null;
          void animate(opacity, 0, { duration: 0.15 }).then(() => setAppId(null));
        }
      }, 2500);
    };
    return () => {
      request = null;
    };
  }, [grow, opacity]);

  // Back from the app: shrink into its icon (or fade out).
  useEffect(() => {
    const onVisible = () => {
      const id = opened.current;
      if (document.visibilityState !== 'visible' || !id) return;
      opened.current = null;
      setAppId(id);
      grow.set(1);
      opacity.set(1);
      icon.current = boxOf(document.querySelector(`[data-app-icon="${id}"]`)?.getBoundingClientRect());
      const done = () => setAppId(null);
      if (icon.current) {
        void animate(grow, 0, { duration: CLOSE_S, ease: EASE })
          .then(() => animate(opacity, 0, { duration: 0.08 }))
          .then(done);
      } else void animate(opacity, 0, { duration: 0.16 }).then(done);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [grow, opacity]);

  const app = appId ? getApp(appId) : undefined;
  const real = app?.bundleId ? getNativeApp(app.bundleId) : undefined;
  if (!app) return null;
  return (
    <motion.div className={styles.card} style={{ clipPath, WebkitClipPath: clipPath, opacity }} aria-hidden="true">
      {real && <img className={styles.icon} src={`data:image/png;base64,${real.icon}`} alt="" />}
    </motion.div>
  );
}

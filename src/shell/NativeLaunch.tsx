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
 * Opens a REAL app with Vantage's part of the animation (REAL_OS_PROMPT 1.6,
 * DEVICE_QA P0-4): one clean motion. A full-screen card fades in while the
 * app's icon flies from its place on the home screen to the middle and grows,
 * then iOS opens the app. Back on the home screen it runs in reverse.
 * Only opacity and transform animate (the GPU does them; no partial frames,
 * which clip-path animations caused on iOS 16.3).
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
  /** 0 = at the icon's place and size, 1 = centered and big */
  const grow = useMotionValue(1);
  const opacity = useMotionValue(0);
  const CENTER = 96; // the centered icon's size (px)
  const iconX = useTransform(grow, (t) => {
    const box = icon.current;
    if (!box) return 0;
    const from = box.left + box.width / 2 - window.innerWidth / 2;
    return from * (1 - t);
  });
  const iconY = useTransform(grow, (t) => {
    const box = icon.current;
    if (!box) return 0;
    const from = box.top + box.height / 2 - window.innerHeight / 2;
    return from * (1 - t);
  });
  const iconScale = useTransform(grow, (t) => {
    const box = icon.current;
    const start = box ? box.width / CENTER : 0.85;
    return start + (1 - start) * t;
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
      grow.set(0);
      opacity.set(0);
      void animate(opacity, 1, { duration: OPEN_S * 0.7, ease: EASE });
      void animate(grow, 1, { duration: OPEN_S, ease: EASE }).then(handOver);
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
      void animate(grow, 0, { duration: CLOSE_S, ease: EASE });
      void animate(opacity, 0, { duration: CLOSE_S, ease: EASE }).then(done);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [grow, opacity]);

  const app = appId ? getApp(appId) : undefined;
  const real = app?.bundleId ? getNativeApp(app.bundleId) : undefined;
  if (!app) return null;
  return (
    <motion.div className={styles.card} style={{ opacity }} aria-hidden="true">
      {real && (
        <motion.img className={styles.icon} style={{ x: iconX, y: iconY, scale: iconScale }} src={`data:image/png;base64,${real.icon}`} alt="" />
      )}
    </motion.div>
  );
}

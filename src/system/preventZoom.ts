import { isHosted } from './nativeBridge';

/**
 * iOS Safari ignores "user-scalable=no" in some cases, so we also cancel the
 * pinch gesture events and any two-finger touch move. Call once at startup.
 */
export function preventZoom(): void {
  // On the phone the Vantage app turns pinch-zoom off natively. A non-passive
  // touchmove listener would make iOS wait for JavaScript before every scroll.
  if (isHosted()) return;
  const cancel = (event: Event) => event.preventDefault();

  // Safari-only pinch events
  document.addEventListener('gesturestart', cancel, { passive: false });
  document.addEventListener('gesturechange', cancel, { passive: false });

  document.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length > 1) event.preventDefault();
    },
    { passive: false },
  );
}

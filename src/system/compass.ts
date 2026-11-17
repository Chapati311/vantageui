import { useEffect, useState } from 'react';

/**
 * Which way the phone points (degrees, 0 = north, clockwise), from the
 * device's motion sensors. iPhones ask for permission first, and only after
 * a tap, so `request` must be called from a tap.
 */

type OrientationWithCompass = DeviceOrientationEvent & { webkitCompassHeading?: number };
type PermissionFn = () => Promise<'granted' | 'denied'>;

export type CompassStatus = 'needs-permission' | 'active' | 'denied' | 'unsupported';

export function useCompass(): { heading: number | null; status: CompassStatus; request: () => void } {
  const supported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  const needsPermission =
    supported && typeof (DeviceOrientationEvent as unknown as { requestPermission?: PermissionFn }).requestPermission === 'function';
  const [status, setStatus] = useState<CompassStatus>(!supported ? 'unsupported' : needsPermission ? 'needs-permission' : 'active');
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (status !== 'active') return;
    let gotReading = false;
    const onOrientation = (event: Event) => {
      const e = event as OrientationWithCompass;
      // iOS gives the compass heading directly; others give "alpha" (counter-clockwise)
      const value = e.webkitCompassHeading ?? (e.absolute && e.alpha !== null ? 360 - e.alpha : null);
      if (value === null || Number.isNaN(value)) return;
      gotReading = true;
      setHeading(Math.round(value) % 360);
    };
    const name = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(name, onOrientation);
    // No reading within 2 seconds: this device has no compass (a computer)
    const timeout = window.setTimeout(() => !gotReading && setStatus('unsupported'), 2000);
    return () => {
      window.removeEventListener(name, onOrientation);
      window.clearTimeout(timeout);
    };
  }, [status]);

  const request = () => {
    const ask = (DeviceOrientationEvent as unknown as { requestPermission?: PermissionFn }).requestPermission;
    if (!ask) return;
    ask()
      .then((answer) => setStatus(answer === 'granted' ? 'active' : 'denied'))
      .catch(() => setStatus('denied'));
  };

  return { heading, status, request };
}

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** 0 -> "N", 90 -> "E", ... */
export function directionName(heading: number): string {
  return DIRECTIONS[Math.round(heading / 45) % 8];
}

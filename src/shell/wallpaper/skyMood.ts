import { sunTimes } from '../../system/sun';

/** What the sky is doing right now, for the wallpaper (Zurich unless told otherwise). */
export function skyMood(now: Date, raining: boolean, latitude = 47.3769, longitude = 8.5417): 'rain' | 'sunset' | 'night' | null {
  if (raining) return 'rain';
  const { sunrise, sunset } = sunTimes(now, latitude, longitude);
  const minutes = (now.getTime() - sunset.getTime()) / 60_000;
  if (minutes > -50 && minutes < 30) return 'sunset';
  if (now < sunrise || now > sunset) return 'night';
  return null;
}

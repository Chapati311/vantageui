import { useEffect } from 'react';
import { getSettings, updateSettings } from '../system/settingsStore';
import { LIVE_WALLPAPERS } from '../theme/wallpapers';

const DAY_KEY = 'vantage.shuffleDay.v1';

/** Customise > Wallpapers > Daily shuffle: a different live wallpaper every day. */
export function useDailyShuffle(): void {
  useEffect(() => {
    const check = () => {
      if (!getSettings().wallpaperShuffle) return;
      const today = new Date().toDateString();
      if (localStorage.getItem(DAY_KEY) === today) return;
      localStorage.setItem(DAY_KEY, today);
      const day = Math.floor(Date.now() / 86_400_000);
      updateSettings({ wallpaper: { kind: 'live', id: LIVE_WALLPAPERS[day % LIVE_WALLPAPERS.length].id } });
    };
    check();
    const id = window.setInterval(check, 15 * 60_000);
    return () => window.clearInterval(id);
  }, []);
}

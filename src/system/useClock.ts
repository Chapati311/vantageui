import { useEffect, useState } from 'react';

/**
 * Returns the current time and updates once per minute, exactly when the
 * minute changes. Only components that use this hook re-render.
 */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: number;

    const tick = () => {
      setNow(new Date());
      const msToNextMinute = 60_000 - (Date.now() % 60_000);
      timer = window.setTimeout(tick, msToNextMinute + 50);
    };
    tick();

    // Timers pause while the phone sleeps, so refresh when we come back.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        window.clearTimeout(timer);
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return now;
}

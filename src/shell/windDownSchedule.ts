import { useEffect } from 'react';
import { windDownActive } from '../apps/lockin/blocking';
import { getLockIn } from '../apps/lockin/lockInStore';
import { dayKey } from '../system/events';
import { pushNotification } from '../system/notifications';
import { getSettings, setMode } from '../system/settingsStore';
import { getWeather } from '../system/weather';

const STARTED_KEY = 'vantage.windDownAuto.v1';
const MORNING_KEY = 'vantage.morningSummary.v1';

/**
 * Wind Down on its schedule: switches the phone to Wind Down mode when it
 * starts (warm, dim, simple home, distractions locked) and back to Clean at
 * 06:00, but only if it switched it on itself.
 */
export function useWindDownSchedule(): void {
  useEffect(() => {
    const check = () => {
      const active = windDownActive();
      const started = localStorage.getItem(STARTED_KEY) === '1';
      const mode = getSettings().mode;
      if (active && mode !== 'winddown' && !started) {
        setMode('winddown');
        localStorage.setItem(STARTED_KEY, '1');
      } else if (!active && started) {
        if (mode === 'winddown') setMode('clean');
        localStorage.removeItem(STARTED_KEY);
      }
    };
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, []);
}

/** Once each morning (5-12 h), after the first unlock: weather, first lesson, homework due. */
export function morningSummary(): void {
  const now = new Date();
  if (now.getHours() < 5 || now.getHours() >= 12) return;
  const today = dayKey(now);
  if (localStorage.getItem(MORNING_KEY) === today) return;
  localStorage.setItem(MORNING_KEY, today);

  const data = getLockIn();
  if (!data.setupDone) return;
  const weekday = (now.getDay() + 6) % 7;
  const first = data.lessons.filter((lesson) => lesson.day === weekday).sort((a, b) => a.start.localeCompare(b.start))[0];
  const subject = data.subjects.find((item) => item.id === first?.subjectId);
  const due = data.homework.filter((item) => !item.done && item.due === today).length;
  const weather = getWeather();
  const parts = [
    weather ? `${weather.now.temperature}° ${weather.now.condition.toLowerCase()}` : null,
    first && subject ? `first: ${subject.name} at ${first.start}` : null,
    due ? `${due} homework due today` : null,
  ].filter(Boolean);
  pushNotification({ appId: 'lockin', title: 'Good morning', body: parts.length ? `${parts.join(', ')}.` : 'Have a good day.' });
}

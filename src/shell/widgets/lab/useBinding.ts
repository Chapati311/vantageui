import { usePlayer, currentTrack } from '../../../system/musicPlayer';
import { formatDate, formatTime, formatWeekday } from '../../../system/timeFormat';
import { useBattery } from '../../../system/useBattery';
import { useClock } from '../../../system/useClock';
import { useWeather } from '../../../system/weather';
import { focusMinutesToday } from '../../../apps/lockin/lockInStats';
import type { Binding } from './labStore';

/** What a bound block shows: text for text/number blocks, a 0-1 fraction for rings, bars and dots. */
export interface BoundValue {
  text: string;
  fraction: number;
}

export const BINDINGS: { id: Binding; name: string }[] = [
  { id: 'time', name: 'Time' },
  { id: 'date', name: 'Date' },
  { id: 'weekday', name: 'Weekday' },
  { id: 'battery', name: 'Battery' },
  { id: 'temperature', name: 'Temperature' },
  { id: 'condition', name: 'Weather' },
  { id: 'rain', name: 'Rain chance' },
  { id: 'dayProgress', name: 'Day so far' },
  { id: 'monthProgress', name: 'Month so far' },
  { id: 'yearProgress', name: 'Year so far' },
  { id: 'focusToday', name: 'Focus today (Lock In)' },
  { id: 'nowPlaying', name: 'Now playing (Music)' },
  { id: 'custom', name: 'My own text' },
];

/** All live values at once (each hook is cheap; most only update once a minute). */
export function useBindings(): (binding: Binding, custom: string) => BoundValue {
  const now = useClock();
  const battery = useBattery();
  const { data: weather } = useWeather();
  const player = usePlayer();

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayFraction = (now.getTime() - startOfDay) / 86_400_000;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthFraction = (now.getDate() - 1 + dayFraction) / daysInMonth;
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
  const yearFraction = (now.getTime() - yearStart) / (new Date(now.getFullYear() + 1, 0, 1).getTime() - yearStart);
  const focus = focusMinutesToday();
  const track = currentTrack(player);

  return (binding, custom) => {
    switch (binding) {
      case 'time':
        return { text: formatTime(now), fraction: dayFraction };
      case 'date':
        return { text: formatDate(now), fraction: monthFraction };
      case 'weekday':
        return { text: formatWeekday(now), fraction: ((now.getDay() + 6) % 7) / 6 };
      case 'battery':
        return battery ? { text: `${Math.round(battery.level * 100)}%`, fraction: battery.level } : { text: '--', fraction: 0 };
      case 'temperature':
        return weather ? { text: `${weather.now.temperature}°`, fraction: Math.min(1, Math.max(0, (weather.now.temperature + 10) / 45)) } : { text: '--', fraction: 0 };
      case 'condition':
        return { text: weather?.now.condition ?? 'Loading', fraction: 0 };
      case 'rain':
        return weather ? { text: `${weather.hourly[0]?.rainChance ?? 0}%`, fraction: (weather.hourly[0]?.rainChance ?? 0) / 100 } : { text: '--', fraction: 0 };
      case 'dayProgress':
        return { text: `${Math.round(dayFraction * 100)}%`, fraction: dayFraction };
      case 'monthProgress':
        return { text: `${Math.round(monthFraction * 100)}%`, fraction: monthFraction };
      case 'yearProgress':
        return { text: `${Math.round(yearFraction * 100)}%`, fraction: yearFraction };
      case 'focusToday':
        return { text: `${focus} min`, fraction: Math.min(1, focus / 120) };
      case 'nowPlaying':
        return { text: track ? track.title : 'Nothing playing', fraction: player.position && track?.duration ? player.position / track.duration : 0 };
      default:
        return { text: custom || 'Text', fraction: 0 };
    }
  };
}

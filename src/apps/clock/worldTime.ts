/** The cities shown in the world clock. Add a line to add a city. */
export const WORLD_CITIES = [
  { name: 'Zurich', timeZone: 'Europe/Zurich' },
  { name: 'London', timeZone: 'Europe/London' },
  { name: 'New York', timeZone: 'America/New_York' },
  { name: 'Los Angeles', timeZone: 'America/Los_Angeles' },
  { name: 'Dubai', timeZone: 'Asia/Dubai' },
  { name: 'Tokyo', timeZone: 'Asia/Tokyo' },
  { name: 'Sydney', timeZone: 'Australia/Sydney' },
];

export interface CityTime {
  /** "14:05" */
  time: string;
  /** "Today · +8h", "Tomorrow · +9h", "Same time" */
  note: string;
}

/** What the clock on the wall says in `timeZone` at the moment `now`. */
export function cityTime(now: Date, timeZone: string): CityTime {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';

  // Compare "wall clock" times as if both were in the same zone.
  const thereDay = Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day')));
  const there = thereDay + (Number(part('hour')) * 60 + Number(part('minute'))) * 60_000;
  const hereDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const here = hereDay + (now.getHours() * 60 + now.getMinutes()) * 60_000;

  const offsetMinutes = Math.round((there - here) / 60_000);
  const dayDifference = Math.round((thereDay - hereDay) / 86_400_000);

  const day = dayDifference === 0 ? 'Today' : dayDifference > 0 ? 'Tomorrow' : 'Yesterday';
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const offset = `${offsetMinutes > 0 ? '+' : '-'}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}h`;

  return {
    time: `${part('hour')}:${part('minute')}`,
    note: offsetMinutes === 0 ? 'Same time' : `${day} · ${offset}`,
  };
}

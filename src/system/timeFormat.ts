const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const weekdayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });

/** "08:02" */
export function formatTime(date: Date): string {
  return timeFormat.format(date);
}

/** "Monday 16 November" */
export function formatDate(date: Date): string {
  return dateFormat.format(date).replace(',', '');
}

/** "Mon" */
export function formatWeekday(date: Date): string {
  return weekdayFormat.format(date);
}

const NUMBERS = [
  'twelve',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
];

const MINUTES: Record<number, string> = {
  5: 'five past',
  10: 'ten past',
  15: 'quarter past',
  20: 'twenty past',
  25: 'twenty-five past',
  30: 'half past',
  35: 'twenty-five to',
  40: 'twenty to',
  45: 'quarter to',
  50: 'ten to',
  55: 'five to',
};

/**
 * The time in words, to the nearest five minutes: "It's twenty past seven",
 * "It's nearly eight" (just before the hour), "It's eight o'clock".
 */
export function wordTime(date: Date): string {
  const minutes = date.getMinutes();
  const rounded = Math.round(minutes / 5) * 5;
  // After half past, we count towards the next hour
  const hour = (date.getHours() + (rounded > 30 ? 1 : 0)) % 12;
  if (rounded === 0 || rounded === 60) {
    const atHour = (date.getHours() + (rounded === 60 ? 1 : 0)) % 12;
    return minutes > 55 ? `It's nearly ${NUMBERS[atHour]}` : `It's ${NUMBERS[atHour]} o'clock`;
  }
  return `It's ${MINUTES[rounded]} ${NUMBERS[hour]}`;
}

const two = (value: number) => String(value).padStart(2, '0');

/** Countdown text: "04:59". Rounds up, so it shows 00:00 only when truly done. */
export function formatCountdown(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${two(Math.floor(seconds / 60))}:${two(seconds % 60)}`;
}

/** Stopwatch text with hundredths: "01:23.45". */
export function formatStopwatch(ms: number): string {
  const hundredths = Math.floor(ms / 10);
  const seconds = Math.floor(hundredths / 100);
  return `${two(Math.floor(seconds / 60))}:${two(seconds % 60)}.${two(hundredths % 100)}`;
}

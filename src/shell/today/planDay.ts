/**
 * "Plan my day": a simple timeline from now until Wind Down, built on the
 * phone without any AI. Fixed things (lessons, events) stay where they are;
 * the gaps between them get focus blocks for the homework that is due
 * soonest, with short breaks in between.
 */

export interface PlanInput {
  now: Date;
  /** Lessons and timed events today: start/end as minutes after midnight */
  fixed: { title: string; start: number; end: number; kind: 'lesson' | 'event' }[];
  /** Open homework, soonest due first */
  homework: { title: string; due: string }[];
  /** "21:30": when the day winds down */
  windDown: string;
  /** Focus block length in minutes */
  block?: number;
}

export interface PlanItem {
  /** Minutes after midnight */
  start: number;
  end: number;
  title: string;
  kind: 'lesson' | 'event' | 'focus' | 'break' | 'winddown';
}

export const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const formatMinutes = (minutes: number): string =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function planDay({ now, fixed, homework, windDown, block = 45 }: PlanInput): PlanItem[] {
  const startOfPlan = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 5) * 5;
  const end = Math.max(toMinutes(windDown), startOfPlan);
  const plan: PlanItem[] = [];

  const busy = fixed
    .filter((item) => item.end > startOfPlan && item.start < end)
    .sort((a, b) => a.start - b.start)
    .map((item) => ({ ...item, start: Math.max(item.start, startOfPlan) }));

  const todo = homework.map((item) => item.title);
  let cursor = startOfPlan;
  let next = 0;

  const fillGap = (until: number) => {
    // Only gaps of at least 30 minutes get a focus block
    while (until - cursor >= 30 && todo.length > 0) {
      const length = Math.min(block, until - cursor);
      plan.push({ start: cursor, end: cursor + length, title: todo.shift()!, kind: 'focus' });
      cursor += length;
      if (until - cursor >= 40 && todo.length > 0) {
        plan.push({ start: cursor, end: cursor + 10, title: 'Break', kind: 'break' });
        cursor += 10;
      }
    }
  };

  while (next < busy.length) {
    const item = busy[next++];
    fillGap(item.start);
    plan.push({ start: item.start, end: item.end, title: item.title, kind: item.kind });
    cursor = Math.max(cursor, item.end);
  }
  fillGap(end);
  if (end > startOfPlan || plan.length === 0) plan.push({ start: end, end: end + 30, title: 'Wind Down', kind: 'winddown' });
  return plan;
}

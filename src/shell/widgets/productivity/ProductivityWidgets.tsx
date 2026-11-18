import { useState } from 'react';
import { DotNumber } from '../../../components/DotNumber';
import { Widget } from '../../../components/Widget';
import { Button, Sheet } from '../../../components/kit';
import { useClock } from '../../../system/useClock';
import { useWidgetEdit } from '../../home/widgetEdit';
import styles from './ProductivityWidgets.module.css';

const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long' });

/**
 * This month as a grid of dots, one per day: days gone by are faint, today
 * is the accent, days to come are white.
 */
export function DotCalendarWidget() {
  const now = useClock();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  // Monday first: how many empty spots before day 1
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const today = now.getDate();

  return (
    <Widget shape="rounded">
      <div className={styles.calendar}>
        <div className={styles.calendarHead}>
          <span className="label">{monthFormat.format(now)}</span>
          <span className="label">
            {days - today} left
          </span>
        </div>
        <div className={styles.dots} role="img" aria-label={`${monthFormat.format(now)}, day ${today} of ${days}`}>
          {Array.from({ length: offset }, (_, index) => (
            <span key={`e${index}`} />
          ))}
          {Array.from({ length: days }, (_, index) => {
            const day = index + 1;
            return <span key={day} className={day < today ? styles.past : day === today ? styles.today : styles.future} />;
          })}
        </div>
      </div>
    </Widget>
  );
}

const COUNTDOWN_KEY = 'vantage.countdown.v1';

interface Countdown {
  name: string;
  /** "2026-12-24" */
  date: string;
}

function loadCountdown(): Countdown | null {
  try {
    const saved = JSON.parse(localStorage.getItem(COUNTDOWN_KEY) ?? 'null');
    return saved && typeof saved.name === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.date) ? saved : null;
  } catch {
    return null;
  }
}

/** Days until something you are looking forward to. Tap to set it. */
export function CountdownWidget() {
  const now = useClock();
  const [countdown, setCountdown] = useState(loadCountdown);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(countdown?.name ?? '');
  const [date, setDate] = useState(countdown?.date ?? '');

  // Hold the widget > Edit
  useWidgetEdit(() => setEditing(true));

  const target = countdown ? new Date(`${countdown.date}T00:00:00`) : null;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = target ? Math.round((target.getTime() - startOfToday.getTime()) / 86_400_000) : null;

  const save = () => {
    if (!name.trim() || !date) return;
    const next = { name: name.trim().slice(0, 24), date };
    setCountdown(next);
    try {
      localStorage.setItem(COUNTDOWN_KEY, JSON.stringify(next));
    } catch {
      // Kept until reload.
    }
    setEditing(false);
  };

  return (
    <Widget shape="rounded">
      <div className={styles.countdown} role="img" aria-label={countdown ? `${days} days until ${countdown.name}` : 'Countdown, not set'}>
        {countdown && days !== null ? (
          <>
            <DotNumber value={String(Math.max(0, days))} size={40} />
            <span className="label">{days > 0 ? `days to ${countdown.name}` : days === 0 ? `${countdown.name} is today` : `${countdown.name} is over`}</span>
          </>
        ) : (
          <>
            <span className={styles.countdownTitle}>Countdown</span>
            <span className="label">Hold, then Edit</span>
          </>
        )}
      </div>
      <Sheet open={editing} onClose={() => setEditing(false)} title="Countdown">
        <input className={styles.input} placeholder="What is it?" aria-label="Name" value={name} maxLength={24} onChange={(event) => setName(event.target.value)} />
        <input className={styles.input} type="date" aria-label="Date" value={date} onChange={(event) => setDate(event.target.value)} />
        <Button kind="primary" wide onPress={save} disabled={!name.trim() || !date}>
          Save
        </Button>
      </Sheet>
    </Widget>
  );
}

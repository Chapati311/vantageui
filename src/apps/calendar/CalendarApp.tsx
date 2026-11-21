import { useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { BackIcon, PlusIcon } from '../../components/glyphs';
import { AppShell, Button, EmptyState, Row, Section, Sheet, SwipeToDelete, Toggle } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { dayKey, useEvents, type CalendarEvent } from '../../system/events';
import { useClock } from '../../system/useClock';
import styles from './Calendar.module.css';

const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Calendar. The signature: the month made of dots. Days with events get a
 * ring, today is the accent. Tap a day to see (and add) its events.
 */
export function CalendarApp() {
  const now = useClock();
  const { events, loaded } = useEvents();
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(() => dayKey(now));
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  const year = month.getFullYear();
  const days = new Date(year, month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const today = dayKey(now);
  const busy = new Set(events.map((event) => event.date));
  const dayEvents = events.filter((event) => event.date === selected);

  const shift = (by: number) => setMonth(new Date(year, month.getMonth() + by, 1));

  return (
    <AppShell
      title="Calendar"
      trailing={
        <CircleButton small label="New event" onClick={() => setEditing(blankEvent(selected))}>
          <PlusIcon />
        </CircleButton>
      }
    >
      <div className={styles.monthBar}>
        <CircleButton small label="Previous month" onClick={() => shift(-1)}>
          <BackIcon />
        </CircleButton>
        <span className={styles.monthName}>{monthFormat.format(month)}</span>
        <CircleButton small label="Next month" onClick={() => shift(1)}>
          <span className={styles.flip}>
            <BackIcon />
          </span>
        </CircleButton>
      </div>

      <div className={styles.grid} role="grid" aria-label={monthFormat.format(month)}>
        {WEEKDAYS.map((letter, index) => (
          <span key={`w${index}`} className={`label ${styles.weekday}`}>
            {letter}
          </span>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <span key={`e${index}`} />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const key = dayKey(new Date(year, month.getMonth(), index + 1));
          return (
            <Pressable
              key={key}
              className={[styles.day, key === selected && styles.selected, key < today && styles.past].filter(Boolean).join(' ')}
              aria-label={`${index + 1}${busy.has(key) ? ', has events' : ''}`}
              onClick={() => setSelected(key)}
            >
              <span className={`${styles.dot} ${key === today ? styles.today : ''} ${busy.has(key) ? styles.busy : ''}`} />
              <span className={styles.number}>{index + 1}</span>
            </Pressable>
          );
        })}
      </div>

      <Section label={dayFormat.format(new Date(`${selected}T00:00:00`))} card={dayEvents.length > 0}>
        {!loaded ? null : dayEvents.length === 0 ? (
          <EmptyState title="Free" message="Nothing planned on this day." action={{ label: 'Add an event', onPress: () => setEditing(blankEvent(selected)) }} />
        ) : (
          dayEvents.map((event) => (
            <SwipeToDelete key={event.id} onDelete={() => void runAction('calendar.delete', { id: event.id })}>
              <Row title={event.title} detail={event.note || undefined} value={event.time ?? 'All day'} onPress={() => setEditing(event)} />
            </SwipeToDelete>
          ))
        )}
      </Section>

      <EventEditor event={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

function blankEvent(date: string): CalendarEvent {
  return { id: `event-${Date.now().toString(36)}`, title: '', date, time: '09:00', duration: 60, note: '' };
}

function EventEditor({ event, onClose }: { event: CalendarEvent | null; onClose: () => void }) {
  const [draft, setDraft] = useState<CalendarEvent | null>(null);
  const current = draft && event && draft.id === event.id ? draft : event;

  const save = () => {
    if (!current || !current.title.trim()) return;
    void runAction('calendar.save', { event: { ...current, title: current.title.trim() } });
    setDraft(null);
    onClose();
  };

  return (
    <Sheet
      open={event !== null}
      onClose={() => {
        setDraft(null);
        onClose();
      }}
      title="Event"
      action={
        <Button kind="primary" onPress={save} disabled={!current?.title.trim()}>
          Save
        </Button>
      }
    >
      {current && (
        <>
          <input className={styles.input} placeholder="Title" aria-label="Title" value={current.title} maxLength={60} onChange={(e) => setDraft({ ...current, title: e.target.value })} />
          <input className={styles.input} type="date" aria-label="Date" value={current.date} onChange={(e) => /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) && setDraft({ ...current, date: e.target.value })} />
          <Row title="All day" trailing={<Toggle label="All day" on={current.time === null} onChange={(on) => setDraft({ ...current, time: on ? null : '09:00' })} />} />
          {current.time !== null && (
            <input className={styles.input} type="time" aria-label="Time" value={current.time} onChange={(e) => setDraft({ ...current, time: /^\d{2}:\d{2}/.test(e.target.value) ? e.target.value.slice(0, 5) : '09:00' })} />
          )}
          <input className={styles.input} placeholder="Note" aria-label="Note" value={current.note} maxLength={120} onChange={(e) => setDraft({ ...current, note: e.target.value })} />
        </>
      )}
    </Sheet>
  );
}

import { useState } from 'react';
import { CheckIcon, PlusIcon } from '../../components/glyphs';
import { AppShell, Button, EmptyState, Row, SegmentedControl, Sheet, SwipeToDelete, Toggle } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { dayKey } from '../../system/events';
import { isDue, newReminder, useReminders, type Reminder } from '../../system/reminders';
import { useClock } from '../../system/useClock';
import styles from './Reminders.module.css';

type View = 'today' | 'all' | 'done';
const dateFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/** Reminders: tap the circle to tick one off, tap the text to edit, swipe left to delete. */
export function RemindersApp() {
  const now = useClock();
  const { reminders, loaded } = useReminders();
  const [view, setView] = useState<View>('today');
  const [quick, setQuick] = useState('');
  const [editing, setEditing] = useState<Reminder | null>(null);
  const today = dayKey(now);

  const shown = reminders.filter((reminder) =>
    view === 'done' ? reminder.done : !reminder.done && (view === 'all' || !reminder.date || reminder.date <= today),
  );

  const addQuick = () => {
    if (!quick.trim()) return;
    void runAction('reminders.save', { reminder: { ...newReminder(), title: quick.trim(), date: view === 'today' ? today : null } });
    setQuick('');
  };

  return (
    <AppShell
      title="Reminders"
      header={
        <SegmentedControl
          label="Show"
          value={view}
          onChange={setView}
          options={[
            { id: 'today', label: 'Today' },
            { id: 'all', label: 'All' },
            { id: 'done', label: 'Done' },
          ]}
        />
      }
    >
      {view !== 'done' && (
        <form
          className={styles.quick}
          onSubmit={(event) => {
            event.preventDefault();
            addQuick();
          }}
        >
          <input className={styles.input} placeholder="New reminder" aria-label="New reminder" value={quick} onChange={(event) => setQuick(event.target.value)} enterKeyHint="done" />
          <Pressable className={styles.add} aria-label="Add" onClick={addQuick} disabled={!quick.trim()}>
            <PlusIcon />
          </Pressable>
        </form>
      )}

      {loaded && shown.length === 0 ? (
        <EmptyState icon={CheckIcon} title={view === 'done' ? 'Nothing done yet' : 'All clear'} message={view === 'done' ? 'Ticked-off reminders show up here.' : 'Type above to add a reminder.'} />
      ) : (
        <div className={styles.list}>
          {shown.map((reminder) => (
            <SwipeToDelete key={reminder.id} onDelete={() => void runAction('reminders.delete', { id: reminder.id })}>
              <div className={styles.item}>
                <Pressable
                  className={`${styles.circle} ${reminder.done ? styles.circleDone : ''}`}
                  aria-label={reminder.done ? 'Mark as not done' : 'Mark as done'}
                  onClick={() => void runAction('reminders.setDone', { id: reminder.id, done: !reminder.done })}
                >
                  {reminder.done && <CheckIcon />}
                </Pressable>
                <button type="button" className={styles.text} onClick={() => setEditing(reminder)}>
                  <span className={`${styles.title} ${reminder.done ? styles.titleDone : ''}`}>{reminder.title}</span>
                  {reminder.date && (
                    <span className={`${styles.due} ${!reminder.done && isDue(reminder, now) ? styles.overdue : ''}`}>
                      {reminder.date === today ? 'Today' : dateFormat.format(new Date(`${reminder.date}T00:00:00`))}
                      {reminder.time ? ` · ${reminder.time}` : ''}
                    </span>
                  )}
                </button>
              </div>
            </SwipeToDelete>
          ))}
        </div>
      )}

      <ReminderEditor reminder={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

function ReminderEditor({ reminder, onClose }: { reminder: Reminder | null; onClose: () => void }) {
  const [draft, setDraft] = useState<Reminder | null>(null);
  const current = draft && reminder && draft.id === reminder.id ? draft : reminder;
  const close = () => {
    setDraft(null);
    onClose();
  };
  return (
    <Sheet
      open={reminder !== null}
      onClose={close}
      title="Reminder"
      action={
        <Button
          kind="primary"
          disabled={!current?.title.trim()}
          onPress={() => {
            if (current) void runAction('reminders.save', { reminder: { ...current, notified: false } });
            close();
          }}
        >
          Save
        </Button>
      }
    >
      {current && (
        <>
          <input className={styles.input} value={current.title} aria-label="Reminder" maxLength={80} onChange={(e) => setDraft({ ...current, title: e.target.value })} />
          <Row title="On a day" trailing={<Toggle label="On a day" on={current.date !== null} onChange={(on) => setDraft({ ...current, date: on ? dayKey(new Date()) : null, time: on ? current.time : null })} />} />
          {current.date !== null && (
            <>
              <input className={styles.input} type="date" aria-label="Date" value={current.date} onChange={(e) => e.target.value && setDraft({ ...current, date: e.target.value })} />
              <Row title="At a time" detail="You get a notification then" trailing={<Toggle label="At a time" on={current.time !== null} onChange={(on) => setDraft({ ...current, time: on ? '09:00' : null })} />} />
              {current.time !== null && <input className={styles.input} type="time" aria-label="Time" value={current.time} onChange={(e) => setDraft({ ...current, time: e.target.value || '09:00' })} />}
            </>
          )}
        </>
      )}
    </Sheet>
  );
}

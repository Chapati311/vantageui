import { useState } from 'react';
import { ScrollArea } from '../../components/ScrollArea';
import { CheckIcon } from '../../components/glyphs';
import { newId, updateNote, type ChecklistItem, type Note } from './notesStore';
import styles from './Checklist.module.css';

/** The to-do mode of a note: tick items off, edit them, add new ones. */
export function Checklist({ note }: { note: Note }) {
  const [draft, setDraft] = useState('');

  const setItems = (items: ChecklistItem[]) => updateNote(note.id, { items });

  const change = (id: string, patch: Partial<ChecklistItem>) =>
    setItems(note.items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  /** Turns what was typed in the "Add item" field into a real item. */
  const addDraft = () => {
    const text = draft.trim();
    if (!text) return;
    setItems([...note.items, { id: newId(), text, done: false }]);
    setDraft('');
  };

  return (
    <ScrollArea className={styles.checklist}>
      {note.items.map((item) => (
        <div key={item.id} className={`${styles.item} ${item.done ? styles.done : ''}`}>
          <button
            type="button"
            role="checkbox"
            aria-checked={item.done}
            aria-label={item.text || 'Item'}
            className={styles.check}
            onClick={() => change(item.id, { done: !item.done })}
          >
            <span className={styles.box}>{item.done && <CheckIcon />}</span>
          </button>
          <input
            className={styles.input}
            aria-label="Item text"
            value={item.text}
            onChange={(event) => change(item.id, { text: event.target.value })}
            // Clearing an item and leaving it removes it.
            onBlur={() => {
              if (!item.text.trim()) setItems(note.items.filter((other) => other.id !== item.id));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
        </div>
      ))}

      <div className={styles.item}>
        <span className={styles.check}>
          <span className={`${styles.box} ${styles.dashed}`} />
        </span>
        <input
          className={styles.input}
          placeholder="Add item"
          aria-label="Add item"
          enterKeyHint="done"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={addDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addDraft(); // stays focused for the next one
          }}
        />
      </div>
    </ScrollArea>
  );
}

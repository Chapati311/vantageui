import { CircleButton } from '../../components/CircleButton';
import { BackIcon, CheckIcon, ChecklistIcon, TextIcon, TrashIcon } from '../../components/glyphs';
import { useEffect, useState } from 'react';
import { AppShell } from '../../components/kit';
import { runAction } from '../../system/actions';
import { Checklist } from './Checklist';
import { updateNote, type Note } from './notesStore';
import styles from './Notes.module.css';

interface NoteEditorProps {
  note: Note;
  onBack: () => void;
  onDelete: () => void;
}

const savedFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

/** One note, written in a big editorial serif. Saved as you type. */
export function NoteEditor({ note, onBack, onDelete }: NoteEditorProps) {
  // Delete asks for a second tap; the question goes away by itself after 3 seconds
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  return (
    <AppShell
      fixed
      leading={
        <CircleButton small label="Back to all notes" onClick={onBack}>
          <BackIcon />
        </CircleButton>
      }
      trailing={
        <>
          <CircleButton small label={note.kind === 'text' ? 'Turn into a checklist' : 'Turn into plain text'} onClick={() => void runAction('notes.convert', { id: note.id })}>
            {note.kind === 'text' ? <ChecklistIcon /> : <TextIcon />}
          </CircleButton>
          <CircleButton small label={confirming ? 'Tap again to delete' : 'Delete note'} onClick={() => (confirming ? onDelete() : setConfirming(true))}>
            {confirming ? <CheckIcon /> : <TrashIcon />}
          </CircleButton>
        </>
      }
    >
      <span className={`label ${styles.saved}`}>{savedFormat.format(note.updatedAt)}</span>
      {note.kind === 'text' ? (
        <textarea
          className={styles.text}
          placeholder="Start writing"
          aria-label="Note text"
          value={note.text}
          autoFocus={!note.text}
          onChange={(event) => updateNote(note.id, { text: event.target.value })}
        />
      ) : (
        <Checklist note={note} />
      )}
    </AppShell>
  );
}

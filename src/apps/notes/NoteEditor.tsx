import { useEffect, useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { BackIcon, CheckIcon, ChecklistIcon, TextIcon, TrashIcon } from '../../components/glyphs';
import { Checklist } from './Checklist';
import { convertNote, updateNote, type Note } from './notesStore';
import styles from './NoteEditor.module.css';

interface NoteEditorProps {
  note: Note;
  onBack: () => void;
  onDelete: () => void;
}

/** How long the delete button waits for a second tap to confirm. */
const CONFIRM_MS = 3000;

/** Edits one note. Everything is saved automatically as you type. */
export function NoteEditor({ note, onBack, onDelete }: NoteEditorProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // The "are you sure" state goes away by itself.
  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = window.setTimeout(() => setConfirmingDelete(false), CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [confirmingDelete]);

  return (
    <div className={styles.editor}>
      <header className={styles.bar}>
        <CircleButton small label="Back to all notes" onClick={onBack}>
          <BackIcon />
        </CircleButton>
        <span className={styles.spacer} />
        <CircleButton
          small
          label={note.kind === 'text' ? 'Turn into a checklist' : 'Turn into plain text'}
          onClick={() => convertNote(note)}
        >
          {note.kind === 'text' ? <ChecklistIcon /> : <TextIcon />}
        </CircleButton>
        <CircleButton
          small
          primary={confirmingDelete}
          label={confirmingDelete ? 'Tap again to delete' : 'Delete note'}
          onClick={() => (confirmingDelete ? onDelete() : setConfirmingDelete(true))}
        >
          {confirmingDelete ? <CheckIcon /> : <TrashIcon />}
        </CircleButton>
      </header>

      {note.kind === 'text' ? (
        <textarea
          className={styles.text}
          placeholder="Write something"
          aria-label="Note text"
          value={note.text}
          onChange={(event) => updateNote(note.id, { text: event.target.value })}
        />
      ) : (
        <Checklist note={note} />
      )}
    </div>
  );
}

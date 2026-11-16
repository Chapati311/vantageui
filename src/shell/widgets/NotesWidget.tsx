import { notePreview, noteTitle, useNotes } from '../../apps/notes/notesStore';
import { Widget } from '../../components/Widget';
import styles from './NotesWidget.module.css';

/** Shows your newest note (real data from the Notes app). Tap to open Notes. */
export function NotesWidget() {
  const { notes } = useNotes();
  const latest = notes[0];

  return (
    <Widget shape="rounded">
      <div className={styles.notes}>
        <span className={styles.label}>Notes</span>
        <span className={styles.title}>{latest ? noteTitle(latest) : 'No notes yet'}</span>
        <span className={styles.preview}>{latest ? notePreview(latest) : 'Tap to write one'}</span>
      </div>
    </Widget>
  );
}

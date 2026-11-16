import { CircleButton } from '../../components/CircleButton';
import { ScrollArea } from '../../components/ScrollArea';
import { ChecklistIcon, PlusIcon } from '../../components/glyphs';
import { notePreview, noteTitle, type Note } from './notesStore';
import styles from './NotesList.module.css';

interface NotesListProps {
  notes: Note[];
  loaded: boolean;
  onOpen: (id: string) => void;
  onCreate: (kind: Note['kind']) => void;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

export function NotesList({ notes, loaded, onOpen, onCreate }: NotesListProps) {
  return (
    <div className={styles.list}>
      <header className={styles.header}>
        <h1 className={styles.title}>Notes</h1>
        <div className={styles.buttons}>
          <CircleButton small label="New checklist" onClick={() => onCreate('checklist')}>
            <ChecklistIcon />
          </CircleButton>
          <CircleButton small primary label="New note" onClick={() => onCreate('text')}>
            <PlusIcon />
          </CircleButton>
        </div>
      </header>

      {loaded && notes.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nothing yet</p>
          <p className={styles.label}>Tap + to write your first note</p>
        </div>
      ) : (
        <ScrollArea className={styles.notes}>
          {notes.map((note) => (
            <button key={note.id} type="button" className={styles.note} onClick={() => onOpen(note.id)}>
              <span className={styles.noteTitle}>{noteTitle(note)}</span>
              <span className={styles.meta}>
                <span className={styles.label}>{dateFormat.format(note.updatedAt)}</span>
                <span className={styles.preview}>{notePreview(note)}</span>
              </span>
            </button>
          ))}
        </ScrollArea>
      )}
    </div>
  );
}

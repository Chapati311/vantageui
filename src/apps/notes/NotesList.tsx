import { useState } from 'react';
import { motion } from 'motion/react';
import { CircleButton } from '../../components/CircleButton';
import { ChecklistIcon, PlusIcon } from '../../components/glyphs';
import { AppShell, EmptyState, SearchField, SwipeToDelete } from '../../components/kit';
import { pressState } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { NotesIcon } from '../../system/appIcons';
import { notePreview, noteTitle, type Note } from './notesStore';
import styles from './Notes.module.css';

interface NotesListProps {
  notes: Note[];
  loaded: boolean;
  onOpen: (id: string) => void;
  onCreate: (kind: Note['kind']) => void;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/** All notes, newest first: serif titles like a magazine's contents page. */
export function NotesList({ notes, loaded, onOpen, onCreate }: NotesListProps) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? notes.filter((note) => `${noteTitle(note)} ${notePreview(note)} ${note.text}`.toLowerCase().includes(needle))
    : notes;

  return (
    <AppShell
      title="Notes"
      trailing={
        <>
          <CircleButton small label="New checklist" onClick={() => onCreate('checklist')}>
            <ChecklistIcon />
          </CircleButton>
          <CircleButton small primary label="New note" onClick={() => onCreate('text')}>
            <PlusIcon />
          </CircleButton>
        </>
      }
      header={notes.length > 0 ? <SearchField value={query} onChange={setQuery} placeholder="Search notes" /> : undefined}
    >
      {!loaded ? (
        <EmptyState kind="loading" title="Opening" />
      ) : notes.length === 0 ? (
        <EmptyState icon={NotesIcon} title="Nothing yet" message="Your notes and lists live here, on this phone." action={{ label: 'Write a note', onPress: () => onCreate('text') }} />
      ) : shown.length === 0 ? (
        <EmptyState title="No match" message={`Nothing contains "${query.trim()}".`} />
      ) : (
        <div className={styles.list}>
          {shown.map((note) => (
            <SwipeToDelete key={note.id} onDelete={() => void runAction('notes.delete', { id: note.id })}>
              <motion.div role="button" tabIndex={0} className={styles.card} onClick={() => onOpen(note.id)} {...pressState}>
                <span className={styles.cardTitle}>{noteTitle(note)}</span>
                <span className={styles.cardMeta}>
                  <span className="label">{dateFormat.format(note.updatedAt)}</span>
                  <span className={styles.cardPreview}>{notePreview(note)}</span>
                </span>
              </motion.div>
            </SwipeToDelete>
          ))}
        </div>
      )}
    </AppShell>
  );
}

import { useState } from 'react';
import { motion } from 'motion/react';
import { CircleButton } from '../../components/CircleButton';
import { ChecklistIcon, PinIcon, PlusIcon, TrashIcon } from '../../components/glyphs';
import { AppShell, ContextMenu, EmptyState, SearchField, SwipeToDelete } from '../../components/kit';
import { Pressable, pressState } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { NotesIcon } from '../../system/appIcons';
import { noteFolders, notePreview, noteTitle, type Note } from './notesStore';
import styles from './Notes.module.css';

interface NotesListProps {
  notes: Note[];
  loaded: boolean;
  onOpen: (id: string) => void;
  onCreate: (kind: Note['kind']) => void;
  onDelete: (note: Note) => void;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/**
 * All notes: pinned first, then newest first, with serif titles like a
 * magazine's contents page. Folders as chips along the top; hold a note to
 * pin it, swipe it left to delete it (with Undo).
 */
export function NotesList({ notes, loaded, onOpen, onCreate, onDelete }: NotesListProps) {
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState<string | null>(null);
  const folders = noteFolders(notes);
  const needle = query.trim().toLowerCase();
  const inFolder = folder === null ? notes : notes.filter((note) => (note.folder ?? '') === folder);
  const shown = needle
    ? inFolder.filter((note) => `${noteTitle(note)} ${notePreview(note)} ${note.text}`.toLowerCase().includes(needle))
    : inFolder;

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
      header={
        notes.length > 0 ? (
          <div className={styles.header}>
            <SearchField value={query} onChange={setQuery} placeholder="Search notes" />
            {folders.length > 0 && (
              <div className={styles.folders} role="radiogroup" aria-label="Folder">
                {[null, ...folders].map((name) => (
                  <Pressable
                    key={name ?? 'all'}
                    role="radio"
                    aria-checked={folder === name}
                    className={`${styles.folder} ${folder === name ? styles.folderOn : ''}`}
                    onClick={() => setFolder(name)}
                  >
                    {name ?? 'All'}
                  </Pressable>
                ))}
              </div>
            )}
          </div>
        ) : undefined
      }
    >
      {!loaded ? (
        <EmptyState kind="loading" title="Opening" />
      ) : notes.length === 0 ? (
        <EmptyState
          icon={NotesIcon}
          title="Nothing yet"
          message="Your notes and lists live here, on this phone."
          action={{ label: 'Write a note', onPress: () => onCreate('text') }}
        />
      ) : shown.length === 0 ? (
        <EmptyState title="No match" message={needle ? `Nothing contains "${query.trim()}".` : 'This folder is empty.'} />
      ) : (
        <div className={styles.list}>
          {shown.map((note) => (
            <ContextMenu
              key={note.id}
              items={[
                {
                  label: note.pinned ? 'Unpin' : 'Pin to top',
                  icon: PinIcon,
                  onSelect: () => void runAction('notes.pin', { id: note.id, pinned: !note.pinned }),
                },
                { label: 'Delete', icon: TrashIcon, destructive: true, onSelect: () => onDelete(note) },
              ]}
            >
              <SwipeToDelete onDelete={() => onDelete(note)}>
                <motion.div role="button" tabIndex={0} className={styles.card} onClick={() => onOpen(note.id)} {...pressState}>
                  <span className={styles.cardTitle}>
                    {note.pinned && (
                      <span className={styles.pin} aria-label="Pinned">
                        <PinIcon />
                      </span>
                    )}
                    {noteTitle(note).replace(/^#+\s*/, '')}
                  </span>
                  <span className={styles.cardMeta}>
                    <span className="label">
                      {note.folder ? `${note.folder} · ` : ''}
                      {dateFormat.format(note.updatedAt)}
                    </span>
                    <span className={styles.cardPreview}>{notePreview(note)}</span>
                  </span>
                </motion.div>
              </SwipeToDelete>
            </ContextMenu>
          ))}
        </div>
      )}
    </AppShell>
  );
}

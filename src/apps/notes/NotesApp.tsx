import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Pressable } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { SPRING } from '../../theme/tokens';
import { NoteEditor } from './NoteEditor';
import { NotesList } from './NotesList';
import { isEmpty, useNotes, type Note } from './notesStore';
import styles from './Notes.module.css';

/** Notes saved on the device. Shows the list, or one note being edited. */
export function NotesApp() {
  const { notes, loaded } = useNotes();
  const [openId, setOpenId] = useState<string | null>(null);
  const openNote = notes.find((note) => note.id === openId);
  // The note just deleted, kept for a few seconds so "Undo" can bring it back
  const [deleted, setDeleted] = useState<Note | null>(null);

  useEffect(() => {
    if (!deleted) return;
    const timer = window.setTimeout(() => setDeleted(null), 5000);
    return () => window.clearTimeout(timer);
  }, [deleted]);

  const create = (kind: Note['kind']) => void runAction('notes.create', { kind, onCreated: setOpenId });

  const remove = (note: Note) => {
    void runAction('notes.delete', { id: note.id });
    if (!isEmpty(note)) setDeleted(note);
  };

  const close = () => {
    // A note you never wrote anything in is thrown away.
    if (openNote && isEmpty(openNote)) void runAction('notes.delete', { id: openNote.id });
    setOpenId(null);
  };

  return (
    <>
      {openNote ? (
        <NoteEditor
          note={openNote}
          folders={[...new Set(notes.map((note) => note.folder ?? '').filter(Boolean))]}
          onBack={close}
          onDelete={() => {
            remove(openNote);
            setOpenId(null);
          }}
        />
      ) : (
        <NotesList notes={notes} loaded={loaded} onOpen={setOpenId} onCreate={create} onDelete={remove} />
      )}

      {/* Undo, for five seconds after a delete */}
      <AnimatePresence>
        {deleted && (
          <motion.div
            className={styles.undo}
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={SPRING.ui}
          >
            <span>Note deleted</span>
            <Pressable
              className={`label ${styles.undoButton}`}
              onClick={() => {
                void runAction('notes.restore', { note: deleted });
                setDeleted(null);
              }}
            >
              Undo
            </Pressable>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

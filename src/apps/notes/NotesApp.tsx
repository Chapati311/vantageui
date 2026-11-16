import { useState } from 'react';
import { NoteEditor } from './NoteEditor';
import { NotesList } from './NotesList';
import { createNote, deleteNote, isEmpty, useNotes, type Note } from './notesStore';

/** Notes saved on the device. Shows the list, or one note being edited. */
export function NotesApp() {
  const { notes, loaded } = useNotes();
  const [openId, setOpenId] = useState<string | null>(null);
  const openNote = notes.find((note) => note.id === openId);

  const create = (kind: Note['kind']) => setOpenId(createNote(kind).id);

  const close = () => {
    // A note you never wrote anything in is thrown away.
    if (openNote && isEmpty(openNote)) deleteNote(openNote.id);
    setOpenId(null);
  };

  if (openNote) {
    return (
      <NoteEditor
        note={openNote}
        onBack={close}
        onDelete={() => {
          deleteNote(openNote.id);
          setOpenId(null);
        }}
      />
    );
  }

  return <NotesList notes={notes} loaded={loaded} onOpen={setOpenId} onCreate={create} />;
}

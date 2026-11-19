import { CircleButton } from '../../components/CircleButton';
import { BackIcon, CheckIcon, ChecklistIcon, EyeIcon, GridIcon, PinIcon, TextIcon, TrashIcon } from '../../components/glyphs';
import { useEffect, useState } from 'react';
import { AppShell, Button, Row, Section, Sheet } from '../../components/kit';
import { runAction } from '../../system/actions';
import { Checklist } from './Checklist';
import { Markdown } from './Markdown';
import { updateNote, type Note } from './notesStore';
import styles from './Notes.module.css';

interface NoteEditorProps {
  note: Note;
  /** Folder names already in use */
  folders: string[];
  onBack: () => void;
  onDelete: () => void;
}

const savedFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * One note, written in a big editorial serif. Saved as you type. The eye
 * shows it formatted (# headings, **bold**, - lists, [ ] to-dos); the pin
 * keeps it at the top; the folder button files it away.
 */
export function NoteEditor({ note, folders, onBack, onDelete }: NoteEditorProps) {
  // Delete asks for a second tap; the question goes away by itself after 3 seconds
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState(false);
  const [folderSheet, setFolderSheet] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  const move = (folder: string) => {
    void runAction('notes.move', { id: note.id, folder });
    setFolderSheet(false);
    setNewFolder('');
  };

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
          {note.kind === 'text' && (
            <CircleButton small label={preview ? 'Edit' : 'Show formatted'} primary={preview} onClick={() => setPreview((value) => !value)}>
              <EyeIcon />
            </CircleButton>
          )}
          <CircleButton
            small
            label={note.pinned ? 'Unpin' : 'Pin to top'}
            onClick={() => void runAction('notes.pin', { id: note.id, pinned: !note.pinned })}
          >
            <PinIcon />
          </CircleButton>
          <CircleButton small label="Move to a folder" onClick={() => setFolderSheet(true)}>
            <GridIcon />
          </CircleButton>
          <CircleButton
            small
            label={note.kind === 'text' ? 'Turn into a checklist' : 'Turn into plain text'}
            onClick={() => void runAction('notes.convert', { id: note.id })}
          >
            {note.kind === 'text' ? <ChecklistIcon /> : <TextIcon />}
          </CircleButton>
          <CircleButton
            small
            label={confirming ? 'Tap again to delete' : 'Delete note'}
            onClick={() => (confirming ? onDelete() : setConfirming(true))}
          >
            {confirming ? <CheckIcon /> : <TrashIcon />}
          </CircleButton>
        </>
      }
    >
      <span className={`label ${styles.saved}`}>
        {note.folder ? `${note.folder} · ` : ''}
        {savedFormat.format(note.updatedAt)}
      </span>
      {note.kind === 'text' ? (
        preview ? (
          <div className={styles.previewArea} onClick={() => setPreview(false)}>
            <Markdown text={note.text} />
          </div>
        ) : (
          <textarea
            className={styles.text}
            placeholder="Start writing"
            aria-label="Note text"
            value={note.text}
            autoFocus={!note.text}
            onChange={(event) => updateNote(note.id, { text: event.target.value })}
          />
        )
      ) : (
        <Checklist note={note} />
      )}

      <Sheet open={folderSheet} onClose={() => setFolderSheet(false)} title="Folder">
        <Section>
          <Row title="No folder" value={!note.folder ? 'Here' : undefined} onPress={() => move('')} />
          {folders.map((folder) => (
            <Row key={folder} title={folder} value={note.folder === folder ? 'Here' : undefined} onPress={() => move(folder)} />
          ))}
        </Section>
        <div className={styles.newFolder}>
          <input
            className={styles.folderInput}
            placeholder="New folder"
            aria-label="New folder name"
            value={newFolder}
            maxLength={24}
            onChange={(event) => setNewFolder(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && newFolder.trim()) move(newFolder);
            }}
          />
          <Button kind="primary" disabled={!newFolder.trim()} onPress={() => move(newFolder)}>
            Add
          </Button>
        </div>
      </Sheet>
    </AppShell>
  );
}

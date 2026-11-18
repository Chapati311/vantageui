import { useEffect, useRef, useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { BackIcon, PlusIcon, ShareIcon, TrashIcon } from '../../components/glyphs';
import { AppShell, EmptyState, Row, SearchField, Section, SwipeToDelete } from '../../components/kit';
import { addFiles, deleteFile, fileSize, shareFile, useFiles, type StoredFile } from '../../system/files';
import styles from './Files.module.css';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/** Files kept inside Vantage: import, preview, share and delete. */
export function FilesApp() {
  const { files, loaded } = useFiles();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<StoredFile | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const shown = files.filter((file) => file.name.toLowerCase().includes(query.trim().toLowerCase()));

  if (open) return <Preview file={open} onBack={() => setOpen(null)} />;

  return (
    <AppShell
      title="Files"
      trailing={
        <CircleButton small label="Import files" onClick={() => input.current?.click()}>
          <PlusIcon />
        </CircleButton>
      }
      header={files.length > 0 ? <SearchField value={query} onChange={setQuery} placeholder="Search files" /> : undefined}
    >
      <input
        ref={input}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files?.length) void addFiles(event.target.files, 'file');
          event.target.value = '';
        }}
      />
      {loaded && files.length === 0 ? (
        <EmptyState
          title="No files"
          message="Import documents from iCloud or the iPhone. Photos you take with the Vantage camera land here too. The phone's own Files: available after unlock."
          action={{ label: 'Import', onPress: () => input.current?.click() }}
        />
      ) : (
        <Section label={`${shown.length} file${shown.length === 1 ? '' : 's'}`} note="Swipe left to delete.">
          {shown.map((file) => (
            <SwipeToDelete key={file.id} onDelete={() => void deleteFile(file.id)}>
              <Row title={file.name} detail={`${dateFormat.format(file.addedAt)} · ${fileSize(file.size)}`} value={file.kind === 'photo' ? 'Photo' : file.type.split('/')[1]?.toUpperCase().slice(0, 4)} onPress={() => setOpen(file)} />
            </SwipeToDelete>
          ))}
        </Section>
      )}
    </AppShell>
  );
}

function Preview({ file, onBack }: { file: StoredFile; onBack: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file.blob);
    setUrl(objectUrl);
    if (file.type.startsWith('text/') || /\.(txt|md|csv|json)$/i.test(file.name)) void file.blob.text().then((value) => setText(value.slice(0, 20_000)));
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <AppShell
      title={file.name}
      fixed
      leading={
        <CircleButton small label="Back" onClick={onBack}>
          <BackIcon />
        </CircleButton>
      }
      trailing={
        <>
          <CircleButton small label="Share or save" onClick={() => void shareFile(file)}>
            <ShareIcon />
          </CircleButton>
          <CircleButton
            small
            label="Delete"
            onClick={() => {
              void deleteFile(file.id);
              onBack();
            }}
          >
            <TrashIcon />
          </CircleButton>
        </>
      }
    >
      <div className={styles.preview}>
        {url && file.type.startsWith('image/') ? (
          <img src={url} alt={file.name} className={styles.image} />
        ) : url && file.type.startsWith('audio/') ? (
          <audio src={url} controls className={styles.audio} />
        ) : url && file.type.startsWith('video/') ? (
          <video src={url} controls playsInline className={styles.image} />
        ) : url && file.type === 'application/pdf' ? (
          <iframe src={url} title={file.name} className={styles.frame} />
        ) : text !== null ? (
          <pre className={styles.text}>{text}</pre>
        ) : (
          <EmptyState title="No preview" message="Use Share to open it in another app." />
        )}
      </div>
    </AppShell>
  );
}

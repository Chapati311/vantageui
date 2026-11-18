import { useEffect, useRef, useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { BackIcon, PlusIcon, ShareIcon, TrashIcon } from '../../components/glyphs';
import { AppShell, EmptyState } from '../../components/kit';
import { addFiles, deleteFile, shareFile, useFiles, type StoredFile } from '../../system/files';
import styles from './Photos.module.css';

function Thumb({ file, onOpen }: { file: StoredFile; onOpen: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return <button type="button" className={styles.thumb} style={url ? { backgroundImage: `url(${url})` } : undefined} onClick={onOpen} aria-label={file.name} />;
}

/**
 * Photos: the pictures taken with the Vantage camera and the ones you add.
 * The whole iPhone photo library needs the native bridge.
 */
export function PhotosApp() {
  const { files, loaded } = useFiles();
  const photos = files.filter((file) => file.kind === 'photo');
  const [open, setOpen] = useState<StoredFile | null>(null);
  const input = useRef<HTMLInputElement>(null);

  if (open) return <Viewer photo={open} onBack={() => setOpen(null)} />;

  return (
    <AppShell
      title="Photos"
      trailing={
        <CircleButton small label="Add photos" onClick={() => input.current?.click()}>
          <PlusIcon />
        </CircleButton>
      }
    >
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files?.length) void addFiles(event.target.files, 'photo');
          event.target.value = '';
        }}
      />
      {loaded && photos.length === 0 ? (
        <EmptyState
          title="No photos"
          message="Take one with Camera, or add some from your library. The full iPhone library: available after unlock."
          action={{ label: 'Add photos', onPress: () => input.current?.click() }}
        />
      ) : (
        <div className={styles.grid}>
          {photos.map((photo) => (
            <Thumb key={photo.id} file={photo} onOpen={() => setOpen(photo)} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Viewer({ photo, onBack }: { photo: StoredFile; onBack: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(photo.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);
  return (
    <AppShell
      fixed
      leading={
        <CircleButton small label="Back" onClick={onBack}>
          <BackIcon />
        </CircleButton>
      }
      trailing={
        <>
          <CircleButton small label="Share or save to the iPhone" onClick={() => void shareFile(photo)}>
            <ShareIcon />
          </CircleButton>
          <CircleButton
            small
            label="Delete"
            onClick={() => {
              void deleteFile(photo.id);
              onBack();
            }}
          >
            <TrashIcon />
          </CircleButton>
        </>
      }
    >
      <div className={styles.viewer}>{url && <img src={url} alt={photo.name} className={styles.image} />}</div>
    </AppShell>
  );
}

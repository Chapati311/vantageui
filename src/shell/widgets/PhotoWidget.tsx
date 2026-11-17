import { useEffect, useRef, useState } from 'react';
import { dbGet, dbPut } from '../../system/db';
import { PictureIcon } from '../../apps/customise/icons';
import styles from './PhotoWidget.module.css';

const PHOTO_ID = 'photo-widget';

interface StoredFile {
  id: string;
  blob: Blob;
}

/** Shrinks a photo so it stays small in storage (the widget is never bigger than this). */
async function shrink(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.85));
}

/**
 * A photo frame. Tap it to choose a photo (from the photo library or the
 * camera); it is saved on the phone. Tap again to pick another.
 */
export function PhotoWidget() {
  const [url, setUrl] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let current: string | null = null;
    void dbGet<StoredFile>('files', PHOTO_ID)
      .then((file) => {
        if (!file) return;
        current = URL.createObjectURL(file.blob);
        setUrl(current);
      })
      .catch(() => undefined);
    return () => {
      if (current) URL.revokeObjectURL(current);
    };
  }, []);

  const choose = async (file: File) => {
    const blob = await shrink(file).catch(() => file);
    await dbPut<StoredFile>('files', { id: PHOTO_ID, blob }).catch(() => undefined);
    setUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(blob);
    });
  };

  return (
    <button type="button" className={styles.photo} onClick={() => input.current?.click()} aria-label={url ? 'Photo. Tap to change' : 'Choose a photo'}>
      {url ? (
        <img className={styles.image} src={url} alt="" />
      ) : (
        <span className={styles.empty}>
          <PictureIcon />
          <span className="label">Choose a photo</span>
        </span>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void choose(file);
        }}
      />
    </button>
  );
}

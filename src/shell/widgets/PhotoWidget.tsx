import { useEffect, useRef, useState } from 'react';
import { EditIcon } from '../../components/glyphs';
import { dbGet, dbPut } from '../../system/db';
import { useWidgetEdit } from '../home/widgetEdit';
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

/** The built-in picture: dusk over layered hills, drawn in code (no file needed). */
function DefaultPicture() {
  return (
    <svg className={styles.image} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="photo-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2a41" />
          <stop offset="0.55" stopColor="#3d5a73" />
          <stop offset="1" stopColor="#d99a6c" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#photo-sky)" />
      <circle cx="68" cy="56" r="9" fill="#f2c79a" />
      <path d="M0 62 Q18 48 36 60 T72 56 T100 60 V100 H0Z" fill="#33506a" />
      <path d="M0 74 Q22 60 44 72 T84 68 T100 72 V100 H0Z" fill="#223a50" />
      <path d="M0 86 Q26 74 52 84 T100 82 V100 H0Z" fill="#111f2c" />
    </svg>
  );
}

/**
 * A photo frame: a built-in dusk picture until you choose your own (hold
 * the widget > Edit). A tap opens Photos.
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

  useWidgetEdit(() => input.current?.click());

  const choose = async (file: File) => {
    const blob = await shrink(file).catch(() => file);
    await dbPut<StoredFile>('files', { id: PHOTO_ID, blob }).catch(() => undefined);
    setUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(blob);
    });
  };

  return (
    <div className={styles.photo} role="img" aria-label={url ? 'Your photo' : 'Dusk over hills'}>
      {url ? <img className={styles.image} src={url} alt="" /> : <DefaultPicture />}
      {/* A quiet hint that this can be your own photo */}
      <span className={styles.hint} aria-hidden="true">
        <EditIcon />
      </span>
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
    </div>
  );
}

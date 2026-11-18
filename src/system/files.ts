import { useSyncExternalStore } from 'react';
import { dbDelete, dbGetAll, dbPut } from './db';

/**
 * Your files inside Vantage (documents, photos taken with the Vantage
 * camera, anything you import). Kept in IndexedDB on this phone.
 * The iPhone's own Files and photo library need the native bridge.
 */

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: number;
  /** 'photo' (taken with the camera or picked as a photo) or 'file' */
  kind: 'photo' | 'file';
  blob: Blob;
}

interface FileState {
  files: StoredFile[];
  loaded: boolean;
}

let state: FileState = { files: [], loaded: false };
const listeners = new Set<() => void>();

function update(files: StoredFile[]): void {
  state = { files: [...files].sort((a, b) => b.addedAt - a.addedAt), loaded: true };
  listeners.forEach((listener) => listener());
}

async function load(): Promise<void> {
  try {
    // The "files" store also holds a few system things (wallpaper photo, ...): only take real files
    const all = await dbGetAll<StoredFile & { kind?: string }>('files');
    update(all.filter((item) => item.kind === 'photo' || item.kind === 'file'));
  } catch {
    update([]);
  }
}

export async function addFiles(list: FileList | File[], kind: 'photo' | 'file'): Promise<number> {
  let added = 0;
  for (const file of Array.from(list)) {
    const item: StoredFile = {
      id: `file-${Date.now().toString(36)}-${added}`,
      name: file.name || (kind === 'photo' ? 'Photo' : 'File'),
      type: file.type || 'application/octet-stream',
      size: file.size,
      addedAt: Date.now() + added,
      kind,
      blob: file,
    };
    await dbPut('files', item);
    update([...state.files, item]);
    added += 1;
  }
  return added;
}

export async function addPhoto(blob: Blob, name: string): Promise<void> {
  const item: StoredFile = { id: `photo-${Date.now().toString(36)}`, name, type: blob.type || 'image/jpeg', size: blob.size, addedAt: Date.now(), kind: 'photo', blob };
  await dbPut('files', item);
  update([...state.files, item]);
}

export async function deleteFile(id: string): Promise<void> {
  update(state.files.filter((item) => item.id !== id));
  await dbDelete('files', id);
}

export async function renameFile(id: string, name: string): Promise<void> {
  const file = state.files.find((item) => item.id === id);
  if (!file || !name.trim()) return;
  const renamed = { ...file, name: name.trim() };
  update(state.files.map((item) => (item.id === id ? renamed : item)));
  await dbPut('files', renamed);
}

export function useFiles(): FileState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      if (!state.loaded) void load();
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

/** Saves a file to the iPhone (share sheet on iOS, download elsewhere). */
export async function shareFile(file: StoredFile): Promise<void> {
  const real = new File([file.blob], file.name, { type: file.type });
  if (navigator.canShare?.({ files: [real] })) {
    await navigator.share({ files: [real] }).catch(() => undefined);
    return;
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file.blob);
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

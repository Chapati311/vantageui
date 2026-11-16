/**
 * A tiny wrapper around IndexedDB, the browser's on-device database.
 * Use it for app data that is too big for localStorage (notes, ...).
 */

const DB_NAME = 'vantage';
const DB_VERSION = 1;

/** Every "table" in the database. Add a name here AND raise DB_VERSION to add one. */
const STORES = ['notes'] as const;
export type StoreName = (typeof STORES)[number];

let opening: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    // Runs the first time, and whenever DB_VERSION goes up.
    request.onupgradeneeded = () => {
      for (const name of STORES) {
        if (!request.result.objectStoreNames.contains(name)) {
          request.result.createObjectStore(name, { keyPath: 'id' });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return opening;
}

/** Runs one database request and waits for its answer. */
async function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  action: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(store, mode).objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Everything saved in a store. */
export function dbGetAll<T>(store: StoreName): Promise<T[]> {
  return run<T[]>(store, 'readonly', (objectStore) => objectStore.getAll());
}

/** Saves an item (adds it, or replaces the one with the same id). */
export async function dbPut<T extends { id: string }>(store: StoreName, item: T): Promise<void> {
  await run(store, 'readwrite', (objectStore) => objectStore.put(item));
}

export async function dbDelete(store: StoreName, id: string): Promise<void> {
  await run(store, 'readwrite', (objectStore) => objectStore.delete(id));
}

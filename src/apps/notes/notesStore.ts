import { useSyncExternalStore } from 'react';
import { dbDelete, dbGetAll, dbPut } from '../../system/db';

/**
 * All notes, kept in memory for speed and saved to IndexedDB on the device.
 * The Notes app and the home screen notes widget both read from here.
 */

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  /** A plain text note, or a to-do checklist */
  kind: 'text' | 'checklist';
  /** Used when kind is 'text' */
  text: string;
  /** Used when kind is 'checklist' */
  items: ChecklistItem[];
  createdAt: number;
  updatedAt: number;
}

export interface NotesState {
  /** Newest first */
  notes: Note[];
  /** false until the notes have been read from the device */
  loaded: boolean;
}

/** Wait this long after the last keystroke before writing to the database. */
const SAVE_DELAY_MS = 300;

export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

let state: NotesState = { notes: [], loaded: false };
let loading = false;
const listeners = new Set<() => void>();
/** Notes that changed and are waiting to be written: id -> timer */
const pendingSaves = new Map<string, number>();

function setNotes(notes: Note[]): void {
  state = { notes: [...notes].sort((a, b) => b.updatedAt - a.updatedAt), loaded: true };
  listeners.forEach((notify) => notify());
}

function load(): void {
  if (loading || state.loaded) return;
  loading = true;
  dbGetAll<Note>('notes')
    .then(setNotes)
    .catch(() => setNotes([])); // no database (e.g. private mode): notes work until reload
}

function saveNow(id: string): void {
  window.clearTimeout(pendingSaves.get(id));
  pendingSaves.delete(id);
  const note = state.notes.find((n) => n.id === id);
  if (note) dbPut('notes', note).catch(() => {});
}

function saveSoon(id: string): void {
  window.clearTimeout(pendingSaves.get(id));
  pendingSaves.set(id, window.setTimeout(() => saveNow(id), SAVE_DELAY_MS));
}

// Don't lose the last keystrokes when the app is closed or the phone locks.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') [...pendingSaves.keys()].forEach(saveNow);
});

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  load();
  return () => listeners.delete(listener);
}

export function useNotes(): NotesState {
  return useSyncExternalStore(subscribe, () => state);
}

export function createNote(kind: Note['kind']): Note {
  const now = Date.now();
  const note: Note = { id: newId(), kind, text: '', items: [], createdAt: now, updatedAt: now };
  setNotes([note, ...state.notes]);
  saveSoon(note.id);
  return note;
}

export function updateNote(id: string, patch: Partial<Pick<Note, 'kind' | 'text' | 'items'>>): void {
  setNotes(
    state.notes.map((note) => (note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note)),
  );
  saveSoon(id);
}

export function deleteNote(id: string): void {
  window.clearTimeout(pendingSaves.get(id));
  pendingSaves.delete(id);
  setNotes(state.notes.filter((note) => note.id !== id));
  dbDelete('notes', id).catch(() => {});
}

/** Switches a note between text and checklist, keeping what was written. */
export function convertNote(note: Note): void {
  if (note.kind === 'text') {
    const items = note.text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text) => ({ id: newId(), text, done: false }));
    updateNote(note.id, { kind: 'checklist', items, text: '' });
  } else {
    updateNote(note.id, { kind: 'text', text: note.items.map((item) => item.text).join('\n'), items: [] });
  }
}

// ---- Small helpers for showing notes ---------------------------------------

export function isEmpty(note: Note): boolean {
  return note.kind === 'text' ? note.text.trim() === '' : note.items.length === 0;
}

/** The first line, used as the note's title in lists. */
export function noteTitle(note: Note): string {
  const first =
    note.kind === 'text'
      ? note.text.split('\n').find((line) => line.trim())
      : note.items[0]?.text;
  return first?.trim() || (note.kind === 'text' ? 'New note' : 'New list');
}

/** A short second line: the rest of the text, or "2 of 5 done". */
export function notePreview(note: Note): string {
  if (note.kind === 'checklist') {
    const done = note.items.filter((item) => item.done).length;
    return `${done} of ${note.items.length} done`;
  }
  const lines = note.text.split('\n').filter((line) => line.trim());
  return lines.slice(1).join(' ').trim();
}

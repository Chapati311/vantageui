import { useSyncExternalStore } from 'react';
import { dbDelete, dbGetAll, dbPut } from './db';

/**
 * Vantage's own contacts (saved on the phone). The iPhone's address book
 * is private to native apps, so it needs the bridge; until then you add the
 * people you call most here (Phone app > Contacts).
 */

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  favorite: boolean;
}

interface ContactState {
  contacts: Contact[];
  loaded: boolean;
}

let state: ContactState = { contacts: [], loaded: false };
const listeners = new Set<() => void>();

function update(contacts: Contact[]): void {
  state = { contacts: [...contacts].sort((a, b) => a.name.localeCompare(b.name)), loaded: true };
  listeners.forEach((listener) => listener());
}

async function load(): Promise<void> {
  try {
    update(await dbGetAll<Contact>('contacts'));
  } catch {
    update([]);
  }
}

export async function saveContact(contact: Omit<Contact, 'id'> & { id?: string }): Promise<Contact> {
  const saved: Contact = { ...contact, id: contact.id ?? `contact-${Date.now().toString(36)}` };
  update([...state.contacts.filter((item) => item.id !== saved.id), saved]);
  await dbPut('contacts', saved);
  return saved;
}

export async function deleteContact(id: string): Promise<void> {
  update(state.contacts.filter((item) => item.id !== id));
  await dbDelete('contacts', id);
}

export function useContacts(): ContactState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      if (!state.loaded) void load();
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

/** "Anna Meier" -> "AM" */
export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

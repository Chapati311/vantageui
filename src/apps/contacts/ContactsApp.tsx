import { useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { PlusIcon } from '../../components/glyphs';
import { AppShell } from '../../components/kit';
import type { Contact } from '../../system/contacts';
import { ContactEditor } from './ContactEditor';
import { ContactList } from './ContactList';

/** Contacts: the people Vantage knows. Tap to edit; star favorites for the widget. */
export function ContactsApp() {
  const [editing, setEditing] = useState<Partial<Contact> | null>(null);
  return (
    <AppShell
      title="Contacts"
      trailing={
        <CircleButton small label="New contact" onClick={() => setEditing({})}>
          <PlusIcon />
        </CircleButton>
      }
    >
      <ContactList onPick={setEditing} onAdd={() => setEditing({})} />
      <ContactEditor contact={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

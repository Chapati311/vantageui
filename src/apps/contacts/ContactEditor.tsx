import { useEffect, useState } from 'react';
import { Button, Row, Sheet, Toggle } from '../../components/kit';
import { deleteContact, saveContact, type Contact } from '../../system/contacts';
import styles from './Contacts.module.css';

/** Add or change a contact: name, number, email, favorite. */
export function ContactEditor({ contact, onClose }: { contact: Partial<Contact> | null; onClose: () => void }) {
  const [draft, setDraft] = useState<Partial<Contact>>({});
  useEffect(() => setDraft(contact ?? {}), [contact]);
  const valid = Boolean(draft.name?.trim() && (draft.phone?.trim() || draft.email?.trim()));

  return (
    <Sheet
      open={contact !== null}
      onClose={onClose}
      title={contact?.id ? 'Contact' : 'New contact'}
      action={
        <Button
          kind="primary"
          disabled={!valid}
          onPress={() => {
            void saveContact({
              id: draft.id,
              name: draft.name!.trim(),
              phone: draft.phone?.trim() ?? '',
              email: draft.email?.trim() || undefined,
              favorite: draft.favorite ?? false,
            });
            onClose();
          }}
        >
          Save
        </Button>
      }
    >
      <input className={styles.input} placeholder="Name" aria-label="Name" value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      <input className={styles.input} placeholder="Phone number" aria-label="Phone number" type="tel" inputMode="tel" value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
      <input className={styles.input} placeholder="Email" aria-label="Email" type="email" inputMode="email" autoCapitalize="off" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
      <Row title="Favorite" detail="Shown first, and in the Favorites widget" trailing={<Toggle label="Favorite" on={draft.favorite ?? false} onChange={(favorite) => setDraft({ ...draft, favorite })} />} />
      {contact?.id && (
        <Button
          kind="destructive"
          onPress={() => {
            void deleteContact(contact.id!);
            onClose();
          }}
        >
          Delete contact
        </Button>
      )}
    </Sheet>
  );
}

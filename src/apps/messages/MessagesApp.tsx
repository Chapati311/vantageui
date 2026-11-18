import { useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { BackIcon } from '../../components/glyphs';
import { AppShell, Button } from '../../components/kit';
import type { Contact } from '../../system/contacts';
import { message } from '../../system/nativeBridge';
import { ContactEditor } from '../contacts/ContactEditor';
import { ContactList } from '../contacts/ContactList';
import styles from '../contacts/Contacts.module.css';

/**
 * Messages: pick someone, write, and Vantage hands it to the iPhone's
 * Messages app to send. Your message threads: available after unlock.
 */
export function MessagesApp() {
  const [to, setTo] = useState<Contact | null>(null);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<Partial<Contact> | null>(null);

  if (to) {
    return (
      <AppShell
        title={to.name}
        fixed
        leading={
          <CircleButton small label="Back" onClick={() => setTo(null)}>
            <BackIcon />
          </CircleButton>
        }
      >
        <textarea className={styles.textarea} placeholder="Message" aria-label="Message" value={text} autoFocus onChange={(e) => setText(e.target.value)} />
        <p className={styles.note}>Send opens Messages with this text ready. Your conversations: available after unlock.</p>
        <Button
          kind="primary"
          wide
          disabled={!text.trim()}
          onPress={() => {
            message(to.phone, text.trim());
            setText('');
          }}
        >
          Send
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell title="Messages">
      <ContactList action="Write" onPick={(contact) => contact.phone && setTo(contact)} onAdd={() => setEditing({})} />
      <ContactEditor contact={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

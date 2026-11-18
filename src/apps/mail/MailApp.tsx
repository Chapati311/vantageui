import { useState } from 'react';
import { AppShell, Button, Row, Section } from '../../components/kit';
import { useContacts } from '../../system/contacts';
import { email } from '../../system/nativeBridge';
import styles from '../contacts/Contacts.module.css';

const DRAFT_KEY = 'vantage.mailDraft.v1';

function loadDraft(): { to: string; subject: string; body: string } {
  try {
    return { to: '', subject: '', body: '', ...JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}') };
  } catch {
    return { to: '', subject: '', body: '' };
  }
}

/**
 * Mail: write an email here (the draft is kept while you write), then Send
 * hands it to the iPhone's Mail app. Your inbox: available after unlock.
 */
export function MailApp() {
  const [draft, setDraft] = useState(loadDraft);
  const { contacts } = useContacts();
  const withEmail = contacts.filter((contact) => contact.email);

  const change = (patch: Partial<typeof draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    } catch {
      // Kept until reload.
    }
  };

  return (
    <AppShell title="Mail">
      <input className={styles.input} placeholder="To" aria-label="To" type="email" inputMode="email" autoCapitalize="off" value={draft.to} onChange={(e) => change({ to: e.target.value })} />
      {withEmail.length > 0 && !draft.to && (
        <Section label="People">
          {withEmail.slice(0, 4).map((contact) => (
            <Row key={contact.id} title={contact.name} detail={contact.email} onPress={() => change({ to: contact.email! })} />
          ))}
        </Section>
      )}
      <input className={styles.input} placeholder="Subject" aria-label="Subject" value={draft.subject} onChange={(e) => change({ subject: e.target.value })} />
      <textarea className={styles.textarea} placeholder="Write your email" aria-label="Email text" value={draft.body} onChange={(e) => change({ body: e.target.value })} />
      <p className={styles.note}>Send opens Mail with this email ready. Your inbox: available after unlock.</p>
      <Button
        kind="primary"
        wide
        disabled={!draft.to.trim()}
        onPress={() => {
          email(draft.to.trim(), draft.subject, draft.body);
          change({ to: '', subject: '', body: '' });
        }}
      >
        Send
      </Button>
    </AppShell>
  );
}

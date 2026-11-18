import { useState } from 'react';
import { EmptyState, Row, SearchField, Section } from '../../components/kit';
import { initials, useContacts, type Contact } from '../../system/contacts';
import styles from './Contacts.module.css';

interface ContactListProps {
  /** What a tap on a person does (call, message, edit, ...) */
  onPick: (contact: Contact) => void;
  /** A short word on the right of each row, e.g. "Call" */
  action?: string;
  onAdd: () => void;
}

/** Everyone in Vantage's contacts, favorites first, with search. */
export function ContactList({ onPick, action, onAdd }: ContactListProps) {
  const { contacts, loaded } = useContacts();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const shown = contacts.filter((contact) => `${contact.name} ${contact.phone} ${contact.email ?? ''}`.toLowerCase().includes(needle));
  const favorites = shown.filter((contact) => contact.favorite);
  const others = shown.filter((contact) => !contact.favorite);

  if (loaded && contacts.length === 0) {
    return (
      <EmptyState
        title="No contacts"
        message="Add the people you call and text most. The iPhone address book: available after unlock."
        action={{ label: 'Add someone', onPress: onAdd }}
      />
    );
  }

  const row = (contact: Contact) => (
    <Row
      key={contact.id}
      icon={<span className={styles.avatar}>{initials(contact.name)}</span>}
      title={contact.name}
      detail={contact.phone || contact.email}
      value={action}
      onPress={() => onPick(contact)}
    />
  );

  return (
    <>
      <SearchField value={query} onChange={setQuery} placeholder="Search people" />
      {favorites.length > 0 && <Section label="Favorites">{favorites.map(row)}</Section>}
      {others.length > 0 && <Section label={favorites.length ? 'Everyone' : undefined}>{others.map(row)}</Section>}
      {shown.length === 0 && <EmptyState title="No match" message={`Nobody called "${query.trim()}".`} />}
    </>
  );
}

import { useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { BackIcon, PlusIcon } from '../../components/glyphs';
import { AppShell, TabBar } from '../../components/kit';
import { Pressable } from '../../components/Pressable';
import { PhoneIcon } from '../../system/appIcons';
import type { Contact } from '../../system/contacts';
import { call } from '../../system/nativeBridge';
import { playSound } from '../../system/sounds';
import { ContactEditor } from '../contacts/ContactEditor';
import { ContactList } from '../contacts/ContactList';
import styles from '../contacts/Contacts.module.css';
import { GridIcon, ListIcon } from '../../components/glyphs';

const KEYS = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
  ['*', ''],
  ['0', '+'],
  ['#', ''],
];

type Tab = 'contacts' | 'keypad';

/**
 * Phone: your contacts (favorites first) and a keypad. Calls go through the
 * real iPhone phone app (tel: link, or the bridge after the jailbreak).
 */
export function PhoneApp() {
  const [tab, setTab] = useState<Tab>('contacts');
  const [number, setNumber] = useState('');
  const [editing, setEditing] = useState<Partial<Contact> | null>(null);

  const press = (key: string) => {
    playSound('tick');
    setNumber((current) => (current + key).slice(0, 20));
  };

  return (
    <AppShell
      title={tab === 'contacts' ? 'Phone' : undefined}
      fixed={tab === 'keypad'}
      trailing={
        tab === 'contacts' ? (
          <CircleButton small label="New contact" onClick={() => setEditing({})}>
            <PlusIcon />
          </CircleButton>
        ) : undefined
      }
      tabBar={
        <TabBar
          tabs={[
            { id: 'contacts', label: 'Contacts', icon: ListIcon },
            { id: 'keypad', label: 'Keypad', icon: GridIcon },
          ]}
          value={tab}
          onChange={setTab}
        />
      }
    >
      {tab === 'contacts' ? (
        <ContactList action="Call" onPick={(contact) => contact.phone && call(contact.phone)} onAdd={() => setEditing({})} />
      ) : (
        <>
          <div className={styles.keypadNumber} aria-live="polite">
            {number || ' '}
          </div>
          <div className={styles.keypad}>
            {KEYS.map(([digit, letters]) => (
              <Pressable
                key={digit}
                className={styles.key}
                aria-label={digit}
                onClick={() => press(digit)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  if (digit === '0') press('+');
                }}
              >
                {digit}
                {letters && <span className={styles.keyLetters}>{letters}</span>}
              </Pressable>
            ))}
          </div>
          <div className={styles.callRow}>
            <span style={{ width: 'var(--grid-cell)' }} />
            <Pressable className={styles.call} aria-label="Call" disabled={!number} onClick={() => call(number)}>
              <PhoneIcon />
            </Pressable>
            <CircleButton label="Delete digit" disabled={!number} onClick={() => setNumber(number.slice(0, -1))}>
              <BackIcon />
            </CircleButton>
          </div>
        </>
      )}
      <ContactEditor contact={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

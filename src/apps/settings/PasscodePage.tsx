import { useState } from 'react';
import { Button, Row, Section as KitSection } from '../../components/kit';
import { runAction } from '../../system/actions';
import { PASSCODE_LENGTH, isValidPasscode, useHasPasscode } from '../../system/passcode';
import { Section, SettingsPage } from './SettingsPage';
import styles from './SettingsApp.module.css';

/** Turn the lock screen passcode on, change it, or turn it off. */
export function PasscodePage({ onBack }: { onBack: () => void }) {
  const on = useHasPasscode();
  const [editing, setEditing] = useState(false);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, PASSCODE_LENGTH);

  const save = () => {
    if (!isValidPasscode(first)) return setMessage(`Use exactly ${PASSCODE_LENGTH} digits.`);
    if (first !== second) return setMessage("The two passcodes don't match.");
    void runAction('passcode.set', { code: first });
    setEditing(false);
    setFirst('');
    setSecond('');
    setMessage('Passcode saved.');
  };

  return (
    <SettingsPage title="Passcode" onBack={onBack}>
      <Section
        label="Lock screen"
        note="Asked for after the unlock swipe. It keeps people out of Vantage; your iPhone's own passcode still protects the phone."
      >
        <KitSection>
          <Row title="Passcode" value={on ? 'On' : 'Off'} />
        </KitSection>
      </Section>

      {editing ? (
        <Section label={on ? 'New passcode' : 'Choose a passcode'} note={message ?? undefined}>
          <input
            className={styles.input}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            placeholder={`${PASSCODE_LENGTH} digits`}
            aria-label="New passcode"
            value={first}
            onChange={(event) => setFirst(digitsOnly(event.target.value))}
          />
          <input
            className={styles.input}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="Same again"
            aria-label="Repeat the passcode"
            value={second}
            onChange={(event) => setSecond(digitsOnly(event.target.value))}
          />
          <div className={styles.buttons}>
            <Button onPress={() => setEditing(false)}>Cancel</Button>
            <Button kind="primary" onPress={save} disabled={first.length < PASSCODE_LENGTH || second.length < PASSCODE_LENGTH}>
              Save
            </Button>
          </div>
        </Section>
      ) : (
        <Section label="Change" note={message ?? undefined}>
          <div className={styles.buttons}>
            <Button
              onPress={() => {
                setMessage(null);
                setEditing(true);
              }}
            >
              {on ? 'Change' : 'Turn on'}
            </Button>
            {on && (
              <Button
                kind="destructive"
                onPress={() => {
                  void runAction('passcode.remove', {});
                  setMessage('Passcode turned off.');
                }}
              >
                Turn off
              </Button>
            )}
          </div>
        </Section>
      )}
    </SettingsPage>
  );
}

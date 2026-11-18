import { useRef, useState } from 'react';
import { Button, EmptyState, Row, Section as KitSection } from '../../components/kit';
import { runAction } from '../../system/actions';
import { exportSetup, useSetups } from '../../system/setups';
import { Section, SettingsPage } from '../settings/SettingsPage';
import styles from '../settings/SettingsApp.module.css';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/** Save your whole look by name, switch between looks, export / import them as files. */
export function SetupsPage({ onBack }: { onBack: () => void }) {
  const setups = useSetups();
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <SettingsPage title="Setups" onBack={onBack}>
      <Section label="First-boot setup" note="Walk through name, theme, wallpaper, clock and focus goal again.">
        <div className={styles.buttons}>
          <Button kind="primary" onPress={() => void runAction('setup.replay', {})}>
            Replay setup
          </Button>
        </div>
      </Section>

      <Section label="Save this look" note="Saves the theme, wallpaper, every setting and the home screen layout.">
        <div className={styles.buttons}>
          <input
            className={styles.input}
            placeholder="Name"
            aria-label="Setup name"
            value={name}
            maxLength={32}
            onChange={(event) => setName(event.target.value)}
          />
          <Button
            onPress={() => {
              void runAction('setups.save', { name });
              setMessage(`Saved "${name.trim() || 'My setup'}".`);
              setName('');
            }}
          >
            Save
          </Button>
        </div>
      </Section>

      <Section label="Saved setups" note={setups.length ? 'Tap one to switch to it. Swipe left to delete.' : undefined}>
        {setups.length === 0 ? (
          <EmptyState title="None yet" message="Setups you save show up here." />
        ) : (
          <KitSection>
            {setups.map((setup) => (
              <Row
                key={setup.id}
                title={setup.name}
                value={dateFormat.format(setup.savedAt)}
                onPress={() => void runAction('setups.apply', { id: setup.id })}
                onDelete={() => void runAction('setups.delete', { id: setup.id })}
              />
            ))}
          </KitSection>
        )}
      </Section>

      <Section label="Files" note={message ?? 'Export makes a .json file you can keep or send to someone. Import loads one.'}>
        <div className={styles.buttons}>
          <Button onPress={() => exportSetup()}>Export</Button>
          <Button onPress={() => fileInput.current?.click()}>Import</Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            runAction('setups.import', { file })
              .then(() => setMessage('Setup loaded. Restarting...'))
              .catch((error: Error) => setMessage(error.message));
          }}
        />
      </Section>
    </SettingsPage>
  );
}

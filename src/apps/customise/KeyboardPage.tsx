import { useState } from 'react';
import { Row, Section as KitSection, SegmentedControl, Toggle } from '../../components/kit';
import { runAction } from '../../system/actions';
import { useSettings, type Settings } from '../../system/settingsStore';
import { Section, SettingsPage } from '../settings/SettingsPage';
import styles from './KeyboardPage.module.css';

type Key = 'keyboard' | 'keyboardStyle' | 'keyboardShape' | 'keyboardSound' | 'keyboardNumberRow';
const set = <K extends Key>(key: K, value: Settings[K]) => void runAction('settings.set', { key, value });

/** Customise > Keyboard: the Vantage keyboard's look (try it in the field at the top). */
export function KeyboardPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  const [text, setText] = useState('');
  return (
    <SettingsPage title="Keyboard" onBack={onBack}>
      <Section label="Try it" note={s.keyboard === 'vantage' ? 'Tap the field: the Vantage keyboard comes up in your style. The 🌐 key switches a field to the iOS keyboard (emoji, dictation, languages).' : 'Vantage uses the iOS keyboard.'}>
        <input className={styles.field} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type something…" aria-label="Try the keyboard" autoCapitalize="sentences" />
      </Section>
      <Section label="Keyboard" note="Vantage's keyboard works in Vantage. iOS doesn't let it replace the keyboard inside other apps.">
        <SegmentedControl
          label="Keyboard"
          value={s.keyboard}
          onChange={(v) => set('keyboard', v)}
          options={[
            { id: 'vantage', label: 'Vantage' },
            { id: 'system', label: 'iOS' },
          ]}
        />
      </Section>
      {s.keyboard === 'vantage' && (
        <>
          <Section label="Style" note="Theme: your theme's colours and font. The others keep their look in any theme.">
            <SegmentedControl
              label="Keyboard style"
              value={s.keyboardStyle}
              onChange={(v) => set('keyboardStyle', v)}
              options={[
                { id: 'theme', label: 'Theme' },
                { id: 'glass', label: 'Glass' },
                { id: 'terminal', label: 'Term' },
                { id: 'pixel', label: 'Pixel' },
                { id: 'minimal', label: 'Plain' },
              ]}
            />
          </Section>
          <Section label="Keys">
            <SegmentedControl
              label="Key shape"
              value={s.keyboardShape}
              onChange={(v) => set('keyboardShape', v)}
              options={[
                { id: 'rounded', label: 'Rounded' },
                { id: 'square', label: 'Square' },
                { id: 'circle', label: 'Round' },
              ]}
            />
            <KitSection>
              <Row title="Key sounds" trailing={<Toggle label="Key sounds" on={s.keyboardSound} onChange={(on) => set('keyboardSound', on)} />} />
              <Row title="Number row" detail="Digits above the letters" trailing={<Toggle label="Number row" on={s.keyboardNumberRow} onChange={(on) => set('keyboardNumberRow', on)} />} />
            </KitSection>
          </Section>
        </>
      )}
    </SettingsPage>
  );
}

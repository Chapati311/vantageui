import { useState } from 'react';
import { ChoiceList } from '../../components/ChoiceList';
import { Button, Row, Section as KitSection, SegmentedControl, SwipeToDelete, Toggle } from '../../components/kit';
import { runAction } from '../../system/actions';
import { deleteMode, endMode, saveMode, startMode, useCustomModes } from '../../system/customModes';
import { useSettings, type ModeId } from '../../system/settingsStore';
import { getPreset, presetsIn } from '../../theme/presets';
import { Section, SettingsPage } from './SettingsPage';
import styles from './SettingsApp.module.css';

/** Clean, Focus, Retro, Wind Down, and your own modes (by hand or on a schedule). */
export function ModePage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  const { modes, active } = useCustomModes();
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState<'hand' | 'time'>('hand');
  const [from, setFrom] = useState('08:00');
  const [to, setTo] = useState('16:00');

  return (
    <SettingsPage title="Modes" onBack={onBack}>
      <Section label="Mode">
        <ChoiceList<ModeId>
          label="Mode"
          value={s.mode}
          onChange={(mode) => void runAction('mode.set', { mode })}
          options={[
            { id: 'clean', name: 'Clean', detail: 'Your theme as it is' },
            { id: 'focus', name: 'Focus', detail: 'Grayscale, only Phone, Messages, Music, Notes and Clock, a big clock. Can lock itself.' },
            { id: 'retro', name: 'Retro', detail: `The old-phone experience in ${getPreset(s.retroTheme).name}, with Snake` },
            { id: 'winddown', name: 'Wind Down', detail: 'Warm and dimming, a simple home, distractions locked' },
            { id: 'hacker', name: 'Hacker', detail: `Terminal colours (${getPreset(s.hackerTheme).name}), monospace, code rain, live network widgets and Netrunner` },
          ]}
        />
      </Section>

      {s.mode === 'hacker' && (
        <Section label="Hacker" note="Netrunner (the hacker tools) is on the first home page. The CRT effect is a still overlay: it costs no battery.">
          <ChoiceList<string>
            label="Hacker theme"
            value={s.hackerTheme}
            onChange={(id) => void runAction('theme.apply', { id })}
            options={presetsIn('hacker').map((preset) => ({ id: preset.id, name: preset.name, detail: preset.accentName }))}
          />
          <KitSection>
            <Row title="CRT effect" detail="Faint scanlines and glowing text" trailing={<Toggle label="CRT effect" on={s.crtEffect} onChange={(on) => void runAction('settings.set', { key: 'crtEffect', value: on })} />} />
            <Row title="Access granted" detail="A short animation after unlocking" trailing={<Toggle label="Access granted" on={s.accessGranted} onChange={(on) => void runAction('settings.set', { key: 'accessGranted', value: on })} />} />
          </KitSection>
        </Section>
      )}

      <Section label="Your modes" note={modes.length ? 'Tap to switch on or off. Swipe left to delete.' : 'Save the look you have now as a mode: theme, wallpaper, accent, widget and icon style, font.'}>
        {modes.length > 0 && (
          <KitSection>
            {modes.map((mode) => (
              <SwipeToDelete key={mode.id} onDelete={() => deleteMode(mode.id)}>
                <Row
                  title={mode.name}
                  detail={mode.schedule ? `Every day ${mode.schedule.from}-${mode.schedule.to}` : 'By hand'}
                  value={active?.id === mode.id ? 'On' : undefined}
                  onPress={() => (active?.id === mode.id ? endMode() : startMode(mode.id))}
                />
              </SwipeToDelete>
            ))}
          </KitSection>
        )}
      </Section>

      <Section label="Save this look as a mode">
        <input className={styles.input} placeholder="Name, e.g. School" aria-label="Mode name" value={name} maxLength={24} onChange={(event) => setName(event.target.value)} />
        <SegmentedControl
          label="Switch on"
          value={schedule}
          onChange={setSchedule}
          options={[
            { id: 'hand', label: 'By hand' },
            { id: 'time', label: 'Every day' },
          ]}
        />
        {schedule === 'time' && (
          <div className={styles.buttons}>
            <input className={styles.input} type="time" aria-label="From" value={from} onChange={(event) => setFrom(event.target.value)} />
            <input className={styles.input} type="time" aria-label="To" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
        )}
        <Button
          onPress={() => {
            saveMode(name, schedule === 'time' ? { from, to } : null);
            setName('');
          }}
        >
          Save mode
        </Button>
      </Section>
    </SettingsPage>
  );
}

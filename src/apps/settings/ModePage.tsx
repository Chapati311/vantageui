import { ChoiceList } from '../../components/ChoiceList';
import { runAction } from '../../system/actions';
import { useSettings, type ModeId } from '../../system/settingsStore';
import { getPreset } from '../../theme/presets';
import { Section, SettingsPage } from './SettingsPage';

/** Clean, Focus, Retro or Wind Down. (Their full behaviour comes in Phase 7; this is how they look.) */
export function ModePage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  return (
    <SettingsPage title="Mode" onBack={onBack}>
      <Section
        label="Mode"
        note="For now modes change how the phone looks. Allowed apps, schedules and Lock In come later."
      >
        <ChoiceList<ModeId>
          label="Mode"
          value={s.mode}
          onChange={(mode) => void runAction('mode.set', { mode })}
          options={[
            { id: 'clean', name: 'Clean', detail: 'Your theme as it is' },
            { id: 'focus', name: 'Focus', detail: 'Everything in grayscale, the accent plain white' },
            { id: 'retro', name: 'Retro', detail: `Old-phone look in ${getPreset(s.retroTheme).name}` },
            { id: 'winddown', name: 'Wind Down', detail: 'A warm layer, and the screen dims to 80% over 10 minutes' },
          ]}
        />
      </Section>
    </SettingsPage>
  );
}

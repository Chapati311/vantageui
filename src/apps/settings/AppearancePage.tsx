import { ChoiceList } from '../../components/ChoiceList';
import { Slider } from '../../components/kit/Slider';
import { runAction } from '../../system/actions';
import { useSettings, type Appearance } from '../../system/settingsStore';
import { sunTimes } from '../../system/sun';
import { useTheme } from '../../system/theme';
import { formatTime } from '../../system/timeFormat';
import { changeSetting } from './setSetting';
import { Section, SettingsPage } from './SettingsPage';

const hour = (h: number) => `${String(h).padStart(2, '0')}:00`;

/** Dark, light or automatic (by the sun in Zurich, or by fixed hours). */
export function AppearancePage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  const theme = useTheme();
  const today = sunTimes(new Date(), 47.3769, 8.5417);

  return (
    <SettingsPage title="Appearance" onBack={onBack}>
      <Section
        label="Mode"
        note={s.mode === 'retro' ? 'Retro mode is on. This applies again when you leave it.' : undefined}
      >
        <ChoiceList<Appearance>
          label="Appearance"
          value={s.appearance}
          onChange={(appearance) => void runAction('theme.setAppearance', { appearance })}
          options={[
            { id: 'dark', name: 'Dark' },
            { id: 'light', name: 'Light' },
            { id: 'auto', name: 'Automatic', detail: 'Light by day, dark at night' },
          ]}
        />
      </Section>

      {s.appearance === 'auto' && (
        <Section
          label="Switch"
          note={
            theme.nextSwitch
              ? `Now ${theme.dark ? 'dark' : 'light'}. Changes at ${formatTime(theme.nextSwitch)}.`
              : undefined
          }
        >
          <ChoiceList
            label="Automatic switching"
            value={s.autoBy}
            onChange={(autoBy) => changeSetting('autoBy', autoBy)}
            options={[
              {
                id: 'sunset',
                name: 'Sunrise and sunset',
                detail: `In Zurich today: light ${formatTime(today.sunrise)} to ${formatTime(today.sunset)}`,
              },
              { id: 'schedule', name: 'Fixed hours' },
            ]}
          />
          {s.autoBy === 'schedule' && (
            <>
              <Slider
                label="Light from"
                value={s.lightFrom}
                min={0}
                max={23}
                step={1}
                format={hour}
                onChange={(value) => changeSetting('lightFrom', value)}
              />
              <Slider
                label="Dark from"
                value={s.darkFrom}
                min={0}
                max={23}
                step={1}
                format={hour}
                onChange={(value) => changeSetting('darkFrom', value)}
              />
            </>
          )}
        </Section>
      )}
    </SettingsPage>
  );
}

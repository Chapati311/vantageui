import { ChoiceList } from '../../components/ChoiceList';
import { Slider } from '../../components/kit/Slider';
import { useSettings, type WidgetStyle } from '../../system/settingsStore';
import { useTheme } from '../../system/theme';
import { changeSetting } from './setSetting';
import { Section, SettingsPage } from './SettingsPage';

/** How widgets look: solid, glass, outline or tinted, how see-through and how round. */
export function WidgetsPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  const theme = useTheme();

  if (theme.retro) {
    return (
      <SettingsPage title="Widgets" onBack={onBack}>
        <Section label="Style" note="Retro themes draw widgets as square boxes with a 2-pixel ink frame.">
          <span />
        </Section>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage title="Widgets" onBack={onBack}>
      <Section label="Style">
        <ChoiceList<WidgetStyle>
          label="Widget style"
          value={s.widgetStyle}
          onChange={(style) => changeSetting('widgetStyle', style)}
          options={[
            { id: 'solid', name: 'Solid' },
            { id: 'glass', name: 'Glass', detail: 'Frosted. Uses a little more battery.' },
            { id: 'outline', name: 'Outline', detail: 'Only a thin line' },
            { id: 'tinted', name: 'Tinted', detail: 'A hint of the accent' },
          ]}
        />
      </Section>
      <Section label="Shape">
        <Slider
          label="Opacity"
          value={s.widgetOpacity}
          min={0.4}
          max={1}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(value) => changeSetting('widgetOpacity', value)}
        />
        <Slider
          label="Corners"
          value={s.cornerRadius}
          min={12}
          max={36}
          step={2}
          onChange={(value) => changeSetting('cornerRadius', value)}
        />
      </Section>
    </SettingsPage>
  );
}

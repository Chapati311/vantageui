import { Row, Section as KitSection, SegmentedControl } from '../../components/kit';
import { runAction } from '../../system/actions';
import { HOME_APPS } from '../../system/appRegistry';
import { canOpenApp } from '../../system/nativeBridge';
import { useSettings } from '../../system/settingsStore';
import { Section, SettingsPage } from './SettingsPage';

/**
 * App styles: for each app, open the Vantage version or the original iPhone
 * app. Only apps the iPhone lets Vantage open are listed (more after unlock).
 */
export function AppStylesPage({ onBack }: { onBack: () => void }) {
  const settings = useSettings();
  const apps = HOME_APPS.filter((app) => app.bundleId && canOpenApp(app.bundleId));
  const set = (styles: Record<string, 'vantage' | 'original'>) => void runAction('settings.set', { key: 'appStyles', value: styles });
  const allOriginal = apps.length > 0 && apps.every((app) => settings.appStyles[app.id] === 'original');

  return (
    <SettingsPage title="App styles" onBack={onBack}>
      <Section label="All apps">
        <SegmentedControl
          label="All apps"
          value={allOriginal ? 'original' : 'vantage'}
          onChange={(value) => set(Object.fromEntries(apps.map((app) => [app.id, value])))}
          options={[
            { id: 'vantage', label: 'Vantage' },
            { id: 'original', label: 'Original' },
          ]}
        />
      </Section>
      <Section label="Each app" note="Original opens Apple's app. Camera, Clock, Calculator and Compass have no link yet: they always open in Vantage until the native bridge.">
        <KitSection>
          {apps.map((app) => {
            const Glyph = app.icon;
            const original = settings.appStyles[app.id] === 'original';
            return (
              <Row
                key={app.id}
                icon={<Glyph />}
                title={app.name}
                value={original ? 'Original' : 'Vantage'}
                onPress={() => set({ ...settings.appStyles, [app.id]: original ? 'vantage' : 'original' })}
              />
            );
          })}
        </KitSection>
      </Section>
    </SettingsPage>
  );
}

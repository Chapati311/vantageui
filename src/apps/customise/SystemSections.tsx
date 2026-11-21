import type { ReactNode } from 'react';
import { Row, Section as KitSection, SegmentedControl, Slider, Toggle } from '../../components/kit';
import { runAction } from '../../system/actions';
import { dockAppIds, homeApps } from '../../system/appRegistry';
import { useSettings, type Settings } from '../../system/settingsStore';
import { Section, SettingsPage } from '../settings/SettingsPage';

/*
 * The smaller Customise sections: each is a page of switches and choices
 * that change one setting through runAction('settings.set').
 */

type Key = Exclude<keyof Settings, 'customPresets' | 'windDownSince' | 'mode'>;

const set = <K extends Key>(key: K, value: Settings[K]) => void runAction('settings.set', { key, value });

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return <SegmentedControl label={label} value={value} options={options} onChange={onChange} />;
}

function Switch({ title, detail, on, onChange }: { title: string; detail?: string; on: boolean; onChange: (on: boolean) => void }) {
  return <Row title={title} detail={detail} trailing={<Toggle label={title} on={on} onChange={onChange} />} />;
}

function Page({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <SettingsPage title={title} onBack={onBack}>
      {children}
    </SettingsPage>
  );
}

export function HomeScreenPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  return (
    <Page title="Home screen" onBack={onBack}>
      <Section label="Page indicator" note="Shown above the dock. A running timer takes its place.">
        <Choice
          label="Page indicator"
          value={s.pageDots}
          onChange={(value) => set('pageDots', value)}
          options={[
            { id: 'dots', label: 'Dots' },
            { id: 'numbers', label: '1 / 3' },
            { id: 'hidden', label: 'Hidden' },
          ]}
        />
      </Section>
      <Section
        label="Apps on the home screen"
        note="Hidden apps are still found by search. Hold the home screen to move, resize, add or remove widgets."
      >
        <KitSection>
          {homeApps().filter((app) => !dockAppIds().includes(app.id)).map((app) => (
            <Switch
              key={app.id}
              title={app.name}
              on={!s.hiddenApps.includes(app.id)}
              onChange={(on) => set('hiddenApps', on ? s.hiddenApps.filter((id) => id !== app.id) : [...s.hiddenApps, app.id])}
            />
          ))}
        </KitSection>
      </Section>
    </Page>
  );
}

export function IconsPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  return (
    <Page title="Icons" onBack={onBack}>
      <Section
        label="App icons"
        note="Original: every app's real icon in the iOS shape. Vantage glyph: every app as a glyph in a circle. Tinted: every icon in your accent color."
      >
        <Choice
          label="App icons"
          value={s.iconLook}
          onChange={(value) => set('iconLook', value)}
          options={[
            { id: 'original', label: 'Original' },
            { id: 'glyph', label: 'Vantage glyph' },
            { id: 'tinted', label: 'Tinted' },
          ]}
        />
      </Section>
      <Section label="Names">
        <KitSection>
          <Switch title="Show names under icons" on={s.iconLabels} onChange={(on) => set('iconLabels', on)} />
        </KitSection>
      </Section>
      {s.iconLook === 'glyph' && (
        <>
          <Section label="Glyph shape">
            <Choice
              label="Icon shape"
              value={s.iconShape}
              onChange={(value) => set('iconShape', value)}
              options={[
                { id: 'circle', label: 'Circle' },
                { id: 'squircle', label: 'Squircle' },
                { id: 'square', label: 'Square' },
              ]}
            />
          </Section>
          <Section label="Glyph style" note="Tinted uses your accent color.">
            <Choice
              label="Icon style"
              value={s.iconStyle}
              onChange={(value) => set('iconStyle', value)}
              options={[
                { id: 'outline', label: 'Outline' },
                { id: 'filled', label: 'Filled' },
                { id: 'tinted', label: 'Tinted' },
              ]}
            />
          </Section>
          <Section
            label="Pack"
            note="Line: thin glyphs. Glyph: white in solid black circles. Pixel: pixel glyphs. Blocks: every app on its own color. Real apps without a Vantage glyph get a clean silhouette of their icon."
          >
            <Choice
              label="Icon pack"
              value={s.iconPack}
              onChange={(value) => set('iconPack', value)}
              options={[
                { id: 'line', label: 'Line' },
                { id: 'glyph', label: 'Glyph' },
                { id: 'pixel', label: 'Pixel' },
                { id: 'colorblock', label: 'Blocks' },
              ]}
            />
          </Section>
        </>
      )}
    </Page>
  );
}

export function FontsPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  return (
    <Page title="Fonts" onBack={onBack}>
      <Section label="Numbers" note="How every number in the OS is drawn: dot matrix, big serif numerals or a segmented mono.">
        <Choice
          label="Numbers"
          value={s.numerals}
          onChange={(value) => set('numerals', value)}
          options={[
            { id: 'dot', label: 'Dots' },
            { id: 'serif', label: 'Serif' },
            { id: 'segment', label: 'Mono' },
          ]}
        />
      </Section>
      <Section label="Interface font" note="Pick a clock style in Lock screen.">
        <Choice
          label="Interface font"
          value={s.uiFont}
          onChange={(value) => set('uiFont', value)}
          options={[
            { id: 'inter', label: 'Inter' },
            { id: 'system', label: 'System' },
            { id: 'serif', label: 'Serif' },
            { id: 'mono', label: 'Mono' },
          ]}
        />
      </Section>
      <Section label="Size and weight">
        <Slider
          label="Text size"
          value={Math.round(s.textScale * 100)}
          min={85}
          max={130}
          step={5}
          format={(value) => `${value}%`}
          onChange={(value) => set('textScale', value / 100)}
        />
        <KitSection>
          <Switch title="Bold text" on={s.boldText} onChange={(on) => set('boldText', on)} />
        </KitSection>
      </Section>
    </Page>
  );
}

export function ControlCenterPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  return (
    <Page title="Control center" onBack={onBack}>
      <Section label="Brightness control" note="Pull down from the top-right to open the control center.">
        <Choice
          label="Brightness control"
          value={s.controlStyle}
          onChange={(value) => set('controlStyle', value)}
          options={[
            { id: 'dial', label: 'Round dial' },
            { id: 'slider', label: 'Slider' },
          ]}
        />
      </Section>
    </Page>
  );
}

export function NotificationsPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  return (
    <Page title="Notifications" onBack={onBack}>
      <Section label="Lock screen" note="Pull down from the top-left to see all notifications.">
        <Choice
          label="Lock screen notifications"
          value={s.lockNotifications}
          onChange={(value) => set('lockNotifications', value)}
          options={[
            { id: 'count', label: 'Show count' },
            { id: 'hidden', label: 'Hide' },
          ]}
        />
      </Section>
    </Page>
  );
}

export function LivePillPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  return (
    <Page title="Live pill" onBack={onBack}>
      <Section label="Show in the pill" note="The pill sits above the dock and on the lock screen while something runs.">
        <KitSection>
          <Switch title="Timers" on={s.pillTimer} onChange={(on) => set('pillTimer', on)} />
          <Switch title="Stopwatch" on={s.pillStopwatch} onChange={(on) => set('pillStopwatch', on)} />
          <Switch title="Voice recording" on={s.pillRecording} onChange={(on) => set('pillRecording', on)} />
        </KitSection>
      </Section>
    </Page>
  );
}

export function BootPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  return (
    <Page title="Boot and unlock" onBack={onBack}>
      <Section label="Start">
        <KitSection>
          <Switch
            title="Boot animation"
            detail="The dotted V when Vantage starts"
            on={s.bootAnimation}
            onChange={(on) => set('bootAnimation', on)}
          />
          <Switch
            title="Wallpaper parallax"
            detail="The lock wallpaper lags behind your swipe"
            on={s.parallax}
            onChange={(on) => set('parallax', on)}
          />
        </KitSection>
      </Section>
      <Section label="Passcode keypad" note="Turn the passcode on in Settings > Passcode.">
        <Choice
          label="Keypad style"
          value={s.keypadStyle}
          onChange={(value) => set('keypadStyle', value)}
          options={[
            { id: 'dots', label: 'Dot digits' },
            { id: 'plain', label: 'Plain' },
          ]}
        />
      </Section>
    </Page>
  );
}

export function MotionPage({ onBack }: { onBack: () => void }) {
  const s = useSettings();
  return (
    <Page title="Motion and feel" onBack={onBack}>
      <Section label="Springs">
        <Slider
          label="Speed"
          value={Math.round(s.animationSpeed * 10)}
          min={6}
          max={16}
          step={1}
          format={(value) => `${value / 10}x`}
          onChange={(value) => set('animationSpeed', value / 10)}
        />
        <Slider
          label="Bounce"
          value={Math.round(s.springBounce * 10)}
          min={0}
          max={10}
          step={1}
          format={(value) => `${value * 10}%`}
          onChange={(value) => set('springBounce', value / 10)}
        />
      </Section>
      <Section label="Comfort">
        <KitSection>
          <Switch
            title="Reduce motion"
            detail="Fades instead of moving and zooming"
            on={s.reduceMotion}
            onChange={(on) => set('reduceMotion', on)}
          />
          <Switch title="High contrast" on={s.highContrast} onChange={(on) => set('highContrast', on)} />
        </KitSection>
      </Section>
    </Page>
  );
}

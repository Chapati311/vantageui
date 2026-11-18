import { useEffect, useState, type ComponentType } from 'react';
import { BoltIcon, LockIcon, TrashIcon } from '../../components/glyphs';
import { AppShell, Button, Row, Section } from '../../components/kit';
import { runAction } from '../../system/actions';
import { CustomiseIcon, SettingsIcon } from '../../system/appIcons';
import { hasBridge } from '../../system/nativeBridge';
import { useHasPasscode } from '../../system/passcode';
import { useSettings } from '../../system/settingsStore';
import { useTheme } from '../../system/theme';
import { AppStylesPage } from './AppStylesPage';
import { PasscodePage } from './PasscodePage';
import { SoundPage } from './SoundPage';
import { AccessibilityPage } from './AccessibilityPage';

type PageId = 'passcode' | 'appstyles' | 'sound' | 'access';

const PAGES: Record<PageId, ComponentType<{ onBack: () => void }>> = {
  passcode: PasscodePage,
  appstyles: AppStylesPage,
  sound: SoundPage,
  access: AccessibilityPage,
};

/** Settings: the system side. Everything about the look lives in Customise. */
export function SettingsApp() {
  const [page, setPage] = useState<PageId | null>(null);
  const settings = useSettings();
  const theme = useTheme();
  const passcode = useHasPasscode();
  const [storage, setStorage] = useState<string>('--');
  const [confirmErase, setConfirmErase] = useState(false);

  useEffect(() => {
    void navigator.storage?.estimate?.().then(({ usage = 0 }) => setStorage(`${(usage / 1e6).toFixed(1)} MB`));
  }, []);

  useEffect(() => {
    if (!confirmErase) return;
    const timer = window.setTimeout(() => setConfirmErase(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmErase]);

  if (page) {
    const Page = PAGES[page];
    return <Page onBack={() => setPage(null)} />;
  }

  const originals = Object.values(settings.appStyles).filter((style) => style === 'original').length;

  return (
    <AppShell title="Settings">
      <Section label="Look">
        <Row icon={<CustomiseIcon />} title="Customise" detail="Themes, wallpapers, widgets, fonts, sounds" value={theme.presetName} onPress={() => void runAction('app.open', { appId: 'customise' })} />
      </Section>
      <Section label="System">
        <Row icon={<LockIcon />} title="Passcode" value={passcode ? 'On' : 'Off'} onPress={() => setPage('passcode')} />
        <Row icon={<SettingsIcon />} title="App styles" detail="Vantage or the original iPhone app" value={originals ? `${originals} original` : 'All Vantage'} onPress={() => setPage('appstyles')} />
        <Row icon={<BoltIcon />} title="Sound" value={settings.soundsEnabled ? `${Math.round(settings.soundVolume * 100)}%` : 'Off'} onPress={() => setPage('sound')} />
        <Row title="Accessibility" value={`${Math.round(settings.textScale * 100)}% text`} onPress={() => setPage('access')} />
        <Row title="Lock In and app blocking" onPress={() => void runAction('app.open', { appId: 'lockin' })} />
      </Section>
      <Section label="About">
        <Row title="Vantage OS" value="1.0" />
        <Row title="Native bridge" value={hasBridge() ? 'Connected' : 'Available after unlock'} />
        <Row title="Stored on this phone" value={storage} />
        <Row title="Connection" value={navigator.onLine ? 'Online' : 'Offline'} />
      </Section>
      <Section label="Start over" note="Erases every setting, note, photo, recording, grade and layout on this phone. Export a setup in Customise first if you want to keep your look.">
        <span />
      </Section>
      <Button
        kind="destructive"
        icon={TrashIcon}
        onPress={async () => {
          if (!confirmErase) return setConfirmErase(true);
          localStorage.clear();
          await new Promise<void>((resolve) => {
            const request = indexedDB.deleteDatabase('vantage');
            request.onsuccess = request.onerror = request.onblocked = () => resolve();
          });
          location.reload();
        }}
      >
        {confirmErase ? 'Tap again to erase everything' : 'Erase all data'}
      </Button>
    </AppShell>
  );
}

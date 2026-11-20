import { useEffect, useState } from 'react';
import { AppIcon } from '../../components/AppIcon';
import { Button, Sheet } from '../../components/kit';
import { getApp } from '../../system/appRegistry';
import { getAppInfo, uninstallApp, type AppInfo } from '../../system/nativeBridge';
import { refreshNativeApps } from '../../system/nativeApps';
import styles from './NativeAppSheet.module.css';

const SOURCES: Record<AppInfo['source'], string> = {
  system: 'Built into iOS',
  appstore: 'App Store',
  trollstore: 'TrollStore',
  jailbreak: 'Jailbreak (Sileo)',
};

interface NativeAppSheetProps {
  /** "ios:<bundle id>" of the app, or null when closed */
  appId: string | null;
  /** Open straight on the "Remove?" question */
  confirmRemove?: boolean;
  onClose: () => void;
  onRemoved?: (name: string) => void;
}

/**
 * App info for a real installed app (long-press > App info), and removing it
 * (long-press > Remove app): always asks first, then SpringBoard uninstalls it.
 */
export function NativeAppSheet({ appId, confirmRemove = false, onClose, onRemoved }: NativeAppSheetProps) {
  const app = appId ? getApp(appId) : undefined;
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [asking, setAsking] = useState(confirmRemove);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setInfo(null);
    setAsking(confirmRemove);
    setError('');
    if (app?.bundleId) void getAppInfo(app.bundleId).then(setInfo);
  }, [app?.bundleId, confirmRemove]);

  // iOS won't remove its core apps (Phone, Settings, Safari, ...)
  const removable = info ? info.source !== 'system' : false;

  const remove = async () => {
    if (!app?.bundleId) return;
    setBusy(true);
    const result = await uninstallApp(app.bundleId);
    setBusy(false);
    if (!result.ok) {
      setError('iOS did not remove the app.');
      return;
    }
    void refreshNativeApps();
    onRemoved?.(app.name);
    onClose();
  };

  return (
    <Sheet open={!!app} onClose={onClose} title={asking ? undefined : 'App info'}>
      {app && (
        <div className={styles.body}>
          <div className={styles.head}>
            <span className={styles.icon}>
              <AppIcon app={app} />
            </span>
            <div>
              <h2 className={styles.name}>{app.name}</h2>
              {info?.version && <p className={styles.sub}>Version {info.version}</p>}
            </div>
          </div>

          {asking ? (
            <>
              <p className={styles.question}>
                Remove {app.name}? The app and its data are deleted from this iPhone.
              </p>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.buttons}>
                <Button onPress={() => (confirmRemove ? onClose() : setAsking(false))}>Cancel</Button>
                <Button kind="destructive" disabled={busy || !removable} onPress={() => void remove()}>
                  {busy ? 'Removing…' : 'Remove'}
                </Button>
              </div>
              {info && !removable && <p className={styles.sub}>iOS doesn't allow removing this app.</p>}
            </>
          ) : (
            <>
              <dl className={styles.facts}>
                {info && (
                  <>
                    <dt>From</dt>
                    <dd>{SOURCES[info.source]}</dd>
                  </>
                )}
                {info?.category && (
                  <>
                    <dt>Category</dt>
                    <dd>{info.category}</dd>
                  </>
                )}
                {info?.minimumOS && (
                  <>
                    <dt>Needs</dt>
                    <dd>iOS {info.minimumOS}</dd>
                  </>
                )}
                {info && info.shortcuts > 0 && (
                  <>
                    <dt>Quick actions</dt>
                    <dd>{info.shortcuts}</dd>
                  </>
                )}
                <dt>ID</dt>
                <dd className={styles.id}>{app.bundleId}</dd>
              </dl>
              {removable && (
                <Button kind="destructive" wide onPress={() => setAsking(true)}>
                  Remove app
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

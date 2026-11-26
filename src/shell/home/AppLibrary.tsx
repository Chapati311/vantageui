import { memo, useMemo, useState } from 'react';
import { AppIcon } from '../../components/AppIcon';
import { Pressable } from '../../components/Pressable';
import { allApps, HOST_VANTAGE_APPS, type AppDefinition } from '../../system/appRegistry';
import { getNativeApp, useNativeApps } from '../../system/nativeApps';
import { shapeOf, type ScreenRect } from '../AppView';
import styles from './AppLibrary.module.css';

interface AppLibraryProps {
  onOpenApp: (appId: string, from: ScreenRect | null) => void;
  /** Tap the small icons: the whole group opens like a folder */
  onOpenGroup: (group: { name: string; apps: string[] }) => void;
}

/** Apple's apps by what they are for (iOS doesn't tell us their category). */
const APPLE_GROUPS: Record<string, string[]> = {
  Social: ['com.apple.MobileSMS', 'com.apple.mobilephone', 'com.apple.facetime', 'com.apple.mobilemail', 'com.apple.MobileAddressBook'],
  Productivity: ['com.apple.mobilecal', 'com.apple.reminders', 'com.apple.mobilenotes', 'com.apple.DocumentsApp', 'com.apple.shortcuts', 'com.apple.freeform', 'com.apple.Translate'],
  Creativity: ['com.apple.camera', 'com.apple.mobileslideshow', 'com.apple.VoiceMemos', 'com.apple.Magnifier', 'com.apple.measure'],
  Entertainment: ['com.apple.Music', 'com.apple.tv', 'com.apple.podcasts', 'com.apple.iBooks', 'com.apple.MobileStore', 'com.apple.AppStore'],
  Utilities: [
    'com.apple.Preferences', 'com.apple.calculator', 'com.apple.compass', 'com.apple.mobiletimer', 'com.apple.weather',
    'com.apple.Maps', 'com.apple.findmy', 'com.apple.Bridge', 'com.apple.Home', 'com.apple.Passbook', 'com.apple.tips',
    'com.apple.stocks', 'com.apple.Health', 'com.apple.Fitness', 'com.apple.mobilesafari',
  ],
};
const GROUP_ORDER = ['Vantage', 'Social', 'Productivity', 'Creativity', 'Entertainment', 'Utilities', 'Jailbreak'];

function groupOf(app: AppDefinition): string {
  if (!app.native) return 'Vantage';
  const real = app.bundleId ? getNativeApp(app.bundleId) : undefined;
  if (real && (real.source === 'jailbreak' || real.source === 'trollstore' || /troll|dopamine/i.test(real.name))) return 'Jailbreak';
  for (const [name, ids] of Object.entries(APPLE_GROUPS)) if (ids.includes(app.bundleId ?? '')) return name;
  return real?.category || 'Other';
}

/**
 * The App Library: the page after the last home page. Every app on the phone
 * in rounded group tiles (3 big icons + the rest small), with search on top.
 */
export const AppLibrary = memo(AppLibraryImpl);

function AppLibraryImpl({ onOpenApp, onOpenGroup }: AppLibraryProps) {
  useNativeApps(); // installs, removals and badges show up live
  const [query, setQuery] = useState('');
  const apps = allApps();

  const groups = useMemo(() => {
    const byName = new Map<string, AppDefinition[]>();
    for (const app of apps) {
      const name = groupOf(app);
      byName.set(name, [...(byName.get(name) ?? []), app]);
    }
    const rank = (name: string) => (GROUP_ORDER.includes(name) ? GROUP_ORDER.indexOf(name) : GROUP_ORDER.length);
    return [...byName.entries()]
      .map(([name, list]) => ({
        name,
        apps: name === 'Vantage' ? HOST_VANTAGE_APPS.map((id) => list.find((app) => app.id === id)).filter((app): app is AppDefinition => !!app) : [...list].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
  }, [apps]);

  const q = query.trim().toLowerCase();
  const found = q ? [...apps].filter((app) => app.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const open = (app: AppDefinition, element: Element) => onOpenApp(app.id, shapeOf(element));

  return (
    <div className={styles.library}>
      <input
        className={styles.search}
        type="search"
        placeholder="App Library"
        aria-label="Search all apps"
        value={query}
        enterKeyHint="search"
        onChange={(event) => setQuery(event.target.value)}
        data-no-gesture
      />
      {q ? (
        <div className={styles.list} data-no-gesture>
          {found.length === 0 && <p className={styles.none}>No apps</p>}
          {found.map((app) => (
            <Pressable key={app.id} className={styles.row} onClick={(event) => open(app, event.currentTarget)}>
              <span className={styles.rowIcon}>
                <AppIcon app={app} />
              </span>
              {app.name}
            </Pressable>
          ))}
        </div>
      ) : (
        <div className={styles.groups}>
          {groups.map((group) => (
            <section key={group.name} className={styles.group} aria-label={group.name}>
              <div className={styles.tile}>
                {group.apps.slice(0, group.apps.length > 4 ? 3 : 4).map((app) => (
                  <Pressable key={app.id} className={styles.big} aria-label={app.name} data-no-gesture onClick={(event) => open(app, event.currentTarget)}>
                    <AppIcon app={app} />
                  </Pressable>
                ))}
                {group.apps.length > 4 && (
                  <Pressable
                    className={styles.small}
                    aria-label={`All ${group.name} apps`}
                    data-no-gesture
                    onClick={() => onOpenGroup({ name: group.name, apps: group.apps.map((app) => app.id) })}
                  >
                    {group.apps.slice(3, 7).map((app) => (
                      <span key={app.id} className={styles.mini}>
                        <AppIcon app={app} />
                      </span>
                    ))}
                  </Pressable>
                )}
              </div>
              <span className={styles.groupName}>{group.name}</span>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

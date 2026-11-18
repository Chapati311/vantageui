import { useSetting } from '../system/settingsStore';
import { getApp, type AppDefinition } from '../system/appRegistry';
import { AppIcon } from './AppIcon';
import styles from './AppTile.module.css';

/**
 * An app on the home screen: its round icon, with a small name underneath
 * (Customise > Icons > Labels can hide the names).
 */
export function AppTile({ app }: { app: AppDefinition }) {
  const [labels] = useSetting('iconLabels');
  if (!labels) return <AppIcon app={app} />;
  return (
    <div className={styles.tile}>
      <div className={styles.circle}>
        <AppIcon app={app} />
      </div>
      <span className={styles.label}>{app.name}</span>
    </div>
  );
}

/** A folder on the home screen: up to four tiny icons in one circle, and its name. */
export function FolderTile({ name, apps }: { name: string; apps: string[] }) {
  const [labels] = useSetting('iconLabels');
  const circle = (
    <div className={styles.folder} role="img" aria-label={`${name} folder, ${apps.length} apps`}>
      {apps.slice(0, 4).map((id) => {
        const app = getApp(id);
        if (!app) return null;
        const Glyph = app.icon;
        return (
          <span key={id} className={styles.mini}>
            <Glyph />
          </span>
        );
      })}
    </div>
  );
  if (!labels) return circle;
  return (
    <div className={styles.tile}>
      <div className={styles.circle}>{circle}</div>
      <span className={styles.label}>{name}</span>
    </div>
  );
}

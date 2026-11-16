import type { AppDefinition } from '../system/appRegistry';
import styles from './PlaceholderApp.module.css';

/** Shown for apps that are in the registry but not built yet. */
export function PlaceholderApp({ app }: { app: AppDefinition }) {
  const Glyph = app.icon;

  return (
    <div className={styles.wrap}>
      <div className={styles.glyph}>
        <Glyph />
      </div>
      <h1 className={styles.name}>{app.name}</h1>
      <p className="label">Coming soon</p>
    </div>
  );
}

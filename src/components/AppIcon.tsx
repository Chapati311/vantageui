import type { AppDefinition } from '../system/appRegistry';
import styles from './AppIcon.module.css';

/** A white glyph on a dark circle. No label. It fills its grid slot. */
export function AppIcon({ app }: { app: AppDefinition }) {
  const Glyph = app.icon;

  return (
    <div className={styles.icon} role="img" aria-label={app.name} data-app-icon={app.id}>
      <Glyph />
    </div>
  );
}

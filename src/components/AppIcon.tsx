import { LockIcon } from './glyphs';
import { useBlockState } from '../apps/lockin/blocking';
import type { AppDefinition } from '../system/appRegistry';
import styles from './AppIcon.module.css';

/**
 * A white glyph on a dark circle. No label. It fills its grid slot.
 * Apps locked by Lock In turn grey with a small lock.
 */
export function AppIcon({ app }: { app: AppDefinition }) {
  const Glyph = app.icon;
  const { locked } = useBlockState(app.id);

  return (
    <div className={`${styles.icon} ${locked ? styles.locked : ''}`} role="img" aria-label={locked ? `${app.name}, locked` : app.name} data-app-icon={app.id}>
      <Glyph />
      {locked && (
        <span className={styles.lock}>
          <LockIcon />
        </span>
      )}
    </div>
  );
}

import type { AppDefinition } from '../system/appRegistry';
import styles from './AppIcon.module.css';

interface AppIconProps {
  app: AppDefinition;
  onOpen?: (app: AppDefinition) => void;
}

/** A round-cornered app button. Used in the dock, later in the app drawer too. */
export function AppIcon({ app, onOpen }: AppIconProps) {
  const Icon = app.icon;

  return (
    <button type="button" className={styles.icon} aria-label={app.name} onClick={() => onOpen?.(app)}>
      <Icon />
    </button>
  );
}

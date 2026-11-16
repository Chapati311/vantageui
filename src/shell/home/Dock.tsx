import { AppIcon } from '../../components/AppIcon';
import { DOCK_APP_IDS, getApp } from '../../system/appRegistry';
import styles from './Dock.module.css';

interface DockProps {
  onOpenApp: (appId: string, from: DOMRect) => void;
}

/**
 * The 4 favourite apps at the bottom of the home screen. It uses the same
 * 4 columns and gaps as the grid above it, and it does NOT move when the
 * pages slide.
 */
export function Dock({ onOpenApp }: DockProps) {
  return (
    <nav className={styles.dock} aria-label="Dock">
      {DOCK_APP_IDS.map((id) => {
        const app = getApp(id);
        if (!app) return null;
        return (
          <button
            key={id}
            type="button"
            className={styles.slot}
            aria-label={app.name}
            // The dock handles its own taps (the page-swipe code ignores it)
            data-no-gesture
            onClick={(event) => onOpenApp(id, event.currentTarget.getBoundingClientRect())}
          >
            <AppIcon app={app} />
          </button>
        );
      })}
    </nav>
  );
}

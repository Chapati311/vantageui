import { AppIcon } from '../components/AppIcon';
import { DOCK_APP_IDS, getApp } from '../system/appRegistry';
import styles from './Dock.module.css';

/** The row of 4 favourite apps at the bottom of the home screen. */
export function Dock() {
  return (
    <nav className={styles.dock} aria-label="Dock">
      {DOCK_APP_IDS.map((id) => {
        const app = getApp(id);
        return app ? <AppIcon key={id} app={app} /> : null;
      })}
    </nav>
  );
}

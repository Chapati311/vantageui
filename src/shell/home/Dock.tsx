import { AppIcon } from '../../components/AppIcon';
import { shapeOf, type ScreenRect } from '../AppView';
import { Pressable } from '../../components/Pressable';
import { dockAppIds, getApp } from '../../system/appRegistry';
import { useNativeApps } from '../../system/nativeApps';
import styles from './Dock.module.css';

interface DockProps {
  onOpenApp: (appId: string, from: ScreenRect) => void;
}

/**
 * The 4 favourite apps at the bottom of the home screen. It uses the same
 * 4 columns and gaps as the grid above it, and it does NOT move when the
 * pages slide.
 */
export function Dock({ onOpenApp }: DockProps) {
  useNativeApps(); // host mode: the real Phone/Messages/Camera arrive from the phone
  return (
    <nav className={styles.dock} aria-label="Dock">
      {dockAppIds().map((id) => {
        const app = getApp(id);
        if (!app) return null;
        return (
          <Pressable
            key={id}
            className={styles.slot}
            aria-label={app.name}
            // The dock handles its own taps (the page-swipe code ignores it)
            data-no-gesture
            onClick={(event) => onOpenApp(id, shapeOf(event.currentTarget.querySelector('[data-app-icon]') ?? event.currentTarget))}
          >
            <AppIcon app={app} />
          </Pressable>
        );
      })}
    </nav>
  );
}

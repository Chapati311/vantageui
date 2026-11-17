import { Pressable } from '../../components/Pressable';
import { HOME_APPS } from '../../system/appRegistry';
import type { RetroStyle } from '../../theme/presets';
import { SoftKeys } from './SoftKeys';
import styles from './Retro.module.css';

interface RetroMenuProps {
  style: RetroStyle;
  onOpenApp: (appId: string) => void;
  onBack: () => void;
}

/**
 * The old-phone menu: every app in a 3x3 grid of pixel icons (phone style),
 * or as a numbered list (terminal style).
 */
export function RetroMenu({ style, onOpenApp, onBack }: RetroMenuProps) {
  const terminal = style === 'terminal';
  return (
    <div className={styles.menuScreen}>
      <p className={styles.menuTitle}>{terminal ? '> apps' : 'Menu'}</p>
      {terminal ? (
        <div className={styles.menuList}>
          {HOME_APPS.map((app, index) => (
            <Pressable key={app.id} className={styles.menuLine} onClick={() => onOpenApp(app.id)}>
              {index + 1} {app.name.toUpperCase()}
            </Pressable>
          ))}
        </div>
      ) : (
        <div className={styles.menuGrid}>
          {HOME_APPS.slice(0, 9).map((app) => {
            const Glyph = app.icon;
            return (
              <Pressable key={app.id} className={styles.menuItem} onClick={() => onOpenApp(app.id)}>
                <span className={styles.menuIcon}>
                  <Glyph />
                </span>
                <span className={styles.menuName}>{app.name}</span>
              </Pressable>
            );
          })}
        </div>
      )}
      <SoftKeys terminal={terminal} right={{ label: 'Back', onPress: onBack }} />
    </div>
  );
}

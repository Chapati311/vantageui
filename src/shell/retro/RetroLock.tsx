import { Pressable } from '../../components/Pressable';
import { useTheme } from '../../system/theme';
import { Wallpaper } from '../wallpaper/Wallpaper';
import { RetroWindow } from './RetroDesktop';
import { RetroIdle } from './RetroIdle';
import { SoftKeys } from './SoftKeys';
import styles from './Retro.module.css';

interface RetroLockProps {
  locked: boolean;
  onUnlock: () => void;
}

/**
 * The lock screen in retro themes. Old phones unlocked with a key, so this
 * one unlocks with the "Unlock" soft key (or "OK" on Classic Desktop), and
 * the screen jumps away in steps instead of sliding smoothly.
 */
export function RetroLock({ locked, onUnlock }: RetroLockProps) {
  const theme = useTheme();
  const style = theme.retro ?? 'phone';

  return (
    <div className={`${styles.lock} ${locked ? '' : styles.lockGone}`} aria-hidden={!locked}>
      {style === 'desktop' ? (
        <div className={styles.desktop}>
          <div className={styles.logon}>
            <RetroWindow title="Welcome to Vantage">
              <p className={styles.windowText}>Press OK to log on.</p>
              <Pressable className={styles.bevelButton} onClick={onUnlock}>
                OK
              </Pressable>
            </RetroWindow>
          </div>
        </div>
      ) : (
        <>
          <Wallpaper place="lock" paused={!locked} />
          <RetroIdle style={style} locked />
          <SoftKeys terminal={style === 'terminal'} left={{ label: 'Unlock', onPress: onUnlock }} />
        </>
      )}
    </div>
  );
}

import { DotNumber } from '../../components/DotNumber';
import { ScaledPreview } from '../../components/ScaledPreview';
import { useSettings } from '../../system/settingsStore';
import { useTheme } from '../../system/theme';
import { useClock } from '../../system/useClock';
import { Wallpaper } from '../../shell/wallpaper/Wallpaper';
import styles from './LivePreview.module.css';

const two = (value: number) => String(value).padStart(2, '0');

/**
 * A small copy of the home screen at the top of Customise. It is drawn from
 * the same theme variables as the real screens, so every change shows here
 * the moment you make it.
 */
export function LivePreview() {
  const now = useClock();
  const settings = useSettings();
  const theme = useTheme();

  return (
    <div className={styles.frame}>
      <ScaledPreview>
        <div className={styles.screen}>
          {theme.retro ? (
            <div className={styles.retro}>
              <DotNumber value={`${two(now.getHours())}:${two(now.getMinutes())}`} size={64} clock />
              <span className="label">{theme.presetName}</span>
            </div>
          ) : (
            <>
              <Wallpaper place="preview" config={settings.wallpaper} />
              <div className={styles.grid}>
                <div className={`${styles.widget} ${styles.clock}`}>
                  <DotNumber value={two(now.getHours())} size={40} />
                  <DotNumber value={two(now.getMinutes())} size={40} muted />
                </div>
                <div className={styles.accent} />
                <div className={`${styles.widget} ${styles.small}`}>
                  <span className="label">{theme.presetName}</span>
                </div>
                <div className={`${styles.widget} ${styles.pill}`}>Ask anything</div>
              </div>
              <div className={styles.dock}>
                {[0, 1, 2, 3].map((index) => (
                  <span key={index} className={styles.icon} />
                ))}
              </div>
            </>
          )}
        </div>
      </ScaledPreview>
    </div>
  );
}

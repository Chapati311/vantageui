import type { CSSProperties } from 'react';
import type { ThemePreset } from '../../theme/presets';
import styles from './ThemeCard.module.css';

/**
 * A tiny phone in a theme's colors: background, a widget, a dot clock, the
 * accent circle and the "Ask anything" pill. The colors are this preset's
 * own (not the current theme's), so they come from the preset data.
 */
export function ThemeCard({ preset }: { preset: ThemePreset }) {
  const retro = preset.group === 'retro';
  return (
    <div
      className={`${styles.phone} ${retro ? styles.retro : ''} ${preset.retro?.style === 'desktop' ? styles.desktop : ''}`}
      style={
        {
          '--p-bg': preset.bg,
          '--p-surface': preset.surface,
          '--p-raised': preset.raised,
          '--p-text': preset.text,
          '--p-text2': preset.text2,
          '--p-accent': preset.accent,
        } as CSSProperties
      }
    >
      {preset.retro?.style === 'desktop' ? (
        <>
          <span className={styles.window}>
            <span className={styles.titleBar} />
          </span>
          <span className={styles.taskbar} />
        </>
      ) : (
        <>
          <span className={styles.clock}>
            {/* "12:30" as a few dots: hours in text color, colon in accent, minutes in secondary */}
            <span className={styles.hours} />
            <span className={styles.colon} />
            <span className={styles.minutes} />
          </span>
          <span className={styles.row}>
            <span className={styles.widget} />
            <span className={styles.accent} />
          </span>
          <span className={styles.pill} />
        </>
      )}
    </div>
  );
}

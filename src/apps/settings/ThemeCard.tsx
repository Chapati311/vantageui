import type { CSSProperties } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { ScaledPreview } from '../../components/ScaledPreview';
import { useClock } from '../../system/useClock';
import type { ThemePreset } from '../../theme/presets';
import styles from './ThemeCard.module.css';

const two = (value: number) => String(value).padStart(2, '0');

/** "#2DD4BF" -> "45 212 191" (for rgb(var(--accent-rgb) / 0.3)) */
const triplet = (hex: string) => {
  const value = parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
};

/**
 * A mini phone in a theme's own colors: the real dot clock, the accent
 * circle, a widget and the "Ask anything" pill, drawn at phone size and
 * shrunk to fit. The theme's colors are set as local CSS variables, so the
 * real components inside paint themselves in that theme.
 */
export function ThemeCard({ preset }: { preset: ThemePreset }) {
  const now = useClock();
  const retro = preset.group === 'retro';
  const desktop = preset.retro?.style === 'desktop';
  const light = preset.group === 'light';
  const vars = {
    '--color-bg': desktop ? '#008080' : preset.bg,
    '--app-bg': preset.bg,
    '--surface-widget': retro ? preset.surface : `linear-gradient(180deg, ${preset.raised}, ${preset.surface})`,
    '--border-widget': retro ? `2px solid ${preset.text}` : `1px solid ${light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'}`,
    '--highlight-top': 'none',
    '--text-primary': preset.text,
    '--text-secondary': preset.text2,
    '--text-tertiary': preset.text2,
    '--color-accent': preset.accent,
    '--accent-rgb': triplet(preset.accent),
    '--color-hairline': light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)',
    '--ghost': retro ? '0.1' : '0.07',
    '--radius-widget': retro ? '0px' : '28px',
    '--radius-pill': retro ? '0px' : '999px',
    '--radius-circle': retro ? '0px' : '50%',
    '--font-body': retro ? "'VT323', monospace" : "'Inter Variable', system-ui, sans-serif",
  } as CSSProperties;

  return (
    <ScaledPreview className={styles.frame}>
      <div className={styles.screen} style={vars}>
        <div className={styles.grid}>
          <div className={`${styles.widget} ${styles.clock}`}>
            <DotNumber value={two(now.getHours())} size={40} pixels={retro} instant />
            <DotNumber value={two(now.getMinutes())} size={40} muted pixels={retro} instant />
          </div>
          <span className={styles.accent} />
          <div className={`${styles.widget} ${styles.round}`}>
            <span className={styles.small}>{preset.name}</span>
          </div>
          <div className={`${styles.widget} ${styles.pill}`}>
            <span className={styles.vee}>V</span>
            Ask anything
          </div>
        </div>
        <div className={styles.dock}>
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className={styles.icon} />
          ))}
        </div>
      </div>
    </ScaledPreview>
  );
}

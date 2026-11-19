import type { CSSProperties } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { ScaledPreview } from '../../components/ScaledPreview';
import { useClock } from '../../system/useClock';
import type { ThemePreset } from '../../theme/presets';
import { getPack, type ThemePack } from '../../theme/packs';
import { imageUrl } from '../../theme/wallpapers';
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
/** How a signature pack's widgets look in the mini phone (matches theme.ts). */
function packWidget(pack: ThemePack, light: boolean): Record<string, string> {
  switch (pack.widgetStyle) {
    case 'glossy':
      return {
        '--surface-widget': 'radial-gradient(120% 80% at 50% 0%, rgb(255 255 255 / 0.1), transparent 60%), #0e0e0e',
        '--border-widget': '1px solid rgb(255 255 255 / 0.08)',
        '--widget-text': '#fff',
        '--widget-text-2': '#999',
      };
    case 'pill':
      return {
        '--surface-widget': '#0a0a0a',
        '--border-widget': '0 solid transparent',
        '--widget-text': '#fff',
        '--widget-text-2': '#a0a0a0',
      };
    case 'colorblock':
      return {
        '--surface-widget': '#F2694A',
        '--border-widget': '0 solid transparent',
        '--widget-text': '#141414',
        '--widget-text-2': '#463e37',
      };
    case 'paper':
      return { '--surface-widget': '#FDF8EA', '--border-widget': '1px solid rgb(0 0 0 / 0.06)' };
    case 'glass':
      return {
        '--surface-widget': light ? 'rgb(255 255 255 / 0.6)' : 'rgb(20 20 20 / 0.5)',
        '--border-widget': '1px solid rgb(255 255 255 / 0.4)',
      };
    case 'line':
      return { '--border-widget': '1px solid rgb(0 0 0 / 0.08)' };
    default:
      return {};
  }
}

export function ThemeCard({ preset }: { preset: ThemePreset }) {
  const pack = preset.signature ? getPack(preset.id) : undefined;
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
    '--widget-text': preset.text,
    '--widget-text-2': preset.text2,
    ...(pack ? { '--radius-widget': `${pack.cornerRadius}px`, ...packWidget(pack, light) } : {}),
    ...(preset.wallpaper.kind === 'image' ? { backgroundImage: `url(${imageUrl(preset.wallpaper.id)})`, backgroundSize: 'cover' } : {}),
  } as CSSProperties;
  // Packs that draw numbers as type show them that way here too
  const numerals = pack?.numerals ?? 'dot';

  return (
    <ScaledPreview className={styles.frame}>
      <div className={styles.screen} style={vars}>
        <div className={styles.grid}>
          <div className={`${styles.widget} ${styles.clock}`}>
            {numerals === 'dot' ? (
              <>
                <DotNumber value={two(now.getHours())} size={40} pixels={retro} instant />
                <DotNumber value={two(now.getMinutes())} size={40} muted pixels={retro} instant />
              </>
            ) : (
              <span className={numerals === 'serif' ? styles.serifTime : styles.segmentTime}>
                <span>{two(now.getHours())}</span>
                <span className={styles.minutes}>{two(now.getMinutes())}</span>
              </span>
            )}
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
